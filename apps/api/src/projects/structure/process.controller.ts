import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { CurrentUser } from '../../auth/current-user.decorator';
import { ProcessService } from './process.service';
import { CreateProcessDto, UpdateProcessDto } from '../dto/process.dto';

@UseGuards(JwtAuthGuard)
@Controller()
export class ProcessController {
  constructor(private readonly processes: ProcessService) {}

  @Post('audit-areas/:areaId/processes')
  create(
    @Param('areaId') areaId: string,
    @CurrentUser('sub') userId: string,
    @Body() dto: CreateProcessDto,
  ) {
    return this.processes.create(areaId, userId, dto.name);
  }

  @Get('audit-areas/:areaId/processes')
  listByAuditArea(
    @Param('areaId') areaId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.processes.listByAuditArea(areaId, userId);
  }

  @Get('processes/:processId')
  get(
    @Param('processId') processId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.processes.get(processId, userId);
  }

  @Patch('processes/:processId')
  update(
    @Param('processId') processId: string,
    @CurrentUser('sub') userId: string,
    @Body() dto: UpdateProcessDto,
  ) {
    return this.processes.update(processId, userId, dto.name);
  }

  @Delete('processes/:processId')
  delete(
    @Param('processId') processId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.processes.delete(processId, userId);
  }
}
