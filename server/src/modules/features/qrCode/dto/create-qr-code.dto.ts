import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import {
  BodyShape,
  EyeBallShape,
  EyeFrameShape,
  QrContentType,
} from 'src/interfaces/features/qr-code.enums';
import { QR_HEX_COLOR_REGEX } from '../qrCode.constants';

class CreateQrCodeStyleDto {
  @IsEnum(BodyShape, {
    message: 'style.bodyShape: Body shape is invalid',
  })
  bodyShape!: BodyShape;

  @IsEnum(EyeFrameShape, {
    message: 'style.eyeFrameShape: Eye frame shape is invalid',
  })
  eyeFrameShape!: EyeFrameShape;

  @IsEnum(EyeBallShape, {
    message: 'style.eyeBallShape: Eye ball shape is invalid',
  })
  eyeBallShape!: EyeBallShape;

  @Type(() => Number)
  @IsNumber(
    {
      allowInfinity: false,
      allowNaN: false,
      maxDecimalPlaces: 2,
    },
    { message: 'style.zoom: Zoom must be a valid number' },
  )
  @Min(0.5, { message: 'style.zoom: Zoom must be at least 0.5' })
  @Max(5, { message: 'style.zoom: Zoom must not exceed 5' })
  zoom!: number;

  @IsString({ message: 'style.foreground: Foreground color must be a string' })
  @Matches(QR_HEX_COLOR_REGEX, {
    message: 'style.foreground: Foreground color must be a valid hex color',
  })
  foreground!: string;

  @IsString({ message: 'style.background: Background color must be a string' })
  @Matches(QR_HEX_COLOR_REGEX, {
    message: 'style.background: Background color must be a valid hex color',
  })
  background!: string;
}

export class CreateQrCodeDto {
  @IsEnum(QrContentType, {
    message: 'contentType: Content type is invalid',
  })
  contentType!: QrContentType;

  @IsString({ message: 'content: Content must be a string' })
  @IsNotEmpty({ message: 'content: Content is required' })
  @MaxLength(4096, {
    message: 'content: Content must not exceed 4096 characters',
  })
  content!: string;

  @IsObject({ message: 'style: Style must be an object' })
  @ValidateNested()
  @Type(() => CreateQrCodeStyleDto)
  style!: CreateQrCodeStyleDto;
}
