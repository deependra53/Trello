'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { BoardFull, Card, Comment, List } from '@/types/api';

interface BoardKey {
  boardId: string;
}

export function useCreateList(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (title: string) =>
      api<List>(`/api/boards/${boardId}/lists`, { method: 'POST', body: { title } }),
    onMutate: async (title) => {
      await qc.cancelQueries({ queryKey: ['board', boardId] });
      const prev = qc.getQueryData<BoardFull>(['board', boardId]);
      if (prev) {
        const tempId = `temp-${Date.now()}`;
        const optimistic: List = {
          _id: tempId,
          boardId,
          title,
          position: (prev.lists.at(-1)?.position ?? 0) + 65_536,
        };
        qc.setQueryData<BoardFull>(['board', boardId], {
          ...prev,
          lists: [...prev.lists, optimistic],
        });
      }
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(['board', boardId], ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['board', boardId] }),
  });
}

export function useUpdateList(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ listId, patch }: { listId: string; patch: Partial<List> }) =>
      api<List>(`/api/lists/${listId}`, { method: 'PATCH', body: patch }),
    onSettled: () => qc.invalidateQueries({ queryKey: ['board', boardId] }),
  });
}

export function useArchiveList(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (listId: string) =>
      api(`/api/lists/${listId}/archive`, { method: 'POST' }),
    onSettled: () => qc.invalidateQueries({ queryKey: ['board', boardId] }),
  });
}

export function useMoveList(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      listId,
      prevId,
      nextId,
    }: {
      listId: string;
      prevId: string | null;
      nextId: string | null;
    }) =>
      api<List>(`/api/lists/${listId}/move`, {
        method: 'POST',
        body: { prevId, nextId },
      }),
    onSettled: () => qc.invalidateQueries({ queryKey: ['board', boardId] }),
  });
}

export function useCreateCard(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ listId, title }: { listId: string; title: string }) =>
      api<Card>(`/api/lists/${listId}/cards`, { method: 'POST', body: { title } }),
    onMutate: async ({ listId, title }) => {
      await qc.cancelQueries({ queryKey: ['board', boardId] });
      const prev = qc.getQueryData<BoardFull>(['board', boardId]);
      if (prev) {
        const tempId = `temp-${Date.now()}`;
        const last = prev.cards.filter((c) => c.listId === listId).at(-1);
        const optimistic: Card = {
          _id: tempId,
          listId,
          boardId,
          title,
          position: (last?.position ?? 0) + 65_536,
        };
        qc.setQueryData<BoardFull>(['board', boardId], {
          ...prev,
          cards: [...prev.cards, optimistic],
        });
      }
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(['board', boardId], ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['board', boardId] }),
  });
}

export function useUpdateCard(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ cardId, patch }: { cardId: string; patch: Record<string, unknown> }) =>
      api<Card>(`/api/cards/${cardId}`, { method: 'PATCH', body: patch }),
    onSettled: () => qc.invalidateQueries({ queryKey: ['board', boardId] }),
  });
}

export function useArchiveCard(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (cardId: string) =>
      api(`/api/cards/${cardId}/archive`, { method: 'POST' }),
    onSettled: () => qc.invalidateQueries({ queryKey: ['board', boardId] }),
  });
}

export function useMoveCard({ boardId }: BoardKey) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      cardId,
      listId,
      prevId,
      nextId,
    }: {
      cardId: string;
      listId: string;
      prevId: string | null;
      nextId: string | null;
    }) =>
      api<Card>(`/api/cards/${cardId}/move`, {
        method: 'POST',
        body: { listId, prevId, nextId },
      }),
    onMutate: async ({ cardId, listId }) => {
      await qc.cancelQueries({ queryKey: ['board', boardId] });
      const prev = qc.getQueryData<BoardFull>(['board', boardId]);
      if (prev) {
        const next = {
          ...prev,
          cards: prev.cards.map((c) => (c._id === cardId ? { ...c, listId } : c)),
        };
        qc.setQueryData(['board', boardId], next);
      }
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(['board', boardId], ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['board', boardId] }),
  });
}

export function useCardComments(cardId: string | undefined) {
  return useQuery({
    queryKey: ['card', cardId, 'comments'],
    enabled: !!cardId,
    queryFn: () =>
      api<{ items: Comment[]; nextCursor?: string }>(`/api/cards/${cardId}/comments`).then(
        (r) => r.items,
      ),
  });
}

export function useAddComment(cardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: string) =>
      api<Comment>(`/api/cards/${cardId}/comments`, {
        method: 'POST',
        body: { body, mentions: [] },
      }),
    onSettled: () => qc.invalidateQueries({ queryKey: ['card', cardId, 'comments'] }),
  });
}
