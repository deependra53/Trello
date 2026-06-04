'use client';
import { useState } from 'react';
import { Activity, AtSign, Bell, CalendarClock, Mail, type LucideIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import { useAuthStore } from '@/stores/auth';
import { useUpdateProfile, type NotificationKey } from '@/hooks/use-profile';
import { SectionCard } from './ui';

// These four mirror the reference design. The model also stores a `push` flag,
// but web push isn't implemented, so we intentionally don't surface a dead toggle.
const ROWS: { key: NotificationKey; icon: LucideIcon; title: string; desc: string }[] = [
  { key: 'email', icon: Mail, title: 'Email digest', desc: 'Receive a summary of activity via email' },
  { key: 'mentions', icon: AtSign, title: 'Mentions', desc: 'Get notified when someone mentions you' },
  {
    key: 'cardActivity',
    icon: Activity,
    title: 'Card activity on cards you watch',
    desc: "Updates on activity for cards you're watching",
  },
  {
    key: 'dueReminders',
    icon: CalendarClock,
    title: 'Due-date reminders',
    desc: 'Receive reminders for upcoming due dates',
  },
];

export function NotificationsSection() {
  const user = useAuthStore((s) => s.user);
  const update = useUpdateProfile();
  const prefs = user?.preferences?.notifications ?? {};
  // Optimistic overrides so a toggle flips instantly; rolled back if the save fails.
  const [overrides, setOverrides] = useState<Partial<Record<NotificationKey, boolean>>>({});

  // Each preference defaults to on (matches the User model defaults).
  const valueOf = (k: NotificationKey) => overrides[k] ?? prefs[k] ?? true;

  async function toggle(k: NotificationKey, next: boolean) {
    setOverrides((o) => ({ ...o, [k]: next }));
    try {
      await update.mutateAsync({ preferences: { notifications: { [k]: next } } });
      // Server value is now authoritative — drop the optimistic override so a
      // later sync (re-hydrate, another tab) isn't masked by a stale value.
      setOverrides((o) => {
        const { [k]: _saved, ...rest } = o;
        return rest;
      });
    } catch {
      setOverrides((o) => ({ ...o, [k]: !next }));
      toast.error('Could not save preference');
    }
  }

  return (
    <SectionCard
      id="notifications"
      icon={Bell}
      title="Notifications"
      description="Choose how you want to stay updated."
    >
      <div className="space-y-2.5">
        {ROWS.map(({ key, icon: Icon, title, desc }) => (
          <div
            key={key}
            className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/30 px-3.5 py-3"
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-background text-muted-foreground shadow-xs">
              <Icon className="h-[18px] w-[18px]" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium">{title}</div>
              <div className="text-xs text-muted-foreground">{desc}</div>
            </div>
            <Switch
              checked={valueOf(key)}
              onCheckedChange={(v) => toggle(key, v)}
              aria-label={title}
            />
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
