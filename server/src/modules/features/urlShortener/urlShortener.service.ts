import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { createHash } from 'crypto';
import { Model, Types } from 'mongoose';
import { RedisService } from 'src/common/db/redis.service';
import { AccessTokenExpired } from 'src/exceptions/auth.exception';
import {
  ShortUrlAccessDeniedException,
  ShortUrlAliasAlreadyInUseException,
  ShortUrlAliasGenerationFailedException,
  ShortUrlDuplicateRequestException,
  ShortUrlNoChangesException,
  ShortUrlNotFoundException,
  ShortUrlUpdateFieldsRequiredException,
} from 'src/exceptions/url-shortener.exception';
import { JwtPayload } from 'src/interfaces/auth.interface';
import {
  ShortUrl,
  ShortUrlDocument,
  ShortUrlStatus,
} from 'src/models/short-url.schema';
import { User, UserDocument } from 'src/models/user.schema';
import {
  generateRandomAlias,
  normalizeAlias,
  validateAlias,
} from '../utils/alias-helper.utils';
import {
  isDuplicateKeyError,
  normalizeHttpUrl,
  parseNonNegativeInt,
  toObjectId,
} from '../utils/common.utils';
import {
  deleteCacheKeys,
  getHashFields,
  getJsonCache,
  incrementHashField,
  setHashFields,
  warmJsonCache,
} from '../utils/redis-helper.utils';
import {
  AUTO_ALIAS_GENERATION_ATTEMPTS,
  AUTO_ALIAS_LENGTH,
  DEFAULT_SHORT_URL_PAGE_LIMIT,
  getShortUrlAnalyticsKey,
  getShortUrlLookupKey,
  RESERVED_SHORT_URL_ALIASES,
  SHORT_URL_ALIAS_REGEX,
} from './urlShortener.constants';
import {
  CreateShortUrlDto,
  GetUserShortUrlsDto,
  UpdateShortUrlDto,
} from './dto/short-url.dto';

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
    const userId = await this.getAuthenticatedUserId(user);
    const requestBodyHash = createHash('sha256')
      .update(JSON.stringify(dto))
      .digest('hex');
    const existingShortUrl = await this.shortUrlModel
      .exists({
        userId,
        requestBodyHash,
        status: ShortUrlStatus.ACTIVE,
      })
      .exec();

    if (existingShortUrl) {
      throw new ShortUrlDuplicateRequestException();
    }

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
          requestBodyHash,
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
          throw new ShortUrlAliasAlreadyInUseException();
        }

        throw error;
      }
    }

    for (let i = 0; i < AUTO_ALIAS_GENERATION_ATTEMPTS; i += 1) {
      const alias = generateRandomAlias(AUTO_ALIAS_LENGTH);

      try {
        const shortUrl = await this.shortUrlModel.create({
          userId,
          requestBodyHash,
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

    throw new ShortUrlAliasGenerationFailedException();
  }

  async getUserShortUrls(user: JwtPayload, query: GetUserShortUrlsDto) {
    const userId = await this.getAuthenticatedUserId(user);

    const limit = query.limit ?? DEFAULT_SHORT_URL_PAGE_LIMIT;
    const cursorId = query.cursor
      ? toObjectId(query.cursor, 'Cursor id is invalid')
      : null;

    const shortUrls = await this.shortUrlModel
      .find({
        userId,
        status: ShortUrlStatus.ACTIVE,
        ...(cursorId ? { _id: { $lt: cursorId } } : {}),
      })
      .sort({ _id: -1 })
      .limit(limit + 1)
      .exec();

    const hasmore = shortUrls.length > limit;
    const currentPageItems = hasmore ? shortUrls.slice(0, limit) : shortUrls;
    const items: SerializedShortUrl[] = [];

    for (const shortUrl of currentPageItems) {
      const analytics = await this.getAnalytics(shortUrl.alias);

      items.push(
        this.serializeShortUrl(
          shortUrl,
          analytics.count,
          analytics.lastClickedAt,
        ),
      );
    }

    const nextCursor = items.length > 0 ? items[items.length - 1].id : null;

    return {
      items,
      pagination: {
        hasmore,
        limit,
        cursor: nextCursor,
      },
    };
  }

  async getShortUrlById(user: JwtPayload, shortUrlId: string) {
    const userId = await this.getAuthenticatedUserId(user);
    const urlId = toObjectId(shortUrlId, 'Short URL id is invalid');

    const shortUrl = await this.shortUrlModel.findById(urlId).exec();

    if (!shortUrl || shortUrl.status === ShortUrlStatus.DISABLED) {
      throw new ShortUrlNotFoundException();
    }

    if (String(shortUrl.userId) !== String(userId)) {
      throw new ShortUrlAccessDeniedException();
    }

    const analytics = await this.getAnalytics(shortUrl.alias);

    return {
      shortUrl: this.serializeShortUrl(
        shortUrl,
        analytics.count,
        analytics.lastClickedAt,
      ),
    };
  }

  async updateShortUrl(
    user: JwtPayload,
    shortUrlId: string,
    dto: UpdateShortUrlDto,
  ) {
    const userId = await this.getAuthenticatedUserId(user);
    const urlId = toObjectId(shortUrlId, 'Short URL id is invalid');

    const shortUrl = await this.shortUrlModel.findById(urlId).exec();

    if (!shortUrl || shortUrl.status === ShortUrlStatus.DISABLED) {
      throw new ShortUrlNotFoundException();
    }

    if (String(shortUrl.userId) !== String(userId)) {
      throw new ShortUrlAccessDeniedException();
    }

    if (
      shortUrl.longUrl === dto.longUrl &&
      shortUrl.alias === dto.customAlias
    ) {
      throw new ShortUrlNoChangesException();
    }

    if (dto.longUrl === undefined && dto.customAlias === undefined) {
      throw new ShortUrlUpdateFieldsRequiredException();
    }

    const nextLongUrl =
      dto.longUrl !== undefined
        ? normalizeHttpUrl({
            value: dto.longUrl,
            fieldName: 'Long URL',
          })
        : undefined;

    const nextAlias =
      dto.customAlias !== undefined
        ? normalizeAlias(dto.customAlias)
        : undefined;

    if (nextAlias) {
      validateAlias({
        alias: nextAlias,
        regex: SHORT_URL_ALIAS_REGEX,
        reservedAliases: RESERVED_SHORT_URL_ALIASES,
        minLength: 3,
        maxLength: 32,
        message:
          'Alias must be 3 to 32 characters and use lowercase letters, numbers, underscores, or hyphens only',
      });
    }

    const originalAlias = shortUrl.alias;
    const aliasChanged =
      nextAlias !== undefined && nextAlias !== shortUrl.alias;

    if (aliasChanged) {
      const analytics = await this.getAnalytics(originalAlias);
      shortUrl.clicksPersisted += analytics.count;

      if (analytics.lastClickedAt) {
        shortUrl.lastClickedAt = new Date(analytics.lastClickedAt);
      }

      shortUrl.alias = nextAlias;
    }

    if (nextLongUrl !== undefined) {
      shortUrl.longUrl = nextLongUrl;
    }

    try {
      await shortUrl.save();
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        throw new ShortUrlAliasAlreadyInUseException();
      }

      throw error;
    }

    if (aliasChanged) {
      await this.clearCache(originalAlias);
      await this.warmCache(shortUrl);
      await this.initializeAnalytics(shortUrl.alias);

      return {
        message: 'Short URL updated successfully',
        shortUrl: this.serializeShortUrl(shortUrl, 0, null),
      };
    }

    await this.warmCache(shortUrl);

    const analytics = await this.getAnalytics(shortUrl.alias);

    return {
      message: 'Short URL updated successfully',
      shortUrl: this.serializeShortUrl(
        shortUrl,
        analytics.count,
        analytics.lastClickedAt,
      ),
    };
  }

  async deleteShortUrl(user: JwtPayload, shortUrlId: string) {
    const userId = await this.getAuthenticatedUserId(user);
    const shortUrl = await this.getOwnedShortUrl(userId, shortUrlId);

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
      throw new ShortUrlNotFoundException();
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
      throw new ShortUrlNotFoundException();
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

  private async getAuthenticatedUserId(
    user: JwtPayload,
  ): Promise<Types.ObjectId> {
    const userId = toObjectId(user.sub, 'Authenticated user id is invalid');
    const userExists = await this.userModel.exists({ _id: userId });

    if (!userExists) {
      throw new AccessTokenExpired();
    }

    return userId;
  }

  private async getOwnedShortUrl(
    userId: Types.ObjectId,
    shortUrlId: string,
  ): Promise<ShortUrlDocument> {
    const urlId = toObjectId(shortUrlId, 'Short URL id is invalid');
    const shortUrl = await this.shortUrlModel.findById(urlId).exec();

    if (!shortUrl || shortUrl.status === ShortUrlStatus.DISABLED) {
      throw new ShortUrlNotFoundException();
    }

    if (String(shortUrl.userId) !== String(userId)) {
      throw new ShortUrlAccessDeniedException();
    }

    return shortUrl;
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
