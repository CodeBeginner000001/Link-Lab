import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import type express from 'express';
import type { Response } from 'express';
import { SkipResponseInterceptor } from 'src/decorators/skip-success-interceptor.decorator';
import { AccessTokenExpired } from 'src/exceptions/auth.exception';
import { JwtPayload } from 'src/interfaces/auth.interface';
import { CreateQrCodeDto } from './dto/create-qr-code.dto';
import { ExportQrCodeDto, ExportQrCodeQueryDto } from './dto/export-qr-code.dto';
import { GetQrDashboardOverviewDto } from './dto/get-qr-dashboard-overview.dto';
import { QrCodeService } from './qrCode.service';

type AuthenticatedRequest = express.Request & {
  user?: JwtPayload;
};

@Controller('v1/qr-codes')
export class QrCodeController {
  constructor(private readonly qrCodeService: QrCodeService) {}

  private async sendExportResponse(
    user: JwtPayload | undefined,
    publicId: string,
    dto: ExportQrCodeDto,
    res: Response,
  ) {
    if (!user) {
      throw new AccessTokenExpired();
    }

    const exported = await this.qrCodeService.exportQrCode(user, publicId, dto);

    if (exported.kind === 'json') {
      return res.json(exported.body);
    }

    res.setHeader('Content-Type', exported.contentType);
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${exported.filename}"`,
    );

    return res.send(exported.body);
  }

  @Post()
  async createQrCode(
    @Body() dto: CreateQrCodeDto,
    @Req() req: AuthenticatedRequest,
  ) {
    if (!req.user) {
      throw new AccessTokenExpired();
    }

    return this.qrCodeService.createQrCode(req.user, dto);
  }

  @Post(':publicId/export')
  @SkipResponseInterceptor()
  async exportQrCode(
    @Param('publicId') publicId: string,
    @Body() dto: ExportQrCodeDto,
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
  ) {
    return this.sendExportResponse(req.user, publicId, dto, res);
  }

  @Get(':publicId/export')
  @SkipResponseInterceptor()
  async exportQrCodeByUrl(
    @Param('publicId') publicId: string,
    @Query() query: ExportQrCodeQueryDto,
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
  ) {
    return this.sendExportResponse(
      req.user,
      publicId,
      query.toExportDto(),
      res,
    );
  }

  @Delete(':id')
  async deleteQrCode(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    if (!req.user) {
      throw new AccessTokenExpired();
    }

    return this.qrCodeService.deleteQrCode(req.user, id);
  }

  @Get(':publicId')
  async getQrCodeDetail(
    @Param('publicId') publicId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    if (!req.user) {
      throw new AccessTokenExpired();
    }

    return this.qrCodeService.getQrCodeDetail(req.user, publicId);
  }

  @Get('dashboard/overview')
  async getDashboardOverview(
    @Query() query: GetQrDashboardOverviewDto,
    @Req() req: AuthenticatedRequest,
  ) {
    if (!req.user) {
      throw new AccessTokenExpired();
    }

    return this.qrCodeService.getDashboardOverview(req.user, query);
  }
}
