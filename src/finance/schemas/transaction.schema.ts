import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { cleanJson } from '../../common/utils/clean-json';

export type TransactionDocument = Transaction & Document;

export const TX_KINDS = ['income', 'expense'] as const;
export const TX_METHODS = ['Bank Transfer', 'Cash', 'Card Payment'] as const;
export const TX_STATUSES = ['completed', 'pending'] as const;

@Schema({ timestamps: true, toJSON: cleanJson() })
export class Transaction {
  @Prop({ required: true, unique: true })
  id!: string;

  @Prop({ required: true, enum: TX_KINDS })
  kind!: string;

  /** YYYY-MM-DD */
  @Prop({ required: true })
  date!: string;

  @Prop({ default: '', trim: true })
  ref!: string;

  @Prop({ default: '', trim: true })
  party!: string;

  @Prop({ default: '', trim: true })
  note!: string;

  @Prop({ required: true, min: 0 })
  amount!: number;

  @Prop({ required: true, enum: TX_METHODS, default: 'Cash' })
  method!: string;

  @Prop({ required: true, enum: TX_STATUSES, default: 'completed' })
  status!: string;

  /** Username of the creator; missing means admin. */
  @Prop()
  createdBy?: string;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);
TransactionSchema.index({ kind: 1, date: -1 });
