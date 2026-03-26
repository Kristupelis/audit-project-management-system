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
import { CreateFindingDto, UpdateFindingDto } from '../dto/finding.dto';
import { FindingService } from './finding.service';

@UseGuards(JwtAuthGuard)
@Controller()
export class FindingController {
  constructor(private readonly findings: FindingService) {}

  @Post('processes/:processId/finding')
  create(
    @Param('processId') processId: string,
    @CurrentUser('sub') userId: string,
    @Body() dto: CreateFindingDto,
  ) {
    return this.findings.create(processId, userId, dto);
  }

  @Get('processes/:processId/finding')
  list(
    @Param('processId') processId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.findings.list(processId, userId);
  }

  @Get('finding/:findingId')
  get(
    @Param('findingId') findingId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.findings.get(findingId, userId);
  }

  @Patch('finding/:findingId')
  update(
    @Param('findingId') findingId: string,
    @CurrentUser('sub') userId: string,
    @Body() dto: UpdateFindingDto,
  ) {
    return this.findings.update(findingId, userId, dto);
  }

  @Delete('finding/:findingId')
  delete(
    @Param('findingId') findingId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.findings.delete(findingId, userId);
  }
}
