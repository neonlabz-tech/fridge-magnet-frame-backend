import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class User extends Document {
  @Prop({ trim: true })
  fullName?: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ default: 'user', enum: ['user', 'admin'] })
  role: string;

  @Prop({ type: Boolean, default: true })
  isActive: boolean;

  @Prop({ type: String, trim: true, default: '' })
  bio?: string;

  @Prop({ type: String, default: '' })
  avatar?: string;

  @Prop({ type: String, default: '' })
  avatarPublicId?: string;

  @Prop({ type: Boolean, default: false })
  twoFactorEnabled?: boolean;

  @Prop({ type: String })
  passwordResetToken?: string;

  @Prop({ type: Date })
  passwordResetExpires?: Date;

  // ── Customer-profile fields ──────────────────────────────────────────────
  // Only populated for role:'user' accounts. Admin accounts leave these unset.

  /** Unique customer identifier in the format #CUST-XXXX */
  @Prop({ type: String, sparse: true })
  customerId?: string;

  /** 10-digit phone number */
  @Prop({ type: String, trim: true, default: '' })
  phoneNumber?: string;

  /** Full shipping / customer address */
  @Prop({ type: String, trim: true, default: '' })
  customerAddress?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.index({ passwordResetToken: 1 });
// sparse: true means admin documents (no customerId) are not indexed
UserSchema.index({ customerId: 1 }, { sparse: true });
