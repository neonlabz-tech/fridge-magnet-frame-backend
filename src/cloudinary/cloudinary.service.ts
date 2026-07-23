import { Injectable, BadRequestException } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';

type CloudinaryImage = {
  secure_url: string;
  public_id: string;
};

@Injectable()
export class CloudinaryService {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
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

      return await new Promise<CloudinaryImage>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder,
            resource_type: 'auto',
          },
          (error, result) => {
            if (error) {
              return reject(
                new BadRequestException(`Upload failed: ${error.message}`),
              );
            }

            if (!result) {
              return reject(new BadRequestException('Cloudinary upload failed'));
            }

            return resolve({
              secure_url: result.secure_url,
              public_id: result.public_id,
            });
          },
        );

        uploadStream.end(file.buffer);
      });
    } catch (error: any) {
      throw new BadRequestException(`Cloudinary upload error: ${error.message}`);
    }
  }

  async uploadMultipleImages(
    files: Express.Multer.File[],
    folder: string = 'products',
  ): Promise<CloudinaryImage[]> {
    try {
      if (!files || files.length === 0) {
        throw new BadRequestException('No files provided');
      }

      const uploadPromises = files.map((file) => this.uploadImage(file, folder));

      return await Promise.all(uploadPromises);
    } catch (error: any) {
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

      // BUG fix: Cloudinary's destroy() doesn't throw for most failures — it
      // returns { result: 'ok' | 'not found' | ... }. Treating anything other
      // than 'ok' as an error meant a legitimately-already-deleted image
      // (result.result === 'not found', e.g. from an earlier failed attempt
      // before a routing bug was fixed) would permanently block re-deletion,
      // since it would never actually succeed from the caller's point of view.
      // 'not found' is treated as success here since the end goal — the image
      // no longer existing on Cloudinary — is already true.
      if (result.result === 'ok' || result.result === 'not found') {
        return {
          success: true,
          message: 'Image deleted successfully',
          result: result.result,
        };
      }

      // BUG fix: include the actual Cloudinary result value in the error so
      // future failures are debuggable instead of a generic dead-end message.
      throw new BadRequestException(
        `Failed to delete image from Cloudinary (result: ${result.result})`,
      );
    } catch (error: any) {
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

      return await Promise.all(deletePromises);
    } catch (error: any) {
      throw new BadRequestException(
        `Multiple image deletion failed: ${error.message}`,
      );
    }
  }
}