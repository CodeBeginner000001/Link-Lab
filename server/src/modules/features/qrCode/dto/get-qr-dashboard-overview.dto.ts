import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import {
  BodyShape,
  QrContentType,
} from 'src/interfaces/features/qr-code.enums';
import {
  DEFAULT_QR_DASHBOARD_LIMIT,
  MAX_QR_DASHBOARD_LIMIT,
} from '../qrCode.constants';

export class GetQrDashboardOverviewDto {
  @IsOptional()
  @IsString({ message: 'cursor: Cursor must be a string' })
  cursor?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'limit: Limit must be an integer' })
  @Min(1, { message: 'limit: Limit must be at least 1' })
  @Max(MAX_QR_DASHBOARD_LIMIT, {
    message: `limit: Limit must not exceed ${MAX_QR_DASHBOARD_LIMIT}`,
  })
  limit: number = DEFAULT_QR_DASHBOARD_LIMIT;

  @IsOptional()
  @IsEnum(QrContentType, {
    message: 'type: Content type is invalid',
  })
  type?: QrContentType;

  @IsOptional()
  @IsEnum(BodyShape, {
    message: 'bodyShape: Body shape is invalid',
  })
  bodyShape?: BodyShape;

  @IsOptional()
  @IsString({ message: 'search: Search must be a string' })
  @MaxLength(255, {
    message: 'search: Search must not exceed 255 characters',
  })
  search?: string;
}
