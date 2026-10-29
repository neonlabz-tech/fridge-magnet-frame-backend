import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Model } from 'mongoose';
import { UsersService } from '../users/users.service';
import { Admin } from '../schemas/admin.schema';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { MailService } from '../mail/mail.service';
import { CloudflareR2Service } from '../cloudflareR2/cloudflareR2.service';
export declare class AuthService {
    private adminModel;
    private usersService;
    private jwtService;
    private mailService;
    private configService;
    private cloudflareR2Service;
    private readonly logger;
    constructor(adminModel: Model<Admin>, usersService: UsersService, jwtService: JwtService, mailService: MailService, configService: ConfigService, cloudflareR2Service: CloudflareR2Service);
    validateUser(email: string, pass: string): Promise<any>;
    login(loginDto: LoginDto): Promise<{
        token: string;
        access_token: string;
        user: {
            id: import("mongoose").Types.ObjectId;
            fullName: string;
            email: string;
            role: string;
            isActive: boolean;
            phoneNumber?: undefined;
            customerAddress?: undefined;
        };
    } | {
        token: string;
        access_token: string;
        user: {
            id: import("mongoose").Types.ObjectId;
            fullName: string | undefined;
            email: string;
            role: string;
            isActive: true;
            phoneNumber: string;
            customerAddress: string;
        };
    }>;
    register(registerDto: RegisterDto): Promise<{
        message: string;
    }>;
    activateAccount(token: string): Promise<{
        message: string;
        alreadyActivated: boolean;
    } | {
        message: string;
        alreadyActivated?: undefined;
    }>;
    forgotPassword(dto: ForgotPasswordDto): Promise<{
        resetToken?: string | undefined;
        message: string;
    }>;
    resetPassword(dto: ResetPasswordDto): Promise<{
        message: string;
    }>;
    private serializeProfile;
    getProfile(userId: string, role?: string): Promise<{
        user: {
            id: any;
            fullName: any;
            email: any;
            role: any;
            isActive: any;
            bio: any;
            avatar: any;
            avatarPublicId: any;
            twoFactorEnabled: any;
            phoneNumber: any;
            customerAddress: any;
            customerId: any;
            createdAt: any;
        };
    }>;
    updateProfile(userId: string, dto: UpdateProfileDto, role?: string): Promise<{
        message: string;
        user: {
            id: any;
            fullName: any;
            email: any;
            role: any;
            isActive: any;
            bio: any;
            avatar: any;
            avatarPublicId: any;
            twoFactorEnabled: any;
            phoneNumber: any;
            customerAddress: any;
            customerId: any;
            createdAt: any;
        };
    }>;
    uploadAvatar(userId: string, file: Express.Multer.File, role?: string): Promise<{
        message: string;
        user: {
            id: any;
            fullName: any;
            email: any;
            role: any;
            isActive: any;
            bio: any;
            avatar: any;
            avatarPublicId: any;
            twoFactorEnabled: any;
            phoneNumber: any;
            customerAddress: any;
            customerId: any;
            createdAt: any;
        };
    }>;
}
