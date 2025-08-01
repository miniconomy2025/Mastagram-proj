import passport from 'passport';
import { Strategy as GoogleStrategy, type StrategyOptions, type VerifyCallback, type GoogleCallbackParameters, type Profile as GoogleProfile } from 'passport-google-oauth20';
import { type Request, type Response, type NextFunction } from 'express';
import type { User } from '../models/user.models.ts';
import { createUser, findUserByGoogleId } from '../queries/user.queries.ts';
import { Temporal } from '@js-temporal/polyfill';
import type { UserWithTokens } from '../types/auth.types.ts';

// Helper: verify Google ID token
export async function verifyGoogleIdToken(idToken: string) {
  try {
    const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);

    if (!response.ok) {
      throw new Error('Failed to verify token');
    }

    const data = await response.json();

    // Verify the token is for our app
    if (data.aud !== process.env.GOOGLE_CLIENT_ID) {
      throw new Error('Invalid audience');
    }

    // Check if token is expired
    const now = Math.floor(Date.now() / 1000);
    if (data.exp < now) {
      throw new Error('Token expired');
    }

    return data;
  } catch (error) {
    console.error('Failed to verify Google ID token:', error);
    throw new Error('Invalid token');
  }
}

// Helper: refresh Google tokens using refresh token
export async function refreshGoogleToken(refreshToken: string) {
  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        refresh_token: refreshToken,
        grant_type: 'refresh_token'
      })
    });

    if (!response.ok) {
      throw new Error('Failed to refresh token');
    }

    const data = await response.json();

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || refreshToken, // Use original if no new one provided
      idToken: data.id_token
    };
  } catch (error) {
    console.error('Failed to refresh Google token:', error);
    throw new Error('Failed to refresh token');
  }
}

// Google OAuth Strategy
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  const strategyOptions: StrategyOptions = {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL,
    passReqToCallback: false,
    scope: ['openid', 'profile', 'email']
  };

  passport.use(new GoogleStrategy(strategyOptions,
    async (accessToken: string, refreshToken: string, params: GoogleCallbackParameters, profile: GoogleProfile, done: VerifyCallback) => {
      try {
        if (!params.id_token) {
          return done(new Error('No ID token received from Google'), false);
        }

        const user = await findUserByGoogleId(profile.id);

        if (user) {
          // Attach tokens to user object for callback 
          const userWithTokens: UserWithTokens = {
            ...user,
            currentTokens: {
              accessToken,
              refreshToken,
              idToken: params.id_token
            }
          };

          return done(null, userWithTokens);
        } else {
          if (!profile.emails?.length) {
            throw new Error('User has no emails!');
          }

          const email = profile.emails[0];
          const generatedUsername = profile.displayName.replaceAll(/[^a-zA-Z0-9_]/g, '') + Math.floor(Math.random() * 9000 + 1000);
          const newUser: User = {
            username: profile.username ?? generatedUsername,
            email: email.value,
            googleId: profile.id,
            name: profile.displayName,
            bio: '',
            keySet: [],
            createdAt: Temporal.Now.instant().epochMilliseconds,
          };

          await createUser(newUser);

          const createdUserWithTokens: UserWithTokens = {
            ...newUser,
            currentTokens: {
              accessToken,
              refreshToken,
              idToken: params.id_token
            }
          };

          return done(null, createdUserWithTokens);
        }
      } catch (error) {
        return done(error instanceof Error ? error : new Error('Unknown error occurred'), false);
      }
    }));
}

// Middleware to ensure user is authenticated using Google ID token
export const ensureAuthenticated = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });

  try {
    const payload = await verifyGoogleIdToken(token);

    const user = await findUserByGoogleId(payload.sub);

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = user;
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// Middleware to ensure user is not authenticated
export const ensureGuest = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return next();

  const token = authHeader.split(' ')[1];
  try {
    await verifyGoogleIdToken(token);
    return res.status(403).json({ error: 'Already authenticated' });
  } catch {
    return next();
  }
};

export default passport;
