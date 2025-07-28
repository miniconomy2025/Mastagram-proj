import { UserWithTokens, RefreshTokenRequest, AuthTokenResponse } from '../types/auth.types';
import { refreshGoogleToken } from '../configs/passport.config';

export function extractTokenData(user: UserWithTokens): AuthTokenResponse | null {
  if (!user?.currentTokens) return null;
  return {
    idToken: user.currentTokens.idToken,
    refreshToken: user.currentTokens.refreshToken
  };
}

export async function handleRefreshToken(refreshToken: RefreshTokenRequest): Promise<AuthTokenResponse> {
  const newTokens = await refreshGoogleToken(refreshToken.refreshToken);
  return {
    idToken: newTokens.idToken,
    refreshToken: newTokens.refreshToken
  };
}

export function getUserAuthStatus(user: any) {
  if (!user) return { authenticated: false };
  return {
    authenticated: true,
    user: {
      id: user._id,
      username: user.username,
      displayName: user.displayName,
      email: user.email,
      avatarUrl: user.avatarUrl
    }
  };
}