import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import {
  DEFAULT_ONE_TIME_LINK_PAGE_LIMIT,
  MAX_ONE_TIME_LINK_PAGE_LIMIT,
} from '../one-time-link.constants';

export class CreateOneTimeLinkDto {
  @IsString({ message: 'originalUrl: URL must be a string' })
  @IsNotEmpty({ message: 'originalUrl: URL is required' })
  @MaxLength(2048, {
    message: 'originalUrl: URL must not exceed 2048 characters',
  })
  @IsUrl(
    { require_protocol: true },
    { message: 'originalUrl: Please provide a valid URL with protocol' },
  )
  originalUrl!: string;

  @IsOptional()
  @IsBoolean({
    message: 'passwordProtect: Password protection must be true or false',
  })
  passwordProtect?: boolean;

  @ValidateIf((object: CreateOneTimeLinkDto) => object.passwordProtect === true)
  @IsString({ message: 'password: Password must be a string' })
  @IsNotEmpty({ message: 'password: Password is required' })
  @MaxLength(128, {
    message: 'password: Password must not exceed 128 characters',
  })
  password?: string;
}

export class ResolveProtectedOneTimeLinkDto {
  @IsString({ message: 'password: Password must be a string' })
  @IsNotEmpty({ message: 'password: Password is required' })
  password!: string;
}

export class GetPaginatedOneTimeLinksDto {
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
  @Max(MAX_ONE_TIME_LINK_PAGE_LIMIT, {
    message: `limit: Limit must not exceed ${MAX_ONE_TIME_LINK_PAGE_LIMIT}`,
  })
  limit: number = DEFAULT_ONE_TIME_LINK_PAGE_LIMIT;
}
