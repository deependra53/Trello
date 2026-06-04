'use client';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Mail, Trash2, UserPlus, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api, ApiError } from '@/lib/api';
import { useInvites, useOrgMembers, useCreateInvite, useRevokeInvite } from '@/hooks/use-chat';
import { UserAvatar } from '@/components/chat/user-avatar';
import { cn } from '@/lib/utils';
import type { Workspace } from '@/types/api';

export function OrgMembersSection({
  workspace,
  currentUserId,
}: {
  workspace: Workspace;
  currentUserId: string;
}) {
  const qc = useQueryClient();
  const { data: members } = useOrgMembers(workspace._id);
  const { data: invites } = useInvites(workspace._id);
  const createInvite = useCreateInvite(workspace._id);
  const revokeInvite = useRevokeInvite(workspace._id);

  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'member' | 'guest'>('member');

  const myRole =
    String(workspace.ownerId) === currentUserId
      ? 'owner'
      : workspace.members?.find((m) => String(m.userId) === currentUserId)?.role ?? 'member';
  const canManage = myRole === 'owner' || myRole === 'admin';

  const removeMember = useMutation({
    mutationFn: (userId: string) =>
      api(`/api/workspaces/${workspace._id}/members/${userId}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['org-members', workspace._id] });
      toast.success('Member removed');
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : 'Could not remove member'),
  });

  async function invite() {
    if (!email.trim()) return;
    try {
      await createInvite.mutateAsync({ email: email.trim(), role });
      toast.success(`Invite sent to ${email.trim()}`);
      setEmail('');
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Could not send invite');
    }
  }

  return (
    <div className="space-y-5">
      {canManage && (
        <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
          <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <UserPlus className="h-4 w-4" /> Invite people to {workspace.name}
          </h3>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="teammate@company.com"
                className="pl-9"
                onKeyDown={(e) => e.key === 'Enter' && invite()}
              />
            </div>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as 'admin' | 'member' | 'guest')}
              className="h-10 rounded-lg border border-border/60 bg-background px-3 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-0"
            >
              <option value="member">Member</option>
              <option value="admin">Admin</option>
              <option value="guest">Guest</option>
            </select>
            <Button onClick={invite} disabled={!email.trim() || createInvite.isPending}>
              Send invite
            </Button>
          </div>

          {invites && invites.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Pending invites
              </p>
              <ul className="space-y-1.5">
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
      )}

      <ul className="divide-y divide-border/60">
        {members?.map((m) => {
          const isOwner = String(workspace.ownerId) === m.userId;
          return (
            <li
              key={m.userId}
              className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-muted/50"
            >
              <UserAvatar user={m.profile} id={m.userId} className="h-8 w-8" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">
                  {m.profile?.fullName ?? m.userId}
                  {m.userId === currentUserId && (
                    <span className="ml-1.5 text-xs text-muted-foreground">(you)</span>
                  )}
                </div>
                <div className="truncate text-xs text-muted-foreground">{m.profile?.email}</div>
              </div>
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 text-xs font-medium capitalize',
                  isOwner ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground',
                )}
              >
                {isOwner ? 'Owner' : m.role}
              </span>
              {canManage && !isOwner && m.userId !== currentUserId && (
                <button
                  onClick={() => removeMember.mutate(m.userId)}
                  className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-destructive"
                  title="Remove member"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
