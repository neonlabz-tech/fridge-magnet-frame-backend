import {
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class CreateCustomerDto {
  @ValidateIf((o) => o.customerName == null)
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @ValidateIf((o) => o.emailAddress == null)
  @Matches(/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.(com|net|org)$/, {
    message:
      'Email should be in a valid format like user@example.com and use a .com, .net, or .org domain',
  })
  @IsNotEmpty()
  email?: string;

  @ValidateIf((o) => o.phoneNumber == null)
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{10}$/, {
    message: 'Phone number must contain exactly 10 digits',
  })
  phone?: string;

  @ValidateIf((o) => o.customerAddress == null)
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(255)
  address?: string;

  @ValidateIf((o) => o.name == null)
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  customerName!: string;

  @ValidateIf((o) => o.email == null)
  @Matches(/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.(com|net|org)$/, {
    message:
      'Email should be in a valid format like user@example.com and use a .com, .net, or .org domain',
  })
  @IsNotEmpty()
  emailAddress!: string;

  @ValidateIf((o) => o.phone == null)
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{10}$/, {
    message: 'Phone number must contain exactly 10 digits',
  })
  phoneNumber!: string;

  @ValidateIf((o) => o.address == null)
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(255)
  customerAddress!: string;
}
