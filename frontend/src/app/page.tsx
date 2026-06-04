import Link from 'next/link';
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  GanttChartSquare,
  Layers,
  MapPin,
  Table,
  Workflow,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/shared/theme-toggle';

const features = [
  { icon: Layers, title: 'Kanban Boards', text: 'Drag-and-drop lists and cards across boards.' },
  { icon: Calendar, title: 'Calendar View', text: 'See due dates at a glance, drag to reschedule.' },
  { icon: GanttChartSquare, title: 'Timeline', text: 'Gantt-style horizontal view of in-flight work.' },
  { icon: Table, title: 'Table View', text: 'Spreadsheet-power for power users.' },
  { icon: Workflow, title: 'Automation', text: 'Rules that move, label, and ping for you.' },
  { icon: MapPin, title: 'Map View', text: 'Cards with locations plotted on a real map.' },
];

const benefits = [
  'Real-time collaboration',
  'Six board views',
  'Card mirroring & checklists',
  'Built-in automation',
  'Dark & light themes',
  'Mobile-ready',
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background">
      {/* Decorative gradient blobs */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[600px] overflow-hidden"
      >
        <div className="absolute -left-32 top-20 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-violet-400/20 blur-3xl" />
      </div>

      <header className="container flex h-16 items-center">
        <Link href="/" className="flex items-center gap-2.5 font-bold tracking-tight">
          <div className="grid h-9 w-9 place-items-center rounded-xl brand-gradient text-primary-foreground shadow-glow">
            I
          </div>
          IndiHive
        </Link>
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <Button asChild variant="ghost" size="sm">
            <Link href="/login">Log in</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/signup">Get started</Link>
          </Button>
        </div>
      </header>

      <section className="container flex flex-col items-center gap-6 py-20 text-center md:py-28 animate-fade-up">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" /> Now shipping
          phase by phase
        </span>
        <h1 className="max-w-3xl text-5xl font-extrabold tracking-tight md:text-7xl">
          Plan, organize, and{' '}
          <span className="brand-text">ship faster</span>
          {' '}
          together.
        </h1>
        <p className="max-w-2xl text-lg text-muted-foreground md:text-xl">
          IndiHive is a collaborative kanban for teams that build. Six board views, real-time sync,
          automation, and a calm UI for getting things done.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg" className="shadow-glow">
            <Link href="/signup">
              Start free <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/login">I already have an account</Link>
          </Button>
        </div>
        <ul className="mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
          {benefits.map((b) => (
            <li key={b} className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-primary" /> {b}
            </li>
          ))}
        </ul>
      </section>

      {/* Hero board preview */}
      <section className="container pb-20">
        <div className="relative mx-auto max-w-5xl overflow-hidden rounded-2xl border border-border/60 bg-card shadow-xl">
          <div className="brand-gradient h-10" />
          <div className="grid gap-3 p-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {['Backlog', 'In Progress', 'Review', 'Done'].map((title, i) => (
              <div key={title} className="rounded-xl border border-border/60 bg-muted/40 p-3">
                <div className="mb-3 flex items-center justify-between text-xs font-semibold">
                  <span>{title}</span>
                  <span className="rounded-full bg-background px-2 text-[10px] text-muted-foreground">
                    {3 + i}
                  </span>
                </div>
                <div className="space-y-2">
                  {Array.from({ length: 3 + i }).map((_, j) => (
                    <div
                      key={j}
                      className="fade-up rounded-lg border border-border/60 bg-card p-2.5 shadow-sm"
                      style={{ animationDelay: `${(i * 3 + j) * 40}ms` }}
                    >
                      <div className="mb-2 h-1.5 w-12 rounded-full bg-primary/40" />
                      <div className="h-3 w-4/5 rounded bg-muted" />
                      <div className="mt-2 flex items-center gap-1.5">
                        <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
                        <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container grid gap-6 pb-24 md:grid-cols-2 lg:grid-cols-3">
        {features.map(({ icon: Icon, title, text }) => (
          <div
            key={title}
            className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card p-6 shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-glow"
          >
            <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-primary/10 opacity-0 transition-opacity group-hover:opacity-100" />
            <div className="grid h-11 w-11 place-items-center rounded-xl brand-gradient text-primary-foreground shadow-glow-sm">
              <Icon className="h-5 w-5" />
            </div>
            <h3 className="mt-4 font-semibold tracking-tight">{title}</h3>
            <p className="mt-1.5 text-sm text-muted-foreground">{text}</p>
          </div>
        ))}
      </section>

      <footer className="border-t border-border/60 bg-background py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} IndiHive. Built phase by phase, in the open.
      </footer>
    </main>
  );
}
