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
  orderId: string;

  @Prop({ required: true })
  customerName: string;

  @Prop({ required: true })
  customerId: string;

  @Prop({ required: true })
  email: string;

  @Prop()
  phone?: string;

  @Prop({ required: true })
  qty: number;

  @Prop({ required: true })
  totalValue: number;

  @Prop({ default: OrderStatus.PENDING })
  status: OrderStatus;

  @Prop()
  adminNote?: string;

  @Prop()
  shippingAddress?: string;

  @Prop()
  district?: string;

  @Prop({ type: [Object], default: [] })
  items?: {
    productId?: string;
    name?: string;
    price?: number;
    quantity?: number;
    image?: string;
    frameType?: string;
    colorOption?: string;
  }[];
}

export const OrderSchema = SchemaFactory.createForClass(Order);
