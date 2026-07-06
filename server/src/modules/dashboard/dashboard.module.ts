import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Barcode, BarcodeSchema } from 'src/models/barcode.schema';
import {
  BrokenLinkChecker,
  BrokenLinkCheckerSchema,
} from 'src/models/broken-link-checker.schema';
import { BulkBarcode, BulkBarcodeSchema } from 'src/models/bulk-barcode.schema';
import {
  LinkExpander,
  LinkExpanderSchema,
} from 'src/models/link-expander.schema';
import {
  OneTimeLink,
  OneTimeLinkSchema,
} from 'src/models/one-time-link.schema';
import { ShortUrl, ShortUrlSchema } from 'src/models/short-url.schema';
import { User, UserSchema } from 'src/models/user.schema';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ShortUrl.name, schema: ShortUrlSchema },
      { name: OneTimeLink.name, schema: OneTimeLinkSchema },
      { name: Barcode.name, schema: BarcodeSchema },
      { name: BulkBarcode.name, schema: BulkBarcodeSchema },
      { name: LinkExpander.name, schema: LinkExpanderSchema },
      { name: BrokenLinkChecker.name, schema: BrokenLinkCheckerSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
