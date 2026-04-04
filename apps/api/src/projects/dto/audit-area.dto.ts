import { NodeStatus, RiskLevel } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateAuditAreaDto {
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
  scope?: string;

  @IsOptional()
  @IsEnum(RiskLevel)
  riskLevel?: RiskLevel;

  @IsOptional()
  @IsEnum(RiskLevel)
  residualRisk?: RiskLevel;

  @IsOptional()
  @IsEnum(NodeStatus)
  status?: NodeStatus;

  @IsOptional()
  @IsString()
  areaOwner?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateAuditAreaDto {
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
  scope?: string;

  @IsOptional()
  @IsEnum(RiskLevel)
  riskLevel?: RiskLevel;

  @IsOptional()
  @IsEnum(RiskLevel)
  residualRisk?: RiskLevel;

  @IsOptional()
  @IsEnum(NodeStatus)
  status?: NodeStatus;

  @IsOptional()
  @IsString()
  areaOwner?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
