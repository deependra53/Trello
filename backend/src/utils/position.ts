const STEP = 65_536;
const MIN_GAP = 0.001;

/**
 * Compute a position float between `prev` and `next`. If either is missing,
 * place at one end. If the gap is too small, callers should trigger a rebalance.
 */
export function computePosition(prev: number | null, next: number | null): number {
  if (prev == null && next == null) return STEP;
  if (prev == null && next != null) return next / 2;
  if (prev != null && next == null) return prev + STEP;
  return ((prev as number) + (next as number)) / 2;
}

export function needsRebalance(prev: number | null, next: number | null): boolean {
  if (prev == null || next == null) return false;
  return Math.abs(next - prev) < MIN_GAP;
}
