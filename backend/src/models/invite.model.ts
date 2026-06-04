import mongoose, {
  Schema,
  type InferSchemaType,
  type HydratedDocument,
  type Model,
} from 'mongoose';

export const INVITE_ROLES = ['admin', 'member', 'guest'] as const;
export type InviteRole = (typeof INVITE_ROLES)[number];

export const INVITE_STATUSES = ['pending', 'accepted', 'revoked'] as const;
export type InviteStatus = (typeof INVITE_STATUSES)[number];

const inviteSchema = new Schema(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    role: { type: String, enum: INVITE_ROLES, default: 'member' },
    tokenHash: { type: String, required: true, index: true },
    invitedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: INVITE_STATUSES, default: 'pending' },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true },
);

inviteSchema.index({ workspaceId: 1, email: 1, status: 1 });

export type InviteType = InferSchemaType<typeof inviteSchema>;
export type InviteDoc = HydratedDocument<InviteType>;

export const Invite: Model<InviteType> =
  (mongoose.models.Invite as Model<InviteType> | undefined) ??
  mongoose.model<InviteType>('Invite', inviteSchema);
