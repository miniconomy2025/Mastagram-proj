import { Router, type Request, type Response, type NextFunction } from 'express';
import passport, { ensureGuest } from '../configs/passport.config.ts';
import { AuthController } from '../controllers/auth.controller.ts';

const authRouter = Router();

/**
 * @openapi
 * /auth/session:
 *   get:
 *     tags:
 *       - Authentication
 *     summary: Create new authentication session
 *     description: Initiates Google OAuth flow to create a new session
 *     responses:
 *       302:
 *         description: Redirect to Google OAuth login page
 *       403:
 *         description: Already authenticated
 */
authRouter.get('/session', ensureGuest, passport.authenticate('google', {
  scope: ['openid', 'profile', 'email'],
  session: false,
  accessType: 'offline', 
  prompt: 'consent' 
}));

/**
 * @openapi
 * /auth/tokens:
 *   get:
 *     tags:
 *       - Authentication
 *     summary: Google OAuth callback
 *     description: Callback URL for Google OAuth. Redirects to frontend with tokens.
 *     responses:
 *       302:
 *         description: Redirect to frontend with tokens or error
 */
authRouter.get('/tokens',
  passport.authenticate('google', {
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL}/login?error=oauth_failed`
  }),
  AuthController.googleCallback
);

/**
 * @openapi
 * /auth/tokens:
 *   put:
 *     tags:
 *       - Authentication
 *     summary: Update/refresh authentication tokens
 *     description: Use a Google refresh token to get new authentication tokens
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: Valid Google refresh token
 *     responses:
 *       200:
 *         description: Tokens refreshed successfully
 *       400:
 *         description: Bad request - missing refresh token
 *       401:
 *         description: Invalid or expired refresh token
 */
authRouter.put('/tokens', AuthController.refreshToken);

/**
 * @openapi
 * /auth/failure:
 *   get:
 *     tags:
 *       - Authentication
 *     summary: Authentication failure endpoint
 *     description: Endpoint called when OAuth authentication fails
 *     responses:
 *       302:
 *         description: Redirect to frontend with error
 */
authRouter.get('/failure', AuthController.authFailure);

// Global error handler for authentication routes
authRouter.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  console.error('Authentication error:', err);

  // For OAuth flow errors, redirect to frontend with error
  if (req.path.includes('/tokens') || req.path.includes('/session')) {
    const errorUrl = `${process.env.FRONTEND_URL}/login?error=server_error`;
    return res.redirect(errorUrl);
  }

  // For API endpoints, return JSON error
  res.status(500).json({
    error: 'Internal server error',
    message: 'Authentication service error',
    details: process.env.NODE_ENV === 'development' ? err.message : 'Please try again later'
  });
});

export default authRouter;