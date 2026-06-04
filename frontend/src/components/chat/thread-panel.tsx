'use client';
import { ArrowUpRight, X } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useReplies } from '@/hooks/use-chat';
import { MessageItem } from './message-item';
import { Composer } from './composer';
import type { OrgMember } from '@/types/api';

export function ThreadPanel({
  channelId,
  parentId,
  members,
  currentUserId,
  workspaceId,
  onClose,
  onGoToOriginal,
}: {
  channelId: string;
  parentId: string;
  members: OrgMember[];
  currentUserId: string;
  workspaceId?: string;
  onClose: () => void;
  onGoToOriginal?: (channelId: string, messageId: string) => void;
}) {
  const { data } = useReplies(parentId);

  return (
    <div className="flex h-full w-full flex-col border-l border-border/60 bg-background">
      <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
        <div>
          <h3 className="text-sm font-semibold tracking-tight">Thread</h3>
          <p className="text-xs text-muted-foreground">
            {data?.items.length ?? 0} {data?.items.length === 1 ? 'reply' : 'replies'}
          </p>
        </div>
        <button
          onClick={onClose}
          className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <ScrollArea className="flex-1">
        <div className="py-2">
          {data?.root && (
            <>
              <MessageItem
                message={data.root}
                channelId={channelId}
                currentUserId={currentUserId}
                workspaceId={workspaceId}
                showThreadIndicator={false}
              />
              {onGoToOriginal && (
                <div className="pb-1 pl-16 pr-4">
                  <button
                    onClick={() => onGoToOriginal(channelId, parentId)}
                    className="inline-flex items-center gap-1.5 rounded-md border border-border/60 px-2 py-1 text-xs font-medium text-primary transition-colors hover:border-primary/30 hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                  >
                    <ArrowUpRight className="h-3.5 w-3.5" />
                    Go to original message
                  </button>
                </div>
              )}
            </>
          )}
          <div className="my-2 flex items-center gap-3 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <span>{data?.items.length ?? 0} replies</span>
            <span className="h-px flex-1 bg-border/60" />
          </div>
          {data?.items.map((m) => (
            <MessageItem
              key={m._id}
              message={m}
              channelId={channelId}
              currentUserId={currentUserId}
              workspaceId={workspaceId}
              showThreadIndicator={false}
            />
          ))}
        </div>
      </ScrollArea>

      <Composer
        channelId={channelId}
        members={members}
        parentId={parentId}
        placeholder="Reply…"
        autoFocus
      />
    </div>
  );
}
