import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  LinkExpander,
  LinkExpanderSchema,
} from 'src/models/link-expander.schema';
import { User, UserSchema } from 'src/models/user.schema';
import { LinkExpanderController } from './link-expander.controller';
import { LinkExpanderService } from './link-expander.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: LinkExpander.name, schema: LinkExpanderSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [LinkExpanderController],
  providers: [LinkExpanderService],
})
export class LinkExpanderModule {}
