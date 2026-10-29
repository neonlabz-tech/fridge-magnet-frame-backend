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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductsController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const products_service_1 = require("./products.service");
const create_product_dto_1 = require("./dto/create-product.dto");
const update_product_dto_1 = require("./dto/update-product.dto");
let ProductsController = class ProductsController {
    constructor(productsService) {
        this.productsService = productsService;
    }
    normalizePersonalization(input) {
        if (Array.isArray(input)) {
            return input.map((item) => typeof item === 'string' ? { label: item } : { label: item?.label ?? '' });
        }
        if (typeof input === 'string') {
            const value = input.trim();
            if (!value)
                return [];
            try {
                const parsed = JSON.parse(value);
                if (Array.isArray(parsed)) {
                    return parsed.map((item) => typeof item === 'string' ? { label: item } : { label: item?.label ?? '' });
                }
            }
            catch {
                return value
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean)
                    .map((label) => ({ label }));
            }
            return [{ label: value }];
        }
        if (input === undefined || input === null) {
            return [];
        }
        return [{ label: String(input) }];
    }
    async create(createProductDto, files) {
        const trimmedDto = {};
        for (const key in createProductDto) {
            const trimmedKey = key.trim();
            trimmedDto[trimmedKey] = createProductDto[key];
        }
        const personalizationLabels = this.normalizePersonalization(trimmedDto.personalization);
        const personalizationWithFiles = personalizationLabels.map((item, index) => ({
            label: item.label,
            imageFile: files?.personalizationImages?.[index] ?? null,
        }));
        const parsedDto = {
            ...trimmedDto,
            stock: trimmedDto.stock ? Number(trimmedDto.stock) : 0,
            price: trimmedDto.price ? Number(trimmedDto.price) : 0,
            imagecount: trimmedDto.imagecount ? Number(trimmedDto.imagecount) : 0,
            personalizationEnabled: trimmedDto.personalizationEnabled === true ||
                trimmedDto.personalizationEnabled === 'true',
        };
        delete parsedDto.personalization;
        return this.productsService.create(parsedDto, files?.primaryImage?.[0], files?.galleryImages, personalizationWithFiles);
    }
    async addGalleryImages(id, galleryImages) {
        const product = await this.productsService.findOne(id);
        const updateDto = {};
        return this.productsService.update(id, updateDto, undefined, galleryImages);
    }
    async findAll(page = '1', limit = '100', search, category, status, minPrice, maxPrice) {
        const pageNum = parseInt(page, 10) || 1;
        const limitNum = parseInt(limit, 100) || 100;
        const minPriceNum = minPrice ? parseFloat(minPrice) : undefined;
        const maxPriceNum = maxPrice ? parseFloat(maxPrice) : undefined;
        return this.productsService.findAll(pageNum, limitNum, search, category, status, minPriceNum, maxPriceNum);
    }
    async getStockLog(id) {
        return this.productsService.getStockLog(id);
    }
    async findOne(id) {
        return this.productsService.findOne(id);
    }
    async update(id, updateProductDto, files) {
        const trimmedDto = {};
        for (const key in updateProductDto) {
            const trimmedKey = key.trim();
            trimmedDto[trimmedKey] = updateProductDto[key];
        }
        const parsedDto = { ...trimmedDto };
        if (trimmedDto.stock !== undefined) {
            parsedDto.stock = Number(trimmedDto.stock) || 0;
        }
        if (trimmedDto.price !== undefined) {
            parsedDto.price = Number(trimmedDto.price) || 0;
        }
        if (trimmedDto.imagecount !== undefined) {
            parsedDto.imagecount = Number(trimmedDto.imagecount) || 0;
        }
        if (trimmedDto.personalizationEnabled !== undefined) {
            parsedDto.personalizationEnabled =
                trimmedDto.personalizationEnabled === true ||
                    trimmedDto.personalizationEnabled === 'true';
        }
        let personalizationWithFiles;
        if (trimmedDto.personalization !== undefined) {
            const personalizationLabels = this.normalizePersonalization(trimmedDto.personalization);
            personalizationWithFiles = personalizationLabels.map((item, index) => ({
                label: item.label,
                imageFile: files?.personalizationImages?.[index] ?? null,
            }));
            delete parsedDto.personalization;
        }
        return this.productsService.update(id, parsedDto, files?.primaryImage?.[0], undefined, personalizationWithFiles);
    }
    async delete(id) {
        return this.productsService.delete(id);
    }
    async deleteImage(productId, publicId) {
        return this.productsService.deleteImage(productId, publicId);
    }
};
exports.ProductsController = ProductsController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileFieldsInterceptor)([
        { name: 'primaryImage', maxCount: 1 },
        { name: 'galleryImages', maxCount: 5 },
        { name: 'personalizationImages', maxCount: 10 },
    ], { storage: (0, multer_1.memoryStorage)() })),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.UploadedFiles)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_product_dto_1.CreateProductDto, Object]),
    __metadata("design:returntype", Promise)
], ProductsController.prototype, "create", null);
__decorate([
    (0, common_1.Post)(':id/gallery'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FilesInterceptor)('galleryImages', 10, { storage: (0, multer_1.memoryStorage)() })),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.UploadedFiles)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Array]),
    __metadata("design:returntype", Promise)
], ProductsController.prototype, "addGalleryImages", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('search')),
    __param(3, (0, common_1.Query)('category')),
    __param(4, (0, common_1.Query)('status')),
    __param(5, (0, common_1.Query)('minPrice')),
    __param(6, (0, common_1.Query)('maxPrice')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], ProductsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id/stock-log'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ProductsController.prototype, "getStockLog", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ProductsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileFieldsInterceptor)([
        { name: 'primaryImage', maxCount: 1 },
        { name: 'personalizationImages', maxCount: 10 },
    ], { storage: (0, multer_1.memoryStorage)() })),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.UploadedFiles)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_product_dto_1.UpdateProductDto, Object]),
    __metadata("design:returntype", Promise)
], ProductsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ProductsController.prototype, "delete", null);
__decorate([
    (0, common_1.Delete)(':productId/image/:publicId'),
    __param(0, (0, common_1.Param)('productId')),
    __param(1, (0, common_1.Param)('publicId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ProductsController.prototype, "deleteImage", null);
exports.ProductsController = ProductsController = __decorate([
    (0, common_1.Controller)('products'),
    __metadata("design:paramtypes", [products_service_1.ProductsService])
], ProductsController);
//# sourceMappingURL=products.controller.js.map