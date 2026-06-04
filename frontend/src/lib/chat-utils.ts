import type { ChannelSummary, ChatMessage, UserProfile } from '@/types/api';

export const REACTION_EMOJIS = ['👍', '❤️', '😂', '🎉', '👀', '🙏', '🔥', '✅'] as const;

export function initials(name?: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '?';
}

/** Deterministic accent color for an avatar fallback, derived from an id. */
export function avatarColor(id: string): string {
  const colors = [
    'bg-rose-500',
    'bg-orange-500',
    'bg-amber-500',
    'bg-emerald-500',
    'bg-teal-500',
    'bg-sky-500',
    'bg-indigo-500',
    'bg-violet-500',
    'bg-fuchsia-500',
  ];
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return colors[hash % colors.length] as string;
}

export function formatTime(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export function formatDayLabel(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(Date.now() - 86_400_000);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
}

export function channelLabel(c: Pick<ChannelSummary, 'kind' | 'name'>): string {
  return c.kind === 'dm' ? c.name : `# ${c.name}`;
}

export function isImage(mimeType?: string): boolean {
  return Boolean(mimeType && mimeType.startsWith('image/'));
}

/** Flatten markdown to a single readable line for previews (links→text, no markers). */
export function toPlainText(md: string): string {
  return md
    .replace(/```[\s\S]*?```/g, ' ') // fenced code
    .replace(/`([^`]+)`/g, '$1') // inline code
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ') // images
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1') // links → text
    .replace(/^\s{0,3}>\s?/gm, '') // blockquote markers
    .replace(/[*_~#]+/g, '') // emphasis / heading / strike markers
    .replace(/\s+/g, ' ')
    .trim();
}

/** Group consecutive messages by the same author within a 5-minute window. */
export function groupMessages(messages: ChatMessage[]): ChatMessage[][] {
  const groups: ChatMessage[][] = [];
  for (const m of messages) {
    const last = groups[groups.length - 1];
    const prev = last?.[last.length - 1];
    const sameAuthor = prev && prev.authorId === m.authorId;
    const close =
      prev && new Date(m.createdAt).getTime() - new Date(prev.createdAt).getTime() < 5 * 60_000;
    if (last && sameAuthor && close) last.push(m);
    else groups.push([m]);
  }
  return groups;
}

export function displayName(p?: UserProfile, fallback = 'Unknown'): string {
  return p?.fullName ?? fallback;
}
