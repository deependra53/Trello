import mongoose, {
  Schema,
  type InferSchemaType,
  type HydratedDocument,
  type Model,
} from 'mongoose';
import { BOARD_ROLES } from './board.model.js';

export const BOARD_INVITE_KINDS = ['link', 'email'] as const;
export type BoardInviteKind = (typeof BOARD_INVITE_KINDS)[number];

export const BOARD_INVITE_STATUSES = ['pending', 'accepted', 'revoked'] as const;
export type BoardInviteStatus = (typeof BOARD_INVITE_STATUSES)[number];

const boardInviteSchema = new Schema(
  {
    boardId: { type: Schema.Types.ObjectId, ref: 'Board', required: true, index: true },
    // Stored so accepters can be attached to the org even if they aren't members yet.
    workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
    kind: { type: String, enum: BOARD_INVITE_KINDS, required: true },
    // email invites only — the address the link was sent to.
    email: { type: String, lowercase: true, trim: true, default: null },
    role: { type: String, enum: BOARD_ROLES, default: 'member' },
    // 'link' kind keeps the raw token so admins can re-copy it (it's a shared secret).
    token: { type: String, index: true, sparse: true, default: null },
    // 'email' kind hashes the token — it is only ever shown once, in the email.
    tokenHash: { type: String, index: true, sparse: true, default: null },
    invitedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: BOARD_INVITE_STATUSES, default: 'pending' },
    // null = never expires (used for the reusable share link).
    expiresAt: { type: Date, default: null },
  },
  { timestamps: true },
);

boardInviteSchema.index({ boardId: 1, email: 1, status: 1 });

export type BoardInviteType = InferSchemaType<typeof boardInviteSchema>;
export type BoardInviteDoc = HydratedDocument<BoardInviteType>;

export const BoardInvite: Model<BoardInviteType> =
  (mongoose.models.BoardInvite as Model<BoardInviteType> | undefined) ??
  mongoose.model<BoardInviteType>('BoardInvite', boardInviteSchema);
