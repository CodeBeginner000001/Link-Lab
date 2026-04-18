import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import { SHORT_URL_ALIAS_REGEX } from '../modules/features/urlShortener/urlShortener.constants';

export type ShortUrlDocument = HydratedDocument<ShortUrl>;

export enum ShortUrlStatus {
  ACTIVE = 'active',
  DISABLED = 'disabled',
}

@Schema({
  collection: 'short_urls',
  timestamps: true,
  versionKey: false,
})
export class ShortUrl {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  userId!: Types.ObjectId;

  @Prop({
    type: String,
    default: null,
    index: true,
  })
  requestBodyHash!: string | null;

  @Prop({
    required: true,
    trim: true,
  })
  longUrl!: string;

  @Prop({
    required: true,
    trim: true,
    lowercase: true,
    unique: true,
    index: true,
    minlength: 3,
    maxlength: 32,
    match: SHORT_URL_ALIAS_REGEX,
  })
  alias!: string;

  @Prop({
    enum: ShortUrlStatus,
    default: ShortUrlStatus.ACTIVE,
    index: true,
  })
  status!: ShortUrlStatus;

  @Prop({
    type: Number,
    default: 0,
    min: 0,
  })
  clicksPersisted!: number;

  @Prop({
    type: Date,
    default: null,
  })
  lastClickedAt?: Date | null;

  createdAt?: Date;
  updatedAt?: Date;
}

export const ShortUrlSchema = SchemaFactory.createForClass(ShortUrl);

ShortUrlSchema.index({ userId: 1, createdAt: -1 });
ShortUrlSchema.index({ userId: 1, status: 1, _id: -1 });
ShortUrlSchema.index({ alias: 1, status: 1 });
ShortUrlSchema.index({ userId: 1, requestBodyHash: 1, status: 1 });
