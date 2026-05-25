import mongoose, { Schema, type InferSchemaType, type HydratedDocument, type Model } from 'mongoose';

const preferencesSchema = new Schema(
  {
    theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
    language: { type: String, default: 'en' },
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      mentions: { type: Boolean, default: true },
      cardActivity: { type: Boolean, default: true },
      dueReminders: { type: Boolean, default: true },
    },
  },
  { _id: false },
);

const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true, select: false },
    fullName: { type: String, required: true, trim: true },
    avatarUrl: { type: String },
    emailVerified: { type: Boolean, default: false },
    verificationToken: { type: String, select: false },
    verificationExpires: { type: Date, select: false },
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpires: { type: Date, select: false },
    preferences: { type: preferencesSchema, default: () => ({}) },
    lastLoginAt: { type: Date },
  },
  { timestamps: true },
);

userSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret: Record<string, unknown>) => {
    delete ret.passwordHash;
    delete ret.verificationToken;
    delete ret.verificationExpires;
    delete ret.resetPasswordToken;
    delete ret.resetPasswordExpires;
    return ret;
  },
});

export type UserType = InferSchemaType<typeof userSchema>;
export type UserDoc = HydratedDocument<UserType>;

export const User: Model<UserType> =
  (mongoose.models.User as Model<UserType> | undefined) ??
  mongoose.model<UserType>('User', userSchema);
