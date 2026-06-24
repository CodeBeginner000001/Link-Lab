import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  OneTimeLink,
  OneTimeLinkSchema,
} from 'src/models/one-time-link.schema';
import { User, UserSchema } from 'src/models/user.schema';
import { OneTimeLinkController } from './one-time-link.controller';
import { OneTimeLinkRedirectController } from './one-time-link-redirect.controller';
import { OneTimeLinkService } from './one-time-link.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: OneTimeLink.name, schema: OneTimeLinkSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [OneTimeLinkController, OneTimeLinkRedirectController],
  providers: [OneTimeLinkService],
})
export class OneTimeLinkModule {}
