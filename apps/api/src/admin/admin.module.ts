import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ProjectsModule } from '../projects/projects.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { SystemLogsService } from './system-logs.service';

@Module({
  imports: [PrismaModule, ProjectsModule],
  controllers: [AdminController],
  providers: [AdminService, SystemLogsService],
  exports: [SystemLogsService],
})
export class AdminModule {}
