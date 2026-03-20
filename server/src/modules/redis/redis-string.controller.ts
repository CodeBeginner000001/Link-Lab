import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import {
  CreateRedisKeyDto,
  ExpireRedisKeyDto,
  RenameRedisKeyDto,
  UpdateRedisFieldsDto,
  UpdateRedisKeyDto,
} from './dto/string.dto';
import { RedisStringService } from './redis-string.service';
import { Public } from 'src/decorators/public.decorator';

@Controller('redis/string')
@Public()
export class RedisStringController {
  constructor(private readonly redisStringService: RedisStringService) {}
  @Post()
  async create(@Body() body: CreateRedisKeyDto) {
    return this.redisStringService.create(
      body.key,
      body.value,
      body.ttlSeconds,
      body.db,
    );
  }
  @Post('nx')
  async createIfNotExists(@Body() body: CreateRedisKeyDto) {
    return this.redisStringService.createIfNotExists(
      body.key,
      body.value,
      body.ttlSeconds,
      body.db,
    );
  }
  @Get(':key')
  async get(@Param('key') key: string, @Query('db') db?: string) {
    return this.redisStringService.get(
      key,
      db !== undefined ? Number(db) : undefined,
    );
  }
  @Get(':key/raw')
  async getRaw(@Param('key') key: string, @Query('db') db?: string) {
    return this.redisStringService.getRaw(
      key,
      db !== undefined ? Number(db) : undefined,
    );
  }
  @Get(':key/exists')
  async exists(@Param('key') key: string, @Query('db') db?: string) {
    return this.redisStringService.exists(
      key,
      db !== undefined ? Number(db) : undefined,
    );
  }
  @Get(':key/ttl')
  async getTtl(@Param('key') key: string, @Query('db') db?: string) {
    return this.redisStringService.getTtl(
      key,
      db !== undefined ? Number(db) : undefined,
    );
  }
  @Put()
  async update(@Body() body: UpdateRedisKeyDto) {
    return this.redisStringService.update(
      body.key,
      body.value,
      body.ttlSeconds,
      body.preserveTtl,
      body.db,
    );
  }
  @Patch('fields')
  async updateFields(@Body() body: UpdateRedisFieldsDto) {
    return this.redisStringService.updateFields(
      body.key,
      body.updates,
      body.db,
      body.preserveTtl,
      body.ttlSeconds,
    );
  }
  @Patch('expire')
  async expire(@Body() body: ExpireRedisKeyDto) {
    return this.redisStringService.expire(body.key, body.ttlSeconds, body.db);
  }
  @Patch('rename')
  async rename(@Body() body: RenameRedisKeyDto) {
    return this.redisStringService.rename(body.oldKey, body.newKey, body.db);
  }
  @Delete(':key')
  async delete(@Param('key') key: string, @Query('db') db?: string) {
    return this.redisStringService.delete(
      key,
      db !== undefined ? Number(db) : undefined,
    );
  }
}
