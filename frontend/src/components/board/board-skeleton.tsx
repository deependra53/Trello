// Neutral, theme-aware loading state for a board. Shown both during route
// navigation (loading.tsx) and while the board data is fetching. Deliberately
// uses `bg-background` rather than a board color so we never flash the default
// purple before the real background loads — the real color fades in afterwards.
export function BoardSkeleton() {
  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex items-center gap-3 border-b border-border/60 px-4 py-2.5">
        <div className="skeleton h-8 w-8 rounded-lg" />
        <div className="skeleton h-5 w-40 rounded-md" />
        <div className="skeleton ml-auto h-8 w-48 rounded-lg" />
      </div>
      <div className="flex flex-1 items-start gap-3 overflow-hidden p-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="skeleton h-64 w-72 shrink-0 rounded-xl"
            style={{ opacity: 1 - i * 0.15 }}
          />
        ))}
      </div>
    </div>
  );
}
