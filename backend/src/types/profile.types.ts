export interface UpdateProfileRequest {
  username?: string;
  displayName?: string;
  bio?: string;
  // avatar file will be handled by multer middleware
}

export interface ProfileResponse {
  username?: string;
  email?: string;
  displayName?: string;
  avatarUrl?: string;
  bio?: string;
}

export interface UpdateProfileResponse {
  success: boolean;
  data?: {
    username?: string;
    email?: string;
    displayName?: string;
    avatarUrl?: string;
    bio?: string;
  };
  error?: {
    message: string;
    code?: string;
    statusCode?: number;
    details?: string[];
  };
}

export interface ProfileValidationError {
  field: string;
  message: string;
}

export interface ProfileUpdateError extends Error {
  code?: string;
  statusCode?: number;
  validationErrors?: ProfileValidationError[];
}
