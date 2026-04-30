import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateCustomerDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  customerName: string;

  @IsEmail()
  @IsNotEmpty()
  emailAddress: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\+?[\d\s\-().]{7,20}$/, {
    message: 'phoneNumber must be a valid phone number',
  })
  phoneNumber: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(255)
  customerAddress: string;
}
