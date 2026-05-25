import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen md:grid-cols-2">
      <div className="hidden flex-col justify-between bg-gradient-to-br from-primary to-blue-700 p-12 text-primary-foreground md:flex">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold">
          <div className="grid h-8 w-8 place-items-center rounded-md bg-white/20">T</div>
          TrelloX
        </Link>
        <blockquote className="space-y-2">
          <p className="text-2xl font-medium leading-snug">
            “TrelloX is the calmest kanban I&apos;ve used in years.”
          </p>
          <footer className="text-sm opacity-80">— happy beta tester</footer>
        </blockquote>
      </div>
      <main className="flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-sm">{children}</div>
      </main>
    </div>
  );
}
