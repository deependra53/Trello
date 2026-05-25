import mongoose, {
  Schema,
  type InferSchemaType,
  type HydratedDocument,
  type Model,
} from 'mongoose';

export const WORKSPACE_ROLES = ['owner', 'admin', 'member', 'guest'] as const;
export type WorkspaceRole = (typeof WORKSPACE_ROLES)[number];

const memberSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: WORKSPACE_ROLES, default: 'member' },
    invitedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    joinedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const workspaceSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    description: { type: String, default: '' },
    visibility: { type: String, enum: ['private', 'public'], default: 'private' },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    members: { type: [memberSchema], default: [] },
    plan: {
      type: String,
      enum: ['free', 'standard', 'premium', 'enterprise'],
      default: 'free',
    },
    settings: {
      domainRestriction: { type: String, default: '' },
      boardCreationRestriction: { type: String, enum: ['any', 'admin'], default: 'any' },
      inviteRestriction: { type: String, enum: ['any', 'admin'], default: 'any' },
    },
    logoUrl: { type: String },
    archived: { type: Boolean, default: false },
  },
  { timestamps: true },
);

workspaceSchema.index({ 'members.userId': 1 });

export type WorkspaceType = InferSchemaType<typeof workspaceSchema>;
export type WorkspaceDoc = HydratedDocument<WorkspaceType>;

export const Workspace: Model<WorkspaceType> =
  (mongoose.models.Workspace as Model<WorkspaceType> | undefined) ??
  mongoose.model<WorkspaceType>('Workspace', workspaceSchema);
