import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { CustomerService } from '../customer/customer.service';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';
import { MailService } from '../mail/mail.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Injectable()
export class AuthService {
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
      console.warn(`[Auth] Login failed – no account for: ${loginDto.email}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.role === 'user' && user.isActive !== true) {
      throw new UnauthorizedException(
        'Your account is disabled. Please contact support.',
      );
    }

    const passwordValid = await bcrypt.compare(loginDto.password, user.password);

    if (!passwordValid) {
      console.warn(
        `[Auth] Login failed – wrong password for: ${loginDto.email}`,
      );
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

    return {
      token: this.jwtService.sign(payload),
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

    return {
      message: 'Registration successful. Your account is awaiting approval.',
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        isActive: false,
      },
    };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.usersService.findByEmail(dto.email);

    if (!user) {
      return { message: 'If that email exists, a reset link has been sent.' };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = await bcrypt.hash(resetToken, 10);

    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';

    const resetLink = `${frontendUrl.replace(
      /\/$/,
      '',
    )}/reset-password?token=${encodeURIComponent(resetToken)}`;

    try {
      await this.mailService.sendMail({
        to: user.email,
        subject: 'Reset your Magnify password',
        text: `Use this link to reset your password (valid for 15 minutes):\n\n${resetLink}`,
      });
    } catch {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save();
      throw new BadRequestException('Unable to send reset email right now');
    }

    return { message: 'If that email exists, a reset link has been sent.' };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.usersService.findByResetToken(dto.token);

    if (!user || !user.passwordResetToken || !user.passwordResetExpires) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const isValid = await bcrypt.compare(dto.token, user.passwordResetToken);

    if (!isValid) {
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