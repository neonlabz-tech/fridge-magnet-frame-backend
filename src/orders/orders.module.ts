import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { Order, OrderSchema } from './schemas/order.schema';
import { Product, ProductSchema } from '../products/schemas/product.schema';
import { UsersModule } from '../users/users.module';
import { MailModule } from '../mail/mail.module';
import { PdfGeneratorService } from './services/pdf-generator.service';
import { CloudflareR2Module } from '../cloudflareR2/cloudflareR2.module';

@Module({
  imports: [
    UsersModule,
    MailModule,
    CloudflareR2Module,
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
      { name: Product.name, schema: ProductSchema },
    ]),
  ],
  controllers: [OrdersController],
  providers: [OrdersService, PdfGeneratorService],
})
export class OrdersModule {}