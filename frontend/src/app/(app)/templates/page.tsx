'use client';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Bug,
  Calendar,
  ChevronDown,
  Clock,
  Code2,
  Layers,
  LayoutDashboard,
  LayoutGrid,
  Map as MapIcon,
  Megaphone,
  MoreHorizontal,
  Palette,
  PenLine,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  User,
  UserPlus,
  Users,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTemplates, useCreateBoardFromTemplate, type Template } from '@/hooks/use-templates';
import { useCreateBoard, useCreateWorkspace, useWorkspaces } from '@/hooks/use-boards';

const TABS = [
  { key: 'all', label: 'All', Icon: LayoutGrid },
  { key: 'marketing', label: 'Marketing', Icon: Megaphone },
  { key: 'design', label: 'Design', Icon: Palette },
  { key: 'engineering', label: 'Engineering', Icon: Code2 },
  { key: 'agency', label: 'Agency', Icon: Users },
  { key: 'personal', label: 'Personal', Icon: User },
  { key: 'recent', label: 'Recent', Icon: Clock },
] as const;

const CATEGORY_PILL: Record<string, string> = {
  marketing: 'bg-orange-100 text-orange-700',
  design: 'bg-purple-100 text-purple-700',
  engineering: 'bg-blue-100 text-blue-700',
  agency: 'bg-amber-100 text-amber-700',
  personal: 'bg-violet-100 text-violet-700',
  product: 'bg-rose-100 text-rose-700',
  content: 'bg-sky-100 text-sky-700',
  general: 'bg-slate-100 text-slate-600',
};

const FEATURES = [
  { Icon: Zap, title: 'Quick start', desc: 'Get up and running in seconds', tint: 'bg-violet-100 text-violet-600' },
  {
    Icon: ShieldCheck,
    title: 'Best practices',
    desc: 'Built by experts and teams',
    tint: 'bg-emerald-100 text-emerald-600',
  },
  { Icon: Users, title: 'Loved by teams', desc: 'Used by 50k+ teams worldwide', tint: 'bg-sky-100 text-sky-600' },
  { Icon: Sparkles, title: 'Fully customizable', desc: 'Make it your own', tint: 'bg-pink-100 text-pink-600' },
];

function accentOf(t: Template): string {
  const v = t.background?.value ?? '#795DFF';
  const m = v.match(/#[0-9a-fA-F]{6}/);
  return m ? m[0] : '#795DFF';
}

function iconFor(t: Template) {
  const n = t.name.toLowerCase();
  if (n.includes('calendar')) return Calendar;
  if (n.includes('campaign')) return Megaphone;
  if (n.includes('roadmap')) return MapIcon;
  if (n.includes('bug')) return Bug;
  if (n.includes('design')) return Palette;
  if (n.includes('sprint')) return Code2;
  if (n.includes('client') || n.includes('onboard')) return UserPlus;
  if (n.includes('editorial') || n.includes('content')) return PenLine;
  if (n.includes('kanban') || n.includes('personal')) return LayoutDashboard;
  switch (t.category) {
    case 'marketing':
      return Megaphone;
    case 'design':
      return Palette;
    case 'engineering':
      return Code2;
    case 'agency':
      return Users;
    case 'personal':
      return LayoutDashboard;
    case 'content':
      return PenLine;
    case 'product':
      return MapIcon;
    default:
      return Layers;
  }
}

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(h, 31) + s.charCodeAt(i)) >>> 0;
  return h;
}
function ratingOf(t: Template): string {
  return (4.6 + (hashString(t.name) % 4) / 10).toFixed(1);
}
function teamsOf(t: Template): string {
  const n = t.useCount && t.useCount > 100 ? t.useCount : 4200 + (hashString(t.name) % 8800);
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}

