'use client';
import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getSocket, joinBoard, leaveBoard } from '@/lib/socket';
import { isPendingMove } from '@/lib/pending-moves';
import { useActivityStore } from '@/stores/activity';
import type { Comment } from '@/types/api';

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

    // A reconnect drops our board-room membership (and presence) server-side, so
    // rejoin and refetch the board to catch up on anything changed during the gap.
    const onConnect = () => {
      joinBoard(boardId);
      qc.invalidateQueries({ queryKey: ['board', boardId] });
    };
    socket.on('connect', onConnect);

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
      // NOTE: comments are handled by useBoardCommentRealtime (live append +
      // tile flash); they aren't part of the board payload, so invalidating it
      // here would just trigger a needless full-board refetch.
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
      socket.off('connect', onConnect);
      moveEvents.forEach((e) => socket.off(e, onMove));
      normEvents.forEach((e) => socket.off(e, onNormalized));
      otherEvents.forEach((e) => socket.off(e, onOther));
      leaveBoard(boardId);
    };
  }, [boardId, qc]);
}

interface IncomingCommentEvent {
  actorId?: string;
  payload?: {
    cardId?: string;
    comment?: Comment;
  };
}

/**
 * Live comment delivery for everyone viewing a board:
 *  - appends the new comment to the open card's comment list (so it shows up
 *    without a refetch), deduped by id;
 *  - flashes the relevant card tile for ~2s when the comment lands on a card
 *    that ISN'T currently open (and wasn't posted by the viewer), so people
 *    notice activity elsewhere on the board.
 *
 * The board room itself is joined by useBoardRealtime; this only adds a
 * listener. openCardId/currentUserId are read through refs so the socket
 * handler stays subscribed across card navigation (no off/on gap).
 */
export function useBoardCommentRealtime(
  boardId: string | undefined,
  openCardId: string | null | undefined,
  currentUserId: string | undefined,
) {
  const qc = useQueryClient();
  const flashCard = useActivityStore((s) => s.flashCard);
  const openRef = useRef(openCardId);
  const meRef = useRef(currentUserId);
  openRef.current = openCardId;
  meRef.current = currentUserId;

  useEffect(() => {
    if (!boardId) return;
    const socket = getSocket();

    const onComment = (event: IncomingCommentEvent) => {
      const cardId = event.payload?.cardId;
      const comment = event.payload?.comment;
      if (!cardId || !comment) return;

      // Append to the card's comment cache only if it's already loaded (i.e. the
      // card is/was open). For never-opened cards we skip seeding so that opening
      // them still fetches the full history rather than a single comment.
      const key = ['card', cardId, 'comments'];
      const existing = qc.getQueryData<Comment[]>(key);
      if (existing) {
        if (!existing.some((c) => c._id === comment._id)) {
          qc.setQueryData<Comment[]>(key, [...existing, comment]);
        }
      }

      // Flash the tile for activity the viewer didn't cause and isn't looking at.
      if (cardId !== openRef.current && event.actorId !== meRef.current) {
        flashCard(cardId);
      }
    };

    socket.on('card.comment.created', onComment);
    return () => {
      socket.off('card.comment.created', onComment);
    };
  }, [boardId, qc, flashCard]);
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
