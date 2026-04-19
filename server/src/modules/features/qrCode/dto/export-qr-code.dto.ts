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

export class ExportQrCodeQueryDto {
  @IsEnum(QrExportType, {
    message: 'exportType: Export type is invalid',
  })
  exportType!: QrExportType;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  width?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  height?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  previewModules?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  moduleSize?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  qrSize?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  offsetX?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  offsetY?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  cornerRadius?: number;

  toExportDto(): ExportQrCodeDto {
    const hasFullRenderConfig = [
      this.width,
      this.height,
      this.previewModules,
      this.moduleSize,
      this.qrSize,
      this.offsetX,
      this.offsetY,
      this.cornerRadius,
    ].every((value) => typeof value === 'number');

    return {
      exportType: this.exportType,
      render: hasFullRenderConfig
        ? {
            width: this.width!,
            height: this.height!,
            previewModules: this.previewModules!,
            moduleSize: this.moduleSize!,
            qrSize: this.qrSize!,
            offsetX: this.offsetX!,
            offsetY: this.offsetY!,
            cornerRadius: this.cornerRadius!,
          }
        : undefined,
    };
  }
}
