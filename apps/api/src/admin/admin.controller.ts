import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { AdminService } from './admin.service';

@UseGuards(JwtAuthGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('users')
  listUsers(@CurrentUser('sub') userId: string) {
    return this.admin.listUsers(userId);
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
}
