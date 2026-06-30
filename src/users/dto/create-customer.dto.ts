import {
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
  customerName!: string;

  @Matches(/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.(com|net|org)$/, {
    message:
      'Email should be in a valid format like user@example.com and use a .com, .net, or .org domain',
  })
  @IsNotEmpty()
  emailAddress!: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{10}$/, {
    message: 'Phone number must contain exactly 10 digits',
  })
  phoneNumber!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(255)
  customerAddress!: string;
}
