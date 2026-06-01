'use client';
import { useMemo, useState } from 'react';
import {
  Calendar as CalendarIcon,
  Check,
  ChevronDown,
  Clock,
  Filter as FilterIcon,
  Tag,
  User as UserIcon,
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn, getInitials } from '@/lib/utils';
import type { BoardFull, BoardMemberProfile, Card, Label } from '@/types/api';

export type DueFilter = 'no-date' | 'overdue' | 'next-day' | 'next-week' | 'next-month';
export type ActivityFilter =
  | 'last-week'
  | 'last-two-weeks'
  | 'last-four-weeks'
  | 'no-activity-four-weeks';
export type StatusFilter = 'complete' | 'incomplete';
export type MatchMode = 'any' | 'all';

export interface BoardFilter {
  keyword: string;
  noMembers: boolean;
  memberIds: string[];
  noLabels: boolean;
  labelIds: string[];
  due: DueFilter[];
  status: StatusFilter[];
  activity: ActivityFilter[];
  match: MatchMode;
}

export const emptyFilter: BoardFilter = {
  keyword: '',
  noMembers: false,
  memberIds: [],
  noLabels: false,
  labelIds: [],
  due: [],
  status: [],
  activity: [],
  match: 'any',
};

export function isFilterActive(f: BoardFilter): boolean {
  return (
    f.keyword.trim().length > 0 ||
    f.noMembers ||
    f.noLabels ||
    f.memberIds.length > 0 ||
    f.labelIds.length > 0 ||
    f.due.length > 0 ||
    f.status.length > 0 ||
    f.activity.length > 0
  );
}

export function activeFilterCount(f: BoardFilter): number {
  let n = 0;
  if (f.keyword.trim()) n += 1;
  if (f.noMembers) n += 1;
  if (f.noLabels) n += 1;
  n += f.memberIds.length;
  n += f.labelIds.length;
  n += f.due.length;
  n += f.status.length;
  n += f.activity.length;
  return n;
}

const DAY = 24 * 60 * 60 * 1000;

function matchesDue(card: Card, due: DueFilter[]): boolean {
  if (due.length === 0) return true;
  const now = Date.now();
  return due.some((d) => {
    if (d === 'no-date') return !card.dueDate;
    if (!card.dueDate) return false;
    const t = new Date(card.dueDate).getTime();
    if (Number.isNaN(t)) return false;
    if (d === 'overdue') return t < now && !card.dueComplete;
    if (d === 'next-day') return t >= now && t <= now + DAY;
    if (d === 'next-week') return t >= now && t <= now + 7 * DAY;
    if (d === 'next-month') return t >= now && t <= now + 30 * DAY;
    return false;
  });
}

function matchesActivity(card: Card, activity: ActivityFilter[]): boolean {
  if (activity.length === 0) return true;
  const ts = card.updatedAt ? new Date(card.updatedAt).getTime() : 0;
  if (!ts) return activity.includes('no-activity-four-weeks');
  const now = Date.now();
  return activity.some((a) => {
    if (a === 'last-week') return now - ts <= 7 * DAY;
    if (a === 'last-two-weeks') return now - ts <= 14 * DAY;
    if (a === 'last-four-weeks') return now - ts <= 28 * DAY;
    if (a === 'no-activity-four-weeks') return now - ts > 28 * DAY;
    return false;
  });
}

function matchesStatus(card: Card, status: StatusFilter[]): boolean {
  if (status.length === 0) return true;
  return status.some((s) =>
    s === 'complete' ? !!card.dueComplete : !card.dueComplete,
  );
}

function matchesMembers(
  card: Card,
  noMembers: boolean,
  memberIds: string[],
): boolean {
  if (!noMembers && memberIds.length === 0) return true;
  const cardMembers = card.members ?? [];
  const noneSelected = noMembers && cardMembers.length === 0;
  const someSelected =
    memberIds.length > 0 && memberIds.some((id) => cardMembers.includes(id));
  return noneSelected || someSelected;
}

function matchesLabels(
  card: Card,
  noLabels: boolean,
  labelIds: string[],
): boolean {
  if (!noLabels && labelIds.length === 0) return true;
  const cardLabels = card.labels ?? [];
  const noneSelected = noLabels && cardLabels.length === 0;
  const someSelected =
    labelIds.length > 0 && labelIds.some((id) => cardLabels.includes(id));
  return noneSelected || someSelected;
}

function matchesKeyword(card: Card, keyword: string): boolean {
  const q = keyword.trim().toLowerCase();
  if (!q) return true;
  if (card.title?.toLowerCase().includes(q)) return true;
  if (card.description?.toLowerCase().includes(q)) return true;
  return false;
}

