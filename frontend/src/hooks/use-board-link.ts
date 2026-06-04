'use client';
import { useCallback, useTransition, type MouseEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { prefetchBoard } from '@/hooks/use-boards';

/**
 * Navigation for board links that *feels* instant.
 *
 * The problem: in the App Router, clicking an un-prefetched `<Link>` keeps the
 * current page fully visible inside the router transition until the destination
 * segment round-trips — so for the 2-3s a board takes to load there's no visual
 * feedback at all, and users re-click thinking the tap didn't register.
 *
 * The fix: drive navigation through `useTransition` so `isPending` flips true
 * synchronously on click. The caller renders the board skeleton over the list
 * the moment that happens (and blocks further clicks), then the real route —
 * which shares the same skeleton via loading.tsx — takes over seamlessly. We
 * also prefetch the board data + route on intent so the skeleton resolves to
 * real content quickly (instantly for an already-cached board).
 *
 * Call this ONCE per surface (e.g. the boards grid) and share the returned
 * handlers, so there is a single pending flag driving a single overlay.
 */
export function useBoardLink() {
  const router = useRouter();
  const qc = useQueryClient();
  const [isPending, startTransition] = useTransition();

  // Fire on hover / focus / pointer-down — before the click resolves.
  const prefetch = useCallback(
    (boardId: string) => {
      void prefetchBoard(qc, boardId);
      router.prefetch(`/boards/${boardId}`);
    },
    [qc, router],
  );

  const open = useCallback(
    (boardId: string, e?: MouseEvent) => {
      // Let the browser handle modified clicks (open-in-new-tab) and any click
      // that isn't a plain left-click — don't hijack those.
      if (e && (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0)) return;
      e?.preventDefault();
      void prefetchBoard(qc, boardId);
      startTransition(() => router.push(`/boards/${boardId}`));
    },
    [qc, router],
  );

  return { isPending, prefetch, open };
}
