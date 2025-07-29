import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { s3Client, s3Settings } from '../configs/s3.config';
import { S3UploadResult, S3OperationResponse } from '../types/s3.types';
import { S3ValidationError, S3UploadError } from './errors/s3.errors';
import { validateUploadFile, extractS3Key } from './validators/file.validators';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

const handleS3Error = (error: any, defaultMessage: string, ErrorClass: any) => {
  console.error(defaultMessage, error);
  
  if (error instanceof S3ValidationError) {
    return {
      success: false,
      error: {
        message: error.message,
        code: error.code,
        statusCode: error.statusCode
      }
    };
  }
  
  return {
    success: false,
    error: {
      message: error.message || defaultMessage,
      code: error.code || ErrorClass.name.replace('Error', '').toUpperCase(),
      statusCode: error.statusCode || 500
    }
  };
};

export async function uploadToS3(
  file: Express.Multer.File,
  userId: string,
  type: 'avatar' | 'media'
): Promise<S3OperationResponse<S3UploadResult>> {
  try {
    validateUploadFile(file, userId, file.mimetype.startsWith('image/') ? 'image' : 'video');
    const fileExtension = path.extname(file.originalname).toLowerCase();
    const randomId = uuidv4();
    
    let fileName: string;
    if (type === 'avatar') {
      fileName = `avatars/${userId}/${randomId}${fileExtension}`;
    } else {
      fileName = `media/${userId}/${randomId}${fileExtension}`;
    }

    const uploadCommand = new PutObjectCommand({
      Bucket: s3Settings.bucketName,
      Key: fileName,
      Body: file.buffer,
      ContentType: file.mimetype,
      ContentDisposition: 'inline',
      Metadata: {
        'user-id': userId,
        'original-name': file.originalname,
        'upload-timestamp': new Date().toISOString(),
      },
    });

    await s3Client.send(uploadCommand);

    return {
      success: true,
      data: {
        url: `${s3Settings.bucketUrl}/${fileName}`,
        key: fileName,
        mediaType: file.mimetype.startsWith('image/') ? 'image' : 'video'
      }
    };
  } catch (error) {
    return handleS3Error(error, 'Failed to upload file to S3', S3UploadError);
  }
}

export async function deleteOldAvatarFromS3(avatarUrl?: string): Promise<S3OperationResponse<void>> {
  const key = extractS3Key(avatarUrl || '', s3Settings.bucketUrl || '');
  
  if (!key) {
    return { success: true, data: undefined };
  }

  try {
    const deleteCommand = new DeleteObjectCommand({
      Bucket: s3Settings.bucketName,
      Key: key,
    });

    await s3Client.send(deleteCommand);
    console.log(`Successfully deleted avatar: ${key}`);
    
    return { success: true, data: undefined };
  } catch (error) {
    console.error('Error deleting old avatar from S3:', error);
    
    // Don't fail the main operation for deletion errors
    return {
      success: true,
      error: {
        message: (error as Error).message || 'Failed to delete old avatar from S3',
        code: 'S3_DELETE_ERROR',
        statusCode: 500
      }
    };
  }
}
