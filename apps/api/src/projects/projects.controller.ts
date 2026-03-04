import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { AddMemberDto } from './dto/add-member.dto';

@UseGuards(JwtAuthGuard)
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projects: ProjectsService) {}

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

  @Post(':id/members')
  addMember(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @Body() dto: AddMemberDto,
  ) {
    return this.projects.addMember(id, userId, dto.email, dto.role);
  }

  @Get(':id/audit')
  audit(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.projects.listAudit(id, userId);
  }
}
