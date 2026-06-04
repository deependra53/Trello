'use client';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth';
import type { User } from '@/types/api';

export type NotificationKey = 'email' | 'push' | 'mentions' | 'cardActivity' | 'dueReminders';

export interface ProfilePatch {
  fullName?: string;
  preferences?: {
    theme?: 'light' | 'dark' | 'system';
    language?: string;
    notifications?: Partial<Record<NotificationKey, boolean>>;
  };
}

/** Patch the signed-in user's own profile and sync the auth store on success. */
export function useUpdateProfile() {
  const setUser = useAuthStore((s) => s.setUser);
  return useMutation({
    mutationFn: (patch: ProfilePatch) =>
      api<{ user: User }>('/api/auth/me', { method: 'PATCH', body: patch }).then((r) => r.user),
    onSuccess: (user) => setUser(user),
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (input: { currentPassword: string; newPassword: string }) =>
      api<{ ok: true }>('/api/auth/change-password', { method: 'POST', body: input }),
  });
}

/**
 * Upload a new avatar image. Routed through api() (same-origin, proxied by the
 * Next rewrite) so it inherits the automatic 401 token-refresh + retry — a raw
 * cross-origin fetch would fail once the short-lived access token expires.
 */
export function useUploadAvatar() {
  const setUser = useAuthStore((s) => s.setUser);
  return useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData();
      form.append('file', file);
      const { user } = await api<{ user: User }>('/api/auth/me/avatar', {
        method: 'POST',
        body: form,
      });
      return user;
    },
    onSuccess: (user) => setUser(user),
  });
}
