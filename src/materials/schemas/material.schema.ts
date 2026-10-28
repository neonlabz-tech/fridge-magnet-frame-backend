import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { cleanJson } from '../../common/utils/clean-json';

export type ProductMaterialsDocument = ProductMaterials & Document;

export interface MaterialLine {
  inventoryId: string;
  qty: number;
}

/** Bill of materials: the inventory items (and quantities) used to make 1 unit of a product. */
@Schema({ timestamps: true, toJSON: cleanJson(), collection: 'productmaterials' })
export class ProductMaterials {
  /** Product SKU (falls back to the product id). */
  @Prop({ required: true, unique: true, trim: true })
  productKey!: string;

  @Prop({ type: [Object], default: [] })
  items!: MaterialLine[];
}

export const ProductMaterialsSchema = SchemaFactory.createForClass(ProductMaterials);
