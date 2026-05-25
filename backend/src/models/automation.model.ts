import mongoose, {
  Schema,
  type InferSchemaType,
  type HydratedDocument,
  type Model,
} from 'mongoose';

const triggerSchema = new Schema(
  {
    type: {
      type: String,
      enum: [
        'card.created',
        'card.moved',
        'card.archived',
        'due.approaching',
        'schedule.cron',
        'button.clicked',
        'comment.added',
        'label.added',
        'checklist.completed',
      ],
      required: true,
    },
    config: { type: Schema.Types.Mixed, default: {} },
  },
  { _id: false },
);

const conditionSchema = new Schema(
  {
    field: { type: String, required: true },
    op: {
      type: String,
      enum: ['eq', 'neq', 'in', 'nin', 'gt', 'lt', 'contains', 'exists'],
      required: true,
    },
    value: { type: Schema.Types.Mixed },
  },
  { _id: false },
);

const actionSchema = new Schema(
  {
    type: {
      type: String,
      enum: [
        'move_card',
        'add_label',
        'remove_label',
        'assign_member',
        'unassign_member',
        'set_due',
        'clear_due',
        'post_comment',
        'archive',
        'create_card',
        'send_notification',
      ],
      required: true,
    },
    config: { type: Schema.Types.Mixed, default: {} },
  },
  { _id: false },
);

const automationSchema = new Schema(
  {
    boardId: { type: Schema.Types.ObjectId, ref: 'Board', required: true, index: true },
    name: { type: String, required: true },
    description: { type: String, default: '' },
    trigger: { type: triggerSchema, required: true },
    conditions: { type: [conditionSchema], default: [] },
    conditionMatch: { type: String, enum: ['all', 'any'], default: 'all' },
    actions: { type: [actionSchema], required: true },
    enabled: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    runCount: { type: Number, default: 0 },
    lastRunAt: { type: Date },
    lastError: { type: String },
  },
  { timestamps: true },
);

export type AutomationType = InferSchemaType<typeof automationSchema>;
export type AutomationDoc = HydratedDocument<AutomationType>;

export const Automation: Model<AutomationType> =
  (mongoose.models.Automation as Model<AutomationType> | undefined) ??
  mongoose.model<AutomationType>('Automation', automationSchema);
