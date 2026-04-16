import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ShortUrl, ShortUrlSchema } from 'src/models/short-url.schema';
import { UrlShortenerController } from './urlShortener.controller';
import { UrlShortenerService } from './urlShortener.service';
import { UrlShortenerRedirectController } from './urlShortenerRedirect.controller';
import { User, UserSchema } from 'src/models/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: ShortUrl.name,
        schema: ShortUrlSchema,
      },
      {
        name: User.name,
        schema: UserSchema,
      },
    ]),
  ],
  controllers: [UrlShortenerController, UrlShortenerRedirectController],
  providers: [UrlShortenerService],
  exports: [MongooseModule],
})
export class UrlShortenerModule {}
