"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var ProductsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const product_schema_1 = require("./schemas/product.schema");
const cloudflareR2_service_1 = require("../cloudflareR2/cloudflareR2.service");
let ProductsService = ProductsService_1 = class ProductsService {
    constructor(productModel, cloudflareR2Service) {
        this.productModel = productModel;
        this.cloudflareR2Service = cloudflareR2Service;
        this.logger = new common_1.Logger(ProductsService_1.name);
        this.duplicateProductNameMessage = 'This product name is already used. Please use a different product name.';
    }
    getStockStatus(stock) {
        if (stock > 10)
            return 'In Stock';
        if (stock > 4)
            return 'Low Stock';
        return 'Out of Stock';
    }
    normalizePersonalization(raw) {
        if (!raw || !Array.isArray(raw))
            return [];
        return raw.map((item) => typeof item === 'string'
            ? { label: item, image: null }
            : { label: item?.label ?? '', image: item?.image ?? null });
    }
    escapeRegex(value) {
        return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    normalizeName(value) {
        return String(value ?? '').trim();
    }
    normalizeNameKey(value) {
        return this.normalizeName(value).toLowerCase();
    }
    async findProductByName(name, excludeId) {
        const normalizedName = this.normalizeName(name);
        const normalizedNameKey = this.normalizeNameKey(name);
        if (!normalizedName) {
            return null;
        }
        const query = {
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
    isDuplicateProductNameError(error) {
        if (!error || typeof error !== 'object' || !('code' in error)) {
            return false;
        }
        const mongoError = error;
        return (mongoError.code === 11000 &&
            (Boolean(mongoError.keyPattern?.productNameKey) ||
                Boolean(mongoError.keyValue?.productNameKey)));
    }
    async create(createProductDto, primaryImageFile, galleryImageFiles, personalizationInputs) {
        try {
            const normalizedProductName = this.normalizeName(createProductDto.productName);
            const normalizedProductNameKey = this.normalizeNameKey(createProductDto.productName);
            const normalizedProductId = this.normalizeName(createProductDto.productId);
            const existingProduct = await this.productModel.findOne({
                productId: normalizedProductId,
            });
            if (existingProduct) {
                throw new common_1.BadRequestException('Product with this SKU already exists');
            }
            const existingProductByName = await this.findProductByName(normalizedProductName);
            if (existingProductByName) {
                throw new common_1.BadRequestException(this.duplicateProductNameMessage);
            }
            const productData = {
                ...createProductDto,
                productName: normalizedProductName,
                productNameKey: normalizedProductNameKey,
                productId: normalizedProductId,
            };
            productData.stock = Number(productData.stock) || 0;
            productData.price = Number(productData.price) || 0;
            productData.status = this.getStockStatus(productData.stock);
            if (primaryImageFile) {
                productData.primaryImage = await this.cloudflareR2Service.uploadImage(primaryImageFile, 'products/primary');
            }
            if (galleryImageFiles && galleryImageFiles.length > 0) {
                productData.galleryImages =
                    await this.cloudflareR2Service.uploadMultipleImages(galleryImageFiles, 'products/gallery');
            }
            if (personalizationInputs && personalizationInputs.length > 0) {
                productData.personalization = await Promise.all(personalizationInputs.map(async (item) => {
                    if (!item.imageFile) {
                        return { label: item.label, image: null };
                    }
                    const uploaded = await this.cloudflareR2Service.uploadImage(item.imageFile, 'products/personalization');
                    return {
                        label: item.label,
                        image: {
                            secure_url: uploaded.secure_url,
                            public_id: uploaded.public_id,
                        },
                    };
                }));
            }
            else {
                productData.personalization = [];
            }
            const product = await this.productModel.create(productData);
            return {
                success: true,
                message: 'Product created successfully',
                data: product,
            };
        }
        catch (error) {
            if (this.isDuplicateProductNameError(error)) {
                throw new common_1.BadRequestException(this.duplicateProductNameMessage);
            }
            throw new common_1.BadRequestException(error instanceof Error ? error.message : String(error));
        }
    }
    async findAll(page = 1, limit = 10, search, category, status, minPrice, maxPrice) {
        try {
            await Promise.all([
                this.productModel.updateMany({ stock: { $gt: 10 }, status: { $ne: 'In Stock' } }, { $set: { status: 'In Stock' } }),
                this.productModel.updateMany({ stock: { $gt: 4, $lte: 10 }, status: { $ne: 'Low Stock' } }, { $set: { status: 'Low Stock' } }),
                this.productModel.updateMany({ stock: { $lte: 4 }, status: { $ne: 'Out of Stock' } }, { $set: { status: 'Out of Stock' } }),
            ]);
            const skip = (page - 1) * limit;
            const filters = {};
            if (search) {
                filters.$or = [
                    { productName: { $regex: search, $options: 'i' } },
                    { productId: { $regex: search, $options: 'i' } },
                ];
            }
            if (category)
                filters.category = category;
            if (status)
                filters.status = status;
            if (minPrice !== undefined || maxPrice !== undefined) {
                filters.price = {};
                if (minPrice !== undefined)
                    filters.price.$gte = minPrice;
                if (maxPrice !== undefined)
                    filters.price.$lte = maxPrice;
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
        }
        catch (error) {
            throw new common_1.BadRequestException(error instanceof Error ? error.message : String(error));
        }
    }
    async findOne(id) {
        try {
            const product = await this.productModel.findById(id).exec();
            if (!product) {
                throw new common_1.NotFoundException(`Product with ID ${id} not found`);
            }
            return {
                success: true,
                message: 'Product retrieved successfully',
                data: product,
            };
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException)
                throw error;
            throw new common_1.BadRequestException(error instanceof Error ? error.message : String(error));
        }
    }
    async update(id, updateProductDto, primaryImageFile, galleryImageFiles, personalizationInputs) {
        try {
            const product = await this.productModel.findById(id).exec();
            if (!product) {
                throw new common_1.NotFoundException(`Product with ID ${id} not found`);
            }
            const updateData = { ...updateProductDto };
            if (updateProductDto.productId &&
                updateProductDto.productId !== product.productId) {
                const normalizedProductId = this.normalizeName(updateProductDto.productId);
                const existingProduct = await this.productModel.findOne({
                    productId: normalizedProductId,
                });
                if (existingProduct) {
                    throw new common_1.BadRequestException('Product with this SKU already exists');
                }
                updateData.productId = normalizedProductId;
            }
            if (updateProductDto.productName !== undefined) {
                const normalizedProductName = this.normalizeName(updateProductDto.productName);
                const normalizedProductNameKey = this.normalizeNameKey(updateProductDto.productName);
                const existingProductByName = await this.findProductByName(normalizedProductName, id);
                if (existingProductByName) {
                    throw new common_1.BadRequestException(this.duplicateProductNameMessage);
                }
                updateData.productName = normalizedProductName;
                updateData.productNameKey = normalizedProductNameKey;
            }
            let stockHistoryEntry = null;
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
                    await this.cloudflareR2Service.deleteImage(product.primaryImage.public_id);
                }
                updateData.primaryImage = await this.cloudflareR2Service.uploadImage(primaryImageFile, 'products/primary');
            }
            if (galleryImageFiles && galleryImageFiles.length > 0) {
                const uploadedNewImages = await this.cloudflareR2Service.uploadMultipleImages(galleryImageFiles, 'products/gallery');
                updateData.galleryImages = [
                    ...(product.galleryImages || []),
                    ...uploadedNewImages,
                ];
            }
            if (personalizationInputs !== undefined) {
                const existingNormalized = this.normalizePersonalization(product.personalization);
                updateData.personalization = await Promise.all(personalizationInputs.map(async (item, index) => {
                    const existingEntry = existingNormalized[index];
                    if (!item.imageFile) {
                        return {
                            label: item.label,
                            image: existingEntry?.label === item.label ? existingEntry.image : null,
                        };
                    }
                    if (existingEntry?.image?.public_id) {
                        await this.cloudflareR2Service.deleteImage(existingEntry.image.public_id);
                    }
                    const uploaded = await this.cloudflareR2Service.uploadImage(item.imageFile, 'products/personalization');
                    return {
                        label: item.label,
                        image: {
                            secure_url: uploaded.secure_url,
                            public_id: uploaded.public_id,
                        },
                    };
                }));
                if (existingNormalized.length > personalizationInputs.length) {
                    const removedEntries = existingNormalized.slice(personalizationInputs.length);
                    await Promise.all(removedEntries
                        .filter((entry) => entry.image?.public_id)
                        .map((entry) => this.cloudflareR2Service.deleteImage(entry.image.public_id)));
                }
            }
            updateData.updatedAt = new Date();
            const updateOps = { $set: updateData };
            if (stockHistoryEntry) {
                updateOps.$push = { stockHistory: stockHistoryEntry };
            }
            const updatedProduct = await this.productModel.findByIdAndUpdate(id, updateOps, { new: true });
            return {
                success: true,
                message: 'Product updated successfully',
                data: updatedProduct,
            };
        }
        catch (error) {
            if (this.isDuplicateProductNameError(error)) {
                throw new common_1.BadRequestException(this.duplicateProductNameMessage);
            }
            if (error instanceof common_1.NotFoundException ||
                error instanceof common_1.BadRequestException) {
                throw error;
            }
            throw new common_1.BadRequestException(error instanceof Error ? error.message : String(error));
        }
    }
    async reduceStock(productId, quantity) {
        const product = await this.productModel.findById(productId).exec();
        if (!product) {
            throw new common_1.NotFoundException('Product not found');
        }
        const orderQuantity = Number(quantity) || 0;
        if (orderQuantity <= 0) {
            throw new common_1.BadRequestException('Invalid quantity');
        }
        if (product.stock < orderQuantity) {
            throw new common_1.BadRequestException('Not enough stock available');
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
    async delete(id) {
        try {
            const product = await this.productModel.findById(id).exec();
            if (!product) {
                throw new common_1.NotFoundException(`Product with ID ${id} not found`);
            }
            const imagePublicIds = [];
            if (product.primaryImage?.public_id) {
                imagePublicIds.push(product.primaryImage.public_id);
            }
            if (product.galleryImages && product.galleryImages.length > 0) {
                product.galleryImages.forEach((img) => {
                    imagePublicIds.push(img.public_id);
                });
            }
            const normalizedPersonalization = this.normalizePersonalization(product.personalization);
            normalizedPersonalization.forEach((entry) => {
                if (entry.image?.public_id) {
                    imagePublicIds.push(entry.image.public_id);
                }
            });
            if (imagePublicIds.length > 0) {
                try {
                    await this.cloudflareR2Service.deleteMultipleImages(imagePublicIds);
                }
                catch (error) {
                    this.logger.warn(`Product ${id} deleted from database, but image cleanup failed: ${error instanceof Error ? error.message : String(error)}`);
                }
            }
            await this.productModel.findByIdAndDelete(id).exec();
            return {
                success: true,
                message: 'Product deleted successfully',
                data: { deletedId: id },
            };
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException)
                throw error;
            throw new common_1.BadRequestException(error instanceof Error ? error.message : String(error));
        }
    }
    async getStockLog(id) {
        try {
            const product = await this.productModel
                .findById(id)
                .select('stockHistory productName productId')
                .exec();
            if (!product) {
                throw new common_1.NotFoundException(`Product with ID ${id} not found`);
            }
            const log = [...(product.stockHistory || [])].reverse();
            return {
                success: true,
                message: 'Stock log retrieved successfully',
                data: log,
            };
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException)
                throw error;
            throw new common_1.BadRequestException(error instanceof Error ? error.message : String(error));
        }
    }
    async deleteImage(productId, publicId) {
        try {
            const product = await this.productModel.findById(productId).exec();
            if (!product) {
                throw new common_1.NotFoundException(`Product with ID ${productId} not found`);
            }
            await this.cloudflareR2Service.deleteImage(publicId);
            if (product.primaryImage?.public_id === publicId) {
                product.primaryImage = null;
            }
            else if (product.galleryImages && product.galleryImages.length > 0) {
                product.galleryImages = product.galleryImages.filter((img) => img.public_id !== publicId);
            }
            else if (product.personalization && product.personalization.length > 0) {
                product.personalization = product.personalization.map((entry) => {
                    if (typeof entry === 'string')
                        return entry;
                    if (entry?.image?.public_id === publicId) {
                        return { label: entry.label, image: null };
                    }
                    return entry;
                });
            }
            product.updatedAt = new Date();
            await product.save();
            return {
                success: true,
                message: 'Image deleted successfully',
                data: product,
            };
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException)
                throw error;
            throw new common_1.BadRequestException(error instanceof Error ? error.message : String(error));
        }
    }
};
exports.ProductsService = ProductsService;
exports.ProductsService = ProductsService = ProductsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(product_schema_1.Product.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        cloudflareR2_service_1.CloudflareR2Service])
], ProductsService);
//# sourceMappingURL=products.service.js.map