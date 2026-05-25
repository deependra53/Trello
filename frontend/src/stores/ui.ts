import { create } from 'zustand';

interface UIState {
  sidebarOpen: boolean;
  setSidebarOpen: (v: boolean) => void;
  toggleSidebar: () => void;
  commandOpen: boolean;
  setCommandOpen: (v: boolean) => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  sidebarOpen: true,
  setSidebarOpen: (v) => set({ sidebarOpen: v }),
  toggleSidebar: () => set({ sidebarOpen: !get().sidebarOpen }),
  commandOpen: false,
  setCommandOpen: (v) => set({ commandOpen: v }),
}));
