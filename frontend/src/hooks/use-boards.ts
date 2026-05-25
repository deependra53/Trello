'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Board, BoardFull, Workspace } from '@/types/api';

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

export function useWorkspaceBoards(workspaceId: string | undefined) {
  return useQuery({
    queryKey: ['workspace-boards', workspaceId],
    enabled: !!workspaceId,
    queryFn: () =>
      api<{ items: Board[] }>(`/api/workspaces/${workspaceId}/boards`).then((r) => r.items),
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

export function useBoard(boardId: string | undefined) {
  return useQuery({
    queryKey: ['board', boardId],
    enabled: !!boardId,
    queryFn: () => api<BoardFull>(`/api/boards/${boardId}`),
  });
}

export function useStarBoard(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api<{ starred: boolean }>(`/api/boards/${boardId}/star`, { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workspace-boards'] }),
  });
}
