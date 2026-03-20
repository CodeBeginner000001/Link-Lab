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
import { Internal } from 'src/decorators/internal.decorator';
import {
  CreateRedisHashDto,
  DeleteRedisHashFieldsDto,
  ExpireRedisHashDto,
  RenameRedisHashDto,
  UpdateRedisHashDto,
  UpdateRedisHashFieldsDto,
} from './dto/hash.dto';
import { RedisHashService } from './redis-hash.service';

@Controller('redis/hash')
// @Public()
@Internal()
export class RedisHashController {
  constructor(private readonly redisHashService: RedisHashService) {}

  @Post()
  async create(@Body() body: CreateRedisHashDto) {
    return this.redisHashService.create(
      body.key,
      body.value,
      body.ttlSeconds,
      body.db,
    );
  }

  @Post('nx')
  async createIfNotExists(@Body() body: CreateRedisHashDto) {
    return this.redisHashService.createIfNotExists(
      body.key,
      body.value,
      body.ttlSeconds,
      body.db,
    );
  }

  @Get(':key')
  async get(@Param('key') key: string, @Query('db') db?: string) {
    return this.redisHashService.get(
      key,
      db !== undefined ? Number(db) : undefined,
    );
  }

  @Get(':key/raw')
  async getRaw(@Param('key') key: string, @Query('db') db?: string) {
    return this.redisHashService.getRaw(
      key,
      db !== undefined ? Number(db) : undefined,
    );
  }

  @Get(':key/exists')
  async exists(@Param('key') key: string, @Query('db') db?: string) {
    return this.redisHashService.exists(
      key,
      db !== undefined ? Number(db) : undefined,
    );
  }

  @Get(':key/ttl')
  async getTtl(@Param('key') key: string, @Query('db') db?: string) {
    return this.redisHashService.getTtl(
      key,
      db !== undefined ? Number(db) : undefined,
    );
  }

  @Put()
  async update(@Body() body: UpdateRedisHashDto) {
    return this.redisHashService.update(
      body.key,
      body.value,
      body.ttlSeconds,
      body.preserveTtl,
      body.db,
    );
  }

  @Patch('fields')
  async updateFields(@Body() body: UpdateRedisHashFieldsDto) {
    return this.redisHashService.updateFields(
      body.key,
      body.updates,
      body.db,
      body.preserveTtl,
      body.ttlSeconds,
    );
  }

  @Patch('fields/delete')
  async deleteFields(@Body() body: DeleteRedisHashFieldsDto) {
    return this.redisHashService.deleteFields(body.key, body.fields, body.db);
  }

  @Patch('expire')
  async expire(@Body() body: ExpireRedisHashDto) {
    return this.redisHashService.expire(body.key, body.ttlSeconds, body.db);
  }

  @Patch('rename')
  async rename(@Body() body: RenameRedisHashDto) {
    return this.redisHashService.rename(body.oldKey, body.newKey, body.db);
  }

  @Delete(':key')
  async delete(@Param('key') key: string, @Query('db') db?: string) {
    return this.redisHashService.delete(
      key,
      db !== undefined ? Number(db) : undefined,
    );
  }
}
