import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { cleanJson } from '../../common/utils/clean-json';

export type DeliveryDocument = Delivery & Document;

export const DELIVERY_STATUSES = ['pending', 'in-transit', 'delivered', 'returned'] as const;
export const DELIVERY_METHODS = ['Standard', 'Courier'] as const;

@Schema({ timestamps: true, toJSON: cleanJson() })
export class Delivery {
  /** e.g. MGD-260913 */
  @Prop({ required: true, unique: true })
  id!: string;

  @Prop({ required: true })
  orderId!: string;

  @Prop({ default: 0 })
  orderTotal!: number;

  @Prop({ required: true, enum: DELIVERY_METHODS, default: 'Standard' })
  method!: string;

  @Prop({ default: '' })
  tracking!: string;

  @Prop({ default: '' })
  driver!: string;

  @Prop({ default: '' })
  place!: string;

  @Prop({ default: '' })
  recipient!: string;

  @Prop({ default: '' })
  phone!: string;

  @Prop({ default: '' })
  address!: string;

  /** YYYY-MM-DD */
  @Prop({ default: '' })
  date!: string;

  @Prop({ default: '' })
  timeSlot!: string;

  @Prop({ required: true, enum: DELIVERY_STATUSES, default: 'pending' })
  status!: string;

  @Prop({ default: '' })
  vehicleType!: string;

  @Prop({ default: '' })
  licenseNo!: string;

  @Prop({ default: '' })
  plateNo!: string;

  @Prop({ default: '' })
  emergencyContact!: string;

  @Prop({ type: [String], default: [] })
  zones!: string[];
}

export const DeliverySchema = SchemaFactory.createForClass(Delivery);
DeliverySchema.index({ orderId: 1 });
DeliverySchema.index({ status: 1, date: -1 });
