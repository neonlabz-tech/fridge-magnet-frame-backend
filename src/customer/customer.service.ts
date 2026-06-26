import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomerService {
  constructor(private readonly usersService: UsersService) {}

  private serialize(user: any) {
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

  async create(dto: CreateCustomerDto): Promise<any> {
    const email = dto.emailAddress.toLowerCase();

    const existing = await this.usersService.findByEmail(email);
    if (existing) {
      throw new ConflictException(
        `Customer with email "${dto.emailAddress}" already exists`,
      );
    }

    const randomPassword = require('crypto').randomUUID();
    const user = await this.usersService.create(
      email,
      randomPassword,
      'user',
      dto.customerName,
      {
        phoneNumber: dto.phoneNumber,
        customerAddress: dto.customerAddress,
      },
    );

    await this.usersService.generateAndAssignCustomerId(
      (user._id as any).toString(),
    );

    const fresh = await this.usersService.findById(
      (user._id as any).toString(),
    );
    return this.serialize(fresh);
  }

  async findByEmail(emailAddress: string): Promise<any | null> {
    const user = await this.usersService.findCustomerByEmail(emailAddress);
    return user ? this.serialize(user) : null;
  }

  async ensureForRegisteredUser(user: {
    email: string;
    fullName?: string;
  }): Promise<any> {
    const existing = await this.usersService.findByEmail(user.email);

    if (!existing || existing.role !== 'user') {
      return null;
    }

    if (!existing.customerId) {
      await this.usersService.generateAndAssignCustomerId(
        (existing._id as any).toString(),
      );
    }

    const fresh = await this.usersService.findById(
      (existing._id as any).toString(),
    );
    return this.serialize(fresh);
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    data: any[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const allUsers = await this.usersService.findAllByRole('user');
    const total = allUsers.length;
    const skip = (page - 1) * limit;
    const data = allUsers.slice(skip, skip + limit).map((u) => this.serialize(u));

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<any> {
    const user = await this.usersService.findCustomerByIdOrCustomerId(id);

    if (!user) {
      throw new NotFoundException(`Customer with ID "${id}" not found`);
    }

    return this.serialize(user);
  }

  async update(id: string, dto: UpdateCustomerDto): Promise<any> {
    const existing = await this.usersService.findCustomerByIdOrCustomerId(id);

    if (!existing) {
      throw new NotFoundException(`Customer with ID "${id}" not found`);
    }

    if (dto.emailAddress) {
      const clash = await this.usersService.findByEmail(
        dto.emailAddress.toLowerCase(),
      );
      if (clash && (clash._id as any).toString() !== (existing._id as any).toString()) {
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

    const updated = await this.usersService.updateCustomerFields(
      (existing._id as any).toString(),
      fields,
    );

    return this.serialize(updated);
  }

  async remove(id: string): Promise<any> {
    const existing = await this.usersService.findCustomerByIdOrCustomerId(id);

    if (!existing) {
      throw new NotFoundException(`Customer with ID "${id}" not found`);
    }

    const updated = await this.usersService.updateCustomerFields(
      (existing._id as any).toString(),
      { isActive: false },
    );

    return this.serialize(updated);
  }

  async setActiveStatus(
    id: string,
    isActive: boolean,
    _source: 'user' | 'customer',
  ): Promise<any> {
    const existing = await this.usersService.findCustomerByIdOrCustomerId(id);

    if (!existing) {
      const byId = await this.usersService.updateActiveStatus(id, isActive);
      if (!byId) {
        throw new NotFoundException(`Customer with ID "${id}" not found`);
      }
      return byId;
    }

    const updated = await this.usersService.updateActiveStatus(
      (existing._id as any).toString(),
      isActive,
    );

    return this.serialize(updated);
  }

  async updateFromOrder(order: {
    email: string;
    customerName: string;
    phone?: string;
    shippingAddress: string;
  }): Promise<any> {
    const email = order.email.trim().toLowerCase();
    const phoneNumber = this.normalisePhone(order.phone);

    const user = await this.usersService.findByEmail(email);

    if (user) {
      const fields: Record<string, any> = {
        phoneNumber,
        customerAddress: order.shippingAddress.trim(),
      };
      if (!user.fullName && order.customerName?.trim()) {
        fields.fullName = order.customerName.trim();
      }

      const updated = await this.usersService.updateCustomerFields(
        (user._id as any).toString(),
        fields,
      );

      if (!user.customerId) {
        await this.usersService.generateAndAssignCustomerId(
          (user._id as any).toString(),
        );
      }

      return this.serialize(updated);
    }

    const randomPassword = require('crypto').randomUUID();
    const newUser = await this.usersService.create(
      email,
      randomPassword,
      'user',
      order.customerName.trim(),
      {
        phoneNumber,
        customerAddress: order.shippingAddress.trim(),
      },
    );

    await this.usersService.generateAndAssignCustomerId(
      (newUser._id as any).toString(),
    );

    const fresh = await this.usersService.findById(
      (newUser._id as any).toString(),
    );
    return this.serialize(fresh);
  }
}
