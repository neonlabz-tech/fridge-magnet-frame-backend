import { InventoryService } from './inventory.service';
import { AdjustStockDto, CreateInventoryItemDto, UpdateInventoryItemDto } from './dto/inventory.dto';
export declare class InventoryController {
    private readonly inventoryService;
    constructor(inventoryService: InventoryService);
    findAll(search?: string, status?: string): Promise<{
        data: (import("mongoose").Document<unknown, {}, import("./schemas/inventory.schema").InventoryItemDocument, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/inventory.schema").InventoryItem & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
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
    findOne(id: string): Promise<import("mongoose").Document<unknown, {}, import("./schemas/inventory.schema").InventoryItemDocument, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/inventory.schema").InventoryItem & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }>;
    create(dto: CreateInventoryItemDto): Promise<{
        message: string;
        data: import("mongoose").Document<unknown, {}, import("./schemas/inventory.schema").InventoryItemDocument, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/inventory.schema").InventoryItem & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        };
    }>;
    adjust(id: string, dto: AdjustStockDto): Promise<{
        message: string;
        data: import("mongoose").Document<unknown, {}, import("./schemas/inventory.schema").InventoryItemDocument, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/inventory.schema").InventoryItem & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        };
    }>;
    update(id: string, dto: UpdateInventoryItemDto): Promise<{
        message: string;
        data: import("mongoose").Document<unknown, {}, import("./schemas/inventory.schema").InventoryItemDocument, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/inventory.schema").InventoryItem & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        };
    }>;
    replace(id: string, dto: UpdateInventoryItemDto): Promise<{
        message: string;
        data: import("mongoose").Document<unknown, {}, import("./schemas/inventory.schema").InventoryItemDocument, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/inventory.schema").InventoryItem & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        };
    }>;
    remove(id: string): Promise<{
        message: string;
        data: import("mongoose").Document<unknown, {}, import("./schemas/inventory.schema").InventoryItemDocument, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/inventory.schema").InventoryItem & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        };
    }>;
}
