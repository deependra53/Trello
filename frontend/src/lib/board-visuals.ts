import {
  BarChart3,
  Calendar,
  CheckSquare,
  ClipboardList,
  Code2,
  KanbanSquare,
  LayoutDashboard,
  type LucideIcon,
  Megaphone,
  Palette,
  Rocket,
  Target,
  Users,
} from 'lucide-react';
import type { CSSProperties } from 'react';
import type { Board } from '@/types/api';

const FALLBACK_ICONS: LucideIcon[] = [
  LayoutDashboard,
  KanbanSquare,
  ClipboardList,
  Rocket,
  Target,
  BarChart3,
];

const AVATAR_COLORS = [
  '#F2994A',
  '#2D9CDB',
  '#9B51E0',
  '#27AE60',
  '#EB5757',
  '#F2C94C',
  '#56CCF2',
  '#BB6BD9',
];

export function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(h, 31) + s.charCodeAt(i)) >>> 0;
  return h;
}

/** Pick a representative icon for a board from its title (stable, no data needed). */
export function iconForTitle(title: string): LucideIcon {
  const n = title.toLowerCase();
  if (n.includes('calendar')) return Calendar;
  if (n.includes('campaign') || n.includes('marketing')) return Megaphone;
  if (n.includes('client') || n.includes('onboard')) return Users;
  if (n.includes('kanban') || n.includes('personal') || n.includes('todo')) return CheckSquare;
  if (
    n.includes('sprint') ||
    n.includes('engineer') ||
    n.includes('dev') ||
    n.includes('error') ||
    n.includes('bug')
  )
    return Code2;
  if (n.includes('roadmap') || n.includes('product')) return BarChart3;
  if (n.includes('design')) return Palette;
  return FALLBACK_ICONS[hashString(title) % FALLBACK_ICONS.length]!;
}

/** Deterministic avatar color for a user/member id. */
export function colorForId(id: string): string {
  return AVATAR_COLORS[hashString(id) % AVATAR_COLORS.length]!;
}

/** Inline style for a board's background (color / image / gradient), with a brand fallback. */
export function bgStyleOf(bg?: Board['background']): CSSProperties {
  if (!bg) return { backgroundImage: 'linear-gradient(135deg,#795DFF,#9B7BFF)' };
  if (bg.type === 'color') return { backgroundColor: bg.value };
  if (bg.type === 'image')
    return { backgroundImage: `url(${bg.value})`, backgroundSize: 'cover', backgroundPosition: 'center' };
  return { backgroundImage: bg.value };
}

/** Compact relative time, e.g. "just now", "5m ago", "3d ago". */
export function shortAgo(iso?: string): string {
  if (!iso) return 'recently';
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return 'recently';
  const s = Math.max(0, Math.floor((Date.now() - t) / 1000));
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  const w = Math.floor(d / 7);
  if (w < 5) return `${w}w ago`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo}mo ago`;
  return `${Math.floor(d / 365)}y ago`;
}
