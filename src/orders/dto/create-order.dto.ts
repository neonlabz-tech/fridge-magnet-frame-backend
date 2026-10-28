import { Type } from 'class-transformer';
import {
  IsArray,
  IsEmail,
  IsIn,
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
  name?: string;

  @IsNumber()
  price?: number;

  @IsNumber()
  quantity?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  uploadedImages?: string[];

  @IsOptional()
  @IsString()
  primaryImage?: string;

  @IsOptional()
  @IsString()
  frameType?: string;

  @IsOptional()
  @IsString()
  colorOption?: string;
}

export class CreateOrderDto {
  @IsString()
  orderId?: string;

  @IsString()
  customerName?: string;

  @IsOptional()
  @IsString()
  customerId?: string;

  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsNumber()
  qty?: number;

  @IsNumber()
  totalValue?: number;

  @IsOptional()
  @IsNumber()
  deliveryFee?: number;

  @IsString()
  shippingAddress?: string;

  @IsOptional()
  @IsString()
  district?: string;

  @IsOptional()
  @IsString()
  adminNote?: string;

  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @IsOptional()
  @IsIn(['paid', 'pending', 'failed', 'refunded'])
  paymentStatus?: string;

  // 'direct' = order entered by staff in the dashboard (Direct Order).
  @IsOptional()
  @IsString()
  orderSource?: string;

  @IsOptional()
  @IsArray()
  uploadedImages?: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items?: CreateOrderItemDto[];
}
