
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../schemas/user.schema';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async create(
    email: string,
    password: string,
    role: string = 'user',
    fullName?: string,
  ): Promise<User> {
    const hashedPassword = await bcrypt.hash(password, 10);
    const createdUser = new this.userModel({
      email,
      password: hashedPassword,
      role,
      fullName,
      isActive: role === 'admin',
    });
    return createdUser.save();
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ email }).exec();
  }
  
  async findByResetToken(token: string): Promise<User | null> {
    // Find all users with a reset token set, then compare with bcrypt
    const candidates = await this.userModel.find({ 
      passwordResetToken: { $exists: true, $ne: null } 
    }).exec();
    
    for (const user of candidates) {
      if (user.passwordResetToken && await bcrypt.compare(token, user.passwordResetToken)) {
        return user;
      }
    }
    return null;
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
}
