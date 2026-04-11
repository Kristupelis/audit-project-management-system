/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-require-imports */
import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import PDFDocument = require('pdfkit');
import { PrismaService } from '../prisma/prisma.service';
import { ProjectPermissionsService } from './permissions.service';
import * as path from 'path';

const projectReportArgs = Prisma.validator<Prisma.ProjectDefaultArgs>()({
  include: {
    members: {
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        roles: {
          include: {
            role: {
              include: {
                permissions: true,
              },
            },
          },
        },
      },
    },
    projectRoles: {
      include: {
        permissions: true,
      },
    },
    auditAreas: {
      orderBy: { order: 'asc' },
      include: {
        processes: {
          orderBy: { order: 'asc' },
          include: {
            controls: {
              orderBy: { order: 'asc' },
              include: {
                testSteps: {
                  orderBy: { order: 'asc' },
                },
              },
            },
            evidence: {
              orderBy: { order: 'asc' },
            },
            findings: {
              orderBy: { order: 'asc' },
            },
          },
        },
      },
    },
    auditLogs: {
      orderBy: { createdAt: 'desc' },
      take: 30,
      include: {
        actor: {
          select: {
            email: true,
            name: true,
          },
        },
      },
    },
  },
});

type ReportProject = Prisma.ProjectGetPayload<typeof projectReportArgs>;
type ReportMember = ReportProject['members'][number];
type ReportRole = ReportProject['projectRoles'][number];
type ReportAuditArea = ReportProject['auditAreas'][number];
type ReportProcess = ReportAuditArea['processes'][number];
type ReportControl = ReportProcess['controls'][number];
type ReportTestStep = ReportControl['testSteps'][number];
type ReportEvidence = ReportProcess['evidence'][number];
type ReportFinding = ReportProcess['findings'][number];
type ReportAuditLog = ReportProject['auditLogs'][number];

