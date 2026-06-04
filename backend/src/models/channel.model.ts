import mongoose, {
  Schema,
  type InferSchemaType,
  type HydratedDocument,
  type Model,
} from 'mongoose';

export const CHANNEL_KINDS = ['channel', 'dm'] as const;
export type ChannelKind = (typeof CHANNEL_KINDS)[number];

export const CHANNEL_MEMBER_ROLES = ['owner', 'member'] as const;
export type ChannelMemberRole = (typeof CHANNEL_MEMBER_ROLES)[number];

const channelMemberSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: CHANNEL_MEMBER_ROLES, default: 'member' },
    joinedAt: { type: Date, default: Date.now },
    // Watermark used to compute unread counts (messages newer than this are unread).
    lastReadAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const channelSchema = new Schema(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
    kind: { type: String, enum: CHANNEL_KINDS, default: 'channel' },
    name: { type: String, trim: true, default: '' },
    description: { type: String, default: '' },
    topic: { type: String, default: '' },
    // Public channels are joinable by anyone in the org; private channels + DMs are membership-gated.
    isPrivate: { type: Boolean, default: false },
    members: { type: [channelMemberSchema], default: [] },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    archived: { type: Boolean, default: false },
    // Sorted, joined participant ids for 1:1 (or group) DMs — dedupes DM conversations.
    dmKey: { type: String },
    lastMessageAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

channelSchema.index({ workspaceId: 1, kind: 1 });
channelSchema.index({ workspaceId: 1, 'members.userId': 1 });
channelSchema.index({ dmKey: 1 }, { unique: true, sparse: true });

export type ChannelType = InferSchemaType<typeof channelSchema>;
export type ChannelDoc = HydratedDocument<ChannelType>;

export const Channel: Model<ChannelType> =
  (mongoose.models.Channel as Model<ChannelType> | undefined) ??
  mongoose.model<ChannelType>('Channel', channelSchema);
