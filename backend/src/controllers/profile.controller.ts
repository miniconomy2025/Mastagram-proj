import { Request, Response } from 'express';
import { ObjectId, Collection } from 'mongodb';
import { getDb } from '../configs/mongodb.config';
import { User } from '../types/auth.types';
import { UpdateProfileRequest, UpdateProfileResponse } from '../types/profile.types';
import { uploadToS3, deleteOldAvatarFromS3 } from '../utils/s3.utils';
import { validateProfileUpdate, ProfileValidationError } from '../utils/validators/profile.validators';
import redis from "../configs/redis"; 

const PROFILE_CACHE_TTL = 1800; 

export class ProfileController {
  // ---------------------- Helper Methods ----------------------
  private static getAuthenticatedUserId(req: Request & { user?: User }, res: Response) {
    if (!req.user?._id) {
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
    return req.user._id.toString();
  }

  private static async isUsernameTaken(usersCollection: Collection<User>, username: string, userId: string): Promise<boolean> {
    const existingUser = await usersCollection.findOne({
      username,
      _id: { $ne: new ObjectId(userId) }
    });
    return !!existingUser;
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
    if (updateData.username !== undefined) updateObject.username = updateData.username;
    if (updateData.displayName !== undefined) updateObject.displayName = updateData.displayName;
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
      const userId = ProfileController.getAuthenticatedUserId(req, res);
      if (!userId) return;

      try {
          // 1. Try to get data from Redis cache
          const cachedProfile = await redis.get(`profile:${userId}`);
          if (cachedProfile) {
              return res.status(200).json(JSON.parse(cachedProfile));
          }

          // 2. If not in cache, fetch from MongoDB
          const usersCollection = getDb().collection('users');
          const user = await usersCollection.findOne({ _id: new ObjectId(userId) });

          if (!user) {
              return res.status(404).json({ message: 'User not found' });
          }

          // 3. Cache the result for next time
          await redis.set(`profile:${userId}`, JSON.stringify(user), { EX: PROFILE_CACHE_TTL });

          return res.status(200).json(user);
      } catch (error) {
          console.error('Error fetching user profile:', error);
          return res.status(500).json({ message: 'Failed to fetch user profile' });
      }
  };
}


  // Invalidate cache on update
  static readonly updateProfile = () => {
    return async (req: Request & { user?: User }, res: Response<UpdateProfileResponse>) => {
      try {
        const userId = ProfileController.getAuthenticatedUserId(req, res);
        if (!userId) return;
        const updateData: UpdateProfileRequest = req.body;
        const file = req.file;

        // Validate input data
        validateProfileUpdate(updateData);

        const db = getDb();
        const usersCollection = db.collection('users');

        // Check if username is already taken (if username is being updated)
        if (updateData.username && await ProfileController.isUsernameTaken(usersCollection, updateData.username, userId)) {
          return res.status(409).json({
            success: false,
            error: {
              message: 'Username is already taken',
              code: 'USERNAME_TAKEN',
              statusCode: 409,
              details: ['username']
            }
          });
        }

        // Handle avatar upload if file is provided
        const avatarProcess = await ProfileController.processAvatar(file, req.user!.avatarUrl, userId);
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
              displayName: currentUser.displayName,
              avatarUrl: currentUser.avatarUrl,
              bio: currentUser.bio
            }
          });
        }

        // Update user in database
        const updatedUser = await usersCollection.findOneAndUpdate(
          { _id: new ObjectId(userId) },
          { $set: updateObject },
          { returnDocument: 'after' }
        );
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
    
    //  Invalidate the profile cache after a successful update
    await redis.del(`profile:${userId}`);

        // Return updated profile
        return res.status(200).json({
          success: true,
          data: {
            username: updatedUser.username,
            email: updatedUser.email,
            displayName: updatedUser.displayName,
            avatarUrl: updatedUser.avatarUrl,
            bio: updatedUser.bio
          }
        });

      } catch (error) {
        ProfileController.handleUnexpectedError(res)(error);
      }
    };
  };
}
