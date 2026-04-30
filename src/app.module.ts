import * as dotenv from 'dotenv';
dotenv.config();

import { Module, Logger } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CustomerModule } from './customer/customer.module';
import { ProductsModule } from './products/products.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';

const logger = new Logger('MongoDB');

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    MongooseModule.forRoot(process.env.MONGODB_URI as string, {
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
    CustomerModule,

    // 👉 unga modules add pannom
    ProductsModule,
    CloudinaryModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}