import {
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RedisService } from 'src/common/db/redis.service';
import { JwtPayload } from 'src/interfaces/auth.interface';
import {
  ShortUrl,
  ShortUrlDocument,
  ShortUrlStatus,
} from 'src/models/short-url.schema';
import { CreateShortUrlDto } from './dto/create-short-url.dto';
import {
  AUTO_ALIAS_GENERATION_ATTEMPTS,
  AUTO_ALIAS_LENGTH,
  getShortUrlAnalyticsKey,
  getShortUrlLookupKey,
  RESERVED_SHORT_URL_ALIASES,
  SHORT_URL_ALIAS_REGEX,
} from './urlShortener.constants';
import {
  normalizeAlias,
  validateAlias,
  generateRandomAlias,
} from '../utils/alias-helper.utils';
import {
  toObjectId,
  normalizeHttpUrl,
  isDuplicateKeyError,
  parseNonNegativeInt,
} from '../utils/common.utils';
import {
  warmJsonCache,
  deleteCacheKeys,
  getJsonCache,
  setHashFields,
  getHashFields,
  incrementHashField,
} from '../utils/redis-helper.utils';
import { User, UserDocument } from 'src/models/user.schema';
import { AccessTokenExpired } from 'src/exceptions/auth.exception';

type ShortUrlCacheEntry = {
  id: string;
  userId: string;
  alias: string;
  longUrl: string;
  status: ShortUrlStatus;
};

type ShortUrlAnalytics = {
  count?: number | string;
  lastClickedAt?: string | null;
};

type SerializedShortUrl = {
  id: string;
  alias: string;
  longUrl: string;
  shortUrl: string;
  status: ShortUrlStatus;
  clicksPersisted: number;
  pendingClicks: number;
  totalClicks: number;
  lastClickedAt: string | Date | null;
  createdAt: Date | null;
  updatedAt: Date | null;
};

@Injectable()
export class UrlShortenerService {
  constructor(
    @InjectModel(ShortUrl.name)
    private readonly shortUrlModel: Model<ShortUrlDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
  ) {}