export function applyBoardFilter(cards: Card[], filter: BoardFilter): Card[] {
  if (!isFilterActive(filter)) return cards;
  return cards.filter((card) => {
    const checks: { active: boolean; pass: boolean }[] = [
      { active: filter.keyword.trim().length > 0, pass: matchesKeyword(card, filter.keyword) },
      {
        active: filter.noMembers || filter.memberIds.length > 0,
        pass: matchesMembers(card, filter.noMembers, filter.memberIds),
      },
      { active: filter.status.length > 0, pass: matchesStatus(card, filter.status) },
      { active: filter.due.length > 0, pass: matchesDue(card, filter.due) },
      {
        active: filter.noLabels || filter.labelIds.length > 0,
        pass: matchesLabels(card, filter.noLabels, filter.labelIds),
      },
      { active: filter.activity.length > 0, pass: matchesActivity(card, filter.activity) },
    ].filter((c) => c.active);

    if (checks.length === 0) return true;
    return filter.match === 'all'
      ? checks.every((c) => c.pass)
      : checks.some((c) => c.pass);
  });
}

interface Props {
  board: BoardFull;
  filter: BoardFilter;
  onChange: (next: BoardFilter) => void;
}

export function BoardFilterPopover({ board, filter, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [matchOpen, setMatchOpen] = useState(false);
  const [selectMembersOpen, setSelectMembersOpen] = useState(false);
  const [selectLabelsOpen, setSelectLabelsOpen] = useState(false);

  const count = activeFilterCount(filter);
  const members = board.memberProfiles ?? [];
  const labels = board.labels ?? [];
  const visibleLabelChips = labels.slice(0, 3);
  const hasMoreLabels = labels.length > visibleLabelChips.length;

  function patch(p: Partial<BoardFilter>) {
    onChange({ ...filter, ...p });
  }
  function toggleArray<T>(arr: T[], v: T): T[] {
    return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            'relative gap-2 text-white hover:bg-white/15 hover:text-white',
            count > 0 && 'bg-white/20',
          )}
        >
          <FilterIcon className="h-4 w-4" /> Filter
          {count > 0 && (
            <span className="grid h-5 min-w-[20px] place-items-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
              {count}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="flex w-[360px] flex-col gap-4 bg-popover p-0"
      >
        <div className="flex items-center justify-between px-4 pt-4">
          <h2 className="text-sm font-semibold">Filter</h2>
          {count > 0 && (
            <button
              type="button"
              onClick={() => onChange(emptyFilter)}
              className="text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              Clear all
            </button>
          )}
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-4 pb-2 scrollbar-thin">
          <Section title="Keyword">
            <Input
              placeholder="Enter a keyword..."
              value={filter.keyword}
              onChange={(e) => patch({ keyword: e.target.value })}
              className="h-9"
            />
            <p className="mt-1.5 text-[11px] text-muted-foreground">
              Search cards, members, labels, and more.
            </p>
          </Section>

          <Section title="Members">
            <CheckboxRow
              checked={filter.noMembers}
              onChange={(v) => patch({ noMembers: v })}
              icon={
                <span className="grid h-5 w-5 place-items-center rounded-full bg-muted text-muted-foreground">
                  <UserIcon className="h-3 w-3" />
                </span>
              }
              label="No members"
            />
            <ExpandableRow
              open={selectMembersOpen}
              onToggle={() => setSelectMembersOpen((v) => !v)}
              checked={filter.memberIds.length > 0}
              onClear={() => patch({ memberIds: [] })}
              label={
                filter.memberIds.length > 0
                  ? `${filter.memberIds.length} selected`
                  : 'Select members'
              }
            >
              {members.length === 0 ? (
                <div className="px-2 py-1.5 text-xs text-muted-foreground">
                  No members on this board
                </div>
              ) : (
                members.map((m) => (
                  <MemberRow
                    key={m._id}
                    member={m}
                    checked={filter.memberIds.includes(m._id)}
                    onChange={(v) =>
                      patch({
                        memberIds: v
                          ? [...filter.memberIds, m._id]
                          : filter.memberIds.filter((id) => id !== m._id),
                      })
                    }
                  />
                ))
              )}
            </ExpandableRow>
          </Section>

          <Section title="Card status">
            <CheckboxRow
              checked={filter.status.includes('complete')}
              onChange={() => patch({ status: toggleArray(filter.status, 'complete') })}
              label="Marked as complete"
            />
            <CheckboxRow
              checked={filter.status.includes('incomplete')}
              onChange={() =>
                patch({ status: toggleArray(filter.status, 'incomplete') })
              }
              label="Not marked as complete"
            />
          </Section>

          <Section title="Due date">
            <CheckboxRow
              checked={filter.due.includes('no-date')}
              onChange={() => patch({ due: toggleArray(filter.due, 'no-date') })}
              icon={<DueIcon variant="no-date" />}
              label="No dates"
            />
            <CheckboxRow
              checked={filter.due.includes('overdue')}
              onChange={() => patch({ due: toggleArray(filter.due, 'overdue') })}
              icon={<DueIcon variant="overdue" />}
              label="Overdue"
            />
            <CheckboxRow
              checked={filter.due.includes('next-day')}
              onChange={() => patch({ due: toggleArray(filter.due, 'next-day') })}
              icon={<DueIcon variant="next-day" />}
              label="Due in the next day"
            />
            <CheckboxRow
              checked={filter.due.includes('next-week')}
              onChange={() => patch({ due: toggleArray(filter.due, 'next-week') })}
              icon={<DueIcon variant="next-week" />}
              label="Due in the next week"
            />
            <CheckboxRow
              checked={filter.due.includes('next-month')}
              onChange={() => patch({ due: toggleArray(filter.due, 'next-month') })}
              icon={<DueIcon variant="next-month" />}
              label="Due in the next month"
            />
          </Section>

          <Section title="Labels">
            <CheckboxRow
              checked={filter.noLabels}
              onChange={(v) => patch({ noLabels: v })}
              icon={
                <span className="grid h-5 w-5 place-items-center rounded-full bg-muted text-muted-foreground">
                  <Tag className="h-3 w-3" />
                </span>
              }
              label="No labels"
            />
            {visibleLabelChips.map((label) => (
              <LabelRow
                key={label._id}
                label={label}
                checked={filter.labelIds.includes(label._id)}
                onChange={(v) =>
                  patch({
                    labelIds: v
                      ? [...filter.labelIds, label._id]
                      : filter.labelIds.filter((id) => id !== label._id),
                  })
                }
              />
            ))}
            {hasMoreLabels && (
              <ExpandableRow
                open={selectLabelsOpen}
                onToggle={() => setSelectLabelsOpen((v) => !v)}
                checked={filter.labelIds.length > 0}
                onClear={() => patch({ labelIds: [] })}
                label={
                  filter.labelIds.length > 0
                    ? `${filter.labelIds.length} selected`
                    : 'Select labels'
                }
              >
                {labels.slice(visibleLabelChips.length).map((label) => (
                  <LabelRow
                    key={label._id}
                    label={label}
                    checked={filter.labelIds.includes(label._id)}
                    onChange={(v) =>
                      patch({
                        labelIds: v
                          ? [...filter.labelIds, label._id]
                          : filter.labelIds.filter((id) => id !== label._id),
                      })
                    }
                  />
                ))}
              </ExpandableRow>
            )}
          </Section>

          <Section title="Activity">
            <CheckboxRow
              checked={filter.activity.includes('last-week')}
              onChange={() =>
                patch({ activity: toggleArray(filter.activity, 'last-week') })
              }
              label="Active in the last week"
            />
            <CheckboxRow
              checked={filter.activity.includes('last-two-weeks')}
              onChange={() =>
                patch({ activity: toggleArray(filter.activity, 'last-two-weeks') })
              }
              label="Active in the last two weeks"
            />
            <CheckboxRow
              checked={filter.activity.includes('last-four-weeks')}
              onChange={() =>
                patch({ activity: toggleArray(filter.activity, 'last-four-weeks') })
              }
              label="Active in the last four weeks"
            />
            <CheckboxRow
              checked={filter.activity.includes('no-activity-four-weeks')}
              onChange={() =>
                patch({
                  activity: toggleArray(filter.activity, 'no-activity-four-weeks'),
                })
              }
              label="Without activity in the last four weeks"
            />
          </Section>
        </div>

        <div className="border-t px-4 py-2.5">
          <button
            type="button"
            onClick={() => setMatchOpen((v) => !v)}
            className="flex w-full items-center justify-between text-sm font-medium text-foreground/90 hover:text-foreground"
          >
            <span>{filter.match === 'all' ? 'All match' : 'Any match'}</span>
            <ChevronDown
              className={cn('h-4 w-4 transition-transform', matchOpen && 'rotate-180')}
            />
          </button>
          {matchOpen && (
            <div className="mt-2 flex flex-col gap-1">
              <MatchOption
                active={filter.match === 'any'}
                onClick={() => {
                  patch({ match: 'any' });
                  setMatchOpen(false);
                }}
                label="Any match"
                hint="Cards that match any selected filter"
              />
              <MatchOption
                active={filter.match === 'all'}
                onClick={() => {
                  patch({ match: 'all' });
                  setMatchOpen(false);
                }}
                label="All match"
                hint="Cards that match every selected filter"
              />
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-3 first:mt-1">
      <h3 className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h3>
      <div className="flex flex-col">{children}</div>
    </div>
  );
}

function CheckboxRow({
  checked,
  onChange,
  icon,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  icon?: React.ReactNode;
  label: React.ReactNode;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 rounded-md px-1 py-1.5 hover:bg-muted/60">
      <span
        className={cn(
          'grid h-4 w-4 shrink-0 place-items-center rounded border transition-colors',
          checked
            ? 'border-primary bg-primary text-primary-foreground'
            : 'border-border bg-background',
        )}
      >
        {checked && <Check className="h-3 w-3" />}
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only"
      />
      {icon}
      <span className="text-sm">{label}</span>
    </label>
  );
}

function ExpandableRow({
  open,
  onToggle,
  checked,
  onClear,
  label,
  children,
}: {
  open: boolean;
  onToggle: () => void;
  checked: boolean;
  onClear: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-md">
      <div className="flex items-center gap-2.5 rounded-md px-1 py-1.5 hover:bg-muted/60">
        <button
          type="button"
          aria-label={checked ? 'Clear' : label}
          onClick={() => (checked ? onClear() : onToggle())}
          className={cn(
            'grid h-4 w-4 shrink-0 place-items-center rounded border transition-colors',
            checked
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-border bg-background',
          )}
        >
          {checked && <Check className="h-3 w-3" />}
        </button>
        <button
          type="button"
          onClick={onToggle}
          className="flex flex-1 items-center justify-between text-left"
        >
          <span className="text-sm text-muted-foreground">{label}</span>
          <ChevronDown
            className={cn('h-4 w-4 text-muted-foreground transition-transform', open && 'rotate-180')}
          />
        </button>
      </div>
      {open && <div className="ml-7 mr-1 flex flex-col gap-0.5">{children}</div>}
    </div>
  );
}

function MemberRow({
  member,
  checked,
  onChange,
}: {
  member: BoardMemberProfile;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <CheckboxRow
      checked={checked}
      onChange={onChange}
      icon={
        <span className="grid h-5 w-5 place-items-center rounded-full bg-primary/15 text-[10px] font-semibold text-primary">
          {getInitials(member.fullName)}
        </span>
      }
      label={member.fullName}
    />
  );
}

function LabelRow({
  label,
  checked,
  onChange,
}: {
  label: Label;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 rounded-md px-1 py-1.5 hover:bg-muted/60">
      <span
        className={cn(
          'grid h-4 w-4 shrink-0 place-items-center rounded border transition-colors',
          checked
            ? 'border-primary bg-primary text-primary-foreground'
            : 'border-border bg-background',
        )}
      >
        {checked && <Check className="h-3 w-3" />}
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only"
      />
      <span
        className="flex h-6 flex-1 items-center truncate rounded-md px-2 text-[11px] font-semibold text-white shadow-sm"
        style={{ backgroundColor: label.color }}
        title={label.name}
      >
        {label.name || ''}
      </span>
    </label>
  );
}

function DueIcon({ variant }: { variant: DueFilter }) {
  if (variant === 'no-date') {
    return (
      <span className="grid h-5 w-5 place-items-center rounded-full bg-muted text-muted-foreground">
        <CalendarIcon className="h-3 w-3" />
      </span>
    );
  }
  if (variant === 'overdue') {
    return (
      <span className="grid h-5 w-5 place-items-center rounded-full bg-rose-500 text-white">
        <Clock className="h-3 w-3" />
      </span>
    );
  }
  if (variant === 'next-day') {
    return (
      <span className="grid h-5 w-5 place-items-center rounded-full bg-amber-400 text-amber-950">
        <Clock className="h-3 w-3" />
      </span>
    );
  }
  return (
    <span className="grid h-5 w-5 place-items-center rounded-full bg-muted text-muted-foreground">
      <Clock className="h-3 w-3" />
    </span>
  );
}

function MatchOption({
  active,
  onClick,
  label,
  hint,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  hint: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex flex-col items-start rounded-md px-2 py-1.5 text-left text-sm transition-colors',
        active ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-muted',
      )}
    >
      <span className="font-medium">{label}</span>
      <span className={cn('text-[11px]', active ? 'text-primary/80' : 'text-muted-foreground')}>
        {hint}
      </span>
    </button>
  );
}
