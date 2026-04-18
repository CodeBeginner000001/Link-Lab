import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { QrCode, QrCodeSchema } from 'src/models/qr-code.schema';
import { User, UserSchema } from 'src/models/user.schema';
import { QrCodeController } from './qrCode.controller';
import { QrCodeRedirectController } from './qrCodeRedirect.controller';
import { QrCodeService } from './qrCode.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: QrCode.name,
        schema: QrCodeSchema,
      },
      {
        name: User.name,
        schema: UserSchema,
      },
    ]),
  ],
  controllers: [QrCodeController, QrCodeRedirectController],
  providers: [QrCodeService],
  exports: [MongooseModule],
})
export class QrCodeModule {}
