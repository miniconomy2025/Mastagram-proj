import { S3Client } from '@aws-sdk/client-s3';

const region = process.env.AWS_REGION;

const s3Config = {
  region,
  forcePathStyle: false,
  useAccelerateEndpoint: false,
};

export const s3Client = new S3Client(s3Config);

export const s3Settings = {
  bucketName: process.env.S3_BUCKET_NAME,
  bucketUrl: process.env.S3_BUCKET_URL,
  maxFileSize: 300 * 1024 * 1024,
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/mpeg'],
};

export default s3Config;