export interface User {
  _id: string;
  id?: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  emailVerified: boolean;
  preferences?: {
    theme?: 'light' | 'dark' | 'system';
    language?: string;
    notifications?: Record<string, boolean>;
  };
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface Workspace {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  visibility: 'private' | 'public';
  ownerId: string;
  members: Array<{ userId: string; role: string }>;
  plan: string;
  createdAt: string;
  updatedAt: string;
}

export interface BoardMember {
  userId: string;
  role: 'admin' | 'member' | 'observer';
}

export interface Board {
  _id: string;
  workspaceId: string;
  title: string;
  description?: string;
  background: { type: 'color' | 'image' | 'gradient'; value: string };
  visibility: 'private' | 'workspace' | 'public';
  members: BoardMember[];
  starredBy: string[];
  closed: boolean;
  lastActivityAt: string;
  /** Non-archived card count, attached by the workspace board-list endpoint. */
  cardCount?: number;
}

export interface List {
  _id: string;
  boardId: string;
  title: string;
  position: number;
  color?: string;
  collapsed?: boolean;
  archived?: boolean;
}

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  memberId?: string | null;
  dueDate?: string | null;
  position: number;
}

export interface Checklist {
  id: string;
  title: string;
  position: number;
  items: ChecklistItem[];
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  mimeType?: string;
  size?: number;
  uploadedBy?: string;
  uploadedAt?: string;
  isCover?: boolean;
}

export interface Card {
  _id: string;
  listId: string;
  boardId: string;
  title: string;
  description?: string;
  position: number;
  members?: string[];
  labels?: string[];
  startDate?: string;
  dueDate?: string;
  dueComplete?: boolean;
  cover?: { type: 'color' | 'gradient' | 'image' | 'attachment'; value: string; size?: 'normal' | 'full'; brightness?: 'light' | 'dark' } | null;
  checklists?: Checklist[];
  attachments?: Attachment[];
  watchers?: string[];
  votes?: string[];
  archived?: boolean;
  location?: { lat?: number; lng?: number; label?: string } | null;
  scheduledAt?: string | null;
  scheduledDuration?: number | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Label {
  _id: string;
  boardId: string;
  name: string;
  color: string;
}

export interface Comment {
  _id: string;
  cardId: string;
  authorId: string;
  body: string;
  mentions: string[];
  reactions: Array<{ emoji: string; userIds: string[] }>;
  createdAt: string;
  editedAt?: string;
}

export interface Notification {
  _id: string;
  userId: string;
  type: string;
  title: string;
  body?: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

export interface BoardMemberProfile {
  _id: string;
  fullName: string;
  email: string;
  avatarUrl?: string;
}

export interface BoardFull extends Board {
  lists: List[];
  cards: Card[];
  labels: Label[];
  memberProfiles?: BoardMemberProfile[];
}

export interface BoardShareLink {
  enabled: boolean;
  token: string | null;
  url: string | null;
  role: 'admin' | 'member' | 'observer';
}

export interface BoardInvite {
  _id: string;
  email: string | null;
  role: 'admin' | 'member' | 'observer';
  status: 'pending' | 'accepted' | 'revoked';
  createdAt?: string;
}

export interface BoardInvitePreview {
  valid: boolean;
  boardId?: string;
  boardTitle?: string;
  invitedBy?: string;
  email?: string | null;
}

// --- Organization / Chat ------------------------------------------------------

export interface UserProfile {
  _id: string;
  fullName: string;
  email: string;
  avatarUrl?: string;
}

export interface OrgMember {
  userId: string;
  role: string;
  joinedAt?: string;
  profile?: UserProfile;
}

export interface Invite {
  _id: string;
  workspaceId: string;
  email: string;
  role: 'admin' | 'member' | 'guest';
  status: 'pending' | 'accepted' | 'revoked';
  createdAt: string;
}

export interface ChannelSummary {
  _id: string;
  workspaceId: string;
  kind: 'channel' | 'dm';
  name: string;
  description?: string;
  topic?: string;
  isPrivate?: boolean;
  memberCount?: number;
  isMember?: boolean;
  createdBy?: string;
  lastMessageAt?: string;
  unreadCount: number;
  // DM-only
  participants?: UserProfile[];
  otherUser?: UserProfile;
}

export interface ChannelDetail {
  _id: string;
  workspaceId: string;
  kind: 'channel' | 'dm';
  name: string;
  description?: string;
  topic?: string;
  isPrivate?: boolean;
  archived?: boolean;
  createdBy?: string;
  isMember: boolean;
  members: Array<{ userId: string; role: string; profile?: UserProfile }>;
}

export interface ChatAttachment {
  name: string;
  url: string;
  mimeType?: string;
  size?: number;
}

export interface ChatReaction {
  emoji: string;
  userIds: string[];
}

export interface ChatMessage {
  _id: string;
  channelId: string;
  authorId: string;
  author?: UserProfile;
  body: string;
  deleted?: boolean;
  mentions: string[];
  attachments: ChatAttachment[];
  parentId: string | null;
  replyCount: number;
  lastReplyAt?: string;
  reactions: ChatReaction[];
  pinned?: boolean;
  pinnedBy?: string;
  editedAt?: string;
  createdAt: string;
  updatedAt?: string;
  // search-only
  channelName?: string;
  channelKind?: 'channel' | 'dm';
  // client-only: correlation id for optimistic sends (matches the server echo),
  // and a flag marking a message that's still being delivered to the server.
  clientId?: string;
  pending?: boolean;
}

export interface UnreadCounts {
  total: number;
  byChannel: Record<string, number>;
}

export interface ThreadParticipant {
  _id: string;
  fullName: string;
  avatarUrl?: string;
}

export interface ThreadSummary {
  root: ChatMessage;
  channel: { _id: string; kind: 'channel' | 'dm'; name: string } | null;
  /** The last up to two messages of the thread, oldest-first (preview). */
  lastMessages: ChatMessage[];
  /** Distinct people in the thread (root author + repliers), capped for avatars. */
  participants: ThreadParticipant[];
  participantCount: number;
  /** New activity in this thread's channel that I haven't caught up on. */
  unread: boolean;
  /** I'm @-mentioned somewhere in the thread. */
  mentioned: boolean;
}
