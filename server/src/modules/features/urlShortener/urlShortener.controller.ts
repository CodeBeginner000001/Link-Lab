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
} from '@nestjs/common';
import type express from 'express';
import { AccessTokenExpired } from 'src/exceptions/auth.exception';
import { JwtPayload } from 'src/interfaces/auth.interface';
import { UrlShortenerService } from './urlShortener.service';
import {
  CreateShortUrlDto,
  GetPaginatedShortUrlsDto,
  UpdateShortUrlDto,
} from './dto/short-url.dto';

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
  async getPaginatedData(
    @Query() query: GetPaginatedShortUrlsDto,
    @Req() req: AuthenticatedRequest,
  ) {
    if (!req.user) {
      throw new AccessTokenExpired();
    }

    return this.urlShortenerService.getPaginatedData(req.user, query);
  }

  @Get('analytics')
  async getShortUrlAnalytics(@Req() req: AuthenticatedRequest) {
    if (!req.user) {
      throw new AccessTokenExpired();
    }

    return this.urlShortenerService.getShortUrlAnalytics(req.user);
  }

  @Get(':id')
  async getShortUrlById(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    if (!req.user) {
      throw new AccessTokenExpired();
    }

    return this.urlShortenerService.getShortUrlById(req.user, id);
  }

  @Put(':id')
  async updateShortUrl(
    @Param('id') id: string,
    @Body() dto: UpdateShortUrlDto,
    @Req() req: AuthenticatedRequest,
  ) {
    if (!req.user) {
      throw new AccessTokenExpired();
    }

    return this.urlShortenerService.updateShortUrl(req.user, id, dto);
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
