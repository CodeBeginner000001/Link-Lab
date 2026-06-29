import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { createHash } from 'crypto';
import { Model, Types } from 'mongoose';
import sharp from 'sharp';
import { AccessTokenExpired } from 'src/exceptions/auth.exception';
import {
  BarcodeAccessDeniedException,
  BarcodeActivityDateInvalidException,
  BarcodeContentInvalidException,
  BarcodeDuplicateRequestException,
  BarcodeNotFoundException,
} from 'src/exceptions/barcode.exception';
import { JwtPayload } from 'src/interfaces/auth.interface';
import {
  Barcode,
  BarcodeDocument,
  BarcodeDownloadCounts,
} from 'src/models/barcode.schema';
import { User, UserDocument } from 'src/models/user.schema';
import { isDuplicateKeyError, toObjectId } from '../utils/common.utils';
import { prepareBarcodeContent } from './barcode-content.utils';
import {
  BARCODE_FORMATS,
  BarcodeActivityPeriod,
  BarcodeDownloadType,
  BarcodeFormat,
  BarcodeStatus,
} from './barcode-generator.constants';
import { BarcodeRendererService } from './barcode-renderer.service';
import {
  GenerateBarcodeDto,
  GetBarcodeActivityDto,
  GetPaginatedBarcodesDto,
  UpdateBarcodeDto,
} from './dto/barcode-generator.dto';

type ActivityRange = {
  start: Date;
  end: Date;
  previousStart: Date;
  previousEnd: Date;
  labels: string[];
  mongoDateFormat: string;
};

type BarcodeInput = {
  format: BarcodeFormat;
  content: string;
  barWidth: number;
  height: number;
  margin: number;
  barColor: string;
  backgroundColor: string;
  showValue: boolean;
};

export type SerializedBarcode = {
  id: string;
  format: BarcodeFormat;
  content: string;
  barWidth: number;
  height: number;
  margin: number;
  barColor: string;
  backgroundColor: string;
  showValue: boolean;
  svg: string;
  downloadCounts: BarcodeDownloadCounts;
  totalDownloads: number;
  lastDownloadType: BarcodeDownloadType | null;
  lastDownloadedAt: Date | null;
  createdAt: Date | null;
  updatedAt: Date | null;
};

export type PaginatedBarcodesResponse = {
  items: SerializedBarcode[];
  pagination: {
    totalItems: number;
    totalPages: number;
    hasMore: boolean;
    page: number;
    limit: number;
    cursor: string | null;
  };
};

@Injectable()
export class BarcodeGeneratorService {
  constructor(
    @InjectModel(Barcode.name)
    private readonly barcodeModel: Model<BarcodeDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    private readonly renderer: BarcodeRendererService,
  ) {}

  getFormats() {
    return {
      formats: BARCODE_FORMATS,
    };
  }

