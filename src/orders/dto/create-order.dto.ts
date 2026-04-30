import { IsEmail, IsNumber, IsString } from 'class-validator';

export class CreateOrderDto {
  @IsString()
  orderId: string;

  @IsString()
  customerName: string;

  @IsString()
  customerId: string;

  @IsEmail()
  email: string;

  @IsNumber()
  qty: number;

  @IsNumber()
  totalValue: number;

  @IsString()
  shippingAddress: string;
}