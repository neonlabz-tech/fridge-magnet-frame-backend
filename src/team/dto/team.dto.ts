import {
  IsArray,
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';
import { PAGE_HREFS } from '../schemas/team.schema';

const USERNAME_RX = /^[a-z0-9._-]{3,}$/;

export class CreateMemberDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @IsNotEmpty()
  phone!: string;

  @IsOptional()
  @IsString()
  role?: string;

  /** Optional: defaults to the generated member ID (e.g. BO001 -> bo001). */
  @IsOptional()
  @Matches(USERNAME_RX, {
    message: 'username must be at least 3 characters of a-z, 0-9, . _ -',
  })
  username?: string;

  @IsString()
  @MinLength(6)
  password!: string;
}

export class UpdateMemberDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  phone?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  role?: string;

  @IsOptional()
  @Matches(USERNAME_RX, {
    message: 'username must be at least 3 characters of a-z, 0-9, . _ -',
  })
  username?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @IsOptional()
  @IsIn(['Active', 'Inactive'])
  status?: string;
}

export class ResetPasswordDto {
  @IsString()
  @MinLength(6)
  password!: string;
}

export class MemberLoginDto {
  @IsString()
  @IsNotEmpty()
  username!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;
}

export class CreateRoleDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @IsArray()
  @IsIn(PAGE_HREFS, { each: true })
  pages?: string[];
}

export class UpdateRoleDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsArray()
  @IsIn(PAGE_HREFS, { each: true })
  pages?: string[];
}
