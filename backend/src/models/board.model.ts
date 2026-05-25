import mongoose, {
  Schema,
  type InferSchemaType,
  type HydratedDocument,
  type Model,
} from 'mongoose';

export const BOARD_ROLES = ['admin', 'member', 'observer'] as const;
export type BoardRole = (typeof BOARD_ROLES)[number];

const memberSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: BOARD_ROLES, default: 'member' },
    joinedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const backgroundSchema = new Schema(
  {
    type: { type: String, enum: ['color', 'image', 'gradient'], default: 'color' },
    value: { type: String, default: '#0079bf' },
  },
  { _id: false },
);

const customFieldSchema = new Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    type: {
      type: String,
      enum: ['text', 'number', 'date', 'checkbox', 'dropdown'],
      required: true,
    },
    options: { type: [{ id: String, value: String, color: String }], default: [] },
    showOnFront: { type: Boolean, default: false },
    position: { type: Number, default: 0 },
  },
  { _id: false },
);

const boardSchema = new Schema(
  {
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    background: { type: backgroundSchema, default: () => ({}) },
    visibility: {
      type: String,
      enum: ['private', 'workspace', 'public'],
      default: 'workspace',
    },
    members: { type: [memberSchema], default: [] },
    starredBy: { type: [Schema.Types.ObjectId], ref: 'User', default: [] },
    closed: { type: Boolean, default: false },
    customFields: { type: [customFieldSchema], default: [] },
    lastActivityAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

boardSchema.index({ 'members.userId': 1 });
boardSchema.index({ title: 'text', description: 'text' });

export type BoardType = InferSchemaType<typeof boardSchema>;
export type BoardDoc = HydratedDocument<BoardType>;

export const Board: Model<BoardType> =
  (mongoose.models.Board as Model<BoardType> | undefined) ??
  mongoose.model<BoardType>('Board', boardSchema);
