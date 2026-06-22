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
import { CustomerService } from './customer.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Controller('customers')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  private normalizeCustomerDto(input: any): CreateCustomerDto | UpdateCustomerDto {
    const normalized = {
      customerName: input.customerName ?? input.name,
      emailAddress: input.emailAddress ?? input.email,
      phoneNumber: input.phoneNumber ?? input.phone,
      customerAddress: input.customerAddress ?? input.address,
    };

    return Object.fromEntries(
      Object.entries(normalized).filter(([, value]) => value !== undefined),
    ) as CreateCustomerDto | UpdateCustomerDto;
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createCustomerDto: any) {
    const normalizedCreateCustomerDto = this.normalizeCustomerDto(
      createCustomerDto,
    ) as CreateCustomerDto;
    const customer = await this.customerService.create(normalizedCreateCustomerDto);
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

    const result = await this.customerService.findAll(pageNum, limitNum);

    return {
      statusCode: HttpStatus.OK,
      message: 'Customers retrieved successfully',
      data: result.data,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const customer = await this.customerService.findOne(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Customer retrieved successfully',
      data: customer,
    };
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateCustomerDto: any,
  ) {
    const customer = await this.customerService.update(
      id,
      this.normalizeCustomerDto(updateCustomerDto) as UpdateCustomerDto,
    );
    return {
      statusCode: HttpStatus.OK,
      message: 'Customer updated successfully',
      data: customer,
    };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const customer = await this.customerService.remove(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Customer deleted successfully',
      data: customer,
    };
  }
}
