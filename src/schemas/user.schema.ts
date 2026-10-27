import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class User extends Document {
  @Prop({ trim: true })
  fullName?: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email!: string;

  @Prop({ required: true })
  password!: string;

  @Prop({ default: 'user', enum: ['user', 'admin'] })
  role!: string;

  @Prop({ type: Boolean, default: false })
  isActive!: boolean;

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

  @Prop({ type: String })
  activationToken?: string;

  @Prop({ type: Date })
  activationExpires?: Date;

  @Prop({ type: String, sparse: true })
  customerId?: string;

  @Prop({ type: String, trim: true, default: '' })
  phoneNumber?: string;

  @Prop({ type: String, trim: true, default: '' })
  customerAddress?: string;

  // How the customer record was created. Missing (older records) is treated as 'website'.
  @Prop({ type: String, enum: ['website', 'manual'] })
  registrationType?: 'website' | 'manual';

  // Set to true when the customer confirms their email (activation link).
  // Intentionally has no default so older records can be told apart.
  @Prop({ type: Boolean })
  emailVerified?: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.index({ passwordResetToken: 1 });
UserSchema.index({ activationToken: 1 });
UserSchema.index({ customerId: 1 }, { sparse: true });
