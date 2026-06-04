import {
  AtSign,
  Bell,
  Hash,
  LayoutDashboard,
  MessageSquare,
  UserPlus,
  Zap,
  type LucideIcon,
} from 'lucide-react';

/** Per-type icon + accent colour, shared by every notification surface. */
const NOTIFICATION_META: Record<string, { icon: LucideIcon; className: string }> = {
  'card.comment': { icon: MessageSquare, className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' },
  'chat.mention': { icon: AtSign, className: 'bg-violet-500/10 text-violet-600 dark:text-violet-400' },
  'channel.added': { icon: Hash, className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
  'board.added': { icon: LayoutDashboard, className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
  'board.member.joined': { icon: UserPlus, className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
  automation: { icon: Zap, className: 'bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400' },
};

const DEFAULT_META = { icon: Bell, className: 'bg-primary/10 text-primary' };

export function notificationMeta(type: string) {
  return NOTIFICATION_META[type] ?? DEFAULT_META;
}

/** Extract the channel id from a chat notification's `/chat/<id>` link. */
export function channelIdFromLink(link?: string): string | undefined {
  return link?.match(/\/chat\/([^/?#]+)/)?.[1];
}