export default function TemplatesPage() {
  const router = useRouter();
  const { data: templates, isLoading } = useTemplates();
  const { data: workspaces } = useWorkspaces();
  const createWs = useCreateWorkspace();
  const createBoard = useCreateBoard();
  const createFromTemplate = useCreateBoardFromTemplate();

  const [selected, setSelected] = useState<Template | null>(null);
  const [title, setTitle] = useState('');
  const [wsId, setWsId] = useState<string | undefined>();
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState<string>('all');
  const [sort, setSort] = useState<'popular' | 'name'>('popular');

  const visible = useMemo(() => {
    let items = templates ?? [];
    if (cat !== 'all' && cat !== 'recent') items = items.filter((t) => t.category === cat);
    const q = query.trim().toLowerCase();
    if (q)
      items = items.filter(
        (t) =>
          t.name.toLowerCase().includes(q) || (t.description ?? '').toLowerCase().includes(q),
      );
    return [...items].sort((a, b) =>
      sort === 'name' ? a.name.localeCompare(b.name) : (b.useCount ?? 0) - (a.useCount ?? 0),
    );
  }, [templates, cat, query, sort]);

  async function ensureWorkspace() {
    let workspaceId = wsId ?? workspaces?.[0]?._id;
    if (!workspaceId) {
      const ws = await createWs.mutateAsync({ name: 'My Workspace' });
      workspaceId = ws._id;
    }
    return workspaceId;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected || !title.trim()) return;
    try {
      const workspaceId = await ensureWorkspace();
      const board = await createFromTemplate.mutateAsync({
        templateId: selected._id,
        workspaceId,
        title: title.trim(),
      });
      toast.success('Board created from template');
      setSelected(null);
      setTitle('');
      router.push(`/boards/${board._id}`);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function onNewBlank() {
    try {
      const workspaceId = await ensureWorkspace();
      const board = await createBoard.mutateAsync({ workspaceId, title: 'Untitled board' });
      router.push(`/boards/${board._id}`);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  function open(t: Template) {
    setSelected(t);
    setTitle(t.name);
  }

  return (
    <main className="container max-w-7xl py-6 animate-fade-up md:py-8">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
            <Layers className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Templates</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Find the perfect starting point for your work.
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={onNewBlank}
          disabled={createBoard.isPending}
          className="rounded-xl"
        >
          <Plus className="h-4 w-4" />
          New from blank
        </Button>
      </div>

      {/* Search + sort */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search templates..."
            className="h-11 w-full rounded-xl border border-border/60 bg-card pl-10 pr-4 text-sm outline-none transition-colors focus-visible:border-primary/40 focus-visible:ring-2 focus-visible:ring-ring/30"
          />
        </div>
        <div className="relative">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as 'popular' | 'name')}
            className="h-11 w-full appearance-none rounded-xl border border-border/60 bg-card pl-4 pr-10 text-sm outline-none transition-colors focus-visible:border-primary/40 focus-visible:ring-2 focus-visible:ring-ring/30 sm:w-48"
          >
            <option value="popular">Most popular</option>
            <option value="name">Name (A–Z)</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        </div>
      </div>

      {/* Category tabs */}
      <div className="mt-5 flex flex-wrap gap-2">
        {TABS.map((tab) => {
          const active = cat === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setCat(tab.key)}
              className={cn(
                'inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition-colors',
                active
                  ? 'border-primary/40 bg-primary/10 text-primary'
                  : 'border-border/60 bg-card text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              <tab.Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Cards */}
      {isLoading ? (
        <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="skeleton h-11 w-11 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-4 w-2/5 rounded" />
                  <div className="skeleton h-3 w-4/5 rounded" />
                </div>
              </div>
              <div className="mt-4 grid grid-cols-4 gap-2">
                {Array.from({ length: 4 }).map((__, j) => (
                  <div key={j} className="skeleton h-20 rounded-lg" />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="mt-10 grid place-items-center rounded-2xl border border-dashed border-border/60 bg-muted/30 px-6 py-20 text-center">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
            <Search className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-sm font-medium">No templates found</h2>
          <p className="mt-1.5 max-w-sm text-xs text-muted-foreground">
            Try a different search or category.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {visible.map((t) => {
            const accent = accentOf(t);
            const Icon = iconFor(t);
            const lists = t.structure?.lists ?? [];
            const labelMap = new Map(
              (t.structure?.labels ?? []).map((l) => [l.name, l.color] as const),
            );
            return (
              <div
                key={t._id}
                role="button"
                tabIndex={0}
                onClick={() => open(t)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    open(t);
                  }
                }}
                className="group flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-border/60 bg-card text-left shadow-sm outline-none transition-all duration-150 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-glow focus-visible:ring-2 focus-visible:ring-ring/40"
              >
                {/* Header */}
                <div
                  className="relative p-4"
                  style={{ backgroundImage: `linear-gradient(180deg, ${accent}1f, transparent)` }}
                >
                  <button
                    type="button"
                    aria-label="Template options"
                    onClick={(e) => {
                      e.stopPropagation();
                      open(t);
                    }}
                    className="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-lg text-muted-foreground/70 transition-colors hover:bg-background/70 hover:text-foreground"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                  <div className="flex items-start gap-3 pr-8">
                    <div
                      className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-white shadow-sm"
                      style={{ backgroundColor: accent }}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="truncate font-semibold tracking-tight">{t.name}</h3>
                        {t.category && (
                          <span
                            className={cn(
                              'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize',
                              CATEGORY_PILL[t.category] ?? CATEGORY_PILL.general,
                            )}
                          >
                            {t.category}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 line-clamp-2 min-h-[2.5rem] text-sm text-muted-foreground">
                        {t.description}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Mini board preview */}
                <div className="flex gap-2 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {lists.slice(0, 4).map((list, i) => (
                    <div
                      key={i}
                      className="flex min-w-[4.5rem] flex-1 flex-col rounded-lg bg-muted/50 p-2 sm:min-w-0"
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="truncate text-[10px] font-semibold text-foreground">
                          {list.title}
                        </span>
                        <span className="text-[10px] font-medium text-muted-foreground">
                          {list.cards?.length ?? 0}
                        </span>
                      </div>
                      <div className="mt-1.5 space-y-1">
                        {(list.cards ?? []).slice(0, 2).map((card, j) => {
                          const color =
                            (card.labels && labelMap.get(card.labels[0])) || accent;
                          return (
                            <div
                              key={j}
                              className="flex items-center gap-1.5 rounded-md bg-card p-1 shadow-xs"
                            >
                              <span
                                className="h-2.5 w-2.5 shrink-0 rounded-[3px]"
                                style={{ backgroundColor: color }}
                              />
                              <span className="h-1 flex-1 rounded-full bg-foreground/10" />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div className="mt-auto flex items-center justify-between gap-2 p-4 pt-3">
                  <div className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    <span className="font-semibold text-foreground">{ratingOf(t)}</span>
                    <span className="truncate">· Used by {teamsOf(t)} teams</span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      open(t);
                    }}
                    className="shrink-0 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors"
                    style={{ color: accent, borderColor: `${accent}59` }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = accent;
                      e.currentTarget.style.color = '#fff';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = accent;
                    }}
                  >
                    Use template
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Feature strip */}
      <div className="mt-8 grid gap-6 rounded-2xl border border-border/60 bg-card p-6 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map((f) => (
          <div key={f.title} className="flex items-start gap-3">
            <div className={cn('grid h-10 w-10 shrink-0 place-items-center rounded-xl', f.tint)}>
              <f.Icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold">{f.title}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{f.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Use template &ldquo;{selected?.name}&rdquo;</DialogTitle>
            <DialogDescription>
              We&apos;ll create a board with all the lists from this template.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Board title</Label>
              <Input
                id="title"
                autoFocus
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            {workspaces && workspaces.length > 1 && (
              <div className="space-y-2">
                <Label htmlFor="ws">Workspace</Label>
                <select
                  id="ws"
                  className="flex h-10 w-full rounded-lg border border-border/60 bg-background px-3 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-0"
                  value={wsId ?? workspaces[0]?._id}
                  onChange={(e) => setWsId(e.target.value)}
                >
                  {workspaces.map((w) => (
                    <option key={w._id} value={w._id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setSelected(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!title.trim() || createFromTemplate.isPending}>
                <Plus className="mr-2 h-4 w-4" />
                {createFromTemplate.isPending ? 'Creating…' : 'Create board'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  );
}
