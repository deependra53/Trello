'use client';
import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { api, ApiError } from '@/lib/api';
import type { Board, BoardFull, List, Workspace } from '@/types/api';

export function useWorkspaces() {
  return useQuery({
    queryKey: ['workspaces'],
    queryFn: () => api<{ items: Workspace[] }>('/api/workspaces').then((r) => r.items),
  });
}

export function useCreateWorkspace() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { name: string; description?: string }) =>
      api<Workspace>('/api/workspaces', { method: 'POST', body: input }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workspaces'] }),
  });
}

export function useUpdateWorkspace() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      workspaceId,
      ...patch
    }: {
      workspaceId: string;
      name?: string;
      description?: string;
      visibility?: 'private' | 'public';
    }) => api<Workspace>(`/api/workspaces/${workspaceId}`, { method: 'PATCH', body: patch }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workspaces'] }),
  });
}

export function useDeleteWorkspace() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (workspaceId: string) =>
      api(`/api/workspaces/${workspaceId}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workspaces'] }),
  });
}

export function useWorkspaceBoards(workspaceId: string | undefined) {
  return useQuery({
    queryKey: ['workspace-boards', workspaceId],
    enabled: !!workspaceId,
    queryFn: () =>
      api<{ items: Board[] }>(`/api/workspaces/${workspaceId}/boards`).then((r) => r.items),
  });
}

/** Boards in the workspace the user can add cards to (admin/member only). */
export function useWritableBoards(workspaceId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: ['workspace-boards', workspaceId, 'writable'],
    enabled: !!workspaceId && enabled,
    queryFn: () =>
      api<{ items: Board[] }>(`/api/workspaces/${workspaceId}/boards?scope=writable`).then(
        (r) => r.items,
      ),
  });
}

/** Just the lists of a board — lightweight, for pickers (no cards payload). */
export function useBoardLists(boardId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: ['board-lists', boardId],
    enabled: !!boardId && enabled,
    queryFn: () => api<{ items: List[] }>(`/api/boards/${boardId}/lists`).then((r) => r.items),
  });
}

export function useCreateBoard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      workspaceId,
      ...body
    }: {
      workspaceId: string;
      title: string;
      background?: Board['background'];
      visibility?: Board['visibility'];
    }) =>
      api<Board>(`/api/workspaces/${workspaceId}/boards`, { method: 'POST', body }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['workspace-boards', vars.workspaceId] });
    },
  });
}

const boardQueryKey = (boardId: string) => ['board', boardId] as const;
const fetchBoard = (boardId: string) => api<BoardFull>(`/api/boards/${boardId}`);

export function useBoard(boardId: string | undefined) {
  return useQuery({
    queryKey: ['board', boardId],
    enabled: !!boardId,
    queryFn: () => fetchBoard(boardId as string),
    // Don't retry client errors (403 no-access, 404 not-found) — they won't
    // succeed on retry and we want the access-denied screen to show promptly.
    retry: (count, err) =>
      !(err instanceof ApiError && err.status >= 400 && err.status < 500) && count < 1,
  });
}

/**
 * Warm the cache for a board before the user navigates to it. Called on intent
 * (hover/focus/pointer-down on a board link) so the board page resolves its
 * skeleton to real content fast — instantly when the board is already cached.
 * `prefetchQuery` respects the default staleTime, so a fresh board is a no-op
 * and rapid re-hovers don't spam the API.
 */
export function prefetchBoard(qc: QueryClient, boardId: string) {
  return qc.prefetchQuery({
    queryKey: boardQueryKey(boardId),
    queryFn: () => fetchBoard(boardId),
  });
}

export function useStarBoard(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api<{ starred: boolean }>(`/api/boards/${boardId}/star`, { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workspace-boards'] }),
  });
}
