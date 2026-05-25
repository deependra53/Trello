import mongoose, { Schema, type InferSchemaType, type HydratedDocument, type Model } from 'mongoose';

const refreshTokenSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    tokenHash: { type: String, required: true, index: true },
    userAgent: { type: String },
    ip: { type: String },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date },
    replacedBy: { type: String },
  },
  { timestamps: true },
);

// Auto-delete expired tokens
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export type RefreshTokenType = InferSchemaType<typeof refreshTokenSchema>;
export type RefreshTokenDoc = HydratedDocument<RefreshTokenType>;

export const RefreshToken: Model<RefreshTokenType> =
  (mongoose.models.RefreshToken as Model<RefreshTokenType> | undefined) ??
  mongoose.model<RefreshTokenType>('RefreshToken', refreshTokenSchema);
