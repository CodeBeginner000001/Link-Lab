import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateRedisHashDto {
  @IsString({ message: 'key must be a string' })
  @IsNotEmpty({ message: 'key is required' })
  key!: string;

  @IsObject({ message: 'value must be a valid object' })
  @IsNotEmpty({ message: 'value is required' })
  value!: Record<string, any>;

  @IsOptional()
  @IsInt({ message: 'ttlSeconds must be an integer number' })
  @Min(1, { message: 'ttlSeconds must be greater than 0' })
  ttlSeconds?: number;

  @IsOptional()
  @IsInt({ message: 'db must be an integer number' })
  @Min(0, { message: 'db must be 0 or greater' })
  db?: number;
}

export class UpdateRedisHashDto {
  @IsString({ message: 'key must be a string' })
  @IsNotEmpty({ message: 'key is required' })
  key!: string;

  @IsObject({ message: 'value must be a valid object' })
  @IsNotEmpty({ message: 'value is required' })
  value!: Record<string, any>;

  @IsOptional()
  @IsInt({ message: 'ttlSeconds must be an integer number' })
  @Min(1, { message: 'ttlSeconds must be greater than 0' })
  ttlSeconds?: number;

  @IsOptional()
  @IsBoolean({ message: 'preserveTtl must be a boolean value' })
  preserveTtl?: boolean;

  @IsOptional()
  @IsInt({ message: 'db must be an integer number' })
  @Min(0, { message: 'db must be 0 or greater' })
  db?: number;
}

export class UpdateRedisHashFieldsDto {
  @IsString({ message: 'key must be a string' })
  @IsNotEmpty({ message: 'key is required' })
  key!: string;

  @IsObject({ message: 'updates must be a valid object' })
  @IsNotEmpty({ message: 'updates is required' })
  updates!: Record<string, any>;

  @IsOptional()
  @IsInt({ message: 'db must be an integer number' })
  @Min(0, { message: 'db must be 0 or greater' })
  db?: number;

  @IsOptional()
  @IsBoolean({ message: 'preserveTtl must be a boolean value' })
  preserveTtl?: boolean;

  @IsOptional()
  @IsInt({ message: 'ttlSeconds must be an integer number' })
  @Min(1, { message: 'ttlSeconds must be greater than 0' })
  ttlSeconds?: number;
}

export class DeleteRedisHashFieldsDto {
  @IsString({ message: 'key must be a string' })
  @IsNotEmpty({ message: 'key is required' })
  key!: string;

  @IsArray({ message: 'fields must be an array' })
  @ArrayMinSize(1, { message: 'fields must contain at least one field name' })
  @IsString({ each: true, message: 'each field must be a string' })
  fields!: string[];

  @IsOptional()
  @IsInt({ message: 'db must be an integer number' })
  @Min(0, { message: 'db must be 0 or greater' })
  db?: number;
}

export class ExpireRedisHashDto {
  @IsString({ message: 'key must be a string' })
  @IsNotEmpty({ message: 'key is required' })
  key!: string;

  @IsInt({ message: 'ttlSeconds must be an integer number' })
  @Min(1, { message: 'ttlSeconds must be greater than 0' })
  ttlSeconds!: number;

  @IsOptional()
  @IsInt({ message: 'db must be an integer number' })
  @Min(0, { message: 'db must be 0 or greater' })
  db?: number;
}

export class RenameRedisHashDto {
  @IsString({ message: 'oldKey must be a string' })
  @IsNotEmpty({ message: 'oldKey is required' })
  oldKey!: string;

  @IsString({ message: 'newKey must be a string' })
  @IsNotEmpty({ message: 'newKey is required' })
  newKey!: string;

  @IsOptional()
  @IsInt({ message: 'db must be an integer number' })
  @Min(0, { message: 'db must be 0 or greater' })
  db?: number;
}
