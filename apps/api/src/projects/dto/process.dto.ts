import { FrequencyType, NodeStatus, RiskLevel } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateProcessDto {
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
  objective?: string;

  @IsOptional()
  @IsString()
  processOwner?: string;

  @IsOptional()
  @IsEnum(FrequencyType)
  frequency?: FrequencyType;

  @IsOptional()
  @IsEnum(RiskLevel)
  riskLevel?: RiskLevel;

  @IsOptional()
  @IsEnum(NodeStatus)
  status?: NodeStatus;

  @IsOptional()
  @IsString()
  systemsInvolved?: string;

  @IsOptional()
  @IsString()
  keyInputs?: string;

  @IsOptional()
  @IsString()
  keyOutputs?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateProcessDto {
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
  objective?: string;

  @IsOptional()
  @IsString()
  processOwner?: string;

  @IsOptional()
  @IsEnum(FrequencyType)
  frequency?: FrequencyType;

  @IsOptional()
  @IsEnum(RiskLevel)
  riskLevel?: RiskLevel;

  @IsOptional()
  @IsEnum(NodeStatus)
  status?: NodeStatus;

  @IsOptional()
  @IsString()
  systemsInvolved?: string;

  @IsOptional()
  @IsString()
  keyInputs?: string;

  @IsOptional()
  @IsString()
  keyOutputs?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
