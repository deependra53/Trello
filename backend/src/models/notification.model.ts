import mongoose, {
  Schema,
  type InferSchemaType,
  type HydratedDocument,
  type Model,
} from 'mongoose';

const notificationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    actorId: { type: Schema.Types.ObjectId, ref: 'User' },
    type: { type: String, required: true },
    title: { type: String, required: true },
    body: { type: String, default: '' },
    link: { type: String },
    boardId: { type: Schema.Types.ObjectId, ref: 'Board' },
    cardId: { type: Schema.Types.ObjectId, ref: 'Card' },
    read: { type: Boolean, default: false, index: true },
    readAt: { type: Date },
  },
  { timestamps: true },
);

notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

export type NotificationType = InferSchemaType<typeof notificationSchema>;
export type NotificationDoc = HydratedDocument<NotificationType>;

export const Notification: Model<NotificationType> =
  (mongoose.models.Notification as Model<NotificationType> | undefined) ??
  mongoose.model<NotificationType>('Notification', notificationSchema);
