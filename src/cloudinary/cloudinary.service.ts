import { Injectable, BadRequestException } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class CloudinaryService {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  async uploadImage(file: Express.Multer.File, folder: string = 'products') {
    try {
      if (!file) {
        throw new BadRequestException('No file provided');
      }

      return new Promise<{ secure_url: string; public_id: string }>(
        (resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: folder,
            resource_type: 'auto',
          },
          (error, result) => {
            if (error) {
              reject(new BadRequestException(`Upload failed: ${error.message}`));
            } else if (!result) {
              reject(new BadRequestException('Upload failed: no result returned'));
            } else {
              resolve({
                secure_url: result.secure_url,
                public_id: result.public_id,
              });
            }
          },
        );

        uploadStream.end(file.buffer);
      },
      );
    } catch (error) {
      throw new BadRequestException(`Cloudinary upload error: ${error.message}`);
    }
  }

  async uploadMultipleImages(
    files: Express.Multer.File[],
    folder: string = 'products',
  ) {
    try {
      if (!files || files.length === 0) {
        throw new BadRequestException('No files provided');
      }

      const uploadPromises = files.map((file) =>
        this.uploadImage(file, folder),
      );

      return Promise.all(uploadPromises);
    } catch (error) {
      throw new BadRequestException(
        `Multiple image upload failed: ${error.message}`,
      );
    }
  }

  async deleteImage(publicId: string) {
    try {
      if (!publicId) {
        throw new BadRequestException('Public ID is required');
      }

      const result = await cloudinary.uploader.destroy(publicId);

      if (result.result === 'ok') {
        return { success: true, message: 'Image deleted successfully' };
      } else {
        throw new BadRequestException('Failed to delete image from Cloudinary');
      }
    } catch (error) {
      throw new BadRequestException(
        `Cloudinary delete error: ${error.message}`,
      );
    }
  }

  async deleteMultipleImages(publicIds: string[]) {
    try {
      if (!publicIds || publicIds.length === 0) {
        throw new BadRequestException('No public IDs provided');
      }

      const deletePromises = publicIds.map((publicId) =>
        this.deleteImage(publicId),
      );

      return Promise.all(deletePromises);
    } catch (error) {
      throw new BadRequestException(
        `Multiple image deletion failed: ${error.message}`,
      );
    }
  }
}
