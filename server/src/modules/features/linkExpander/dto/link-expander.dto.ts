import { Type } from 'class-transformer';
import {
  IsInt,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import {
  DEFAULT_LINK_EXPANDER_PAGE_LIMIT,
  MAX_LINK_EXPANDER_PAGE_LIMIT,
} from '../link-expander.constants';

export class ExpandLinkDto {
  @IsString({ message: 'url: URL must be a string' })
  @IsNotEmpty({ message: 'url: URL is required' })
  @MaxLength(2048, {
    message: 'url: URL must not exceed 2048 characters',
  })
  @IsUrl(
    { require_protocol: true },
    { message: 'url: Please provide a valid URL with protocol' },
  )
  url!: string;
}

export class GetPaginatedExpandedLinksDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'page: Page must be an integer' })
  @Min(1, { message: 'page: Page must be at least 1' })
  page: number = 1;

  @IsOptional()
  @IsString({ message: 'cursor: Cursor must be a string' })
  @IsMongoId({ message: 'cursor: Cursor must be a valid id' })
  cursor?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'limit: Limit must be an integer' })
  @Min(1, { message: 'limit: Limit must be at least 1' })
  @Max(MAX_LINK_EXPANDER_PAGE_LIMIT, {
    message: `limit: Limit must not exceed ${MAX_LINK_EXPANDER_PAGE_LIMIT}`,
  })
  limit: number = DEFAULT_LINK_EXPANDER_PAGE_LIMIT;
}
