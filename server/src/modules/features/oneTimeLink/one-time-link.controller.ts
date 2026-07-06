import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import type express from 'express';
import { AccessTokenExpired } from 'src/exceptions/auth.exception';
import { JwtPayload } from 'src/interfaces/auth.interface';
import {
  CreateOneTimeLinkDto,
  GetPaginatedOneTimeLinksDto,
} from './dto/one-time-link.dto';
import { OneTimeLinkService } from './one-time-link.service';

type AuthenticatedRequest = express.Request & {
  user?: JwtPayload;
};

@Controller('v1/one-time-links')
export class OneTimeLinkController {
  constructor(private readonly oneTimeLinkService: OneTimeLinkService) {}

  @Post()
  async createOneTimeLink(
    @Body() dto: CreateOneTimeLinkDto,
    @Req() req: AuthenticatedRequest,
  ) {
    if (!req.user) {
      throw new AccessTokenExpired();
    }

    return this.oneTimeLinkService.createOneTimeLink(req.user, dto);
  }

  @Get()
  async getPaginatedData(
    @Query() query: GetPaginatedOneTimeLinksDto,
    @Req() req: AuthenticatedRequest,
  ) {
    if (!req.user) {
      throw new AccessTokenExpired();
    }

    return this.oneTimeLinkService.getPaginatedData(req.user, query);
  }

  @Get('analytics')
  async getOneTimeLinkAnalytics(@Req() req: AuthenticatedRequest) {
    if (!req.user) {
      throw new AccessTokenExpired();
    }

    return this.oneTimeLinkService.getOneTimeLinkAnalytics(req.user);
  }

  @Delete(':id')
  async deleteOneTimeLink(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    if (!req.user) {
      throw new AccessTokenExpired();
    }

    return this.oneTimeLinkService.deleteOneTimeLink(req.user, id);
  }
}
