import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BulkBarcode, BulkBarcodeSchema } from 'src/models/bulk-barcode.schema';
import { User, UserSchema } from 'src/models/user.schema';
import { BarcodeRendererService } from '../barcodeGenerator/barcode-renderer.service';
import { BulkBarcodeGeneratorController } from './bulk-barcode-generator.controller';
import { BulkBarcodeExportService } from './bulk-barcode-export.service';
import { BulkBarcodeParserService } from './bulk-barcode-parser.service';
import { BulkBarcodeGeneratorService } from './bulk-barcode-generator.service';
import { BulkBarcodeTemplateService } from './bulk-barcode-template.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: BulkBarcode.name, schema: BulkBarcodeSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [BulkBarcodeGeneratorController],
  providers: [
    BulkBarcodeGeneratorService,
    BulkBarcodeExportService,
    BulkBarcodeParserService,
    BulkBarcodeTemplateService,
    BarcodeRendererService,
  ],
})
export class BulkBarcodeGeneratorModule {}
