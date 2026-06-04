'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import type { BoardFull, Card, Comment, Label, List } from '@/types/api';
import { applyCardMove, applyListMove } from '@/lib/board-reorder';
import { trackPendingMove } from '@/lib/pending-moves';
import { useAuthStore } from '@/stores/auth';

function patchCardLocally(
  qc: ReturnType<typeof useQueryClient>,
  boardId: string,
  cardId: string,
  patch: Partial<Card>,
) {
  const prev = qc.getQueryData<BoardFull>(['board', boardId]);
  if (!prev) return prev;
  qc.setQueryData<BoardFull>(['board', boardId], {
    ...prev,
    cards: prev.cards.map((c) => (c._id === cardId ? { ...c, ...patch } : c)),
  });
  return prev;
}

function prependOptimisticActivity(
  qc: ReturnType<typeof useQueryClient>,
  cardId: string,
  type: string,
  payload: Record<string, unknown>,
) {
  const userId = useAuthStore.getState().user?._id;
  if (!userId) return;
  const key = ['card', cardId, 'activity'] as const;
  const prev = qc.getQueryData<CardActivity[]>(key) ?? [];
  const entry: CardActivity = {
    _id: `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    actorId: userId,
    cardId,
    payload,
    createdAt: new Date().toISOString(),
  };
  qc.setQueryData<CardActivity[]>(key, [entry, ...prev]);
}

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
      clientEventId,
      listId,
      prevId,
      nextId,
    }: {
      clientEventId: string;
      listId: string;
      prevId: string | null;
      nextId: string | null;
    }) =>
      api<List>(`/api/lists/${listId}/move`, {
        method: 'POST',
        body: { prevId, nextId, clientEventId },
      }),
    onMutate: async (vars) => {
      trackPendingMove(vars.clientEventId);
      await qc.cancelQueries({ queryKey: ['board', boardId] });
      const prev = qc.getQueryData<BoardFull>(['board', boardId]);
      if (prev) {
        qc.setQueryData<BoardFull>(
          ['board', boardId],
          applyListMove(prev, {
            listId: vars.listId,
            prevId: vars.prevId,
            nextId: vars.nextId,
          }),
        );
      }
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(['board', boardId], ctx.prev);
      toast.error('Move failed — restored the previous order.');
    },
    // No onSettled invalidate — local cache is correct, echo is deduped.
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

/**
 * Create a card from a chat message. The card's title (channel name), body and
 * attachments are derived server-side from the message — the client just names
 * the destination list + source message. Not board-scoped (the caller is in
 * chat, not on a board), so it refreshes the destination board's cache on success.
 */
export function useAddMessageToCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      listId,
      messageId,
      title,
      description,
    }: {
      listId: string;
      messageId: string;
      title?: string;
      description?: string;
    }) =>
      api<Card>(`/api/lists/${listId}/cards/from-message`, {
        method: 'POST',
        body: { messageId, title, description },
      }),
    onSuccess: (card) => {
      qc.invalidateQueries({ queryKey: ['board', card.boardId] });
    },
  });
}

export function useUpdateCard(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ cardId, patch }: { cardId: string; patch: Record<string, unknown> }) =>
      api<Card>(`/api/cards/${cardId}`, { method: 'PATCH', body: patch }),
    onMutate: async ({ cardId, patch }) => {
      await qc.cancelQueries({ queryKey: ['board', boardId] });
      const prev = qc.getQueryData<BoardFull>(['board', boardId]);
      patchCardLocally(qc, boardId, cardId, patch as Partial<Card>);
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(['board', boardId], ctx.prev);
      toast.error('Update failed — reverted.');
    },
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
      clientEventId,
      cardId,
      listId,
      prevId,
      nextId,
    }: {
      clientEventId: string;
      cardId: string;
      listId: string;
      prevId: string | null;
      nextId: string | null;
    }) =>
      api<Card>(`/api/cards/${cardId}/move`, {
        method: 'POST',
        body: { listId, prevId, nextId, clientEventId },
      }),
    onMutate: async (vars) => {
      trackPendingMove(vars.clientEventId);
      await qc.cancelQueries({ queryKey: ['board', boardId] });
      const prev = qc.getQueryData<BoardFull>(['board', boardId]);
      if (prev) {
        qc.setQueryData<BoardFull>(
          ['board', boardId],
          applyCardMove(prev, {
            cardId: vars.cardId,
            toListId: vars.listId,
            prevId: vars.prevId,
            nextId: vars.nextId,
          }),
        );
      }
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(['board', boardId], ctx.prev);
      toast.error('Move failed — restored the previous order.');
    },
    // No onSettled invalidate — cache already correct, echo deduped.
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

export function useUpdateComment(cardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ commentId, body }: { commentId: string; body: string }) =>
      api<Comment>(`/api/cards/${cardId}/comments/${commentId}`, {
        method: 'PATCH',
        body: { body },
      }),
    onSettled: () => qc.invalidateQueries({ queryKey: ['card', cardId, 'comments'] }),
  });
}

export function useDeleteComment(cardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (commentId: string) =>
      api(`/api/cards/${cardId}/comments/${commentId}`, { method: 'DELETE' }),
    onSettled: () => qc.invalidateQueries({ queryKey: ['card', cardId, 'comments'] }),
  });
}

export function useToggleCardMember(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ cardId, userId }: { cardId: string; userId: string }) =>
      api<Card>(`/api/cards/${cardId}/members`, { method: 'POST', body: { userId } }),
    onMutate: async ({ cardId, userId }) => {
      await qc.cancelQueries({ queryKey: ['board', boardId] });
      const prev = qc.getQueryData<BoardFull>(['board', boardId]);
      const card = prev?.cards.find((c) => c._id === cardId);
      if (card) {
        const has = card.members?.includes(userId);
        const next = has
          ? card.members?.filter((m) => m !== userId)
          : [...(card.members ?? []), userId];
        patchCardLocally(qc, boardId, cardId, { members: next });
      }
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(['board', boardId], ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['board', boardId] }),
  });
}

export function useToggleCardLabel(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ cardId, labelId }: { cardId: string; labelId: string }) =>
      api<Card>(`/api/cards/${cardId}/labels`, { method: 'POST', body: { labelId } }),
    onMutate: async ({ cardId, labelId }) => {
      await qc.cancelQueries({ queryKey: ['board', boardId] });
      const prev = qc.getQueryData<BoardFull>(['board', boardId]);
      const card = prev?.cards.find((c) => c._id === cardId);
      if (card) {
        const has = card.labels?.includes(labelId);
        const next = has
          ? card.labels?.filter((l) => l !== labelId)
          : [...(card.labels ?? []), labelId];
        patchCardLocally(qc, boardId, cardId, { labels: next });
      }
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(['board', boardId], ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['board', boardId] }),
  });
}

export function useCreateLabel(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, color }: { name: string; color: string }) =>
      api<Label>(`/api/boards/${boardId}/labels`, {
        method: 'POST',
        body: { name, color },
      }),
    onSuccess: (label) => {
      const prev = qc.getQueryData<BoardFull>(['board', boardId]);
      if (prev) {
        qc.setQueryData<BoardFull>(['board', boardId], {
          ...prev,
          labels: [...prev.labels, label],
        });
      }
      qc.invalidateQueries({ queryKey: ['board', boardId] });
    },
  });
}

export function useWatchCard(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (cardId: string) =>
      api<Card>(`/api/cards/${cardId}/watch`, { method: 'POST' }),
    onSettled: () => qc.invalidateQueries({ queryKey: ['board', boardId] }),
  });
}

export function useAddChecklist(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ cardId, title }: { cardId: string; title: string }) =>
      api<Card>(`/api/cards/${cardId}/checklists`, { method: 'POST', body: { title } }),
    onSettled: () => qc.invalidateQueries({ queryKey: ['board', boardId] }),
  });
}

export function useUpdateChecklist(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      cardId,
      checklistId,
      patch,
    }: {
      cardId: string;
      checklistId: string;
      patch: { title?: string; position?: number };
    }) =>
      api<Card>(`/api/cards/${cardId}/checklists/${checklistId}`, {
        method: 'PATCH',
        body: patch,
      }),
    onSettled: () => qc.invalidateQueries({ queryKey: ['board', boardId] }),
  });
}

export function useDeleteChecklist(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ cardId, checklistId }: { cardId: string; checklistId: string }) =>
      api(`/api/cards/${cardId}/checklists/${checklistId}`, { method: 'DELETE' }),
    onSettled: () => qc.invalidateQueries({ queryKey: ['board', boardId] }),
  });
}

export function useAddChecklistItem(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      cardId,
      checklistId,
      text,
    }: {
      cardId: string;
      checklistId: string;
      text: string;
    }) =>
      api<Card>(`/api/cards/${cardId}/checklists/${checklistId}/items`, {
        method: 'POST',
        body: { text },
      }),
    onMutate: async ({ cardId, checklistId, text }) => {
      await qc.cancelQueries({ queryKey: ['board', boardId] });
      const prev = qc.getQueryData<BoardFull>(['board', boardId]);
      const card = prev?.cards.find((c) => c._id === cardId);
      if (card?.checklists) {
        const tempId = `temp-${Date.now()}`;
        const next = card.checklists.map((cl) =>
          cl.id === checklistId
            ? {
                ...cl,
                items: [
                  ...cl.items,
                  {
                    id: tempId,
                    text,
                    completed: false,
                    position: (cl.items.length + 1) * 65_536,
                  },
                ],
              }
            : cl,
        );
        patchCardLocally(qc, boardId, cardId, { checklists: next });
      }
      prependOptimisticActivity(qc, cardId, 'card.checklist.item.added', {
        checklistId,
        text,
      });
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(['board', boardId], ctx.prev);
    },
    onSettled: (_d, _e, vars) => {
      qc.invalidateQueries({ queryKey: ['board', boardId] });
      qc.invalidateQueries({ queryKey: ['card', vars.cardId, 'activity'] });
    },
  });
}

export function useUpdateChecklistItem(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      cardId,
      itemId,
      patch,
    }: {
      cardId: string;
      itemId: string;
      patch: {
        text?: string;
        completed?: boolean;
        memberId?: string | null;
        dueDate?: string | null;
      };
    }) =>
      api<Card>(`/api/cards/${cardId}/checklist-items/${itemId}`, {
        method: 'PATCH',
        body: patch,
      }),
    onMutate: async ({ cardId, itemId, patch }) => {
      await qc.cancelQueries({ queryKey: ['board', boardId] });
      const prev = qc.getQueryData<BoardFull>(['board', boardId]);
      const card = prev?.cards.find((c) => c._id === cardId);
      let foundItem: { text: string; completed: boolean; memberId?: string | null; dueDate?: string | null; checklistId: string } | undefined;
      if (card?.checklists) {
        for (const cl of card.checklists) {
          const it = cl.items.find((i) => i.id === itemId);
          if (it) {
            foundItem = {
              text: it.text,
              completed: it.completed,
              memberId: it.memberId ?? null,
              dueDate: it.dueDate ?? null,
              checklistId: cl.id,
            };
            break;
          }
        }
        const next = card.checklists.map((cl) => ({
          ...cl,
          items: cl.items.map((it) => (it.id === itemId ? { ...it, ...patch } : it)),
        }));
        patchCardLocally(qc, boardId, cardId, { checklists: next });
      }
      if (foundItem) {
        const base = { checklistId: foundItem.checklistId, itemId, text: foundItem.text };
        if (patch.completed !== undefined && patch.completed !== foundItem.completed) {
          prependOptimisticActivity(
            qc,
            cardId,
            patch.completed
              ? 'card.checklist.item.completed'
              : 'card.checklist.item.uncompleted',
            base,
          );
        } else if (patch.memberId !== undefined && (patch.memberId ?? null) !== foundItem.memberId) {
          prependOptimisticActivity(
            qc,
            cardId,
            patch.memberId
              ? 'card.checklist.item.assigned'
              : 'card.checklist.item.unassigned',
            { ...base, memberId: patch.memberId ?? null },
          );
        } else if (patch.dueDate !== undefined && (patch.dueDate ?? null) !== foundItem.dueDate) {
          prependOptimisticActivity(
            qc,
            cardId,
            patch.dueDate ? 'card.checklist.item.due-set' : 'card.checklist.item.due-cleared',
            { ...base, dueDate: patch.dueDate ?? null },
          );
        }
      }
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(['board', boardId], ctx.prev);
    },
    onSettled: (_d, _e, vars) => {
      qc.invalidateQueries({ queryKey: ['board', boardId] });
      qc.invalidateQueries({ queryKey: ['card', vars.cardId, 'activity'] });
    },
  });
}

export function useDeleteChecklistItem(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ cardId, itemId }: { cardId: string; itemId: string }) =>
      api(`/api/cards/${cardId}/checklist-items/${itemId}`, { method: 'DELETE' }),
    onMutate: async ({ cardId, itemId }) => {
      await qc.cancelQueries({ queryKey: ['board', boardId] });
      const prev = qc.getQueryData<BoardFull>(['board', boardId]);
      const card = prev?.cards.find((c) => c._id === cardId);
      let removed: { text: string; checklistId: string } | undefined;
      if (card?.checklists) {
        for (const cl of card.checklists) {
          const it = cl.items.find((i) => i.id === itemId);
          if (it) {
            removed = { text: it.text, checklistId: cl.id };
            break;
          }
        }
        const next = card.checklists.map((cl) => ({
          ...cl,
          items: cl.items.filter((it) => it.id !== itemId),
        }));
        patchCardLocally(qc, boardId, cardId, { checklists: next });
      }
      if (removed) {
        prependOptimisticActivity(qc, cardId, 'card.checklist.item.deleted', {
          checklistId: removed.checklistId,
          itemId,
          text: removed.text,
        });
      }
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(['board', boardId], ctx.prev);
    },
    onSettled: (_d, _e, vars) => {
      qc.invalidateQueries({ queryKey: ['board', boardId] });
      qc.invalidateQueries({ queryKey: ['card', vars.cardId, 'activity'] });
    },
  });
}

export function useConvertChecklistItem(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ cardId, itemId }: { cardId: string; itemId: string }) =>
      api<Card>(`/api/cards/${cardId}/checklist-items/${itemId}/convert`, { method: 'POST' }),
    onSettled: (_d, _e, vars) => {
      qc.invalidateQueries({ queryKey: ['board', boardId] });
      qc.invalidateQueries({ queryKey: ['card', vars.cardId, 'activity'] });
    },
  });
}

export interface CardActivity {
  _id: string;
  type: string;
  actorId: string;
  cardId?: string;
  payload?: Record<string, unknown>;
  createdAt: string;
}

export function useCardActivity(cardId: string | undefined) {
  return useQuery({
    queryKey: ['card', cardId, 'activity'],
    enabled: !!cardId,
    queryFn: () =>
      api<{ items: CardActivity[]; nextCursor?: string }>(`/api/cards/${cardId}/activity`).then(
        (r) => r.items,
      ),
  });
}

export function useAddAttachment(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ cardId, file }: { cardId: string; file: File }) => {
      // Upload through the backend, exactly like chat (uploadChatFile): the server
      // holds the AWS credentials and PUTs to S3 itself, so this works for every
      // provider (local/S3/Cloudinary) with no browser→S3 CORS rule on the bucket.
      const form = new FormData();
      form.append('file', file);
      return api<{ id: string; name: string; url: string }>(
        `/api/cards/${cardId}/attachments`,
        { method: 'POST', body: form },
      );
    },
    onError: (err) => {
      toast.error(err instanceof Error ? `Upload failed: ${err.message}` : 'Upload failed');
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['board', boardId] }),
  });
}

export function useDeleteAttachment(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ cardId, attachmentId }: { cardId: string; attachmentId: string }) =>
      api(`/api/cards/${cardId}/attachments/${attachmentId}`, { method: 'DELETE' }),
    onMutate: async ({ cardId, attachmentId }) => {
      await qc.cancelQueries({ queryKey: ['board', boardId] });
      const prev = qc.getQueryData<BoardFull>(['board', boardId]);
      const card = prev?.cards.find((c) => c._id === cardId);
      if (card?.attachments) {
        patchCardLocally(qc, boardId, cardId, {
          attachments: card.attachments.filter((a) => a.id !== attachmentId),
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

