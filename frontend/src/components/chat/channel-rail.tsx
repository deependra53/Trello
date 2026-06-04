'use client';
import { useEffect, useState } from 'react';
import { Bell, ChevronDown, Gem, Hash, Lock, MessageSquare, Plus, UserPlus, X } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { UserAvatar } from './user-avatar';
import type { ChannelSummary, Workspace } from '@/types/api';

function SectionHeader({ label, onAdd }: { label: string; onAdd?: () => void }) {
  return (
    <div className="mb-1 mt-5 flex items-center justify-between px-3">
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      {onAdd && (
        <button
          onClick={onAdd}
          className="grid h-6 w-6 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
          title={`Add ${label.toLowerCase()}`}
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

export function ChannelRail({
  orgs,
  activeOrgId,
  onSwitchOrg,
  channels,
  dms,
  activeChannelId,
  view,
  onSelect,
  onOpenThreads,
  onOpenNotifications,
  notifUnread = 0,
  onCreateChannel,
  onStartDm,
  onInvitePeople,
  canInvite = false,
}: {
  orgs: Workspace[];
  activeOrgId: string;
  onSwitchOrg: (id: string) => void;
  channels: ChannelSummary[];
  dms: ChannelSummary[];
  activeChannelId?: string;
  view: 'conversation' | 'threads' | 'notifications';
  onSelect: (id: string) => void;
  onOpenThreads: () => void;
  onOpenNotifications: () => void;
  notifUnread?: number;
  onCreateChannel: () => void;
  onStartDm: () => void;
  onInvitePeople?: () => void;
  canInvite?: boolean;
}) {
  const activeOrg = orgs.find((o) => o._id === activeOrgId);
  const [hideUpgrade, setHideUpgrade] = useState(false);

  // Persist the "Upgrade to Pro" dismissal across sessions.
  useEffect(() => {
    try {
      setHideUpgrade(localStorage.getItem('indihive:hide-upgrade') === '1');
    } catch {
      /* localStorage unavailable — leave the card shown */
    }
  }, []);
  function dismissUpgrade() {
    setHideUpgrade(true);
    try {
      localStorage.setItem('indihive:hide-upgrade', '1');
    } catch {
      /* ignore */
    }
  }

  return (
    <aside className="brand-surface flex h-full w-60 shrink-0 flex-col border-r border-border/60">
      {/* Org switcher */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="group flex items-center justify-between gap-2 border-b border-border/60 px-3 py-3 text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/40">
            <span className="flex min-w-0 items-center gap-2.5">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl brand-gradient text-sm font-bold text-primary-foreground">
                {activeOrg?.name?.[0]?.toUpperCase() ?? '?'}
              </span>
              <span className="flex min-w-0 flex-col">
                <span className="truncate text-sm font-semibold leading-tight tracking-tight">
                  {activeOrg?.name ?? 'Chat'}
                </span>
                <span className="truncate text-[11px] leading-tight text-muted-foreground">Workspace</span>
              </span>
            </span>
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56 shadow-lg">
          <DropdownMenuLabel>Organizations</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {orgs.map((o) => (
            <DropdownMenuItem key={o._id} onClick={() => onSwitchOrg(o._id)} className="gap-2">
              <span className="grid h-6 w-6 place-items-center rounded-md brand-gradient text-[11px] font-bold text-primary-foreground">
                {o.name[0]?.toUpperCase()}
              </span>
              <span className="truncate">{o.name}</span>
            </DropdownMenuItem>
          ))}
          {canInvite && onInvitePeople && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onInvitePeople} className="gap-2">
                <UserPlus className="h-4 w-4 text-muted-foreground" />
                <span className="truncate">Invite people to {activeOrg?.name ?? 'organization'}</span>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="flex-1 overflow-y-auto px-2 pb-4 scrollbar-thin">
        <div className="mt-3 space-y-0.5">
          <button
            onClick={onOpenThreads}
            className={cn(
              'group flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
              view === 'threads'
                ? 'bg-primary font-medium text-primary-foreground shadow-glow-sm'
                : 'text-muted-foreground hover:bg-primary/10 hover:text-foreground',
            )}
          >
            <MessageSquare
              className={cn(
                'h-4 w-4 shrink-0',
                view === 'threads' ? 'text-primary-foreground' : 'text-muted-foreground',
              )}
            />
            <span className="flex-1 truncate text-left">Threads</span>
          </button>
          <button
            onClick={onOpenNotifications}
            className={cn(
              'group flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
              view === 'notifications'
                ? 'bg-primary font-medium text-primary-foreground shadow-glow-sm'
                : 'text-muted-foreground hover:bg-primary/10 hover:text-foreground',
              notifUnread > 0 && view !== 'notifications' && 'font-semibold text-foreground',
            )}
          >
            <Bell
              className={cn(
                'h-4 w-4 shrink-0',
                view === 'notifications' ? 'text-primary-foreground' : 'text-muted-foreground',
              )}
            />
            <span className="flex-1 truncate text-left">Notifications</span>
            {notifUnread > 0 && (
              <span
                className={cn(
                  'grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-[10px] font-bold',
                  view === 'notifications'
                    ? 'bg-white/25 text-primary-foreground'
                    : 'bg-primary text-primary-foreground shadow-glow-sm',
                )}
              >
                {notifUnread > 99 ? '99+' : notifUnread}
              </span>
            )}
          </button>
        </div>

        <SectionHeader label="Channels" onAdd={onCreateChannel} />
        {channels.length === 0 && (
          <p className="px-3 py-1.5 text-xs text-muted-foreground">No channels yet</p>
        )}
        {channels.map((c) => {
          const active = c._id === activeChannelId;
          const unread = c.unreadCount > 0;
          return (
            <button
              key={c._id}
              onClick={() => onSelect(c._id)}
              className={cn(
                'group flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
                active
                  ? 'bg-primary font-medium text-primary-foreground shadow-glow-sm'
                  : 'text-muted-foreground hover:bg-primary/10 hover:text-foreground',
                unread && !active && 'font-semibold text-foreground',
              )}
            >
              {c.isPrivate ? (
                <Lock className={cn('h-3.5 w-3.5 shrink-0', active ? 'text-primary-foreground' : 'text-muted-foreground')} />
              ) : (
                <Hash className={cn('h-3.5 w-3.5 shrink-0', active ? 'text-primary-foreground' : 'text-muted-foreground')} />
              )}
              <span className="flex-1 truncate text-left">{c.name}</span>
              {unread && (
                <span
                  className={cn(
                    'grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-[10px] font-bold',
                    active
                      ? 'bg-white/25 text-primary-foreground'
                      : 'bg-primary text-primary-foreground shadow-glow-sm',
                  )}
                >
                  {c.unreadCount}
                </span>
              )}
            </button>
          );
        })}

        <SectionHeader label="Direct messages" onAdd={onStartDm} />
        {dms.length === 0 && (
          <p className="px-3 py-1.5 text-xs text-muted-foreground">No conversations yet</p>
        )}
        {dms.map((d) => {
          const active = d._id === activeChannelId;
          const unread = d.unreadCount > 0;
          return (
            <button
              key={d._id}
              onClick={() => onSelect(d._id)}
              className={cn(
                'group flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
                active
                  ? 'bg-primary font-medium text-primary-foreground shadow-glow-sm'
                  : 'text-muted-foreground hover:bg-primary/10 hover:text-foreground',
                unread && !active && 'font-semibold text-foreground',
              )}
            >
              <UserAvatar user={d.otherUser} id={d.otherUser?._id ?? d._id} className="h-5 w-5 rounded-md" />
              <span className="flex-1 truncate text-left">{d.name}</span>
              {unread && (
                <span
                  className={cn(
                    'grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-[10px] font-bold',
                    active
                      ? 'bg-white/25 text-primary-foreground'
                      : 'bg-primary text-primary-foreground shadow-glow-sm',
                  )}
                >
                  {d.unreadCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Upgrade promo — pinned to the bottom of the rail, dismissible. */}
      {!hideUpgrade && (
        <div className="shrink-0 p-2">
          <div className="relative overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-br from-primary/12 via-primary/5 to-transparent p-3">
            <button
              onClick={dismissUpgrade}
              className="absolute right-1.5 top-1.5 grid h-5 w-5 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
              title="Dismiss"
            >
              <X className="h-3.5 w-3.5" />
            </button>
            <div className="flex items-center gap-2 pr-5">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg brand-gradient text-primary-foreground shadow-glow-sm">
                <Gem className="h-4 w-4" />
              </span>
              <span className="text-sm font-semibold tracking-tight">Upgrade to Pro</span>
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
              Unlock unlimited history, file storage and more.
            </p>
            <button className="mt-3 w-full rounded-lg brand-gradient px-3 py-2 text-xs font-semibold text-primary-foreground shadow-glow-sm transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40">
              Upgrade now →
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
