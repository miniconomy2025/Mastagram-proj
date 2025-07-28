import { Router, Request, Response, NextFunction } from 'express';
import passport, { ensureGuest } from '../configs/passport.config';
import { AuthController } from '../controllers/auth.controller';

const authRouter = Router();


// NOTE : I AM KEEPIN THIS FOR TESTING ON BROWSER
/**
 * @openapi
 * /auth/login:
 *   get:
 *     tags:
 *       - Authentication
 *     summary: Initiate Google OAuth login (convenience endpoint)
 *     description: Convenience GET endpoint that redirects to Google OAuth (same as POST /auth/session)
 *     responses:
 *       302:
 *         description: Redirect to Google OAuth login page
 *       403:
 *         description: Already authenticated
 */
authRouter.get('/login', ensureGuest, passport.authenticate('google', {
  scope: ['profile', 'email'],
  session: false,
  accessType: 'offline',
  prompt: 'consent'
}));

/**
 * @openapi
 * /auth/session:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Create new authentication session
 *     description: Initiates Google OAuth flow to create a new session
 *     responses:
 *       302:
 *         description: Redirect to Google OAuth login page
 *       403:
 *         description: Already authenticated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                 message:
 *                   type: string
 */
authRouter.post('/session', ensureGuest, passport.authenticate('google', {
  scope: ['profile', 'email'],
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
 *     description: Callback URL for Google OAuth. Returns authentication tokens on success.
 *     responses:
 *       200:
 *         description: Authentication successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     idToken:
 *                       type: string
 *                     refreshToken:
 *                       type: string
 *                 message:
 *                   type: string
 *       401:
 *         description: Authentication failed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                 message:
 *                   type: string
 *                 details:
 *                   type: string
 */
authRouter.get('/tokens',
  passport.authenticate('google', { session: false, failureRedirect: '/auth/failure' }),
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     idToken:
 *                       type: string
 *                     refreshToken:
 *                       type: string
 *                 message:
 *                   type: string
 *       400:
 *         description: Bad request - missing refresh token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                 message:
 *                   type: string
 *       401:
 *         description: Invalid or expired refresh token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                 message:
 *                   type: string
 *                 details:
 *                   type: string
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
 *       401:
 *         description: Authentication failed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                 message:
 *                   type: string
 *                 details:
 *                   type: string
 */
authRouter.get('/failure', AuthController.authFailure);

// Global error handler for authentication routes
authRouter.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Authentication error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: 'Authentication service error',
    details: process.env.NODE_ENV === 'development' ? err.message : 'Please try again later'
  });
});

export default authRouter;
