import { create } from 'zustand';

const LABELS_EXPANDED_KEY = 'indihive:labels-expanded';

interface UIState {
  sidebarOpen: boolean;
  setSidebarOpen: (v: boolean) => void;
  toggleSidebar: () => void;
  commandOpen: boolean;
  setCommandOpen: (v: boolean) => void;
  labelsExpanded: boolean;
  toggleLabelsExpanded: () => void;
  // Which top-level section the persistent Boards/Chat switcher is showing.
  // Intentionally NOT persisted — a hard refresh resets to the route's home.
  workspaceSection: 'boards' | 'chat';
  setWorkspaceSection: (v: 'boards' | 'chat') => void;
  // The boards-world URL to return to when toggling Chat → Boards. Non-null only
  // after a shallow toggle INTO chat (meaning the boards route is still mounted
  // underneath); null means we landed on chat fresh and must navigate home.
  boardsReturnUrl: string | null;
  setBoardsReturnUrl: (v: string | null) => void;
  // One-shot request to drive the (always-mounted) Chat pane from outside it
  // (e.g. the topbar bell): open the chat notifications view, or jump straight
  // to a channel. ChatApp consumes it and resets it back to null. A counter
  // would be overkill — the pane only ever needs the latest request.
  chatNavTarget: ChatNavTarget | null;
  setChatNavTarget: (v: ChatNavTarget | null) => void;
}

export type ChatNavTarget =
  | { view: 'notifications' }
  | { view: 'channel'; channelId: string };

function readLabelsExpanded(): boolean {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(LABELS_EXPANDED_KEY) === '1';
}

export const useUIStore = create<UIState>((set, get) => ({
  sidebarOpen: true,
  setSidebarOpen: (v) => set({ sidebarOpen: v }),
  toggleSidebar: () => set({ sidebarOpen: !get().sidebarOpen }),
  commandOpen: false,
  setCommandOpen: (v) => set({ commandOpen: v }),
  workspaceSection: 'boards',
  setWorkspaceSection: (v) => set({ workspaceSection: v }),
  boardsReturnUrl: null,
  setBoardsReturnUrl: (v) => set({ boardsReturnUrl: v }),
  chatNavTarget: null,
  setChatNavTarget: (v) => set({ chatNavTarget: v }),
  labelsExpanded: readLabelsExpanded(),
  toggleLabelsExpanded: () => {
    const next = !get().labelsExpanded;
    if (typeof window !== 'undefined') {
      if (next) window.localStorage.setItem(LABELS_EXPANDED_KEY, '1');
      else window.localStorage.removeItem(LABELS_EXPANDED_KEY);
    }
    set({ labelsExpanded: next });
  },
}));
