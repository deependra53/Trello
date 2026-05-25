import mongoose, {
  Schema,
  type InferSchemaType,
  type HydratedDocument,
  type Model,
} from 'mongoose';

const activitySchema = new Schema(
  {
    boardId: { type: Schema.Types.ObjectId, ref: 'Board', required: true, index: true },
    cardId: { type: Schema.Types.ObjectId, ref: 'Card', index: true },
    listId: { type: Schema.Types.ObjectId, ref: 'List' },
    actorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, required: true, index: true },
    payload: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

activitySchema.index({ boardId: 1, createdAt: -1 });
activitySchema.index({ cardId: 1, createdAt: -1 });

export type ActivityType = InferSchemaType<typeof activitySchema>;
export type ActivityDoc = HydratedDocument<ActivityType>;

export const Activity: Model<ActivityType> =
  (mongoose.models.Activity as Model<ActivityType> | undefined) ??
  mongoose.model<ActivityType>('Activity', activitySchema);
