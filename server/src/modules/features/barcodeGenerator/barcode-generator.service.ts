import { Injectable } from '@nestjs/common';
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
import { Barcode, BarcodeDocument } from 'src/models/barcode.schema';
import { User, UserDocument } from 'src/models/user.schema';
import { isDuplicateKeyError, toObjectId } from '../utils/common.utils';
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
  GetRecentBarcodesDto,
} from './dto/barcode-generator.dto';

type ActivityRange = {
  start: Date;
  end: Date;
  previousStart: Date;
  previousEnd: Date;
  labels: string[];
  mongoDateFormat: string;
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
    const normalizedDto = {
      ...dto,
      content: dto.content.trim(),
      barColor: dto.barColor.toLowerCase(),
      backgroundColor: dto.backgroundColor.toLowerCase(),
    };

    this.validateContent(normalizedDto.format, normalizedDto.content);
    const requestBodyHash = createHash('sha256')
      .update(
        JSON.stringify({
          format: normalizedDto.format,
          content: normalizedDto.content,
          barWidth: normalizedDto.barWidth,
          height: normalizedDto.height,
          margin: normalizedDto.margin,
          barColor: normalizedDto.barColor,
          backgroundColor: normalizedDto.backgroundColor,
          showValue: normalizedDto.showValue,
        }),
      )
      .digest('hex');

    const existingBarcode = await this.barcodeModel
      .exists({
        userId,
        format: normalizedDto.format,
        content: normalizedDto.content,
        barWidth: normalizedDto.barWidth,
        height: normalizedDto.height,
        margin: normalizedDto.margin,
        barColor: normalizedDto.barColor,
        backgroundColor: normalizedDto.backgroundColor,
        showValue: normalizedDto.showValue,
        status: { $ne: BarcodeStatus.DELETED },
      })
      .exec();

    if (existingBarcode) {
      throw new BarcodeDuplicateRequestException();
    }

    const svg = this.renderer.renderSvg(normalizedDto);

    try {
      const barcode = await this.barcodeModel.create({
        userId,
        ...normalizedDto,
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

    return { message: 'Barcode deleted successfully' };
  }

  async getRecent(user: JwtPayload, query: GetRecentBarcodesDto) {
    const userId = await this.getAuthenticatedUserId(user);
    const { page, limit } = query;
    const skip = (page - 1) * limit;

    const [barcodes, total] = await Promise.all([
      this.barcodeModel
        .find({ userId, status: { $ne: BarcodeStatus.DELETED } })
        .sort({ createdAt: -1, _id: -1 })
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

    return {
      items: barcodes.map((barcode) => this.serializeBarcode(barcode)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
    };
  }

  async getSummary(user: JwtPayload) {
    const userId = await this.getAuthenticatedUserId(user);

    const [generated, downloadAggregation, formatRows, downloadFormatRows] =
      await Promise.all([
        this.barcodeModel
          .countDocuments({
            userId,
            status: { $ne: BarcodeStatus.DELETED },
          })
          .exec(),
        this.barcodeModel
          .aggregate<{
            total: number;
          }>([
            {
              $match: {
                userId,
                status: { $ne: BarcodeStatus.DELETED },
              },
            },
            { $group: { _id: null, total: { $sum: '$totalDownloads' } } },
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
            { $group: { _id: '$format', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
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
            { $project: { _id: 0, svg: 1, png: 1 } },
          ])
          .exec(),
      ]);

    const formatDistribution = formatRows.map((row) => ({
      format: row._id,
      count: row.count,
      percentage:
        generated > 0 ? Number(((row.count / generated) * 100).toFixed(1)) : 0,
    }));

    return {
      generated,
      downloads: downloadAggregation[0]?.total ?? 0,
      formatDistribution,
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
              createdAt: { $gte: range.start, $lt: range.end },
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
          { $sort: { _id: 1 } },
        ])
        .exec(),
      this.barcodeModel
        .countDocuments({
          userId,
          status: { $ne: BarcodeStatus.DELETED },
          createdAt: { $gte: range.start, $lt: range.end },
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

  private validateContent(format: BarcodeFormat, content: string): void {
    if (!content) {
      throw new BarcodeContentInvalidException('Barcode content is required');
    }

    const rules: Record<BarcodeFormat, RegExp> = {
      [BarcodeFormat.CODE128]: /^.{1,128}$/u,
      [BarcodeFormat.EAN13]: /^\d{12,13}$/,
      [BarcodeFormat.UPCA]: /^\d{11,12}$/,
      [BarcodeFormat.CODE39]: /^[0-9A-Z .$/+%-]+$/,
      [BarcodeFormat.ITF14]: /^\d{13,14}$/,
    };

    if (!rules[format].test(content)) {
      const formatRule = BARCODE_FORMATS.find(
        (item) => item.value === format,
      )?.contentRule;

      throw new BarcodeContentInvalidException(
        `Content is invalid for ${format}. Expected: ${formatRule}`,
      );
    }
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

  private serializeBarcode(barcode: BarcodeDocument) {
    const id = String(barcode._id);

    return {
      id,
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
