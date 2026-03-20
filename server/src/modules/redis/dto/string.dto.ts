import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateRedisKeyDto {
  @IsString({ message: 'key must be a string' })
  @IsNotEmpty({ message: 'key is required' })
  key!: string;

  @IsNotEmpty({ message: 'value is required' })
  value!: any;

  @IsOptional()
  @IsInt({ message: 'ttlSeconds must be an integer number' })
  @Min(1, { message: 'ttlSeconds must be greater than 0' })
  ttlSeconds?: number;

  @IsOptional()
  @IsInt({ message: 'db must be an integer number' })
  @Min(0, { message: 'db must be 0 or greater' })
  db?: number;
}

export class UpdateRedisKeyDto {
  @IsString({ message: 'key must be a string' })
  @IsNotEmpty({ message: 'key is required' })
  key!: string;

  @IsNotEmpty({ message: 'value is required' })
  value!: any;

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

export class UpdateRedisFieldsDto {
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

export class ExpireRedisKeyDto {
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

export class RenameRedisKeyDto {
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
