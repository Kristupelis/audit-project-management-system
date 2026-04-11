import { TestMethod, TestStepStatus } from '@prisma/client';
import {
  IsEnum,
  IsISO8601,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateTestStepDto {
  @IsString()
  description!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  stepNo?: number;

  @IsOptional()
  @IsString()
  expectedResult?: string;

  @IsOptional()
  @IsString()
  actualResult?: string;

  @IsOptional()
  @IsEnum(TestMethod)
  testMethod?: TestMethod;

  @IsOptional()
  @IsEnum(TestStepStatus)
  status?: TestStepStatus;

  @IsOptional()
  @IsString()
  sampleReference?: string;

  @IsOptional()
  @IsString()
  performedBy?: string;

  @IsOptional()
  @IsISO8601()
  performedAt?: string;

  @IsOptional()
  @IsString()
  reviewedBy?: string;

  @IsOptional()
  @IsISO8601()
  reviewedAt?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateTestStepDto {
  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  stepNo?: number;

  @IsOptional()
  @IsString()
  expectedResult?: string;

  @IsOptional()
  @IsString()
  actualResult?: string;

  @IsOptional()
  @IsEnum(TestMethod)
  testMethod?: TestMethod;

  @IsOptional()
  @IsEnum(TestStepStatus)
  status?: TestStepStatus;

  @IsOptional()
  @IsString()
  sampleReference?: string;

  @IsOptional()
  @IsString()
  performedBy?: string;

  @IsOptional()
  @IsISO8601()
  performedAt?: string;

  @IsOptional()
  @IsString()
  reviewedBy?: string;

  @IsOptional()
  @IsISO8601()
  reviewedAt?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
