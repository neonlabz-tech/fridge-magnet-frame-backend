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
import { CustomerModule } from './customer/customer.module';
import { ProductsModule } from './products/products.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { MailModule } from './mail/mail.module';
import { ContactModule } from './contact/contact.module';
import { FeedbackModule } from './feedback/feedback.module';

const logger = new Logger('MongoDB');

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    MongooseModule.forRoot(process.env.MONGODB_URI as string, {
      // BUG FIX — MongoDB Atlas ETIMEOUT / querySrv timeout
      //
      // Atlas uses a DNS SRV record (mongodb+srv://) to discover replica-set
      // members. On some networks (corporate NAT, VPN, Windows DNS) the SRV
      // lookup times out.  The DNS override in lines 4-5 (8.8.8.8) already
      // tries to fix this; these additional options ensure:
      //   1. serverSelectionTimeoutMS — Mongoose gives up selecting a server
      //      after 5 s (default is 30 s), so the backend process starts quickly
      //      and NestJS can begin handling requests even while the DB reconnects.
      //   2. connectTimeoutMS / socketTimeoutMS — prevent indefinitely hanging
      //      sockets from blocking the Node.js event loop.
      //   3. The existing retry logic in NestJS logs "Retrying (N)..." so the
      //      connection will be re-attempted automatically.
      serverSelectionTimeoutMS: 5000,   // give up server selection after 5 s
      connectTimeoutMS: 10000,          // TCP connect timeout
      socketTimeoutMS: 45000,           // idle socket timeout
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

    AuthModule,
    UsersModule,
    OrdersModule,
    CustomerModule,
    ProductsModule,
    CloudinaryModule,
    MailModule,
    ContactModule,
    FeedbackModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
