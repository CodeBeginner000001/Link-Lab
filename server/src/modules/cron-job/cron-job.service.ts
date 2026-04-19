import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RedisService } from 'src/common/db/redis.service';
import { QrExportType, QrStatus } from 'src/interfaces/features/qr-code.enums';
import { QrCode, QrCodeDocument } from 'src/models/qr-code.schema';
import {
  ShortUrl,
  ShortUrlDocument,
  ShortUrlStatus,
} from 'src/models/short-url.schema';
import {
  createEmptyQrExportBreakdown,
  getQrCodeAnalyticsKey,
  QR_EXPORT_TOTAL_COUNT_ANALYTICS_FIELD,
  QR_EXPORT_TYPE_TO_ANALYTICS_COUNT_FIELD,
  QR_EXPORT_TYPE_TO_COUNTER_FIELD,
} from '../features/qrCode/qrCode.constants';
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

type QrCodeAnalyticsHash = {
  [key: string]: number | string | null | undefined;
  count?: number | string;
  lastScannedAt?: string | null;
  lastExportedAt?: string | null;
  lastExportType?: string | null;
  lastCopiedAt?: string | null;
};

@Injectable()
export class CronJobService {
  private readonly logger = new Logger(CronJobService.name);

  constructor(
    @InjectModel(ShortUrl.name)
    private readonly shortUrlModel: Model<ShortUrlDocument>,
    @InjectModel(QrCode.name)
    private readonly qrCodeModel: Model<QrCodeDocument>,
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

  async flushQrCodeRedisAnalyticsToMongo() {
    const qrCodes = await this.qrCodeModel
      .find({ status: QrStatus.ACTIVE })
      .select('_id publicId')
      .lean()
      .exec();

    let processed = 0;
    let updated = 0;
    let failed = 0;

    for (const qrCode of qrCodes) {
      processed += 1;

      try {
        const analyticsKey = getQrCodeAnalyticsKey(qrCode.publicId);

        const analytics = await getHashFields<QrCodeAnalyticsHash>(
          this.redisService.client,
          analyticsKey,
        );

        if (!analytics) {
          continue;
        }

        const count = parseNonNegativeInt(
          analytics.count != null ? String(analytics.count) : null,
        );
        const exportCounts = createEmptyQrExportBreakdown();

        for (const exportType of Object.values(QrExportType)) {
          const counterField = QR_EXPORT_TYPE_TO_COUNTER_FIELD[exportType];
          const analyticsField =
            QR_EXPORT_TYPE_TO_ANALYTICS_COUNT_FIELD[exportType];

          exportCounts[counterField] = parseNonNegativeInt(
            analytics[analyticsField] != null
              ? String(analytics[analyticsField])
              : null,
          );
        }

        const totalExportCount = parseNonNegativeInt(
          analytics[QR_EXPORT_TOTAL_COUNT_ANALYTICS_FIELD] != null
            ? String(analytics[QR_EXPORT_TOTAL_COUNT_ANALYTICS_FIELD])
            : null,
        );

        const lastScannedAtRaw =
          typeof analytics.lastScannedAt === 'string'
            ? analytics.lastScannedAt
            : null;
        const lastExportedAtRaw =
          typeof analytics.lastExportedAt === 'string'
            ? analytics.lastExportedAt
            : null;
        const lastCopiedAtRaw =
          typeof analytics.lastCopiedAt === 'string'
            ? analytics.lastCopiedAt
            : null;
        const lastExportType =
          typeof analytics.lastExportType === 'string' &&
          Object.values(QrExportType).includes(
            analytics.lastExportType as QrExportType,
          )
            ? (analytics.lastExportType as QrExportType)
            : null;

        const updateQuery: {
          $inc?: Record<string, number>;
          $set?: Record<string, Date | QrExportType>;
        } = {};
        const incrementFields: Record<string, number> = {};
        let lastActivityAt: Date | null = null;

        if (count > 0) {
          incrementFields['tracking.totalScanCount'] = count;
        }

        if (totalExportCount > 0) {
          incrementFields['exports.totalCount'] = totalExportCount;
        }

        for (const exportType of Object.values(QrExportType)) {
          const counterField = QR_EXPORT_TYPE_TO_COUNTER_FIELD[exportType];
          const exportCount = exportCounts[counterField];

          if (exportCount > 0) {
            incrementFields[`exports.byType.${counterField}`] = exportCount;
          }
        }

        if (Object.keys(incrementFields).length > 0) {
          updateQuery.$inc = incrementFields;
        }

        if (lastScannedAtRaw) {
          const scannedAt = new Date(lastScannedAtRaw);

          if (!Number.isNaN(scannedAt.getTime())) {
            updateQuery.$set = {
              ...updateQuery.$set,
              'tracking.lastScannedAt': scannedAt,
            };
            lastActivityAt = scannedAt;
          }
        }

        if (lastExportedAtRaw) {
          const exportedAt = new Date(lastExportedAtRaw);

          if (!Number.isNaN(exportedAt.getTime())) {
            updateQuery.$set = {
              ...updateQuery.$set,
              'exports.lastExportedAt': exportedAt,
            };
            if (
              !lastActivityAt ||
              exportedAt.getTime() > lastActivityAt.getTime()
            ) {
              lastActivityAt = exportedAt;
            }
          }
        }

        if (lastExportType) {
          updateQuery.$set = {
            ...updateQuery.$set,
            'exports.lastExportType': lastExportType,
          };
        }

        if (lastCopiedAtRaw) {
          const copiedAt = new Date(lastCopiedAtRaw);

          if (!Number.isNaN(copiedAt.getTime())) {
            updateQuery.$set = {
              ...updateQuery.$set,
              'exports.lastCopiedAt': copiedAt,
            };
          }
        }

        if (lastActivityAt) {
          updateQuery.$set = {
            ...updateQuery.$set,
            lastActivityAt,
          };
        }

        if (!updateQuery.$inc && !updateQuery.$set) {
          continue;
        }

        const result = await this.qrCodeModel.updateOne(
          { _id: qrCode._id },
          updateQuery,
        );

        if (result.matchedCount > 0) {
          updated += 1;
        }

        await setHashFields({
          client: this.redisService.client,
          key: analyticsKey,
          value: {
            count: 0,
            lastScannedAt: null,
            [QR_EXPORT_TOTAL_COUNT_ANALYTICS_FIELD]: 0,
            ...Object.fromEntries(
              Object.values(QrExportType).map((exportType) => [
                QR_EXPORT_TYPE_TO_ANALYTICS_COUNT_FIELD[exportType],
                0,
              ]),
            ),
            lastExportedAt: null,
            lastExportType: null,
            lastCopiedAt: null,
          },
        });
      } catch (error) {
        failed += 1;
        this.logger.error(
          `Failed to flush analytics for QR publicId=${qrCode.publicId}`,
          error instanceof Error ? error.stack : String(error),
        );
      }
    }

    this.logger.log(
      `QR code analytics flush complete. processed=${processed}, updated=${updated}, failed=${failed}`,
    );

    return {
      processed,
      updated,
      failed,
    };
  }
}
