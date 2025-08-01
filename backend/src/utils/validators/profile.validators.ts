import type { UpdateProfileRequest } from "../../types/profile.types.ts";

export class ProfileValidationError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly validationErrors: Array<{ field: string; message: string }>;

  constructor(
    message: string, 
    validationErrors: Array<{ field: string; message: string }>,
    code: string = 'VALIDATION_ERROR',
    statusCode: number = 400
  ) {
    super(message);
    this.name = 'ProfileValidationError';
    this.code = code;
    this.statusCode = statusCode;
    this.validationErrors = validationErrors;
  }
}

export const validateProfileUpdate = (data: UpdateProfileRequest | undefined): void => {
  // If no data provided, that's fine for a PATCH request
  if (!data || typeof data !== 'object') {
    return;
  }
  
  const errors: Array<{ field: string; message: string }> = [];

  // Username validation - only validate if provided
  if ('username' in data && data.username !== undefined) {
    if (typeof data.username !== 'string') {
      errors.push({ field: 'username', message: 'Username must be a string' });
    } else if (data.username.trim().length === 0) {
      errors.push({ field: 'username', message: 'Username cannot be empty' });
    } else if (data.username.length < 3) {
      errors.push({ field: 'username', message: 'Username must be at least 3 characters long' });
    } else if (data.username.length > 30) {
      errors.push({ field: 'username', message: 'Username must be no more than 30 characters long' });
    } else if (!/^[a-zA-Z0-9_]+$/.test(data.username)) {
      errors.push({ field: 'username', message: 'Username can only contain letters, numbers, and underscores' });
    }
  }

  // Display name validation - only validate if provided
  if ('displayName' in data && data.displayName !== undefined) {
    if (typeof data.displayName !== 'string') {
      errors.push({ field: 'displayName', message: 'Display name must be a string' });
    } else if (data.displayName.length > 50) {
      errors.push({ field: 'displayName', message: 'Display name must be no more than 50 characters long' });
    }
  }

  // Bio validation - only validate if provided
  if ('bio' in data && data.bio !== undefined) {
    if (typeof data.bio !== 'string') {
      errors.push({ field: 'bio', message: 'Bio must be a string' });
    } else if (data.bio.length > 500) {
      errors.push({ field: 'bio', message: 'Bio must be no more than 500 characters long' });
    }
  }

  if (errors.length > 0) {
    throw new ProfileValidationError('Validation failed', errors);
  }
};
