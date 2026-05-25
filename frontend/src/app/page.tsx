import Link from 'next/link';
import { ArrowRight, Calendar, GanttChartSquare, Layers, MapPin, Table, Workflow } from 'lucide-react';
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

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <header className="container flex h-14 items-center">
        <Link href="/" className="flex items-center gap-2 font-bold">
          <div className="grid h-8 w-8 place-items-center rounded-md bg-primary text-primary-foreground">T</div>
          TrelloX
        </Link>
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <Button asChild variant="ghost" size="sm">
            <Link href="/login">Log in</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/signup">Sign up</Link>
          </Button>
        </div>
      </header>

      <section className="container flex flex-col items-center gap-6 py-20 text-center">
        <h1 className="max-w-3xl text-5xl font-extrabold tracking-tight md:text-6xl">
          Plan, organize, and ship faster — together.
        </h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          TrelloX is a collaborative kanban for teams that build. Six board views, real-time sync,
          automation, and a calm UI for getting things done.
        </p>
        <div className="flex gap-3">
          <Button asChild size="lg">
            <Link href="/signup">
              Start free <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/login">I already have an account</Link>
          </Button>
        </div>
      </section>

      <section className="container grid gap-6 pb-24 md:grid-cols-2 lg:grid-cols-3">
        {features.map(({ icon: Icon, title, text }) => (
          <div key={title} className="rounded-xl border bg-card p-6 shadow-sm">
            <Icon className="h-6 w-6 text-primary" />
            <h3 className="mt-3 font-semibold">{title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{text}</p>
          </div>
        ))}
      </section>

      <footer className="border-t bg-background py-6 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} TrelloX. Built phase by phase.
      </footer>
    </main>
  );
}
