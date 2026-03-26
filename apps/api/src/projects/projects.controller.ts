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

import { CreateProjectDto, UpdateProjectDto } from './dto/project.dto';
import { AddMemberDto } from './dto/add-member.dto';

import {
  AssignRoleDto,
  CreateProjectRoleDto,
  GrantDirectPermissionDto,
} from './dto/role.dto';
import { TransferOwnershipDto } from './dto/transfer-ownership.dto';

import { CreateAuditAreaDto } from './dto/audit-area.dto';
import { AuditAreaService } from './structure/audit-area.service';
import { MembersService } from './core/members.service';
import { RolesService } from './core/roles.service';
import { ProjectsService } from './core/projects.service';

@UseGuards(JwtAuthGuard)
@Controller('projects')
export class ProjectsController {
  constructor(
    private readonly projects: ProjectsService,
    private readonly members: MembersService,
    private readonly roles: RolesService,
    private readonly auditAreas: AuditAreaService,
  ) {}

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

  @Get(':id/members')
  listMembers(
    @Param('id') projectId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.members.listMembers(projectId, userId);
  }

  @Post(':id/members')
  addMember(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @Body() dto: AddMemberDto,
  ) {
    return this.members.addMember(id, userId, dto.email);
  }

  @Delete(':id/members/:memberId')
  removeMember(
    @Param('id') projectId: string,
    @Param('memberId') memberId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.members.removeMember(projectId, userId, memberId);
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
    return this.roles.createRole(projectId, userId, dto);
  }

  @Get(':id/roles')
  listRoles(
    @Param('id') projectId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.roles.listRoles(projectId, userId);
  }

  @Delete(':id/roles/:roleId')
  deleteRole(
    @Param('id') projectId: string,
    @Param('roleId') roleId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.roles.deleteRole(projectId, userId, roleId);
  }

  @Get(':id/roles/:roleId')
  getRole(
    @Param('id') projectId: string,
    @Param('roleId') roleId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.roles.getRole(projectId, userId, roleId);
  }

  @Patch(':id/roles/:roleId')
  updateRole(
    @Param('id') projectId: string,
    @Param('roleId') roleId: string,
    @CurrentUser('sub') userId: string,
    @Body() dto: CreateProjectRoleDto,
  ) {
    return this.roles.updateRole(projectId, userId, roleId, dto);
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
    return this.roles.assignRole(projectId, userId, memberId, dto.roleId);
  }

  @Delete(':id/members/:memberId/roles/:roleId')
  removeRole(
    @Param('id') projectId: string,
    @Param('memberId') memberId: string,
    @Param('roleId') roleId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.roles.removeRole(projectId, userId, memberId, roleId);
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
    return this.roles.grantPermission(projectId, userId, memberId, dto);
  }

  @Delete(':id/members/:memberId/permissions/:permissionId')
  revokePermission(
    @Param('id') projectId: string,
    @Param('memberId') memberId: string,
    @Param('permissionId') permissionId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.roles.revokePermission(
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
    return this.roles.transferOwnership(projectId, userId, dto.memberId);
  }

  // =========================
  // AUDIT
  // =========================

  @Get(':id/audit')
  audit(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.projects.listAudit(id, userId);
  }

  // =========================
  // PROJECT COMPONENTS
  // =========================

  // =========================
  //    AUDIT AREA
  // =========================
  @Post(':id/audit-areas')
  createAuditArea(
    @Param('id') projectId: string,
    @Body() dto: CreateAuditAreaDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.auditAreas.create(projectId, userId, dto.name);
  }

  @Get(':id/audit-areas')
  getAuditAreas(
    @Param('id') projectId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.auditAreas.list(projectId, userId);
  }
}
