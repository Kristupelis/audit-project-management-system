import {
  ConfidentialityLevel,
  EvidenceStatus,
  ReliabilityLevel,
} from '@prisma/client';
import { IsEnum, IsISO8601, IsOptional, IsString } from 'class-validator';

export class CreateEvidenceDto {
  @IsString()
  title!: string;

  @IsString()
  type!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  @IsString()
  referenceNo?: string;

  @IsOptional()
  @IsString()
  externalUrl?: string;

  @IsOptional()
  @IsString()
  collectedBy?: string;

  @IsOptional()
  @IsISO8601()
  collectedAt?: string;

  @IsOptional()
  @IsISO8601()
  validFrom?: string;

  @IsOptional()
  @IsISO8601()
  validTo?: string;

  @IsOptional()
  @IsEnum(ReliabilityLevel)
  reliabilityLevel?: ReliabilityLevel;

  @IsOptional()
  @IsEnum(ConfidentialityLevel)
  confidentiality?: ConfidentialityLevel;

  @IsOptional()
  @IsEnum(EvidenceStatus)
  status?: EvidenceStatus;

  @IsOptional()
  @IsString()
  version?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateEvidenceDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  @IsString()
  referenceNo?: string;

  @IsOptional()
  @IsString()
  fileUrl?: string;

  @IsOptional()
  @IsString()
  collectedBy?: string;

  @IsOptional()
  @IsISO8601()
  collectedAt?: string;

  @IsOptional()
  @IsISO8601()
  validFrom?: string;

  @IsOptional()
  @IsISO8601()
  validTo?: string;

  @IsOptional()
  @IsEnum(ReliabilityLevel)
  reliabilityLevel?: ReliabilityLevel;

  @IsOptional()
  @IsEnum(ConfidentialityLevel)
  confidentiality?: ConfidentialityLevel;

  @IsOptional()
  @IsEnum(EvidenceStatus)
  status?: EvidenceStatus;

  @IsOptional()
  @IsString()
  version?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
