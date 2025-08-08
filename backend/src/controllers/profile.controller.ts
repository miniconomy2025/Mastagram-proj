import type { Request, Response } from 'express';
import type { UpdateProfileRequest, UpdateProfileResponse } from '../types/profile.types.ts';
import { uploadToS3, deleteOldAvatarFromS3 } from '../utils/s3.utils.ts';
import { validateProfileUpdate, ProfileValidationError } from '../utils/validators/profile.validators.ts';
import type { User } from '../models/user.models.ts';
import { findUserByUsername, updateUser } from '../queries/user.queries.ts';
import redisClient from '../redis.ts';
import { invalidateCache } from '../federation/lookup.ts';
import { federatedHostname } from '../federation/federation.ts';

const PROFILE_CACHE_TTL = 1800; 

export class ProfileController {
  // ---------------------- Helper Methods ----------------------
  private static getAuthenticatedUsername(req: Request, res: Response) {
    if (!req.user?.username) {
      res.status(401).json({
        success: false,
        error: {
          message: 'User not authenticated',
          code: 'UNAUTHORIZED',
          statusCode: 401
        }
      });
      return null;
    }
    return req.user.username;
  }

  private static async processAvatar(file: Express.Multer.File | undefined, currentAvatarUrl: string | undefined, userId: string)
    : Promise<{ success: true; url: string } | { success: false; error: UpdateProfileResponse["error"] }> {
    if (!file) return { success: true, url: currentAvatarUrl ?? '' };

    const uploadResult = await uploadToS3(file, userId, 'avatar');
    if (!uploadResult.success) {
      return { success: false, error: uploadResult.error! };
    }

    // Delete old avatar if present but ignore failure (not critical for update)
    if (currentAvatarUrl) {
      await deleteOldAvatarFromS3(currentAvatarUrl).catch(() => undefined);
    }

    return { success: true, url: uploadResult.data!.url };
  }

  private static buildUpdateObject(updateData: UpdateProfileRequest, avatarUrl: string, currentUser: User): Partial<User> {
    const updateObject: Partial<User> = {};
    if (updateData.displayName !== undefined) updateObject.name = updateData.displayName;
    if (updateData.bio !== undefined) updateObject.bio = updateData.bio;
    if (avatarUrl && avatarUrl !== currentUser.avatarUrl) updateObject.avatarUrl = avatarUrl;
    return updateObject;
  }

  private static handleProfileValidationError(error: ProfileValidationError, res: Response<UpdateProfileResponse>) {
    return res.status(error.statusCode).json({
      success: false,
      error: {
        message: error.message,
        code: error.code,
        statusCode: error.statusCode,
        details: error.validationErrors.map(e => e.message)
      }
    });
  }

  private static handleUnexpectedError(res: Response<UpdateProfileResponse>) {
    return (error: unknown) => {
      console.error('Error updating profile:', error);
      if (error instanceof ProfileValidationError) {
        return ProfileController.handleProfileValidationError(error, res);
      }
      return res.status(500).json({
        success: false,
        error: {
          message: 'Internal server error',
          code: 'INTERNAL_ERROR',
          statusCode: 500
        }
      });
    };
  }

  // Caching GET /profile endpoint
  static readonly getProfile = () => {
    return async (req: Request & { user?: User }, res: Response) => {
      const username = ProfileController.getAuthenticatedUsername(req, res);
      if (!username) return;

      try {
          // 1. Try to get data from Redis cache
          const cachedProfile = await redisClient.get(`profile:${username}`);
          if (cachedProfile) {
            return res.status(200).json(JSON.parse(cachedProfile));
          }

          // 2. If not in cache, fetch from MongoDB
          const user = await findUserByUsername(username);

          if (!user) {
              return res.status(404).json({ error: 'User not found' });
          }

          // 3. Cache the result for next time
          await redisClient.set(`profile:${username}`, JSON.stringify(user), 'EX', PROFILE_CACHE_TTL);

          // 4. Return consistent response format
          return res.status(200).json({
            username: user.username,
            email: user.email,
            displayName: user.name,
            avatarUrl: user.avatarUrl,
            bio: user.bio
          });
      } catch (error) {
          console.error('Error fetching user profile:', error);
          return res.status(500).json({ error: 'Failed to fetch user profile' });
      }
  };
}


  // Invalidate cache on update
  static readonly updateProfile = () => {
    return async (req: Request, res: Response<UpdateProfileResponse>) => {
      try {
        const username = ProfileController.getAuthenticatedUsername(req, res);
        if (!username) return;
        
        const updateData: UpdateProfileRequest = req.body;
        const file = req.file;

        // Validate input data
        validateProfileUpdate(updateData);

        // Handle avatar upload if file is provided
        const avatarProcess = await ProfileController.processAvatar(file, req.user!.avatarUrl, username);
        if (!avatarProcess.success) {
          return res.status(avatarProcess.error?.statusCode || 500).json({ success: false, error: avatarProcess.error });
        }
        const avatarUrl = avatarProcess.url;

        // Prepare update object (only include defined fields)
        const updateObject = ProfileController.buildUpdateObject(updateData, avatarUrl, req.user!);

        // If nothing to update, respond with current profile
        if (Object.keys(updateObject).length === 0) {
          const currentUser = req.user!;
          return res.status(200).json({
            success: true,
            data: {
              username: currentUser.username,
              email: currentUser.email,
              displayName: currentUser.name,
              avatarUrl: currentUser.avatarUrl,
              bio: currentUser.bio
            }
          });
        }

        // Update user in database
        const updatedUser = await updateUser(username, updateObject);
        
        if (!updatedUser) {
          return res.status(404).json({
            success: false,
            error: {
              message: 'User not found',
              code: 'USER_NOT_FOUND',
              statusCode: 404
            }
          });
        }
    
        await invalidateCache(`@${updatedUser.username}@${federatedHostname}`)

        // Return updated profile
        return res.status(200).json({
          success: true,
          data: {
            username: updatedUser.username,
            email: updatedUser.email,
            displayName: updatedUser.name,
            avatarUrl: updatedUser.avatarUrl,
            bio: updatedUser.bio,
          }
        });

      } catch (error) {
        ProfileController.handleUnexpectedError(res)(error);
      }
    };
  };
}
