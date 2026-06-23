import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Customer, CustomerDocument } from './customer.schema';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { UsersService } from '../users/users.service';

@Injectable()
export class CustomerService {
  constructor(
    @InjectModel(Customer.name)
    private readonly customerModel: Model<CustomerDocument>,
    private readonly usersService: UsersService,
  ) {}

  /**
   * Create a new customer.
   * Checks for duplicate email before saving.
   */
  async create(createCustomerDto: CreateCustomerDto): Promise<CustomerDocument> {
    const existingCustomer = await this.customerModel.findOne({
      emailAddress: createCustomerDto.emailAddress.toLowerCase(),
    });

    if (existingCustomer) {
      throw new ConflictException(
        `Customer with email "${createCustomerDto.emailAddress}" already exists`,
      );
    }

    const customer = new this.customerModel(createCustomerDto);
    return customer.save();
  }

  async findByEmail(emailAddress: string): Promise<CustomerDocument | null> {
    return this.customerModel
      .findOne({ emailAddress: emailAddress.toLowerCase() })
      .exec();
  }

  async ensureForRegisteredUser(user: {
    email: string;
    fullName?: string;
  }): Promise<CustomerDocument> {
    const existingCustomer = await this.findByEmail(user.email);

    if (existingCustomer) {
      return existingCustomer;
    }

    const fallbackName = user.email.split('@')[0] || 'Website Customer';

    const customer = new this.customerModel({
      customerName: user.fullName || fallbackName,
      emailAddress: user.email,
      phoneNumber: '0000000000',
      customerAddress: 'Not provided',
    });

    return customer.save();
  }

  /**
   * Find all active customers with pagination, sorted by createdAt descending.
   */
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
    const [customerDocs, users] = await Promise.all([
      this.customerModel
        .find()
        .sort({ createdAt: -1 })
        .exec(),
      this.usersService.findAll(),
    ]);

    const usersByEmail = new Map(
      users
        .filter((user: any) => user.role === 'user')
        .map((user: any) => [user.email?.toLowerCase(), user]),
    );
    const customers: any[] = customerDocs.map((customer) => {
      const item: any = customer.toObject();
      const registeredUser: any = usersByEmail.get(
        item.emailAddress?.toLowerCase(),
      );

      return registeredUser
        ? {
            ...item,
            recordId: registeredUser._id,
            source: 'user',
            isActive: registeredUser.isActive === true,
          }
        : { ...item, recordId: item._id, source: 'customer' };
    });
    const customerEmails = new Set(
      customers.map((customer) => customer.emailAddress?.toLowerCase()),
    );

    const userCustomers: any[] = users
      .filter(
        (user: any) =>
          user.role === 'user' && !customerEmails.has(user.email?.toLowerCase()),
      )
      .map((user: any) => ({
        _id: user._id,
        customerId: `USER-${String(user._id).slice(-6).toUpperCase()}`,
        customerName:
          user.fullName || user.email?.split('@')[0] || 'Website Customer',
        emailAddress: user.email,
        phoneNumber: 'Not provided',
        customerAddress: 'Not provided',
        recordId: user._id,
        createdAt: user.createdAt,
        source: 'user',
        isActive: user.isActive === true,
      }));

    const allCustomers: any[] = [...customers, ...userCustomers].sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    });

    const total = allCustomers.length;
    const skip = (page - 1) * limit;
    const data = allCustomers.slice(skip, skip + limit);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Find a single customer by MongoDB _id or customerId (#CUST-XXXX).
   */
  async findOne(id: string): Promise<CustomerDocument> {
    let customer: CustomerDocument | null = null;

    if (id.startsWith('#CUST-') || id.startsWith('CUST-')) {
      // Query by customerId field
      const queryId = id.startsWith('#') ? id : `#${id}`;
      customer = await this.customerModel.findOne({ customerId: queryId }).exec();
    } else if (Types.ObjectId.isValid(id)) {
      // Query by MongoDB _id
      customer = await this.customerModel.findById(id).exec();
    }

    if (!customer) {
      throw new NotFoundException(`Customer with ID "${id}" not found`);
    }

    return customer;
  }

  /**
   * Update a customer by MongoDB _id or customerId.
   * Checks for duplicate email against other customers.
   */
  async update(
    id: string,
    updateCustomerDto: UpdateCustomerDto,
  ): Promise<CustomerDocument> {
    const customer = await this.findOne(id);

    // Check for duplicate email if email is being updated
    if (updateCustomerDto.emailAddress) {
      const existingCustomer = await this.customerModel.findOne({
        emailAddress: updateCustomerDto.emailAddress.toLowerCase(),
        _id: { $ne: customer._id },
      });

      if (existingCustomer) {
        throw new ConflictException(
          `Customer with email "${updateCustomerDto.emailAddress}" already exists`,
        );
      }
    }

    const updatedCustomer = await this.customerModel
      .findByIdAndUpdate(
        customer._id,
        { $set: updateCustomerDto },
        { new: true, runValidators: true },
      )
      .exec();

    return updatedCustomer as CustomerDocument;
  }

  /**
   * Soft delete a customer by setting isActive to false.
   */
  async remove(id: string): Promise<CustomerDocument> {
    const customer = await this.findOne(id);
    customer.isActive = false;
    return customer.save();
  }

  async setActiveStatus(
    id: string,
    isActive: boolean,
    source: 'user' | 'customer',
  ): Promise<CustomerDocument | any> {
    if (source === 'user') {
      const user = await this.usersService.updateActiveStatus(id, isActive);
      if (!user) {
        throw new NotFoundException(`Registered user with ID "${id}" not found`);
      }

      await this.ensureForRegisteredUser({
        email: user.email,
        fullName: user.fullName,
      });
      await this.customerModel.updateOne(
        { emailAddress: user.email.toLowerCase() },
        { $set: { isActive } },
      );
      return user;
    }

    const customer = await this.findOne(id);
    customer.isActive = isActive;
    return customer.save();
  }

  async updateFromOrder(order: {
    email: string;
    customerName: string;
    phone?: string;
    shippingAddress: string;
  }): Promise<CustomerDocument> {
    const emailAddress = order.email.trim().toLowerCase();
    const digits = (order.phone || '').replace(/\D/g, '');
    const phoneNumber =
      digits.startsWith('94') && digits.length === 11
        ? `0${digits.slice(2)}`
        : digits.length >= 10
          ? digits.slice(-10)
          : '0000000000';

    const customer = await this.findByEmail(emailAddress);
    if (customer) {
      customer.customerName = order.customerName.trim() || customer.customerName;
      customer.phoneNumber = phoneNumber;
      customer.customerAddress = order.shippingAddress.trim();
      return customer.save();
    }

    return new this.customerModel({
      customerName: order.customerName.trim(),
      emailAddress,
      phoneNumber,
      customerAddress: order.shippingAddress.trim(),
      isActive: true,
    }).save();
  }
}
