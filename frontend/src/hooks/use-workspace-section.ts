'use client';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useUIStore } from '@/stores/ui';

export type WorkspaceSection = 'boards' | 'chat';

/**
 * Controller for the persistent Boards ⇄ Chat panes.
 *
 * Chat is rendered as an always-mounted pane in the app layout, sitting beside
 * the normal Next-routed Boards content. Toggling between them must NOT trigger
 * a Next navigation — that would unmount the Boards route (e.g. a specific board)
 * and lose its state. So:
 *   - Boards → Chat: remember the current boards URL, then `replaceState('/chat')`
 *     (shallow: Next keeps the boards route mounted underneath).
 *   - Chat → Boards: if we have a remembered URL, just `replaceState` back to it
 *     and slide — the board is still mounted, untouched. Only when we landed on
 *     chat fresh (no remembered URL) do we navigate to the boards home.
 */
export function useWorkspaceSection() {
  const router = useRouter();
  const pathname = usePathname();
  const storeSection = useUIStore((s) => s.workspaceSection);
  const setStoreSection = useUIStore((s) => s.setWorkspaceSection);
  const boardsReturnUrl = useUIStore((s) => s.boardsReturnUrl);
  const setBoardsReturnUrl = useUIStore((s) => s.setBoardsReturnUrl);

  // First render (server + client) is URL-derived for hydration safety; after
  // mount we follow the in-memory store the toggle mutates.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const routeSection: WorkspaceSection = pathname?.startsWith('/chat') ? 'chat' : 'boards';
  const section: WorkspaceSection = mounted ? storeSection : routeSection;

  function go(next: WorkspaceSection) {
    if (next === section) return;
    if (typeof window === 'undefined') return;

    if (next === 'chat') {
      if (!window.location.pathname.startsWith('/chat')) {
        setBoardsReturnUrl(window.location.pathname + window.location.search);
      }
      setStoreSection('chat');
      window.history.replaceState(null, '', '/chat');
    } else {
      setStoreSection('boards');
      if (boardsReturnUrl) {
        window.history.replaceState(null, '', boardsReturnUrl);
      } else {
        router.push('/boards');
      }
    }
  }

  return { section, routeSection, go };
}
