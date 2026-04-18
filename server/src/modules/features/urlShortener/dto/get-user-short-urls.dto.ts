import { Type } from 'class-transformer';
import {
  IsInt,
  IsMongoId,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import {
  DEFAULT_SHORT_URL_PAGE_LIMIT,
  MAX_SHORT_URL_PAGE_LIMIT,
} from '../urlShortener.constants';

export class GetUserShortUrlsDto {
  @IsOptional()
  @IsString({ message: 'cursor: Cursor must be a string' })
  @IsMongoId({ message: 'cursor: Cursor must be a valid id' })
  cursor?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'limit: Limit must be an integer' })
  @Min(1, { message: 'limit: Limit must be at least 1' })
  @Max(MAX_SHORT_URL_PAGE_LIMIT, {
    message: `limit: Limit must not exceed ${MAX_SHORT_URL_PAGE_LIMIT}`,
  })
  limit: number = DEFAULT_SHORT_URL_PAGE_LIMIT;
}
