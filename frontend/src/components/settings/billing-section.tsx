'use client';
import { Check, CreditCard, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Workspace } from '@/types/api';
import { SectionCard } from './ui';

const PRO_FEATURES = [
  'Unlimited boards & automations',
  'Advanced card analytics',
  'Priority support',
  'Custom workspace branding',
];

export function BillingSection({ workspace }: { workspace: Workspace }) {
  const raw = (workspace.plan ?? 'free').toLowerCase();
  const isPaid = raw !== 'free';
  const plan = raw.charAt(0).toUpperCase() + raw.slice(1);

  return (
    <SectionCard
      id="billing"
      icon={CreditCard}
      title="Billing"
      description="Manage your plan and billing details."
    >
      <div className="flex flex-col gap-4 rounded-xl border border-border/60 bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Current plan</span>
            <Badge variant={isPaid ? 'default' : 'secondary'}>{plan}</Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {isPaid ? 'Thanks for being a Pro member.' : 'Free for your whole team, forever.'}
          </p>
        </div>
        {!isPaid && (
          <Button
            onClick={() => toast.info('Billing is coming soon.')}
            className="brand-gradient text-primary-foreground shadow-glow-sm hover:opacity-95"
          >
            <Sparkles className="h-4 w-4" /> Upgrade to Pro
          </Button>
        )}
      </div>

      <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-primary">
          <Sparkles className="h-4 w-4" /> Pro includes
        </div>
        <ul className="grid gap-2 sm:grid-cols-2">
          {PRO_FEATURES.map((f) => (
            <li key={f} className="flex items-center gap-2 text-sm text-foreground">
              <Check className="h-4 w-4 shrink-0 text-primary" /> {f}
            </li>
          ))}
        </ul>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        Payments aren&apos;t enabled yet — upgrading will be available soon.
      </p>
    </SectionCard>
  );
}
