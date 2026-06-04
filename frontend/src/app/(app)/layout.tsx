'use client';
import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { TopBar } from '@/components/shared/topbar';
import { Sidebar } from '@/components/shared/sidebar';
import { ChatApp } from '@/components/chat/chat-app';
import { useAuthStore } from '@/stores/auth';
import { useUIStore } from '@/stores/ui';
import { useNotificationRealtime } from '@/hooks/use-realtime';
import { useWorkspaceSection } from '@/hooks/use-workspace-section';
import { useChatAccess } from '@/hooks/use-chat-access';
import { cn } from '@/lib/utils';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const { user, initialized, loading } = useAuthStore();
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const setWorkspaceSection = useUIStore((s) => s.setWorkspaceSection);
  const { section } = useWorkspaceSection();
  const { canAccessChat } = useChatAccess();
  useNotificationRealtime();

  useEffect(() => {
    if (initialized && !loading && !user) router.replace('/login');
  }, [initialized, loading, user, router]);

  // Guests without chat access can never land on the Chat pane (e.g. a stale
  // store value or a hard /chat load) — snap them back to Boards.
  useEffect(() => {
    if (!canAccessChat && section === 'chat') setWorkspaceSection('boards');
  }, [canAccessChat, section, setWorkspaceSection]);

  // Seed the section once, from the route we landed on (so a hard refresh of
  // /chat shows chat). Runs only on mount; the toggle drives it thereafter.
  useEffect(() => {
    setWorkspaceSection(window.location.pathname.startsWith('/chat') ? 'chat' : 'boards');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!initialized || loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-muted/40">
        <div className="grid h-12 w-12 animate-scale-in place-items-center rounded-2xl brand-gradient text-primary-foreground shadow-glow">
          <span className="text-lg font-bold">I</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-border border-t-primary" />
          Loading…
        </div>
      </div>
    );
  }

  if (!user) return null;

  // Channel for a deep `/chat/<id>` load — only meaningful on ChatApp's first mount.
  const initialChannelId = pathname?.startsWith('/chat/') ? pathname.split('/')[2] : undefined;
  const isChat = section === 'chat' && canAccessChat;
  const slide = reduce
    ? { duration: 0 }
    : { type: 'tween' as const, duration: 0.5, ease: [0.22, 1, 0.36, 1] as const };

  return (
    <div className="min-h-screen bg-muted/40">
      <TopBar />
      <div className="relative h-[calc(100vh-4rem)] overflow-hidden">
        {/* Boards world: the normal Next-routed content + its sidebar. Kept
            mounted while chat is shown, so a specific board is preserved. */}
        <motion.div
          style={{ willChange: 'transform' }}
          className={cn('absolute inset-0', isChat && 'pointer-events-none')}
          aria-hidden={isChat}
          initial={false}
          animate={{ x: isChat ? '-100%' : '0%' }}
          transition={slide}
        >
          <div className="flex h-full gap-3 p-3">
            <Sidebar />
            <main className="relative min-w-0 flex-1 overflow-y-auto overflow-x-hidden rounded-2xl border border-border/60 bg-background shadow-sm scrollbar-thin">
              {children}
            </main>
          </div>
        </motion.div>

        {/* Chat: always mounted, slides over from the right. */}
        <motion.div
          style={{ willChange: 'transform' }}
          className={cn('absolute inset-0', !isChat && 'pointer-events-none')}
          aria-hidden={!isChat}
          initial={false}
          animate={{ x: isChat ? '0%' : '100%' }}
          transition={slide}
        >
          <div className="h-full p-3">
            <div className="h-full overflow-hidden rounded-2xl border border-border/60 bg-background shadow-sm">
              <ChatApp initialChannelId={initialChannelId} />
            </div>
          </div>
        </motion.div>
      </div>
      <button
        type="button"
        onClick={toggleSidebar}
        aria-label={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
        title={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
        className={cn(
          'fixed top-1/2 z-40 hidden h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border border-border/60 bg-card text-muted-foreground shadow-md outline-none transition-[left,background-color,color,box-shadow] duration-200 ease-out hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-0',
          isChat ? 'md:hidden' : 'md:flex',
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
