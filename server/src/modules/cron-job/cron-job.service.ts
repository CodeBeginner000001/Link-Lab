import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RedisService } from 'src/common/db/redis.service';
import {
  ShortUrl,
  ShortUrlDocument,
  ShortUrlStatus,
} from 'src/models/short-url.schema';
import { getShortUrlAnalyticsKey } from '../features/urlShortener/urlShortener.constants';
import { parseNonNegativeInt } from '../features/utils/common.utils';
import {
  getHashFields,
  setHashFields,
} from '../features/utils/redis-helper.utils';

type ShortUrlAnalyticsHash = {
  count?: number | string;
  lastClickedAt?: string | null;
};

@Injectable()
export class CronJobService {
  private readonly logger = new Logger(CronJobService.name);

  constructor(
    @InjectModel(ShortUrl.name)
    private readonly shortUrlModel: Model<ShortUrlDocument>,
    private readonly redisService: RedisService,
  ) {}

  async flushShortedURLRedisAnalyticsToMongo() {
    const shortUrls = await this.shortUrlModel
      .find({ status: ShortUrlStatus.ACTIVE })
      .select('_id alias')
      .lean()
      .exec();

    let processed = 0;
    let updated = 0;
    let failed = 0;

    for (const shortUrl of shortUrls) {
      processed += 1;

      try {
        const analyticsKey = getShortUrlAnalyticsKey(shortUrl.alias);

        const analytics = await getHashFields<ShortUrlAnalyticsHash>(
          this.redisService.client,
          analyticsKey,
        );

        if (!analytics) {
          continue;
        }

        const count = parseNonNegativeInt(
          analytics.count != null ? String(analytics.count) : null,
        );

        const lastClickedAtRaw =
          typeof analytics.lastClickedAt === 'string'
            ? analytics.lastClickedAt
            : null;

        const mongoUpdate: {
          $inc?: { clicksPersisted: number };
          $set?: { lastClickedAt: Date };
        } = {};

        if (count > 0) {
          mongoUpdate.$inc = {
            clicksPersisted: count,
          };
        }

        if (lastClickedAtRaw) {
          const clickedAt = new Date(lastClickedAtRaw);

          if (!Number.isNaN(clickedAt.getTime())) {
            mongoUpdate.$set = {
              lastClickedAt: clickedAt,
            };
          }
        }

        if (!mongoUpdate.$inc && !mongoUpdate.$set) {
          continue;
        }

        await this.shortUrlModel.updateOne({ _id: shortUrl._id }, mongoUpdate);

        updated += 1;

        await setHashFields({
          client: this.redisService.client,
          key: analyticsKey,
          value: {
            count: 0,
            lastClickedAt: null,
          },
        });
      } catch (error) {
        failed += 1;
        this.logger.error(
          `Failed to flush analytics for alias=${shortUrl.alias}`,
          error instanceof Error ? error.stack : String(error),
        );
      }
    }

    this.logger.log(
      `Short URL analytics flush complete. processed=${processed}, updated=${updated}, failed=${failed}`,
    );

    return {
      processed,
      updated,
      failed,
    };
  }
}
