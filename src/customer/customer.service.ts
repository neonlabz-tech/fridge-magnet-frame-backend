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

@Injectable()
export class CustomerService {
  constructor(
    @InjectModel(Customer.name)
    private readonly customerModel: Model<CustomerDocument>,
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

  /**
   * Find all active customers with pagination, sorted by createdAt descending.
   */
  async findAll(
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    data: CustomerDocument[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.customerModel
        .find({ isActive: true })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.customerModel.countDocuments({ isActive: true }).exec(),
    ]);

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
}
