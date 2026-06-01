'use client';
import { motion } from 'framer-motion';
import { Calendar, GanttChartSquare, LayoutGrid, LineChart, Table } from 'lucide-react';
import { cn } from '@/lib/utils';

export type BoardViewKind =
  | 'board'
  | 'calendar'
  | 'timeline'
  | 'table'
  | 'dashboard'
  | 'map';

const VIEWS: { id: BoardViewKind; label: string; icon: typeof Calendar }[] = [
  { id: 'board', label: 'Board', icon: LayoutGrid },
  { id: 'calendar', label: 'Calendar', icon: Calendar },
  { id: 'timeline', label: 'Timeline', icon: GanttChartSquare },
  { id: 'table', label: 'Table', icon: Table },
  { id: 'dashboard', label: 'Dashboard', icon: LineChart },
];

interface Props {
  current: BoardViewKind;
  onChange: (v: BoardViewKind) => void;
}

export function ViewSwitcher({ current, onChange }: Props) {
  return (
    <div className="flex items-center gap-0.5 rounded-lg bg-white/15 p-1 backdrop-blur-sm">
      {VIEWS.map(({ id, label, icon: Icon }) => {
        const active = current === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className={cn(
              'relative inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
              active ? 'text-primary' : 'text-white/90 hover:text-white',
            )}
          >
            {active && (
              <motion.span
                layoutId="view-switcher-pill"
                className="absolute inset-0 rounded-md bg-white shadow-sm"
                transition={{ type: 'spring', stiffness: 500, damping: 38 }}
              />
            )}
            <Icon className="relative z-10 h-3.5 w-3.5" />
            <span className="relative z-10 hidden sm:inline">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
