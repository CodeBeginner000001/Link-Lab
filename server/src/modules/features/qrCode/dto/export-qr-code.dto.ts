import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, ValidateNested } from 'class-validator';
import { QrExportType } from 'src/interfaces/features/qr-code.enums';

class ExportQrRenderDto {
  @IsNumber()
  width!: number;

  @IsNumber()
  height!: number;

  @IsNumber()
  previewModules!: number;

  @IsNumber()
  moduleSize!: number;

  @IsNumber()
  qrSize!: number;

  @IsNumber()
  offsetX!: number;

  @IsNumber()
  offsetY!: number;

  @IsNumber()
  cornerRadius!: number;
}

export class ExportQrCodeDto {
  @IsEnum(QrExportType, {
    message: 'exportType: Export type is invalid',
  })
  exportType!: QrExportType;

  @IsOptional()
  @ValidateNested()
  @Type(() => ExportQrRenderDto)
  render?: ExportQrRenderDto;
}
