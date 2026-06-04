'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth';
import type { BoardInvite, BoardInvitePreview, BoardShareLink } from '@/types/api';

/** The reusable "anyone with the link" join link for a board (admin only). */
export function useBoardShareLink(boardId: string, enabled = true) {
  return useQuery({
    queryKey: ['board-share-link', boardId],
    enabled: enabled && !!boardId,
    queryFn: () => api<BoardShareLink>(`/api/boards/${boardId}/share-link`),
  });
}

export function useEnableShareLink(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { regenerate?: boolean; role?: BoardInvite['role'] } = {}) =>
      api<BoardShareLink>(`/api/boards/${boardId}/share-link`, { method: 'POST', body: input }),
    onSuccess: (data) => qc.setQueryData(['board-share-link', boardId], data),
  });
}

export function useDisableShareLink(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api(`/api/boards/${boardId}/share-link`, { method: 'DELETE' }),
    onSuccess: () =>
      qc.setQueryData(['board-share-link', boardId], {
        enabled: false,
        token: null,
        url: null,
        role: 'member',
      } satisfies BoardShareLink),
  });
}

/** Pending per-email invites for a board (admin only). */
export function useBoardInvites(boardId: string, enabled = true) {
  return useQuery({
    queryKey: ['board-invites', boardId],
    enabled: enabled && !!boardId,
    queryFn: () =>
      api<{ items: BoardInvite[] }>(`/api/boards/${boardId}/invites`).then((r) => r.items),
  });
}

export function useCreateBoardInvite(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { email: string; role: BoardInvite['role'] }) =>
      api<BoardInvite>(`/api/boards/${boardId}/invites`, { method: 'POST', body: input }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['board-invites', boardId] }),
  });
}

export function useRevokeBoardInvite(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (inviteId: string) =>
      api(`/api/boards/${boardId}/invites/${inviteId}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['board-invites', boardId] }),
  });
}

/** Preview an invite token (public — used by the /join page before sign-in). */
export function useBoardInvitePreview(token: string | undefined) {
  return useQuery({
    queryKey: ['board-invite-preview', token],
    enabled: !!token,
    retry: false,
    queryFn: () => api<BoardInvitePreview>(`/api/boards/invite-info/${token}`),
  });
}

/**
 * If the visitor is already signed in and arrived with a board-invite token,
 * accept it and bounce them straight to the board — so logged-in users never
 * see a sign-up/sign-in form. Returns whether a join is in flight.
 */
export function useAutoJoinBoardIfAuthed(token: string | undefined): boolean {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const initialized = useAuthStore((s) => s.initialized);
  const accept = useAcceptBoardInvite();
  const done = useRef(false);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    if (done.current) return;
    if (!token || !initialized || !user) return;
    done.current = true;
    setJoining(true);
    accept
      .mutateAsync(token)
      .then((res) => router.replace(`/boards/${res.boardId}`))
      .catch(() => {
        // Let the page fall through to its normal (error/handled) state.
        done.current = false;
        setJoining(false);
      });
  }, [token, initialized, user, accept, router]);

  return joining;
}

/** Accept an invite token — joins the board (and the org as a guest). */
export function useAcceptBoardInvite() {
  return useMutation({
    mutationFn: (token: string) =>
      api<{ boardId: string; boardTitle: string; workspaceId: string }>('/api/boards/accept-invite', {
        method: 'POST',
        body: { token },
      }),
  });
}
