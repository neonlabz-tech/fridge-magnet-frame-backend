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

const logger = new Logger('MongoDB');

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      useFactory: () => {
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/magnify_db';

        logger.log(`Using MongoDB URI: ${mongoUri.replace(/:\/\/[^:]+:[^@]+@/, '://***:***@')}`);

        return {
          uri: mongoUri,
          lazyConnection: true,
          serverSelectionTimeoutMS: 1000,
        };
      },
    }),
    AuthModule,
    UsersModule,
    CustomerModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
