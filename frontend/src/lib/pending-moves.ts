/**
 * Module-local store of clientEventIds the user just emitted.
 * Every realtime echo carrying one of these ids is the server's
 * confirmation of our own move and must be ignored by the listener,
 * because our optimistic update already mirrors that state.
 *
 * Entries self-expire after EXPIRY_MS to bound the set's growth.
 */
const pending = new Set<string>();
const EXPIRY_MS = 2_000;

export function trackPendingMove(id: string): void {
  pending.add(id);
  setTimeout(() => pending.delete(id), EXPIRY_MS);
}

export function isPendingMove(id: string | undefined | null): boolean {
  if (!id) return false;
  return pending.has(id);
}

export function clearPendingMove(id: string): void {
  pending.delete(id);
}

// Test-only: clear all pending entries.
export function _resetPendingMoves(): void {
  pending.clear();
}
