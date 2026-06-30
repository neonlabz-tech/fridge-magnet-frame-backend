import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
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
}