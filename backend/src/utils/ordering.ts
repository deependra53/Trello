import { Card } from '../models/card.model.js';
import { List } from '../models/list.model.js';

/**
 * Centralized ordering helpers. Both cards (within a list) and lists
 * (within a board) use a float `position` and midpoint-insertion.
 *
 * STEP = 1024 — fresh inserts at the end of an empty container start here,
 *  every subsequent append adds STEP, every "between" insert is the midpoint
 *  of the two neighbors.
 * MIN_GAP — once two adjacent positions get this close, midpoint inserts
 *  lose IEEE precision; normalize the entire container before computing.
 */
export const STEP = 1024;
const MIN_GAP = 0.001;

/** Position to use for an item placed between `prev` and `next` neighbors. */
export function computeBetween(prev: number | null, next: number | null): number {
  if (prev == null && next == null) return STEP;
  if (prev == null && next != null) return next / 2;
  if (prev != null && next == null) return prev + STEP;
  return ((prev as number) + (next as number)) / 2;
}

/** True when the gap between neighbors is too small for safe midpoint inserts. */
export function needsNormalize(prev: number | null, next: number | null): boolean {
  if (prev == null || next == null) return false;
  return Math.abs(next - prev) < MIN_GAP;
}

/** Re-space every non-archived card in `listId` to STEP, 2*STEP, 3*STEP … */
export async function normalizeCardsInList(listId: string): Promise<void> {
  const cards = await Card.find({ listId, archived: { $ne: true } })
    .sort({ position: 1 })
    .select('_id')
    .lean();
  if (cards.length === 0) return;
  const ops = cards.map((c, i) => ({
    updateOne: { filter: { _id: c._id }, update: { $set: { position: (i + 1) * STEP } } },
  }));
  await Card.bulkWrite(ops);
}

/** Re-space every non-archived list in `boardId`. */
export async function normalizeListsInBoard(boardId: string): Promise<void> {
  const lists = await List.find({ boardId, archived: { $ne: true } })
    .sort({ position: 1 })
    .select('_id')
    .lean();
  if (lists.length === 0) return;
  const ops = lists.map((l, i) => ({
    updateOne: { filter: { _id: l._id }, update: { $set: { position: (i + 1) * STEP } } },
  }));
  await List.bulkWrite(ops);
}
