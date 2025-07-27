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
   * Handle Google OAuth callback
   * POST /auth/tokens (after OAuth callback)
   */
  static async googleCallback(req: Request, res: Response): Promise<Response<AuthSuccessResponse | AuthErrorResponse>> {
    try {
      const user = req.user as UserWithTokens;
      const { currentTokens } = user;

      if (!currentTokens) {
        return res.status(401).json({
          error: 'Authentication failed',
          message: 'No tokens received from Google OAuth',
          details: 'Please try logging in again'
        });
      }

      const tokenData: AuthTokenResponse = {
        idToken: currentTokens.idToken,
        refreshToken: currentTokens.refreshToken
      };

      return res.status(200).json({
        success: true,
        data: tokenData,
        message: 'Authentication successful'
      });
    } catch (error) {
      console.error('Google OAuth callback error:', error);
      return res.status(500).json({
        error: 'Internal server error',
        message: 'Authentication process failed',
        details: 'Please try again later'
      });
    }
  }

  /**
   * Handle authentication failure - REST compliant
   * GET /auth/failure
   */
  static authFailure(_req: Request, res: Response): Response<AuthErrorResponse> {
    return res.status(401).json({
      error: 'Authentication failed',
      message: 'Google OAuth authentication was unsuccessful',
      details: 'Please try again or contact support if the problem persists'
    });
  }

  /**
   * Handle token refresh - REST compliant
   * POST /auth/tokens/refresh
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
   * Get authentication status - REST compliant
   * GET /auth/status
   */
  static async getAuthStatus(req: Request & { user?: any }, res: Response): Promise<Response> {
    try {
      if (req.user) {
        return res.status(200).json({
          success: true,
          authenticated: true,
          user: {
            id: req.user._id,
            name: req.user.name,
            email: req.user.email,
            avatar_url: req.user.profilePicture
          }
        });
      } else {
        return res.status(200).json({
          success: true,
          authenticated: false,
          message: 'Not authenticated'
        });
      }
    } catch (error) {
      console.error('Auth status check error:', error);
      return res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to check authentication status'
      });
    }
  }
}