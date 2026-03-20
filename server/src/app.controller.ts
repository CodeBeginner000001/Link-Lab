import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { SkipResponseInterceptor } from './decorators/skip-success-interceptor.decorator';
import { Public } from './decorators/public.decorator';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @Public()
  @SkipResponseInterceptor()
  Health(): string {
    return this.appService.health();
  }
}
