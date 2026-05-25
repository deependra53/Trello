export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-5xl font-bold tracking-tight">TrelloX</h1>
      <p className="max-w-prose text-center text-muted-foreground">
        Plan, organize, and ship faster. Phase 0 scaffolding is live — the full app comes online
        phase-by-phase.
      </p>
      <a
        href="/login"
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
      >
        Get started
      </a>
    </main>
  );
}
