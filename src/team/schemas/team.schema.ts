import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { cleanJson } from '../../common/utils/clean-json';

export type TeamMemberDocument = TeamMember & Document;
export type TeamRoleDocument = TeamRole & Document;

export const DEFAULT_ROLE_NAME = 'Business Operator';
export const TEAM_NAME = 'Business Operator';

/** Dashboard pages a role can be granted (mirrors the frontend PAGE_OPTIONS). */
export const PAGE_HREFS = [
  '/dashboard/orders',
  '/dashboard/customers',
  '/dashboard/products',
  '/dashboard/inventory',
  '/dashboard/deliveries',
  '/dashboard/leads',
  '/dashboard/targets',
  '/dashboard/finance',
] as const;

@Schema({ timestamps: true, toJSON: cleanJson('passwordHash') })
export class TeamMember {
  /** e.g. BO001 – prefix comes from the role name. */
  @Prop({ required: true, unique: true })
  id!: string;

  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ required: true, lowercase: true, trim: true, unique: true })
  email!: string;

  @Prop({ default: '', trim: true })
  phone!: string;

  /** YYYY-MM-DD */
  @Prop({ required: true })
  joinDate!: string;

  @Prop({ required: true, default: DEFAULT_ROLE_NAME })
  role!: string;

  @Prop({ required: true, enum: ['Active', 'Inactive'], default: 'Active' })
  status!: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  username!: string;

  @Prop({ required: true })
  passwordHash!: string;

  /** When the password was last set or changed (never the password itself). */
  @Prop({ type: Date })
  passwordChangedAt?: Date;

  /** true after an admin created the account / reset the password: must be changed at next sign-in. */
  @Prop({ type: Boolean, default: false })
  mustChangePassword!: boolean;

  /** Bumped on every password change/reset: older sign-in tokens stop working. */
  @Prop({ type: Number, default: 0 })
  tokenVersion!: number;
}

export const TeamMemberSchema = SchemaFactory.createForClass(TeamMember);

/** Permission rows: pages, with Finance split per tab. */
export const PERMISSION_KEYS = [
  '/dashboard/orders',
  '/dashboard/customers',
  '/dashboard/products',
  '/dashboard/inventory',
  '/dashboard/deliveries',
  '/dashboard/leads',
  '/dashboard/targets',
  '/dashboard/finance#income',
  '/dashboard/finance#expense',
] as const;

/** What a role may do on a page. */
export const PERMISSION_ACTIONS = ['view', 'create', 'edit', 'delete'] as const;

/** Overview widgets a role can be granted (mirrors the frontend WIDGET_OPTIONS). */
export const WIDGET_KEYS = [
  'stats', // old: all summary cards
  'stat-orders',
  'stat-revenue',
  'stat-customers',
  'stat-stock',
  'stat-deliveries',
  'stat-profit',
  'revenue-trend',
  'orders-per-day',
  'income-expenses',
  'top-products',
  'order-status',
  'payment-methods',
  'product-stock',
  'delivery-status',
  'leads',
  'hide-product-cost', // hides Manufacture Unit Cost on the Products page
  'hide-product-profit', // hides Unit Profit on the Products page
] as const;

@Schema({ timestamps: true, toJSON: cleanJson() })
export class TeamRole {
  /** e.g. ROLE-001 */
  @Prop({ required: true, unique: true })
  id!: string;

  @Prop({ required: true, unique: true, trim: true })
  name!: string;

  @Prop({ type: [String], default: [] })
  pages!: string[];

  /** { '/dashboard/orders': ['view','create'] } – pages with 'view' are mirrored in `pages`. */
  @Prop({ type: Object, default: {} })
  permissions!: Record<string, string[]>;

  /** Overview widgets this role sees. Missing = every widget its pages allow. */
  @Prop({ type: [String], default: undefined })
  widgets?: string[];
}

export const TeamRoleSchema = SchemaFactory.createForClass(TeamRole);
