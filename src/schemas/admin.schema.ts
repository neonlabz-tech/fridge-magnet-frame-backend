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
}

export const AdminSchema = SchemaFactory.createForClass(Admin);
