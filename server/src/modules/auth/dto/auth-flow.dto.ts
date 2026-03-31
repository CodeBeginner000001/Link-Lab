import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum AuthFlowName {
  SIGNUP = 'signup',
  FORGOT_PASSWORD = 'forgot-password',
}

export class AuthFlowDto {
  @IsEnum(AuthFlowName, {
    message: 'Flow Name: flowName must be either signup or forgot-password',
  })
  flowName!: AuthFlowName;
}

export class RefreshTokenDto {
  @IsOptional()
  @IsString({ message: 'Refresh: Refresh token must be a string' })
  refreshToken?: string;
}
