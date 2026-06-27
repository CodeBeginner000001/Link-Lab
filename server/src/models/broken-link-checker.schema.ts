import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

export type BrokenLinkCheckerDocument = HydratedDocument<BrokenLinkChecker>;

export enum BrokenLinkCheckStatus {
  WORKING = 'working',
  BROKEN = 'broken',
  DELETED = 'deleted',
}

export enum BrokenLinkSafetyStatus {
  NO_KNOWN_THREAT = 'no_known_threat',
  UNSAFE = 'unsafe',
  UNCHECKED = 'unchecked',
}

@Schema({
  collection: 'broken_link_checks',
  timestamps: true,
  versionKey: false,
})
export class BrokenLinkChecker {
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
  url!: string;

  @Prop({
    required: true,
    trim: true,
  })
  finalUrl!: string;

  @Prop({
    type: Number,
    default: null,
  })
  statusCode?: number | null;

  @Prop({
    enum: BrokenLinkCheckStatus,
    default: BrokenLinkCheckStatus.WORKING,
    index: true,
  })
  status!: BrokenLinkCheckStatus;

  @Prop({
    type: Boolean,
    default: false,
    index: true,
  })
  isBroken!: boolean;

  @Prop({
    type: Boolean,
    default: false,
    index: true,
  })
  isUnsafe!: boolean;

  @Prop({
    enum: BrokenLinkSafetyStatus,
    default: BrokenLinkSafetyStatus.UNCHECKED,
    index: true,
  })
  safetyStatus!: BrokenLinkSafetyStatus;

  @Prop({
    type: String,
    default: null,
  })
  safetyProvider?: string | null;

  @Prop({
    type: [String],
    default: [],
  })
  threatTypes!: string[];

  @Prop({
    type: String,
    default: null,
  })
  contentType?: string | null;

  @Prop({
    type: Number,
    default: null,
  })
  contentLength?: number | null;

  @Prop({
    type: String,
    default: null,
  })
  contentDisposition?: string | null;

  @Prop({
    type: String,
    default: null,
  })
  errorMessage?: string | null;

  @Prop({
    type: Number,
    default: 0,
    min: 0,
  })
  redirectCount!: number;

  createdAt?: Date;
  updatedAt?: Date;
}

export const BrokenLinkCheckerSchema =
  SchemaFactory.createForClass(BrokenLinkChecker);

BrokenLinkCheckerSchema.index({ userId: 1, status: 1, _id: -1 });
BrokenLinkCheckerSchema.index({ userId: 1, safetyStatus: 1, _id: -1 });
BrokenLinkCheckerSchema.index({ userId: 1, createdAt: -1 });
