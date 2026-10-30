import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { cleanJson } from '../../common/utils/clean-json';

export type LeadDocument = Lead & Document;
export type LeadTargetDocument = LeadTarget & Document;
export type CommissionTierDocument = CommissionTier & Document;

export const LEAD_STATUSES = [
  'New',
  'Connected',
  'Interested',
  'Not interested',
  'Call back',
  'Order discussion',
  'No response',
  'Follow Up',
  'Lost',
  'Converted',
] as const;

export interface FollowUp {
  n: number;
  at: string;
  by: string;
  callStatus: string;
  result: string;
  product: string;
  notes: string;
  nextFollowUp: string;
  system?: boolean;
  edits?: { at: string; by: string; before: string }[];
}

export interface LeadOrderInfo {
  product: string;
  quantity: number;
  unitPrice: number;
  total: number;
  address: string;
  phone: string;
  convertedAt: string;
}

@Schema({ timestamps: true, toJSON: cleanJson() })
export class Lead {
  /** e.g. ML001 */
  @Prop({ required: true, unique: true })
  id!: string;

  @Prop({ required: true })
  dateAdded!: string;

  @Prop({ required: true, trim: true })
  business!: string;

  @Prop({ default: '' })
  phone!: string;

  @Prop({ default: 'Other' })
  source!: string;

  @Prop({ default: 'Not Contacted' })
  callStatus!: string;

  @Prop({ default: '' })
  result!: string;

  @Prop({ default: '' })
  product!: string;

  @Prop({ required: true, enum: LEAD_STATUSES, default: 'New' })
  status!: string;

  @Prop({ default: '' })
  nextFollowUp!: string;

  /** Who added the lead (username, or 'admin'). */
  @Prop({ default: '' })
  addedBy!: string;

  /** Username of the assigned operator, or '' when unassigned. */
  @Prop({ default: '' })
  owner!: string;

  @Prop({ default: '' })
  email!: string;

  @Prop({ default: '' })
  address!: string;

  @Prop({ default: '' })
  notes!: string;

  @Prop({ type: [Object], default: [] })
  history!: FollowUp[];

  /** CL-001, set once the lead converts. */
  @Prop()
  customerId?: string;

  @Prop({ type: Object })
  order?: LeadOrderInfo;
}

export const LeadSchema = SchemaFactory.createForClass(Lead);
LeadSchema.index({ owner: 1, status: 1 });

@Schema({ timestamps: true, toJSON: cleanJson() })
export class LeadTarget {
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  username!: string;

  @Prop({ default: 0 })
  monthlyOrders!: number;

  @Prop({ default: 0 })
  salesAmount!: number;

  @Prop({ default: 0 })
  dailyCalls!: number;

  @Prop({ default: 0 })
  dailyLeads!: number;
}

export const LeadTargetSchema = SchemaFactory.createForClass(LeadTarget);

/** A commission slab: monthly verified paid sales from `minSales` upward earn `rate` %. */
@Schema({ timestamps: true, toJSON: cleanJson() })
export class CommissionTier {
  @Prop({ required: true, unique: true })
  id!: string;

  @Prop({ required: true, min: 0 })
  minSales!: number;

  @Prop({ required: true, min: 0, max: 100 })
  rate!: number;
}

export const CommissionTierSchema = SchemaFactory.createForClass(CommissionTier);
