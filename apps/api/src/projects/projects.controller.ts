import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { ProjectsService } from './projects.service';

import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { AddMemberDto } from './dto/add-member.dto';

import { CreateProjectRoleDto } from './dto/create-role.dto';
import { AssignRoleDto } from './dto/assign-role.dto';
import { GrantDirectPermissionDto } from './dto/grant-direct-permission.dto';
import { TransferOwnershipDto } from './dto/transfer-ownership.dto';

@UseGuards(JwtAuthGuard)
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projects: ProjectsService) {}

  // =========================
  // PROJECTS
  // =========================

  @Post()
  create(@CurrentUser('sub') userId: string, @Body() dto: CreateProjectDto) {
    return this.projects.createProject(userId, dto.name, dto.description);
  }

  @Get()
  listMine(@CurrentUser('sub') userId: string) {
    return this.projects.listMyProjects(userId);
  }

  @Get(':id')
  get(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.projects.getProjectIfMember(id, userId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @Body() dto: UpdateProjectDto,
  ) {
    return this.projects.updateProject(id, userId, dto);
  }

  // =========================
  // MEMBERS
  // =========================

  @Post(':id/members')
  addMember(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @Body() dto: AddMemberDto,
  ) {
    return this.projects.addMember(id, userId, dto.email);
  }

  @Delete(':id/members/:memberId')
  removeMember(
    @Param('id') projectId: string,
    @Param('memberId') memberId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.projects.removeMember(projectId, userId, memberId);
  }

  // =========================
  // PROJECT ROLES
  // =========================

  @Post(':id/roles')
  createRole(
    @Param('id') projectId: string,
    @CurrentUser('sub') userId: string,
    @Body() dto: CreateProjectRoleDto,
  ) {
    return this.projects.createRole(projectId, userId, dto);
  }

  @Get(':id/roles')
  listRoles(
    @Param('id') projectId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.projects.listRoles(projectId, userId);
  }

  @Delete(':id/roles/:roleId')
  deleteRole(
    @Param('id') projectId: string,
    @Param('roleId') roleId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.projects.deleteRole(projectId, userId, roleId);
  }

  // =========================
  // ROLE ASSIGNMENT
  // =========================

  @Post(':id/members/:memberId/roles')
  assignRole(
    @Param('id') projectId: string,
    @Param('memberId') memberId: string,
    @CurrentUser('sub') userId: string,
    @Body() dto: AssignRoleDto,
  ) {
    return this.projects.assignRole(projectId, userId, memberId, dto.roleId);
  }

  @Delete(':id/members/:memberId/roles/:roleId')
  removeRole(
    @Param('id') projectId: string,
    @Param('memberId') memberId: string,
    @Param('roleId') roleId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.projects.removeRole(projectId, userId, memberId, roleId);
  }

  // =========================
  // DIRECT PERMISSIONS
  // =========================

  @Post(':id/members/:memberId/permissions')
  grantPermission(
    @Param('id') projectId: string,
    @Param('memberId') memberId: string,
    @CurrentUser('sub') userId: string,
    @Body() dto: GrantDirectPermissionDto,
  ) {
    return this.projects.grantPermission(projectId, userId, memberId, dto);
  }

  @Delete(':id/members/:memberId/permissions/:permissionId')
  revokePermission(
    @Param('id') projectId: string,
    @Param('memberId') memberId: string,
    @Param('permissionId') permissionId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.projects.revokePermission(
      projectId,
      userId,
      memberId,
      permissionId,
    );
  }

  // =========================
  // OWNERSHIP
  // =========================

  @Post(':id/transfer-ownership')
  transferOwnership(
    @Param('id') projectId: string,
    @CurrentUser('sub') userId: string,
    @Body() dto: TransferOwnershipDto,
  ) {
    return this.projects.transferOwnership(projectId, userId, dto.memberId);
  }

  // =========================
  // AUDIT
  // =========================

  @Get(':id/audit')
  audit(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.projects.listAudit(id, userId);
  }
}
