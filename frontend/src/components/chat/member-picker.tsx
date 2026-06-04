'use client';
import { useMemo, useState } from 'react';
import { Check, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { UserAvatar } from './user-avatar';
import type { OrgMember } from '@/types/api';

/** Multi-select list of org members (used by create-channel, add-members, start-DM). */
export function MemberPicker({
  members,
  selected,
  onToggle,
  excludeIds = [],
  single = false,
}: {
  members: OrgMember[];
  selected: string[];
  onToggle: (userId: string) => void;
  excludeIds?: string[];
  single?: boolean;
}) {
  const [q, setQ] = useState('');
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return members
      .filter((m) => !excludeIds.includes(m.userId))
      .filter(
        (m) =>
          !term ||
          m.profile?.fullName?.toLowerCase().includes(term) ||
          m.profile?.email?.toLowerCase().includes(term),
      );
  }, [members, q, excludeIds]);

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search people…"
          className="pl-9"
        />
      </div>
      <div className="max-h-64 space-y-0.5 overflow-y-auto scrollbar-thin">
        {filtered.length === 0 && (
          <p className="px-2 py-6 text-center text-sm text-muted-foreground">No people found</p>
        )}
        {filtered.map((m) => {
          const isSelected = selected.includes(m.userId);
          return (
            <button
              key={m.userId}
              type="button"
              onClick={() => onToggle(m.userId)}
              className={cn(
                'flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
                isSelected && 'bg-primary/10',
              )}
            >
              <UserAvatar user={m.profile} id={m.userId} className="h-8 w-8" />
              <div className="min-w-0 flex-1">
                <div className={cn('truncate font-medium', isSelected && 'text-primary')}>
                  {m.profile?.fullName ?? m.userId}
                </div>
                <div className="truncate text-xs text-muted-foreground">{m.profile?.email}</div>
              </div>
              <span
                className={cn(
                  'grid h-5 w-5 place-items-center rounded-full border transition-colors',
                  isSelected
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border/60',
                  single && 'rounded-full',
                )}
              >
                {isSelected && <Check className="h-3 w-3 animate-check-pop" />}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
