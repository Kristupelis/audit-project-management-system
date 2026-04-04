import {
  ControlNature,
  ControlType,
  FrequencyType,
  NodeStatus,
  TestMethod,
} from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateControlDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  controlObjective?: string;

  @IsOptional()
  @IsEnum(ControlType)
  controlType?: ControlType;

  @IsOptional()
  @IsEnum(ControlNature)
  controlNature?: ControlNature;

  @IsOptional()
  @IsString()
  controlOwner?: string;

  @IsOptional()
  @IsEnum(FrequencyType)
  frequency?: FrequencyType;

  @IsOptional()
  @IsBoolean()
  keyControl?: boolean;

  @IsOptional()
  @IsString()
  relatedRisk?: string;

  @IsOptional()
  @IsString()
  expectedEvidence?: string;

  @IsOptional()
  @IsEnum(TestMethod)
  testingStrategy?: TestMethod;

  @IsOptional()
  @IsEnum(NodeStatus)
  status?: NodeStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateControlDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  controlObjective?: string;

  @IsOptional()
  @IsEnum(ControlType)
  controlType?: ControlType;

  @IsOptional()
  @IsEnum(ControlNature)
  controlNature?: ControlNature;

  @IsOptional()
  @IsString()
  controlOwner?: string;

  @IsOptional()
  @IsEnum(FrequencyType)
  frequency?: FrequencyType;

  @IsOptional()
  @IsBoolean()
  keyControl?: boolean;

  @IsOptional()
  @IsString()
  relatedRisk?: string;

  @IsOptional()
  @IsString()
  expectedEvidence?: string;

  @IsOptional()
  @IsEnum(TestMethod)
  testingStrategy?: TestMethod;

  @IsOptional()
  @IsEnum(NodeStatus)
  status?: NodeStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}
