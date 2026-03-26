import { Module } from '@nestjs/common';
import { ProjectsController } from './projects.controller';
//import { ProjectsService } from './projects.service';

import { ProjectsService } from './core/projects.service';
import { MembersService } from './core/members.service';
import { RolesService } from './core/roles.service';

import { PrismaModule } from '../prisma/prisma.module';
import { ProjectPermissionsService } from './permissions.service';

import { AuditAreaService } from './structure/audit-area.service';
import { AuditAreasController } from './structure/audit-area.controller';

import { ProcessService } from './structure/process.service';
import { ProcessController } from './structure/process.controller';

import { ControlService } from './structure/control.service';
import { ControlController } from './structure/control.controller';

import { EvidenceService } from './structure/evidence.service';
import { EvidenceController } from './structure/evidence.controller';

import { FindingService } from './structure/finding.service';
import { FindingController } from './structure/finding.controller';

import { TestStepService } from './structure/test-step.service';
import { TestStepController } from './structure/test-step.controller';

@Module({
  imports: [PrismaModule],
  controllers: [
    ProjectsController,
    AuditAreasController,
    ProcessController,
    ControlController,
    EvidenceController,
    FindingController,
    TestStepController,
  ],
  providers: [
    ProjectsService,
    MembersService,
    RolesService,
    ProjectPermissionsService,
    AuditAreaService,
    ProcessService,
    ControlService,
    EvidenceService,
    FindingService,
    TestStepService,
  ],
  exports: [ProjectPermissionsService],
})
export class ProjectsModule {}