  async generate(user: JwtPayload, dto: GenerateBarcodeDto) {
    const userId = await this.getAuthenticatedUserId(user);
    const barcodeInput = this.prepareBarcodeInput(dto);
    const requestBodyHash = this.getRequestBodyHash(barcodeInput);

    const existingBarcode = await this.barcodeModel
      .exists({
        userId,
        format: barcodeInput.format,
        content: barcodeInput.content,
        barWidth: barcodeInput.barWidth,
        height: barcodeInput.height,
        margin: barcodeInput.margin,
        barColor: barcodeInput.barColor,
        backgroundColor: barcodeInput.backgroundColor,
        showValue: barcodeInput.showValue,
        status: { $ne: BarcodeStatus.DELETED },
      })
      .exec();

    if (existingBarcode) {
      throw new BarcodeDuplicateRequestException();
    }

    const svg = this.renderer.renderSvg(barcodeInput);

    try {
      const barcode = await this.barcodeModel.create({
        userId,
        ...barcodeInput,
        requestBodyHash,
        svg,
        status: BarcodeStatus.ACTIVE,
      });

      return {
        message: 'Barcode generated successfully',
        barcode: this.serializeBarcode(barcode),
      };
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        throw new BarcodeDuplicateRequestException();
      }

      throw error;
    }
  }

  async getPreview(user: JwtPayload, barcodeId: string) {
    const barcode = await this.getOwnedBarcode(user, barcodeId);

    return {
      body: Buffer.from(barcode.svg, 'utf8'),
      contentType: 'image/svg+xml; charset=utf-8',
      filename: this.buildFilename(barcode, BarcodeDownloadType.SVG),
    };
  }

  async download(
    user: JwtPayload,
    barcodeId: string,
    type: BarcodeDownloadType,
  ) {
    const barcode = await this.getOwnedBarcode(user, barcodeId);
    let body: Buffer;
    let contentType: string;

    if (type === BarcodeDownloadType.SVG) {
      body = Buffer.from(barcode.svg, 'utf8');
      contentType = 'image/svg+xml; charset=utf-8';
    } else {
      body = await sharp(Buffer.from(barcode.svg, 'utf8')).png().toBuffer();
      contentType = 'image/png';
    }

    await this.barcodeModel
      .updateOne(
        {
          _id: barcode._id,
          userId: barcode.userId,
          status: { $ne: BarcodeStatus.DELETED },
        },
        {
          $inc: {
            totalDownloads: 1,
            [`downloadCounts.${type}`]: 1,
          },
          $set: {
            lastDownloadType: type,
            lastDownloadedAt: new Date(),
          },
        },
      )
      .exec();

    return {
      body,
      contentType,
      filename: this.buildFilename(barcode, type),
    };
  }

  async delete(user: JwtPayload, barcodeId: string) {
    const barcode = await this.getOwnedBarcode(user, barcodeId);

    barcode.status = BarcodeStatus.DELETED;
    barcode.deletedAt = new Date();
    barcode.requestBodyHash = null;

    await barcode.save();

    return {
      message: 'Barcode deleted successfully',
    };
  }

  async getById(user: JwtPayload, barcodeId: string) {
    const barcode = await this.getOwnedBarcode(user, barcodeId);

    return {
      barcode: this.serializeBarcode(barcode),
    };
  }

  async update(user: JwtPayload, barcodeId: string, dto: UpdateBarcodeDto) {
    if (Object.keys(dto).length === 0) {
      throw new BadRequestException({
        message: 'At least one field is required to update the barcode',
        error: 'Bad Request',
      });
    }

    const barcode = await this.getOwnedBarcode(user, barcodeId);

    const barcodeInput = this.prepareBarcodeInput({
      format: dto.format ?? barcode.format,
      content: dto.content ?? barcode.content,
      barWidth: dto.barWidth ?? barcode.barWidth,
      height: dto.height ?? barcode.height,
      margin: dto.margin ?? barcode.margin,
      barColor: dto.barColor ?? barcode.barColor,
      backgroundColor: dto.backgroundColor ?? barcode.backgroundColor,
      showValue: dto.showValue ?? barcode.showValue,
    });

    const hasChanges =
      barcode.format !== barcodeInput.format ||
      barcode.content !== barcodeInput.content ||
      barcode.barWidth !== barcodeInput.barWidth ||
      barcode.height !== barcodeInput.height ||
      barcode.margin !== barcodeInput.margin ||
      barcode.barColor !== barcodeInput.barColor ||
      barcode.backgroundColor !== barcodeInput.backgroundColor ||
      barcode.showValue !== barcodeInput.showValue;

    if (!hasChanges) {
      throw new BadRequestException({
        message: 'No changes detected for the barcode',
        error: 'Bad Request',
      });
    }

    barcode.format = barcodeInput.format;
    barcode.content = barcodeInput.content;
    barcode.barWidth = barcodeInput.barWidth;
    barcode.height = barcodeInput.height;
    barcode.margin = barcodeInput.margin;
    barcode.barColor = barcodeInput.barColor;
    barcode.backgroundColor = barcodeInput.backgroundColor;
    barcode.showValue = barcodeInput.showValue;
    barcode.requestBodyHash = this.getRequestBodyHash(barcodeInput);
    barcode.svg = this.renderer.renderSvg(barcodeInput);

    try {
      await barcode.save();
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        throw new BarcodeDuplicateRequestException();
      }

      throw error;
    }

    return {
      message: 'Barcode updated successfully',
      barcode: this.serializeBarcode(barcode),
    };
  }

  async getPaginatedData(
    user: JwtPayload,
    query: GetPaginatedBarcodesDto,
  ): Promise<PaginatedBarcodesResponse> {
    const userId = await this.getAuthenticatedUserId(user);
    const page = query.page;
    const limit = query.limit;
    const skip = (page - 1) * limit;

    const [barcodes, total] = await Promise.all([
      this.barcodeModel
        .find({
          userId,
          status: { $ne: BarcodeStatus.DELETED },
        })
        .sort({
          createdAt: -1,
          _id: -1,
        })
        .skip(skip)
        .limit(limit)
        .exec(),

      this.barcodeModel
        .countDocuments({
          userId,
          status: { $ne: BarcodeStatus.DELETED },
        })
        .exec(),
    ]);

    const items = barcodes.map((barcode) => this.serializeBarcode(barcode));

    return {
      items,
      pagination: {
        totalItems: total,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
        page,
        limit,
        cursor: items.length > 0 ? items[items.length - 1].id : null,
      },
    };
  }

  async getAnalytics(user: JwtPayload) {
    const userId = await this.getAuthenticatedUserId(user);

    const [generated, downloadAggregation, topFormatRows] = await Promise.all([
      this.barcodeModel
        .countDocuments({
          userId,
          status: { $ne: BarcodeStatus.DELETED },
        })
        .exec(),

      this.barcodeModel
        .aggregate<{ total: number }>([
          {
            $match: {
              userId,
              status: { $ne: BarcodeStatus.DELETED },
            },
          },
          {
            $group: {
              _id: null,
              total: { $sum: '$totalDownloads' },
            },
          },
        ])
        .exec(),

      this.barcodeModel
        .aggregate<{
          _id: BarcodeFormat;
          count: number;
        }>([
          {
            $match: {
              userId,
              status: { $ne: BarcodeStatus.DELETED },
            },
          },
          {
            $group: {
              _id: '$format',
              count: { $sum: 1 },
            },
          },
          {
            $sort: {
              count: -1,
            },
          },
          {
            $limit: 1,
          },
        ])
        .exec(),
    ]);

    const topFormat = topFormatRows[0] ?? null;

    return {
      generated,
      downloads: downloadAggregation[0]?.total ?? 0,
      format: topFormat?.count ?? 0,
    };
  }

  async getFormatMix(user: JwtPayload) {
    const userId = await this.getAuthenticatedUserId(user);

    const [generated, formatRows, downloadFormatRows] = await Promise.all([
      this.barcodeModel
        .countDocuments({
          userId,
          status: { $ne: BarcodeStatus.DELETED },
        })
        .exec(),

      this.barcodeModel
        .aggregate<{
          _id: BarcodeFormat;
          count: number;
        }>([
          {
            $match: {
              userId,
              status: { $ne: BarcodeStatus.DELETED },
            },
          },
          {
            $group: {
              _id: '$format',
              count: { $sum: 1 },
            },
          },
          {
            $sort: {
              count: -1,
            },
          },
        ])
        .exec(),

      this.barcodeModel
        .aggregate<{ svg: number; png: number }>([
          {
            $match: {
              userId,
              status: { $ne: BarcodeStatus.DELETED },
            },
          },
          {
            $group: {
              _id: null,
              svg: { $sum: '$downloadCounts.svg' },
              png: { $sum: '$downloadCounts.png' },
            },
          },
          {
            $project: {
              _id: 0,
              svg: 1,
              png: 1,
            },
          },
        ])
        .exec(),
    ]);

    return {
      generated,
      formatDistribution: this.getFormatDistribution(formatRows, generated),
      downloadFormatDistribution: {
        svg: downloadFormatRows[0]?.svg ?? 0,
        png: downloadFormatRows[0]?.png ?? 0,
      },
    };
  }

  async getActivity(user: JwtPayload, query: GetBarcodeActivityDto) {
    const userId = await this.getAuthenticatedUserId(user);
    const range = this.getActivityRange(query.period, query.date);

    const [rows, currentTotal, previousTotal] = await Promise.all([
      this.barcodeModel
        .aggregate<{ _id: string; count: number }>([
          {
            $match: {
              userId,
              status: { $ne: BarcodeStatus.DELETED },
              createdAt: {
                $gte: range.start,
                $lt: range.end,
              },
            },
          },
          {
            $group: {
              _id: {
                $dateToString: {
                  format: range.mongoDateFormat,
                  date: '$createdAt',
                  timezone: 'UTC',
                },
              },
              count: { $sum: 1 },
            },
          },
          {
            $sort: {
              _id: 1,
            },
          },
        ])
        .exec(),

      this.barcodeModel
        .countDocuments({
          userId,
          status: { $ne: BarcodeStatus.DELETED },
          createdAt: {
            $gte: range.start,
            $lt: range.end,
          },
        })
        .exec(),

      this.barcodeModel
        .countDocuments({
          userId,
          status: { $ne: BarcodeStatus.DELETED },
          createdAt: {
            $gte: range.previousStart,
            $lt: range.previousEnd,
          },
        })
        .exec(),
    ]);

    const growth =
      previousTotal === 0
        ? currentTotal > 0
          ? 100
          : 0
        : Number(
            (((currentTotal - previousTotal) / previousTotal) * 100).toFixed(1),
          );

    const counts = new Map(rows.map((row) => [row._id, row.count]));

    return {
      period: query.period,
      selectedDate: query.date,
      start: range.start,
      end: range.end,
      growth,
      points: range.labels.map((label) => ({
        label,
        count: counts.get(label) ?? 0,
      })),
    };
  }

  private prepareBarcodeInput(input: BarcodeInput): BarcodeInput {
    const preparedContent = prepareBarcodeContent(input.format, input.content);

    if (!preparedContent.success) {
      throw new BarcodeContentInvalidException(preparedContent.error);
    }

    return {
      ...input,
      content: preparedContent.content,
      barColor: input.barColor.toLowerCase(),
      backgroundColor: input.backgroundColor.toLowerCase(),
    };
  }

  private getRequestBodyHash(input: BarcodeInput): string {
    return createHash('sha256')
      .update(
        JSON.stringify({
          format: input.format,
          content: input.content,
          barWidth: input.barWidth,
          height: input.height,
          margin: input.margin,
          barColor: input.barColor,
          backgroundColor: input.backgroundColor,
          showValue: input.showValue,
        }),
      )
      .digest('hex');
  }

  private getFormatDistribution(
    rows: Array<{ _id: BarcodeFormat; count: number }>,
    total: number,
  ) {
    return rows.map((row) => ({
      format: row._id,
      count: row.count,
      percentage:
        total > 0 ? Number(((row.count / total) * 100).toFixed(1)) : 0,
    }));
  }

  private getActivityRange(
    period: BarcodeActivityPeriod,
    value: string,
  ): ActivityRange {
    if (period === BarcodeActivityPeriod.WEEK) {
      return this.getWeekRange(value);
    }

    if (period === BarcodeActivityPeriod.MONTH) {
      return this.getMonthRange(value);
    }

    return this.getYearRange(value);
  }

  private getWeekRange(value: string): ActivityRange {
    const match = /^(\d{4})-W(\d{2})$/.exec(value);

    if (!match) {
      throw new BarcodeActivityDateInvalidException('week');
    }

    const year = Number(match[1]);
    const week = Number(match[2]);

    if (year < 1000 || year > 9999 || week < 1 || week > 53) {
      throw new BarcodeActivityDateInvalidException('week');
    }

    const januaryFourth = new Date(Date.UTC(year, 0, 4));
    const januaryFourthDay = januaryFourth.getUTCDay() || 7;
    const firstMonday = new Date(januaryFourth);

    firstMonday.setUTCDate(januaryFourth.getUTCDate() - januaryFourthDay + 1);

    const start = new Date(firstMonday);
    start.setUTCDate(firstMonday.getUTCDate() + (week - 1) * 7);

    const end = new Date(start);
    end.setUTCDate(start.getUTCDate() + 7);

    const weekThursday = new Date(start);
    weekThursday.setUTCDate(start.getUTCDate() + 3);

    if (weekThursday.getUTCFullYear() !== year) {
      throw new BarcodeActivityDateInvalidException('week');
    }

    const previousStart = new Date(start);
    previousStart.setUTCDate(start.getUTCDate() - 7);

    return {
      start,
      end,
      previousStart,
      previousEnd: new Date(start),
      labels: this.getDailyLabels(start, 7),
      mongoDateFormat: '%Y-%m-%d',
    };
  }

  private getMonthRange(value: string): ActivityRange {
    const match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(value);

    if (!match) {
      throw new BarcodeActivityDateInvalidException('month');
    }

    const year = Number(match[1]);
    const monthIndex = Number(match[2]) - 1;

    if (year < 1000 || year > 9999) {
      throw new BarcodeActivityDateInvalidException('month');
    }

    const start = new Date(Date.UTC(year, monthIndex, 1));
    const end = new Date(Date.UTC(year, monthIndex + 1, 1));
    const previousStart = new Date(Date.UTC(year, monthIndex - 1, 1));

    const days = Math.round(
      (end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000),
    );

    return {
      start,
      end,
      previousStart,
      previousEnd: new Date(start),
      labels: this.getDailyLabels(start, days),
      mongoDateFormat: '%Y-%m-%d',
    };
  }

  private getYearRange(value: string): ActivityRange {
    if (!/^\d{4}$/.test(value)) {
      throw new BarcodeActivityDateInvalidException('year');
    }

    const year = Number(value);

    if (year < 1000 || year > 9999) {
      throw new BarcodeActivityDateInvalidException('year');
    }

    const start = new Date(Date.UTC(year, 0, 1));
    const end = new Date(Date.UTC(year + 1, 0, 1));
    const previousStart = new Date(Date.UTC(year - 1, 0, 1));

    const labels = Array.from(
      { length: 12 },
      (_, index) => `${year}-${String(index + 1).padStart(2, '0')}`,
    );

    return {
      start,
      end,
      previousStart,
      previousEnd: new Date(start),
      labels,
      mongoDateFormat: '%Y-%m',
    };
  }

  private getDailyLabels(start: Date, count: number): string[] {
    return Array.from({ length: count }, (_, index) => {
      const date = new Date(start);

      date.setUTCDate(start.getUTCDate() + index);

      return date.toISOString().slice(0, 10);
    });
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

  private async getOwnedBarcode(
    user: JwtPayload,
    barcodeId: string,
  ): Promise<BarcodeDocument> {
    const userId = await this.getAuthenticatedUserId(user);
    const id = toObjectId(barcodeId, 'Barcode id is invalid');
    const barcode = await this.barcodeModel.findById(id).exec();

    if (!barcode || barcode.status === BarcodeStatus.DELETED) {
      throw new BarcodeNotFoundException();
    }

    if (String(barcode.userId) !== String(userId)) {
      throw new BarcodeAccessDeniedException();
    }

    return barcode;
  }

  private serializeBarcode(barcode: BarcodeDocument): SerializedBarcode {
    return {
      id: String(barcode._id),
      format: barcode.format,
      content: barcode.content,
      barWidth: barcode.barWidth,
      height: barcode.height,
      margin: barcode.margin,
      barColor: barcode.barColor,
      backgroundColor: barcode.backgroundColor,
      showValue: barcode.showValue,
      svg: barcode.svg,
      downloadCounts: barcode.downloadCounts,
      totalDownloads: barcode.totalDownloads,
      lastDownloadType: barcode.lastDownloadType ?? null,
      lastDownloadedAt: barcode.lastDownloadedAt ?? null,
      createdAt: barcode.createdAt ?? null,
      updatedAt: barcode.updatedAt ?? null,
    };
  }

  private buildFilename(
    barcode: BarcodeDocument,
    type: BarcodeDownloadType,
  ): string {
    return `barcode-${barcode.format.toLowerCase()}-${String(barcode._id)}.${type}`;
  }
}
