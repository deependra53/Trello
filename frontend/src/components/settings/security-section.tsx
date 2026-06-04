'use client';
import { useState, type FormEvent } from 'react';
import { KeyRound, Loader2, Shield, ShieldAlert, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/stores/auth';
import { useChangePassword } from '@/hooks/use-profile';
import { ApiError } from '@/lib/api';
import { cn } from '@/lib/utils';
import { SectionCard, Field } from './ui';

export function SecuritySection() {
  const user = useAuthStore((s) => s.user);
  const change = useChangePassword();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');

  const verified = user?.emailVerified;
  const canSubmit =
    current.length > 0 && next.length >= 8 && next === confirm && !change.isPending;

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (next.length < 8) {
      toast.error('New password must be at least 8 characters');
      return;
    }
    if (next !== confirm) {
      toast.error('Passwords do not match');
      return;
    }
    try {
      await change.mutateAsync({ currentPassword: current, newPassword: next });
      toast.success('Password changed');
      setCurrent('');
      setNext('');
      setConfirm('');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not change password');
    }
  }

  return (
    <SectionCard
      id="security"
      icon={Shield}
      title="Security"
      description="Manage your password and account security."
    >
      <div
        className={cn(
          'mb-5 flex items-center gap-3 rounded-xl border px-4 py-3',
          verified
            ? 'border-emerald-500/30 bg-emerald-500/5'
            : 'border-amber-500/30 bg-amber-500/5',
        )}
      >
        {verified ? (
          <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-500" />
        ) : (
          <ShieldAlert className="h-5 w-5 shrink-0 text-amber-500" />
        )}
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium">
            {verified ? 'Email verified' : 'Email not verified'}
          </div>
          <div className="truncate text-xs text-muted-foreground">{user?.email}</div>
        </div>
      </div>

      <form onSubmit={submit} className="space-y-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <KeyRound className="h-4 w-4 text-muted-foreground" /> Change password
        </h3>
        <Field label="Current password" htmlFor="cur-pw">
          <Input
            id="cur-pw"
            type="password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            autoComplete="current-password"
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="New password" htmlFor="new-pw">
            <Input
              id="new-pw"
              type="password"
              value={next}
              onChange={(e) => setNext(e.target.value)}
              autoComplete="new-password"
            />
          </Field>
          <Field label="Confirm new password" htmlFor="cf-pw">
            <Input
              id="cf-pw"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
            />
          </Field>
        </div>
        {next.length > 0 && next.length < 8 && (
          <p className="text-xs text-amber-600 dark:text-amber-400">Use at least 8 characters.</p>
        )}
        {confirm.length > 0 && next !== confirm && (
          <p className="text-xs text-amber-600 dark:text-amber-400">Passwords don&apos;t match.</p>
        )}
        <Button type="submit" disabled={!canSubmit}>
          {change.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Update password
        </Button>
      </form>
    </SectionCard>
  );
}
