import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { Public } from './decorators/public.decorator';
import { SkipResponseInterceptor } from './decorators/skip-success-interceptor.decorator';

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
