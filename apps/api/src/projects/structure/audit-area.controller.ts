import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { CurrentUser } from '../../auth/current-user.decorator';
import { AuditAreaService } from './audit-area.service';
import { UpdateAuditAreaDto } from '../dto/audit-area.dto';

@UseGuards(JwtAuthGuard)
@Controller('audit-areas')
export class AuditAreasController {
  constructor(private readonly auditAreas: AuditAreaService) {}

  @Get(':areaId')
  get(@Param('areaId') areaId: string, @CurrentUser('sub') userId: string) {
    return this.auditAreas.get(areaId, userId);
  }

  @Patch(':areaId')
  update(
    @Param('areaId') areaId: string,
    @CurrentUser('sub') userId: string,
    @Body() dto: UpdateAuditAreaDto,
  ) {
    return this.auditAreas.update(areaId, userId, dto);
  }

  @Delete(':areaId')
  delete(@Param('areaId') areaId: string, @CurrentUser('sub') userId: string) {
    return this.auditAreas.delete(areaId, userId);
  }
}
