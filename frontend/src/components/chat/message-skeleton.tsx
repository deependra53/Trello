import { cn } from '@/lib/utils';

// Deterministic line widths so the placeholder looks like a real conversation
// (varied message lengths) without any layout shift between renders.
const ROWS: string[][] = [
  ['w-40', 'w-64'],
  ['w-52'],
  ['w-32', 'w-48', 'w-56'],
  ['w-44'],
  ['w-60', 'w-36'],
  ['w-28', 'w-52'],
];

/**
 * Shimmer placeholder for a channel's message list, shown while the first page
 * loads so we never flash the "Welcome to #channel" empty state before we know
 * whether the channel actually has messages.
 */
export function MessageListSkeleton() {
  return (
    <div className="space-y-6 px-4 py-2" aria-hidden>
      {ROWS.map((lines, i) => (
        <div key={i} className="flex gap-3">
          <div className="skeleton h-9 w-9 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2 pt-0.5">
            <div className="flex items-center gap-2">
              <div className="skeleton h-3.5 w-24 rounded" />
              <div className="skeleton h-3 w-12 rounded" />
            </div>
            {lines.map((w, j) => (
              <div key={j} className={cn('skeleton h-3.5 rounded', w)} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
