'use client';
import { motion, useReducedMotion } from 'framer-motion';
import { LayoutGrid, MessageSquare } from 'lucide-react';
import { useWorkspaceSection } from '@/hooks/use-workspace-section';
import { useWorkspaces } from '@/hooks/use-boards';
import { useUnread } from '@/hooks/use-chat';
import { useUnreadCount } from '@/hooks/use-notifications';
import { useChatAccess } from '@/hooks/use-chat-access';
import { cn } from '@/lib/utils';

const TABS = [
  { id: 'boards', label: 'Boards', icon: LayoutGrid },
  { id: 'chat', label: 'Chat', icon: MessageSquare },
] as const;

export function WorkspaceToggle() {
  const reduce = useReducedMotion();
  const { section, go } = useWorkspaceSection();

  // Each tab advertises its own world's pending activity so nothing's missed
  // while you're in the other world: unread chat messages on Chat, unread board
  // notifications on Boards.
  const { data: orgs } = useWorkspaces();
  const { data: unread } = useUnread(orgs?.[0]?._id);
  const totalUnread = unread?.total ?? 0;
  const { data: boardUnread = 0 } = useUnreadCount('boards');

  // Guests (e.g. board-invite collaborators) only get Boards until an admin
  // adds them to a channel — hide the Chat tab entirely for them.
  const { canAccessChat } = useChatAccess();
  const tabs = canAccessChat ? TABS : TABS.filter((t) => t.id !== 'chat');

  return (
    <div
      role="tablist"
      aria-label="Switch section"
      className="relative ml-1 hidden items-center rounded-full border border-border/60 bg-muted/40 p-0.5 sm:ml-3 sm:flex"
    >
      {tabs.map((tab) => {
        const active = section === tab.id;
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => go(tab.id)}
            className={cn(
              'relative z-10 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/40',
              active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {active && (
              <motion.span
                layoutId="workspace-toggle-pill"
                className="absolute inset-0 -z-10 rounded-full bg-background shadow-sm ring-1 ring-border/60"
                transition={
                  reduce ? { duration: 0 } : { type: 'spring', stiffness: 380, damping: 30 }
                }
              />
            )}
            <Icon className="h-4 w-4" />
            {tab.label}
            {tab.id === 'chat' && totalUnread > 0 && !active && (
              <span
                aria-label={`${totalUnread} unread`}
                className="ml-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold leading-none text-primary-foreground shadow-glow-sm"
              >
                {totalUnread > 99 ? '99+' : totalUnread}
              </span>
            )}
            {tab.id === 'boards' && boardUnread > 0 && !active && (
              <span
                aria-label={`${boardUnread} unread notifications`}
                className="ml-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold leading-none text-primary-foreground shadow-glow-sm"
              >
                {boardUnread > 99 ? '99+' : boardUnread}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
