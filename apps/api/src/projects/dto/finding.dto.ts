import { IsString } from 'class-validator';

export class CreateFindingDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsString()
  severity: string;
}

export class UpdateFindingDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsString()
  severity: string;
}
