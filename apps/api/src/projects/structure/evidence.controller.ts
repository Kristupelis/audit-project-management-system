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
import { EvidenceService } from './evidence.service';
import { CreateEvidenceDto, UpdateEvidenceDto } from '../dto/evidence.dto';

@UseGuards(JwtAuthGuard)
@Controller()
export class EvidenceController {
  constructor(private readonly evidences: EvidenceService) {}

  @Post('processes/:processId/evidence')
  create(
    @Param('processId') processId: string,
    @CurrentUser('sub') userId: string,
    @Body() dto: CreateEvidenceDto,
  ) {
    return this.evidences.create(processId, userId, dto);
  }

  @Get('processes/:processId/evidence')
  list(
    @Param('processId') processId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.evidences.list(processId, userId);
  }

  @Get('evidence/:evidenceId')
  get(
    @Param('evidenceId') evidenceId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.evidences.get(evidenceId, userId);
  }

  @Patch('evidence/:evidenceId')
  update(
    @Param('evidenceId') evidenceId: string,
    @CurrentUser('sub') userId: string,
    @Body() dto: UpdateEvidenceDto,
  ) {
    return this.evidences.update(evidenceId, userId, dto);
  }

  @Delete('evidence/:evidenceId')
  delete(
    @Param('evidenceId') evidenceId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.evidences.delete(evidenceId, userId);
  }
}
