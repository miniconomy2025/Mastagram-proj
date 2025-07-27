import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { UserController } from '../controllers/user.controller';
import { ensureAuthenticated } from '../configs/passport.config';
import { upload } from '../configs/multer.config';

const userRouter = Router();

/**
 * @openapi
 * /user/profile:
 *   get:
 *     tags:
 *       - User Profile
 *     summary: Get current user profile
 *     description: Retrieve the authenticated user's profile information including email, username, bio, and profile picture
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: "507f1f77bcf86cd799439011"
 *                       description: User's unique identifier
 *                     email:
 *                       type: string
 *                       example: "user@example.com"
 *                       description: User's email address
 *                     display_name:
 *                       type: string
 *                       example: "John Doe"
 *                       description: User's display name
 *                     username:
 *                       type: string
 *                       nullable: true
 *                       example: "john_doe"
 *                       description: User's unique username
 *                     avatar_url:
 *                       type: string
 *                       nullable: true
 *                       example: "https://your-bucket.s3.amazonaws.com/profile-images/user123/abc123.jpg"
 *                       description: URL to user's avatar image
 *                     bio:
 *                       type: string
 *                       nullable: true
 *                       example: "Software developer passionate about open source"
 *                       description: User's bio/description
 *                 message:
 *                   type: string
 *                   example: "Profile retrieved successfully"
 *               example:
 *                 success: true
 *                 data:
 *                   _id: "507f1f77bcf86cd799439011"
 *                   email: "user@example.com"
 *                   display_name: "John Doe"
 *                   username: "john_doe"
 *                   avatar_url: "https://your-bucket.s3.amazonaws.com/profile-images/user123/abc123.jpg"
 *                   bio: "Software developer passionate about open source"
 *                 message: "Profile retrieved successfully"
 *       401:
 *         description: Unauthorized - missing or invalid token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Unauthorized"
 *                 message:
 *                   type: string
 *                   example: "User not authenticated"
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "User not found"
 *                 message:
 *                   type: string
 *                   example: "User profile not found"
 */
userRouter.get('/profile', ensureAuthenticated, UserController.getProfile);

/**
 * @openapi
 * /user/profile:
 *   patch:
 *     tags:
 *       - User Profile
 *     summary: Update user profile
 *     description: |
 *       Partially update user profile including username, bio, and/or profile picture.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 example: "john_doe"
 *                 description: New username (must be unique)
 *               bio:
 *                 type: string
 *                 example: "Software developer passionate about open source"
 *                 description: User bio/description
 *           example:
 *             username: "john_doe"
 *             bio: "Software developer passionate about open source"
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 example: "john_doe"
 *                 description: New username (must be unique)
 *               bio:
 *                 type: string
 *                 example: "Software developer passionate about open source"
 *                 description: User bio/description
 *               avatar:
 *                 type: string
 *                 format: binary
 *                 description: Profile image file (JPEG, PNG, WebP, or GIF, max 5MB)
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: "507f1f77bcf86cd799439011"
 *                       description: User's unique identifier
 *                     email:
 *                       type: string
 *                       example: "user@example.com"
 *                       description: User's email address
 *                     display_name:
 *                       type: string
 *                       example: "John Doe"
 *                       description: User's display name
 *                     username:
 *                       type: string
 *                       nullable: true
 *                       example: "john_doe"
 *                       description: User's unique username
 *                     avatar_url:
 *                       type: string
 *                       nullable: true
 *                       example: "https://your-bucket.s3.amazonaws.com/profile-images/user123/abc123.jpg"
 *                       description: URL to user's avatar image
 *                     bio:
 *                       type: string
 *                       nullable: true
 *                       example: "Software developer passionate about open source"
 *                       description: User's bio/description
 *                 message:
 *                   type: string
 *                   example: "Profile updated successfully"
 *               example:
 *                 success: true
 *                 data:
 *                   _id: "507f1f77bcf86cd799439011"
 *                   email: "user@example.com"
 *                   display_name: "John Doe"
 *                   username: "john_doe"
 *                   avatar_url: "https://your-bucket.s3.amazonaws.com/profile-images/user123/abc123.jpg"
 *                   bio: "Software developer passionate about open source"
 *                 message: "Profile updated successfully"
 *       400:
 *         description: Bad request - invalid file type or no fields provided
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Invalid file type"
 *                 message:
 *                   type: string
 *                   example: "Only image/jpeg, image/png, image/webp, image/gif files are allowed"
 *       401:
 *         description: Unauthorized - missing or invalid token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Unauthorized"
 *                 message:
 *                   type: string
 *                   example: "User not authenticated"
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "User not found"
 *                 message:
 *                   type: string
 *                   example: "User profile not found"
 *       409:
 *         description: Username already taken
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Username taken"
 *                 message:
 *                   type: string
 *                   example: "This username is already in use"
 *       413:
 *         description: File too large
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "File too large"
 *                 message:
 *                   type: string
 *                   example: "File size must be less than 5MB"
 */
userRouter.patch('/profile',
  ensureAuthenticated,
  upload.single('avatar'),
  UserController.updateProfile
);



// Error handler for multer errors
userRouter.use((err: any, _req: Request, res: Response, next: NextFunction) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        error: 'File too large',
        message: `File size must be less than ${Math.round(5 * 1024 * 1024 / (1024 * 1024))}MB`
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        error: 'Too many files',
        message: 'Only one file is allowed'
      });
    }
  }


  if (err.message?.includes('Invalid file type')) {
    return res.status(400).json({
      error: 'Invalid file type',
      message: err.message
    });
  }

  next(err);
});

export default userRouter;