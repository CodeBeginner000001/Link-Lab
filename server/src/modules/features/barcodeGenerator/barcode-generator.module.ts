import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Barcode, BarcodeSchema } from 'src/models/barcode.schema';
import { User, UserSchema } from 'src/models/user.schema';
import { BarcodeGeneratorController } from './barcode-generator.controller';
import { BarcodeGeneratorService } from './barcode-generator.service';
import { BarcodeRendererService } from './barcode-renderer.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Barcode.name, schema: BarcodeSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [BarcodeGeneratorController],
  providers: [BarcodeGeneratorService, BarcodeRendererService],
})
export class BarcodeGeneratorModule {}
