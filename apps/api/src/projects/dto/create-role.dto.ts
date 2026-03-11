import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PermissionAction, ResourceType } from '@prisma/client';

class RolePermissionDto {
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
