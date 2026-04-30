import { IsOptional } from 'class-validator';

export class CreateProductDto {
  productName: any;
  productId: any;
  category: any;
  stock: any;
  price: any;
  description: any;

  @IsOptional()
  personalizationEnabled?: any;

  @IsOptional()
  personalization?: string[];

  @IsOptional()
  status?: string;
}
