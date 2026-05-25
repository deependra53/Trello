import mongoose, {
  Schema,
  type InferSchemaType,
  type HydratedDocument,
  type Model,
} from 'mongoose';

const inboxItemSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    source: { type: String, enum: ['manual', 'email', 'capture'], default: 'manual' },
    title: { type: String, required: true },
    body: { type: String, default: '' },
    snoozedUntil: { type: Date, index: true },
    convertedCardId: { type: Schema.Types.ObjectId, ref: 'Card' },
    archivedAt: { type: Date },
  },
  { timestamps: true },
);

export type InboxItemType = InferSchemaType<typeof inboxItemSchema>;
export type InboxItemDoc = HydratedDocument<InboxItemType>;

export const InboxItem: Model<InboxItemType> =
  (mongoose.models.InboxItem as Model<InboxItemType> | undefined) ??
  mongoose.model<InboxItemType>('InboxItem', inboxItemSchema);
