'use client';
import { useMemo, useState } from 'react';
import { Hash, Lock, Mail, Search, UserPlus, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { ApiError } from '@/lib/api';
import {
  useAddChannelMembers,
  useCreateChannel,
  useCreateInvite,
  useGetOrCreateDm,
  useInvites,
  useRevokeInvite,
} from '@/hooks/use-chat';
import { MemberPicker } from './member-picker';
import { UserAvatar } from './user-avatar';
import type { OrgMember, UserProfile } from '@/types/api';

export function CreateChannelDialog({
  workspaceId,
  members,
  currentUserId,
  open,
  onOpenChange,
  onCreated,
}: {
  workspaceId: string;
  members: OrgMember[];
  currentUserId: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated: (channelId: string) => void;
}) {
  const [name, setName] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const create = useCreateChannel(workspaceId);

  async function submit() {
    if (!name.trim()) return;
    try {
      const ch = await create.mutateAsync({ name: name.trim(), isPrivate, memberIds: selected });
      onCreated(ch._id);
      onOpenChange(false);
      setName('');
      setSelected([]);
      setIsPrivate(false);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Could not create channel');
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a channel</DialogTitle>
          <DialogDescription>Channels are where your team communicates.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Name
            </label>
            <div className="relative">
              <Hash className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={name}
                onChange={(e) => setName(e.target.value.replace(/\s+/g, '-').toLowerCase())}
                placeholder="marketing"
                className="pl-9"
                autoFocus
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsPrivate((v) => !v)}
            className="flex w-full items-center justify-between rounded-lg border border-border/60 bg-card px-3 py-2.5 text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
          >
            <div className="flex items-center gap-2.5">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
                <Lock className="h-4 w-4" />
              </span>
              <div>
                <div className="text-sm font-medium">Private channel</div>
                <div className="text-xs text-muted-foreground">Only invited members can see it</div>
              </div>
            </div>
            <span
              className={cn(
                'relative h-5 w-9 shrink-0 rounded-full transition-colors',
                isPrivate ? 'bg-primary' : 'bg-muted',
              )}
            >
              <span
                className={cn(
                  'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform',
                  isPrivate ? 'translate-x-4' : 'translate-x-0.5',
                )}
              />
            </span>
          </button>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Add people
            </label>
            <MemberPicker
              members={members}
              selected={selected}
              excludeIds={[currentUserId]}
              onToggle={(id) =>
                setSelected((prev) =>
                  prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
                )
              }
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!name.trim() || create.isPending}>
            Create channel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function StartDmDialog({
  workspaceId,
  members,
  currentUserId,
  open,
  onOpenChange,
  onCreated,
}: {
  workspaceId: string;
  members: OrgMember[];
  currentUserId: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated: (channelId: string) => void;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const dm = useGetOrCreateDm(workspaceId);

  async function submit() {
    if (selected.length === 0) return;
    try {
      const ch = await dm.mutateAsync(selected);
      onCreated(ch._id);
      onOpenChange(false);
      setSelected([]);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Could not start conversation');
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New message</DialogTitle>
          <DialogDescription>Start a direct message with teammates.</DialogDescription>
        </DialogHeader>
        <MemberPicker
          members={members}
          selected={selected}
          excludeIds={[currentUserId]}
          onToggle={(id) =>
            setSelected((prev) =>
              prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
            )
          }
        />
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={selected.length === 0 || dm.isPending}>
            Start chat
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function AddMembersDialog({
  workspaceId,
  channelId,
  members,
  existingIds,
  open,
  onOpenChange,
}: {
  workspaceId: string;
  channelId: string;
  members: OrgMember[];
  existingIds: string[];
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const add = useAddChannelMembers(workspaceId, channelId);

  async function submit() {
    if (selected.length === 0) return;
    try {
      await add.mutateAsync(selected);
      toast.success('Members added');
      onOpenChange(false);
      setSelected([]);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Could not add members');
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add members</DialogTitle>
        </DialogHeader>
        <MemberPicker
          members={members}
          selected={selected}
          excludeIds={existingIds}
          onToggle={(id) =>
            setSelected((prev) =>
              prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
            )
          }
        />
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={selected.length === 0 || add.isPending}>
            Add
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Read-only roster of everyone in a channel — opened from the member-count pill
 * in the conversation header. Members come straight from the loaded channel, so
 * there's no extra fetch; we just search/sort the array we already have.
 */
export function MembersDialog({
  members,
  channelName,
  currentUserId,
  open,
  onOpenChange,
}: {
  members: Array<{ userId: string; role: string; profile?: UserProfile }>;
  channelName?: string;
  currentUserId: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [q, setQ] = useState('');
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return members
      .filter(
        (m) =>
          !term ||
          m.profile?.fullName?.toLowerCase().includes(term) ||
          m.profile?.email?.toLowerCase().includes(term),
      )
      // Show the current user first, then alphabetical by name.
      .sort((a, b) => {
        if (a.userId === currentUserId) return -1;
        if (b.userId === currentUserId) return 1;
        return (a.profile?.fullName ?? '').localeCompare(b.profile?.fullName ?? '');
      });
  }, [members, q, currentUserId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{channelName ? `Members of #${channelName}` : 'Members'}</DialogTitle>
          <DialogDescription>
            {members.length} {members.length === 1 ? 'person has' : 'people have'} access to this
            channel.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search members…"
              className="pl-9"
            />
          </div>
          <ul className="max-h-72 space-y-0.5 overflow-y-auto scrollbar-thin">
            {filtered.length === 0 && (
              <li className="px-2 py-6 text-center text-sm text-muted-foreground">
                No members found
              </li>
            )}
            {filtered.map((m) => (
              <li
                key={m.userId}
                className="flex items-center gap-3 rounded-lg px-2 py-1.5 text-sm"
              >
                <UserAvatar user={m.profile} id={m.userId} className="h-8 w-8" />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">
                    {m.profile?.fullName ?? m.userId}
                    {m.userId === currentUserId && (
                      <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                        (you)
                      </span>
                    )}
                  </div>
                  {m.profile?.email && (
                    <div className="truncate text-xs text-muted-foreground">{m.profile.email}</div>
                  )}
                </div>
                {(m.role === 'admin' || m.role === 'owner') && (
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium capitalize text-muted-foreground">
                    {m.role}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Invite a brand-new person to the whole organization by email. Unlike adding
 * someone to a single channel, an org invitee becomes a full member — so on
 * accept they get chat access (public channels) AND access to workspace-visible
 * boards. Roles are limited to member/admin here; "guest" is intentionally
 * omitted since guests get neither chat nor board access.
 */
export function InvitePeopleDialog({
  workspaceId,
  orgName,
  open,
  onOpenChange,
}: {
  workspaceId: string;
  orgName: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'member'>('member');
  const createInvite = useCreateInvite(workspaceId);
  const revokeInvite = useRevokeInvite(workspaceId);
  const { data: invites } = useInvites(open ? workspaceId : undefined);

  async function submit() {
    const value = email.trim();
    if (!value) return;
    try {
      await createInvite.mutateAsync({ email: value, role });
      toast.success(`Invite sent to ${value}`);
      setEmail('');
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Could not send invite');
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite people to {orgName}</DialogTitle>
          <DialogDescription>
            Invitees join the organization — they get access to chat and workspace-visible boards.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="teammate@company.com"
                className="pl-9"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && submit()}
              />
            </div>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as 'admin' | 'member')}
              className="h-10 rounded-lg border border-border/60 bg-background px-3 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-0"
            >
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {invites && invites.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Pending invites
              </p>
              <ul className="max-h-48 space-y-1.5 overflow-y-auto">
                {invites.map((inv) => (
                  <li
                    key={inv._id}
                    className="flex items-center gap-2 rounded-lg border border-border/60 bg-background px-3 py-2 text-sm transition-colors hover:bg-muted/50"
                  >
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="flex-1 truncate">{inv.email}</span>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium capitalize text-muted-foreground">
                      {inv.role}
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
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={submit} disabled={!email.trim() || createInvite.isPending}>
            <UserPlus className="mr-1.5 h-4 w-4" /> Send invite
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
