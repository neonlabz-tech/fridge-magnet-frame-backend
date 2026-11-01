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
var UsersService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const user_schema_1 = require("../schemas/user.schema");
const order_schema_1 = require("../orders/schemas/order.schema");
const bcrypt = __importStar(require("bcrypt"));
const crypto = __importStar(require("crypto"));
let UsersService = class UsersService {
    static { UsersService_1 = this; }
    constructor(userModel, orderModel) {
        this.userModel = userModel;
        this.orderModel = orderModel;
    }
    async orderStatsByEmail(emails) {
        const stats = new Map();
        const list = [...new Set(emails.filter(Boolean).map((e) => e.trim().toLowerCase()))];
        if (!list.length)
            return stats;
        const rows = await this.orderModel.aggregate([
            { $addFields: { _email: { $toLower: '$email' }, _status: { $toUpper: '$status' } } },
            { $match: { _email: { $in: list } } },
            {
                $group: {
                    _id: '$_email',
                    totalOrders: { $sum: 1 },
                    totalAmount: {
                        $sum: { $cond: [{ $eq: ['$_status', 'CANCELED'] }, 0, { $ifNull: ['$totalValue', 0] }] },
                    },
                    activeOrders: {
                        $sum: { $cond: [{ $in: ['$_status', ['PENDING', 'PROCESSING', 'SHIPPED']] }, 1, 0] },
                    },
                },
            },
        ]);
        rows.forEach((r) => stats.set(r._id, {
            totalOrders: r.totalOrders,
            totalAmount: r.totalAmount,
            activeOrders: r.activeOrders,
        }));
        return stats;
    }
    async serializeCustomerWithStats(user) {
        const stats = await this.orderStatsByEmail([user?.email ?? '']);
        return this.serializeCustomer(user, stats.get(String(user?.email ?? '').toLowerCase()));
    }
    async create(email, password, role = 'user', fullName, customerFields) {
        const hashedPassword = await bcrypt.hash(password, 10);
        const createdUser = new this.userModel({
            email,
            password: hashedPassword,
            role,
            fullName,
            ...(customerFields ?? {}),
        });
        return createdUser.save();
    }
    async findByEmail(email) {
        return this.userModel.findOne({ email }).exec();
    }
    async findByResetToken(token) {
        const hashedToken = crypto
            .createHash('sha256')
            .update(token.trim())
            .digest('hex');
        return this.userModel.findOne({ passwordResetToken: hashedToken }).exec();
    }
    async findByActivationToken(token) {
        const hashedToken = crypto
            .createHash('sha256')
            .update(token.trim())
            .digest('hex');
        return this.userModel.findOne({ activationToken: hashedToken }).exec();
    }
    async findAll() {
        return this.userModel.find().select('-password').exec();
    }
    async findById(id) {
        return this.userModel.findById(id).select('-password').exec();
    }
    async updateActiveStatus(id, isActive) {
        return this.userModel
            .findByIdAndUpdate(id, { $set: { isActive } }, { new: true })
            .select('-password')
            .exec();
    }
    async findByIdWithPassword(id) {
        return this.userModel.findById(id).exec();
    }
    async updateProfile(id, update) {
        return this.userModel
            .findByIdAndUpdate(id, { $set: update }, { new: true })
            .select('-password')
            .exec();
    }
    async updateAvatar(id, avatar, avatarPublicId) {
        return this.userModel
            .findByIdAndUpdate(id, { $set: { avatar, avatarPublicId } }, { new: true })
            .select('-password')
            .exec();
    }
    async updatePassword(id, newHashedPassword) {
        await this.userModel
            .findByIdAndUpdate(id, { $set: { password: newHashedPassword } })
            .exec();
    }
    async createAdmin(email, password) {
        return this.create(email, password, 'admin');
    }
    async findAllByRole(role) {
        return this.userModel
            .find({ role })
            .select('-password')
            .sort({ createdAt: -1 })
            .exec();
    }
    async findCustomerByIdOrCustomerId(id) {
        if (id.startsWith('#CUST-') || id.startsWith('CUST-')) {
            const normalised = id.startsWith('#') ? id : `#${id}`;
            return this.userModel
                .findOne({ customerId: normalised, role: 'user' })
                .select('-password')
                .exec();
        }
        if (mongoose_2.Types.ObjectId.isValid(id)) {
            return this.userModel
                .findOne({ _id: id, role: 'user' })
                .select('-password')
                .exec();
        }
        return null;
    }
    async updateCustomerFields(id, fields) {
        return this.userModel
            .findByIdAndUpdate(id, { $set: fields }, { new: true })
            .select('-password')
            .exec();
    }
    async generateAndAssignCustomerId(userId) {
        const user = await this.userModel.findById(userId).exec();
        if (!user)
            throw new Error(`User ${userId} not found`);
        if (user.customerId)
            return user.customerId;
        const generate = () => `#CUST-${Math.floor(1000 + Math.random() * 9000)}`;
        for (let attempt = 0; attempt < 10; attempt++) {
            const candidate = generate();
            const clash = await this.userModel
                .findOne({ customerId: candidate })
                .exec();
            if (!clash) {
                user.customerId = candidate;
                await user.save();
                return candidate;
            }
        }
        throw new Error('Failed to generate a unique customerId after 10 retries');
    }
    async findCustomerByEmail(email) {
        return this.userModel
            .findOne({ email: email.toLowerCase(), role: 'user' })
            .select('-password')
            .exec();
    }
    serializeCustomer(user, stats) {
        const registrationType = user.registrationType === 'manual' ? 'manual' : 'website';
        const emailVerified = registrationType === 'manual'
            ? false
            : (user.emailVerified ?? !user.activationToken);
        return {
            _id: user._id,
            recordId: user._id,
            customerId: user.customerId ?? '',
            customerName: user.fullName ?? user.email?.split('@')[0] ?? 'Customer',
            emailAddress: String(user.email ?? '').endsWith(UsersService_1.NO_EMAIL_DOMAIN) ? '' : user.email,
            phoneNumber: user.phoneNumber ?? 'Not provided',
            customerAddress: user.customerAddress ?? 'Not provided',
            isActive: user.isActive === true,
            createdAt: user.createdAt,
            source: 'user',
            registrationType,
            type: registrationType === 'manual' ? 'Manual' : 'Website',
            emailVerified,
            totalOrders: stats?.totalOrders ?? 0,
            totalAmount: stats?.totalAmount ?? 0,
            activeOrders: stats?.activeOrders ?? 0,
        };
    }
    normalisePhone(raw) {
        if (!raw)
            return '0000000000';
        const digits = raw.replace(/\D/g, '');
        if (digits.startsWith('94') && digits.length === 11) {
            return `0${digits.slice(2)}`;
        }
        return digits.length >= 10 ? digits.slice(-10) : '0000000000';
    }
    static { this.NO_EMAIL_DOMAIN = '@manual.magnify.local'; }
    async assertPhoneOk(phone, exceptId) {
        if (!/^\d{10}$/.test(phone ?? '')) {
            throw new common_1.BadRequestException('Phone number must contain exactly 10 digits');
        }
        const clash = await this.userModel.findOne({ phoneNumber: phone, role: 'user' }).exec();
        if (clash && clash._id.toString() !== exceptId) {
            throw new common_1.ConflictException(`This phone number is already used by customer ${clash.customerId || clash.fullName || ''}`.trim());
        }
    }
    async createCustomer(dto) {
        if (!dto.customerName || dto.customerName.trim().length < 2) {
            throw new common_1.BadRequestException('Full name is required');
        }
        if (!dto.customerAddress || dto.customerAddress.trim().length < 5) {
            throw new common_1.BadRequestException('Shipping address is required');
        }
        await this.assertPhoneOk(dto.phoneNumber);
        const given = (dto.emailAddress ?? '').trim();
        if (given && !/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(given)) {
            throw new common_1.BadRequestException('Email should be in a valid format like user@example.com');
        }
        const email = (given || `${dto.phoneNumber}${UsersService_1.NO_EMAIL_DOMAIN}`).toLowerCase();
        const existing = await this.findByEmail(email);
        if (existing) {
            throw new common_1.ConflictException(`Customer with email "${email}" already exists`);
        }
        const randomPassword = crypto.randomUUID();
        const user = await this.create(email, randomPassword, 'user', dto.customerName, {
            phoneNumber: dto.phoneNumber,
            customerAddress: dto.customerAddress,
            isActive: true,
            registrationType: 'manual',
            emailVerified: false,
        });
        await this.generateAndAssignCustomerId(user._id.toString());
        const fresh = await this.findById(user._id.toString());
        return this.serializeCustomer(fresh);
    }
    async findCustomerByEmailAddress(email) {
        const user = await this.findCustomerByEmail(email);
        return user ? this.serializeCustomerWithStats(user) : null;
    }
    async findAllCustomers(page = 1, limit = 10) {
        const allUsers = await this.findAllByRole('user');
        const activeTotal = allUsers.filter((user) => user.isActive === true).length;
        const total = allUsers.length;
        const skip = (page - 1) * limit;
        const pageUsers = allUsers.slice(skip, skip + limit);
        const stats = await this.orderStatsByEmail(pageUsers.map((u) => u.email));
        const data = pageUsers.map((u) => this.serializeCustomer(u, stats.get(String(u.email ?? '').toLowerCase())));
        return {
            data,
            total,
            activeTotal,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
    async findOneCustomer(id) {
        const user = await this.findCustomerByIdOrCustomerId(id);
        if (!user)
            throw new common_1.NotFoundException(`Customer with ID "${id}" not found`);
        return this.serializeCustomerWithStats(user);
    }
    async updateCustomer(id, dto) {
        const existing = await this.findCustomerByIdOrCustomerId(id);
        if (!existing)
            throw new common_1.NotFoundException(`Customer with ID "${id}" not found`);
        if (dto.emailAddress) {
            const clash = await this.findByEmail(dto.emailAddress.toLowerCase());
            if (clash &&
                clash._id.toString() !== existing._id.toString()) {
                throw new common_1.ConflictException(`Customer with email "${dto.emailAddress}" already exists`);
            }
        }
        if (dto.phoneNumber !== undefined && dto.phoneNumber !== existing.phoneNumber) {
            await this.assertPhoneOk(dto.phoneNumber, existing._id.toString());
        }
        const fields = {};
        if (dto.customerName !== undefined)
            fields.fullName = dto.customerName;
        if (dto.emailAddress !== undefined)
            fields.email = dto.emailAddress.toLowerCase();
        if (dto.phoneNumber !== undefined)
            fields.phoneNumber = dto.phoneNumber;
        if (dto.customerAddress !== undefined)
            fields.customerAddress = dto.customerAddress;
        const updated = await this.updateCustomerFields(existing._id.toString(), fields);
        return this.serializeCustomer(updated);
    }
    async removeCustomer(id) {
        const existing = await this.findCustomerByIdOrCustomerId(id);
        if (!existing)
            throw new common_1.NotFoundException(`Customer with ID "${id}" not found`);
        const updated = await this.updateCustomerFields(existing._id.toString(), { isActive: false });
        return this.serializeCustomer(updated);
    }
    async setCustomerActiveStatus(id, isActive, _source) {
        const existing = await this.findCustomerByIdOrCustomerId(id);
        if (!existing) {
            const byId = await this.updateActiveStatus(id, isActive);
            if (!byId)
                throw new common_1.NotFoundException(`Customer with ID "${id}" not found`);
            return byId;
        }
        const updated = await this.updateActiveStatus(existing._id.toString(), isActive);
        return this.serializeCustomer(updated);
    }
    async updateCustomerByToken(token, dto) {
        const user = await this.findByActivationToken(token);
        if (!user)
            throw new common_1.UnauthorizedException('Invalid activation token');
        if (user.emailVerified === true) {
            if (user.isActive !== true) {
                throw new common_1.UnauthorizedException('This account is disabled. Please contact support.');
            }
            if (!user.customerId) {
                await this.generateAndAssignCustomerId(user._id.toString());
            }
            const current = await this.findById(user._id.toString());
            return {
                ...this.serializeCustomer(current ?? user),
                alreadyActivated: true,
            };
        }
        if (user.activationExpires && user.activationExpires < new Date()) {
            throw new common_1.UnauthorizedException('This activation link has expired.');
        }
        const updated = await this.userModel
            .findByIdAndUpdate(user._id, {
            $set: { isActive: true, emailVerified: true },
        }, { new: true })
            .select('-password')
            .exec();
        if (!user.customerId) {
            await this.generateAndAssignCustomerId(user._id.toString());
        }
        const fresh = await this.findById(user._id.toString());
        return this.serializeCustomer(fresh ?? updated);
    }
    async ensureForRegisteredUser(user) {
        const existing = await this.findByEmail(user.email);
        if (!existing || existing.role !== 'user')
            return null;
        if (!existing.customerId) {
            await this.generateAndAssignCustomerId(existing._id.toString());
        }
        const fresh = await this.findById(existing._id.toString());
        return this.serializeCustomer(fresh);
    }
    async updateFromOrder(order) {
        const email = order.email.trim().toLowerCase();
        const phoneNumber = this.normalisePhone(order.phone);
        const user = await this.findByEmail(email);
        if (user) {
            const fields = { phoneNumber };
            if (order.shippingAddress.trim())
                fields.customerAddress = order.shippingAddress.trim();
            if (!user.fullName && order.customerName?.trim()) {
                fields.fullName = order.customerName.trim();
            }
            const updated = await this.updateCustomerFields(user._id.toString(), fields);
            return this.serializeCustomer(updated);
        }
        const randomPassword = crypto.randomUUID();
        await this.create(email, randomPassword, 'user', order.customerName.trim(), {
            phoneNumber,
            customerAddress: order.shippingAddress.trim(),
            isActive: true,
            ...(order.manual ? { registrationType: 'manual', emailVerified: false } : {}),
        });
        return null;
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = UsersService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __param(1, (0, mongoose_1.InjectModel)(order_schema_1.Order.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model])
], UsersService);
//# sourceMappingURL=users.service.js.map