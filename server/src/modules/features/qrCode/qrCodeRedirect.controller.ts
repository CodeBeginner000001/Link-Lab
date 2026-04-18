import { Controller, Get, Param, Res } from '@nestjs/common';
import type express from 'express';
import { Public } from 'src/decorators/public.decorator';
import { SkipResponseInterceptor } from 'src/decorators/skip-success-interceptor.decorator';
import { QrCodeService } from './qrCode.service';

@Controller('q')
export class QrCodeRedirectController {
  constructor(private readonly qrCodeService: QrCodeService) {}

  @Public()
  @SkipResponseInterceptor()
  @Get(':publicId')
  async resolveQrCode(
    @Param('publicId') publicId: string,
    @Res() res: express.Response,
  ) {
    const targetUrl = await this.qrCodeService.resolveQrCode(publicId);

    return res.redirect(targetUrl);
  }
}
