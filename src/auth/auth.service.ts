import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { CustomerService } from '../customer/customer.service';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import * as crypto from 'crypto';
import { MailService } from './mail.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private customerService: CustomerService,
    private mailService: MailService,
    private configService: ConfigService,
    private cloudinaryService: CloudinaryService,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);

    if (
      user &&
      !(user.role === 'user' && user.isActive !== true) &&
      (await bcrypt.compare(pass, user.password))
    ) {
      const { password, ...result } = user.toObject();
      return result;
    }

    return null;
  }

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByEmail(loginDto.email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.role === 'user' && user.isActive !== true) {
      throw new UnauthorizedException(
        'Your account is disabled. Please contact support.',
      );
    }

    const passwordValid = await bcrypt.compare(loginDto.password, user.password);

    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.role === 'user') {
      await this.customerService.ensureForRegisteredUser({
        email: user.email,
        fullName: user.fullName,
      });
    }

    const payload = {
      email: user.email,
      sub: user._id.toString(),
      role: user.role,
    };

    const token = this.jwtService.sign(payload);

    return {
      token,
      access_token: token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      },
    };
  }

  async register(registerDto: RegisterDto) {
    const existingUser = await this.usersService.findByEmail(registerDto.email);

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const user = await this.usersService.create(
      registerDto.email,
      registerDto.password,
      'user',
      registerDto.fullName,
    );

    await this.customerService.ensureForRegisteredUser({
      email: user.email,
      fullName: registerDto.fullName,
    });

    const payload = {
      email: user.email,
      sub: user._id.toString(),
      role: user.role,
    };
    const token = this.jwtService.sign(payload);

    return {
      message: 'Registration successful. Please sign in.',
      token,
      access_token: token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        isActive: true,
      },
    };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.usersService.findByEmail(dto.email);

    if (!user) {
      return { message: 'If that email exists, a reset link has been sent.' };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');

    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = expiresAt;
    await user.save();

    const frontendBaseUrl =
      this.configService.get<string>('FRONTEND_URL') ?? 'http://localhost:3000';

    const resetLink = `${frontendBaseUrl}/reset-password?token=${resetToken}`;

    await this.mailService.sendPasswordResetEmail(user.email, resetLink);

    return {
      message: 'If that email exists, a reset link has been sent.',
      ...(process.env.NODE_ENV !== 'production' && { resetToken }),
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.usersService.findByResetToken(dto.token);

    if (!user || !user.passwordResetExpires) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    if (user.passwordResetExpires < new Date()) {
      throw new BadRequestException('Reset token expired');
    }

    user.password = await bcrypt.hash(dto.newPassword, 10);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    return { message: 'Password reset successful' };
  }

  private serializeProfile(user: any) {
    return {
      id: user._id,
      fullName: user.fullName || '',
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      bio: user.bio || '',
      avatar: user.avatar || '',
      twoFactorEnabled: user.twoFactorEnabled || false,
    };
  }

  async getProfile(userId: string) {
    const user = await this.usersService.findById(userId);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return { user: this.serializeProfile(user) };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.usersService.findByIdWithPassword(userId);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // If the email is changing, make sure it is not already taken.
    if (dto.email && dto.email.toLowerCase() !== user.email) {
      const existing = await this.usersService.findByEmail(dto.email);
      if (existing) {
        throw new ConflictException('Email already in use');
      }
    }

    // Handle an optional password change.
    if (dto.newPassword) {
      if (!dto.currentPassword) {
        throw new BadRequestException(
          'Current password is required to set a new password',
        );
      }

      const passwordValid = await bcrypt.compare(
        dto.currentPassword,
        user.password,
      );

      if (!passwordValid) {
        throw new BadRequestException('Current password is incorrect');
      }

      const hashed = await bcrypt.hash(dto.newPassword, 10);
      await this.usersService.updatePassword(userId, hashed);
    }

    const profileUpdate: Record<string, unknown> = {};
    if (dto.fullName !== undefined) profileUpdate.fullName = dto.fullName;
    if (dto.email !== undefined) profileUpdate.email = dto.email.toLowerCase();
    if (dto.bio !== undefined) profileUpdate.bio = dto.bio;
    if (dto.twoFactorEnabled !== undefined)
      profileUpdate.twoFactorEnabled = dto.twoFactorEnabled;

    // When the avatar is explicitly cleared, remove the stored Cloudinary image.
    if (dto.avatar !== undefined) {
      profileUpdate.avatar = dto.avatar;
      if (!dto.avatar && user.avatarPublicId) {
        try {
          await this.cloudinaryService.deleteImage(user.avatarPublicId);
        } catch {
          // Ignore cleanup failures; the reference is still cleared below.
        }
        profileUpdate.avatarPublicId = '';
      }
    }

    const updated = Object.keys(profileUpdate).length
      ? await this.usersService.updateProfile(userId, profileUpdate)
      : await this.usersService.findById(userId);

    return {
      message: 'Profile updated successfully',
      user: this.serializeProfile(updated),
    };
  }

  async uploadAvatar(userId: string, file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No image file provided');
    }

    const user = await this.usersService.findByIdWithPassword(userId);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Remove the previous avatar from Cloudinary before uploading the new one.
    if (user.avatarPublicId) {
      try {
        await this.cloudinaryService.deleteImage(user.avatarPublicId);
      } catch {
        // Ignore cleanup failures and continue with the new upload.
      }
    }

    const uploaded = await this.cloudinaryService.uploadImage(file, 'avatars');

    const updated = await this.usersService.updateAvatar(
      userId,
      uploaded.secure_url,
      uploaded.public_id,
    );

    return {
      message: 'Avatar updated successfully',
      user: this.serializeProfile(updated),
    };
  }
}