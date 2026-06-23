import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type FeedbackDocument = Feedback & Document;

@Schema({ timestamps: true })
export class Feedback {
  @Prop()
  orderNumber?: string;

  @Prop()
  customerName?: string;

  @Prop()
  email?: string;

  @Prop({ required: true, min: 0, max: 5, default: 0 })
  rating: number;

  @Prop()
  comment?: string;
}

export const FeedbackSchema = SchemaFactory.createForClass(Feedback);
