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
import * as crypto from 'crypto';
import { MailService } from '../mail/mail.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private customerService: CustomerService,
    private mailService: MailService,
    private configService: ConfigService,
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
}