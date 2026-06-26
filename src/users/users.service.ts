import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User } from '../schemas/user.schema';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

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
}
