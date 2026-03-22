import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

function buildAvatarUrl(name: string, email: string): string {
  return `${process.env.BACKEND_URL}/avatar?name=${encodeURIComponent(name || email)}`;
}

@Schema({
  timestamps: true,
  versionKey: false,
  collection: 'users',
})
export class User {
  @Prop({
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 100,
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
    type: String,
    required: false,
    trim: true,
    default: null,
  })
  avatar!: string | null;

  @Prop({
    required: true,
    minlength: 6,
    select: false,
  })
  password!: string;

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
    this.avatar = buildAvatarUrl(this.name, this.email);
  }
});
