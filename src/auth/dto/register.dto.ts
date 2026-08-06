import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
  @IsString()
  @IsOptional()
  @MinLength(2)
  @MaxLength(100)
  fullName?: string;

  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsNotEmpty()
  @MinLength(6)
  password!: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  phoneNumber?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  customerAddress?: string;
}