  async createShortUrl(user: JwtPayload, dto: CreateShortUrlDto) {
    const userId = toObjectId(user.sub, 'Authenticated user id is invalid');
    const userExists = await this.userModel.findById(userId);
    if (!userExists) throw new AccessTokenExpired();
    const longUrl = normalizeHttpUrl({
      value: dto.longUrl,
      fieldName: 'Long URL',
    });

    if (dto.customAlias?.trim()) {
      const alias = normalizeAlias(dto.customAlias);

      validateAlias({
        alias,
        regex: SHORT_URL_ALIAS_REGEX,
        reservedAliases: RESERVED_SHORT_URL_ALIASES,
        minLength: 3,
        maxLength: 32,
        message:
          'Alias must be 3 to 32 characters and use lowercase letters, numbers, underscores, or hyphens only',
      });

      try {
        const shortUrl = await this.shortUrlModel.create({
          userId,
          longUrl,
          alias,
          status: ShortUrlStatus.ACTIVE,
        });

        await this.warmCache(shortUrl);
        await this.initializeAnalytics(shortUrl.alias);

        return {
          message: 'Short URL created successfully',
          shortUrl: this.serializeShortUrl(shortUrl, 0, null),
        };
      } catch (error) {
        if (isDuplicateKeyError(error)) {
          throw new ConflictException({
            message: 'Custom alias is already in use',
            error: 'Conflict',
          });
        }

        throw error;
      }
    }

    for (let i = 0; i < AUTO_ALIAS_GENERATION_ATTEMPTS; i += 1) {
      const alias = generateRandomAlias(AUTO_ALIAS_LENGTH);

      try {
        const shortUrl = await this.shortUrlModel.create({
          userId,
          longUrl,
          alias,
          status: ShortUrlStatus.ACTIVE,
        });

        await this.warmCache(shortUrl);
        await this.initializeAnalytics(shortUrl.alias);

        return {
          message: 'Short URL created successfully',
          shortUrl: this.serializeShortUrl(shortUrl, 0, null),
        };
      } catch (error) {
        if (isDuplicateKeyError(error)) {
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
    const userId = toObjectId(user.sub, 'Authenticated user id is invalid');
    const userExists = await this.userModel.findById(userId);
    if (!userExists) throw new AccessTokenExpired();

    const shortUrls = await this.shortUrlModel
      .find({ userId, status: ShortUrlStatus.ACTIVE })
      .sort({ createdAt: -1 })
      .exec();

    const items: SerializedShortUrl[] = [];

    for (const shortUrl of shortUrls) {
      const analytics = await this.getAnalytics(shortUrl.alias);

      items.push(
        this.serializeShortUrl(
          shortUrl,
          analytics.count,
          analytics.lastClickedAt,
        ),
      );
    }

    return {
      total: items.length,
      items,
    };
  }

  async deleteShortUrl(user: JwtPayload, shortUrlId: string) {
    const userId = toObjectId(user.sub, 'Authenticated user id is invalid');
    const urlId = toObjectId(shortUrlId, 'Short URL id is invalid');
    const userExists = await this.userModel.findById(userId);
    if (!userExists) throw new AccessTokenExpired();
    const shortUrl = await this.shortUrlModel.findById(urlId).exec();
    if (!shortUrl || shortUrl.status === ShortUrlStatus.DISABLED) {
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

    const analytics = await this.getAnalytics(shortUrl.alias);

    shortUrl.status = ShortUrlStatus.DISABLED;
    shortUrl.clicksPersisted += analytics.count;

    if (analytics.lastClickedAt) {
      shortUrl.lastClickedAt = new Date(analytics.lastClickedAt);
    }

    await shortUrl.save();
    await this.clearCache(shortUrl.alias);

    return {
      message: 'Short URL deleted successfully',
      deleted: true,
      flushedPendingClicks: analytics.count,
      shortUrl: this.serializeShortUrl(shortUrl, 0, null),
    };
  }

  async resolveShortUrl(aliasParam: string): Promise<string> {
    const alias = normalizeAlias(aliasParam);

    if (!SHORT_URL_ALIAS_REGEX.test(alias)) {
      throw new NotFoundException({
        message: 'Short URL not found',
        error: 'Not Found',
      });
    }

    const cached = await this.getCachedShortUrl(alias);
    const clickedAt = new Date().toISOString();

    if (cached?.status === ShortUrlStatus.ACTIVE) {
      await incrementHashField({
        client: this.redisService.client,
        key: getShortUrlAnalyticsKey(alias),
        field: 'count',
        by: 1,
      });

      await setHashFields({
        client: this.redisService.client,
        key: getShortUrlAnalyticsKey(alias),
        value: {
          lastClickedAt: clickedAt,
        },
      });

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

    await this.warmCache(shortUrl);

    await incrementHashField({
      client: this.redisService.client,
      key: getShortUrlAnalyticsKey(alias),
      field: 'count',
      by: 1,
    });

    await setHashFields({
      client: this.redisService.client,
      key: getShortUrlAnalyticsKey(alias),
      value: {
        lastClickedAt: clickedAt,
      },
    });

    return shortUrl.longUrl;
  }

  private buildShortUrl(alias: string): string {
    const backendUrl = this.configService
      .getOrThrow<string>('BACKEND_URL')
      .replace(/\/+$/, '');

    const publicBaseUrl = backendUrl.replace(/\/v1$/, '');

    return `${publicBaseUrl}/r/${alias}`;
  }

  private serializeShortUrl(
    shortUrl: ShortUrlDocument,
    pendingClicks: number,
    redisLastClickedAt?: string | null,
  ): SerializedShortUrl {
    return {
      id: String(shortUrl._id),
      alias: shortUrl.alias,
      longUrl: shortUrl.longUrl,
      shortUrl: this.buildShortUrl(shortUrl.alias),
      status: shortUrl.status,
      clicksPersisted: shortUrl.clicksPersisted,
      pendingClicks,
      totalClicks: shortUrl.clicksPersisted + pendingClicks,
      lastClickedAt: redisLastClickedAt ?? shortUrl.lastClickedAt ?? null,
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

    await warmJsonCache({
      client: this.redisService.client,
      key: getShortUrlLookupKey(shortUrl.alias),
      value: payload,
    });
  }

  private async initializeAnalytics(alias: string): Promise<void> {
    await setHashFields({
      client: this.redisService.client,
      key: getShortUrlAnalyticsKey(alias),
      value: {
        count: 0,
        lastClickedAt: null,
      },
    });
  }

  private async getAnalytics(alias: string): Promise<{
    count: number;
    lastClickedAt: string | null;
  }> {
    const analytics = await getHashFields<ShortUrlAnalytics>(
      this.redisService.client,
      getShortUrlAnalyticsKey(alias),
    );

    const count = parseNonNegativeInt(
      analytics?.count !== undefined && analytics?.count !== null
        ? String(analytics.count)
        : null,
    );

    const lastClickedAt =
      typeof analytics?.lastClickedAt === 'string'
        ? analytics.lastClickedAt
        : null;

    return {
      count,
      lastClickedAt,
    };
  }

  private async clearCache(alias: string) {
    await deleteCacheKeys(
      this.redisService.client,
      getShortUrlLookupKey(alias),
      getShortUrlAnalyticsKey(alias),
    );
  }

  private async getCachedShortUrl(
    alias: string,
  ): Promise<ShortUrlCacheEntry | null> {
    const parsed = await getJsonCache<Partial<ShortUrlCacheEntry>>(
      this.redisService.client,
      getShortUrlLookupKey(alias),
    );

    if (!parsed) {
      return null;
    }

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
  }
}
