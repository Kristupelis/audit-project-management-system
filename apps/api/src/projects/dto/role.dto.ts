import { PermissionAction, ResourceType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class AssignRoleDto {
  @IsString()
  roleId: string;
}

export class RolePermissionDto {
  @IsEnum(ResourceType)
  resource: ResourceType;

  @IsEnum(PermissionAction)
  action: PermissionAction;

  @IsOptional()
  @IsString()
  scopeId?: string;
}

export class CreateProjectRoleDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RolePermissionDto)
  permissions: RolePermissionDto[];
}

export class GrantDirectPermissionDto {
  @IsEnum(ResourceType)
  resource: ResourceType;

  @IsEnum(PermissionAction)
  action: PermissionAction;

  @IsOptional()
  @IsString()
  scopeId?: string;
}
