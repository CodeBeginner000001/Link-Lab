import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Length,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class SignupDto {
  @IsNotEmpty({ message: 'Name: Name is required' })
  @IsString({ message: 'Name: Name must be a string' })
  @MinLength(2, { message: 'Name: Name must be at least 2 characters long' })
  @MaxLength(100, { message: 'Name: Name must not exceed 100 characters' })
  name!: string;

  @IsNotEmpty({ message: 'Email: Email is required' })
  @IsEmail({}, { message: 'Email: Please enter a valid email address' })
  @MaxLength(255)
  email!: string;

  @IsNotEmpty({ message: 'Password: Password is required' })
  @IsString({ message: 'Password: Password must be a string' })
  @MinLength(8, {
    message: 'Password: Password must be at least 8 characters long',
  })
  @MaxLength(50, {
    message: 'Password: Password must not exceed 50 characters',
  })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).+$/, {
    message:
      'Password: Password must contain at least uppercase letter, lowercase letter, number, and special character',
  })
  password!: string;
}

export class VerifyOtpDto {
  @IsString({ message: 'OTP must be a string' })
  @IsNotEmpty({ message: 'OTP is required' })
  @Length(6, 6, { message: 'OTP must be exactly 6 digits' })
  @Matches(/^\d{6}$/, { message: 'OTP must contain only numbers' })
  otp!: string;
}

export class LoginDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  @MaxLength(255)
  email!: string;

  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(50, { message: 'Password must not exceed 50 characters' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).+$/, {
    message:
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
  })
  password!: string;
}
