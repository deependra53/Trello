'use client';
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getSocket, joinBoard, leaveBoard } from '@/lib/socket';

/**
 * Subscribes to a board's realtime room and invalidates the relevant
 * TanStack Query cache entries whenever the server publishes a change.
 */
export function useBoardRealtime(boardId: string | undefined) {
  const qc = useQueryClient();
  useEffect(() => {
    if (!boardId) return;
    const socket = getSocket();
    joinBoard(boardId);

    const invalidate = () => {
      qc.invalidateQueries({ queryKey: ['board', boardId] });
    };

    const events = [
      'card.created',
      'card.updated',
      'card.moved',
      'card.deleted',
      'card.archived',
      'card.member.added',
      'card.member.removed',
      'card.label.added',
      'card.label.removed',
      'card.comment.added',
      'card.attachment.added',
      'card.attachment.removed',
      'list.created',
      'list.updated',
      'list.moved',
      'list.deleted',
      'list.archived',
      'board.updated',
    ];

    events.forEach((e) => socket.on(e, invalidate));

    return () => {
      events.forEach((e) => socket.off(e, invalidate));
      leaveBoard(boardId);
    };
  }, [boardId, qc]);
}

export function useNotificationRealtime() {
  const qc = useQueryClient();
  useEffect(() => {
    const socket = getSocket();
    const onNotification = () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['notifications', 'unread'] });
    };
    socket.on('notification.new', onNotification);
    return () => {
      socket.off('notification.new', onNotification);
    };
  }, [qc]);
}
