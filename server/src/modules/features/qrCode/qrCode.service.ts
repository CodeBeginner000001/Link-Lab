import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { isEmail } from 'class-validator';
import { createHash } from 'crypto';
import { Model } from 'mongoose';
import { RedisService } from 'src/common/db/redis.service';
import { AccessTokenExpired } from 'src/exceptions/auth.exception';
import {
  QrCodeDuplicateRequestException,
  InvalidQrCodeContentException,
  QrCodeAccessDeniedException,
  QrCodeCopyCooldownException,
  QrCodeExportUnavailableException,
  QrCodeNotFoundException,
  QrCodePublicIdGenerationFailedException,
} from 'src/exceptions/qr-code.exception';
import { JwtPayload } from 'src/interfaces/auth.interface';
import {
  QrContentType,
  QrExportType,
  QrStatus,
  QrTraceability,
} from 'src/interfaces/features/qr-code.enums';
import type {
  AnalyticsCountByBodyStyle,
  AnalyticsCountByContentType,
  QrCopyAvailability,
  QrDashboardAnalyticsSummary,
  QrDashboardItem,
  QrDashboardLatestSavedRecord,
  QrDashboardMostEngagedRecord,
  QrDashboardOverview,
  QrDashboardSummary,
  SerializedQrCode,
} from 'src/interfaces/features/qr-code.types';
import { QrCode, QrCodeDocument } from 'src/models/qr-code.schema';
import { User, UserDocument } from 'src/models/user.schema';
import { decrypt, encrypt } from 'src/utils/auth.utils';
import {
  deleteCacheKeys,
  getHashFields,
  getJsonCache,
  incrementHashField,
  setHashFields,
  warmJsonCache,
} from '../utils/redis-helper.utils';
import {
  generatePublicId,
  isDuplicateKeyError,
  normalizeHttpUrl,
  parseNonNegativeInt,
  toObjectId,
} from '../utils/common.utils';
import { CreateQrCodeDto } from './dto/create-qr-code.dto';
import { ExportQrCodeDto } from './dto/export-qr-code.dto';
import { GetQrDashboardOverviewDto } from './dto/get-qr-dashboard-overview.dto';
import { buildQrExportPayload, QrExportPayload } from './qrCode-renderer.utils';
import {
  createEmptyQrExportBreakdown,
  DEFAULT_QR_DASHBOARD_LIMIT,
  QR_COPY_COOLDOWN_MS,
  QR_COPY_COOLDOWN_SECONDS,
  QR_DASHBOARD_LATEST_SAVED_RECORDS_LIMIT,
  QR_EXPORT_TOTAL_COUNT_ANALYTICS_FIELD,
  QR_EXPORT_TYPE_TO_ANALYTICS_COUNT_FIELD,
  QR_EXPORT_TYPE_TO_COUNTER_FIELD,
  getQrCodeAnalyticsKey,
  getQrCodeLookupKey,
  QR_PUBLIC_ID_GENERATION_ATTEMPTS,
  QR_WIFI_PREFIX_REGEX,
} from './qrCode.constants';

const QR_ENCRYPTED_VALUE_PREFIX = 'enc:';

type QrCodeCacheEntry = {
  publicId: string;
  targetUrl: string;
};

type QrCodeAnalytics = {
  [key: string]: number | string | null | undefined;
  count?: number | string;
  lastScannedAt?: string | null;
  lastExportedAt?: string | null;
  lastExportType?: string | null;
  lastCopiedAt?: string | null;
};

type PendingQrExportAnalytics = {
  totalCount: number;
  byType: ReturnType<typeof createEmptyQrExportBreakdown>;
  lastExportedAt: string | null;
  lastExportType: QrExportType | null;
  lastCopiedAt: string | null;
};

type ResolvedQrCodeAnalytics = {
  count: number;
  lastScannedAt: string | null;
  exports: PendingQrExportAnalytics;
};

@Injectable()
export class QrCodeService {
  constructor(
    @InjectModel(QrCode.name)
    private readonly qrCodeModel: Model<QrCodeDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
  ) {}

