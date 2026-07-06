import { randomBytes, randomInt } from 'crypto';
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
import { prepareBarcodeContent } from '../barcodeGenerator/barcode-content.utils';
import { BarcodeFormat } from '../barcodeGenerator/barcode-generator.constants';
import { BarcodeRendererService } from '../barcodeGenerator/barcode-renderer.service';
import {
  ActivityPeriod,
  getActivityRange,
} from '../utils/activity-range.utils';
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

const activeBulkBarcodeFilter = (userId: Types.ObjectId) => ({
  userId,
  status: { $ne: BulkBarcodeStatus.DELETED },
});

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
    const isAutoGenerate =
      (dto.generationMode ?? (file ? 'upload' : 'auto')) === 'auto';
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
    const { page, limit } = query;
    const skip = (page - 1) * limit;
    const filter = activeBulkBarcodeFilter(userId);

    const [bulkBarcodes, total] = await Promise.all([
      this.bulkBarcodeModel
        .find(filter)
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.bulkBarcodeModel.countDocuments(filter).exec(),
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
    const filter = activeBulkBarcodeFilter(userId);

    const [batches, totals] = await Promise.all([
      this.bulkBarcodeModel.countDocuments(filter).exec(),
      this.bulkBarcodeModel
        .aggregate<{ generated: number; rows: number; downloads: number }>([
          { $match: filter },
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
        { $match: activeBulkBarcodeFilter(userId) },
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

    const zip = totals?.zip ?? 0;
    const pdf = totals?.pdf ?? 0;
    const total = zip + pdf;
    const toPercentage = (count: number) =>
      total > 0 ? Number(((count / total) * 100).toFixed(1)) : 0;

    return {
      exportTypeDistribution: [
        { format: 'ZIP', count: zip, percentage: toPercentage(zip) },
        { format: 'PDF', count: pdf, percentage: toPercentage(pdf) },
      ],
      downloadFormatDistribution: { zip, pdf },
    };
  }

  async getActivity(
    user: JwtPayload,
    query: { period: ActivityPeriod; date: string },
  ) {
    const userId = await this.getAuthenticatedUserId(user);
    const range = getActivityRange(query.period, query.date);
    const filter = activeBulkBarcodeFilter(userId);
    const createdAtFilter = { $gte: range.start, $lt: range.end };

    const [rows, currentTotal, previousTotal] = await Promise.all([
      this.bulkBarcodeModel
        .aggregate<{ _id: string; count: number }>([
          { $match: { ...filter, createdAt: createdAtFilter } },
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
        .countDocuments({ ...filter, createdAt: createdAtFilter })
        .exec(),
      this.bulkBarcodeModel
        .countDocuments({
          ...filter,
          createdAt: { $gte: range.previousStart, $lt: range.previousEnd },
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
          ...activeBulkBarcodeFilter(bulkBarcode.userId),
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

    const seen = new Set<string>();

    return Array.from({ length: count }, (_, index) => {
      const rowNumber = index + 1;
      const content = this.buildRandomAutoContent(format, seen);
      seen.add(content);

      return {
        row: rowNumber,
        content,
        format,
        label: `Auto ${rowNumber}`,
      };
    });
  }

  private buildRandomAutoContent(
    format: BarcodeFormat,
    seen: Set<string>,
  ): string {
    const maxAttempts = 100;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const preparedContent = prepareBarcodeContent(
        format,
        this.generateRandomRawContent(format),
      );

      if (!preparedContent.success || seen.has(preparedContent.content)) {
        continue;
      }

      return preparedContent.content;
    }

    throw new BadRequestException({
      message:
        'Failed to generate unique barcode content. Try reducing the count.',
      error: 'Bad Request',
    });
  }

  private generateRandomRawContent(format: BarcodeFormat): string {
    const randomToken = randomBytes(8).toString('hex').toUpperCase();

    if (format === BarcodeFormat.CODE128 || format === BarcodeFormat.CODE39) {
      return `AUTO-${randomToken}`;
    }

    if (format === BarcodeFormat.EAN13) {
      return `200${this.randomDigits(9)}`;
    }

    if (format === BarcodeFormat.UPCA) {
      return `100${this.randomDigits(8)}`;
    }

    return `10${this.randomDigits(11)}`;
  }

  private randomDigits(length: number): string {
    return Array.from({ length }, () => randomInt(0, 10)).join('');
  }

  private buildBulkItems(
    rows: ParsedBarcodeRow[],
    dto: GenerateBulkBarcodeDto,
  ) {
    const errors: BulkValidationError[] = [];
    const seen = new Map<string, number>();
    const items = rows
      .map((row) => {
        const format = row.format as BarcodeFormat;
        const hasSupportedFormat =
          row.format && Object.values(BarcodeFormat).includes(format);

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

        if (!row.content || !hasSupportedFormat) {
          return null;
        }

        const preparedContent = prepareBarcodeContent(format, row.content);

        if (!preparedContent.success) {
          errors.push({
            row: row.row,
            field: 'content',
            message: preparedContent.error,
          });
          return null;
        }

        const renderInput = {
          format,
          content: preparedContent.content.trim(),
          barWidth: dto.barWidth,
          height: dto.height,
          margin: dto.margin,
          barColor: dto.barColor.toLowerCase(),
          backgroundColor: dto.backgroundColor.toLowerCase(),
          showValue: dto.showValue,
        };
        const duplicateKey = `${renderInput.format}:${renderInput.content}`;
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

        return {
          row: row.row,
          content: renderInput.content,
          format: renderInput.format,
          label: row.label || null,
          svg: this.renderer.renderSvg(renderInput),
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    return { items, errors };
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
