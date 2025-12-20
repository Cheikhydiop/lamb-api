// src/dto/auth/user.ts
import { Exclude, Expose } from 'class-transformer';
import { IsEmail, IsNotEmpty } from 'class-validator';
import { Organization } from '../../entity/Organization';
import { UserStatus } from '../../entity/User';

export class SignUpDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  password: string;

  @IsNotEmpty()
  first_name: string;

  @IsNotEmpty()
  last_name: string;
}

export class SignInDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  password: string;
}

@Exclude()
export class UserDto {
  @Expose()
  id: number;

  @Expose()
  first_name: string;

  @Expose()
  last_name: string;

  @Expose()
  email: string;

  @Expose()
  status: string;

  @Expose()
  is_email_verified: boolean;

  @Expose()
  organization?: Organization;
}

export interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  organization?: Organization;
  status?: UserStatus;
}

export interface UserSingIn {
  email: string;
  password: string;
}
