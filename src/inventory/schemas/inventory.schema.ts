import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { cleanJson } from '../../common/utils/clean-json';

export type InventoryItemDocument = InventoryItem & Document;

export const LOW_STOCK_LIMIT = 50;

export interface StockLogEntry {
  at: string;
  role: string;
  change: number;
  totalValue: number;
}

@Schema({ timestamps: true, toJSON: cleanJson() })
export class InventoryItem {
  @Prop({ required: true, unique: true })
  id!: string;

  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ required: true, min: 0, default: 0 })
  stock!: number;

  @Prop({ required: true, min: 0, default: 0 })
  unitValue!: number;

  @Prop({ type: [Object], default: [] })
  history!: StockLogEntry[];
}

export const InventoryItemSchema = SchemaFactory.createForClass(InventoryItem);
