import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AccessTokenExpired } from 'src/exceptions/auth.exception';
import { JwtPayload } from 'src/interfaces/auth.interface';
import {
  BulkBarcode,
  BulkBarcodeDocument,
  BulkBarcodeDownloadCounts,
  BulkBarcodeDownloadType,
  BulkBarcodeStatus,
} from 'src/models/bulk-barcode.schema';
import { User, UserDocument } from 'src/models/user.schema';
import {
  getBarcodeContentValidationError,
  normalizeBarcodeContent,
} from '../barcodeGenerator/barcode-content.utils';
import {
  BarcodeFormat,
} from '../barcodeGenerator/barcode-generator.constants';
import { BarcodeRendererService } from '../barcodeGenerator/barcode-renderer.service';
import { toObjectId } from '../utils/common.utils';
import {
  BULK_BARCODE_ALLOWED_EXTENSIONS,
  BULK_BARCODE_MAX_FILE_SIZE_BYTES,
  BULK_BARCODE_MAX_ROWS,
  BULK_BARCODE_MIN_ROWS,
} from './bulk-barcode-generator.constants';
import { BulkBarcodeExportService } from './bulk-barcode-export.service';
import {
  BulkBarcodeParserService,
  ParsedBarcodeRow,
  UploadedBarcodeFile,
} from './bulk-barcode-parser.service';
import {
  GenerateBulkBarcodeDto,
  GetPaginatedBulkBarcodesDto,
} from './dto/bulk-barcode-generator.dto';

type BulkValidationError = {
  row: number;
  field: string;
  message: string;
};

type BarcodeRenderInput = {
  format: BarcodeFormat;
  content: string;
  barWidth: number;
  height: number;
  margin: number;
  barColor: string;
  backgroundColor: string;
  showValue: boolean;
};

type BulkBarcodeActivityPeriod = 'week' | 'month' | 'year';

type ActivityRange = {
  start: Date;
  end: Date;
  previousStart: Date;
  previousEnd: Date;
  labels: string[];
  mongoDateFormat: string;
};

export type SerializedBulkBarcode = {
  id: string;
  fileName: string;
  totalRows: number;
  generatedCount: number;
  failedCount: number;
  downloadCounts: BulkBarcodeDownloadCounts;
  totalDownloads: number;
  lastDownloadType: BulkBarcodeDownloadType | null;
  lastDownloadedAt: Date | null;
  status: BulkBarcodeStatus;
  createdAt: Date | null;
  updatedAt: Date | null;
};

