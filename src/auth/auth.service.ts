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
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private customerService: CustomerService,
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

    console.log('DEBUG: Plain reset token for email:', resetToken);
    console.log('DEBUG: Hashed token stored in DB:', hashedToken);
    console.log('DEBUG: Reset token expires:', user.passwordResetExpires);

    return {
      message: 'If that email exists, a reset link has been sent.',
      resetToken,
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.usersService.findByResetToken(dto.token);

    console.log('DEBUG: User found for reset token:', user?.email);

    if (!user || !user.passwordResetToken || !user.passwordResetExpires) {
      console.log('DEBUG: No user or missing token/expiry');
      throw new BadRequestException('Invalid or expired reset token');
    }

    const isValid = await bcrypt.compare(dto.token, user.passwordResetToken);
    console.log('DEBUG: bcrypt.compare result:', isValid);

    if (!isValid) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    if (user.passwordResetExpires < new Date()) {
      console.log('DEBUG: Token expired:', user.passwordResetExpires);
      throw new BadRequestException('Reset token expired');
    }

    user.password = await bcrypt.hash(dto.newPassword, 10);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    console.log('DEBUG: Password reset successful for:', user.email);

    return { message: 'Password reset successful' };
  }
}