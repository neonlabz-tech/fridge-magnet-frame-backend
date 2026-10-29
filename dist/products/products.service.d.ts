import { Model } from 'mongoose';
import { Product, ProductDocument } from './schemas/product.schema';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CloudflareR2Service } from '../cloudflareR2/cloudflareR2.service';
interface PersonalizationInput {
    label: string;
    imageFile: Express.Multer.File | null;
}
export declare class ProductsService {
    private productModel;
    private cloudflareR2Service;
    private readonly logger;
    private readonly duplicateProductNameMessage;
    constructor(productModel: Model<ProductDocument>, cloudflareR2Service: CloudflareR2Service);
    private getStockStatus;
    private normalizePersonalization;
    private escapeRegex;
    private normalizeName;
    private normalizeNameKey;
    private findProductByName;
    private isDuplicateProductNameError;
    create(createProductDto: CreateProductDto, primaryImageFile?: Express.Multer.File, galleryImageFiles?: Express.Multer.File[], personalizationInputs?: PersonalizationInput[]): Promise<{
        success: boolean;
        message: string;
        data: import("mongoose").Document<unknown, {}, ProductDocument, {}, import("mongoose").DefaultSchemaOptions> & Product & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        } & {
            id: string;
        };
    }>;
    findAll(page?: number, limit?: number, search?: string, category?: string, status?: string, minPrice?: number, maxPrice?: number): Promise<{
        success: boolean;
        message: string;
        data: {
            products: (import("mongoose").Document<unknown, {}, ProductDocument, {}, import("mongoose").DefaultSchemaOptions> & Product & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
                _id: import("mongoose").Types.ObjectId;
            }> & {
                __v: number;
            } & {
                id: string;
            })[];
            pagination: {
                page: number;
                limit: number;
                total: number;
                pages: number;
            };
        };
    }>;
    findOne(id: string): Promise<{
        success: boolean;
        message: string;
        data: import("mongoose").Document<unknown, {}, ProductDocument, {}, import("mongoose").DefaultSchemaOptions> & Product & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        } & {
            id: string;
        };
    }>;
    update(id: string, updateProductDto: UpdateProductDto, primaryImageFile?: Express.Multer.File, galleryImageFiles?: Express.Multer.File[], personalizationInputs?: PersonalizationInput[]): Promise<{
        success: boolean;
        message: string;
        data: (import("mongoose").Document<unknown, {}, ProductDocument, {}, import("mongoose").DefaultSchemaOptions> & Product & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        } & {
            id: string;
        }) | null;
    }>;
    reduceStock(productId: string, quantity: number): Promise<import("mongoose").Document<unknown, {}, ProductDocument, {}, import("mongoose").DefaultSchemaOptions> & Product & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    delete(id: string): Promise<{
        success: boolean;
        message: string;
        data: {
            deletedId: string;
        };
    }>;
    getStockLog(id: string): Promise<{
        success: boolean;
        message: string;
        data: {
            previousStock: number;
            newStock: number;
            changedBy: string;
            changedAt: Date;
        }[];
    }>;
    deleteImage(productId: string, publicId: string): Promise<{
        success: boolean;
        message: string;
        data: import("mongoose").Document<unknown, {}, ProductDocument, {}, import("mongoose").DefaultSchemaOptions> & Product & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        } & {
            id: string;
        };
    }>;
}
export {};
