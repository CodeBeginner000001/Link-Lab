import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { randomBytes } from 'crypto';
import { Model, Types } from 'mongoose';
import { RedisService } from 'src/common/db/redis.service';
import { JwtPayload } from 'src/interfaces/auth.interface';
import { CreateShortUrlDto } from './dto/create-short-url.dto';
import {
  ShortUrl,
  ShortUrlDocument,
  ShortUrlStatus,
} from 'src/models/short-url.schema';
import {
  AUTO_ALIAS_GENERATION_ATTEMPTS,
  AUTO_ALIAS_LENGTH,
  getShortUrlLookupKey,
  getShortUrlPendingClicksKey,
  RESERVED_SHORT_URL_ALIASES,
  SHORT_URL_ALIAS_REGEX,
} from './urlShortener.constants';

type ShortUrlCacheEntry = {
  id: string;
  userId: string;
  alias: string;
  longUrl: string;
  status: ShortUrlStatus;
};

@Injectable()
export class UrlShortenerService {
  constructor(
    @InjectModel(ShortUrl.name)
    private readonly shortUrlModel: Model<ShortUrlDocument>,
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
  ) {}

  async createShortUrl(user: JwtPayload, dto: CreateShortUrlDto) {
    const userId = this.toObjectId(
      user.sub,
      'Authenticated user id is invalid',
    );
    const longUrl = this.normalizeLongUrl(dto.longUrl);

    if (dto.customAlias?.trim()) {
      const alias = this.normalizeAlias(dto.customAlias);
      this.validateAlias(alias);

      try {
        const shortUrl = await this.shortUrlModel.create({
          userId,
          longUrl,
          alias,
          status: ShortUrlStatus.ACTIVE,
        });

        await this.warmCache(shortUrl);

        return {
          message: 'Short URL created successfully',
          shortUrl: this.serializeShortUrl(shortUrl, 0),
        };
      } catch (error) {
        if (this.isDuplicateKeyError(error)) {
          throw new ConflictException({
            message: 'Custom alias is already in use',
            error: 'Conflict',
          });
        }

        throw error;
      }
    }

    for (let i = 0; i < AUTO_ALIAS_GENERATION_ATTEMPTS; i += 1) {
      const alias = this.generateAlias();

      try {
        const shortUrl = await this.shortUrlModel.create({
          userId,
          longUrl,
          alias,
          status: ShortUrlStatus.ACTIVE,
        });

        await this.warmCache(shortUrl);

        return {
          message: 'Short URL created successfully',
          shortUrl: this.serializeShortUrl(shortUrl, 0),
        };
      } catch (error) {
        if (this.isDuplicateKeyError(error)) {
          continue;
        }

        throw error;
      }
    }

    throw new InternalServerErrorException({
      message: 'Could not generate a unique short URL alias',
      error: 'Internal Server Error',
    });
  }

  async getUserShortUrls(user: JwtPayload) {
    const userId = this.toObjectId(
      user.sub,
      'Authenticated user id is invalid',
    );

    const shortUrls = await this.shortUrlModel
      .find({ userId, status: ShortUrlStatus.ACTIVE })
      .sort({ createdAt: -1 })
      .exec();

    const pendingClickKeys = shortUrls.map((item) =>
      getShortUrlPendingClicksKey(item.alias),
    );

    const pendingClickValues =
      pendingClickKeys.length > 0
        ? await this.redisService.client.mget(...pendingClickKeys)
        : [];

    const items = shortUrls.map((item, index) =>
      this.serializeShortUrl(
        item,
        this.parsePendingClicks(pendingClickValues[index]),
      ),
    );

    return {
      total: items.length,
      items,
    };
  }

  async deleteShortUrl(user: JwtPayload, shortUrlId: string) {
    const userId = this.toObjectId(
      user.sub,
      'Authenticated user id is invalid',
    );
    const urlId = this.toObjectId(shortUrlId, 'Short URL id is invalid');

    const shortUrl = await this.shortUrlModel.findById(urlId).exec();

    if (!shortUrl) {
      throw new NotFoundException({
        message: 'Short URL not found',
        error: 'Not Found',
      });
    }

    if (String(shortUrl.userId) !== String(userId)) {
      throw new ForbiddenException({
        message: 'You do not have access to this short URL',
        error: 'Forbidden',
      });
    }

    const rawPendingClicks = await this.redisService.client.get(
      getShortUrlPendingClicksKey(shortUrl.alias),
    );
    const flushedPendingClicks = this.parsePendingClicks(rawPendingClicks);

    shortUrl.status = ShortUrlStatus.DISABLED;
    shortUrl.clicksPersisted += flushedPendingClicks;

    if (flushedPendingClicks > 0) {
      shortUrl.lastClickedAt = new Date();
    }

    await shortUrl.save();
    await this.clearCache(shortUrl.alias);

    return {
      message: 'Short URL deleted successfully',
      deleted: true,
      flushedPendingClicks,
      shortUrl: this.serializeShortUrl(shortUrl, 0),
    };
  }

