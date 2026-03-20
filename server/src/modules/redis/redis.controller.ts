import { Controller } from '@nestjs/common';
import { RedisService } from './redis-string.service';

@Controller('redis')
export class RedisController {
  constructor(private readonly redisService: RedisService) {}
}
