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
}

export const TeamMemberSchema = SchemaFactory.createForClass(TeamMember);

@Schema({ timestamps: true, toJSON: cleanJson() })
export class TeamRole {
  /** e.g. ROLE-001 */
  @Prop({ required: true, unique: true })
  id!: string;

  @Prop({ required: true, unique: true, trim: true })
  name!: string;

  @Prop({ type: [String], default: [] })
  pages!: string[];
}

export const TeamRoleSchema = SchemaFactory.createForClass(TeamRole);
