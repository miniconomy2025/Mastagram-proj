import { Request, Response } from 'express';
import { refreshGoogleToken } from '../configs/passport.config';
import {
  UserWithTokens,
  RefreshTokenRequest,
  AuthTokenResponse,
  AuthErrorResponse,
  AuthSuccessResponse
} from '../types/auth.types';

export class AuthController {
  /**
   * Handle Google OAuth callback - Redirects to frontend with tokens
   * GET /auth/tokens (OAuth callback)
   */
  static async googleCallback(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user as UserWithTokens;
      const { currentTokens } = user;

      if (!currentTokens) {
        // Redirect to frontend with error
        const errorUrl = `${process.env.FRONTEND_URL}/login?error=no_tokens`;
        return res.redirect(errorUrl);
      }

      // Redirect to frontend with tokens in URL parameters
      const redirectUrl = `${process.env.FRONTEND_URL}/auth/callback?${new URLSearchParams({
        id_token: currentTokens.idToken,
        refresh_token: currentTokens.refreshToken
      }).toString()}`;

      res.redirect(redirectUrl);
    } catch (error) {
      console.error('Google OAuth callback error:', error);
      const errorUrl = `${process.env.FRONTEND_URL}/login?error=auth_failed`;
      res.redirect(errorUrl);
    }
  }

  /**
   * Handle authentication failure - Redirect to frontend
   * GET /auth/failure
   */
  static authFailure(_req: Request, res: Response): void {
    const errorUrl = `${process.env.FRONTEND_URL}/login?error=oauth_failed`;
    res.redirect(errorUrl);
  }

  /**
   * Handle token refresh - REST compliant (this stays the same)
   * PUT /auth/tokens
   */
  static async refreshToken(
    req: Request<{}, AuthSuccessResponse | AuthErrorResponse, RefreshTokenRequest>,
    res: Response<AuthSuccessResponse | AuthErrorResponse>
  ): Promise<Response<AuthSuccessResponse | AuthErrorResponse>> {
    try {
      // Validate request body
      if (!req.body) {
        return res.status(400).json({
          error: 'Bad request',
          message: 'Request body is required'
        });
      }

      const { refreshToken } = req.body;
      if (!refreshToken) {
        return res.status(400).json({
          error: 'Bad request',
          message: 'Refresh token is required'
        });
      }

      // Refresh tokens
      const newTokens = await refreshGoogleToken(refreshToken);

      const tokenData: AuthTokenResponse = {
        idToken: newTokens.idToken,
        refreshToken: newTokens.refreshToken
      };

      return res.status(200).json({
        success: true,
        data: tokenData,
        message: 'Tokens refreshed successfully'
      });
    } catch (error) {
      console.error('Failed to refresh Google token:', error);
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or expired refresh token',
        details: 'Please log in again to get new tokens'
      });
    }
  }

  /**
   * Alternative: Get tokens via API after successful redirect
   * GET /auth/tokens/current (optional - for getting current user tokens)
   */
  static async getCurrentTokens(req: Request, res: Response): Promise<Response<AuthSuccessResponse | AuthErrorResponse>> {
    try {
      // This would require the user to be authenticated
      // You can implement this if you want an API endpoint to get current tokens
      const user = req.user as UserWithTokens;
      
      if (!user?.currentTokens) {
        return res.status(401).json({
          error: 'Not authenticated',
          message: 'No valid session found'
        });
      }

      const tokenData: AuthTokenResponse = {
        idToken: user.currentTokens.idToken,
        refreshToken: user.currentTokens.refreshToken
      };

      return res.status(200).json({
        success: true,
        data: tokenData,
        message: 'Current tokens retrieved'
      });
    } catch (error) {
      return res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to retrieve tokens'
      });
    }
  }
}