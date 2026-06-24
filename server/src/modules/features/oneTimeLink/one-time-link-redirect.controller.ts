import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Res,
} from '@nestjs/common';
import type express from 'express';
import { Public } from 'src/decorators/public.decorator';
import { SkipResponseInterceptor } from 'src/decorators/skip-success-interceptor.decorator';
import {
  OneTimeLinkInvalidPasswordException,
  OneTimeLinkNotFoundException,
  OneTimeLinkPasswordRequiredException,
} from 'src/exceptions/one-time-link.exception';
import { ResolveProtectedOneTimeLinkDto } from './dto/one-time-link.dto';
import { OneTimeLinkService } from './one-time-link.service';
import { renderProtectedOneTimeLinkPage } from './template/protected-link.template';
import { renderUnavailableOneTimeLinkPage } from './template/unavailable-link.template';

@Public()
@SkipResponseInterceptor()
@Controller('ot')
export class OneTimeLinkRedirectController {
  constructor(private readonly oneTimeLinkService: OneTimeLinkService) {}

  @Get(':alias')
  async resolveOneTimeLink(
    @Param('alias') alias: string,
    @Res() res: express.Response,
  ) {
    try {
      const originalUrl =
        await this.oneTimeLinkService.resolveOneTimeLink(alias);

      return res.redirect(originalUrl);
    } catch (error) {
      if (error instanceof OneTimeLinkPasswordRequiredException) {
        return res
          .status(200)
          .type('html')
          .send(renderProtectedOneTimeLinkPage({ alias }));
      }

      if (error instanceof OneTimeLinkNotFoundException) {
        return res
          .status(410)
          .type('html')
          .send(renderUnavailableOneTimeLinkPage({ alias }));
      }

      throw error;
    }
  }

  @Post(':alias/resolve')
  async resolveProtectedOneTimeLink(
    @Param('alias') alias: string,
    @Body() dto: ResolveProtectedOneTimeLinkDto,
    @Headers('accept') accept: string | undefined,
    @Res() res: express.Response,
  ) {
    try {
      const originalUrl = await this.oneTimeLinkService.resolveOneTimeLink(
        alias,
        dto.password,
      );

      if (accept?.includes('text/html')) {
        return res.redirect(originalUrl);
      }

      return res.json({
        originalUrl,
      });
    } catch (error) {
      if (
        accept?.includes('text/html') &&
        error instanceof OneTimeLinkInvalidPasswordException
      ) {
        return res
          .status(403)
          .type('html')
          .send(
            renderProtectedOneTimeLinkPage({
              alias,
              errorMessage: 'Password is incorrect.',
            }),
          );
      }

      if (
        accept?.includes('text/html') &&
        error instanceof OneTimeLinkNotFoundException
      ) {
        return res
          .status(410)
          .type('html')
          .send(renderUnavailableOneTimeLinkPage({ alias }));
      }

      throw error;
    }
  }
}
