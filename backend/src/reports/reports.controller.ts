import {
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseEnumPipe,
  Query,
  Req,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Roles } from '../common/decorators/roles.decorator.js';
import { ReportType } from '../common/enums/report-type.enum.js';
import { RoleName } from '../common/enums/role-name.enum.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import type { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface.js';
import { ReportQueryDto } from './dto/report-query.dto.js';
import { ReportFilesService } from './report-files.service.js';
import { ReportsService } from './reports.service.js';

@ApiTags('Reportes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleName.SUPERADMIN)
@Controller('admin/reports')
export class ReportsController {
  constructor(
    private readonly reportsService: ReportsService,
    private readonly reportFilesService: ReportFilesService,
  ) {}

  @Get(':type')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async download(
    @Req() request: AuthenticatedRequest,
    @Param(
      'type',
      new ParseEnumPipe(ReportType, {
        exceptionFactory: () => new NotFoundException('El reporte no existe'),
      }),
    )
    type: ReportType,
    @Query() dto: ReportQueryDto,
  ) {
    const report = await this.reportsService.getReport(type, dto);
    const issuedBy = await this.reportsService.getIssuerName(request.user.id);

    if (dto.format === 'pdf') {
      const pdf = await this.reportFilesService.buildPdf(report, issuedBy);
      return new StreamableFile(pdf, {
        type: 'application/pdf',
        disposition: `attachment; filename="${report.fileName}.pdf"`,
      });
    }
    const excel = await this.reportFilesService.buildExcel(report, issuedBy);
    return new StreamableFile(excel, {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      disposition: `attachment; filename="${report.fileName}.xlsx"`,
    });
  }
}
