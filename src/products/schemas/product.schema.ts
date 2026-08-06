import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ProductDocument = Product & Document;

@Schema({ timestamps: true })
export class Product {
  @Prop({ required: true })
  productName!: string;

  @Prop({ unique: true, sparse: true, trim: true, lowercase: true })
  productNameKey!: string;

  @Prop({ required: true, unique: true })
  productId!: string; // SKU

  // @Prop({ required: true })
  // category!: string;

  @Prop({ required: true, default: 0 })
  stock!: number;

  @Prop({ required: true })
  price!: number;

  @Prop({ required: true })
  imagecount!: number;

  @Prop({ required: true })
  description!: string;

  // @Prop({ default: false })
  // personalizationEnabled!: boolean;

  @Prop({
    type: [
      {
        label: { type: String, required: true },
        image: {
          type: {
            secure_url: { type: String },
            public_id: { type: String },
          },
          default: null,
        },
      },
    ],
    default: [],
  })
  personalization!: Array<{
    label: string;
    image: { secure_url: string; public_id: string } | null;
  }>;

  @Prop({
    required: true,
    enum: ['In Stock', 'Low Stock', 'Out of Stock'],
    default: 'In Stock',
  })
  status!: string;

  @Prop({
    type: {
      secure_url: String,
      public_id: String,
    },
    default: null,
  })
  primaryImage!:
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
  galleryImages!: Array<{
    secure_url: string;
    public_id: string;
  }>;

  @Prop({
    type: [
      {
        previousStock: { type: Number, required: true },
        newStock: { type: Number, required: true },
        changedBy: { type: String, default: 'Admin' },
        changedAt: { type: Date, default: Date.now },
      },
    ],
    default: [],
  })
  stockHistory!: Array<{
    previousStock: number;
    newStock: number;
    changedBy: string;
    changedAt: Date;
  }>;

  @Prop({ type: Date, default: Date.now })
  createdAt!: Date;

  @Prop({ type: Date, default: Date.now })
  updatedAt!: Date;
}

export const ProductSchema = SchemaFactory.createForClass(Product);

ProductSchema.index({ productNameKey: 1 }, { unique: true, sparse: true });