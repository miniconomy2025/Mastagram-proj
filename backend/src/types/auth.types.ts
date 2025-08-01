import type { Request } from "express";
import type { User } from "../models/user.models.ts";

export type UserWithTokens = User & {
  currentTokens?: {
    accessToken: string,
    refreshToken: string,
    idToken: string,
  },
};

export type RefreshTokenRequest = {
  refreshToken: string;
}

export type AuthTokenResponse = {
  idToken: string;
  refreshToken: string;
}

export type AuthErrorResponse = {
  error: string;
  message: string;
  details?: string;
}

export type AuthSuccessResponse = {
  success: boolean;
  data: AuthTokenResponse;
  message?: string;
}
