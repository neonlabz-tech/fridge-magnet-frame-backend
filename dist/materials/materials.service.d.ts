import { Model } from 'mongoose';
import { ProductMaterialsDocument } from './schemas/material.schema';
import { SaveMaterialsDto } from './dto/material.dto';
export declare class MaterialsService {
    private readonly model;
    constructor(model: Model<ProductMaterialsDocument>);
    findAll(): Promise<{
        data: {
            [k: string]: import("./schemas/material.schema").MaterialLine[];
        };
        total: number;
    }>;
    findOne(productKey: string): Promise<{
        data: import("./schemas/material.schema").MaterialLine[];
    }>;
    save(productKey: string, dto: SaveMaterialsDto): Promise<{
        message: string;
        data: import("./schemas/material.schema").MaterialLine[];
    }>;
    remove(productKey: string): Promise<{
        message: string;
    }>;
}
