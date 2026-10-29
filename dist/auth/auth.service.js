"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const users_service_1 = require("../users/users.service");
const admin_schema_1 = require("../schemas/admin.schema");
const bcrypt = __importStar(require("bcrypt"));
const crypto = __importStar(require("crypto"));
const mail_service_1 = require("../mail/mail.service");
const cloudflareR2_service_1 = require("../cloudflareR2/cloudflareR2.service");
let AuthService = AuthService_1 = class AuthService {
    constructor(adminModel, usersService, jwtService, mailService, configService, cloudflareR2Service) {
        this.adminModel = adminModel;
        this.usersService = usersService;
        this.jwtService = jwtService;
        this.mailService = mailService;
        this.configService = configService;
        this.cloudflareR2Service = cloudflareR2Service;
        this.logger = new common_1.Logger(AuthService_1.name);
    }
    async validateUser(email, pass) {
        const user = await this.usersService.findByEmail(email);
        if (user &&
            !(user.role === 'user' && user.isActive !== true) &&
            (await bcrypt.compare(pass, user.password))) {
            const { password, ...result } = user.toObject();
            return result;
        }
        return null;
    }
    async login(loginDto) {
        const admin = await this.adminModel.findOne({ email: loginDto.email.toLowerCase() });
        if (admin) {
            const passwordValid = await bcrypt.compare(loginDto.password, admin.password);
            if (!passwordValid)
                throw new common_1.UnauthorizedException('Invalid email or password.');
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
        const user = await this.usersService.findByEmail(loginDto.email);
        if (!user)
            throw new common_1.UnauthorizedException('Invalid email or password.');
        if (user.isActive !== true) {
            const wasVerified = user.emailVerified === true ||
                (user.emailVerified === undefined && !user.activationToken);
            if (wasVerified) {
                throw new common_1.UnauthorizedException('Your account has been deactivated. Please contact support.');
            }
            throw new common_1.UnauthorizedException('Your account is not verified. Please check your email for the verification link.');
        }
        const passwordValid = await bcrypt.compare(loginDto.password, user.password);
        if (!passwordValid)
            throw new common_1.UnauthorizedException('Invalid email or password.');
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
    async register(registerDto) {
        const existingUser = await this.usersService.findByEmail(registerDto.email);
        if (existingUser) {
            throw new common_1.ConflictException('Email already registered');
        }
        const user = await this.usersService.create(registerDto.email, registerDto.password, 'user', registerDto.fullName, {
            phoneNumber: registerDto.phoneNumber,
            customerAddress: registerDto.customerAddress,
        });
        const rawToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto
            .createHash('sha256')
            .update(rawToken)
            .digest('hex');
        user.activationToken = hashedToken;
        user.activationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
        await user.save();
        const frontendBaseUrl = this.configService.get('FRONTEND_URL') ?? 'http://magnifycreation.lk';
        const activationLink = `${frontendBaseUrl}/activate-account?token=${rawToken}`;
        try {
            await this.mailService.sendActivationEmail({
                to: user.email,
                fullName: registerDto.fullName,
                activationLink,
            });
        }
        catch {
            user.activationToken = undefined;
            user.activationExpires = undefined;
            await user.save();
            throw new common_1.BadRequestException('Account created but we could not send the activation email. Please try registering again.');
        }
        return {
            message: 'Registration successful! Please check your email and click the activation link to activate your account.',
        };
    }
    async activateAccount(token) {
        const user = await this.usersService.findByActivationToken(token);
        if (!user) {
            throw new common_1.BadRequestException('Invalid or expired activation link.');
        }
        if (user.emailVerified === true) {
            if (user.isActive !== true) {
                throw new common_1.BadRequestException('This account is disabled. Please contact support.');
            }
            return {
                message: 'Your account is already activated. Please sign in.',
                alreadyActivated: true,
            };
        }
        if (!user.activationExpires) {
            throw new common_1.BadRequestException('Invalid or expired activation link.');
        }
        if (user.activationExpires < new Date()) {
            throw new common_1.BadRequestException('This activation link has expired. Please register again.');
        }
        user.isActive = true;
        user.emailVerified = true;
        await user.save();
        await this.usersService.ensureForRegisteredUser({
            email: user.email,
            fullName: user.fullName,
        });
        return { message: 'Account activated successfully! You can now sign in.' };
    }
    async forgotPassword(dto) {
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
        const frontendBaseUrl = this.configService.get('FRONTEND_URL') ?? 'http://localhost:3000';
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
                text: `We received a request to reset your Magnify account password.\n\n` +
                    `Use this link to reset your password (valid for 15 minutes):\n\n${resetLink}\n\n` +
                    `If you did not request a password reset, you can safely ignore this email.`,
                html: resetHtml,
            });
        }
        catch {
            user.passwordResetToken = undefined;
            user.passwordResetExpires = undefined;
            await user.save();
            throw new common_1.BadRequestException('Unable to send reset email right now');
        }
        return {
            message: 'If that email exists, a reset link has been sent.',
            ...(process.env.NODE_ENV !== 'production' && { resetToken }),
        };
    }
    async resetPassword(dto) {
        const user = await this.usersService.findByResetToken(dto.token);
        if (!user || !user.passwordResetExpires) {
            throw new common_1.BadRequestException('Invalid or expired reset token');
        }
        if (user.passwordResetExpires < new Date()) {
            throw new common_1.BadRequestException('Reset token expired');
        }
        user.password = await bcrypt.hash(dto.newPassword, 10);
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save();
        return { message: 'Password reset successful' };
    }
    serializeProfile(user) {
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
    async getProfile(userId, role) {
        const user = role === 'admin'
            ? await this.adminModel.findById(userId).exec()
            : await this.usersService.findById(userId);
        if (!user) {
            throw new common_1.UnauthorizedException('User not found');
        }
        return { user: this.serializeProfile(user) };
    }
    async updateProfile(userId, dto, role) {
        const isAdmin = role === 'admin';
        const user = isAdmin
            ? await this.adminModel.findById(userId).exec()
            : await this.usersService.findByIdWithPassword(userId);
        if (!user) {
            throw new common_1.UnauthorizedException('User not found');
        }
        if (isAdmin && dto.email && dto.email.toLowerCase() !== user.email) {
            const existing = await this.usersService.findByEmail(dto.email);
            if (existing) {
                throw new common_1.ConflictException('Email already in use');
            }
        }
        if (dto.newPassword) {
            if (!dto.currentPassword) {
                throw new common_1.BadRequestException('Current password is required to set a new password');
            }
            const passwordValid = await bcrypt.compare(dto.currentPassword, user.password);
            if (!passwordValid) {
                throw new common_1.BadRequestException('Current password is incorrect');
            }
            const hashed = await bcrypt.hash(dto.newPassword, 10);
            if (isAdmin) {
                user.password = hashed;
                await user.save();
            }
            else {
                await this.usersService.updatePassword(userId, hashed);
            }
        }
        const profileUpdate = {};
        if (dto.fullName !== undefined)
            profileUpdate.fullName = dto.fullName;
        if (isAdmin && dto.email !== undefined)
            profileUpdate.email = dto.email.toLowerCase();
        if (dto.phoneNumber !== undefined)
            profileUpdate.phoneNumber = dto.phoneNumber.trim();
        if (dto.customerAddress !== undefined)
            profileUpdate.customerAddress = dto.customerAddress.trim();
        if (dto.bio !== undefined)
            profileUpdate.bio = dto.bio;
        if (dto.twoFactorEnabled !== undefined)
            profileUpdate.twoFactorEnabled = dto.twoFactorEnabled;
        if (dto.avatar !== undefined) {
            profileUpdate.avatar = dto.avatar;
            if (!dto.avatar && user.avatarPublicId) {
                try {
                    await this.cloudflareR2Service.deleteImage(user.avatarPublicId);
                }
                catch {
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
    async uploadAvatar(userId, file, role) {
        if (!file) {
            throw new common_1.BadRequestException('No image file provided');
        }
        const isAdmin = role === 'admin';
        const user = isAdmin
            ? await this.adminModel.findById(userId).exec()
            : await this.usersService.findByIdWithPassword(userId);
        if (!user) {
            throw new common_1.UnauthorizedException('User not found');
        }
        if (user.avatarPublicId) {
            try {
                await this.cloudflareR2Service.deleteImage(user.avatarPublicId);
            }
            catch {
            }
        }
        const uploaded = await this.cloudflareR2Service.uploadImage(file, 'avatars');
        const updated = isAdmin
            ? await this.adminModel
                .findByIdAndUpdate(userId, { $set: { avatar: uploaded.secure_url, avatarPublicId: uploaded.public_id } }, { new: true })
                .exec()
            : await this.usersService.updateAvatar(userId, uploaded.secure_url, uploaded.public_id);
        return {
            message: 'Avatar updated successfully',
            user: this.serializeProfile(updated),
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(admin_schema_1.Admin.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        users_service_1.UsersService,
        jwt_1.JwtService,
        mail_service_1.MailService,
        config_1.ConfigService,
        cloudflareR2_service_1.CloudflareR2Service])
], AuthService);
//# sourceMappingURL=auth.service.js.map