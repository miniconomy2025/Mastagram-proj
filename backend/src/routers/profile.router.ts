import { Router, type Request, type Response } from 'express';
import { ensureAuthenticated } from '../configs/passport.config.ts';
import { type ProfileResponse } from '../types/profile.types.ts';
import { ProfileController } from '../controllers/profile.controller.ts';
import upload from '../configs/multer.config.ts';

const profileRouter = Router();

/**
 * @openapi
 * /profile:
 *   get:
 *     summary: Get the current authenticated user's profile
 *     tags:
 *       - Profile
 *     responses:
 *       200:
 *         description: The user's profile
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 username:
 *                   type: string
 *                   nullable: true
 *                   description: User's unique username
 *                 email:
 *                   type: string
 *                   nullable: true
 *                   description: User's email address
 *                 displayName:
 *                   type: string
 *                   nullable: true
 *                   description: User's display name
 *                 avatarUrl:
 *                   type: string
 *                   nullable: true
 *                   description: URL to user's avatar image
 *                 bio:
 *                   type: string
 *                   nullable: true
 *                   description: User's biography
 *       401:
 *         description: User not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: User not authenticated
 */
profileRouter.get(
  '/',
  ensureAuthenticated,
  ProfileController.getProfile()
);

/**
 * @openapi
 * /profile:
 *   patch:
 *     summary: Update the current authenticated user's profile
 *     tags:
 *       - Profile
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 description: User's unique username (3-30 characters, alphanumeric and underscores only)
 *               displayName:
 *                 type: string
 *                 description: User's display name (max 50 characters)
 *               bio:
 *                 type: string
 *                 description: User's biography (max 500 characters)
 *               avatar:
 *                 type: string
 *                 format: binary
 *                 description: Avatar image file (JPEG, PNG, WebP, GIF, max 5MB)
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
 *                     username:
 *                       type: string
 *                       nullable: true
 *                     email:
 *                       type: string
 *                       nullable: true
 *                     displayName:
 *                       type: string
 *                       nullable: true
 *                     avatarUrl:
 *                       type: string
 *                       nullable: true
 *                     bio:
 *                       type: string
 *                       nullable: true
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                     code:
 *                       type: string
 *                     statusCode:
 *                       type: number
 *                     details:
 *                       type: array
 *                       items:
 *                         type: string
 *       401:
 *         description: User not authenticated
 *       409:
 *         description: Username already taken
 *       500:
 *         description: Internal server error
 */
profileRouter.patch(
  '/',
  ensureAuthenticated,
  upload.single('avatar'),
  ProfileController.updateProfile()
);

export default profileRouter;