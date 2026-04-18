import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { isEmail } from 'class-validator';
import { createHash } from 'crypto';
import { Model } from 'mongoose';
import { AccessTokenExpired } from 'src/exceptions/auth.exception';
import {
  QrCodeDuplicateRequestException,
  InvalidQrCodeContentException,
  QrCodeAccessDeniedException,
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
  generatePublicId,
  isDuplicateKeyError,
  normalizeHttpUrl,
  toObjectId,
} from '../utils/common.utils';
import { CreateQrCodeDto } from './dto/create-qr-code.dto';
import { ExportQrCodeDto } from './dto/export-qr-code.dto';
import { GetQrDashboardOverviewDto } from './dto/get-qr-dashboard-overview.dto';
import { buildQrExportPayload, QrExportPayload } from './qrCode-renderer.utils';
import {
  DEFAULT_QR_DASHBOARD_LIMIT,
  QR_DASHBOARD_LATEST_SAVED_RECORDS_LIMIT,
  QR_EXPORT_TYPE_TO_COUNTER_FIELD,
  QR_PUBLIC_ID_GENERATION_ATTEMPTS,
  QR_WIFI_PREFIX_REGEX,
} from './qrCode.constants';

const QR_ENCRYPTED_VALUE_PREFIX = 'enc:';

@Injectable()
export class QrCodeService {
  constructor(
    @InjectModel(QrCode.name)
    private readonly qrCodeModel: Model<QrCodeDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    private readonly configService: ConfigService,
  ) {}

