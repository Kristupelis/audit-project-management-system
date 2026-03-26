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
import { ControlService } from './control.service';
import { CreateControlDto, UpdateControlDto } from '../dto/control.dto';

@UseGuards(JwtAuthGuard)
@Controller()
export class ControlController {
  constructor(private readonly controls: ControlService) {}

  @Post('processes/:processId/controls')
  create(
    @Param('processId') processId: string,
    @CurrentUser('sub') userId: string,
    @Body() dto: CreateControlDto,
  ) {
    return this.controls.create(processId, userId, dto.name);
  }

  @Get('processes/:processId/controls')
  listByProcess(
    @Param('processId') processId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.controls.listByProcess(processId, userId);
  }

  @Get('controls/:controlId')
  get(
    @Param('controlId') controlId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.controls.get(controlId, userId);
  }

  @Patch('controls/:controlId')
  update(
    @Param('controlId') controlId: string,
    @CurrentUser('sub') userId: string,
    @Body() dto: UpdateControlDto,
  ) {
    return this.controls.update(controlId, userId, dto.name);
  }

  @Delete('controls/:controlId')
  delete(
    @Param('controlId') controlId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.controls.delete(controlId, userId);
  }
}
