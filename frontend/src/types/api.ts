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
  memberId?: string;
  dueDate?: string;
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
  cover?: { type: 'color' | 'image' | 'attachment'; value: string; size?: 'normal' | 'full'; brightness?: 'light' | 'dark' } | null;
  checklists?: Checklist[];
  attachments?: Attachment[];
  watchers?: string[];
  votes?: string[];
  archived?: boolean;
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

export interface BoardFull extends Board {
  lists: List[];
  cards: Card[];
  labels: Label[];
}
