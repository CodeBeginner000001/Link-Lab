import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';
import { SHORT_URL_ALIAS_REGEX } from '../urlShortener.constants';

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
