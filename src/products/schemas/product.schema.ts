import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ProductDocument = Product & Document;

@Schema({ timestamps: true })
export class Product {
  @Prop({ required: true })
  productName: string;

  @Prop({ required: true, unique: true })
  productId: string; // SKU

  @Prop({ required: true })
  category: string;

  @Prop({ required: true, default: 0 })
  stock: number;

  @Prop({ required: true })
  price: number;

  @Prop({ required: true })
  description: string;

  @Prop({ default: false })
  personalizationEnabled: boolean;

  @Prop({ type: [String], default: [] })
  personalization: string[];

  @Prop({
    required: true,
    enum: ['In Stock', 'Low Stock', 'Out of Stock'],
    default: 'In Stock',
  })
  status: string;

  @Prop({
    type: {
      secure_url: String,
      public_id: String,
    },
    default: null,
  })
  primaryImage:
    | {
        secure_url: string;
        public_id: string;
      }
    | null;

  @Prop({
    type: [
      {
        secure_url: String,
        public_id: String,
      },
    ],
    default: [],
  })
  galleryImages: Array<{
    secure_url: string;
    public_id: string;
  }>;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @Prop({ type: Date, default: Date.now })
  updatedAt: Date;
}

export const ProductSchema = SchemaFactory.createForClass(Product);