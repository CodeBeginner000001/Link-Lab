import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import {
  BodyShape,
  EyeFrameShape,
  EyeBallShape,
  QrExportType,
  QrTraceability,
  QrContentType,
  QrStatus,
} from 'src/interfaces/features/qr-code.enums';

export type QrCodeDocument = HydratedDocument<QrCode>;

@Schema({ _id: false, versionKey: false })
class QrStyleConfig {
  @Prop({ type: String, enum: BodyShape, required: true })
  bodyShape!: BodyShape;

  @Prop({ type: String, enum: EyeFrameShape, required: true })
  eyeFrameShape!: EyeFrameShape;

  @Prop({ type: String, enum: EyeBallShape, required: true })
  eyeBallShape!: EyeBallShape;

  @Prop({ type: Number, required: true, min: 0.5, max: 5, default: 1 })
  zoom!: number;

  @Prop({ type: String, required: true, default: '#000000' })
  foreground!: string;

  @Prop({ type: String, required: true, default: '#FFFFFF' })
  background!: string;
}

@Schema({ _id: false, versionKey: false })
class QrExportBreakdown {
  @Prop({ type: Number, default: 0, min: 0 })
  png!: number;

  @Prop({ type: Number, default: 0, min: 0 })
  jpg!: number;

  @Prop({ type: Number, default: 0, min: 0 })
  jpeg!: number;

  @Prop({ type: Number, default: 0, min: 0 })
  svg!: number;

  @Prop({ type: Number, default: 0, min: 0 })
  webp!: number;

  @Prop({ type: Number, default: 0, min: 0 })
  pdf!: number;

  @Prop({ type: Number, default: 0, min: 0 })
  copy!: number;
}

@Schema({ _id: false, versionKey: false })
class QrExportStats {
  @Prop({ type: Number, required: true, default: 0, min: 0 })
  totalCount!: number;

  @Prop({ type: QrExportBreakdown, required: true, default: () => ({}) })
  byType!: QrExportBreakdown;

  @Prop({ type: Date, default: null })
  lastExportedAt!: Date | null;

  @Prop({ type: String, enum: QrExportType, default: null })
  lastExportType!: QrExportType | null;

  @Prop({ type: Date, default: null })
  lastCopiedAt!: Date | null;
}

@Schema({ _id: false, versionKey: false })
class QrTrackingStats {
  @Prop({ type: Boolean, required: true, default: false })
  isTraceable!: boolean;

  @Prop({
    type: String,
    enum: QrTraceability,
    required: true,
    default: QrTraceability.NON_TRACEABLE,
  })
  traceability!: QrTraceability;

  @Prop({
    type: String,
    required: true,
    default: 'Content does not pass through backend.',
  })
  traceabilityReason!: string;

  @Prop({ type: Boolean, required: true, default: false })
  passesThroughBackend!: boolean;

  @Prop({ type: Number, required: true, default: 0, min: 0 })
  totalScanCount!: number;

  @Prop({ type: Date, default: null })
  lastScannedAt!: Date | null;
}

@Schema({ _id: false, versionKey: false })
class QrGeneratedMeta {
  @Prop({ type: String, default: null })
  qrValue!: string | null;
}

@Schema({ _id: false, versionKey: false })
class QrContentMeta {
  @Prop({ type: String, enum: QrContentType, required: true, index: true })
  type!: QrContentType;
}

@Schema({
  timestamps: true,
  versionKey: false,
  collection: 'qr_codes',
})
export class QrCode {
  @Prop({ type: String, required: true, unique: true, index: true })
  publicId!: string;

  @Prop({ type: String, required: true, index: true })
  userId!: string;

  @Prop({ type: String, default: null, index: true })
  requestBodyHash!: string | null;

  @Prop({ type: QrContentMeta, required: true })
  contentMeta!: QrContentMeta;

  @Prop({ type: String, required: true })
  content!: string;

  @Prop({ type: QrStyleConfig, required: true })
  style!: QrStyleConfig;

  @Prop({ type: QrGeneratedMeta, required: true, default: () => ({}) })
  generated!: QrGeneratedMeta;

  @Prop({ type: QrExportStats, required: true, default: () => ({}) })
  exports!: QrExportStats;

  @Prop({ type: QrTrackingStats, required: true, default: () => ({}) })
  tracking!: QrTrackingStats;

  @Prop({
    type: String,
    enum: QrStatus,
    required: true,
    default: QrStatus.ACTIVE,
    index: true,
  })
  status!: QrStatus;

  @Prop({ type: Date, default: null, index: true })
  deletedAt!: Date | null;

  @Prop({ type: Date, default: null, index: true })
  lastActivityAt!: Date | null;

  createdAt?: Date;
  updatedAt?: Date;
}

export const QrCodeSchema = SchemaFactory.createForClass(QrCode);

QrCodeSchema.index({ userId: 1, 'contentMeta.type': 1, status: 1 });
QrCodeSchema.index({ userId: 1, createdAt: -1 });
QrCodeSchema.index({ userId: 1, status: 1, createdAt: -1, publicId: -1 });
QrCodeSchema.index({ 'tracking.isTraceable': 1, status: 1 });
QrCodeSchema.index({ userId: 1, requestBodyHash: 1, status: 1 });
