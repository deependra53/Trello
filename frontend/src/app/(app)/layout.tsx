'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { TopBar } from '@/components/shared/topbar';
import { Sidebar } from '@/components/shared/sidebar';
import { useAuthStore } from '@/stores/auth';
import { useUIStore } from '@/stores/ui';
import { useNotificationRealtime } from '@/hooks/use-realtime';
import { cn } from '@/lib/utils';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, initialized, loading } = useAuthStore();
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
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
    <div className="min-h-screen bg-muted/40">
      <TopBar />
      <div className="flex h-[calc(100vh-4rem)] gap-3 p-3">
        <Sidebar />
        <main className="relative flex-1 min-w-0 overflow-y-auto overflow-x-hidden rounded-2xl border border-border/60 bg-background shadow-soft scrollbar-thin">
          {children}
        </main>
      </div>
      <button
        type="button"
        onClick={toggleSidebar}
        aria-label={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
        title={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
        className={cn(
          'fixed top-1/2 z-40 hidden h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background text-muted-foreground shadow-md transition-[left,background-color,color] duration-200 ease-out hover:bg-muted hover:text-foreground md:flex',
          sidebarOpen ? 'left-[16.25rem]' : 'left-1.5',
        )}
      >
        {sidebarOpen ? (
          <ChevronLeft className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </button>
    </div>
  );
}
