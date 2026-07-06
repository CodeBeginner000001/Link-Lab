import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import { ONE_TIME_LINK_ALIAS_REGEX } from '../modules/features/oneTimeLink/one-time-link.constants';

export type OneTimeLinkDocument = HydratedDocument<OneTimeLink>;

export enum OneTimeLinkStatus {
  ACTIVE = 'active',
  USED = 'used',
  DELETED = 'deleted',
}

@Schema({
  collection: 'one_time_links',
  timestamps: true,
  versionKey: false,
})
export class OneTimeLink {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  userId!: Types.ObjectId;

  @Prop({
    required: true,
    trim: true,
  })
  originalUrl!: string;

  @Prop({
    required: true,
    trim: true,
    lowercase: true,
    unique: true,
    index: true,
    minlength: 3,
    maxlength: 32,
    match: ONE_TIME_LINK_ALIAS_REGEX,
  })
  alias!: string;

  @Prop({
    enum: OneTimeLinkStatus,
    default: OneTimeLinkStatus.ACTIVE,
    index: true,
  })
  status!: OneTimeLinkStatus;

  @Prop({
    type: Boolean,
    default: false,
  })
  passwordProtected!: boolean;

  @Prop({
    type: String,
    default: null,
  })
  passwordHash?: string | null;

  @Prop({
    type: Date,
    default: null,
  })
  usedAt?: Date | null;

  @Prop({
    type: Date,
    default: null,
  })
  deletedAt?: Date | null;

  createdAt?: Date;
  updatedAt?: Date;
}

export const OneTimeLinkSchema = SchemaFactory.createForClass(OneTimeLink);

OneTimeLinkSchema.index({ userId: 1, createdAt: -1 });
OneTimeLinkSchema.index({ userId: 1, status: 1, _id: -1 });
OneTimeLinkSchema.index({ alias: 1, status: 1 });
