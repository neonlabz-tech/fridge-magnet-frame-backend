import { Model } from 'mongoose';
import { InventoryItem, InventoryItemDocument } from './schemas/inventory.schema';
import { AdjustStockDto, CreateInventoryItemDto, UpdateInventoryItemDto } from './dto/inventory.dto';
export declare class InventoryService {
    private readonly model;
    constructor(model: Model<InventoryItemDocument>);
    private statusFilter;
    findAll(search?: string, status?: string): Promise<{
        data: (import("mongoose").Document<unknown, {}, InventoryItemDocument, {}, import("mongoose").DefaultSchemaOptions> & InventoryItem & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        })[];
        total: number;
        summary: {
            totalItems: number;
            lowStock: number;
            outOfStock: number;
        };
    }>;
    findOne(id: string): Promise<import("mongoose").Document<unknown, {}, InventoryItemDocument, {}, import("mongoose").DefaultSchemaOptions> & InventoryItem & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }>;
    create(dto: CreateInventoryItemDto): Promise<{
        message: string;
        data: import("mongoose").Document<unknown, {}, InventoryItemDocument, {}, import("mongoose").DefaultSchemaOptions> & InventoryItem & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        };
    }>;
    update(id: string, dto: UpdateInventoryItemDto): Promise<{
        message: string;
        data: import("mongoose").Document<unknown, {}, InventoryItemDocument, {}, import("mongoose").DefaultSchemaOptions> & InventoryItem & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        };
    }>;
    adjustStock(id: string, dto: AdjustStockDto): Promise<{
        message: string;
        data: import("mongoose").Document<unknown, {}, InventoryItemDocument, {}, import("mongoose").DefaultSchemaOptions> & InventoryItem & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        };
    }>;
    remove(id: string): Promise<{
        message: string;
        data: import("mongoose").Document<unknown, {}, InventoryItemDocument, {}, import("mongoose").DefaultSchemaOptions> & InventoryItem & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        };
    }>;
}
