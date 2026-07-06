import { Controller, Get, Req } from '@nestjs/common';
import type express from 'express';
import { AccessTokenExpired } from 'src/exceptions/auth.exception';
import { JwtPayload } from 'src/interfaces/auth.interface';
import { DashboardService } from './dashboard.service';

type AuthenticatedRequest = express.Request & {
  user?: JwtPayload;
};

@Controller('v1/dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  async getSummary(@Req() req: AuthenticatedRequest) {
    if (!req.user) {
      throw new AccessTokenExpired();
    }

    return this.dashboardService.getSummary(req.user);
  }
}
