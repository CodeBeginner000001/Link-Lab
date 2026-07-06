import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

export type LinkExpanderDocument = HydratedDocument<LinkExpander>;

export enum LinkExpanderLookupStatus {
  SUCCESS = 'success',
  FAILED = 'failed',
  DELETED = 'deleted',
}

@Schema({
  collection: 'link_expanders',
  timestamps: true,
  versionKey: false,
})
export class LinkExpander {
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
  destinationUrl!: string;

  @Prop({
    enum: LinkExpanderLookupStatus,
    default: LinkExpanderLookupStatus.SUCCESS,
    index: true,
  })
  status!: LinkExpanderLookupStatus;

  @Prop({
    type: Number,
    default: 0,
    min: 0,
  })
  redirectCount!: number;

  @Prop({
    type: String,
    default: null,
  })
  errorMessage?: string | null;

  createdAt?: Date;
  updatedAt?: Date;
}

export const LinkExpanderSchema = SchemaFactory.createForClass(LinkExpander);

LinkExpanderSchema.index({ userId: 1, status: 1, _id: -1 });
LinkExpanderSchema.index(
  { userId: 1, url: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: {
        $in: [
          LinkExpanderLookupStatus.SUCCESS,
          LinkExpanderLookupStatus.FAILED,
        ],
      },
    },
  },
);
