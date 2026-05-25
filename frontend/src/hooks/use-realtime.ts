'use client';
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getSocket, joinBoard, leaveBoard } from '@/lib/socket';
import { isPendingMove } from '@/lib/pending-moves';

interface IncomingBoardEvent {
  type?: string;
  payload?: {
    clientEventId?: string;
    [k: string]: unknown;
  };
}

/**
 * Subscribes to a board's realtime room and invalidates the relevant
 * TanStack Query cache entries whenever the server publishes a change —
 * EXCEPT echoes of moves we just initiated locally (deduped by
 * clientEventId), which are skipped because our optimistic update already
 * reflects the desired state.
 */
export function useBoardRealtime(boardId: string | undefined) {
  const qc = useQueryClient();
  useEffect(() => {
    if (!boardId) return;
    const socket = getSocket();
    joinBoard(boardId);

    const onMove = (event: IncomingBoardEvent) => {
      if (isPendingMove(event.payload?.clientEventId)) return;
      qc.invalidateQueries({ queryKey: ['board', boardId] });
    };

    const onNormalized = () => {
      qc.invalidateQueries({ queryKey: ['board', boardId] });
    };

    const onOther = () => {
      qc.invalidateQueries({ queryKey: ['board', boardId] });
    };

    const moveEvents = ['card.moved', 'list.moved'];
    const normEvents = ['list.normalized', 'board.normalized'];
    const otherEvents = [
      'card.created',
      'card.updated',
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
      'list.deleted',
      'list.archived',
      'board.updated',
    ];

    moveEvents.forEach((e) => socket.on(e, onMove));
    normEvents.forEach((e) => socket.on(e, onNormalized));
    otherEvents.forEach((e) => socket.on(e, onOther));

    return () => {
      moveEvents.forEach((e) => socket.off(e, onMove));
      normEvents.forEach((e) => socket.off(e, onNormalized));
      otherEvents.forEach((e) => socket.off(e, onOther));
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
