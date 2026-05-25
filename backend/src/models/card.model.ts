import mongoose, {
  Schema,
  type InferSchemaType,
  type HydratedDocument,
  type Model,
} from 'mongoose';

const checklistItemSchema = new Schema(
  {
    id: { type: String, required: true },
    text: { type: String, required: true },
    completed: { type: Boolean, default: false },
    memberId: { type: Schema.Types.ObjectId, ref: 'User' },
    dueDate: { type: Date },
    position: { type: Number, default: 0 },
  },
  { _id: false },
);

const checklistSchema = new Schema(
  {
    id: { type: String, required: true },
    title: { type: String, required: true },
    position: { type: Number, default: 0 },
    items: { type: [checklistItemSchema], default: [] },
  },
  { _id: false },
);

const attachmentSchema = new Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    url: { type: String, required: true },
    mimeType: { type: String },
    size: { type: Number },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    uploadedAt: { type: Date, default: Date.now },
    isCover: { type: Boolean, default: false },
  },
  { _id: false },
);

const coverSchema = new Schema(
  {
    type: { type: String, enum: ['color', 'image', 'attachment'] },
    value: { type: String },
    size: { type: String, enum: ['normal', 'full'], default: 'normal' },
    brightness: { type: String, enum: ['light', 'dark'], default: 'light' },
  },
  { _id: false },
);

const cardSchema = new Schema(
  {
    listId: { type: Schema.Types.ObjectId, ref: 'List', required: true, index: true },
    boardId: { type: Schema.Types.ObjectId, ref: 'Board', required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    position: { type: Number, required: true },
    members: { type: [Schema.Types.ObjectId], ref: 'User', default: [] },
    labels: { type: [Schema.Types.ObjectId], ref: 'Label', default: [] },
    startDate: { type: Date },
    dueDate: { type: Date, index: true },
    dueComplete: { type: Boolean, default: false },
    cover: { type: coverSchema },
    checklists: { type: [checklistSchema], default: [] },
    attachments: { type: [attachmentSchema], default: [] },
    customFieldValues: { type: Schema.Types.Mixed, default: {} },
    mirrors: { type: [Schema.Types.ObjectId], ref: 'Card', default: [] },
    mirrorOf: { type: Schema.Types.ObjectId, ref: 'Card' },
    archived: { type: Boolean, default: false },
    watchers: { type: [Schema.Types.ObjectId], ref: 'User', default: [] },
    votes: { type: [Schema.Types.ObjectId], ref: 'User', default: [] },
    location: {
      lat: Number,
      lng: Number,
      label: String,
    },
    scheduledAt: { type: Date, index: true },
    scheduledDuration: { type: Number }, // minutes
    completedAt: { type: Date },
  },
  { timestamps: true },
);

cardSchema.index({ boardId: 1, listId: 1, position: 1 });
cardSchema.index({ title: 'text', description: 'text' });

export type CardType = InferSchemaType<typeof cardSchema>;
export type CardDoc = HydratedDocument<CardType>;

export const Card: Model<CardType> =
  (mongoose.models.Card as Model<CardType> | undefined) ??
  mongoose.model<CardType>('Card', cardSchema);
