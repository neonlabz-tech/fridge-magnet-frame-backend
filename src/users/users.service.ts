import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User } from '../schemas/user.schema';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  // ── Core auth methods ─────────────────────────────────────────────────────

  async create(
    email: string,
    password: string,
    role: string = 'user',
    fullName?: string,
    customerFields?: {
      phoneNumber?: string;
      customerAddress?: string;
      customerId?: string;
    },
  ): Promise<User> {
    const hashedPassword = await bcrypt.hash(password, 10);
    const createdUser = new this.userModel({
      email,
      password: hashedPassword,
      role,
      fullName,
      isActive: true,
      ...(customerFields ?? {}),
    });
    return createdUser.save();
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async findByResetToken(token: string): Promise<User | null> {
    const hashedToken = crypto
      .createHash('sha256')
      .update(token.trim())
      .digest('hex');
    return this.userModel.findOne({ passwordResetToken: hashedToken }).exec();
  }

  async findAll(): Promise<User[]> {
    return this.userModel.find().select('-password').exec();
  }

  async findById(id: string): Promise<User | null> {
    return this.userModel.findById(id).select('-password').exec();
  }

  async updateActiveStatus(id: string, isActive: boolean): Promise<User | null> {
    return this.userModel
      .findByIdAndUpdate(id, { $set: { isActive } }, { new: true })
      .select('-password')
      .exec();
  }

  async findByIdWithPassword(id: string): Promise<User | null> {
    return this.userModel.findById(id).exec();
  }

  async updateProfile(
    id: string,
    update: Partial<
      Pick<User, 'fullName' | 'email' | 'bio' | 'avatar' | 'twoFactorEnabled'>
    >,
  ): Promise<User | null> {
    return this.userModel
      .findByIdAndUpdate(id, { $set: update }, { new: true })
      .select('-password')
      .exec();
  }

  async updateAvatar(
    id: string,
    avatar: string,
    avatarPublicId: string,
  ): Promise<User | null> {
    return this.userModel
      .findByIdAndUpdate(id, { $set: { avatar, avatarPublicId } }, { new: true })
      .select('-password')
      .exec();
  }

  async updatePassword(id: string, newHashedPassword: string): Promise<void> {
    await this.userModel
      .findByIdAndUpdate(id, { $set: { password: newHashedPassword } })
      .exec();
  }

  async createAdmin(email: string, password: string): Promise<User> {
    return this.create(email, password, 'admin');
  }

  // ── Low-level customer helpers ────────────────────────────────────────────

  async findAllByRole(role: string): Promise<User[]> {
    return this.userModel
      .find({ role })
      .select('-password')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findCustomerByIdOrCustomerId(id: string): Promise<User | null> {
    if (id.startsWith('#CUST-') || id.startsWith('CUST-')) {
      const normalised = id.startsWith('#') ? id : `#${id}`;
      return this.userModel
        .findOne({ customerId: normalised, role: 'user' })
        .select('-password')
        .exec();
    }

    if (Types.ObjectId.isValid(id)) {
      return this.userModel
        .findOne({ _id: id, role: 'user' })
        .select('-password')
        .exec();
    }

    return null;
  }

  async updateCustomerFields(
    id: string,
    fields: Partial<Pick<User, 'fullName' | 'phoneNumber' | 'customerAddress' | 'isActive'>>,
  ): Promise<User | null> {
    return this.userModel
      .findByIdAndUpdate(id, { $set: fields }, { new: true })
      .select('-password')
      .exec();
  }

  async generateAndAssignCustomerId(userId: string): Promise<string> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) throw new Error(`User ${userId} not found`);
    if (user.customerId) return user.customerId;

    const generate = () =>
      `#CUST-${Math.floor(1000 + Math.random() * 9000)}`;

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

  async findCustomerByEmail(email: string): Promise<User | null> {
    return this.userModel
      .findOne({ email: email.toLowerCase(), role: 'user' })
      .select('-password')
      .exec();
  }

  // ── Customer serialization & phone helpers ────────────────────────────────

  private serializeCustomer(user: any) {
    return {
      _id: user._id,
      recordId: user._id,
      customerId: user.customerId ?? '',
      customerName: user.fullName ?? user.email?.split('@')[0] ?? 'Customer',
      emailAddress: user.email,
      phoneNumber: user.phoneNumber ?? 'Not provided',
      customerAddress: user.customerAddress ?? 'Not provided',
      isActive: user.isActive === true,
      createdAt: user.createdAt,
      source: 'user' as const,
    };
  }

  private normalisePhone(raw?: string): string {
    if (!raw) return '0000000000';
    const digits = raw.replace(/\D/g, '');
    if (digits.startsWith('94') && digits.length === 11) {
      return `0${digits.slice(2)}`;
    }
    return digits.length >= 10 ? digits.slice(-10) : '0000000000';
  }

  // ── Customer CRUD (called by CustomersController) ─────────────────────────

  async createCustomer(dto: CreateCustomerDto): Promise<any> {
    const email = dto.emailAddress.toLowerCase();

    const existing = await this.findByEmail(email);
    if (existing) {
      throw new ConflictException(
        `Customer with email "${dto.emailAddress}" already exists`,
      );
    }

    const randomPassword = crypto.randomUUID();
    const user = await this.create(email, randomPassword, 'user', dto.customerName, {
      phoneNumber: dto.phoneNumber,
      customerAddress: dto.customerAddress,
    });

    await this.generateAndAssignCustomerId((user._id as any).toString());

    const fresh = await this.findById((user._id as any).toString());
    return this.serializeCustomer(fresh);
  }

  async findCustomerByEmailAddress(email: string): Promise<any | null> {
    const user = await this.findCustomerByEmail(email);
    return user ? this.serializeCustomer(user) : null;
  }

  async findAllCustomers(
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    data: any[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const allUsers = await this.findAllByRole('user');
    const total = allUsers.length;
    const skip = (page - 1) * limit;
    const data = allUsers
      .slice(skip, skip + limit)
      .map((u) => this.serializeCustomer(u));

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOneCustomer(id: string): Promise<any> {
    const user = await this.findCustomerByIdOrCustomerId(id);
    if (!user) throw new NotFoundException(`Customer with ID "${id}" not found`);
    return this.serializeCustomer(user);
  }

  async updateCustomer(id: string, dto: UpdateCustomerDto): Promise<any> {
    const existing = await this.findCustomerByIdOrCustomerId(id);
    if (!existing) throw new NotFoundException(`Customer with ID "${id}" not found`);

    if (dto.emailAddress) {
      const clash = await this.findByEmail(dto.emailAddress.toLowerCase());
      if (
        clash &&
        (clash._id as any).toString() !== (existing._id as any).toString()
      ) {
        throw new ConflictException(
          `Customer with email "${dto.emailAddress}" already exists`,
        );
      }
    }

    const fields: Record<string, any> = {};
    if (dto.customerName !== undefined) fields.fullName = dto.customerName;
    if (dto.emailAddress !== undefined)
      fields.email = dto.emailAddress.toLowerCase();
    if (dto.phoneNumber !== undefined) fields.phoneNumber = dto.phoneNumber;
    if (dto.customerAddress !== undefined)
      fields.customerAddress = dto.customerAddress;

    const updated = await this.updateCustomerFields(
      (existing._id as any).toString(),
      fields,
    );
    return this.serializeCustomer(updated);
  }

  async removeCustomer(id: string): Promise<any> {
    const existing = await this.findCustomerByIdOrCustomerId(id);
    if (!existing) throw new NotFoundException(`Customer with ID "${id}" not found`);

    const updated = await this.updateCustomerFields(
      (existing._id as any).toString(),
      { isActive: false },
    );
    return this.serializeCustomer(updated);
  }

  async setCustomerActiveStatus(
    id: string,
    isActive: boolean,
    _source: 'user' | 'customer',
  ): Promise<any> {
    const existing = await this.findCustomerByIdOrCustomerId(id);

    if (!existing) {
      const byId = await this.updateActiveStatus(id, isActive);
      if (!byId) throw new NotFoundException(`Customer with ID "${id}" not found`);
      return byId;
    }

    const updated = await this.updateActiveStatus(
      (existing._id as any).toString(),
      isActive,
    );
    return this.serializeCustomer(updated);
  }

  // ── Methods called by AuthService / OrdersService ─────────────────────────

  async ensureForRegisteredUser(user: {
    email: string;
    fullName?: string;
  }): Promise<any> {
    const existing = await this.findByEmail(user.email);
    if (!existing || existing.role !== 'user') return null;

    if (!existing.customerId) {
      await this.generateAndAssignCustomerId((existing._id as any).toString());
    }

    const fresh = await this.findById((existing._id as any).toString());
    return this.serializeCustomer(fresh);
  }

  async updateFromOrder(order: {
    email: string;
    customerName: string;
    phone?: string;
    shippingAddress: string;
  }): Promise<any> {
    const email = order.email.trim().toLowerCase();
    const phoneNumber = this.normalisePhone(order.phone);

    const user = await this.findByEmail(email);

    if (user) {
      const fields: Record<string, any> = {
        phoneNumber,
        customerAddress: order.shippingAddress.trim(),
      };
      if (!user.fullName && order.customerName?.trim()) {
        fields.fullName = order.customerName.trim();
      }

      const updated = await this.updateCustomerFields(
        (user._id as any).toString(),
        fields,
      );

      if (!user.customerId) {
        await this.generateAndAssignCustomerId((user._id as any).toString());
      }

      return this.serializeCustomer(updated);
    }

    const randomPassword = crypto.randomUUID();
    const newUser = await this.create(
      email,
      randomPassword,
      'user',
      order.customerName.trim(),
      {
        phoneNumber,
        customerAddress: order.shippingAddress.trim(),
      },
    );

    await this.generateAndAssignCustomerId((newUser._id as any).toString());

    const fresh = await this.findById((newUser._id as any).toString());
    return this.serializeCustomer(fresh);
  }
}