  async resolveShortUrl(aliasParam: string): Promise<string> {
    const alias = this.normalizeAlias(aliasParam);

    if (!SHORT_URL_ALIAS_REGEX.test(alias)) {
      throw new NotFoundException({
        message: 'Short URL not found',
        error: 'Not Found',
      });
    }

    const cached = await this.getCachedShortUrl(alias);

    if (cached?.status === ShortUrlStatus.ACTIVE) {
      await this.redisService.client.incr(getShortUrlPendingClicksKey(alias));
      return cached.longUrl;
    }

    const shortUrl = await this.shortUrlModel
      .findOne({ alias, status: ShortUrlStatus.ACTIVE })
      .exec();

    if (!shortUrl) {
      throw new NotFoundException({
        message: 'Short URL not found',
        error: 'Not Found',
      });
    }

    await Promise.all([
      this.warmCache(shortUrl),
      this.redisService.client.incr(getShortUrlPendingClicksKey(alias)),
    ]);

    return shortUrl.longUrl;
  }

  private normalizeLongUrl(longUrl: string): string {
    const value = longUrl.trim();

    let parsed: URL;

    try {
      parsed = new URL(value);
    } catch {
      throw new BadRequestException({
        message: 'Long URL is invalid',
        error: 'Bad Request',
      });
    }

    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new BadRequestException({
        message: 'Long URL must use http or https',
        error: 'Bad Request',
      });
    }

    return parsed.toString();
  }

  private normalizeAlias(alias: string): string {
    return alias.trim().toLowerCase();
  }

  private validateAlias(alias: string) {
    if (RESERVED_SHORT_URL_ALIASES.has(alias)) {
      throw new BadRequestException({
        message: 'Custom alias is reserved and cannot be used',
        error: 'Bad Request',
      });
    }

    if (!SHORT_URL_ALIAS_REGEX.test(alias) || alias.length < 3) {
      throw new BadRequestException({
        message:
          'Alias must be 3 to 32 characters and use lowercase letters, numbers, underscores, or hyphens only',
        error: 'Bad Request',
      });
    }
  }

  private generateAlias(): string {
    return randomBytes(16).toString('hex').slice(0, AUTO_ALIAS_LENGTH);
  }

  private buildShortUrl(alias: string): string {
    const backendUrl = this.configService
      .getOrThrow<string>('BACKEND_URL')
      .replace(/\/+$/, '');

    const publicBaseUrl = backendUrl.replace(/\/v1$/, '');

    return `${publicBaseUrl}/r/${alias}`;
  }

  private serializeShortUrl(shortUrl: ShortUrlDocument, pendingClicks: number) {
    return {
      id: String(shortUrl._id),
      alias: shortUrl.alias,
      longUrl: shortUrl.longUrl,
      shortUrl: this.buildShortUrl(shortUrl.alias),
      status: shortUrl.status,
      clicksPersisted: shortUrl.clicksPersisted,
      pendingClicks,
      totalClicks: shortUrl.clicksPersisted + pendingClicks,
      lastClickedAt: shortUrl.lastClickedAt ?? null,
      createdAt: shortUrl.createdAt ?? null,
      updatedAt: shortUrl.updatedAt ?? null,
    };
  }

  private async warmCache(shortUrl: ShortUrlDocument) {
    const payload: ShortUrlCacheEntry = {
      id: String(shortUrl._id),
      userId: String(shortUrl.userId),
      alias: shortUrl.alias,
      longUrl: shortUrl.longUrl,
      status: shortUrl.status,
    };

    await this.redisService.client.set(
      getShortUrlLookupKey(shortUrl.alias),
      JSON.stringify(payload),
    );
  }

  private async clearCache(alias: string) {
    await this.redisService.client.del(
      getShortUrlLookupKey(alias),
      getShortUrlPendingClicksKey(alias),
    );
  }

  private async getCachedShortUrl(
    alias: string,
  ): Promise<ShortUrlCacheEntry | null> {
    const raw = await this.redisService.client.get(getShortUrlLookupKey(alias));

    if (!raw) {
      return null;
    }

    try {
      const parsed = JSON.parse(raw) as Partial<ShortUrlCacheEntry>;

      if (
        typeof parsed.id !== 'string' ||
        typeof parsed.userId !== 'string' ||
        typeof parsed.alias !== 'string' ||
        typeof parsed.longUrl !== 'string'
      ) {
        return null;
      }

      return {
        id: parsed.id,
        userId: parsed.userId,
        alias: parsed.alias,
        longUrl: parsed.longUrl,
        status:
          parsed.status === ShortUrlStatus.DISABLED
            ? ShortUrlStatus.DISABLED
            : ShortUrlStatus.ACTIVE,
      };
    } catch {
      return null;
    }
  }

  private parsePendingClicks(value: string | null): number {
    if (!value) {
      return 0;
    }

    const parsed = Number.parseInt(value, 10);
    return Number.isNaN(parsed) || parsed < 0 ? 0 : parsed;
  }

  private toObjectId(id: string, message: string): Types.ObjectId {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException({
        message,
        error: 'Bad Request',
      });
    }

    return new Types.ObjectId(id);
  }

  private isDuplicateKeyError(error: unknown): boolean {
    return (error as { code?: number } | null)?.code === 11000;
  }
}
