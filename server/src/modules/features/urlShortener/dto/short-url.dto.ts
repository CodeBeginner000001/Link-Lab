import { Type } from 'class-transformer';
import {
  IsInt,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import {
  DEFAULT_SHORT_URL_PAGE_LIMIT,
  MAX_SHORT_URL_PAGE_LIMIT,
  SHORT_URL_ALIAS_REGEX,
} from '../urlShortener.constants';

export class CreateShortUrlDto {
  @IsString({ message: 'longUrl: Long URL must be a string' })
  @IsNotEmpty({ message: 'longUrl: Long URL is required' })
  @MaxLength(2048, {
    message: 'longUrl: Long URL must not exceed 2048 characters',
  })
  @IsUrl(
    { require_protocol: true },
    { message: 'longUrl: Please provide a valid URL with protocol' },
  )
  longUrl!: string;

  @IsOptional()
  @IsString({ message: 'customAlias: Custom alias must be a string' })
  @IsNotEmpty({ message: 'customAlias: Custom alias cannot be empty' })
  @Length(3, 32, {
    message: 'customAlias: Custom alias must be between 3 and 32 characters',
  })
  @Matches(SHORT_URL_ALIAS_REGEX, {
    message:
      'customAlias: Custom alias can only contain lowercase letters, numbers, underscores, and hyphens',
  })
  customAlias?: string;
}

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

export class UpdateShortUrlDto {
  @ValidateIf((_object, value) => value !== undefined)
  @IsString({ message: 'longUrl: Long URL must be a string' })
  @IsNotEmpty({ message: 'longUrl: Long URL is required' })
  @MaxLength(2048, {
    message: 'longUrl: Long URL must not exceed 2048 characters',
  })
  @IsUrl(
    { require_protocol: true },
    { message: 'longUrl: Please provide a valid URL with protocol' },
  )
  longUrl?: string;

  @ValidateIf((_object, value) => value !== undefined)
  @IsString({ message: 'customAlias: Custom alias must be a string' })
  @IsNotEmpty({ message: 'customAlias: Custom alias cannot be empty' })
  @Length(3, 32, {
    message: 'customAlias: Custom alias must be between 3 and 32 characters',
  })
  @Matches(SHORT_URL_ALIAS_REGEX, {
    message:
      'customAlias: Custom alias can only contain lowercase letters, numbers, underscores, and hyphens',
  })
  customAlias?: string;
}
