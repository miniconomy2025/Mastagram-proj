export class S3ValidationError extends Error {
  public readonly code: string;
  public readonly statusCode: number;

  constructor(message: string, code: string, statusCode: number = 400) {
    super(message);
    this.name = 'S3ValidationError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

export class S3UploadError extends Error {
  public readonly code: string;
  public readonly statusCode: number;

  constructor(message: string, code: string = 'S3_UPLOAD_ERROR', statusCode: number = 500) {
    super(message);
    this.name = 'S3UploadError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

export class S3DeleteError extends Error {
  public readonly code: string;
  public readonly statusCode: number;

  constructor(message: string, code: string = 'S3_DELETE_ERROR', statusCode: number = 500) {
    super(message);
    this.name = 'S3DeleteError';
    this.code = code;
    this.statusCode = statusCode;
  }
}
