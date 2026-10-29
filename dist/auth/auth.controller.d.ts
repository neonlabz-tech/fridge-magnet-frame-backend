import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(registerDto: RegisterDto): Promise<{
        message: string;
    }>;
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
    logout(): {
        success: boolean;
        message: string;
    };
    forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<{
        resetToken?: string | undefined;
        message: string;
    }>;
    resetPassword(resetPasswordDto: ResetPasswordDto): Promise<{
        message: string;
    }>;
    activateAccount(token: string): Promise<{
        message: string;
        alreadyActivated: boolean;
    } | {
        message: string;
        alreadyActivated?: undefined;
    }>;
    getProfile(req: {
        user: {
            userId: string;
            role?: string;
        };
    }): Promise<{
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
    updateProfile(req: {
        user: {
            userId: string;
            role?: string;
        };
    }, updateProfileDto: UpdateProfileDto): Promise<{
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
    uploadAvatar(req: {
        user: {
            userId: string;
            role?: string;
        };
    }, file: Express.Multer.File): Promise<{
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
