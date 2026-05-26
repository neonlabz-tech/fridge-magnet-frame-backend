import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product, ProductDocument } from './schemas/product.schema';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    private cloudinaryService: CloudinaryService,
  ) {}

  async create(
    createProductDto: CreateProductDto,
    primaryImageFile?: Express.Multer.File,
    galleryImageFiles?: Express.Multer.File[],
  ) {
    try {
      // Check if product with same SKU already exists
      const existingProduct = await this.productModel.findOne({
        productId: createProductDto.productId,
      });

      if (existingProduct) {
        throw new BadRequestException(
          'Product with this SKU already exists',
        );
      }

      const productData: any = { ...createProductDto };

      // Upload primary image
      if (primaryImageFile) {
        const primaryImage = await this.cloudinaryService.uploadImage(
          primaryImageFile,
          'products/primary',
        );
        productData.primaryImage = primaryImage;
      }

      // Upload gallery images
      if (galleryImageFiles && galleryImageFiles.length > 0) {
        const galleryImages = await this.cloudinaryService.uploadMultipleImages(
          galleryImageFiles,
          'products/gallery',
        );
        productData.galleryImages = galleryImages;
      }

      // Determine status based on stock
      if (!productData.status) {
        if (productData.stock > 10) {
          productData.status = 'In Stock';
        } else if (productData.stock > 0) {
          productData.status = 'Low Stock';
        } else {
          productData.status = 'Out of Stock';
        }
      }

      const product = await this.productModel.create(productData);
      return {
        success: true,
        message: 'Product created successfully',
        data: product,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    search?: string,
    category?: string,
    status?: string,
    minPrice?: number,
    maxPrice?: number,
  ) {
    try {
      const skip = (page - 1) * limit;
      const filters: any = {};

      // Search filter for productName or SKU
      if (search) {
        filters.$or = [
          { productName: { $regex: search, $options: 'i' } },
          { productId: { $regex: search, $options: 'i' } },
        ];
      }

      // Category filter
      if (category) {
        filters.category = category;
      }

      // Status filter
      if (status) {
        filters.status = status;
      }

      // Price range filter
      if (minPrice !== undefined || maxPrice !== undefined) {
        filters.price = {};
        if (minPrice !== undefined) {
          filters.price.$gte = minPrice;
        }
        if (maxPrice !== undefined) {
          filters.price.$lte = maxPrice;
        }
      }

      const products = await this.productModel
        .find(filters)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .exec();

      const total = await this.productModel.countDocuments(filters);

      return {
        success: true,
        message: 'Products retrieved successfully',
        data: {
          products,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
          },
        },
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async findOne(id: string) {
    try {
      const product = await this.productModel.findById(id).exec();

      if (!product) {
        throw new NotFoundException(`Product with ID ${id} not found`);
      }

      return {
        success: true,
        message: 'Product retrieved successfully',
        data: product,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(error.message);
    }
  }

  async update(
    id: string,
    updateProductDto: UpdateProductDto,
    primaryImageFile?: Express.Multer.File,
    galleryImageFiles?: Express.Multer.File[],
  ) {
    try {
      const product = await this.productModel.findById(id).exec();

      if (!product) {
        throw new NotFoundException(`Product with ID ${id} not found`);
      }

      // Check if updating SKU and if new SKU already exists
      if (
        updateProductDto.productId &&
        updateProductDto.productId !== product.productId
      ) {
        const existingProduct = await this.productModel.findOne({
          productId: updateProductDto.productId,
        });

        if (existingProduct) {
          throw new BadRequestException(
            'Product with this SKU already exists',
          );
        }
      }

      const updateData: any = { ...updateProductDto };

      // Handle primary image update
      if (primaryImageFile) {
        // Delete old primary image if exists
        if (product.primaryImage && product.primaryImage.public_id) {
          await this.cloudinaryService.deleteImage(
            product.primaryImage.public_id,
          );
        }

        // Upload new primary image
        const newPrimaryImage = await this.cloudinaryService.uploadImage(
          primaryImageFile,
          'products/primary',
        );
        updateData.primaryImage = newPrimaryImage;
      }

      // Handle gallery images update
      if (galleryImageFiles && galleryImageFiles.length > 0) {
        // Delete old gallery images if exists
        if (product.galleryImages && product.galleryImages.length > 0) {
          const publicIds = product.galleryImages.map((img) => img.public_id);
          await this.cloudinaryService.deleteMultipleImages(publicIds);
        }

        // Upload new gallery images
        const newGalleryImages = await this.cloudinaryService.uploadMultipleImages(
          galleryImageFiles,
          'products/gallery',
        );
        updateData.galleryImages = newGalleryImages;
      }

      // Auto-update status based on stock if stock is updated
      if (updateData.stock !== undefined) {
        if (!updateData.status) {
          if (updateData.stock > 10) {
            updateData.status = 'In Stock';
          } else if (updateData.stock > 0) {
            updateData.status = 'Low Stock';
          } else {
            updateData.status = 'Out of Stock';
          }
        }
      }

      updateData.updatedAt = new Date();

      const updatedProduct = await this.productModel.findByIdAndUpdate(
        id,
        updateData,
        { new: true },
      );

      return {
        success: true,
        message: 'Product updated successfully',
        data: updatedProduct,
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException(error.message);
    }
  }

  async delete(id: string) {
    try {
      const product = await this.productModel.findById(id).exec();

      if (!product) {
        throw new NotFoundException(`Product with ID ${id} not found`);
      }

      // Delete images from Cloudinary
      const imagePublicIds: string[] = [];

      if (product.primaryImage && product.primaryImage.public_id) {
        imagePublicIds.push(product.primaryImage.public_id);
      }

      if (product.galleryImages && product.galleryImages.length > 0) {
        product.galleryImages.forEach((img) => {
          imagePublicIds.push(img.public_id);
        });
      }

      if (imagePublicIds.length > 0) {
        try {
          await this.cloudinaryService.deleteMultipleImages(imagePublicIds);
        } catch (error) {
          this.logger.warn(
            `Product ${id} deleted from database, but image cleanup failed: ${
              error instanceof Error ? error.message : String(error)
            }`,
          );
        }
      }

      // Delete product from database
      await this.productModel.findByIdAndDelete(id).exec();

      return {
        success: true,
        message: 'Product deleted successfully',
        data: { deletedId: id },
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(error.message);
    }
  }

  async deleteImage(productId: string, publicId: string) {
    try {
      const product = await this.productModel.findById(productId).exec();

      if (!product) {
        throw new NotFoundException(
          `Product with ID ${productId} not found`,
        );
      }

      // Delete from Cloudinary
      await this.cloudinaryService.deleteImage(publicId);

      // Remove from MongoDB
      if (
        product.primaryImage &&
        product.primaryImage.public_id === publicId
      ) {
        product.primaryImage = null;
      } else if (product.galleryImages && product.galleryImages.length > 0) {
        product.galleryImages = product.galleryImages.filter(
          (img) => img.public_id !== publicId,
        );
      }

      product.updatedAt = new Date();
      await product.save();

      return {
        success: true,
        message: 'Image deleted successfully',
        data: product,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(error.message);
    }
  }
}
