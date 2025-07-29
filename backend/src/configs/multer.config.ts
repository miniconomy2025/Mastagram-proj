import multer from 'multer';
import { s3Settings } from './s3.config';

const storage = multer.memoryStorage();

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (s3Settings.allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Only ${s3Settings.allowedMimeTypes.join(', ')} files are allowed.`));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: s3Settings.maxFileSize,
    files: 5
  }
});

export default upload;