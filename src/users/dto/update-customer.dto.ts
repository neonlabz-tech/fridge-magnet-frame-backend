import {
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateCustomerDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  customerName?: string;

  @IsOptional()
  @Matches(/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.(com|net|org)$/, {
    message:
      'Email should be in a valid format like user@example.com and use a .com, .net, or .org domain',
  })
  emailAddress?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{10}$/, {
    message: 'Phone number must contain exactly 10 digits',
  })
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  @MinLength(5)
  @MaxLength(255)
  customerAddress?: string;
}
