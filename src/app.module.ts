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
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { MailModule } from './mail/mail.module';
import { ContactModule } from './contact/contact.module';
import { FeedbackModule } from './feedback/feedback.module';

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

    AuthModule,
    UsersModule,
    OrdersModule,
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
