import { IsOptional, IsString } from 'class-validator';

export class CreateEvidenceDto {
  @IsString()
  title: string;

  @IsString()
  type: string;

  @IsOptional()
  @IsString()
  fileUrl?: string;
}

export class UpdateEvidenceDto {
  @IsString()
  title: string;

  @IsString()
  type: string;

  @IsOptional()
  @IsString()
  fileUrl?: string;
}
