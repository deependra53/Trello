import mongoose, {
  Schema,
  type InferSchemaType,
  type HydratedDocument,
  type Model,
} from 'mongoose';

const templateSchema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String, default: '' },
    category: { type: String, default: 'general' },
    background: { type: Schema.Types.Mixed, default: { type: 'color', value: '#0079bf' } },
    previewImageUrl: { type: String },
    structure: { type: Schema.Types.Mixed, required: true }, // { lists: [{ title, cards: [{ title, ... }] }] }
    isPublic: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    useCount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export type TemplateType = InferSchemaType<typeof templateSchema>;
export type TemplateDoc = HydratedDocument<TemplateType>;

export const Template: Model<TemplateType> =
  (mongoose.models.Template as Model<TemplateType> | undefined) ??
  mongoose.model<TemplateType>('Template', templateSchema);
