import { s3Settings } from '../../configs/s3.config.ts';
import type { MediaType } from '../../types/s3.types.ts';
import { S3ValidationError } from '../errors/s3.errors.ts';

export const validateUploadFile = (file: Express.Multer.File, userId: string, mediaType: MediaType): void => {
  const validations = [
    () => {
      if (!file?.buffer) {
        throw new S3ValidationError('Invalid file provided', 'INVALID_FILE');
      }
    },
    () => {
      if (!userId) {
        throw new S3ValidationError('User ID is required', 'MISSING_USER_ID');
      }
    },
    () => {
      if (mediaType === 'image') {
        if (file.size > s3Settings.maxFileSize) {
          throw new S3ValidationError(
            `File size exceeds limit of ${(s3Settings.maxFileSize / (1024 * 1024)).toFixed(2)}MB`,
            'FILE_TOO_LARGE'
          );
        }
      } else if (mediaType === 'video') {
        const maxVideoSizeMB = 50;
        const maxVideoSizeBytes = maxVideoSizeMB * 1024 * 1024;
        if (file.size > maxVideoSizeBytes) {
          throw new S3ValidationError(
            `Video file size exceeds limit of ${maxVideoSizeMB}MB`,
            'VIDEO_FILE_TOO_LARGE'
          );
        }
      } else {
        throw new S3ValidationError(
          `Unsupported file type: ${mediaType}`,
          'UNSUPPORTED_FILE_TYPE'
        );
      }
    },
    () => {
      if (!s3Settings.allowedMimeTypes.includes(file.mimetype)) {
        throw new S3ValidationError(
          `Invalid file type. Allowed types: ${s3Settings.allowedMimeTypes.join(', ')}`,
          'INVALID_FILE_TYPE'
        );
      }
    }
  ];

  validations.forEach(validate => validate());
};

export const extractS3Key = (avatarUrl: string, bucketUrl: string): string | null => {
  if (!avatarUrl || !bucketUrl) return null;
  
  const key = avatarUrl.replace(`${bucketUrl}/`, '');
  
  if (!key || key === avatarUrl || !key.startsWith('avatars/')) {
    return null;
  }
  
  return key;
};
