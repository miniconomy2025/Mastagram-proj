export type MediaType = 'image' | 'video';

export interface S3UploadResult {
  url: string;
  key: string;
  mediaType: MediaType;
}

export interface S3UploadError extends Error {
  code?: string;
  statusCode?: number;
}

export interface S3DeleteError extends Error {
  code?: string;
  statusCode?: number;
}

export interface S3OperationResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    statusCode?: number;
  };
}
