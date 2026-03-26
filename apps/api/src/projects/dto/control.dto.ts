import { IsOptional, IsString } from 'class-validator';

export class CreateControlDto {
  @IsString()
  name: string;
}

export class UpdateControlDto {
  @IsOptional()
  @IsString()
  name: string;
}
