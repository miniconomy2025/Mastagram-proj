import { ObjectId } from 'mongodb';

export interface User {
  _id?: ObjectId;
  googleId?: string;
  username?: string;
  email?: string;
  displayName?: string;
  avatarUrl?: string;
  bio?: string;
}

export interface UserWithTokens extends User {
  currentTokens?: {
    accessToken: string;
    refreshToken: string;
    idToken: string;
  };
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface AuthTokenResponse {
  idToken: string;
  refreshToken: string;
}

export interface AuthErrorResponse {
  error: string;
  message: string;
  details?: string;
}

export interface AuthSuccessResponse {
  success: boolean;
  data: AuthTokenResponse;
  message?: string;
}
