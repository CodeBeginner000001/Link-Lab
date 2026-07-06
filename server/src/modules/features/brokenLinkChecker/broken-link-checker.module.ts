import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  BrokenLinkChecker,
  BrokenLinkCheckerSchema,
} from 'src/models/broken-link-checker.schema';
import { User, UserSchema } from 'src/models/user.schema';
import { BrokenLinkCheckerController } from './broken-link-checker.controller';
import { BrokenLinkCheckerService } from './broken-link-checker.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: BrokenLinkChecker.name, schema: BrokenLinkCheckerSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [BrokenLinkCheckerController],
  providers: [BrokenLinkCheckerService],
})
export class BrokenLinkCheckerModule {}
