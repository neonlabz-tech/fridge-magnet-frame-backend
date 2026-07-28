import { randomUUID } from 'crypto';
import { extname } from 'path';
import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { BadRequestException, Injectable } from '@nestjs/common';

type StoredImage = {
  secure_url: string;
  public_id: string;
};

@Injectable()
export class CloudflareR2Service {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly publicUrl: string;

  constructor() {
    const accountId = process.env.R2_ACCOUNT_ID;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    const endpoint =
      process.env.R2_ENDPOINT ||
      (accountId
        ? `https://${accountId}.r2.cloudflarestorage.com`
        : undefined);
    const bucket = process.env.R2_BUCKET_NAME;
    const publicUrl = process.env.R2_PUBLIC_URL;

    if (
      !endpoint ||
      !accessKeyId ||
      !secretAccessKey ||
      !bucket ||
      !publicUrl
    ) {
      throw new Error(
        'Cloudflare R2 configuration is incomplete. Check R2_ACCOUNT_ID/R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME and R2_PUBLIC_URL.',
      );
    }

    this.bucket = bucket;
    this.publicUrl = publicUrl.replace(/\/+$/, '');
    this.client = new S3Client({
      region: 'auto',
      endpoint,
      credentials: { accessKeyId, secretAccessKey },
    });
  }

  async uploadImage(
    file: Express.Multer.File,
    folder: string = 'products',
  ): Promise<StoredImage> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const safeFolder = folder.replace(/^\/+|\/+$/g, '');
    const extension = extname(file.originalname || '').toLowerCase();
    const key = `${safeFolder}/${randomUUID()}${extension}`;

    try {
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype || 'application/octet-stream',
        }),
      );

      return {
        secure_url: `${this.publicUrl}/${key
          .split('/')
          .map(encodeURIComponent)
          .join('/')}`,
        public_id: key,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(`Cloudflare R2 upload error: ${message}`);
    }
  }

  async uploadMultipleImages(
    files: Express.Multer.File[],
    folder: string = 'products',
  ): Promise<StoredImage[]> {
    if (!files?.length) {
      throw new BadRequestException('No files provided');
    }

    return Promise.all(files.map((file) => this.uploadImage(file, folder)));
  }

  async deleteImage(publicId: string) {
    if (!publicId) {
      throw new BadRequestException('Object key is required');
    }

    try {
      await this.client.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: publicId,
        }),
      );

      return { success: true, message: 'Image deleted successfully' };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(`Cloudflare R2 delete error: ${message}`);
    }
  }

  async deleteMultipleImages(publicIds: string[]) {
    if (!publicIds?.length) {
      throw new BadRequestException('No object keys provided');
    }

    return Promise.all(publicIds.map((publicId) => this.deleteImage(publicId)));
  }
}