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
import { MailService } from './mail.service';

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
    this.logger.log(`[STEP 1] Forgot-password request received for email: ${dto.email}`);

    const user = await this.usersService.findByEmail(dto.email);

    if (!user) {
      this.logger.log(
        `[STEP 1] Email not found in database — returning generic success (anti-enumeration).`,
      );
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

    this.logger.log(
      `[STEP 2] Reset token generated and persisted for user: ${user.email}. ` +
      `Expires at: ${expiresAt.toISOString()}`,
    );

    const frontendBaseUrl =
      this.configService.get<string>('FRONTEND_URL') ?? 'http://localhost:3000';

    const resetLink = `${frontendBaseUrl}/reset-password?token=${resetToken}`;

    this.logger.log(`[STEP 3] Dispatching password-reset email to: ${user.email}`);

    await this.mailService.sendPasswordResetEmail(user.email, resetLink);

    this.logger.log(`[STEP 4] Password-reset flow completed successfully for: ${user.email}`);

    return {
      message: 'If that email exists, a reset link has been sent.',
      ...(process.env.NODE_ENV !== 'production' && { resetToken }),
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    this.logger.log(`[RESET] Reset-password attempt with provided token.`);

    const user = await this.usersService.findByResetToken(dto.token);

    if (!user || !user.passwordResetExpires) {
      this.logger.warn(`[RESET] No user found for the provided reset token.`);
      throw new BadRequestException('Invalid or expired reset token');
    }

    if (user.passwordResetExpires < new Date()) {
      this.logger.warn(
        `[RESET] Token expired at ${user.passwordResetExpires.toISOString()} for user: ${user.email}`,
      );
      throw new BadRequestException('Reset token expired');
    }

    user.password = await bcrypt.hash(dto.newPassword, 10);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    this.logger.log(`[RESET] ✅ Password reset successfully for user: ${user.email}`);

    return { message: 'Password reset successful' };
  }
}