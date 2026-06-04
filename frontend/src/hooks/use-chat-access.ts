'use client';
import { useAuthStore } from '@/stores/auth';
import { useWorkspaces } from '@/hooks/use-boards';
import { useChannels } from '@/hooks/use-chat';

/**
 * Whether the current user may use the Chat section of their (primary) org.
 *
 * Full org members (owner/admin/member) always can. Guests — e.g. someone who
 * joined via a board invite — get Boards only, until an admin adds them to a
 * channel; once they belong to ≥1 channel, chat opens up for them.
 *
 * Defaults to allowed while data is still loading so we never hide chat from a
 * normal member; we only hide it once we've confirmed a guest with no channels.
 */
export function useChatAccess(): {
  canAccessChat: boolean;
  role: string | undefined;
  workspaceId: string | undefined;
} {
  const me = useAuthStore((s) => s.user?._id);
  const { data: orgs } = useWorkspaces();
  const ws = orgs?.[0];

  const role = ws
    ? String(ws.ownerId) === me
      ? 'owner'
      : ws.members?.find((m) => String(m.userId) === me)?.role
    : undefined;

  const { data: channels } = useChannels(role === 'guest' ? ws?._id : undefined);
  const hasAnyChannel = (channels?.length ?? 0) > 0;

  const canAccessChat = role !== 'guest' || hasAnyChannel;
  return { canAccessChat, role, workspaceId: ws?._id };
}
