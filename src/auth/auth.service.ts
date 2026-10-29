import { Injectable, UnauthorizedException, ConflictException, BadRequestException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UsersService } from '../users/users.service';
import { Admin } from '../schemas/admin.schema';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import * as crypto from 'crypto';
import { MailService } from '../mail/mail.service';
import { CloudflareR2Service } from '../cloudflareR2/cloudflareR2.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectModel(Admin.name) private adminModel: Model<Admin>,
    private usersService: UsersService,
    private jwtService: JwtService,
    private mailService: MailService,
    private configService: ConfigService,
    private cloudflareR2Service: CloudflareR2Service,
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

    // Check Admin collection first
    const admin = await this.adminModel.findOne({ email: loginDto.email.toLowerCase() });
    if (admin) {
      const passwordValid = await bcrypt.compare(loginDto.password, admin.password);
      if (!passwordValid) throw new UnauthorizedException('Invalid email or password.');

      const token = this.jwtService.sign({
        email: admin.email,
        sub: admin._id.toString(),
        role: 'admin',
      });

      return {
        token,
        access_token: token,
        user: {
          id: admin._id,
          fullName: admin.fullName || 'Admin',
          email: admin.email,
          role: 'admin',
          isActive: true,
        },
      };
    }

    // Fall back to User collection
    const user = await this.usersService.findByEmail(loginDto.email);

    if (!user) throw new UnauthorizedException('Invalid email or password.');

    if (user.isActive !== true) {
      // Verified before but switched off by an admin -> deactivated, not "unverified".
      const wasVerified =
        user.emailVerified === true ||
        (user.emailVerified === undefined && !user.activationToken);
      if (wasVerified) {
        throw new UnauthorizedException(
          'Your account has been deactivated. Please contact support.',
        );
      }
      throw new UnauthorizedException(
        'Your account is not verified. Please check your email for the verification link.',
      );
    }

    const passwordValid = await bcrypt.compare(loginDto.password, user.password);
    if (!passwordValid) throw new UnauthorizedException('Invalid email or password.');

    await this.usersService.ensureForRegisteredUser({
      email: user.email,
      fullName: user.fullName,
    });

    const token = this.jwtService.sign({
      email: user.email,
      sub: user._id.toString(),
      role: user.role,
    });

    return {
      token,
      access_token: token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        phoneNumber: user.phoneNumber || '',
        customerAddress: user.customerAddress || '',
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
      {
        phoneNumber: registerDto.phoneNumber,
        customerAddress: registerDto.customerAddress,
      },
    );

    // Generate a raw token, store its SHA-256 hash on the user, expire in 24 h
    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');

    user.activationToken = hashedToken;
    user.activationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save();

    const frontendBaseUrl =
      this.configService.get<string>('FRONTEND_URL') ?? 'http://magnifycreation.lk';

    const activationLink = `${frontendBaseUrl}/activate-account?token=${rawToken}`;

    try {
      await this.mailService.sendActivationEmail({
        to: user.email,
        fullName: registerDto.fullName,
        activationLink,
      });
    } catch {
      // Clean up the token so the user can retry — don't leave a dangling record
      user.activationToken = undefined;
      user.activationExpires = undefined;
      await user.save();
      throw new BadRequestException(
        'Account created but we could not send the activation email. Please try registering again.',
      );
    }

    return {
      message:
        'Registration successful! Please check your email and click the activation link to activate your account.',
    };
  }

  async activateAccount(token: string) {
    const user = await this.usersService.findByActivationToken(token);

    if (!user) {
      throw new BadRequestException('Invalid or expired activation link.');
    }

    // The link was already used: the account stays activated.
    if (user.emailVerified === true) {
      if (user.isActive !== true) {
        throw new BadRequestException('This account is disabled. Please contact support.');
      }
      return {
        message: 'Your account is already activated. Please sign in.',
        alreadyActivated: true,
      };
    }

    if (!user.activationExpires) {
      throw new BadRequestException('Invalid or expired activation link.');
    }

    if (user.activationExpires < new Date()) {
      throw new BadRequestException(
        'This activation link has expired. Please register again.',
      );
    }

    user.isActive = true;
    user.emailVerified = true;
    // Keep the (hashed) token so a second click can be answered with
    // "already activated" instead of a confusing "invalid link".
    await user.save();

    await this.usersService.ensureForRegisteredUser({
      email: user.email,
      fullName: user.fullName,
    });

    return { message: 'Account activated successfully! You can now sign in.' };
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

    const resetHtml = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px">
        <h2 style="color:#002B73;margin-bottom:8px">Magnify — Password Reset</h2>
        <p style="color:#434652">We received a request to reset your Magnify account password.</p>
        <p style="color:#434652">Click the button below to set a new password. This link is valid for 15 minutes.</p>
        <p style="margin:24px 0">
          <a href="${resetLink}"
             style="background:#002B73;color:#ffffff;padding:12px 24px;border-radius:4px;text-decoration:none;display:inline-block">
            Reset your password
          </a>
        </p>
        <p style="font-size:13px;color:#9CA3AF">
          Or paste this link into your browser:<br/>
          <span style="word-break:break-all;color:#434652">${resetLink}</span>
        </p>
        <hr style="border:none;border-top:1px solid #EEF1F5;margin:24px 0"/>
        <p style="font-size:12px;color:#9CA3AF">
          If you did not request a password reset, you can safely ignore this email.
        </p>
      </div>
    `;

    try {
      await this.mailService.sendMail({
        to: user.email,
        subject: 'Reset your Magnify password',
        text:
          `We received a request to reset your Magnify account password.\n\n` +
          `Use this link to reset your password (valid for 15 minutes):\n\n${resetLink}\n\n` +
          `If you did not request a password reset, you can safely ignore this email.`,
        html: resetHtml,
      });
    } catch {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save();
      throw new BadRequestException('Unable to send reset email right now');
    }

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
      avatarPublicId: user.avatarPublicId || '',
      twoFactorEnabled: user.twoFactorEnabled || false,
      phoneNumber: user.phoneNumber || '',
      customerAddress: user.customerAddress || '',
      customerId: user.customerId || '',
      createdAt: user.createdAt,
    };
  }

  async getProfile(userId: string, role?: string) {
    const user = role === 'admin'
      ? await this.adminModel.findById(userId).exec()
      : await this.usersService.findById(userId);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return { user: this.serializeProfile(user) };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto, role?: string) {
    const isAdmin = role === 'admin';
    const user = isAdmin
      ? await this.adminModel.findById(userId).exec()
      : await this.usersService.findByIdWithPassword(userId);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Customers cannot change their email address; only admins can.
    // If an admin's email is changing, make sure it is not already taken.
    if (isAdmin && dto.email && dto.email.toLowerCase() !== user.email) {
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
      if (isAdmin) {
        user.password = hashed;
        await user.save();
      } else {
        await this.usersService.updatePassword(userId, hashed);
      }
    }

    const profileUpdate: Record<string, unknown> = {};
    if (dto.fullName !== undefined) profileUpdate.fullName = dto.fullName;
    if (isAdmin && dto.email !== undefined)
      profileUpdate.email = dto.email.toLowerCase();
    if (dto.phoneNumber !== undefined)
      profileUpdate.phoneNumber = dto.phoneNumber.trim();
    if (dto.customerAddress !== undefined)
      profileUpdate.customerAddress = dto.customerAddress.trim();
    if (dto.bio !== undefined) profileUpdate.bio = dto.bio;
    if (dto.twoFactorEnabled !== undefined)
      profileUpdate.twoFactorEnabled = dto.twoFactorEnabled;

    // When the avatar is explicitly cleared, remove the stored Cloudinary image.
    if (dto.avatar !== undefined) {
      profileUpdate.avatar = dto.avatar;
      if (!dto.avatar && user.avatarPublicId) {
        try {
          await this.cloudflareR2Service.deleteImage(user.avatarPublicId);
        } catch {
          // Ignore cleanup failures; the reference is still cleared below.
        }
        profileUpdate.avatarPublicId = '';
      }
    }

    const updated = isAdmin
      ? await this.adminModel
          .findByIdAndUpdate(userId, { $set: profileUpdate }, { new: true })
          .exec()
      : Object.keys(profileUpdate).length
        ? await this.usersService.updateProfile(userId, profileUpdate)
        : await this.usersService.findById(userId);

    return {
      message: 'Profile updated successfully',
      user: this.serializeProfile(updated),
    };
  }

  async uploadAvatar(userId: string, file: Express.Multer.File, role?: string) {
    if (!file) {
      throw new BadRequestException('No image file provided');
    }

    const isAdmin = role === 'admin';
    const user = isAdmin
      ? await this.adminModel.findById(userId).exec()
      : await this.usersService.findByIdWithPassword(userId);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Remove the previous avatar from Cloudinary before uploading the new one.
    if (user.avatarPublicId) {
      try {
        await this.cloudflareR2Service.deleteImage(user.avatarPublicId);
      } catch {
        // Ignore cleanup failures and continue with the new upload.
      }
    }

    const uploaded = await this.cloudflareR2Service.uploadImage(file, 'avatars');

    const updated = isAdmin
      ? await this.adminModel
          .findByIdAndUpdate(
            userId,
            { $set: { avatar: uploaded.secure_url, avatarPublicId: uploaded.public_id } },
            { new: true },
          )
          .exec()
      : await this.usersService.updateAvatar(
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