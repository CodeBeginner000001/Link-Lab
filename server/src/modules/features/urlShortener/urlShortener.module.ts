import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ShortUrl, ShortUrlSchema } from 'src/models/short-url.schema';
import { UrlShortenerController } from './urlShortener.controller';
import { UrlShortenerService } from './urlShortener.service';
import { UrlShortenerRedirectController } from './urlShortenerRedirect.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: ShortUrl.name,
        schema: ShortUrlSchema,
      },
    ]),
  ],
  controllers: [UrlShortenerController, UrlShortenerRedirectController],
  providers: [UrlShortenerService],
})
export class UrlShortenerModule {}
