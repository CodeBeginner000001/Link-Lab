import { IsEnum } from 'class-validator';
import { QrExportType } from 'src/interfaces/features/qr-code.enums';

export class ExportQrCodeDto {
  @IsEnum(QrExportType, {
    message: 'exportType: Export type is invalid',
  })
  exportType!: QrExportType;
}
