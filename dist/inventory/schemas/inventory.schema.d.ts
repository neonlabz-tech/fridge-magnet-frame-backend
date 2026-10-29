import { Document } from 'mongoose';
export type InventoryItemDocument = InventoryItem & Document;
export declare const LOW_STOCK_LIMIT = 50;
export interface StockLogEntry {
    at: string;
    role: string;
    change: number;
    totalValue: number;
}
export declare class InventoryItem {
    id: string;
    name: string;
    stock: number;
    unitValue: number;
    history: StockLogEntry[];
}
export declare const InventoryItemSchema: import("mongoose").Schema<InventoryItem, import("mongoose").Model<InventoryItem, any, any, any, any, any, InventoryItem>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, InventoryItem, Document<unknown, {}, InventoryItem, {}, import("mongoose").DefaultSchemaOptions> & InventoryItem & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, {
    id?: import("mongoose").SchemaDefinitionProperty<string, InventoryItem, Document<unknown, {}, InventoryItem, {}, import("mongoose").DefaultSchemaOptions> & InventoryItem & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }> | undefined;
    name?: import("mongoose").SchemaDefinitionProperty<string, InventoryItem, Document<unknown, {}, InventoryItem, {}, import("mongoose").DefaultSchemaOptions> & InventoryItem & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }> | undefined;
    stock?: import("mongoose").SchemaDefinitionProperty<number, InventoryItem, Document<unknown, {}, InventoryItem, {}, import("mongoose").DefaultSchemaOptions> & InventoryItem & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }> | undefined;
    unitValue?: import("mongoose").SchemaDefinitionProperty<number, InventoryItem, Document<unknown, {}, InventoryItem, {}, import("mongoose").DefaultSchemaOptions> & InventoryItem & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }> | undefined;
    history?: import("mongoose").SchemaDefinitionProperty<StockLogEntry[], InventoryItem, Document<unknown, {}, InventoryItem, {}, import("mongoose").DefaultSchemaOptions> & InventoryItem & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }> | undefined;
}, InventoryItem>;
