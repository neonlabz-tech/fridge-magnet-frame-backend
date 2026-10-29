import { MaterialsService } from './materials.service';
import { SaveMaterialsDto } from './dto/material.dto';
export declare class MaterialsController {
    private readonly materialsService;
    constructor(materialsService: MaterialsService);
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
