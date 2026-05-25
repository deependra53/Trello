'use client';
import { Calendar, GanttChartSquare, LayoutGrid, LineChart, MapPin, Table } from 'lucide-react';
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
  { id: 'map', label: 'Map', icon: MapPin },
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
              'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all',
              active
                ? 'bg-white text-primary shadow-sm'
                : 'text-white/90 hover:bg-white/15 hover:text-white',
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
