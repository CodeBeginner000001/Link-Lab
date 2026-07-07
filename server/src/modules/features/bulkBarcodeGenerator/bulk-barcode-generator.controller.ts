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
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request, Response } from 'express';
import { pipeline } from 'stream/promises';
import { SkipResponseInterceptor } from 'src/decorators/skip-success-interceptor.decorator';
import { AccessTokenExpired } from 'src/exceptions/auth.exception';
import { JwtPayload } from 'src/interfaces/auth.interface';
import { BulkBarcodeDownloadType } from 'src/models/bulk-barcode.schema';
import { BULK_BARCODE_MAX_FILE_SIZE_BYTES } from './bulk-barcode-generator.constants';
import {
  BulkBarcodeGeneratorService,
  PaginatedBulkBarcodesResponse,
} from './bulk-barcode-generator.service';
import { UploadedBarcodeFile } from './bulk-barcode-parser.service';
import { BulkBarcodeTemplateService } from './bulk-barcode-template.service';
import {
  GenerateBulkBarcodeDto,
  GetPaginatedBulkBarcodesDto,
} from './dto/bulk-barcode-generator.dto';

type AuthenticatedRequest = Request & {
  user?: JwtPayload;
};

@Controller('v1/bulk-barcodes')
export class BulkBarcodeGeneratorController {
  constructor(
    private readonly bulkBarcodeService: BulkBarcodeGeneratorService,
    private readonly templateService: BulkBarcodeTemplateService,
  ) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('bulkFile', {
      limits: { fileSize: BULK_BARCODE_MAX_FILE_SIZE_BYTES },
    }),
  )
  generate(
    @UploadedFile() file: UploadedBarcodeFile | undefined,
    @Body() dto: GenerateBulkBarcodeDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.bulkBarcodeService.generate(this.getUser(req), dto, file);
  }

  @Get()
  getPaginatedData(
    @Query() query: GetPaginatedBulkBarcodesDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<PaginatedBulkBarcodesResponse> {
    return this.bulkBarcodeService.getPaginatedData(this.getUser(req), query);
  }

  @Get('analytics')
  getAnalytics(@Req() req: AuthenticatedRequest) {
    return this.bulkBarcodeService.getAnalytics(this.getUser(req));
  }

  @Get('analytics/activity/:period/:date')
  getActivityByPeriod(
    @Param('period') period: 'week' | 'month' | 'year',
    @Param('date') date: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.bulkBarcodeService.getActivity(this.getUser(req), {
      period,
      date,
    });
  }

  @Get('analytics/export-mix')
  getDownloadMix(@Req() req: AuthenticatedRequest) {
    return this.bulkBarcodeService.getDownloadMix(this.getUser(req));
  }

  @Get('templates/:type')
  @SkipResponseInterceptor()
  downloadTemplate(@Param('type') type: string, @Res() res: Response) {
    const file = this.templateService.getTemplate(type);

    res.setHeader('Content-Type', file.contentType);
    res.setHeader('Cache-Control', 'private, no-store');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${file.filename}"`,
    );
    return res.send(file.body);
  }

  @Delete(':id')
  delete(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.bulkBarcodeService.delete(this.getUser(req), id);
  }

  @Get(':id/download')
  @SkipResponseInterceptor()
  async download(
    @Param('id') id: string,
    @Query('type') type: BulkBarcodeDownloadType,
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
  ) {
    const file = await this.bulkBarcodeService.download(
      this.getUser(req),
      id,
      type,
    );

    res.setHeader('Content-Type', file.contentType);
    res.setHeader('Cache-Control', 'private, no-store');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${file.filename}"`,
    );
    if (file.stream) {
      return pipeline(file.stream, res);
    }

    return res.send(file.body);
  }

  private getUser(req: AuthenticatedRequest): JwtPayload {
    if (!req.user) {
      throw new AccessTokenExpired();
    }

    return req.user;
  }
}
