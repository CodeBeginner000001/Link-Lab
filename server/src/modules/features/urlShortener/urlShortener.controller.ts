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
import { CreateShortUrlDto } from './dto/create-short-url.dto';
import { GetUserShortUrlsDto } from './dto/get-user-short-urls.dto';
import { UpdateShortUrlDto } from './dto/update-short-url.dto';
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
  async getUserShortUrls(
    @Query() query: GetUserShortUrlsDto,
    @Req() req: AuthenticatedRequest,
  ) {
    if (!req.user) {
      throw new AccessTokenExpired();
    }

    return this.urlShortenerService.getUserShortUrls(req.user, query);
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
