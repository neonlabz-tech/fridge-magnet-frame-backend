
import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';
import { UsersModule } from '../users/users.module';
import { CustomerModule } from '../customer/customer.module';
import { PassportModule } from '@nestjs/passport';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { ValidationPipe } from '@nestjs/common';
// BUG-009 FIX: Import the new MailService.
import { MailService } from './mail.service';

@Module({
  imports: [
    ConfigModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET') || 'your-super-secret-jwt-key-change-in-production',
        signOptions: {
          expiresIn: config.get<string>('JWT_EXPIRES_IN') || '1d',
        } as any,
      }),
    }),
    UsersModule,
    CustomerModule,
    CloudinaryModule,
  ],
  controllers: [AuthController],
  // BUG-009 FIX: MailService is added here so NestJS's DI container
  // can resolve it when AuthService requests it via constructor injection.
  providers: [AuthService, JwtStrategy, MailService],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}