export type PaginatedBulkBarcodesResponse = {
  items: SerializedBulkBarcode[];
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
export class BulkBarcodeGeneratorService {
  constructor(
    @InjectModel(BulkBarcode.name)
    private readonly bulkBarcodeModel: Model<BulkBarcodeDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    private readonly renderer: BarcodeRendererService,
    private readonly parser: BulkBarcodeParserService,
    private readonly exporter: BulkBarcodeExportService,
  ) {}

  async generate(
    user: JwtPayload,
    dto: GenerateBulkBarcodeDto,
    file?: UploadedBarcodeFile,
  ) {
    const userId = await this.getAuthenticatedUserId(user);
    const generationMode = dto.generationMode ?? (file ? 'upload' : 'auto');
    const isAutoGenerate = generationMode === 'auto';
    let fileName = 'auto-generated-barcodes';
    let rows: ParsedBarcodeRow[];

    if (isAutoGenerate) {
      rows = this.buildAutoRows(dto);
    } else {
      this.validateUploadFile(file);
      fileName = file.originalname;
      rows = this.parser.parse(file);
    }

    if (rows.length < BULK_BARCODE_MIN_ROWS) {
      throw new BadRequestException({
        message: `Bulk barcode generation requires at least ${BULK_BARCODE_MIN_ROWS} items.`,
        error: 'Bad Request',
      });
    }

    if (rows.length > BULK_BARCODE_MAX_ROWS) {
      throw new BadRequestException({
        message: `Maximum ${BULK_BARCODE_MAX_ROWS} barcode items allowed per upload.`,
        error: 'Bad Request',
      });
    }

    const { items, errors } = this.buildBulkItems(rows, dto);
    if (errors.length > 0) {
      throw new BadRequestException({
        message: 'Bulk barcode validation failed',
        error: 'Bad Request',
        errors,
      });
    }

    const bulkBarcode = await this.bulkBarcodeModel.create({
      userId,
      fileName,
      totalRows: rows.length,
      generatedCount: items.length,
      failedCount: 0,
      status: BulkBarcodeStatus.COMPLETED,
      items,
    });

    return {
      message: 'Bulk barcodes generated successfully',
      bulkBarcode: this.serializeBulkBarcode(bulkBarcode),
      generated: items.length,
      failed: 0,
    };
  }

  async getPaginatedData(
    user: JwtPayload,
    query: GetPaginatedBulkBarcodesDto,
  ): Promise<PaginatedBulkBarcodesResponse> {
    const userId = await this.getAuthenticatedUserId(user);
    const page = query.page;
    const limit = query.limit;
    const skip = (page - 1) * limit;

    const [bulkBarcodes, total] = await Promise.all([
      this.bulkBarcodeModel
        .find({ userId, status: { $ne: BulkBarcodeStatus.DELETED } })
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.bulkBarcodeModel
        .countDocuments({
          userId,
          status: { $ne: BulkBarcodeStatus.DELETED },
        })
        .exec(),
    ]);

    const items = bulkBarcodes.map((item) => this.serializeBulkBarcode(item));

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

    const [batches, totals] = await Promise.all([
      this.bulkBarcodeModel
        .countDocuments({
          userId,
          status: { $ne: BulkBarcodeStatus.DELETED },
        })
        .exec(),
      this.bulkBarcodeModel
      .aggregate<{ generated: number; rows: number; downloads: number }>([
          {
            $match: {
              userId,
              status: { $ne: BulkBarcodeStatus.DELETED },
            },
          },
          {
            $group: {
              _id: null,
              generated: { $sum: '$generatedCount' },
              rows: { $sum: '$totalRows' },
              downloads: { $sum: '$totalDownloads' },
            },
          },
        ])
        .exec(),
    ]);

    return {
      batches,
      generated: totals[0]?.generated ?? 0,
      rows: totals[0]?.rows ?? 0,
      downloads: totals[0]?.downloads ?? 0,
    };
  }

  async getDownloadMix(user: JwtPayload) {
    const userId = await this.getAuthenticatedUserId(user);
    const [totals] = await this.bulkBarcodeModel
      .aggregate<{ zip: number; pdf: number }>([
        {
          $match: {
            userId,
            status: { $ne: BulkBarcodeStatus.DELETED },
          },
        },
        {
          $group: {
            _id: null,
            zip: { $sum: '$downloadCounts.zip' },
            pdf: { $sum: '$downloadCounts.pdf' },
          },
        },
        { $project: { _id: 0, zip: 1, pdf: 1 } },
      ])
      .exec();
    const exportTypeDistribution = [
      { format: 'ZIP', count: totals?.zip ?? 0 },
      { format: 'PDF', count: totals?.pdf ?? 0 },
    ];
    const total = exportTypeDistribution.reduce(
      (sum, item) => sum + item.count,
      0,
    );

    return {
      exportTypeDistribution: exportTypeDistribution.map((item) => ({
        ...item,
        percentage:
          total > 0 ? Number(((item.count / total) * 100).toFixed(1)) : 0,
      })),
      downloadFormatDistribution: {
        zip: totals?.zip ?? 0,
        pdf: totals?.pdf ?? 0,
      },
    };
  }

  async getActivity(
    user: JwtPayload,
    query: { period: BulkBarcodeActivityPeriod; date: string },
  ) {
    const userId = await this.getAuthenticatedUserId(user);
    const range = this.getActivityRange(query.period, query.date);

    const [rows, currentTotal, previousTotal] = await Promise.all([
      this.bulkBarcodeModel
        .aggregate<{ _id: string; count: number }>([
          {
            $match: {
              userId,
              status: { $ne: BulkBarcodeStatus.DELETED },
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
      this.bulkBarcodeModel
        .countDocuments({
          userId,
          status: { $ne: BulkBarcodeStatus.DELETED },
          createdAt: { $gte: range.start, $lt: range.end },
        })
        .exec(),
      this.bulkBarcodeModel
        .countDocuments({
          userId,
          status: { $ne: BulkBarcodeStatus.DELETED },
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

  async download(
    user: JwtPayload,
    bulkBarcodeId: string,
    type: BulkBarcodeDownloadType,
  ) {
    if (!Object.values(BulkBarcodeDownloadType).includes(type)) {
      throw new BadRequestException({
        message: 'Download type must be pdf or zip',
        error: 'Bad Request',
      });
    }

    const bulkBarcode = await this.getOwnedBulkBarcode(user, bulkBarcodeId);
    const file = await this.exporter.buildExport(bulkBarcode, type);

    await this.bulkBarcodeModel
      .updateOne(
        {
          _id: bulkBarcode._id,
          userId: bulkBarcode.userId,
          status: { $ne: BulkBarcodeStatus.DELETED },
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

    return file;
  }

  async delete(user: JwtPayload, bulkBarcodeId: string) {
    const bulkBarcode = await this.getOwnedBulkBarcode(user, bulkBarcodeId);
    bulkBarcode.status = BulkBarcodeStatus.DELETED;
    bulkBarcode.deletedAt = new Date();
    await bulkBarcode.save();

    return { message: 'Bulk barcode upload deleted successfully' };
  }

  private validateUploadFile(
    file?: UploadedBarcodeFile,
  ): asserts file is UploadedBarcodeFile {
    if (!file) {
      throw new BadRequestException({
        message: 'Barcode upload file is required',
        error: 'Bad Request',
      });
    }

    if (file.size > BULK_BARCODE_MAX_FILE_SIZE_BYTES) {
      throw new BadRequestException({
        message: 'Barcode upload file must be 5 MB or smaller',
        error: 'Bad Request',
      });
    }

    const name = file.originalname.trim().toLowerCase();
    const dotCount = (name.match(/\./g) ?? []).length;
    const hasAllowedExtension = BULK_BARCODE_ALLOWED_EXTENSIONS.some(
      (extension) => name.endsWith(extension),
    );

    if (dotCount !== 1 || !hasAllowedExtension) {
      throw new BadRequestException({
        message:
          'Upload exactly one .csv, .xlsx, or .json file with no extra extensions',
        error: 'Bad Request',
      });
    }
  }

  private buildAutoRows(dto: GenerateBulkBarcodeDto): ParsedBarcodeRow[] {
    const format = dto.autoFormat ?? BarcodeFormat.CODE128;
    const count = dto.autoCount ?? BULK_BARCODE_MIN_ROWS;

    if (count < BULK_BARCODE_MIN_ROWS || count > BULK_BARCODE_MAX_ROWS) {
      throw new BadRequestException({
        message: `Auto generation count must be between ${BULK_BARCODE_MIN_ROWS} and ${BULK_BARCODE_MAX_ROWS}`,
        error: 'Bad Request',
      });
    }

    return Array.from({ length: count }, (_, index) => {
      const rowNumber = index + 1;
      const content = this.buildAutoContent(format, rowNumber);

      return {
        row: rowNumber,
        content,
        format,
        label: `Auto ${rowNumber}`,
      };
    });
  }

  private buildAutoContent(format: BarcodeFormat, index: number): string {
    const numericSeed = String(index).padStart(6, '0');

    if (format === BarcodeFormat.CODE128) {
      return `AUTO-${numericSeed}`;
    }

    if (format === BarcodeFormat.CODE39) {
      return `AUTO-${numericSeed}`;
    }

    if (format === BarcodeFormat.EAN13) {
      return normalizeBarcodeContent(format, `200000${numericSeed}`);
    }

    if (format === BarcodeFormat.UPCA) {
      return normalizeBarcodeContent(format, `10000${numericSeed}`);
    }

    return normalizeBarcodeContent(format, `1000000${numericSeed}`);
  }

  private buildBulkItems(
    rows: ParsedBarcodeRow[],
    dto: GenerateBulkBarcodeDto,
  ) {
    const errors: BulkValidationError[] = [];
    const seen = new Map<string, number>();
    const items = rows
      .map((row) => {
        const hasSupportedFormat =
          row.format &&
          Object.values(BarcodeFormat).includes(row.format as BarcodeFormat);

        if (!row.content) {
          errors.push({
            row: row.row,
            field: 'content',
            message: 'Content is required',
          });
        }

        if (!row.format) {
          errors.push({
            row: row.row,
            field: 'format',
            message: 'Format is required',
          });
        } else if (!hasSupportedFormat) {
          errors.push({
            row: row.row,
            field: 'format',
            message: 'Unsupported barcode format',
          });
        }

        if (!row.content || !row.format || !hasSupportedFormat) {
          return null;
        }

        const input = this.normalizeBarcodeInput({
          format: row.format as BarcodeFormat,
          content: row.content,
          barWidth: dto.barWidth,
          height: dto.height,
          margin: dto.margin,
          barColor: dto.barColor,
          backgroundColor: dto.backgroundColor,
          showValue: dto.showValue,
        });
        const duplicateKey = `${input.format}:${input.content}`;
        const firstRow = seen.get(duplicateKey);

        if (firstRow) {
          errors.push({
            row: row.row,
            field: 'content',
            message: `Duplicate barcode in upload. First seen on row ${firstRow}.`,
          });
          return null;
        }

        seen.set(duplicateKey, row.row);
        const contentError = this.getContentValidationError(
          input.format,
          input.content,
        );

        if (contentError) {
          errors.push({
            row: row.row,
            field: 'content',
            message: contentError,
          });
          return null;
        }

        return {
          row: row.row,
          content: input.content,
          format: input.format,
          label: row.label || null,
          svg: this.renderer.renderSvg(input),
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    return { items, errors };
  }

  private getContentValidationError(
    format: BarcodeFormat,
    content: string,
  ): string | null {
    return getBarcodeContentValidationError(format, content);
  }

  private normalizeBarcodeInput(input: BarcodeRenderInput): BarcodeRenderInput {
    return {
      ...input,
      content: normalizeBarcodeContent(input.format, input.content),
      barColor: input.barColor.toLowerCase(),
      backgroundColor: input.backgroundColor.toLowerCase(),
    };
  }

  private getActivityRange(
    period: BulkBarcodeActivityPeriod,
    value: string,
  ): ActivityRange {
    if (period === 'week') {
      return this.getWeekRange(value);
    }

    if (period === 'month') {
      return this.getMonthRange(value);
    }

    if (period === 'year') {
      return this.getYearRange(value);
    }

    throw new BadRequestException({
      message: 'Period must be week, month, or year',
      error: 'Bad Request',
    });
  }

  private getWeekRange(value: string): ActivityRange {
    const match = /^(\d{4})-W(\d{2})$/.exec(value);
    if (!match) {
      throw this.invalidActivityDate('week');
    }

    const year = Number(match[1]);
    const week = Number(match[2]);
    if (year < 1000 || year > 9999 || week < 1 || week > 53) {
      throw this.invalidActivityDate('week');
    }

    const januaryFourth = new Date(Date.UTC(year, 0, 4));
    const januaryFourthDay = januaryFourth.getUTCDay() || 7;
    const firstMonday = new Date(januaryFourth);
    firstMonday.setUTCDate(januaryFourth.getUTCDate() - januaryFourthDay + 1);

    const start = new Date(firstMonday);
    start.setUTCDate(firstMonday.getUTCDate() + (week - 1) * 7);
    const end = new Date(start);
    end.setUTCDate(start.getUTCDate() + 7);

    return {
      start,
      end,
      previousStart: new Date(start.getTime() - 7 * 86400000),
      previousEnd: new Date(start),
      labels: this.getDailyLabels(start, 7),
      mongoDateFormat: '%Y-%m-%d',
    };
  }

  private getMonthRange(value: string): ActivityRange {
    const match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(value);
    if (!match) {
      throw this.invalidActivityDate('month');
    }

    const year = Number(match[1]);
    const monthIndex = Number(match[2]) - 1;
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
      throw this.invalidActivityDate('year');
    }

    const year = Number(value);
    const start = new Date(Date.UTC(year, 0, 1));
    const end = new Date(Date.UTC(year + 1, 0, 1));

    return {
      start,
      end,
      previousStart: new Date(Date.UTC(year - 1, 0, 1)),
      previousEnd: new Date(start),
      labels: Array.from(
        { length: 12 },
        (_, index) => `${year}-${String(index + 1).padStart(2, '0')}`,
      ),
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

  private invalidActivityDate(period: string) {
    return new BadRequestException({
      message: `Date is invalid for the selected ${period} period`,
      error: 'Bad Request',
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

  private async getOwnedBulkBarcode(
    user: JwtPayload,
    bulkBarcodeId: string,
  ): Promise<BulkBarcodeDocument> {
    const userId = await this.getAuthenticatedUserId(user);
    const id = toObjectId(bulkBarcodeId, 'Bulk barcode id is invalid');
    const bulkBarcode = await this.bulkBarcodeModel.findById(id).exec();

    if (!bulkBarcode || bulkBarcode.status === BulkBarcodeStatus.DELETED) {
      throw new BadRequestException({
        message: 'Bulk barcode upload not found',
        error: 'Bad Request',
      });
    }

    if (String(bulkBarcode.userId) !== String(userId)) {
      throw new BadRequestException({
        message: 'You do not have access to this bulk barcode upload',
        error: 'Bad Request',
      });
    }

    return bulkBarcode;
  }

  private serializeBulkBarcode(
    bulkBarcode: BulkBarcodeDocument,
  ): SerializedBulkBarcode {
    return {
      id: String(bulkBarcode._id),
      fileName: bulkBarcode.fileName,
      totalRows: bulkBarcode.totalRows,
      generatedCount: bulkBarcode.generatedCount,
      failedCount: bulkBarcode.failedCount,
      downloadCounts: bulkBarcode.downloadCounts ?? { zip: 0, pdf: 0 },
      totalDownloads: bulkBarcode.totalDownloads ?? 0,
      lastDownloadType: bulkBarcode.lastDownloadType ?? null,
      lastDownloadedAt: bulkBarcode.lastDownloadedAt ?? null,
      status: bulkBarcode.status,
      createdAt: bulkBarcode.createdAt ?? null,
      updatedAt: bulkBarcode.updatedAt ?? null,
    };
  }
}
