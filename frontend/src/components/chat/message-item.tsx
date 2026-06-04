'use client';
import { useState } from 'react';
import { LayoutGrid, MessageSquare, MoreHorizontal, Pencil, Pin, Smile, Trash2, Paperclip } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import {
  useDeleteMessage,
  useEditMessage,
  useSetPin,
  useToggleReaction,
} from '@/hooks/use-chat';
import { REACTION_EMOJIS, formatTime, isImage } from '@/lib/chat-utils';
import { UserAvatar } from './user-avatar';
import { MessageBody } from './message-body';
import { AddToBoardDialog } from './add-to-board-dialog';
import type { ChatMessage } from '@/types/api';

export function MessageItem({
  message,
  channelId,
  currentUserId,
  workspaceId,
  grouped,
  onOpenThread,
  showThreadIndicator = true,
  highlight = false,
}: {
  message: ChatMessage;
  channelId: string;
  currentUserId: string;
  /** When present, enables the "Add to board" message action. */
  workspaceId?: string;
  grouped?: boolean;
  onOpenThread?: (m: ChatMessage) => void;
  showThreadIndicator?: boolean;
  highlight?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(message.body);
  const [addToBoardOpen, setAddToBoardOpen] = useState(false);
  // Keep the hover toolbar mounted/visible while a menu or popover is open —
  // otherwise `group-hover` drops it to display:none and the Radix dropdown,
  // having lost its anchor element, jumps to the top-left corner of the page.
  const [menuOpen, setMenuOpen] = useState(false);
  const [reactOpen, setReactOpen] = useState(false);
  const toolbarPinned = menuOpen || reactOpen;
  const react = useToggleReaction(channelId);
  const edit = useEditMessage(channelId);
  const del = useDeleteMessage(channelId);
  const pin = useSetPin(channelId);

  const isOwn = message.authorId === currentUserId;
  const mentionsMe = message.mentions?.includes(currentUserId);

  if (message.deleted) {
    return (
      <div data-message-id={message._id} className="group flex gap-3 px-4 py-1">
        <div className="w-9" />
        <p className="text-sm italic text-muted-foreground">This message was deleted</p>
      </div>
    );
  }

  return (
    <>
    <div
      data-message-id={message._id}
      className={cn(
        'group relative flex gap-3 px-4 transition-colors hover:bg-muted/40',
        grouped ? 'py-0.5' : 'mt-2 py-1',
        mentionsMe && !highlight && 'border-l-2 border-warning bg-warning/5 hover:bg-warning/10',
        highlight && 'rounded-md bg-primary/15 py-1 ring-2 ring-inset ring-primary/40 hover:bg-primary/15',
        message.pending && 'opacity-60',
      )}
    >
      <div className="w-9 shrink-0">
        {grouped ? (
          <>
            {message.pinned && (
              <Pin className="ml-0.5 mt-1.5 h-3.5 w-3.5 fill-primary text-primary group-hover:hidden" />
            )}
            <span className="mt-1 hidden text-[10px] leading-5 text-muted-foreground group-hover:block">
              {formatTime(message.createdAt)}
            </span>
          </>
        ) : (
          <UserAvatar user={message.author} id={message.authorId} />
        )}
      </div>

      <div className="min-w-0 flex-1">
        {!grouped && (
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-semibold tracking-tight">{message.author?.fullName ?? 'Unknown'}</span>
            <span className="text-[11px] text-muted-foreground">{formatTime(message.createdAt)}</span>
            {message.editedAt && <span className="text-[10px] text-muted-foreground">(edited)</span>}
            {message.pinned && <Pin className="h-3.5 w-3.5 fill-primary text-primary" />}
          </div>
        )}

        {editing ? (
          <div className="mt-1 space-y-2">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={2}
              className="w-full resize-none rounded-lg border border-border bg-background p-2 text-sm outline-none transition-colors focus:border-primary/60 focus:ring-2 focus:ring-ring/20 scrollbar-thin"
              autoFocus
            />
            <div className="flex gap-2 text-xs">
              <button
                onClick={async () => {
                  await edit.mutateAsync({ messageId: message._id, body: draft });
                  setEditing(false);
                }}
                className="rounded-lg bg-primary px-3 py-1 font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setDraft(message.body);
                  setEditing(false);
                }}
                className="rounded-lg px-3 py-1 font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <MessageBody body={message.body} />
        )}

        {/* Attachments */}
        {message.attachments?.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-2">
            {message.attachments.map((att, i) =>
              isImage(att.mimeType) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <a key={i} href={att.url} target="_blank" rel="noreferrer" className="block min-w-0 max-w-full">
                  <img
                    src={att.url}
                    alt={att.name}
                    className="max-h-60 w-auto max-w-full rounded-lg border border-border/60 object-cover shadow-sm transition-transform hover:scale-[1.01] sm:max-w-xs"
                  />
                </a>
              ) : (
                <a
                  key={i}
                  href={att.url}
                  target="_blank"
                  rel="noreferrer"
                  download={att.name}
                  className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/40 px-3 py-2 text-sm transition-colors hover:bg-muted"
                >
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-background text-muted-foreground">
                    <Paperclip className="h-4 w-4" />
                  </span>
                  <span className="max-w-[200px] truncate font-medium">{att.name}</span>
                </a>
              ),
            )}
          </div>
        )}

        {/* Reactions */}
        {message.reactions?.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {message.reactions.map((r) => {
              const mine = r.userIds.includes(currentUserId);
              return (
                <button
                  key={r.emoji}
                  onClick={() => react.mutate({ messageId: message._id, emoji: r.emoji })}
                  className={cn(
                    'flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
                    mine
                      ? 'border-primary/40 bg-primary/10 text-primary'
                      : 'border-border/60 bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                >
                  <span>{r.emoji}</span>
                  <span>{r.userIds.length}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Thread indicator */}
        {showThreadIndicator && message.replyCount > 0 && (
          <button
            onClick={() => onOpenThread?.(message)}
            className="mt-1.5 flex items-center gap-1.5 rounded-lg border border-transparent px-2 py-1 text-xs font-semibold text-primary transition-colors hover:border-primary/20 hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            {message.replyCount} {message.replyCount === 1 ? 'reply' : 'replies'}
          </button>
        )}
      </div>

      {/* Hover toolbar — hidden while the message is still being delivered (its
          id is a temporary client id, so reactions/edits/deletes can't target it). */}
      {!editing && !message.pending && (
        <div
          className={cn(
            'absolute -top-3 right-3 items-center gap-0.5 rounded-lg border border-border/60 bg-popover p-0.5 shadow-lg',
            toolbarPinned ? 'flex' : 'hidden group-hover:flex group-hover:animate-scale-in',
          )}
        >
          <Popover open={reactOpen} onOpenChange={setReactOpen}>
            <PopoverTrigger asChild>
              <button className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" title="React">
                <Smile className="h-4 w-4" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-1.5 shadow-lg" align="end">
              <div className="flex gap-1">
                {REACTION_EMOJIS.map((e) => (
                  <button
                    key={e}
                    onClick={() => {
                      react.mutate({ messageId: message._id, emoji: e });
                      setReactOpen(false);
                    }}
                    className="grid h-8 w-8 place-items-center rounded-md text-lg transition-colors hover:bg-muted"
                  >
                    {e}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
          {showThreadIndicator && (
            <button
              onClick={() => onOpenThread?.(message)}
              className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              title="Reply in thread"
            >
              <MessageSquare className="h-4 w-4" />
            </button>
          )}
          <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
            <DropdownMenuTrigger asChild>
              <button className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="shadow-lg">
              {workspaceId && (
                <DropdownMenuItem onClick={() => setAddToBoardOpen(true)}>
                  <LayoutGrid className="mr-2 h-4 w-4" />
                  Add to board
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={() => pin.mutate({ messageId: message._id, pinned: !message.pinned })}
              >
                <Pin className="mr-2 h-4 w-4" />
                {message.pinned ? 'Unpin' : 'Pin to channel'}
              </DropdownMenuItem>
              {isOwn && (
                <DropdownMenuItem onClick={() => setEditing(true)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
              )}
              {isOwn && (
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => del.mutate(message._id)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>

      {workspaceId && (
        <AddToBoardDialog
          message={message}
          workspaceId={workspaceId}
          open={addToBoardOpen}
          onOpenChange={setAddToBoardOpen}
        />
      )}
    </>
  );
}
