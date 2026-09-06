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
}

export const AdminSchema = SchemaFactory.createForClass(Admin);