  async createQrCode(user: JwtPayload, dto: CreateQrCodeDto) {
    const userId = await this.getAuthenticatedUserId(user);
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

    const content = this.normalizeContent(dto.contentType, dto.content);

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
            byType: {
              png: 0,
              jpg: 0,
              jpeg: 0,
              svg: 0,
              webp: 0,
              pdf: 0,
              copy: 0,
            },
            lastExportedAt: null,
            lastExportType: null as QrExportType | null,
          },
          tracking,
          status: QrStatus.ACTIVE,
          deletedAt: null,
          lastActivityAt: null,
        });

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

    const exported = await buildQrExportPayload({
      publicId: qrCode.publicId,
      exportType: dto.exportType,
      qrValue,
      style: qrCode.style,
    });
    const now = new Date();
    const counterField = QR_EXPORT_TYPE_TO_COUNTER_FIELD[dto.exportType];

    await this.qrCodeModel
      .updateOne(
        {
          _id: qrCode._id,
          status: QrStatus.ACTIVE,
        },
        {
          $inc: {
            'exports.totalCount': 1,
            [`exports.byType.${counterField}`]: 1,
          },
          $set: {
            'exports.lastExportedAt': now,
            'exports.lastExportType': dto.exportType,
          },
        },
      )
      .exec();

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

    const deletedAt = new Date();

    qrCode.status = QrStatus.DELETED;
    qrCode.deletedAt = deletedAt;
    qrCode.lastActivityAt = deletedAt;

    await qrCode.save();

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

    return {
      qrCode: this.serializeQrCode(qrCode),
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

    if (search) {
      const regex = new RegExp(
        search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        'i',
      );

      filteredMatch.$or = [{ publicId: regex }, { content: regex }];
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
    const serializeDashboardItem = (qrCode: QrCodeDocument): QrDashboardItem => {
      const content =
        this.readProtectedQrValue(qrCode.contentMeta.type, qrCode.content) ??
        qrCode.content;

      return {
        publicId: qrCode.publicId,
        contentType: qrCode.contentMeta.type,
        content,
        createdAt: qrCode.createdAt ?? null,
        activity: {
          totalScanCount: qrCode.tracking.totalScanCount,
          totalExportCount: qrCode.exports.totalCount,
          lastScannedAt: qrCode.tracking.lastScannedAt,
          lastExportedAt: qrCode.exports.lastExportedAt,
        },
        style: qrCode.style,
        exportsByType: {
          png: qrCode.exports.byType.png,
          jpg: qrCode.exports.byType.jpg,
          jpeg: qrCode.exports.byType.jpeg,
          svg: qrCode.exports.byType.svg,
          webp: qrCode.exports.byType.webp,
          pdf: qrCode.exports.byType.pdf,
        },
        tracking: {
          isTraceable: qrCode.tracking.isTraceable,
          totalScanCount: qrCode.tracking.totalScanCount,
        },
      };
    };
    const serializeMostEngagedRecord = (
      qrCode: QrCodeDocument,
    ): QrDashboardMostEngagedRecord => {
      const content =
        this.readProtectedQrValue(qrCode.contentMeta.type, qrCode.content) ??
        qrCode.content;

      return {
        content,
        contentType: qrCode.contentMeta.type,
        totalScanCount: qrCode.tracking.totalScanCount,
        totalExportCount: qrCode.exports.totalCount,
        createdAt: qrCode.createdAt ?? null,
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
    const [dashboardAggregation] = await this.qrCodeModel
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
      .exec();
    const {
      summary: summaryResult = [],
      analyticsSummary: analyticsSummaryResult = [],
      contentTypeCounts = [],
      bodyStyleCounts = [],
      qrCodes = [],
      mostEngagedRecord: mostEngagedRecordResult = [],
      latestSavedRecords: latestSavedRecordDocs = [],
    } = dashboardAggregation ?? {};

    const summary = summaryResult[0] ?? {
      totalQrCount: 0,
      totalScanCount: 0,
      totalExportCount: 0,
    };
    const analyticsSummaryBase = analyticsSummaryResult[0] ?? {
      totalQrCount: 0,
      totalScanCount: 0,
      totalExportCount: 0,
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
      totalScanCount: analyticsSummaryBase.totalScanCount,
      totalExportCount: analyticsSummaryBase.totalExportCount,
      topBodyStyle,
      topContentType,
      contentTypeCounts,
      bodyStyleCounts,
    };
    const mostEngagedRecord =
      mostEngagedRecordResult[0] != null
        ? serializeMostEngagedRecord(mostEngagedRecordResult[0])
        : null;
    const latestSavedRecords = latestSavedRecordDocs.map((qrCode) =>
      serializeLatestSavedRecord(qrCode),
    );

    const hasNextPage = qrCodes.length > limit;
    const pageItems = hasNextPage ? qrCodes.slice(0, limit) : qrCodes;
    const items = pageItems.map((qrCode) => serializeDashboardItem(qrCode));
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
    const qrCode = await this.qrCodeModel
      .findOne({
        publicId,
        status: QrStatus.ACTIVE,
      })
      .exec();

    if (!qrCode) {
      throw new QrCodeNotFoundException();
    }

    if (!qrCode.tracking.isTraceable) {
      throw new QrCodeNotFoundException();
    }

    const content = this.readQrContent(qrCode);
    let targetUrl: string;

    switch (qrCode.contentMeta.type) {
      case QrContentType.URL:
        targetUrl = content;
        break;
      case QrContentType.EMAIL:
        targetUrl = `mailto:${content}`;
        break;
      case QrContentType.TEXT:
      case QrContentType.WIFI:
        throw new QrCodeNotFoundException();
    }

    const scannedAt = new Date();
    await this.qrCodeModel
      .updateOne(
        {
          _id: qrCode._id,
          status: QrStatus.ACTIVE,
          'tracking.isTraceable': true,
        },
        {
          $inc: {
            'tracking.totalScanCount': 1,
          },
          $set: {
            'tracking.lastScannedAt': scannedAt,
            lastActivityAt: scannedAt,
          },
        },
      )
      .exec();

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

  private normalizeContent(
    contentType: QrContentType,
    content: string,
  ): string {
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

  private serializeQrCode(qrCode: QrCodeDocument): SerializedQrCode {
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
      exports: qrCode.exports,
      tracking: qrCode.tracking,
      status: qrCode.status,
      deletedAt: qrCode.deletedAt,
      lastActivityAt: qrCode.lastActivityAt,
      createdAt: qrCode.createdAt ?? null,
      updatedAt: qrCode.updatedAt ?? null,
    };
  }
}
