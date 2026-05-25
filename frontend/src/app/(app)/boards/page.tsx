export default function BoardsPage() {
  return (
    <main className="container py-8">
      <h1 className="text-3xl font-bold tracking-tight">Boards</h1>
      <p className="mt-2 text-muted-foreground">
        Workspaces, starred boards, and recent boards land here in Phase 5.
      </p>
      <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="aspect-video animate-pulse rounded-lg bg-muted shadow-sm"
            aria-hidden
          />
        ))}
      </div>
    </main>
  );
}
