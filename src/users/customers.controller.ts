import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Controller('customers')
export class CustomersController {
  constructor(private readonly usersService: UsersService) {}

  private normalizeCustomerDto(input: any): CreateCustomerDto | UpdateCustomerDto {
    const normalized = {
      customerName: input.customerName ?? input.name,
      emailAddress: input.emailAddress ?? input.email,
      phoneNumber: input.phoneNumber ?? input.phone,
      customerAddress: input.customerAddress ?? input.address,
    };

    if (typeof normalized.emailAddress === 'string' && !normalized.emailAddress.trim()) {
      normalized.emailAddress = undefined; // email is optional
    }

    return Object.fromEntries(
      Object.entries(normalized).filter(([, value]) => value !== undefined),
    ) as CreateCustomerDto | UpdateCustomerDto;
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createCustomerDto: any) {
    const normalized = this.normalizeCustomerDto(createCustomerDto) as CreateCustomerDto;
    const customer = await this.usersService.createCustomer(normalized);
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Customer created successfully',
      data: customer,
    };
  }

  @Get()
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;

    const result = await this.usersService.findAllCustomers(pageNum, limitNum);

    return {
      statusCode: HttpStatus.OK,
      message: 'Customers retrieved successfully',
      data: result.data,
      total: result.total,
      activeTotal: result.activeTotal,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
  }

  @Get('by-email/:email')
  async findByEmail(@Param('email') email: string) {
    const customer = await this.usersService.findCustomerByEmailAddress(
      decodeURIComponent(email),
    );

    return {
      statusCode: HttpStatus.OK,
      message: customer ? 'Customer retrieved successfully' : 'Customer not found',
      data: customer,
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const customer = await this.usersService.findOneCustomer(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Customer retrieved successfully',
      data: customer,
    };
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateCustomerDto: any) {
    const customer = await this.usersService.updateCustomer(
      id,
      this.normalizeCustomerDto(updateCustomerDto) as UpdateCustomerDto,
    );
    return {
      statusCode: HttpStatus.OK,
      message: 'Customer updated successfully',
      data: customer,
    };
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { isActive: boolean; source: 'user' | 'customer' },
  ) {
    const customer = await this.usersService.setCustomerActiveStatus(
      id,
      body.isActive,
      body.source,
    );
    return {
      statusCode: HttpStatus.OK,
      message: body.isActive
        ? 'Customer enabled successfully'
        : 'Customer disabled successfully',
      data: customer,
    };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const customer = await this.usersService.removeCustomer(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Customer deleted successfully',
      data: customer,
    };
  }
}
