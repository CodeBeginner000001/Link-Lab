import { Controller } from '@nestjs/common';
import { RedisStringService } from './redis-string.service';

@Controller('redis')
export class RedisController {
  constructor(private readonly redisService: RedisStringService) {}
}
