import { create } from 'zustand';
import type { User } from '@/types/api';
import { api, clearTokens, setTokens } from '@/lib/api';
import { disconnectSocket } from '@/lib/socket';

interface AuthState {
  user: User | null;
  loading: boolean;
  initialized: boolean;
  hydrate: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, fullName: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (u: User | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: false,
  initialized: false,
  setUser: (user) => set({ user }),
  async hydrate() {
    if (typeof window === 'undefined') return;
    set({ loading: true });
    try {
      const r = await api<{ user: User }>('/api/auth/me');
      set({ user: r.user });
    } catch {
      set({ user: null });
    } finally {
      set({ loading: false, initialized: true });
    }
  },
  async login(email, password) {
    const r = await api<{ user: User; accessToken: string; refreshToken: string }>(
      '/api/auth/login',
      { method: 'POST', body: { email, password } },
    );
    setTokens(r.accessToken, r.refreshToken);
    set({ user: r.user });
  },
  async signup(email, password, fullName) {
    const r = await api<{ user: User; accessToken: string; refreshToken: string }>(
      '/api/auth/signup',
      { method: 'POST', body: { email, password, fullName } },
    );
    setTokens(r.accessToken, r.refreshToken);
    set({ user: r.user });
  },
  async logout() {
    try {
      const refreshToken = localStorage.getItem('trellox.refreshToken');
      if (refreshToken) {
        await api('/api/auth/logout', { method: 'POST', body: { refreshToken } });
      }
    } catch {
      // ignore
    } finally {
      clearTokens();
      disconnectSocket();
      set({ user: null });
    }
  },
}));
