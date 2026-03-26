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
import { TestStepService } from './test-step.service';
import { CreateTestStepDto } from '../dto/test-step.dto';

@UseGuards(JwtAuthGuard)
@Controller()
export class TestStepController {
  constructor(private readonly service: TestStepService) {}

  @Post('controls/:controlId/test-steps')
  create(
    @Param('controlId') controlId: string,
    @CurrentUser('sub') userId: string,
    @Body() d: CreateTestStepDto,
  ) {
    return this.service.create(controlId, userId, d.description);
  }

  @Get('controls/:controlId/test-steps')
  listByControl(
    @Param('controlId') controlId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.service.listByControl(controlId, userId);
  }

  @Get('test-steps/:testStepId')
  get(
    @Param('testStepId') testStepId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.service.get(testStepId, userId);
  }

  @Patch('test-steps/:testStepId')
  update(
    @Param('testStepId') testStepId: string,
    @CurrentUser('sub') userId: string,
    @Body() d: { description: string },
  ) {
    return this.service.update(testStepId, userId, d.description);
  }

  @Delete('test-steps/:testStepId')
  delete(
    @Param('testStepId') testStepId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.service.delete(testStepId, userId);
  }
}
