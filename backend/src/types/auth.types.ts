import { ObjectId } from 'mongodb';

export interface User {
  _id?: ObjectId;
  googleId?: string;
  email?: string;
  name?: string;
  profilePicture?: string;
  bio?: string;
}

export interface UserWithTokens extends User {
  currentTokens?: {
    accessToken: string;
    refreshToken: string;
    idToken: string;
  };
}

export interface GoogleProfile {
  id: string;
  displayName: string;
  emails?: Array<{ value: string }>;
  photos?: Array<{ value: string }>;
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
