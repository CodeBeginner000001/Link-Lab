import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class ForgotPasswordDto {
  @IsNotEmpty({ message: 'Email: Email is required' })
  @IsEmail({}, { message: 'Email: Please enter a valid email address' })
  @MaxLength(255, { message: 'Email: Email must not exceed 255 characters' })
  email!: string;
}
export class ResetPasswordDto {
  @IsString({ message: 'Token: Reset token must be a string' })
  @IsNotEmpty({ message: 'Token: Reset token is required' })
  token!: string;

  @IsString({ message: 'Password: Password must be a string' })
  @IsNotEmpty({ message: 'Password: Password is required' })
  @MinLength(8, {
    message: 'Password: Password must be at least 8 characters long',
  })
  @MaxLength(50, {
    message: 'Password: Password must not exceed 50 characters',
  })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).+$/, {
    message:
      'Password: Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
  })
  password!: string;
}
