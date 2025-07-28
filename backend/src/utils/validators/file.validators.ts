import { s3Settings } from '../../configs/s3.config';
import { S3ValidationError } from '../errors/s3.errors';

export const validateUploadFile = (file: Express.Multer.File, userId: string): void => {
  const validations = [
    () => {
      if (!file?.buffer) throw new S3ValidationError('Invalid file provided', 'INVALID_FILE');
    },
    () => {
      if (!userId) throw new S3ValidationError('User ID is required', 'MISSING_USER_ID');
    },
    () => {
      if (file.size > s3Settings.maxFileSize) {
        throw new S3ValidationError(
          `File size exceeds limit of ${s3Settings.maxFileSize / (1024 * 1024)}MB`,
          'FILE_TOO_LARGE'
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
