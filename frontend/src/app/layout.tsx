import type { Metadata } from 'next';
import '../styles/globals.css';
import { Providers } from '@/components/shared/providers';

export const metadata: Metadata = {
  title: 'TrelloX — Plan, organize, and ship faster',
  description: 'A modern collaborative kanban for teams that build.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
