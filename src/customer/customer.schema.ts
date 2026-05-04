import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type CustomerDocument = HydratedDocument<Customer>;

@Schema({ timestamps: true, collection: 'customers' })
export class Customer {
  @Prop({ type: String, unique: true })
  customerId: string;

  @Prop({ type: String, required: true, minlength: 2, maxlength: 100 })
  customerName: string;

  @Prop({ type: String, required: true, unique: true, lowercase: true })
  emailAddress: string;

  @Prop({ type: String, required: true })
  phoneNumber: string;

  @Prop({ type: String, required: true, minlength: 5, maxlength: 255 })
  customerAddress: string;

  @Prop({ type: Boolean, default: true })
  isActive: boolean;
}

export const CustomerSchema = SchemaFactory.createForClass(Customer);

/**
 * Generates a random customer ID in the format #CUST-XXXX
 */
function generateCustomerId(): string {
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `#CUST-${randomNum}`;
}

/**
 * Pre-save hook to auto-generate a unique customerId.
 * Retries if the generated ID already exists in the database.
 */
CustomerSchema.pre('save', async function () {
  if (this.isNew && !this.customerId) {
    const maxRetries = 10;
    let retries = 0;
    let isUnique = false;

    while (!isUnique && retries < maxRetries) {
      const candidateId = generateCustomerId();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const existingDoc = await (this.constructor as any).findOne({
        customerId: candidateId,
      });

      if (!existingDoc) {
        this.customerId = candidateId;
        isUnique = true;
      }

      retries++;
    }

    if (!isUnique) {
      throw new Error('Failed to generate a unique customer ID after multiple retries');
    }
  }
});
