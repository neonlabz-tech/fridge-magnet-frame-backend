import { IsOptional } from 'class-validator';

export class UpdateProductDto {
  @IsOptional()
  productName?: any;

  @IsOptional()
  productId?: any;

  @IsOptional()
  category?: any;

  @IsOptional()
  stock?: any;

  @IsOptional()
  price?: any;

  @IsOptional()
  description?: any;

  @IsOptional()
  personalizationEnabled?: any;

  @IsOptional()
  personalization?: string[];

  @IsOptional()
  status?: string;
}
