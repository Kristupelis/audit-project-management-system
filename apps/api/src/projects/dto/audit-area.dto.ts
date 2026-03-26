import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateAuditAreaDto {
  @IsString()
  @MinLength(2)
  name: string;
}

export class UpdateAuditAreaDto {
  @IsOptional()
  @IsString()
  name: string;
}
