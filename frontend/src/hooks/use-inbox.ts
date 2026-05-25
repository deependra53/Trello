'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface InboxItem {
  _id: string;
  title: string;
  body?: string;
  source: 'manual' | 'email' | 'capture';
  createdAt: string;
  snoozedUntil?: string;
}

export function useInbox() {
  return useQuery({
    queryKey: ['inbox'],
    queryFn: () => api<{ items: InboxItem[] }>('/api/inbox').then((r) => r.items),
  });
}

export function useCaptureInbox() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { title: string; body?: string }) =>
      api<InboxItem>('/api/inbox/capture', { method: 'POST', body: input }),
    onSettled: () => qc.invalidateQueries({ queryKey: ['inbox'] }),
  });
}

export function useDeleteInbox() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api(`/api/inbox/${id}`, { method: 'DELETE' }),
    onSettled: () => qc.invalidateQueries({ queryKey: ['inbox'] }),
  });
}

export function useConvertInbox() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, boardId, listId }: { id: string; boardId: string; listId: string }) =>
      api(`/api/inbox/${id}/convert`, { method: 'POST', body: { boardId, listId } }),
    onSettled: () => qc.invalidateQueries({ queryKey: ['inbox'] }),
  });
}
