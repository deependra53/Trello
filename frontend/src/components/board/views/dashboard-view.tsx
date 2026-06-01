'use client';
import { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { addDays, format, isAfter, isBefore, isToday, subDays } from 'date-fns';
import type { BoardFull, Card } from '@/types/api';

interface Props {
  board: BoardFull;
}

const PALETTE = ['#795DFF', '#22A186', '#F2994A', '#EB5757', '#2D9CDB', '#9B7BFF', '#11998E'];

export function DashboardView({ board }: Props) {
  const cards = useMemo(() => (board.cards ?? []).filter((c) => !c.archived), [board.cards]);

  // Cards per list
  const cardsPerList = useMemo(() => {
    return board.lists
      .filter((l) => !l.archived)
      .map((l) => ({
        name: l.title,
        count: cards.filter((c) => c.listId === l._id).length,
      }));
  }, [board.lists, cards]);

  // Cards per member
  const cardsPerMember = useMemo(() => {
    const counts = new Map<string, number>();
    for (const c of cards) {
      for (const m of c.members ?? []) {
        counts.set(m, (counts.get(m) ?? 0) + 1);
      }
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([id, count]) => ({ name: id.slice(0, 6), count }));
  }, [cards]);

  // Cards per label
  const cardsPerLabel = useMemo(() => {
    const counts = new Map<string, number>();
    for (const c of cards) {
      for (const l of c.labels ?? []) counts.set(l, (counts.get(l) ?? 0) + 1);
    }
    return board.labels
      .map((l) => ({ name: l.name || l.color, value: counts.get(l._id) ?? 0, color: l.color }))
      .filter((d) => d.value > 0);
  }, [board.labels, cards]);

  // Due buckets
  const dueBuckets = useMemo(() => {
    const now = new Date();
    const week = addDays(now, 7);
    let overdue = 0;
    let today = 0;
    let thisWeek = 0;
    let later = 0;
    let complete = 0;
    for (const c of cards) {
      if (!c.dueDate) continue;
      const d = new Date(c.dueDate);
      if (c.dueComplete) complete++;
      else if (isBefore(d, now) && !isToday(d)) overdue++;
      else if (isToday(d)) today++;
      else if (isBefore(d, week)) thisWeek++;
      else later++;
    }
    return [
      { name: 'Overdue', value: overdue, color: '#EB5757' },
      { name: 'Today', value: today, color: '#F2994A' },
      { name: 'This week', value: thisWeek, color: '#2D9CDB' },
      { name: 'Later', value: later, color: '#9B7BFF' },
      { name: 'Done', value: complete, color: '#22A186' },
    ].filter((d) => d.value > 0);
  }, [cards]);

  // Completion over time (last 14 days)
  const completion = useMemo(() => {
    const out: { day: string; created: number; completed: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const day = subDays(new Date(), i);
      out.push({
        day: format(day, 'MMM d'),
        created: 0,
        completed: 0,
      });
    }
    for (const c of cards) {
      const created = new Date((c as Card & { createdAt?: string }).createdAt ?? Date.now());
      const completed = c.dueComplete && c.dueDate ? new Date(c.dueDate) : null;
      for (const row of out) {
        if (format(created, 'MMM d') === row.day) row.created++;
        if (completed && format(completed, 'MMM d') === row.day) row.completed++;
      }
    }
    return out;
  }, [cards]);

  const total = cards.length;
  const completed = cards.filter((c) => c.dueComplete).length;
  const completionPct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="flex h-full flex-col gap-4 overflow-auto p-4 scrollbar-thin">
      <div className="grid gap-4 md:grid-cols-4">
        <Stat label="Total cards" value={total} />
        <Stat label="Lists" value={board.lists.filter((l) => !l.archived).length} />
        <Stat label="Members" value={board.members?.length ?? 0} />
        <Stat label="Completion" value={`${completionPct}%`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Cards per list">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={cardsPerList}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip
                cursor={{ fill: 'hsl(var(--accent) / 0.4)' }}
                contentStyle={{
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 8,
                  color: 'hsl(var(--popover-foreground))',
                  fontSize: 12,
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
              />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {cardsPerList.map((_, i) => (
                  <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="Cards per member">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={cardsPerMember} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip
                cursor={{ fill: 'hsl(var(--accent) / 0.4)' }}
                contentStyle={{
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 8,
                  color: 'hsl(var(--popover-foreground))',
                  fontSize: 12,
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
              />
              <Bar dataKey="count" radius={[0, 6, 6, 0]} fill="#795DFF" />
            </BarChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="Cards per label">
          {cardsPerLabel.length === 0 ? (
            <Empty>No labels yet.</Empty>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={cardsPerLabel} dataKey="value" innerRadius={50} outerRadius={90}>
                  {cardsPerLabel.map((d, i) => (
                    <Cell key={i} fill={d.color || PALETTE[i % PALETTE.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 8,
                    color: 'hsl(var(--popover-foreground))',
                    fontSize: 12,
                  }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Legend wrapperStyle={{ fontSize: 11, color: 'hsl(var(--foreground))' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Panel>

        <Panel title="Due date buckets">
          {dueBuckets.length === 0 ? (
            <Empty>No cards with due dates.</Empty>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={dueBuckets} dataKey="value" innerRadius={50} outerRadius={90}>
                  {dueBuckets.map((d, i) => (
                    <Cell key={i} fill={d.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 8,
                    color: 'hsl(var(--popover-foreground))',
                    fontSize: 12,
                  }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Legend wrapperStyle={{ fontSize: 11, color: 'hsl(var(--foreground))' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Panel>

        <Panel title="Activity — last 14 days" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={completion}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 8,
                  color: 'hsl(var(--popover-foreground))',
                  fontSize: 12,
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
              />
              <Legend wrapperStyle={{ fontSize: 11, color: 'hsl(var(--foreground))' }} />
              <Line
                type="monotone"
                dataKey="created"
                stroke="#795DFF"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="completed"
                stroke="#22A186"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Panel>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-4 shadow-soft">
      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 text-2xl font-bold tracking-tight">{value}</div>
    </div>
  );
}

function Panel({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={
        'rounded-xl border border-border/60 bg-card p-4 shadow-soft ' + (className ?? '')
      }
    >
      <h3 className="mb-3 text-sm font-semibold">{title}</h3>
      {children}
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid h-[240px] place-items-center text-sm text-muted-foreground">
      {children}
    </div>
  );
}
