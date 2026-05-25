import mongoose, {
  Schema,
  type InferSchemaType,
  type HydratedDocument,
  type Model,
} from 'mongoose';

const listSchema = new Schema(
  {
    boardId: { type: Schema.Types.ObjectId, ref: 'Board', required: true, index: true },
    title: { type: String, required: true, trim: true },
    position: { type: Number, required: true, index: true },
    color: { type: String },
    collapsed: { type: Boolean, default: false },
    archived: { type: Boolean, default: false },
    sortBy: {
      type: String,
      enum: ['manual', 'createdAt', 'dueDate', 'title'],
      default: 'manual',
    },
  },
  { timestamps: true },
);

listSchema.index({ boardId: 1, position: 1 });

export type ListType = InferSchemaType<typeof listSchema>;
export type ListDoc = HydratedDocument<ListType>;

export const List: Model<ListType> =
  (mongoose.models.List as Model<ListType> | undefined) ??
  mongoose.model<ListType>('List', listSchema);
