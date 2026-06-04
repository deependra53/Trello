import mongoose, {
  Schema,
  type InferSchemaType,
  type HydratedDocument,
  type Model,
} from 'mongoose';

const attachmentSchema = new Schema(
  {
    name: { type: String, required: true },
    url: { type: String, required: true },
    mimeType: { type: String, default: 'application/octet-stream' },
    size: { type: Number, default: 0 },
  },
  { _id: false },
);

const reactionSchema = new Schema(
  {
    emoji: { type: String, required: true },
    userIds: { type: [Schema.Types.ObjectId], ref: 'User', default: [] },
  },
  { _id: false },
);

const messageSchema = new Schema(
  {
    channelId: { type: Schema.Types.ObjectId, ref: 'Channel', required: true, index: true },
    workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    body: { type: String, default: '' },
    mentions: { type: [Schema.Types.ObjectId], ref: 'User', default: [] },
    attachments: { type: [attachmentSchema], default: [] },
    // Threading: top-level messages have parentId null; replies point at the thread root.
    parentId: { type: Schema.Types.ObjectId, ref: 'Message', default: null, index: true },
    replyCount: { type: Number, default: 0 },
    lastReplyAt: { type: Date },
    reactions: { type: [reactionSchema], default: [] },
    pinned: { type: Boolean, default: false },
    pinnedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    pinnedAt: { type: Date },
    editedAt: { type: Date },
    deletedAt: { type: Date },
  },
  { timestamps: true },
);

messageSchema.index({ channelId: 1, createdAt: -1 });
messageSchema.index({ body: 'text' });

export type MessageType = InferSchemaType<typeof messageSchema>;
export type MessageDoc = HydratedDocument<MessageType>;

export const Message: Model<MessageType> =
  (mongoose.models.Message as Model<MessageType> | undefined) ??
  mongoose.model<MessageType>('Message', messageSchema);
