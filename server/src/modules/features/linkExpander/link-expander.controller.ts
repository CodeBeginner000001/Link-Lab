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
import {
  ExpandLinkDto,
  GetPaginatedExpandedLinksDto,
} from './dto/link-expander.dto';
import { LinkExpanderService } from './link-expander.service';

type AuthenticatedRequest = Request & {
  user?: JwtPayload;
};

@Controller('v1/link-expanders')
export class LinkExpanderController {
  constructor(private readonly linkExpanderService: LinkExpanderService) {}

  @Post()
  expandLink(@Body() dto: ExpandLinkDto, @Req() req: AuthenticatedRequest) {
    return this.linkExpanderService.expandLink(this.getUser(req), dto);
  }

  @Get()
  getPaginatedData(
    @Query() query: GetPaginatedExpandedLinksDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.linkExpanderService.getPaginatedData(this.getUser(req), query);
  }

  @Get('analytics')
  getAnalytics(@Req() req: AuthenticatedRequest) {
    return this.linkExpanderService.getAnalytics(this.getUser(req));
  }

  @Delete(':id')
  deleteExpandedLink(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.linkExpanderService.deleteExpandedLink(this.getUser(req), id);
  }

  private getUser(req: AuthenticatedRequest): JwtPayload {
    if (!req.user) {
      throw new AccessTokenExpired();
    }

    return req.user;
  }
}
