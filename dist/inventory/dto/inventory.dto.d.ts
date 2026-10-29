export declare class CreateInventoryItemDto {
    id?: string;
    name: string;
    stock?: number;
    unitValue?: number;
    role?: string;
    history?: Record<string, any>[];
}
export declare class UpdateInventoryItemDto {
    name?: string;
    stock?: number;
    unitValue?: number;
    role?: string;
    history?: Record<string, any>[];
}
export declare class AdjustStockDto {
    change: number;
    role?: string;
}
