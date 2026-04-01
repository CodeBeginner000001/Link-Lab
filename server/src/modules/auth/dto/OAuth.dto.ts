import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
} from 'class-validator';

export class GithubExchangeDto {
  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsUrl()
  avatar?: string;

  @IsOptional()
  @IsIn(['github'])
  @IsString()
  provider?: 'github';

  @IsString()
  @IsNotEmpty()
  providerUserId!: string;
}
