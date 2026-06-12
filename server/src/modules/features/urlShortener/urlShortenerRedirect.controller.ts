import { Controller, Get, Param, Res } from '@nestjs/common';
import type express from 'express';
import { Public } from 'src/decorators/public.decorator';
import { SkipResponseInterceptor } from 'src/decorators/skip-success-interceptor.decorator';
import { UrlShortenerService } from './urlShortener.service';

@Public()
@SkipResponseInterceptor()
@Controller('r')
export class UrlShortenerRedirectController {
  constructor(private readonly urlShortenerService: UrlShortenerService) {}

  @Get(':alias')
  async resolveShortUrl(
    @Param('alias') alias: string,
    @Res() res: express.Response,
  ) {
    const longUrl = await this.urlShortenerService.resolveShortUrl(alias);

    return res.redirect(longUrl);
  }
}
