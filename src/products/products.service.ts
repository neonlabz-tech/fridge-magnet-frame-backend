import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product, ProductDocument } from './schemas/product.schema';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CloudinaryService } from '../cloudflareR2/cloudflareR2.service';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);
  private readonly duplicateProductNameMessage =
    'This product name is already used. Please use a different product name.';

  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    private cloudinaryService: CloudinaryService,
  ) {}

  private getStockStatus(
    stock: number,
  ): 'In Stock' | 'Low Stock' | 'Out of Stock' {
    if (stock > 10) return 'In Stock';
    if (stock > 4) return 'Low Stock';
    return 'Out of Stock';
  }

  private escapeRegex(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private normalizeName(value: unknown): string {
    return String(value ?? '').trim();
  }

  private normalizeNameKey(value: unknown): string {
    return this.normalizeName(value).toLowerCase();
  }

  private async findProductByName(name: string, excludeId?: string) {
    const normalizedName = this.normalizeName(name);
    const normalizedNameKey = this.normalizeNameKey(name);

    if (!normalizedName) {
      return null;
    }

    const query: Record<string, unknown> = {
      $or: [
        { productNameKey: normalizedNameKey },
        {
          productName: {
            $regex: `^${this.escapeRegex(normalizedName)}$`,
            $options: 'i',
          },
        },
      ],
    };

    if (excludeId) {
      query._id = { $ne: excludeId };
    }

    return this.productModel.findOne(query).exec();
  }

  private isDuplicateProductNameError(error: unknown): boolean {
    if (!error || typeof error !== 'object' || !('code' in error)) {
      return false;
    }

    const mongoError = error as {
      code?: number;
      keyPattern?: Record<string, unknown>;
      keyValue?: Record<string, unknown>;
    };

    return (
      mongoError.code === 11000 &&
      (Boolean(mongoError.keyPattern?.productNameKey) ||
        Boolean(mongoError.keyValue?.productNameKey))
    );
  }

  async create(
    createProductDto: CreateProductDto,
    primaryImageFile?: Express.Multer.File,
    galleryImageFiles?: Express.Multer.File[],
    personalizationImageFiles?: Record<string, Express.Multer.File>,
  ) {
    try {
      const normalizedProductName = this.normalizeName(
        createProductDto.productName,
      );
      const normalizedProductNameKey = this.normalizeNameKey(
        createProductDto.productName,
      );
      const normalizedProductId = this.normalizeName(createProductDto.productId);

      const existingProduct = await this.productModel.findOne({
        productId: normalizedProductId,
      });

      if (existingProduct) {
        throw new BadRequestException('Product with this SKU already exists');
      }

      const existingProductByName = await this.findProductByName(
        normalizedProductName,
      );

      if (existingProductByName) {
        throw new BadRequestException(this.duplicateProductNameMessage);
      }

      const productData: any = {
        ...createProductDto,
        productName: normalizedProductName,
        productNameKey: normalizedProductNameKey,
        productId: normalizedProductId,
      };

      productData.stock = Number(productData.stock) || 0;
      productData.price = Number(productData.price) || 0;
      productData.status = this.getStockStatus(productData.stock);

      if (primaryImageFile) {
        productData.primaryImage = await this.cloudinaryService.uploadImage(
          primaryImageFile,
          'products/primary',
        );
      }

      if (galleryImageFiles && galleryImageFiles.length > 0) {
        productData.galleryImages =
          await this.cloudinaryService.uploadMultipleImages(
            galleryImageFiles,
            'products/gallery',
          );
      }

      // Upload each personalization option's image (if attached) and embed the URL
      if (Array.isArray(productData.personalization)) {
        const hasAnyImageFiles =
          personalizationImageFiles &&
          Object.keys(personalizationImageFiles).length > 0;

        if (hasAnyImageFiles) {
          productData.personalization = await Promise.all(
            productData.personalization.map(async (option: any) => {
              const baseOption = {
                label: option.label,
                price: Number(option.price) || 0,
                note: option.note ?? '',
              };
              const file = option.imageField
                ? personalizationImageFiles![option.imageField]
                : undefined;

              if (!file) {
                return { ...baseOption, image: null };
              }

              const uploaded = await this.cloudinaryService.uploadImage(
                file,
                'products/personalization',
              );

              return { ...baseOption, image: uploaded };
            }),
          );
        } else {
          // No images attached at all — just keep labels, drop the imageField reference
          productData.personalization = productData.personalization.map(
            (option: any) => ({
              label: option.label,
              price: Number(option.price) || 0,
              note: option.note ?? '',
              image: null,
            }),
          );
        }
      }

      const product = await this.productModel.create(productData);

      return {
        success: true,
        message: 'Product created successfully',
        data: product,
      };
    } catch (error) {
      if (this.isDuplicateProductNameError(error)) {
        throw new BadRequestException(this.duplicateProductNameMessage);
      }

      throw new BadRequestException(error instanceof Error ? error.message : String(error));
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
      await Promise.all([
        this.productModel.updateMany(
          { stock: { $gt: 10 }, status: { $ne: 'In Stock' } },
          { $set: { status: 'In Stock' } },
        ),
        this.productModel.updateMany(
          { stock: { $gt: 4, $lte: 10 }, status: { $ne: 'Low Stock' } },
          { $set: { status: 'Low Stock' } },
        ),
        this.productModel.updateMany(
          { stock: { $lte: 4 }, status: { $ne: 'Out of Stock' } },
          { $set: { status: 'Out of Stock' } },
        ),
      ]);

      const skip = (page - 1) * limit;
      const filters: any = {};

      if (search) {
        filters.$or = [
          { productName: { $regex: search, $options: 'i' } },
          { productId: { $regex: search, $options: 'i' } },
        ];
      }

      if (category) filters.category = category;
      if (status) filters.status = status;

      if (minPrice !== undefined || maxPrice !== undefined) {
        filters.price = {};
        if (minPrice !== undefined) filters.price.$gte = minPrice;
        if (maxPrice !== undefined) filters.price.$lte = maxPrice;
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
      throw new BadRequestException(error instanceof Error ? error.message : String(error));
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
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException(error instanceof Error ? error.message : String(error));
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

      const updateData: any = { ...updateProductDto };

      if (
        updateProductDto.productId &&
        updateProductDto.productId !== product.productId
      ) {
        const normalizedProductId = this.normalizeName(updateProductDto.productId);
        const existingProduct = await this.productModel.findOne({
          productId: normalizedProductId,
        });

        if (existingProduct) {
          throw new BadRequestException('Product with this SKU already exists');
        }

        updateData.productId = normalizedProductId;
      }

      if (updateProductDto.productName !== undefined) {
        const normalizedProductName = this.normalizeName(
          updateProductDto.productName,
        );
        const normalizedProductNameKey = this.normalizeNameKey(
          updateProductDto.productName,
        );

        const existingProductByName = await this.findProductByName(
          normalizedProductName,
          id,
        );

        if (existingProductByName) {
          throw new BadRequestException(this.duplicateProductNameMessage);
        }

        updateData.productName = normalizedProductName;
        updateData.productNameKey = normalizedProductNameKey;
      }

      let stockHistoryEntry: { previousStock: number; newStock: number; changedBy: string; changedAt: Date } | null = null;

      if (updateData.stock !== undefined) {
        const newStock = Number(updateData.stock) || 0;
        if (newStock !== product.stock) {
          stockHistoryEntry = {
            previousStock: product.stock,
            newStock,
            changedBy: 'Admin',
            changedAt: new Date(),
          };
        }
        updateData.stock = newStock;
        updateData.status = this.getStockStatus(newStock);
      }

      if (updateData.price !== undefined) {
        updateData.price = Number(updateData.price) || 0;
      }

      if (primaryImageFile) {
        if (product.primaryImage?.public_id) {
          await this.cloudinaryService.deleteImage(product.primaryImage.public_id);
        }

        updateData.primaryImage = await this.cloudinaryService.uploadImage(
          primaryImageFile,
          'products/primary',
        );
      }

      if (galleryImageFiles && galleryImageFiles.length > 0) {
        if (product.galleryImages && product.galleryImages.length > 0) {
          const publicIds = product.galleryImages.map((img) => img.public_id);
          await this.cloudinaryService.deleteMultipleImages(publicIds);
        }

        updateData.galleryImages =
          await this.cloudinaryService.uploadMultipleImages(
            galleryImageFiles,
            'products/gallery',
          );
      }

      updateData.updatedAt = new Date();

      const updateOps: any = { $set: updateData };
      if (stockHistoryEntry) {
        updateOps.$push = { stockHistory: stockHistoryEntry };
      }

      const updatedProduct = await this.productModel.findByIdAndUpdate(
        id,
        updateOps,
        { new: true },
      );

      return {
        success: true,
        message: 'Product updated successfully',
        data: updatedProduct,
      };
    } catch (error) {
      if (this.isDuplicateProductNameError(error)) {
        throw new BadRequestException(this.duplicateProductNameMessage);
      }

      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException(error instanceof Error ? error.message : String(error));
    }
  }

  async reduceStock(productId: string, quantity: number) {
    const product = await this.productModel.findById(productId).exec();

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const orderQuantity = Number(quantity) || 0;

    if (orderQuantity <= 0) {
      throw new BadRequestException('Invalid quantity');
    }

    if (product.stock < orderQuantity) {
      throw new BadRequestException('Not enough stock available');
    }

    const previousStock = product.stock;
    product.stock = product.stock - orderQuantity;
    product.status = this.getStockStatus(product.stock);
    product.updatedAt = new Date();
    product.stockHistory.push({
      previousStock,
      newStock: product.stock,
      changedBy: 'System (Order)',
      changedAt: new Date(),
    });

    await product.save();

    return product;
  }

  async delete(id: string) {
    try {
      const product = await this.productModel.findById(id).exec();

      if (!product) {
        throw new NotFoundException(`Product with ID ${id} not found`);
      }

      const imagePublicIds: string[] = [];

      if (product.primaryImage?.public_id) {
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

      await this.productModel.findByIdAndDelete(id).exec();

      return {
        success: true,
        message: 'Product deleted successfully',
        data: { deletedId: id },
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException(error instanceof Error ? error.message : String(error));
    }
  }

  async getStockLog(id: string) {
    try {
      const product = await this.productModel
        .findById(id)
        .select('stockHistory productName productId')
        .exec();

      if (!product) {
        throw new NotFoundException(`Product with ID ${id} not found`);
      }

      const log = [...(product.stockHistory || [])].reverse();

      return {
        success: true,
        message: 'Stock log retrieved successfully',
        data: log,
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException(error instanceof Error ? error.message : String(error));
    }
  }

  async deleteImage(productId: string, publicId: string) {
    try {
      const product = await this.productModel.findById(productId).exec();

      if (!product) {
        throw new NotFoundException(`Product with ID ${productId} not found`);
      }

      await this.cloudinaryService.deleteImage(publicId);

      if (product.primaryImage?.public_id === publicId) {
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
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException(error instanceof Error ? error.message : String(error));
    }
  }
}
