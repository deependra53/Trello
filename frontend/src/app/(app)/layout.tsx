'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TopBar } from '@/components/shared/topbar';
import { Sidebar } from '@/components/shared/sidebar';
import { useAuthStore } from '@/stores/auth';
import { useNotificationRealtime } from '@/hooks/use-realtime';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, initialized, loading } = useAuthStore();
  useNotificationRealtime();

  useEffect(() => {
    if (initialized && !loading && !user) router.replace('/login');
  }, [initialized, loading, user, router]);

  if (!initialized || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen">
      <TopBar />
      <div className="flex">
        <Sidebar />
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  );
}
