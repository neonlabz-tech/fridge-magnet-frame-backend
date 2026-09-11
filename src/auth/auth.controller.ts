import {
  Body,
  Controller,
  Get,
  HttpCode,
  Patch,
  Post,
  Query,
  Request,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
	constructor(private readonly authService: AuthService) {}

	@Post('register')
	async register(@Body() registerDto: RegisterDto) {
		return this.authService.register(registerDto);
	}

	@Post('login')
	@HttpCode(200)
	async login(@Body() loginDto: LoginDto) {
		return this.authService.login(loginDto);
	}

	@Post('forgot-password')
	@HttpCode(200)
	async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
		return this.authService.forgotPassword(forgotPasswordDto);
	}

	@Post('reset-password')
	@HttpCode(200)
	async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
		return this.authService.resetPassword(resetPasswordDto);
	}

	@Get('activate')
	@HttpCode(200)
	async activateAccount(@Query('token') token: string) {
		return this.authService.activateAccount(token);
	}

	@UseGuards(JwtAuthGuard)
	@Get('profile')
	async getProfile(@Request() req: { user: { userId: string; role?: string } }) {
		return this.authService.getProfile(req.user.userId, req.user.role);
	}

	@UseGuards(JwtAuthGuard)
	@Patch('profile')
	async updateProfile(
		@Request() req: { user: { userId: string; role?: string } },
		@Body() updateProfileDto: UpdateProfileDto,
	) {
		return this.authService.updateProfile(
			req.user.userId,
			updateProfileDto,
			req.user.role,
		);
	}

	@UseGuards(JwtAuthGuard)
	@Post('profile/avatar')
	@UseInterceptors(FileInterceptor('avatar', { storage: memoryStorage() }))
	async uploadAvatar(
		@Request() req: { user: { userId: string; role?: string } },
		@UploadedFile() file: Express.Multer.File,
	) {
		return this.authService.uploadAvatar(req.user.userId, file, req.user.role);
	}
}
