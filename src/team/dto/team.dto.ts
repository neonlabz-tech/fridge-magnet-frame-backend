import {
  IsArray,
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';
import { PAGE_HREFS, WIDGET_KEYS } from '../schemas/team.schema';
import { STRONG_PASSWORD_MESSAGE, STRONG_PASSWORD_RX } from '../../common/utils/password';

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
  @Matches(STRONG_PASSWORD_RX, { message: STRONG_PASSWORD_MESSAGE })
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
  @Matches(STRONG_PASSWORD_RX, { message: STRONG_PASSWORD_MESSAGE })
  password?: string;

  @IsOptional()
  @IsIn(['Active', 'Inactive'])
  status?: string;
}

export class ResetPasswordDto {
  /** Optional: when empty the server generates a temporary password. */
  @IsOptional()
  @IsString()
  @Matches(STRONG_PASSWORD_RX, { message: STRONG_PASSWORD_MESSAGE })
  password?: string;
}

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty()
  currentPassword!: string;

  @IsString()
  @Matches(STRONG_PASSWORD_RX, { message: STRONG_PASSWORD_MESSAGE })
  newPassword!: string;

  @IsString()
  @IsNotEmpty()
  confirmPassword!: string;
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

  /** { href: ['view','create','edit','delete'] } – cleaned in the service. */
  @IsOptional()
  @IsObject()
  permissions?: Record<string, string[]>;

  @IsOptional()
  @IsArray()
  @IsIn(WIDGET_KEYS, { each: true })
  widgets?: string[];
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

  @IsOptional()
  @IsObject()
  permissions?: Record<string, string[]>;

  @IsOptional()
  @IsArray()
  @IsIn(WIDGET_KEYS, { each: true })
  widgets?: string[];
}
