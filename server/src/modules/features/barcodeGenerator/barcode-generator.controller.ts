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
import type { Request, Response } from 'express';
import { Public } from 'src/decorators/public.decorator';
import { SkipResponseInterceptor } from 'src/decorators/skip-success-interceptor.decorator';
import { AccessTokenExpired } from 'src/exceptions/auth.exception';
import { JwtPayload } from 'src/interfaces/auth.interface';
import { BarcodeGeneratorService } from './barcode-generator.service';
import {
  GenerateBarcodeDto,
  GetRecentBarcodesDto,
  GetBarcodeActivityDto,
  DownloadBarcodeDto,
} from './dto/barcode-generator.dto';

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

  @Get('recent')
  getRecent(
    @Query() query: GetRecentBarcodesDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.barcodeService.getRecent(this.getUser(req), query);
  }

  @Get('analytics/summary')
  getSummary(@Req() req: AuthenticatedRequest) {
    return this.barcodeService.getSummary(this.getUser(req));
  }

  @Get('analytics/activity')
  getActivity(
    @Query() query: GetBarcodeActivityDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.barcodeService.getActivity(this.getUser(req), query);
  }

  @Delete(':id')
  delete(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.barcodeService.delete(this.getUser(req), id);
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
