import { create } from 'zustand';

const LABELS_EXPANDED_KEY = 'trello:labels-expanded';

interface UIState {
  sidebarOpen: boolean;
  setSidebarOpen: (v: boolean) => void;
  toggleSidebar: () => void;
  commandOpen: boolean;
  setCommandOpen: (v: boolean) => void;
  labelsExpanded: boolean;
  toggleLabelsExpanded: () => void;
}

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
