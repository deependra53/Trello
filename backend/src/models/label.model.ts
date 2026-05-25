import mongoose, {
  Schema,
  type InferSchemaType,
  type HydratedDocument,
  type Model,
} from 'mongoose';

const labelSchema = new Schema(
  {
    boardId: { type: Schema.Types.ObjectId, ref: 'Board', required: true, index: true },
    name: { type: String, default: '' },
    color: { type: String, required: true },
  },
  { timestamps: true },
);

export type LabelType = InferSchemaType<typeof labelSchema>;
export type LabelDoc = HydratedDocument<LabelType>;

export const Label: Model<LabelType> =
  (mongoose.models.Label as Model<LabelType> | undefined) ??
  mongoose.model<LabelType>('Label', labelSchema);
