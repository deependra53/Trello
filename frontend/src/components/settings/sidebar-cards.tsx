'use client';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  CalendarDays,
  ExternalLink,
  HelpCircle,
  Layers,
  LayoutGrid,
  LogOut,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth';
import type { Workspace } from '@/types/api';
import { StatRow } from './ui';

const ROLE_LABEL: Record<string, string> = {
  owner: 'Workspace owner',
  admin: 'Workspace admin',
  member: 'Workspace member',
  guest: 'Workspace guest',
};

function formatDate(iso?: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function WorkspaceSummary({
  workspace,
  role,
  memberCount,
  boardCount,
  templateCount,
  onManage,
}: {
  workspace: Workspace;
  role: string;
  memberCount?: number;
  boardCount?: number;
  templateCount?: number;
  onManage: () => void;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl brand-gradient text-base font-bold text-primary-foreground shadow-glow-sm">
          {workspace.name[0]?.toUpperCase() ?? 'W'}
        </div>
        <div className="min-w-0">
          <div className="truncate font-semibold">{workspace.name}</div>
          <div className="truncate text-xs text-muted-foreground">
            {ROLE_LABEL[role] ?? 'Workspace member'}
          </div>
        </div>
      </div>

      <div className="mt-3 divide-y divide-border/60">
        <StatRow icon={Users} label="Members" value={memberCount ?? '—'} />
        <StatRow icon={LayoutGrid} label="Boards" value={boardCount ?? '—'} />
        <StatRow icon={Layers} label="Templates" value={templateCount ?? '—'} />
        <StatRow icon={CalendarDays} label="Created" value={formatDate(workspace.createdAt)} />
      </div>

      <Button variant="outline" className="mt-3 w-full justify-center" onClick={onManage}>
        Manage workspace <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

export function AccountCard() {
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
      <h3 className="text-sm font-semibold">Account</h3>
      <p className="mt-0.5 text-xs text-muted-foreground">Manage your account settings.</p>
      <Button
        variant="outline"
        className="mt-3 w-full justify-center border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
        onClick={async () => {
          await logout();
          router.push('/login');
        }}
      >
        <LogOut className="h-4 w-4" /> Sign out
      </Button>
    </div>
  );
}

export function HelpCard() {
  return (
    <div className="rounded-2xl border border-border/60 bg-muted/30 p-4">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <HelpCircle className="h-4 w-4 text-primary" /> Need help?
      </div>
      <p className="mt-1.5 text-xs text-muted-foreground">
        Visit our help center or contact support.
      </p>
      <button
        type="button"
        onClick={() => toast.info('Help center is coming soon.')}
        className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
      >
        Go to help center <ExternalLink className="h-3 w-3" />
      </button>
    </div>
  );
}
