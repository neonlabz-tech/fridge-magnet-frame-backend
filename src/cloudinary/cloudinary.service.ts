import { Injectable, BadRequestException } from '@nestjs/common';
import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';
import { extname } from 'path';

type CloudinaryImage = {
  secure_url: string;
  public_id: string;
};

@Injectable()
export class CloudinaryService {
  private readonly r2Client: S3Client;
  private readonly bucketName: string;
  private readonly publicUrl: string;

  constructor() {
    const endpoint = process.env.R2_ENDPOINT;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    const bucketName = process.env.R2_BUCKET_NAME;
    const publicUrl = process.env.R2_PUBLIC_URL;

    if (
      !endpoint ||
      !accessKeyId ||
      !secretAccessKey ||
      !bucketName ||
      !publicUrl
    ) {
      throw new Error(
        'Missing Cloudflare R2 environment variables. Check R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME and R2_PUBLIC_URL.',
      );
    }

    this.bucketName = bucketName;
    this.publicUrl = publicUrl.replace(/\/$/, '');

    this.r2Client = new S3Client({
      region: 'auto',
      endpoint,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  async uploadImage(
    file: Express.Multer.File,
    folder: string = 'products',
  ): Promise<CloudinaryImage> {
    try {
      if (!file) {
        throw new BadRequestException('No file provided');
      }

      if (!file.buffer) {
        throw new BadRequestException('File buffer is missing');
      }

      const extension = extname(file.originalname).toLowerCase();
      const cleanFolder = folder.replace(/^\/+|\/+$/g, '');
      const objectKey = `${cleanFolder}/${Date.now()}-${randomUUID()}${extension}`;

      await this.r2Client.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: objectKey,
          Body: file.buffer,
          ContentType: file.mimetype,
          CacheControl: 'public, max-age=31536000',
        }),
      );

      return {
        secure_url: `${this.publicUrl}/${objectKey}`,
        public_id: objectKey,
      };
    } catch (error: unknown) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      const message =
        error instanceof Error ? error.message : 'Unknown upload error';

      throw new BadRequestException(`R2 upload error: ${message}`);
    }
  }

  async uploadMultipleImages(
    files: Express.Multer.File[],
    folder: string = 'products',
  ): Promise<CloudinaryImage[]> {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }

    return Promise.all(files.map((file) => this.uploadImage(file, folder)));
  }

  async deleteImage(publicId: string) {
    try {
      if (!publicId) {
        throw new BadRequestException('Public ID is required');
      }

      await this.r2Client.send(
        new DeleteObjectCommand({
          Bucket: this.bucketName,
          Key: publicId,
        }),
      );

      return { success: true, message: 'Image deleted successfully' };
    } catch (error: unknown) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      const message =
        error instanceof Error ? error.message : 'Unknown delete error';

      throw new BadRequestException(`R2 delete error: ${message}`);
    }
  }

  async deleteMultipleImages(publicIds: string[]) {
    if (!publicIds || publicIds.length === 0) {
      throw new BadRequestException('No public IDs provided');
    }

    return Promise.all(publicIds.map((publicId) => this.deleteImage(publicId)));
  }
}