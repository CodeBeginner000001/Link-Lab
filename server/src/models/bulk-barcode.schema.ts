import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import { BarcodeFormat } from '../modules/features/barcodeGenerator/barcode-generator.constants';

export type BulkBarcodeDocument = HydratedDocument<BulkBarcode>;
export type BulkBarcodeItemDocument = HydratedDocument<BulkBarcodeItem>;

export enum BulkBarcodeStatus {
  COMPLETED = 'completed',
  DELETED = 'deleted',
}

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

  @Prop({ type: Date, default: null })
  deletedAt?: Date | null;

  createdAt?: Date;
  updatedAt?: Date;
}

export const BulkBarcodeSchema = SchemaFactory.createForClass(BulkBarcode);

BulkBarcodeSchema.index({ userId: 1, status: 1, createdAt: -1 });

@Schema({
  collection: 'bulk_barcode_items',
  timestamps: true,
  versionKey: false,
})
export class BulkBarcodeItem {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'BulkBarcode',
    required: true,
    index: true,
  })
  bulkBarcodeId!: Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  userId!: Types.ObjectId;

  @Prop({ type: Number, required: true, min: 1 })
  row!: number;

  @Prop({ type: String, required: true, trim: true })
  content!: string;

  @Prop({
    type: String,
    enum: BarcodeFormat,
    required: true,
    index: true,
  })
  format!: BarcodeFormat;

  @Prop({ type: String, default: null })
  label?: string | null;

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
  svg?: string | null;

  createdAt?: Date;
  updatedAt?: Date;
}

export const BulkBarcodeItemSchema =
  SchemaFactory.createForClass(BulkBarcodeItem);

BulkBarcodeItemSchema.index({ bulkBarcodeId: 1, row: 1 }, { unique: true });
BulkBarcodeItemSchema.index({ userId: 1, bulkBarcodeId: 1, row: 1 });
