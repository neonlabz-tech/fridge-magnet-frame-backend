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

  @Prop({ type: Boolean, default: false })
  isActive: boolean;

  @Prop({ type: String })
  passwordResetToken?: string;

  @Prop({ type: Date })
  passwordResetExpires?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Add index for password reset token (email already has unique index from @Prop)
UserSchema.index({ passwordResetToken: 1 });
