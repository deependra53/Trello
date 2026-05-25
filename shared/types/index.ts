export type ID = string;

export type Role = 'owner' | 'admin' | 'member' | 'guest';
export type BoardRole = 'admin' | 'member' | 'observer';
export type Visibility = 'private' | 'workspace' | 'public';

export interface ApiError {
  error: { code: string; message: string; details?: unknown };
}

export interface Paginated<T> {
  items: T[];
  nextCursor?: string;
}
