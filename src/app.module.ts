import * as dns from 'dns';
import * as dotenv from 'dotenv';

dns.setServers(['8.8.8.8', '8.8.4.4']);
dns.setDefaultResultOrder('ipv4first');
dotenv.config();

import { Module, Logger } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { OrdersModule } from './orders/orders.module';
import { ProductsModule } from './products/products.module';
import { CloudflareR2Module } from './cloudflareR2/cloudflareR2.module';
import { MailModule } from './mail/mail.module';
import { ContactModule } from './contact/contact.module';
import { FeedbackModule } from './feedback/feedback.module';
import { Admin, AdminSchema } from './schemas/admin.schema';
import { InventoryModule } from './inventory/inventory.module';
import { FinanceModule } from './finance/finance.module';
import { DeliveriesModule } from './deliveries/deliveries.module';
import { LeadsModule } from './leads/leads.module';
import { TeamModule } from './team/team.module';
import { MaterialsModule } from './materials/materials.module';

const logger = new Logger('MongoDB');

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    MongooseModule.forRoot(process.env.MONGODB_URI as string, {
     
      serverSelectionTimeoutMS: 5000,   
      connectTimeoutMS: 10000,          
      socketTimeoutMS: 45000,           
      connectionFactory: (connection) => {
        connection.on('connected', () => {
          logger.log('✅ MongoDB connected successfully');
        });

        connection.on('error', (error: Error) => {
          logger.error(`❌ MongoDB connection error: ${error.message}`);
        });

        return connection;
      },
    }),

    MongooseModule.forFeature([{ name: Admin.name, schema: AdminSchema }]),
    AuthModule,
    UsersModule,
    OrdersModule,
    ProductsModule,
    CloudflareR2Module,
    MailModule,
    ContactModule,
    FeedbackModule,
    InventoryModule,
    FinanceModule,
    DeliveriesModule,
    LeadsModule,
    TeamModule,
    MaterialsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
