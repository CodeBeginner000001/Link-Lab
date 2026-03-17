import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { AppLogger } from 'src/common/app.logger';
export type AppRequest = Request & {
  startTime?: number;
  clientIp?: string;
};
@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  constructor(private readonly logger: AppLogger) {}
  use(req: AppRequest, res: Response, next: NextFunction) {
    req.startTime = Date.now();
    req.clientIp =
      (req.header['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.socket.remoteAddress ||
      '';
    this.logger.log(
      `[REQ] ${req.method} ${req.originalUrl} ip=${req.clientIp}`,
    );
    next();
  }
}
