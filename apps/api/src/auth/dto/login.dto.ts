import { IsEmail, IsOptional, IsString } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  password!: string;

  // 2FA later; keep placeholder so we don't change API shape again
  @IsOptional()
  @IsString()
  otp?: string | null;
}
