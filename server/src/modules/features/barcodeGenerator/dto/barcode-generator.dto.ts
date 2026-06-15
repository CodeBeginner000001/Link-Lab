import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import {
  BarcodeActivityPeriod,
  BarcodeDownloadType,
  BarcodeFormat,
  DEFAULT_BARCODE_PAGE_LIMIT,
  MAX_BARCODE_PAGE_LIMIT,
} from '../barcode-generator.constants';

const HEX_COLOR_REGEX = /^#[0-9a-fA-F]{6}$/;

export class DownloadBarcodeDto {
  @IsEnum(BarcodeDownloadType, {
    message: 'type: Download type must be svg or png',
  })
  type!: BarcodeDownloadType;
}

export class GenerateBarcodeDto {
  @IsEnum(BarcodeFormat, {
    message: 'format: Unsupported barcode format',
  })
  format!: BarcodeFormat;

  @IsString({ message: 'content: Content must be a string' })
  @IsNotEmpty({ message: 'content: Content is required' })
  @MaxLength(256, {
    message: 'content: Content must not exceed 256 characters',
  })
  content!: string;

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

  @IsString({
    message: 'backgroundColor: Background color must be a string',
  })
  @Matches(HEX_COLOR_REGEX, {
    message: 'backgroundColor: Background color must be a six-digit hex color',
  })
  backgroundColor!: string;

  @IsBoolean({ message: 'showValue: Show value must be a boolean' })
  showValue!: boolean;
}

export class GetBarcodeActivityDto {
  @IsEnum(BarcodeActivityPeriod, {
    message: 'period: Period must be week, month, or year',
  })
  period!: BarcodeActivityPeriod;

  @IsString({ message: 'date: Date selection must be a string' })
  date!: string;
}

export class GetRecentBarcodesDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'page: Page must be an integer' })
  @Min(1, { message: 'page: Page must be at least 1' })
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'limit: Limit must be an integer' })
  @Min(1, { message: 'limit: Limit must be at least 1' })
  @Max(MAX_BARCODE_PAGE_LIMIT, {
    message: `limit: Limit must not exceed ${MAX_BARCODE_PAGE_LIMIT}`,
  })
  limit: number = DEFAULT_BARCODE_PAGE_LIMIT;
}
