import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Admin extends Document {
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email!: string;

  @Prop({ required: true })
  password!: string;

  @Prop({ default: 'admin' })
  role!: string;

  @Prop({ default: true })
  isActive!: boolean;

  @Prop({ trim: true })
  fullName?: string;

  @Prop({ type: String, trim: true, default: '' })
  bio?: string;

  @Prop({ type: String, default: '' })
  avatar?: string;

  @Prop({ type: String, default: '' })
  avatarPublicId?: string;

  @Prop({ type: Boolean, default: false })
  twoFactorEnabled?: boolean;

  @Prop({ type: Date })
  passwordChangedAt?: Date;

  /** Bumped on every password change/reset: older sign-in tokens stop working. */
  @Prop({ type: Number, default: 0 })
  tokenVersion?: number;

  /** SHA-256 of the one-time reset token (the raw token only exists in the e-mailed link). */
  @Prop({ type: String })
  passwordResetToken?: string;

  @Prop({ type: Date })
  passwordResetExpires?: Date;
}

export const AdminSchema = SchemaFactory.createForClass(Admin);
