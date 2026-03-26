import { IsString } from 'class-validator';

export class CreateTestStepDto {
  @IsString()
  description: string;
}
