import { IsBoolean, IsEmail, IsEnum, IsIn, IsOptional, IsString } from 'class-validator';
import { OrderStatus } from '../schemas/order.schema';

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatus)
  status: OrderStatus;

  @IsOptional()
  @IsString()
  adminNote?: string;

  @IsOptional()
  @IsBoolean()
  sendEmailNotification?: boolean;

  @IsOptional()
  @IsIn(['paid', 'pending', 'failed', 'refunded'])
  paymentStatus?: string;

  // Contact details can be corrected from the order details screen.
  @IsOptional()
  @IsString()
  customerName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  shippingAddress?: string;
}