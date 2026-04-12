import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import type { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { CurrentUser } from '../../auth/current-user.decorator';
import { EvidenceService } from './evidence.service';
import { CreateEvidenceDto, UpdateEvidenceDto } from '../dto/evidence.dto';

import type { Express } from 'express';
import { diskStorage } from 'multer';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

const tempUploadDir = path.join(process.cwd(), 'uploads', 'temp');

if (!fs.existsSync(tempUploadDir)) {
  fs.mkdirSync(tempUploadDir, { recursive: true });
}

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

  @Post('evidence/:evidenceId/files')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          cb(null, tempUploadDir);
        },
        filename: (_req, file, cb) => {
          const ext = path.extname(file.originalname);
          const uniqueName = `temp-${Date.now()}-${crypto.randomUUID()}${ext}`;
          cb(null, uniqueName);
        },
      }),
      limits: {
        fileSize: 1024 * 1024 * 1024, // 1 GB
      },
    }),
  )
  uploadFile(
    @Param('evidenceId') evidenceId: string,
    @CurrentUser('sub') userId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.evidences.uploadFile(evidenceId, userId, file);
  }

  @Get('evidence/files/:fileId/download')
  async downloadFile(
    @Param('fileId') fileId: string,
    @CurrentUser('sub') userId: string,
    @Res() res: Response,
  ): Promise<void> {
    const file = await this.evidences.getDownloadFile(fileId, userId);

    res.setHeader('Content-Type', file.mimeType ?? 'application/octet-stream');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(file.originalName)}"`,
    );

    res.sendFile(file.absolutePath);
  }

  @Delete('evidence/files/:fileId')
  deleteFile(
    @Param('fileId') fileId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.evidences.deleteFile(fileId, userId);
  }
}
