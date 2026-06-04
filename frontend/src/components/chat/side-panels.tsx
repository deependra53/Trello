'use client';
import { useState } from 'react';
import { Pin, Search, X } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { usePins, useSearchMessages } from '@/hooks/use-chat';
import { formatTime } from '@/lib/chat-utils';
import { UserAvatar } from './user-avatar';

export function PinsPanel({
  channelId,
  currentUserId,
  onClose,
  onJump,
}: {
  channelId: string;
  currentUserId: string;
  onClose: () => void;
  onJump?: (messageId: string) => void;
}) {
  const { data: pins } = usePins(channelId);
  return (
    <div className="flex h-full w-full flex-col border-l border-border/60 bg-background">
      <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold tracking-tight">
          <Pin className="h-4 w-4 fill-primary text-primary" /> Pinned
        </h3>
        <button
          onClick={onClose}
          className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <ScrollArea className="flex-1">
        <div className="space-y-2 p-3">
          {(pins?.length ?? 0) === 0 && (
            <div className="animate-fade-up px-4 py-16 text-center">
              <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                <Pin className="h-6 w-6" />
              </div>
              <p className="text-sm font-medium">No pinned messages yet</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Pin important messages to find them here.
              </p>
            </div>
          )}
          {pins?.map((m) => (
            <button
              key={m._id}
              onClick={() => onJump?.(m._id)}
              className="block w-full rounded-lg border border-border/60 bg-card p-3 text-left shadow-xs transition-all duration-150 hover:bg-muted/50 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
            >
              <div className="mb-1.5 flex items-center gap-2">
                <UserAvatar user={m.author} id={m.authorId} className="h-5 w-5" />
                <span className="text-xs font-semibold">{m.author?.fullName}</span>
                <span className="text-[10px] text-muted-foreground">{formatTime(m.createdAt)}</span>
              </div>
              <p className="line-clamp-3 text-sm text-muted-foreground">{m.body}</p>
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

export function SearchPanel({
  workspaceId,
  onClose,
  onJump,
}: {
  workspaceId: string;
  onClose: () => void;
  onJump?: (channelId: string) => void;
}) {
  const [q, setQ] = useState('');
  const { data: results, isFetching } = useSearchMessages(workspaceId, q);

  return (
    <div className="flex h-full w-full flex-col border-l border-border/60 bg-background">
      <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
        <h3 className="text-sm font-semibold tracking-tight">Search messages</h3>
        <button
          onClick={onClose}
          className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="border-b border-border/60 p-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search this organization…"
            className="pl-9"
            autoFocus
          />
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="space-y-2 p-3">
          {isFetching && (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-lg border border-border/60 p-3">
                  <div className="mb-2 flex items-center gap-2">
                    <div className="skeleton h-5 w-5 rounded-full" />
                    <div className="skeleton h-3 w-24 rounded" />
                  </div>
                  <div className="skeleton h-3 w-full rounded" />
                  <div className="mt-1.5 skeleton h-3 w-2/3 rounded" />
                </div>
              ))}
            </div>
          )}
          {!isFetching && q.trim() && (results?.length ?? 0) === 0 && (
            <div className="animate-fade-up px-4 py-16 text-center">
              <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                <Search className="h-6 w-6" />
              </div>
              <p className="text-sm font-medium">No matches</p>
              <p className="mt-1 text-xs text-muted-foreground">Try a different search term.</p>
            </div>
          )}
          {!isFetching &&
            results?.map((m) => (
              <button
                key={m._id}
                onClick={() => onJump?.(m.channelId)}
                className="block w-full rounded-lg border border-border/60 bg-card p-3 text-left shadow-xs transition-all duration-150 hover:bg-muted/50 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
              >
                <div className="mb-1.5 flex items-center gap-2">
                  <UserAvatar user={m.author} id={m.authorId} className="h-5 w-5" />
                  <span className="text-xs font-semibold">{m.author?.fullName}</span>
                  <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                    {m.channelKind === 'dm' ? 'DM' : `#${m.channelName}`}
                  </span>
                </div>
                <p className="line-clamp-3 text-sm text-muted-foreground">{m.body}</p>
              </button>
            ))}
        </div>
      </ScrollArea>
    </div>
  );
}