@Injectable()
export class ReportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly permissions: ProjectPermissionsService,
  ) {}

  async generateProjectReport(
    projectId: string,
    userId: string,
  ): Promise<Buffer> {
    await this.permissions.requireCanManageMembers(projectId, userId);

    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      ...projectReportArgs,
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return this.buildPdf(project);
  }

  private async buildPdf(project: ReportProject): Promise<Buffer> {
    const doc = new PDFDocument({
      size: 'A4',
      margin: 50,
      bufferPages: true,
      info: {
        Title: `Project Report - ${project.name}`,
        Author: 'APMS',
        Subject: 'Audit Project Report',
      },
    });

    const regularFontPath = path.join(
      process.cwd(),
      'src',
      'assets',
      'fonts',
      'NotoSans-Regular.ttf',
    );

    const boldFontPath = path.join(
      process.cwd(),
      'src',
      'assets',
      'fonts',
      'NotoSans-Bold.ttf',
    );

    doc.registerFont('ReportRegular', regularFontPath);
    doc.registerFont('ReportBold', boldFontPath);

    const chunks: Buffer[] = [];

    return await new Promise<Buffer>((resolve, reject) => {
      doc.on('data', (chunk: Buffer | Uint8Array) => {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      });

      doc.on('end', () => {
        resolve(Buffer.concat(chunks));
      });

      doc.on('error', (error: Error) => {
        reject(error);
      });

      this.renderCoverPage(doc, project);
      this.renderProjectOverview(doc, project);
      this.renderMembers(doc, project.members);
      this.renderRoles(doc, project.projectRoles);
      this.renderStructure(doc, project.auditAreas);
      this.renderFindingsSummary(doc, project.auditAreas);
      this.renderAuditLog(doc, project.auditLogs);

      this.addFooter(doc, project.name);

      doc.end();
    });
  }

  private renderCoverPage(
    doc: PDFKit.PDFDocument,
    project: ReportProject,
  ): void {
    doc.font('ReportBold').fontSize(24).text('Audit Project Report', {
      align: 'center',
    });

    doc.moveDown(1.5);

    doc.font('ReportBold').fontSize(18).text(project.name, {
      align: 'center',
    });

    doc.moveDown(1.5);

    this.drawInfoTable(doc, [
      ['Project code', project.code],
      ['Status', project.status],
      ['Audit type', project.auditType],
      ['Priority', project.priority],
      ['Audited entity', project.auditedEntityName],
      ['Location', project.location],
      ['Engagement lead', project.engagementLead],
      ['Generated on', this.formatDate(new Date())],
    ]);

    doc.moveDown(2);
    this.drawMutedParagraph(
      doc,
      'This report was generated automatically from the Audit Project Management System. It summarizes the project profile, participants, structure, findings, and recent activity.',
    );

    doc.addPage();
  }

  private renderProjectOverview(
    doc: PDFKit.PDFDocument,
    project: ReportProject,
  ): void {
    this.drawSectionTitle(doc, '1. Project Overview');

    this.drawInfoTable(doc, [
      ['Description', project.description],
      ['Scope', project.scope],
      ['Objective', project.objective],
      ['Methodology', project.methodology],
      ['Audited period start', this.formatDate(project.periodStart)],
      ['Audited period end', this.formatDate(project.periodEnd)],
      ['Planned start date', this.formatDate(project.plannedStartDate)],
      ['Planned end date', this.formatDate(project.plannedEndDate)],
      ['Actual start date', this.formatDate(project.actualStartDate)],
      ['Actual end date', this.formatDate(project.actualEndDate)],
    ]);
  }

  private renderMembers(
    doc: PDFKit.PDFDocument,
    members: ReportMember[],
  ): void {
    this.drawSectionTitle(doc, '2. Project Members');

    if (members.length === 0) {
      this.drawMutedParagraph(doc, 'No project members found.');
      return;
    }

    for (const member of members) {
      this.ensureSpace(doc, 70);

      const memberName = member.user.name?.trim() || member.user.email;
      const memberRoles =
        member.roles.map((r) => r.role.name).join(', ') ||
        (member.isOwner ? 'Owner' : 'Member');

      this.drawCard(doc, [
        `Name: ${memberName}`,
        `Email: ${member.user.email}`,
        `Owner: ${member.isOwner ? 'Yes' : 'No'}`,
        `Roles: ${memberRoles}`,
      ]);
    }
  }

  private renderRoles(doc: PDFKit.PDFDocument, roles: ReportRole[]): void {
    this.drawSectionTitle(doc, '3. Project Roles');

    if (roles.length === 0) {
      this.drawMutedParagraph(doc, 'No project roles found.');
      return;
    }

    for (const role of roles) {
      this.ensureSpace(doc, 90);

      const permissions =
        role.permissions
          .map(
            (p) =>
              `${p.action} ${p.resource}${p.scopeId ? ` (${p.scopeId})` : ''}`,
          )
          .join(', ') || '—';

      this.drawCard(doc, [
        `Role: ${role.name}`,
        `Description: ${this.valueOrDash(role.description)}`,
        `Permissions: ${permissions}`,
      ]);
    }
  }

  private renderStructure(
    doc: PDFKit.PDFDocument,
    auditAreas: ReportAuditArea[],
  ): void {
    this.drawSectionTitle(doc, '4. Audit Structure');

    if (auditAreas.length === 0) {
      this.drawMutedParagraph(doc, 'No audit areas found.');
      return;
    }

    for (const area of auditAreas) {
      this.ensureSpace(doc, 120);

      doc.font('ReportBold').fontSize(14).text(`Audit Area: ${area.name}`);
      doc.moveDown(0.2);

      this.drawInfoTable(doc, [
        ['Code', area.code],
        ['Description', area.description],
        ['Objective', area.objective],
        ['Scope', area.scope],
        ['Risk level', area.riskLevel],
        ['Residual risk', area.residualRisk],
        ['Status', area.status],
        ['Area owner', area.areaOwner],
      ]);

      if (area.processes.length === 0) {
        this.drawMutedParagraph(doc, 'No processes in this audit area.');
        continue;
      }

      for (const process of area.processes) {
        this.renderProcess(doc, process);
      }
    }
  }

  private renderProcess(doc: PDFKit.PDFDocument, process: ReportProcess): void {
    this.ensureSpace(doc, 90);

    doc.moveDown(0.5);
    doc.font('ReportBold').fontSize(12).text(`Process: ${process.name}`);
    doc.moveDown(0.2);

    this.drawInfoTable(doc, [
      ['Code', process.code],
      ['Description', process.description],
      ['Objective', process.objective],
      ['Process owner', process.processOwner],
      ['Frequency', process.frequency],
      ['Risk level', process.riskLevel],
      ['Status', process.status],
      ['Systems involved', process.systemsInvolved],
      ['Key inputs', process.keyInputs],
      ['Key outputs', process.keyOutputs],
    ]);

    if (process.controls.length > 0) {
      doc.font('ReportBold').fontSize(11).text('Controls');
      doc.moveDown(0.2);

      for (const control of process.controls) {
        this.renderControl(doc, control);
      }
    }

    if (process.evidence.length > 0) {
      doc.moveDown(0.3);
      doc.font('ReportBold').fontSize(11).text('Evidence');
      doc.moveDown(0.2);

      for (const evidence of process.evidence) {
        this.renderEvidence(doc, evidence);
      }
    }

    if (process.findings.length > 0) {
      doc.moveDown(0.3);
      doc.font('ReportBold').fontSize(11).text('Findings');
      doc.moveDown(0.2);

      for (const finding of process.findings) {
        this.renderFinding(doc, finding);
      }
    }
  }

  private renderControl(doc: PDFKit.PDFDocument, control: ReportControl): void {
    this.ensureSpace(doc, 80);

    this.drawCard(doc, [
      `Control: ${control.name}`,
      `Code: ${this.valueOrDash(control.code)}`,
      `Objective: ${this.valueOrDash(control.controlObjective)}`,
      `Type: ${this.valueOrDash(control.controlType)}`,
      `Nature: ${this.valueOrDash(control.controlNature)}`,
      `Owner: ${this.valueOrDash(control.controlOwner)}`,
      `Frequency: ${this.valueOrDash(control.frequency)}`,
      `Testing strategy: ${this.valueOrDash(control.testingStrategy)}`,
      `Status: ${this.valueOrDash(control.status)}`,
    ]);

    if (control.testSteps.length > 0) {
      doc.moveDown(0.1);
      doc.font('ReportBold').fontSize(10).text('Test steps');
      doc.moveDown(0.1);

      for (const step of control.testSteps) {
        this.renderTestStep(doc, step);
      }
    }
  }

  private renderTestStep(doc: PDFKit.PDFDocument, step: ReportTestStep): void {
    this.ensureSpace(doc, 55);

    doc
      .font('ReportRegular')
      .fontSize(9)
      .text(`• Step ${step.stepNo ?? '—'}: ${step.description}`);
    doc
      .fontSize(9)
      .text(`  Expected: ${this.valueOrDash(step.expectedResult)}`);
    doc.fontSize(9).text(`  Actual: ${this.valueOrDash(step.actualResult)}`);
    doc.fontSize(9).text(`  Method: ${this.valueOrDash(step.testMethod)}`);
    doc.fontSize(9).text(`  Status: ${this.valueOrDash(step.status)}`);
    doc.moveDown(0.2);
  }

  private renderEvidence(
    doc: PDFKit.PDFDocument,
    evidence: ReportEvidence,
  ): void {
    this.ensureSpace(doc, 60);

    this.drawCard(doc, [
      `Evidence: ${evidence.title}`,
      `Type: ${evidence.type}`,
      `Source: ${this.valueOrDash(evidence.source)}`,
      `Reference number: ${this.valueOrDash(evidence.referenceNo)}`,
      `Status: ${evidence.status}`,
      `Reliability: ${this.valueOrDash(evidence.reliabilityLevel)}`,
      `Confidentiality: ${evidence.confidentiality}`,
    ]);
  }

  private renderFinding(doc: PDFKit.PDFDocument, finding: ReportFinding): void {
    this.ensureSpace(doc, 95);

    this.drawCard(doc, [
      `Finding: ${finding.title}`,
      `Code: ${this.valueOrDash(finding.code)}`,
      `Severity: ${finding.severity}`,
      `Status: ${finding.status}`,
      `Description: ${finding.description}`,
      `Criteria: ${this.valueOrDash(finding.criteria)}`,
      `Condition: ${this.valueOrDash(finding.condition)}`,
      `Cause: ${this.valueOrDash(finding.cause)}`,
      `Effect: ${this.valueOrDash(finding.effect)}`,
      `Recommendation: ${this.valueOrDash(finding.recommendation)}`,
      `Management response: ${this.valueOrDash(finding.managementResponse)}`,
      `Action owner: ${this.valueOrDash(finding.actionOwner)}`,
      `Due date: ${this.formatDate(finding.dueDate)}`,
    ]);
  }

  private renderFindingsSummary(
    doc: PDFKit.PDFDocument,
    auditAreas: ReportAuditArea[],
  ): void {
    const findings: ReportFinding[] = [];

    for (const area of auditAreas) {
      for (const process of area.processes) {
        for (const finding of process.findings) {
          findings.push(finding);
        }
      }
    }

    this.drawSectionTitle(doc, '5. Findings Summary');

    if (findings.length === 0) {
      this.drawMutedParagraph(doc, 'No findings recorded.');
      return;
    }

    for (const finding of findings) {
      this.ensureSpace(doc, 35);

      doc
        .font('ReportBold')
        .fontSize(10)
        .text(`${finding.title} (${this.valueOrDash(finding.code)})`);

      doc
        .font('ReportRegular')
        .fontSize(9)
        .text(
          `Severity: ${finding.severity} | Status: ${finding.status} | Due date: ${this.formatDate(finding.dueDate)}`,
        );

      doc.moveDown(0.25);
    }
  }

  private renderAuditLog(
    doc: PDFKit.PDFDocument,
    logs: ReportAuditLog[],
  ): void {
    this.drawSectionTitle(doc, '6. Recent Audit Log');

    if (logs.length === 0) {
      this.drawMutedParagraph(doc, 'No audit log entries found.');
      return;
    }

    for (const log of logs) {
      this.ensureSpace(doc, 30);

      const actorName = log.actor?.name?.trim() || log.actor?.email || 'System';

      doc
        .font('ReportRegular')
        .fontSize(9)
        .text(
          `${this.formatDateTime(log.createdAt)} | ${log.action} | ${actorName}`,
        );
    }
  }

  private drawSectionTitle(doc: PDFKit.PDFDocument, title: string): void {
    this.ensureSpace(doc, 50);

    doc.moveDown(0.8);
    doc.font('ReportBold').fontSize(16).text(title);
    doc.moveDown(0.2);

    const currentY = doc.y;
    doc
      .moveTo(doc.page.margins.left, currentY)
      .lineTo(doc.page.width - doc.page.margins.right, currentY)
      .stroke();

    doc.moveDown(0.5);
  }

  private drawInfoTable(
    doc: PDFKit.PDFDocument,
    rows: Array<[string, string | null | undefined]>,
  ): void {
    const labelWidth = 150;

    for (const [label, value] of rows) {
      this.ensureSpace(doc, 20);

      const y = doc.y;

      doc
        .font('ReportBold')
        .fontSize(10)
        .text(`${label}:`, doc.page.margins.left, y, {
          width: labelWidth,
        });

      doc
        .font('ReportRegular')
        .fontSize(10)
        .text(this.valueOrDash(value), doc.page.margins.left + labelWidth, y, {
          width:
            doc.page.width -
            doc.page.margins.left -
            doc.page.margins.right -
            labelWidth,
        });

      doc.moveDown(0.3);
    }

    doc.moveDown(0.3);
  }

  private drawCard(doc: PDFKit.PDFDocument, lines: string[]): void {
    const startX = doc.page.margins.left;
    const cardWidth =
      doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const innerWidth = cardWidth - 20;
    const paddingTop = 8;
    const paddingBottom = 8;
    const lineGap = 2;

    doc.font('ReportRegular').fontSize(9);

    let contentHeight = 0;

    for (const line of lines) {
      const lineHeight = doc.heightOfString(line, {
        width: innerWidth,
        align: 'left',
      });

      contentHeight += lineHeight + lineGap;
    }

    const cardHeight = Math.max(44, paddingTop + contentHeight + paddingBottom);

    this.ensureSpace(doc, cardHeight + 10);

    const startY = doc.y;

    doc.rect(startX, startY, cardWidth, cardHeight).stroke();

    let textY = startY + paddingTop;

    for (const line of lines) {
      const lineHeight = doc.heightOfString(line, {
        width: innerWidth,
        align: 'left',
      });

      doc
        .font('ReportRegular')
        .fontSize(9)
        .text(line, startX + 10, textY, {
          width: innerWidth,
          align: 'left',
        });

      textY += lineHeight + lineGap;
    }

    doc.y = startY + cardHeight + 8;
  }

  private drawMutedParagraph(doc: PDFKit.PDFDocument, text: string): void {
    this.ensureSpace(doc, 40);
    doc.font('ReportRegular').fontSize(10).text(text, {
      align: 'left',
    });
    doc.moveDown(0.4);
  }

  private addFooter(doc: PDFKit.PDFDocument, projectName: string): void {
    const range = doc.bufferedPageRange();

    for (let i = range.start; i < range.start + range.count; i += 1) {
      doc.switchToPage(i);

      const footerText = `${projectName} | Page ${i - range.start + 1} of ${range.count}`;
      const footerWidth =
        doc.page.width - doc.page.margins.left - doc.page.margins.right;

      // IMPORTANT:
      // Place footer safely ABOVE the bottom margin boundary,
      // otherwise PDFKit may push it to a new page.
      const footerY = doc.page.height - doc.page.margins.bottom - 12;

      // Preserve current cursor position
      const previousX = doc.x;
      const previousY = doc.y;

      doc
        .font('ReportRegular')
        .fontSize(8)
        .text(footerText, doc.page.margins.left, footerY, {
          width: footerWidth,
          align: 'center',
          lineBreak: false,
        });

      // Restore cursor so footer does not affect layout flow
      doc.x = previousX;
      doc.y = previousY;
    }

    // Return to the last real page
    doc.switchToPage(range.start + range.count - 1);
  }

  private ensureSpace(doc: PDFKit.PDFDocument, neededHeight: number): void {
    const bottomLimit = doc.page.height - doc.page.margins.bottom - 30;
    if (doc.y + neededHeight > bottomLimit) {
      doc.addPage();
    }
  }

  private formatDate(value: Date | string | null | undefined): string {
    if (!value) return '—';

    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return '—';

    return date.toLocaleDateString('lt-LT');
  }

  private formatDateTime(value: Date | string | null | undefined): string {
    if (!value) return '—';

    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return '—';

    return date.toLocaleString('lt-LT');
  }

  private valueOrDash(value: string | null | undefined): string {
    if (!value) return '—';
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : '—';
  }
}
