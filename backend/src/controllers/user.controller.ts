import { Request, Response } from 'express';
import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { s3Client, s3Settings } from '../configs/s3.config';
import { getDb } from '../configs/mongodb.config';
import { v4 as uuidv4 } from 'uuid';
import { UserProfileResponse } from '../types/auth.types';

export class UserController {


  /**
   * Get user profile information
   */
  static async getProfile(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      if (!user?._id) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'User not authenticated'
        });
      }

      const db = getDb();
      const userProfile = await db.collection('users').findOne(
        { _id: user._id },
        { projection: { email: 1, name: 1, username: 1, avatar_url: 1, bio: 1 } }
      );

      if (!userProfile) {
        return res.status(404).json({
          error: 'User not found',
          message: 'User profile not found'
        });
      }

      // Transform the response to use display_name instead of name
      const responseData: UserProfileResponse = {
        _id: userProfile._id?.toString(),
        email: userProfile.email,
        display_name: userProfile.name,
        username: userProfile.username,
        avatar_url: userProfile.avatar_url,
        bio: userProfile.bio
      };

      res.json({
        success: true,
        data: responseData,
        message: 'Profile retrieved successfully'
      });

    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to retrieve profile',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Please try again later'
      });
    }
  }

  /**
   * Update user profile (bio, username, and/or profile picture)
   */
  static async updateProfile(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      if (!user?._id) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'User not authenticated'
        });
      }

      const { username, bio } = req.body;
      const updateData: any = {};
      const db = getDb();

      // Handle text field updates
      if (username !== undefined) {
        if (username === null) {
          updateData.username = null; // Allow clearing username
        } else {
          // Check if username is already taken
          const existingUser = await db.collection('users').findOne({ 
            username, 
            _id: { $ne: user._id } 
          });
          
          if (existingUser) {
            return res.status(409).json({
              error: 'Username taken',
              message: 'This username is already in use'
            });
          }
          
          updateData.username = username;
        }
      }

      if (bio !== undefined) {
        updateData.bio = bio === null ? null : bio; // Allow clearing bio
      }

      // Handle file upload if present
      if (req.file) {
        const file = req.file;
        const userId = user._id.toString();
        
        // Validate file type
        if (!s3Settings.allowedMimeTypes.includes(file.mimetype)) {
          return res.status(400).json({
            error: 'Invalid file type',
            message: `Only ${s3Settings.allowedMimeTypes.join(', ')} files are allowed`
          });
        }

        // Generate unique filename
        const fileExtension = file.originalname.split('.').pop();
        const fileName = `profile-images/${userId}/${uuidv4()}.${fileExtension}`;

        // Upload to S3
        const uploadCommand = new PutObjectCommand({
          Bucket: s3Settings.bucketName,
          Key: fileName,
          Body: file.buffer,
          ContentType: file.mimetype,
          Metadata: {
            userId: userId,
            uploadedAt: new Date().toISOString()
          }
        });

        await s3Client.send(uploadCommand);

        // Construct the public URL
        const imageUrl = `${s3Settings.bucketUrl}/${fileName}`;

        // Get current user to check for existing avatar
        const currentUser = await db.collection('users').findOne({ _id: user._id });
        
        // Delete old avatar from S3 if it exists and is from our bucket
        if (currentUser?.avatar_url?.includes(s3Settings.bucketUrl)) {
          try {
            const oldKey = currentUser.avatar_url.replace(`${s3Settings.bucketUrl}/`, '');
            const deleteCommand = new DeleteObjectCommand({
              Bucket: s3Settings.bucketName,
              Key: oldKey
            });
            await s3Client.send(deleteCommand);
          } catch (deleteError) {
            console.warn('Failed to delete old avatar:', deleteError);
            // Continue with update even if old image deletion fails
          }
        }

        updateData.avatar_url = imageUrl;
      }

      // Only proceed with database update if there's something to update
      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'No valid fields provided for update'
        });
      }

      const updateResult = await db.collection('users').updateOne(
        { _id: user._id },
        { $set: updateData }
      );

      if (updateResult.matchedCount === 0) {
        return res.status(404).json({
          error: 'User not found',
          message: 'User profile not found'
        });
      }

      // Fetch the updated user profile for response
      const updatedUser = await db.collection('users').findOne(
        { _id: user._id },
        { projection: { email: 1, name: 1, username: 1, avatar_url: 1, bio: 1 } }
      );

      if (!updatedUser) {
        return res.status(404).json({
          error: 'User not found',
          message: 'User profile not found'
        });
      }

      const responseData: UserProfileResponse = {
        _id: updatedUser._id?.toString(),
        email: updatedUser.email,
        display_name: updatedUser.name,
        username: updatedUser.username,
        avatar_url: updatedUser.avatar_url,
        bio: updatedUser.bio
      };

      res.json({
        success: true,
        data: responseData,
        message: 'Profile updated successfully'
      });

    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to update profile',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Please try again later'
      });
    }
  }
}