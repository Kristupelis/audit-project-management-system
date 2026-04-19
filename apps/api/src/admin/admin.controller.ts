import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { AdminService } from './admin.service';
import { UpdateProfileDto } from '../auth/dto/update-profile.dto';
import { ResetUserPasswordDto } from '../auth/dto/change-password.dto';

@UseGuards(JwtAuthGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('users')
  listUsers(@CurrentUser('sub') userId: string) {
    return this.admin.listUsers(userId);
  }

  @Patch('users/:id')
  updateUser(
    @CurrentUser('sub') actorId: string,
    @Param('id') targetUserId: string,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.admin.updateUser(actorId, targetUserId, dto);
  }

  @Patch('users/:id/password')
  resetUserPassword(
    @CurrentUser('sub') actorId: string,
    @Param('id') targetUserId: string,
    @Body() dto: ResetUserPasswordDto,
  ) {
    return this.admin.resetUserPassword(actorId, targetUserId, dto.newPassword);
  }

  @Patch('users/:id/block')
  blockUser(
    @CurrentUser('sub') actorId: string,
    @Param('id') targetUserId: string,
    @Body() body: { reason?: string },
  ) {
    return this.admin.blockUser(actorId, targetUserId, body.reason);
  }

  @Patch('users/:id/unblock')
  unblockUser(
    @CurrentUser('sub') actorId: string,
    @Param('id') targetUserId: string,
  ) {
    return this.admin.unblockUser(actorId, targetUserId);
  }

  @Delete('users/:id')
  deleteUser(
    @CurrentUser('sub') actorId: string,
    @Param('id') targetUserId: string,
  ) {
    return this.admin.deleteUser(actorId, targetUserId);
  }

  @Get('system-logs')
  listSystemLogs(
    @CurrentUser('sub') actorId: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('level') level?: string,
    @Query('action') action?: string,
  ) {
    return this.admin.listSystemLogs(actorId, {
      page,
      pageSize,
      level,
      action,
    });
  }
}
