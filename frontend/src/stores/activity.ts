'use client';
import { create } from 'zustand';

/**
 * Transient "something just happened on this card" highlights. When a realtime
 * event arrives for a card that isn't currently open, we flash its tile for a
 * couple of seconds so the viewer notices the activity, then it rolls back.
 *
 * Per-card timers live outside the store so a fresh event resets (rather than
 * stacks) a card's highlight.
 */
const timers = new Map<string, ReturnType<typeof setTimeout>>();

interface ActivityState {
  /** cardId -> currently flashing */
  flashing: Record<string, boolean>;
  flashCard: (cardId: string, durationMs?: number) => void;
}

export const useActivityStore = create<ActivityState>((set) => ({
  flashing: {},
  flashCard: (cardId, durationMs = 2000) => {
    set((s) => (s.flashing[cardId] ? s : { flashing: { ...s.flashing, [cardId]: true } }));

    const existing = timers.get(cardId);
    if (existing) clearTimeout(existing);
    timers.set(
      cardId,
      setTimeout(() => {
        timers.delete(cardId);
        set((s) => {
          if (!s.flashing[cardId]) return s;
          const next = { ...s.flashing };
          delete next[cardId];
          return { flashing: next };
        });
      }, durationMs),
    );
  },
}));
