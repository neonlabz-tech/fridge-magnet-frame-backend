import {
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateFeedbackDto {
  @IsOptional()
  @IsString()
  orderNumber?: string;

  @IsOptional()
  @IsString()
  customerName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(5)
  rating?: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  comment?: string;
}
