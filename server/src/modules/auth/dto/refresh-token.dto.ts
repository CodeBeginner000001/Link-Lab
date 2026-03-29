import { IsOptional, IsString } from 'class-validator';

export class RefreshTokenDto {
  @IsOptional()
  @IsString({ message: 'Refresh: Refresh token must be a string' })
  refreshToken?: string;
}
