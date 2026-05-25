import mongoose, {
  Schema,
  type InferSchemaType,
  type HydratedDocument,
  type Model,
} from 'mongoose';

const reactionSchema = new Schema(
  {
    emoji: { type: String, required: true },
    userIds: { type: [Schema.Types.ObjectId], ref: 'User', default: [] },
  },
  { _id: false },
);

const commentSchema = new Schema(
  {
    cardId: { type: Schema.Types.ObjectId, ref: 'Card', required: true, index: true },
    boardId: { type: Schema.Types.ObjectId, ref: 'Board', required: true, index: true },
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    body: { type: String, required: true },
    mentions: { type: [Schema.Types.ObjectId], ref: 'User', default: [] },
    reactions: { type: [reactionSchema], default: [] },
    editedAt: { type: Date },
  },
  { timestamps: true },
);

commentSchema.index({ cardId: 1, createdAt: -1 });

export type CommentType = InferSchemaType<typeof commentSchema>;
export type CommentDoc = HydratedDocument<CommentType>;

export const Comment: Model<CommentType> =
  (mongoose.models.Comment as Model<CommentType> | undefined) ??
  mongoose.model<CommentType>('Comment', commentSchema);
