import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Customer, CustomerSchema } from './customer.schema';
import { CustomerService } from './customer.service';
import { CustomerController } from './customer.controller';
import { UsersModule } from '../users/users.module';

/**
 * NOTE — after the migration script has run and you have verified the data:
 *   1. Drop the `customers` MongoDB collection manually.
 *   2. Remove the MongooseModule.forFeature([{ name: Customer.name, ... }])
 *      import below (CustomerService no longer uses the Customer model).
 *   3. Remove the import of Customer / CustomerSchema at the top of this file.
 *   4. Remove customer.schema.ts entirely.
 */
@Module({
  imports: [
    // Keep registered during the migration window so the migration script
    // (which connects via Mongoose directly) can still read the old collection.
    // Safe to remove once migration is verified and collection is dropped.
    MongooseModule.forFeature([
      { name: Customer.name, schema: CustomerSchema },
    ]),
    UsersModule,
  ],
  controllers: [CustomerController],
  providers: [CustomerService],
  exports: [CustomerService],
})
export class CustomerModule {}
