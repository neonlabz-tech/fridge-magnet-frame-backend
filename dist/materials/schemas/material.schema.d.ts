import { Document } from 'mongoose';
export type ProductMaterialsDocument = ProductMaterials & Document;
export interface MaterialLine {
    inventoryId: string;
    qty: number;
}
export declare class ProductMaterials {
    productKey: string;
    items: MaterialLine[];
}
export declare const ProductMaterialsSchema: import("mongoose").Schema<ProductMaterials, import("mongoose").Model<ProductMaterials, any, any, any, any, any, ProductMaterials>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, ProductMaterials, Document<unknown, {}, ProductMaterials, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<ProductMaterials & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, "id"> & import("mongoose").HydratedDocumentOverrides<{
    id: string;
}>, {
    productKey?: import("mongoose").SchemaDefinitionProperty<string, ProductMaterials, Document<unknown, {}, ProductMaterials, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<ProductMaterials & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    items?: import("mongoose").SchemaDefinitionProperty<MaterialLine[], ProductMaterials, Document<unknown, {}, ProductMaterials, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<ProductMaterials & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
}, ProductMaterials>;
