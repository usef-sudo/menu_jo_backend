// src/services/upload.service.ts
import AWS from 'aws-sdk';
import multer from 'multer';
import multerS3 from 'multer-s3';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const awsRegion = process.env.AWS_REGION;
const awsAccessKeyId = process.env.AWS_ACCESS_KEY_ID;
const awsSecretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
const awsBucketName = process.env.AWS_S3_BUCKET_NAME;

if (!awsRegion || !awsBucketName) {
  throw new Error("Missing AWS configuration environment variables (AWS_REGION, AWS_S3_BUCKET_NAME).");
}

const bucketName: string = awsBucketName;

// Best practice: in AWS (ECS/EC2), rely on the runtime IAM Role (no static keys).
// Still supports local dev with explicit keys.
const credentials =
  awsAccessKeyId && awsSecretAccessKey
    ? {
        accessKeyId: awsAccessKeyId,
        secretAccessKey: awsSecretAccessKey,
      }
    : undefined;

const s3 = new AWS.S3({
  region: awsRegion,
  ...(credentials ? { credentials } : {}),
});



export interface UploadOptions {
  folder?: string;
  allowedMimeTypes?: string[];
  maxFileSize?: number;
}

export class UploadService {
  private static instance: UploadService;

  static getInstance() {
    if (!UploadService.instance) UploadService.instance = new UploadService();
    return UploadService.instance;
  }

  getUploadMiddleware(options: UploadOptions = {}) {
    const {
      folder = "uploads",
      allowedMimeTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"],
      maxFileSize = 5 * 1024 * 1024
    } = options;


    return multer({
      storage: multerS3({
        // multer-s3 runtime expects aws-sdk v2 S3; typings vary between versions.
        s3: s3 as any,
        bucket: bucketName,
        //  acl: "public-read",
        contentType: multerS3.AUTO_CONTENT_TYPE,
        key: (_req, file, cb) => {
          const uniqueName = `${folder}/${uuidv4()}${path.extname(file.originalname)}`;
          cb(null, uniqueName);
        }
      }),
      limits: { fileSize: maxFileSize },
      fileFilter: (_req, file, cb) => {
        if (allowedMimeTypes.includes(file.mimetype)) cb(null, true);
        else cb(new Error(`Invalid file type. Allowed types: ${allowedMimeTypes.join(", ")}`));
      }
    });
  }

  uploadSingle(fieldName: string, options?: UploadOptions) {
    return this.getUploadMiddleware(options).single(fieldName);
  }

  uploadMultiple(fieldName: string, maxCount = 10, options?: UploadOptions) {
    return this.getUploadMiddleware(options).array(fieldName, maxCount);
  }

  async deleteFile(fileUrl: string) {
    try {
      const url = new URL(fileUrl);
      const key = url.pathname.substring(1);

      await s3
        .deleteObject({
          Bucket: bucketName,
          Key: key,
        })
        .promise();

      return true;
    } catch (error) {
      console.error("Error deleting file from S3:", error);
      return false;
    }
  }

  getPublicUrl(file: any) {
    return file.location;
  }
}

export const uploadService = UploadService.getInstance();



