import type { BoardFull, Card, List } from '@/types/api';

/**
 * Mirrors backend/src/utils/ordering.ts so optimistic positions match
 * what the server will compute on receipt.
 */
const STEP = 1024;

export function computePosition(prev: number | null, next: number | null): number {
  if (prev == null && next == null) return STEP;
  if (prev == null && next != null) return next / 2;
  if (prev != null && next == null) return prev + STEP;
  return ((prev as number) + (next as number)) / 2;
}

/**
 * Produce a new BoardFull with the card moved to {toListId} between
 * prev/next neighbors (either may be null). Pure — no mutation.
 *
 * Handles same-list and cross-list moves. The `prevId` / `nextId` refer
 * to the card that should sit immediately before / after the moved card
 * in the destination list AFTER the move (i.e. exclude the moving card
 * from that calculation client-side).
 */
export function applyCardMove(
  board: BoardFull,
  args: { cardId: string; toListId: string; prevId: string | null; nextId: string | null },
): BoardFull {
  const card = board.cards.find((c) => c._id === args.cardId);
  if (!card) return board;

  const destCards = board.cards
    .filter((c) => c.listId === args.toListId && c._id !== args.cardId && !c.archived)
    .sort((a, b) => a.position - b.position);

  const prevPos =
    args.prevId != null ? destCards.find((c) => c._id === args.prevId)?.position ?? null : null;
  const nextPos =
    args.nextId != null ? destCards.find((c) => c._id === args.nextId)?.position ?? null : null;

  const newPosition = computePosition(prevPos, nextPos);

  return {
    ...board,
    cards: board.cards.map((c) =>
      c._id === args.cardId ? { ...c, listId: args.toListId, position: newPosition } : c,
    ),
  };
}

/** Produce a new BoardFull with the list reordered between neighbors. Pure. */
export function applyListMove(
  board: BoardFull,
  args: { listId: string; prevId: string | null; nextId: string | null },
): BoardFull {
  const others = board.lists
    .filter((l) => !l.archived && l._id !== args.listId)
    .sort((a, b) => a.position - b.position);

  const prevPos =
    args.prevId != null ? others.find((l) => l._id === args.prevId)?.position ?? null : null;
  const nextPos =
    args.nextId != null ? others.find((l) => l._id === args.nextId)?.position ?? null : null;

  const newPosition = computePosition(prevPos, nextPos);

  return {
    ...board,
    lists: board.lists.map((l) =>
      l._id === args.listId ? { ...l, position: newPosition } : l,
    ),
  };
}

/**
 * Given the on-screen ordered lists/cards plus the source & destination
 * indices from a DragEnd, derive the neighbor ids to send to the server.
 * Excludes the moving item from the simulated post-move array.
 */
export function deriveNeighbors<T extends { _id: string }>(
  items: T[],
  sourceIndex: number,
  destIndex: number,
  destIsDifferentContainer: boolean,
): { prevId: string | null; nextId: string | null } {
  const arr = [...items];
  if (!destIsDifferentContainer) {
    const moved = arr.splice(sourceIndex, 1)[0];
    if (!moved) return { prevId: null, nextId: null };
    arr.splice(destIndex, 0, moved);
  } else {
    // For cross-list moves the caller passes the destination-list array
    // WITHOUT the moving item already; just splice in at destIndex.
  }
  const prev = arr[destIsDifferentContainer ? destIndex - 1 : destIndex - 1] ?? null;
  const next = arr[destIsDifferentContainer ? destIndex : destIndex + 1] ?? null;
  // When destIsDifferentContainer we have NOT inserted, so the neighbors are
  // at destIndex-1 and destIndex; same-container case we DID insert, so
  // neighbors are at destIndex-1 and destIndex+1.
  return { prevId: prev?._id ?? null, nextId: next?._id ?? null };
}

export type { BoardFull, Card, List };
