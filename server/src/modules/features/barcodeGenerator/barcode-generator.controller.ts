import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Public } from 'src/decorators/public.decorator';
import { SkipResponseInterceptor } from 'src/decorators/skip-success-interceptor.decorator';
import { AccessTokenExpired } from 'src/exceptions/auth.exception';
import { JwtPayload } from 'src/interfaces/auth.interface';
import {
  BarcodeGeneratorService,
  PaginatedBarcodesResponse,
} from './barcode-generator.service';
import {
  GenerateBarcodeDto,
  GetPaginatedBarcodesDto,
  DownloadBarcodeDto,
  UpdateBarcodeDto,
} from './dto/barcode-generator.dto';
import { BarcodeActivityPeriod } from './barcode-generator.constants';

type AuthenticatedRequest = Request & {
  user?: JwtPayload;
};

@Controller('v1/barcodes')
export class BarcodeGeneratorController {
  constructor(private readonly barcodeService: BarcodeGeneratorService) {}

  @Get('formats')
  @Public()
  getFormats() {
    return this.barcodeService.getFormats();
  }

  @Post()
  generate(@Body() dto: GenerateBarcodeDto, @Req() req: AuthenticatedRequest) {
    return this.barcodeService.generate(this.getUser(req), dto);
  }

  @Get()
  getPaginatedData(
    @Query() query: GetPaginatedBarcodesDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<PaginatedBarcodesResponse> {
    return this.barcodeService.getPaginatedData(this.getUser(req), query);
  }

  @Get('analytics')
  getSummary(@Req() req: AuthenticatedRequest) {
    return this.barcodeService.getAnalytics(this.getUser(req));
  }

  @Get(':id')
  getById(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.barcodeService.getById(this.getUser(req), id);
  }

  @Put(':id')
  edit(
    @Param('id') id: string,
    @Body() dto: UpdateBarcodeDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.barcodeService.update(this.getUser(req), id, dto);
  }

  @Delete(':id')
  delete(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.barcodeService.delete(this.getUser(req), id);
  }

  @Get('analytics/activity/:period/:date')
  getActivityByPeriod(
    @Param('period') period: BarcodeActivityPeriod,
    @Param('date') date: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.barcodeService.getActivity(this.getUser(req), {
      period,
      date,
    });
  }

  @Get('analytics/format-mix')
  getFormatMix(@Req() req: AuthenticatedRequest) {
    return this.barcodeService.getFormatMix(this.getUser(req));
  }

  @Get(':id/preview')
  @SkipResponseInterceptor()
  async preview(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
  ) {
    const file = await this.barcodeService.getPreview(this.getUser(req), id);
    res.setHeader('Content-Type', file.contentType);
    res.setHeader('Cache-Control', 'private, max-age=3600');
    res.setHeader('Content-Disposition', `inline; filename="${file.filename}"`);
    return res.send(file.body);
  }

  @Get(':id/download')
  @SkipResponseInterceptor()
  async download(
    @Param('id') id: string,
    @Query() query: DownloadBarcodeDto,
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
  ) {
    const file = await this.barcodeService.download(
      this.getUser(req),
      id,
      query.type,
    );

    res.setHeader('Content-Type', file.contentType);
    res.setHeader('Cache-Control', 'private, no-store');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${file.filename}"`,
    );
    return res.send(file.body);
  }

  private getUser(req: AuthenticatedRequest): JwtPayload {
    if (!req.user) {
      throw new AccessTokenExpired();
    }

    return req.user;
  }
}
