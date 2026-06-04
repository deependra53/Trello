'use client';
import * as React from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { IsRestoringProvider, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { useAuthStore } from '@/stores/auth';
import { queryClient, restoreQueryCache, startPersisting } from '@/lib/query-persist';
import { CommandPalette } from './command-palette';

function AuthHydrator({ children }: { children: React.ReactNode }) {
  const hydrate = useAuthStore((s) => s.hydrate);
  React.useEffect(() => {
    hydrate();
  }, [hydrate]);
  return <>{children}</>;
}

/**
 * Rehydrates the query cache from IndexedDB before any query mounts. While
 * `isRestoring` is true, `IsRestoringProvider` keeps queries from fetching, so
 * restored data lands as `success` (no skeleton) and we never fire a request
 * that the snapshot is about to satisfy. After restore we start mirroring cache
 * changes back to IndexedDB.
 */
function PersistGate({ children }: { children: React.ReactNode }) {
  const [isRestoring, setIsRestoring] = React.useState(true);
  React.useEffect(() => {
    let mounted = true;
    restoreQueryCache().finally(() => {
      if (mounted) setIsRestoring(false);
      startPersisting();
    });
    return () => {
      mounted = false;
    };
  }, []);
  return <IsRestoringProvider value={isRestoring}>{children}</IsRestoringProvider>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <QueryClientProvider client={queryClient}>
        <PersistGate>
          <AuthHydrator>{children}</AuthHydrator>
          <CommandPalette />
          <Toaster richColors position="top-right" />
        </PersistGate>
      </QueryClientProvider>
    </NextThemesProvider>
  );
}
