'use client';
import { useState } from 'react';
import { Check, Copy, Link2, Mail, RefreshCw, Users, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UserAvatar } from '@/components/chat/user-avatar';
import {
  useBoardInvites,
  useBoardShareLink,
  useCreateBoardInvite,
  useDisableShareLink,
  useEnableShareLink,
  useRevokeBoardInvite,
} from '@/hooks/use-board-invites';
import { ApiError } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { BoardFull } from '@/types/api';

const ROLE_LABEL: Record<string, string> = {
  admin: 'Admin',
  member: 'Member',
  observer: 'Observer',
};

export function BoardShareDialog({
  board,
  open,
  onOpenChange,
  currentUserId,
}: {
  board: BoardFull;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUserId?: string;
}) {
  const isAdmin =
    !!currentUserId &&
    (board.members ?? []).some((m) => m.userId === currentUserId && m.role === 'admin');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-muted-foreground" />
            Share board
          </DialogTitle>
          <DialogDescription>
            {isAdmin
              ? 'Invite people with a link or by email — anyone who joins can collaborate on this board.'
              : 'People with access to this board.'}
          </DialogDescription>
        </DialogHeader>

        {isAdmin && (
          <div className="space-y-5">
            <ShareLinkSection boardId={board._id} open={open} />
            <EmailInviteSection boardId={board._id} open={open} />
          </div>
        )}

        <MembersList board={board} currentUserId={currentUserId} />
      </DialogContent>
    </Dialog>
  );
}

function ShareLinkSection({ boardId, open }: { boardId: string; open: boolean }) {
  const { data: link, isLoading } = useBoardShareLink(boardId, open);
  const enable = useEnableShareLink(boardId);
  const disable = useDisableShareLink(boardId);
  const [copied, setCopied] = useState(false);

  const url = link?.url ?? '';

  async function copy() {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('Link copied');
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error('Could not copy — select and copy manually');
    }
  }

  return (
    <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
      <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <Link2 className="h-4 w-4" /> Invite link
      </h3>

      {isLoading ? (
        <div className="h-10 animate-pulse rounded-lg bg-muted" />
      ) : link?.enabled ? (
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input readOnly value={url} onFocus={(e) => e.currentTarget.select()} className="flex-1 text-xs" />
            <Button type="button" variant="secondary" onClick={copy} className="shrink-0 gap-1.5">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Copied' : 'Copy'}
            </Button>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Anyone with this link can join as a member.
            </p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() =>
                  enable.mutate(
                    { regenerate: true },
                    { onSuccess: () => toast.success('New link generated — the old one no longer works') },
                  )
                }
                disabled={enable.isPending}
                className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <RefreshCw className={cn('h-3.5 w-3.5', enable.isPending && 'animate-spin')} /> Regenerate
              </button>
              <button
                type="button"
                onClick={() => disable.mutate(undefined, { onSuccess: () => toast.success('Invite link turned off') })}
                disabled={disable.isPending}
                className="rounded-lg px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-destructive"
              >
                Turn off
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            Create a link to let people join this board.
          </p>
          <Button
            type="button"
            onClick={() => enable.mutate({}, { onSuccess: () => toast.success('Invite link created') })}
            disabled={enable.isPending}
            className="shrink-0"
          >
            Create link
          </Button>
        </div>
      )}
    </div>
  );
}

function EmailInviteSection({ boardId, open }: { boardId: string; open: boolean }) {
  const { data: invites } = useBoardInvites(boardId, open);
  const createInvite = useCreateBoardInvite(boardId);
  const revokeInvite = useRevokeBoardInvite(boardId);
  const [email, setEmail] = useState('');

  async function invite() {
    const value = email.trim();
    if (!value) return;
    try {
      await createInvite.mutateAsync({ email: value, role: 'member' });
      toast.success(`Invite sent to ${value}`);
      setEmail('');
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Could not send invite');
    }
  }

  return (
    <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
      <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <Mail className="h-4 w-4" /> Invite by email
      </h3>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="teammate@company.com"
            className="pl-9"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                invite();
              }
            }}
          />
        </div>
        <Button onClick={invite} disabled={!email.trim() || createInvite.isPending} className="shrink-0">
          Send
        </Button>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        We&apos;ll email a link to join — it works even if they aren&apos;t in your organization yet.
      </p>

      {invites && invites.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {invites.map((inv) => (
            <li
              key={inv._id}
              className="flex items-center gap-2 rounded-lg border border-border/60 bg-background px-3 py-2 text-sm"
            >
              <Mail className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="flex-1 truncate">{inv.email}</span>
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                Pending
              </span>
              <button
                onClick={() => revokeInvite.mutate(inv._id)}
                className="grid h-7 w-7 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-destructive"
                title="Revoke invite"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function MembersList({ board, currentUserId }: { board: BoardFull; currentUserId?: string }) {
  const profileById = new Map((board.memberProfiles ?? []).map((p) => [p._id, p]));
  const rows = (board.members ?? []).map((m) => ({
    userId: m.userId,
    role: m.role,
    profile: profileById.get(m.userId),
  }));

  return (
    <div>
      <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Members
        <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
          {rows.length}
        </span>
      </h3>
      <ul className="max-h-[35vh] space-y-1 overflow-y-auto">
        {rows.map((r) => (
          <li
            key={r.userId}
            className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-muted/60"
          >
            <UserAvatar
              id={r.userId}
              name={r.profile?.fullName}
              avatarUrl={r.profile?.avatarUrl}
              className="h-9 w-9"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">
                {r.profile?.fullName ?? 'Unknown user'}
                {r.userId === currentUserId && (
                  <span className="ml-1.5 text-xs text-muted-foreground">(you)</span>
                )}
              </p>
              {r.profile?.email && (
                <p className="truncate text-xs text-muted-foreground">{r.profile.email}</p>
              )}
            </div>
            <span
              className={cn(
                'shrink-0 rounded-full px-2 py-0.5 text-xs font-medium',
                r.role === 'admin' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground',
              )}
            >
              {ROLE_LABEL[r.role] ?? r.role}
            </span>
          </li>
        ))}
        {rows.length === 0 && (
          <li className="px-2 py-6 text-center text-sm text-muted-foreground">No members yet.</li>
        )}
      </ul>
    </div>
  );
}
