import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type OrderDocument = Order & Document;

export enum OrderStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELED = 'CANCELED',
}

@Schema({ timestamps: true })
export class Order {
  @Prop({ required: true, unique: true })
  orderId!: string;

  @Prop({ required: true })
  customerName!: string;

  @Prop({ required: true })
  customerId!: string;

  @Prop({ required: true })
  email!: string;

  @Prop()
  phone?: string;

  @Prop({ required: true })
  qty!: number;

  @Prop({ required: true })
  totalValue!: number;

  @Prop({ default: 0 })
  deliveryFee!: number;

  @Prop({ default: OrderStatus.PENDING })
  status!: OrderStatus;

  /** When the order was marked DELIVERED (starts the customer-photo retention period). */
  @Prop()
  deliveredAt?: Date;

  /** Set once the customer's uploaded photos were removed from storage. */
  @Prop()
  imagesDeletedAt?: Date;

  @Prop()
  adminNote?: string;

  @Prop()
  paymentMethod?: string;

  @Prop({ default: 'pending', enum: ['paid', 'pending', 'failed', 'refunded'] })
  paymentStatus!: string;

  @Prop()
  shippingAddress?: string;

  @Prop()
  district?: string;

  @Prop({ type: [Object], default: [] })
  items?: {
    productId?: string;
    sku?: string;
    name?: string;
    price?: number;
    quantity?: number;
    uploadedImages?: string[];
    primaryImage?: string;
    frameType?: string;
    colorOption?: string;
  }[];
}

export const OrderSchema = SchemaFactory.createForClass(Order);
