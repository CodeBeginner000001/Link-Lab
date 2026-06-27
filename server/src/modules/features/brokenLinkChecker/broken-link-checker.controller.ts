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
import type { Request } from 'express';
import { AccessTokenExpired } from 'src/exceptions/auth.exception';
import { JwtPayload } from 'src/interfaces/auth.interface';
import { BrokenLinkCheckerService } from './broken-link-checker.service';
import {
  CheckBrokenLinkDto,
  GetPaginatedBrokenLinkChecksDto,
} from './dto/broken-link-checker.dto';

type AuthenticatedRequest = Request & {
  user?: JwtPayload;
};

@Controller('v1/broken-link-checkers')
export class BrokenLinkCheckerController {
  constructor(
    private readonly brokenLinkCheckerService: BrokenLinkCheckerService,
  ) {}

  @Post()
  checkLink(@Body() dto: CheckBrokenLinkDto, @Req() req: AuthenticatedRequest) {
    return this.brokenLinkCheckerService.checkLink(this.getUser(req), dto);
  }

  @Get()
  getPaginatedData(
    @Query() query: GetPaginatedBrokenLinkChecksDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.brokenLinkCheckerService.getPaginatedData(
      this.getUser(req),
      query,
    );
  }

  @Get('analytics')
  getAnalytics(@Req() req: AuthenticatedRequest) {
    return this.brokenLinkCheckerService.getAnalytics(this.getUser(req));
  }

  @Delete(':id')
  deleteLinkCheck(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.brokenLinkCheckerService.deleteLinkCheck(this.getUser(req), id);
  }

  private getUser(req: AuthenticatedRequest): JwtPayload {
    if (!req.user) {
      throw new AccessTokenExpired();
    }

    return req.user;
  }
}
