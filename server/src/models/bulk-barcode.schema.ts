import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import { BarcodeFormat } from '../modules/features/barcodeGenerator/barcode-generator.constants';

export type BulkBarcodeDocument = HydratedDocument<BulkBarcode>;

export enum BulkBarcodeStatus {
  COMPLETED = 'completed',
  DELETED = 'deleted',
}

export type BulkBarcodeItem = {
  row: number;
  content: string;
  format: BarcodeFormat;
  label?: string | null;
  svg: string;
};

export type BulkBarcodeDownloadCounts = {
  zip: number;
  pdf: number;
};

export enum BulkBarcodeDownloadType {
  ZIP = 'zip',
  PDF = 'pdf',
}

@Schema({
  collection: 'bulk_barcodes',
  timestamps: true,
  versionKey: false,
})
export class BulkBarcode {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  userId!: Types.ObjectId;

  @Prop({ type: String, required: true, trim: true })
  fileName!: string;

  @Prop({ type: Number, required: true, min: 0 })
  totalRows!: number;

  @Prop({ type: Number, required: true, min: 0 })
  generatedCount!: number;

  @Prop({ type: Number, required: true, min: 0 })
  failedCount!: number;

  @Prop({
    type: {
      zip: { type: Number, default: 0, min: 0 },
      pdf: { type: Number, default: 0, min: 0 },
    },
    default: () => ({ zip: 0, pdf: 0 }),
    _id: false,
  })
  downloadCounts!: BulkBarcodeDownloadCounts;

  @Prop({ type: Number, default: 0, min: 0 })
  totalDownloads!: number;

  @Prop({
    type: String,
    enum: BulkBarcodeDownloadType,
    default: null,
  })
  lastDownloadType?: BulkBarcodeDownloadType | null;

  @Prop({ type: Date, default: null })
  lastDownloadedAt?: Date | null;

  @Prop({
    type: String,
    enum: BulkBarcodeStatus,
    default: BulkBarcodeStatus.COMPLETED,
    index: true,
  })
  status!: BulkBarcodeStatus;

  @Prop({
    type: [
      {
        row: { type: Number, required: true },
        content: { type: String, required: true, trim: true },
        format: { type: String, enum: BarcodeFormat, required: true },
        label: { type: String, default: null },
        svg: { type: String, required: true },
      },
    ],
    default: [],
    _id: false,
  })
  items!: BulkBarcodeItem[];

  @Prop({ type: Date, default: null })
  deletedAt?: Date | null;

  createdAt?: Date;
  updatedAt?: Date;
}

export const BulkBarcodeSchema = SchemaFactory.createForClass(BulkBarcode);

BulkBarcodeSchema.index({ userId: 1, status: 1, createdAt: -1 });
