import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;
export type AuthProvider = 'local' | 'github';

function buildAvatarUrl(name: string, email: string): string {
  return `${process.env.BACKEND_URL}/v1/avatar?name=${encodeURIComponent(name || email)}`;
}

@Schema({
  timestamps: true,
  versionKey: false,
  collection: 'users',
})
export class User {
  @Prop({
    trim: true,
    required: true,
    minlength: 2,
    maxlength: 100,
    index: false,
  })
  name!: string;

  @Prop({
    required: true,
    trim: true,
    lowercase: true,
    unique: true,
    index: true,
  })
  email!: string;

  @Prop({
    trim: true,
    type: String,
    required: false,
    default: null,
    index: false,
  })
  avatar?: string | null;

  @Prop({
    trim: true,
    enum: ['local', 'github'],
    default: 'local',
  })
  provider?: AuthProvider;

  @Prop({
    trim: true,
    type: String,
    default: null,
    unique: true,
    sparse: true,
    index: true,
  })
  providerUserId?: string | null;

  @Prop({
    type: Boolean,
    default: false,
  })
  isEmailVerified?: boolean;

  @Prop({
    type: Date,
    default: null,
  })
  lastLoginAt?: Date | null;

  @Prop({
    required: false,
    minlength: 8,
    select: false,
  })
  password?: string;

  createdAt?: Date;
  updatedAt?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.index({ createdAt: -1 });

UserSchema.pre('save', function () {
  if (this.email) {
    this.email = this.email.trim().toLowerCase();
  }

  if (!this.avatar) {
    const backendUrl = process.env.BACKEND_URL;

    if (!backendUrl) {
      throw new Error('BACKEND_URL is not configured');
    }

    this.avatar = buildAvatarUrl(this.name, this.email);
  }
});
