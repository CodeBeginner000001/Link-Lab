import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
} from '@nestjs/common';
import type express from 'express';
import { AccessTokenExpired } from 'src/exceptions/auth.exception';
import { JwtPayload } from 'src/interfaces/auth.interface';
import { CreateShortUrlDto } from './dto/create-short-url.dto';
import { UrlShortenerService } from './urlShortener.service';

type AuthenticatedRequest = express.Request & {
  user?: JwtPayload;
};

@Controller('v1/short-urls')
export class UrlShortenerController {
  constructor(private readonly urlShortenerService: UrlShortenerService) {}

  @Post()
  async createShortUrl(
    @Body() dto: CreateShortUrlDto,
    @Req() req: AuthenticatedRequest,
  ) {
    if (!req.user) {
      throw new AccessTokenExpired();
    }

    return this.urlShortenerService.createShortUrl(req.user, dto);
  }

  @Get()
  async getUserShortUrls(@Req() req: AuthenticatedRequest) {
    if (!req.user) {
      throw new AccessTokenExpired();
    }

    return this.urlShortenerService.getUserShortUrls(req.user);
  }

  @Delete(':id')
  async deleteShortUrl(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    if (!req.user) {
      throw new AccessTokenExpired();
    }

    return this.urlShortenerService.deleteShortUrl(req.user, id);
  }
}
