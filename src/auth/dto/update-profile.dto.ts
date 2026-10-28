import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  fullName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  customerAddress?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  bio?: string;

  @IsOptional()
  @IsString()
  avatar?: string;

  @IsOptional()
  @IsBoolean()
  twoFactorEnabled?: boolean;

  // Password change is optional. When a new password is provided, the current
  // password is required so we can verify the request.
  @IsOptional()
  @IsString()
  currentPassword?: string;

  @ValidateIf((dto: UpdateProfileDto) => !!dto.newPassword)
  @IsString()
  @MinLength(6)
  newPassword?: string;
}
