'use client';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Notification } from '@/types/api';

/** Boards and Chat each surface only their own notifications. */
export type NotificationScope = 'boards' | 'chat';

type NotificationPage = { items: Notification[]; nextCursor?: string };

const scopeQuery = (scope?: NotificationScope) => (scope ? { scope } : {});

export function useNotifications(scope?: NotificationScope) {
  return useQuery({
    queryKey: ['notifications', scope ?? 'all'],
    queryFn: () =>
      api<NotificationPage>('/api/notifications', { query: scopeQuery(scope) }).then(
        (r) => r.items,
      ),
  });
}

/**
 * Cursor-paged feed for a full notifications page. Shares the ['notifications']
 * key root, so mark-read / mark-all-read invalidations refresh it too.
 */
export function useNotificationsInfinite(scope?: NotificationScope) {
  return useInfiniteQuery({
    queryKey: ['notifications', 'infinite', scope ?? 'all'],
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) =>
      api<NotificationPage>('/api/notifications', {
        query: { ...scopeQuery(scope), ...(pageParam ? { cursor: pageParam } : {}) },
      }),
    getNextPageParam: (last) => last.nextCursor,
  });
}

export function useUnreadCount(scope?: NotificationScope) {
  return useQuery({
    queryKey: ['notifications', 'unread', scope ?? 'all'],
    queryFn: () =>
      api<{ count: number }>('/api/notifications/unread-count', {
        query: scopeQuery(scope),
      }).then((r) => r.count),
    staleTime: 60_000,
  });
}

export function useMarkRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api(`/api/notifications/${id}/read`, { method: 'PATCH' }),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useMarkAllRead(scope?: NotificationScope) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      api('/api/notifications/read-all', { method: 'PATCH', query: scopeQuery(scope) }),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}