  async createQrCode(user: JwtPayload, dto: CreateQrCodeDto) {
    const userId = await this.getAuthenticatedUserId(user);
    const normalizeContent = (
      contentType: QrContentType,
      content: string,
    ): string => {
      const trimmed = content.trim();

      if (!trimmed) {
        throw new InvalidQrCodeContentException('content: Content is required');
      }

      switch (contentType) {
        case QrContentType.URL:
          return normalizeHttpUrl({
            value: trimmed,
            fieldName: 'content',
          });
        case QrContentType.TEXT:
          return trimmed;
        case QrContentType.EMAIL: {
          const normalizedEmail = trimmed.toLowerCase();

          if (!isEmail(normalizedEmail)) {
            throw new InvalidQrCodeContentException(
              'content: Email content must be a valid email address',
            );
          }

          return normalizedEmail;
        }
        case QrContentType.WIFI:
          if (!QR_WIFI_PREFIX_REGEX.test(trimmed)) {
            throw new InvalidQrCodeContentException(
              'content: Wi-Fi content must start with WIFI:',
            );
          }

          return trimmed.replace(/^wifi:/i, 'WIFI:');
      }
    };
    const requestBodyHash = createHash('sha256')
      .update(JSON.stringify(dto))
      .digest('hex');
    const existingQrCode = await this.qrCodeModel
      .exists({
        userId: String(userId),
        requestBodyHash,
        status: QrStatus.ACTIVE,
      })
      .exec();

    if (existingQrCode) {
      throw new QrCodeDuplicateRequestException();
    }

    const content = normalizeContent(dto.contentType, dto.content);

    for (let i = 0; i < QR_PUBLIC_ID_GENERATION_ATTEMPTS; i += 1) {
      const publicId = generatePublicId();
      const isTraceable =
        dto.contentType === QrContentType.URL ||
        dto.contentType === QrContentType.EMAIL;
      const qrValue = isTraceable
        ? `${this.configService
            .getOrThrow<string>('BACKEND_URL')
            .replace(/\/+$/, '')
            .replace(/\/v1$/, '')}/q/${publicId}`
        : dto.contentType === QrContentType.EMAIL
          ? `mailto:${content}`
          : content;
      const encryptionSecret =
        this.configService.get<string>('QR_CONTENT_ENCRYPTION_SECRET') ??
        this.configService.getOrThrow<string>('JWT_ACCESS_SECRET');
      const storedContent =
        dto.contentType === QrContentType.WIFI
          ? `${QR_ENCRYPTED_VALUE_PREFIX}${encrypt(content, encryptionSecret)}`
          : content;
      const storedQrValue =
        dto.contentType === QrContentType.WIFI
          ? `${QR_ENCRYPTED_VALUE_PREFIX}${encrypt(qrValue, encryptionSecret)}`
          : qrValue;

      let traceabilityReason: string;

      if (isTraceable) {
        traceabilityReason =
          dto.contentType === QrContentType.URL
            ? 'URL QR codes resolve through backend before redirecting to the destination.'
            : 'Email QR codes resolve through backend before redirecting to the mail client.';
      } else {
        switch (dto.contentType) {
          case QrContentType.URL:
            traceabilityReason =
              'Direct URL QR codes do not pass through backend, so scan tracking is unavailable.';
            break;
          case QrContentType.TEXT:
            traceabilityReason =
              'Plain text QR codes are encoded directly and cannot be tracked.';
            break;
          case QrContentType.EMAIL:
            traceabilityReason =
              'Email QR codes are encoded directly and cannot be tracked.';
            break;
          case QrContentType.WIFI:
            traceabilityReason =
              'Wi-Fi QR codes are encoded directly and cannot be tracked.';
            break;
        }
      }

      const tracking = {
        isTraceable,
        traceability: isTraceable
          ? QrTraceability.TRACEABLE
          : QrTraceability.NON_TRACEABLE,
        traceabilityReason,
        passesThroughBackend: isTraceable,
        totalScanCount: 0,
        lastScannedAt: null,
      };

      try {
        const qrCode = await this.qrCodeModel.create({
          publicId,
          userId: String(userId),
          requestBodyHash,
          contentMeta: {
            type: dto.contentType,
          },
          content: storedContent,
          style: {
            bodyShape: dto.style.bodyShape,
            eyeFrameShape: dto.style.eyeFrameShape,
            eyeBallShape: dto.style.eyeBallShape,
            zoom: dto.style.zoom,
            foreground: dto.style.foreground,
            background: dto.style.background,
          },
          generated: {
            qrValue: storedQrValue,
          },
          exports: {
            totalCount: 0,
            byType: createEmptyQrExportBreakdown(),
            lastExportedAt: null,
            lastExportType: null as QrExportType | null,
            lastCopiedAt: null,
          },
          tracking,
          status: QrStatus.ACTIVE,
          deletedAt: null,
          lastActivityAt: null,
        });

        if (qrCode.tracking.isTraceable) {
          await this.warmCache(qrCode);
          await setHashFields({
            client: this.redisService.client,
            key: getQrCodeAnalyticsKey(qrCode.publicId),
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
        }

        return {
          message: 'QR code created successfully',
          qrCode: this.serializeQrCode(qrCode),
        };
      } catch (error) {
        if (isDuplicateKeyError(error)) {
          continue;
        }

        throw error;
      }
    }

    throw new QrCodePublicIdGenerationFailedException();
  }

  async exportQrCode(
    user: JwtPayload,
    publicId: string,
    dto: ExportQrCodeDto,
  ): Promise<QrExportPayload> {
    const userId = await this.getAuthenticatedUserId(user);
    const qrCode = await this.qrCodeModel
      .findOne({
        publicId,
        userId,
        status: QrStatus.ACTIVE,
      })
      .exec();

    if (!qrCode) {
      throw new QrCodeNotFoundException();
    }

    const qrValue = this.readProtectedQrValue(
      qrCode.contentMeta.type,
      qrCode.generated.qrValue,
    );

    if (!qrValue) {
      throw new QrCodeExportUnavailableException(
        'QR code has no generated value to export',
      );
    }

    const analytics = await this.getAnalytics(qrCode.publicId);

    if (dto.exportType === QrExportType.COPY) {
      const now = new Date();
      const copyAvailability = this.getCopyAvailability(qrCode, analytics, now);

      if (!copyAvailability.isAvailable && copyAvailability.nextAvailableAt) {
        throw new QrCodeCopyCooldownException();
      }

      await this.recordExport(
        qrCode.publicId,
        dto.exportType,
        now.toISOString(),
      );

      return {
        kind: 'json',
        body: {
          content: qrValue,
          copiedAt: now.toISOString(),
          nextCopyAvailableAt: new Date(
            now.getTime() + QR_COPY_COOLDOWN_MS,
          ).toISOString(),
          cooldownSeconds: QR_COPY_COOLDOWN_SECONDS,
          remainingSeconds: QR_COPY_COOLDOWN_SECONDS,
          isCopyAvailable: false,
        },
      };
    }

    const now = new Date();
    const exported = await buildQrExportPayload({
      publicId: qrCode.publicId,
      exportType: dto.exportType,
      qrValue,
      style: qrCode.style,
      render: dto.render,
    });

    await this.recordExport(qrCode.publicId, dto.exportType, now.toISOString());

    return exported;
  }

  async deleteQrCode(user: JwtPayload, qrCodeId: string) {
    const userId = await this.getAuthenticatedUserId(user);
    const objectId = toObjectId(qrCodeId, 'QR code id is invalid');
    const qrCode = await this.qrCodeModel.findById(objectId).exec();

    if (!qrCode || qrCode.status !== QrStatus.ACTIVE) {
      throw new QrCodeNotFoundException();
    }

    if (qrCode.userId !== userId) {
      throw new QrCodeAccessDeniedException();
    }

    const analytics = await this.getAnalytics(qrCode.publicId);
    const deletedAt = new Date();
    const lastScannedAt = this.parseRedisDate(analytics.lastScannedAt);
    const mergedExports = this.getMergedExportStats(qrCode, analytics);

    qrCode.tracking.totalScanCount += analytics.count;

    if (lastScannedAt) {
      qrCode.tracking.lastScannedAt = lastScannedAt;
    }

    qrCode.exports.totalCount = mergedExports.totalCount;
    qrCode.exports.byType.png = mergedExports.byType.png;
    qrCode.exports.byType.jpg = mergedExports.byType.jpg;
    qrCode.exports.byType.jpeg = mergedExports.byType.jpeg;
    qrCode.exports.byType.svg = mergedExports.byType.svg;
    qrCode.exports.byType.webp = mergedExports.byType.webp;
    qrCode.exports.byType.pdf = mergedExports.byType.pdf;
    qrCode.exports.byType.copy = mergedExports.byType.copy;
    qrCode.exports.lastExportedAt = mergedExports.lastExportedAt;
    qrCode.exports.lastExportType = mergedExports.lastExportType;
    qrCode.exports.lastCopiedAt = mergedExports.lastCopiedAt;

    qrCode.status = QrStatus.DELETED;
    qrCode.deletedAt = deletedAt;
    qrCode.lastActivityAt = deletedAt;

    await qrCode.save();
    await deleteCacheKeys(
      this.redisService.client,
      getQrCodeLookupKey(qrCode.publicId),
      getQrCodeAnalyticsKey(qrCode.publicId),
    );

    return {
      message: 'QR code deleted successfully',
      deleted: true,
      qrCode: this.serializeQrCode(qrCode),
    };
  }

  async getQrCodeDetail(user: JwtPayload, publicId: string) {
    const userId = await this.getAuthenticatedUserId(user);
    const qrCode = await this.qrCodeModel
      .findOne({
        publicId,
        userId,
        status: QrStatus.ACTIVE,
      })
      .exec();

    if (!qrCode) {
      throw new QrCodeNotFoundException();
    }

    const analytics = await this.getAnalytics(qrCode.publicId);

    return {
      qrCode: this.serializeQrCode(qrCode, analytics),
    };
  }

  async getDashboardOverview(
    user: JwtPayload,
    query: GetQrDashboardOverviewDto,
  ): Promise<QrDashboardOverview> {
    const userId = await this.getAuthenticatedUserId(user);
    const limit = query.limit ?? DEFAULT_QR_DASHBOARD_LIMIT;
    const analyticsMatch: Record<string, unknown> = {
      userId,
      status: QrStatus.ACTIVE,
    };
    const filteredMatch: Record<string, unknown> = {};

    if (query.type) {
      filteredMatch['contentMeta.type'] = query.type;
    }

    if (query.bodyShape) {
      filteredMatch['style.bodyShape'] = query.bodyShape;
    }

    const search = query.search?.trim();
    let searchRegex: RegExp | null = null;

    if (search) {
      searchRegex = new RegExp(
        search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        'i',
      );

      filteredMatch.$or = [{ publicId: searchRegex }, { content: searchRegex }];
    }

    let cursorMatch: Record<string, unknown> | null = null;

    if (query.cursor) {
      const separatorIndex = query.cursor.indexOf('__');

      if (separatorIndex <= 0) {
        throw new BadRequestException({
          message: 'cursor: Cursor is invalid',
          error: 'Bad Request',
        });
      }

      const createdAtValue = query.cursor.slice(0, separatorIndex);
      const publicId = query.cursor.slice(separatorIndex + 2).trim();
      const createdAt = new Date(createdAtValue);

      if (!publicId || Number.isNaN(createdAt.getTime())) {
        throw new BadRequestException({
          message: 'cursor: Cursor is invalid',
          error: 'Bad Request',
        });
      }

      cursorMatch = {
        $or: [
          {
            createdAt: { $lt: createdAt },
          },
          {
            createdAt,
            publicId: { $lt: publicId },
          },
        ],
      };
    }

    const filteredMatchStages =
      Object.keys(filteredMatch).length > 0 ? [{ $match: filteredMatch }] : [];
    const cursorMatchStages = cursorMatch ? [{ $match: cursorMatch }] : [];
    const serializeDashboardItem = (
      qrCode: QrCodeDocument,
      analytics?: ResolvedQrCodeAnalytics,
    ): QrDashboardItem => {
      const content =
        this.readProtectedQrValue(qrCode.contentMeta.type, qrCode.content) ??
        qrCode.content;
      const exports = this.getMergedExportStats(qrCode, analytics);

      return {
        publicId: qrCode.publicId,
        contentType: qrCode.contentMeta.type,
        content,
        createdAt: qrCode.createdAt ?? null,
        activity: {
          totalScanCount: this.getTotalScanCount(qrCode, analytics),
          totalExportCount: exports.totalCount,
          lastScannedAt: this.getLastScannedAt(qrCode, analytics),
          lastExportedAt: exports.lastExportedAt,
        },
        style: qrCode.style,
        exportsByType: {
          png: exports.byType.png,
          jpg: exports.byType.jpg,
          jpeg: exports.byType.jpeg,
          svg: exports.byType.svg,
          webp: exports.byType.webp,
          pdf: exports.byType.pdf,
          copy: exports.byType.copy,
        },
        copyAvailability: this.getCopyAvailability(qrCode, analytics),
        tracking: {
          isTraceable: qrCode.tracking.isTraceable,
          totalScanCount: this.getTotalScanCount(qrCode, analytics),
        },
      };
    };
    const serializeLatestSavedRecord = (
      qrCode: QrCodeDocument,
    ): QrDashboardLatestSavedRecord => {
      const content =
        this.readProtectedQrValue(qrCode.contentMeta.type, qrCode.content) ??
        qrCode.content;

      return {
        content,
        contentType: qrCode.contentMeta.type,
        bodyShape: qrCode.style.bodyShape,
        eyeFrameShape: qrCode.style.eyeFrameShape,
        eyeBallShape: qrCode.style.eyeBallShape,
        zoom: qrCode.style.zoom,
        createdAt: qrCode.createdAt ?? null,
      };
    };
    const getAnalyticsMap = async (
      publicIds: string[],
    ): Promise<Map<string, ResolvedQrCodeAnalytics>> => {
      const uniquePublicIds = [...new Set(publicIds)];
      const analyticsEntries = await Promise.all(
        uniquePublicIds.map(
          async (id) => [id, await this.getAnalytics(id)] as const,
        ),
      );

      return new Map(analyticsEntries);
    };
    const matchesDashboardFilters = (
      qrCode: Pick<
        QrCodeDocument,
        'publicId' | 'content' | 'contentMeta' | 'style'
      >,
    ): boolean => {
      if (query.type && qrCode.contentMeta.type !== query.type) {
        return false;
      }

      if (query.bodyShape && qrCode.style.bodyShape !== query.bodyShape) {
        return false;
      }

      if (
        searchRegex &&
        !searchRegex.test(qrCode.publicId) &&
        !searchRegex.test(qrCode.content)
      ) {
        return false;
      }

      return true;
    };
    const selectMostEngagedRecord = (
      allQrCodes: QrCodeDocument[],
      analyticsMap: Map<string, ResolvedQrCodeAnalytics>,
    ): QrDashboardMostEngagedRecord | null => {
      let bestQrCode: QrCodeDocument | null = null;
      let bestAnalytics: ResolvedQrCodeAnalytics | undefined;

      for (const qrCode of allQrCodes) {
        const analytics = analyticsMap.get(qrCode.publicId);

        if (!bestQrCode) {
          bestQrCode = qrCode;
          bestAnalytics = analytics;
          continue;
        }

        const currentScanCount = this.getTotalScanCount(qrCode, analytics);
        const currentEngagementCount =
          currentScanCount + this.getTotalExportCount(qrCode, analytics);
        const bestScanCount = this.getTotalScanCount(bestQrCode, bestAnalytics);
        const bestEngagementCount =
          bestScanCount + this.getTotalExportCount(bestQrCode, bestAnalytics);

        if (currentEngagementCount !== bestEngagementCount) {
          if (currentEngagementCount > bestEngagementCount) {
            bestQrCode = qrCode;
            bestAnalytics = analytics;
          }
          continue;
        }

        if (currentScanCount !== bestScanCount) {
          if (currentScanCount > bestScanCount) {
            bestQrCode = qrCode;
            bestAnalytics = analytics;
          }
          continue;
        }

        const currentExportCount = this.getTotalExportCount(qrCode, analytics);
        const bestExportCount = this.getTotalExportCount(
          bestQrCode,
          bestAnalytics,
        );

        if (currentExportCount !== bestExportCount) {
          if (currentExportCount > bestExportCount) {
            bestQrCode = qrCode;
            bestAnalytics = analytics;
          }
          continue;
        }

        const currentCreatedAt = qrCode.createdAt?.getTime() ?? 0;
        const bestCreatedAt = bestQrCode.createdAt?.getTime() ?? 0;

        if (currentCreatedAt !== bestCreatedAt) {
          if (currentCreatedAt > bestCreatedAt) {
            bestQrCode = qrCode;
            bestAnalytics = analytics;
          }
          continue;
        }

        if (qrCode.publicId > bestQrCode.publicId) {
          bestQrCode = qrCode;
          bestAnalytics = analytics;
        }
      }

      if (!bestQrCode) {
        return null;
      }

      const content =
        this.readProtectedQrValue(
          bestQrCode.contentMeta.type,
          bestQrCode.content,
        ) ?? bestQrCode.content;

      return {
        content,
        contentType: bestQrCode.contentMeta.type,
        totalScanCount: this.getTotalScanCount(bestQrCode, bestAnalytics),
        totalExportCount: this.getTotalExportCount(bestQrCode, bestAnalytics),
        createdAt: bestQrCode.createdAt ?? null,
      };
    };
    const [dashboardAggregationResult, allActiveQrCodes] = await Promise.all([
      this.qrCodeModel
        .aggregate<{
          summary: QrDashboardSummary[];
          analyticsSummary: QrDashboardSummary[];
          contentTypeCounts: AnalyticsCountByContentType[];
          bodyStyleCounts: AnalyticsCountByBodyStyle[];
          qrCodes: QrCodeDocument[];
          mostEngagedRecord: QrCodeDocument[];
          latestSavedRecords: QrCodeDocument[];
        }>([
          { $match: analyticsMatch },
          {
            $facet: {
              summary: [
                ...filteredMatchStages,
                {
                  $group: {
                    _id: null,
                    totalQrCount: { $sum: 1 },
                    totalScanCount: { $sum: '$tracking.totalScanCount' },
                    totalExportCount: { $sum: '$exports.totalCount' },
                  },
                },
                {
                  $project: {
                    _id: 0,
                    totalQrCount: 1,
                    totalScanCount: 1,
                    totalExportCount: 1,
                  },
                },
              ],
              analyticsSummary: [
                {
                  $group: {
                    _id: null,
                    totalQrCount: { $sum: 1 },
                    totalScanCount: { $sum: '$tracking.totalScanCount' },
                    totalExportCount: { $sum: '$exports.totalCount' },
                  },
                },
                {
                  $project: {
                    _id: 0,
                    totalQrCount: 1,
                    totalScanCount: 1,
                    totalExportCount: 1,
                  },
                },
              ],
              contentTypeCounts: [
                {
                  $group: {
                    _id: '$contentMeta.type',
                    count: { $sum: 1 },
                  },
                },
                {
                  $project: {
                    _id: 0,
                    type: '$_id',
                    count: 1,
                  },
                },
                {
                  $sort: {
                    count: -1,
                    type: 1,
                  },
                },
              ],
              bodyStyleCounts: [
                {
                  $group: {
                    _id: '$style.bodyShape',
                    count: { $sum: 1 },
                  },
                },
                {
                  $project: {
                    _id: 0,
                    bodyShape: '$_id',
                    count: 1,
                  },
                },
                {
                  $sort: {
                    count: -1,
                    bodyShape: 1,
                  },
                },
              ],
              qrCodes: [
                ...filteredMatchStages,
                ...cursorMatchStages,
                {
                  $sort: {
                    createdAt: -1,
                    publicId: -1,
                  },
                },
                {
                  $limit: limit + 1,
                },
              ],
              mostEngagedRecord: [
                {
                  $addFields: {
                    totalEngagementCount: {
                      $add: ['$tracking.totalScanCount', '$exports.totalCount'],
                    },
                  },
                },
                {
                  $sort: {
                    totalEngagementCount: -1,
                    'tracking.totalScanCount': -1,
                    'exports.totalCount': -1,
                    createdAt: -1,
                    publicId: -1,
                  },
                },
                {
                  $limit: 1,
                },
                {
                  $project: {
                    totalEngagementCount: 0,
                  },
                },
              ],
              latestSavedRecords: [
                {
                  $sort: {
                    createdAt: -1,
                    publicId: -1,
                  },
                },
                {
                  $limit: QR_DASHBOARD_LATEST_SAVED_RECORDS_LIMIT,
                },
              ],
            },
          },
        ])
        .exec(),
      this.qrCodeModel
        .find(analyticsMatch)
        .select(
          'publicId content contentMeta.type style.bodyShape tracking.isTraceable tracking.totalScanCount tracking.lastScannedAt exports.totalCount exports.byType exports.lastExportedAt exports.lastExportType exports.lastCopiedAt createdAt',
        )
        .exec(),
    ]);
    const [dashboardAggregation] = dashboardAggregationResult;
    const {
      summary: summaryResult = [],
      analyticsSummary: analyticsSummaryResult = [],
      contentTypeCounts = [],
      bodyStyleCounts = [],
      qrCodes = [],
      latestSavedRecords: latestSavedRecordDocs = [],
    } = dashboardAggregation ?? {};

    const activePublicIds = allActiveQrCodes.map((qrCode) => qrCode.publicId);
    const analyticsMap = await getAnalyticsMap(activePublicIds);
    const filteredQrCodesForSummary =
      query.type || query.bodyShape || searchRegex
        ? allActiveQrCodes.filter((qrCode) => matchesDashboardFilters(qrCode))
        : allActiveQrCodes;

    const summaryBase = summaryResult[0] ?? {
      totalQrCount: 0,
      totalScanCount: 0,
      totalExportCount: 0,
    };
    const analyticsSummaryBase = analyticsSummaryResult[0] ?? {
      totalQrCount: 0,
      totalScanCount: 0,
      totalExportCount: 0,
    };
    const summary = {
      ...summaryBase,
      totalScanCount:
        summaryBase.totalScanCount +
        this.sumPendingScanCount(
          filteredQrCodesForSummary.map((qrCode) => qrCode.publicId),
          analyticsMap,
        ),
      totalExportCount:
        summaryBase.totalExportCount +
        this.sumPendingExportCount(
          filteredQrCodesForSummary.map((qrCode) => qrCode.publicId),
          analyticsMap,
        ),
    };
    const topContentType = contentTypeCounts[0]
      ? {
          value: contentTypeCounts[0].type,
          count: contentTypeCounts[0].count,
        }
      : null;
    const topBodyStyle = bodyStyleCounts[0]
      ? {
          value: bodyStyleCounts[0].bodyShape,
          count: bodyStyleCounts[0].count,
        }
      : null;
    const analyticsSummary: QrDashboardAnalyticsSummary = {
      totalQrCount: analyticsSummaryBase.totalQrCount,
      totalScanCount:
        analyticsSummaryBase.totalScanCount +
        this.sumPendingScanCount(
          allActiveQrCodes.map((qrCode) => qrCode.publicId),
          analyticsMap,
        ),
      totalExportCount:
        analyticsSummaryBase.totalExportCount +
        this.sumPendingExportCount(
          allActiveQrCodes.map((qrCode) => qrCode.publicId),
          analyticsMap,
        ),
      topBodyStyle,
      topContentType,
      contentTypeCounts,
      bodyStyleCounts,
    };
    const mostEngagedRecord =
      selectMostEngagedRecord(allActiveQrCodes, analyticsMap) ?? null;
    const latestSavedRecords = latestSavedRecordDocs.map((qrCode) =>
      serializeLatestSavedRecord(qrCode),
    );

    const hasNextPage = qrCodes.length > limit;
    const pageItems = hasNextPage ? qrCodes.slice(0, limit) : qrCodes;
    const items = pageItems.map((qrCode) =>
      serializeDashboardItem(qrCode, analyticsMap.get(qrCode.publicId)),
    );
    const nextCursor =
      hasNextPage && pageItems.length > 0
        ? (() => {
            const lastQrCode = pageItems[pageItems.length - 1];

            if (!lastQrCode.createdAt) {
              throw new BadRequestException({
                message: 'cursor: Cursor could not be generated',
                error: 'Bad Request',
              });
            }

            return `${lastQrCode.createdAt.toISOString()}__${lastQrCode.publicId}`;
          })()
        : null;

    return {
      summary,
      analyticsSummary,
      mostEngagedRecord,
      latestSavedRecords,
      items,
      pageInfo: {
        nextCursor,
        hasNextPage,
        limit,
      },
    };
  }

  async resolveQrCode(publicId: string): Promise<string> {
    const getCachedQrCode = async (): Promise<QrCodeCacheEntry | null> => {
      const cached = await getJsonCache<Partial<QrCodeCacheEntry>>(
        this.redisService.client,
        getQrCodeLookupKey(publicId),
      );

      if (
        !cached ||
        cached.publicId !== publicId ||
        typeof cached.targetUrl !== 'string'
      ) {
        return null;
      }

      return {
        publicId,
        targetUrl: cached.targetUrl,
      };
    };
    const cached = await getCachedQrCode();
    const scannedAt = new Date().toISOString();

    if (cached) {
      await this.recordScan(publicId, scannedAt);
      return cached.targetUrl;
    }

    const qrCode = await this.qrCodeModel
      .findOne({
        publicId,
        status: QrStatus.ACTIVE,
        'tracking.isTraceable': true,
      })
      .exec();

    if (!qrCode) {
      throw new QrCodeNotFoundException();
    }

    const targetUrl = this.buildTraceableTargetUrl(qrCode);

    if (!targetUrl) {
      throw new QrCodeNotFoundException();
    }

    await this.warmCache(qrCode);
    await this.recordScan(publicId, scannedAt);

    return targetUrl;
  }

  private async getAuthenticatedUserId(user: JwtPayload): Promise<string> {
    const userId = toObjectId(user.sub, 'Authenticated user id is invalid');
    const userExists = await this.userModel.exists({ _id: userId });

    if (!userExists) {
      throw new AccessTokenExpired();
    }

    return String(userId);
  }

  private readProtectedQrValue(
    contentType: QrContentType,
    value: string | null,
  ): string | null {
    if (value === null || contentType !== QrContentType.WIFI) {
      return value;
    }

    if (!value.startsWith(QR_ENCRYPTED_VALUE_PREFIX)) {
      return value;
    }

    return decrypt(
      value.slice(QR_ENCRYPTED_VALUE_PREFIX.length),
      this.configService.get<string>('QR_CONTENT_ENCRYPTION_SECRET') ??
        this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
    );
  }

  private readQrContent(qrCode: QrCodeDocument): string {
    return (
      this.readProtectedQrValue(qrCode.contentMeta.type, qrCode.content) ??
      qrCode.content
    );
  }

  private serializeQrCode(
    qrCode: QrCodeDocument,
    analytics?: ResolvedQrCodeAnalytics,
  ): SerializedQrCode {
    const totalScanCount = this.getTotalScanCount(qrCode, analytics);
    const lastScannedAt = this.getLastScannedAt(qrCode, analytics);
    const exports = this.getMergedExportStats(qrCode, analytics);
    const lastActivityAt =
      this.parseRedisDate(analytics?.lastScannedAt) ??
      exports.lastExportedAt ??
      qrCode.lastActivityAt ??
      null;

    return {
      id: String(qrCode._id),
      publicId: qrCode.publicId,
      userId: qrCode.userId,
      contentType: qrCode.contentMeta.type,
      contentMeta: {
        type: qrCode.contentMeta.type,
      },
      content: this.readQrContent(qrCode),
      style: qrCode.style,
      generated: {
        qrValue: this.readProtectedQrValue(
          qrCode.contentMeta.type,
          qrCode.generated.qrValue,
        ),
      },
      exports,
      copyAvailability: this.getCopyAvailability(qrCode, analytics),
      tracking: {
        ...qrCode.tracking,
        totalScanCount,
        lastScannedAt,
      },
      status: qrCode.status,
      deletedAt: qrCode.deletedAt,
      lastActivityAt,
      createdAt: qrCode.createdAt ?? null,
      updatedAt: qrCode.updatedAt ?? null,
    };
  }

  private getCopyAvailability(
    qrCode: Pick<QrCodeDocument, 'exports'>,
    analytics?: ResolvedQrCodeAnalytics,
    now = new Date(),
  ): QrCopyAvailability {
    const lastCopiedAt = this.getMergedExportStats(
      qrCode,
      analytics,
    ).lastCopiedAt;

    if (!lastCopiedAt) {
      return {
        isAvailable: true,
        cooldownSeconds: QR_COPY_COOLDOWN_SECONDS,
        remainingSeconds: 0,
        lastCopiedAt: null,
        nextAvailableAt: null,
      };
    }

    const nextAvailableAt = new Date(
      lastCopiedAt.getTime() + QR_COPY_COOLDOWN_MS,
    );
    const remainingSeconds = Math.max(
      0,
      Math.ceil((nextAvailableAt.getTime() - now.getTime()) / 1000),
    );

    return {
      isAvailable: remainingSeconds === 0,
      cooldownSeconds: QR_COPY_COOLDOWN_SECONDS,
      remainingSeconds,
      lastCopiedAt,
      nextAvailableAt: remainingSeconds === 0 ? null : nextAvailableAt,
    };
  }

  private buildTraceableTargetUrl(qrCode: QrCodeDocument): string | null {
    const content = this.readQrContent(qrCode);

    switch (qrCode.contentMeta.type) {
      case QrContentType.URL:
        return content;
      case QrContentType.EMAIL:
        return `mailto:${content}`;
      case QrContentType.TEXT:
      case QrContentType.WIFI:
        return null;
    }
  }

  private async warmCache(qrCode: QrCodeDocument): Promise<void> {
    const targetUrl = this.buildTraceableTargetUrl(qrCode);

    if (!targetUrl) {
      return;
    }

    await warmJsonCache({
      client: this.redisService.client,
      key: getQrCodeLookupKey(qrCode.publicId),
      value: {
        publicId: qrCode.publicId,
        targetUrl,
      } satisfies QrCodeCacheEntry,
    });
  }

  private async getAnalytics(
    publicId: string,
  ): Promise<ResolvedQrCodeAnalytics> {
    const analytics = await getHashFields<QrCodeAnalytics>(
      this.redisService.client,
      getQrCodeAnalyticsKey(publicId),
    );
    const exportsByType = createEmptyQrExportBreakdown();

    for (const exportType of Object.values(QrExportType)) {
      const counterField = QR_EXPORT_TYPE_TO_COUNTER_FIELD[exportType];
      const analyticsField =
        QR_EXPORT_TYPE_TO_ANALYTICS_COUNT_FIELD[exportType];

      exportsByType[counterField] = parseNonNegativeInt(
        analytics?.[analyticsField] != null
          ? String(analytics[analyticsField])
          : null,
      );
    }

    const count = parseNonNegativeInt(
      analytics?.count !== undefined && analytics?.count !== null
        ? String(analytics.count)
        : null,
    );

    const lastScannedAt =
      typeof analytics?.lastScannedAt === 'string'
        ? analytics.lastScannedAt
        : null;
    const lastExportedAt =
      typeof analytics?.lastExportedAt === 'string'
        ? analytics.lastExportedAt
        : null;
    const lastCopiedAt =
      typeof analytics?.lastCopiedAt === 'string'
        ? analytics.lastCopiedAt
        : null;
    const lastExportType =
      typeof analytics?.lastExportType === 'string' &&
      Object.values(QrExportType).includes(
        analytics.lastExportType as QrExportType,
      )
        ? (analytics.lastExportType as QrExportType)
        : null;

    return {
      count,
      lastScannedAt,
      exports: {
        totalCount: parseNonNegativeInt(
          analytics?.[QR_EXPORT_TOTAL_COUNT_ANALYTICS_FIELD] != null
            ? String(analytics[QR_EXPORT_TOTAL_COUNT_ANALYTICS_FIELD])
            : null,
        ),
        byType: exportsByType,
        lastExportedAt,
        lastExportType,
        lastCopiedAt,
      },
    };
  }

  private async recordScan(publicId: string, scannedAt: string): Promise<void> {
    await incrementHashField({
      client: this.redisService.client,
      key: getQrCodeAnalyticsKey(publicId),
      field: 'count',
      by: 1,
    });

    await setHashFields({
      client: this.redisService.client,
      key: getQrCodeAnalyticsKey(publicId),
      value: {
        lastScannedAt: scannedAt,
      },
    });
  }

  private async recordExport(
    publicId: string,
    exportType: QrExportType,
    exportedAt: string,
  ): Promise<void> {
    const analyticsKey = getQrCodeAnalyticsKey(publicId);
    const analyticsField = QR_EXPORT_TYPE_TO_ANALYTICS_COUNT_FIELD[exportType];
    const transaction = this.redisService.client.multi();

    transaction.hincrby(analyticsKey, QR_EXPORT_TOTAL_COUNT_ANALYTICS_FIELD, 1);
    transaction.hincrby(analyticsKey, analyticsField, 1);
    transaction.hset(
      analyticsKey,
      'lastExportedAt',
      JSON.stringify(exportedAt),
    );
    transaction.hset(
      analyticsKey,
      'lastExportType',
      JSON.stringify(exportType),
    );

    if (exportType === QrExportType.COPY) {
      transaction.hset(
        analyticsKey,
        'lastCopiedAt',
        JSON.stringify(exportedAt),
      );
    }

    await transaction.exec();
  }

  private getTotalScanCount(
    qrCode: Pick<QrCodeDocument, 'tracking'>,
    analytics?: ResolvedQrCodeAnalytics,
  ): number {
    return qrCode.tracking.totalScanCount + (analytics?.count ?? 0);
  }

  private getLastScannedAt(
    qrCode: Pick<QrCodeDocument, 'tracking'>,
    analytics?: ResolvedQrCodeAnalytics,
  ): Date | null {
    return (
      this.parseRedisDate(analytics?.lastScannedAt) ??
      qrCode.tracking.lastScannedAt ??
      null
    );
  }

  private getMergedExportStats(
    qrCode: Pick<QrCodeDocument, 'exports'>,
    analytics?: ResolvedQrCodeAnalytics,
  ): QrCodeDocument['exports'] {
    const pendingExports = analytics?.exports;

    return {
      totalCount: qrCode.exports.totalCount + (pendingExports?.totalCount ?? 0),
      byType: {
        png: qrCode.exports.byType.png + (pendingExports?.byType.png ?? 0),
        jpg: qrCode.exports.byType.jpg + (pendingExports?.byType.jpg ?? 0),
        jpeg: qrCode.exports.byType.jpeg + (pendingExports?.byType.jpeg ?? 0),
        svg: qrCode.exports.byType.svg + (pendingExports?.byType.svg ?? 0),
        webp: qrCode.exports.byType.webp + (pendingExports?.byType.webp ?? 0),
        pdf: qrCode.exports.byType.pdf + (pendingExports?.byType.pdf ?? 0),
        copy: qrCode.exports.byType.copy + (pendingExports?.byType.copy ?? 0),
      },
      lastExportedAt:
        this.parseRedisDate(pendingExports?.lastExportedAt) ??
        qrCode.exports.lastExportedAt ??
        null,
      lastExportType:
        pendingExports?.lastExportType ?? qrCode.exports.lastExportType ?? null,
      lastCopiedAt:
        this.parseRedisDate(pendingExports?.lastCopiedAt) ??
        qrCode.exports.lastCopiedAt ??
        null,
    };
  }

  private getTotalExportCount(
    qrCode: Pick<QrCodeDocument, 'exports'>,
    analytics?: ResolvedQrCodeAnalytics,
  ): number {
    return qrCode.exports.totalCount + (analytics?.exports.totalCount ?? 0);
  }

  private parseRedisDate(value?: string | null): Date | null {
    if (!value) {
      return null;
    }

    const parsed = new Date(value);

    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  private sumPendingScanCount(
    publicIds: string[],
    analyticsMap: Map<string, ResolvedQrCodeAnalytics>,
  ): number {
    let total = 0;

    for (const publicId of publicIds) {
      total += analyticsMap.get(publicId)?.count ?? 0;
    }

    return total;
  }

  private sumPendingExportCount(
    publicIds: string[],
    analyticsMap: Map<string, ResolvedQrCodeAnalytics>,
  ): number {
    let total = 0;

    for (const publicId of publicIds) {
      total += analyticsMap.get(publicId)?.exports.totalCount ?? 0;
    }

    return total;
  }
}
