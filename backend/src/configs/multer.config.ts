import multer from 'multer';
import { s3Settings } from './s3.config';

// Configure multer for memory storage (we'll upload directly to S3)
const storage = multer.memoryStorage();

// File filter to validate image types
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (s3Settings.allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Only ${s3Settings.allowedMimeTypes.join(', ')} files are allowed.`));
  }
};

// Configure multer
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: s3Settings.maxFileSize,
    files: 1
  }
});

export default upload;