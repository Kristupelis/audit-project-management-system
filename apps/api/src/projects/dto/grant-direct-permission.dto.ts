import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PermissionAction, ResourceType } from '@prisma/client';

export class GrantDirectPermissionDto {
  @IsEnum(ResourceType)
  resource: ResourceType;

  @IsEnum(PermissionAction)
  action: PermissionAction;

  @IsOptional()
  @IsString()
  scopeId?: string;
}
