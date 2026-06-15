import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import {
  BarcodeDownloadType,
  BarcodeFormat,
  BarcodeStatus,
} from '../modules/features/barcodeGenerator/barcode-generator.constants';

export type BarcodeDocument = HydratedDocument<Barcode>;

export type BarcodeDownloadCounts = {
  svg: number;
  png: number;
};

@Schema({
  collection: 'barcodes',
  timestamps: true,
  versionKey: false,
})
export class Barcode {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  userId!: Types.ObjectId;

  @Prop({
    type: String,
    enum: BarcodeFormat,
    required: true,
    index: true,
  })
  format!: BarcodeFormat;

  @Prop({
    type: String,
    required: true,
    trim: true,
    maxlength: 256,
  })
  content!: string;

  @Prop({ type: Number, required: true, min: 1, max: 5 })
  barWidth!: number;

  @Prop({ type: Number, required: true, min: 40, max: 300 })
  height!: number;

  @Prop({ type: Number, required: true, min: 0, max: 100 })
  margin!: number;

  @Prop({ type: String, required: true })
  barColor!: string;

  @Prop({ type: String, required: true })
  backgroundColor!: string;

  @Prop({ type: Boolean, required: true })
  showValue!: boolean;

  @Prop({ type: String, default: null })
  requestBodyHash!: string | null;

  @Prop({ type: String, required: true })
  svg!: string;

  @Prop({
    type: String,
    enum: BarcodeStatus,
    default: BarcodeStatus.ACTIVE,
    index: true,
  })
  status!: BarcodeStatus;

  @Prop({ type: Date, default: null })
  deletedAt?: Date | null;

  @Prop({
    type: {
      svg: { type: Number, default: 0, min: 0 },
      png: { type: Number, default: 0, min: 0 },
    },
    default: () => ({ svg: 0, png: 0 }),
    _id: false,
  })
  downloadCounts!: BarcodeDownloadCounts;

  @Prop({ type: Number, default: 0, min: 0 })
  totalDownloads!: number;

  @Prop({
    type: String,
    enum: BarcodeDownloadType,
    default: null,
  })
  lastDownloadType?: BarcodeDownloadType | null;

  @Prop({ type: Date, default: null })
  lastDownloadedAt?: Date | null;

  createdAt?: Date;
  updatedAt?: Date;
}

export const BarcodeSchema = SchemaFactory.createForClass(Barcode);

BarcodeSchema.index({ userId: 1, createdAt: -1 });
BarcodeSchema.index({ userId: 1, format: 1, createdAt: -1 });
BarcodeSchema.index({ userId: 1, status: 1, createdAt: -1 });
BarcodeSchema.index(
  { userId: 1, requestBodyHash: 1 },
  {
    unique: true,
    partialFilterExpression: {
      requestBodyHash: { $type: 'string' },
    },
  },
);
