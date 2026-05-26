import { Type } from 'class-transformer';
import {
  IsArray,
  IsEmail,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

class CreateOrderItemDto {
  @IsOptional()
  @IsString()
  productId?: string;

  @IsString()
  name: string;

  @IsNumber()
  price: number;

  @IsNumber()
  quantity: number;

  @IsOptional()
  @IsString()
  image?: string;

  @IsOptional()
  @IsString()
  frameType?: string;

  @IsOptional()
  @IsString()
  colorOption?: string;
}

export class CreateOrderDto {
  @IsString()
  orderId: string;

  @IsString()
  customerName: string;

  @IsString()
  customerId: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsNumber()
  qty: number;

  @IsNumber()
  totalValue: number;

  @IsString()
  shippingAddress: string;

  @IsOptional()
  @IsString()
  adminNote?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items?: CreateOrderItemDto[];
}
