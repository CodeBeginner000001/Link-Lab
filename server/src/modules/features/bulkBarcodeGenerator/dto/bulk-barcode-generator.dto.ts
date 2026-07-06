import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
} from 'class-validator';
import {
  BULK_BARCODE_MIN_ROWS,
  BULK_BARCODE_MAX_ROWS,
  DEFAULT_BULK_BARCODE_PAGE_LIMIT,
  MAX_BULK_BARCODE_PAGE_LIMIT,
} from '../bulk-barcode-generator.constants';
import { BarcodeFormat } from '../../barcodeGenerator/barcode-generator.constants';

const HEX_COLOR_REGEX = /^#[0-9a-fA-F]{6}$/;

export class GenerateBulkBarcodeDto {
  @IsOptional()
  @IsIn(['upload', 'auto'], {
    message: 'generationMode: Generation mode must be upload or auto',
  })
  generationMode?: 'upload' | 'auto';

  @IsOptional()
  @IsEnum(BarcodeFormat, {
    message: 'autoFormat: Unsupported barcode format',
  })
  autoFormat?: BarcodeFormat;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'autoCount: Auto count must be an integer' })
  @Min(BULK_BARCODE_MIN_ROWS, {
    message: `autoCount: Auto generation requires at least ${BULK_BARCODE_MIN_ROWS} items`,
  })
  @Max(BULK_BARCODE_MAX_ROWS, {
    message: `autoCount: Auto generation must not exceed ${BULK_BARCODE_MAX_ROWS} items`,
  })
  autoCount?: number;

  @Type(() => Number)
  @IsInt({ message: 'barWidth: Bar width must be an integer' })
  @Min(1, { message: 'barWidth: Bar width must be at least 1' })
  @Max(5, { message: 'barWidth: Bar width must not exceed 5' })
  barWidth!: number;

  @Type(() => Number)
  @IsInt({ message: 'height: Height must be an integer' })
  @Min(40, { message: 'height: Height must be at least 40 pixels' })
  @Max(300, { message: 'height: Height must not exceed 300 pixels' })
  height!: number;

  @Type(() => Number)
  @IsInt({ message: 'margin: Margin must be an integer' })
  @Min(0, { message: 'margin: Margin must be at least 0 pixels' })
  @Max(100, { message: 'margin: Margin must not exceed 100 pixels' })
  margin!: number;

  @IsString({ message: 'barColor: Bar color must be a string' })
  @Matches(HEX_COLOR_REGEX, {
    message: 'barColor: Bar color must be a six-digit hex color',
  })
  barColor!: string;

  @IsString({ message: 'backgroundColor: Background color must be a string' })
  @Matches(HEX_COLOR_REGEX, {
    message: 'backgroundColor: Background color must be a six-digit hex color',
  })
  backgroundColor!: string;

  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean({ message: 'showValue: Show value must be a boolean' })
  showValue!: boolean;
}

export class GetPaginatedBulkBarcodesDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'page: Page must be an integer' })
  @Min(1, { message: 'page: Page must be at least 1' })
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'limit: Limit must be an integer' })
  @Min(1, { message: 'limit: Limit must be at least 1' })
  @Max(MAX_BULK_BARCODE_PAGE_LIMIT, {
    message: `limit: Limit must not exceed ${MAX_BULK_BARCODE_PAGE_LIMIT}`,
  })
  limit: number = DEFAULT_BULK_BARCODE_PAGE_LIMIT;
}
