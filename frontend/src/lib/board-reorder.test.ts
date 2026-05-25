import { describe, it, expect } from 'vitest';
import { applyCardMove, applyListMove, computePosition } from './board-reorder';
import type { BoardFull, Card, List } from '@/types/api';

function makeCard(id: string, listId: string, position: number, extra: Partial<Card> = {}): Card {
  return {
    _id: id,
    listId,
    boardId: 'B',
    title: id,
    position,
    ...extra,
  };
}

function makeList(id: string, position: number): List {
  return { _id: id, boardId: 'B', title: id, position };
}

function makeBoard(lists: List[], cards: Card[]): BoardFull {
  return {
    _id: 'B',
    workspaceId: 'W',
    title: 'B',
    background: { type: 'color', value: '#000' },
    visibility: 'workspace',
    members: [],
    starredBy: [],
    closed: false,
    lastActivityAt: new Date().toISOString(),
    lists,
    cards,
    labels: [],
  };
}

describe('computePosition', () => {
  it('returns STEP when both neighbors are null', () => {
    expect(computePosition(null, null)).toBe(1024);
  });
  it('halves when only next is given', () => {
    expect(computePosition(null, 100)).toBe(50);
  });
  it('appends when only prev is given', () => {
    expect(computePosition(1024, null)).toBe(2048);
  });
  it('midpoints between two', () => {
    expect(computePosition(100, 200)).toBe(150);
  });
});

describe('applyCardMove', () => {
  const lists = [makeList('L1', 1024), makeList('L2', 2048)];

  it('same-list down — moves A from idx0 to between B and C', () => {
    const cards = [
      makeCard('A', 'L1', 1024),
      makeCard('B', 'L1', 2048),
      makeCard('C', 'L1', 3072),
    ];
    const board = makeBoard(lists, cards);
    const out = applyCardMove(board, { cardId: 'A', toListId: 'L1', prevId: 'B', nextId: 'C' });
    const a = out.cards.find((c) => c._id === 'A')!;
    expect(a.listId).toBe('L1');
    expect(a.position).toBe(2560); // midpoint(2048, 3072)
  });

  it('same-list up — moves C from idx2 to between A and B', () => {
    const cards = [
      makeCard('A', 'L1', 1024),
      makeCard('B', 'L1', 2048),
      makeCard('C', 'L1', 3072),
    ];
    const board = makeBoard(lists, cards);
    const out = applyCardMove(board, { cardId: 'C', toListId: 'L1', prevId: 'A', nextId: 'B' });
    const c = out.cards.find((c) => c._id === 'C')!;
    expect(c.position).toBe(1536); // midpoint(1024, 2048)
  });

  it('cross-list to empty list — appends with default STEP', () => {
    const cards = [makeCard('A', 'L1', 1024)];
    const board = makeBoard(lists, cards);
    const out = applyCardMove(board, { cardId: 'A', toListId: 'L2', prevId: null, nextId: null });
    const a = out.cards.find((c) => c._id === 'A')!;
    expect(a.listId).toBe('L2');
    expect(a.position).toBe(1024);
  });

  it('cross-list to top — places before the first existing card', () => {
    const cards = [makeCard('A', 'L1', 1024), makeCard('B', 'L2', 1024)];
    const board = makeBoard(lists, cards);
    const out = applyCardMove(board, { cardId: 'A', toListId: 'L2', prevId: null, nextId: 'B' });
    const a = out.cards.find((c) => c._id === 'A')!;
    expect(a.listId).toBe('L2');
    expect(a.position).toBe(512); // halve(1024)
  });

  it('cross-list to bottom — appends after last existing card', () => {
    const cards = [makeCard('A', 'L1', 1024), makeCard('B', 'L2', 1024)];
    const board = makeBoard(lists, cards);
    const out = applyCardMove(board, { cardId: 'A', toListId: 'L2', prevId: 'B', nextId: null });
    const a = out.cards.find((c) => c._id === 'A')!;
    expect(a.position).toBe(2048);
  });

  it('cross-list to middle — places between two existing cards', () => {
    const cards = [
      makeCard('A', 'L1', 1024),
      makeCard('X', 'L2', 1024),
      makeCard('Y', 'L2', 2048),
    ];
    const board = makeBoard(lists, cards);
    const out = applyCardMove(board, { cardId: 'A', toListId: 'L2', prevId: 'X', nextId: 'Y' });
    const a = out.cards.find((c) => c._id === 'A')!;
    expect(a.listId).toBe('L2');
    expect(a.position).toBe(1536);
  });

  it('archived cards are ignored when computing neighbors', () => {
    const cards = [
      makeCard('A', 'L1', 1024),
      makeCard('B', 'L2', 1024, { archived: true }),
      makeCard('C', 'L2', 2048),
    ];
    const board = makeBoard(lists, cards);
    const out = applyCardMove(board, { cardId: 'A', toListId: 'L2', prevId: null, nextId: 'C' });
    const a = out.cards.find((c) => c._id === 'A')!;
    expect(a.position).toBe(1024); // halve(2048) — B is archived and skipped
  });

  it('returns the same board unchanged when cardId is unknown', () => {
    const cards = [makeCard('A', 'L1', 1024)];
    const board = makeBoard(lists, cards);
    const out = applyCardMove(board, { cardId: 'Z', toListId: 'L2', prevId: null, nextId: null });
    expect(out).toBe(board);
  });
});

describe('applyListMove', () => {
  const cards: Card[] = [];

  it('moves a list to the start (before the first remaining)', () => {
    const lists = [makeList('L1', 1024), makeList('L2', 2048), makeList('L3', 3072)];
    const board = makeBoard(lists, cards);
    const out = applyListMove(board, { listId: 'L3', prevId: null, nextId: 'L1' });
    const l3 = out.lists.find((l) => l._id === 'L3')!;
    expect(l3.position).toBe(512);
  });

  it('moves a list to the middle (midpoint of neighbors)', () => {
    const lists = [makeList('L1', 1024), makeList('L2', 2048), makeList('L3', 3072)];
    const board = makeBoard(lists, cards);
    const out = applyListMove(board, { listId: 'L3', prevId: 'L1', nextId: 'L2' });
    const l3 = out.lists.find((l) => l._id === 'L3')!;
    expect(l3.position).toBe(1536);
  });

  it('moves a list to the end', () => {
    const lists = [makeList('L1', 1024), makeList('L2', 2048)];
    const board = makeBoard(lists, cards);
    const out = applyListMove(board, { listId: 'L1', prevId: 'L2', nextId: null });
    const l1 = out.lists.find((l) => l._id === 'L1')!;
    expect(l1.position).toBe(3072);
  });
});
