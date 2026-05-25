'use client';
import { useTheme } from 'next-themes';
import { LogOut, Monitor, Moon, Sun } from 'lucide-react';
import { useAuthStore } from '@/stores/auth';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useWorkspaces } from '@/hooks/use-boards';
import { cn, getInitials } from '@/lib/utils';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { theme, setTheme } = useTheme();
  const { data: workspaces } = useWorkspaces();

  return (
    <main className="container max-w-3xl py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your profile, appearance, and workspaces.
        </p>
      </div>

      <Section title="Profile">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 ring-2 ring-primary/20">
            <AvatarFallback className="bg-primary/10 text-lg font-bold text-primary">
              {getInitials(user?.fullName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-3">
            <div className="space-y-1">
              <Label>Full name</Label>
              <Input value={user?.fullName ?? ''} readOnly />
            </div>
            <div className="space-y-1">
              <Label>Email</Label>
              <Input value={user?.email ?? ''} readOnly />
            </div>
          </div>
        </div>
      </Section>

      <Section title="Appearance">
        <div className="flex gap-2">
          {[
            { id: 'light', icon: Sun, label: 'Light' },
            { id: 'dark', icon: Moon, label: 'Dark' },
            { id: 'system', icon: Monitor, label: 'System' },
          ].map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTheme(id)}
              className={cn(
                'flex flex-1 flex-col items-center gap-2 rounded-lg border p-4 transition',
                theme === id
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'hover:bg-muted',
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-sm font-medium">{label}</span>
            </button>
          ))}
        </div>
      </Section>

      <Section title="Notifications">
        <div className="space-y-3">
          {[
            { k: 'email', label: 'Email digest' },
            { k: 'mentions', label: 'Mentions' },
            { k: 'cardActivity', label: 'Card activity on cards you watch' },
            { k: 'dueReminders', label: 'Due-date reminders' },
          ].map((p) => (
            <label
              key={p.k}
              className="flex items-center justify-between rounded-md border bg-card/60 px-3 py-2 text-sm"
            >
              <span>{p.label}</span>
              <input type="checkbox" defaultChecked className="h-4 w-4 accent-primary" />
            </label>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Saving preferences will be wired to the backend in a follow-up.
        </p>
      </Section>

      <Section title="Workspaces">
        {workspaces?.length === 0 ? (
          <p className="text-sm text-muted-foreground">No workspaces yet.</p>
        ) : (
          <ul className="divide-y">
            {workspaces?.map((ws) => (
              <li key={ws._id} className="flex items-center gap-3 py-2.5">
                <div className="grid h-8 w-8 place-items-center rounded-md brand-gradient text-xs font-bold text-white">
                  {ws.name[0]?.toUpperCase()}
                </div>
                <span className="flex-1 text-sm font-medium">{ws.name}</span>
                <span className="text-xs text-muted-foreground">
                  {String(ws.ownerId) === String(user?._id ?? user?.id) ? 'Owner' : 'Member'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Account">
        <Button
          variant="outline"
          onClick={async () => {
            await logout();
            router.push('/login');
          }}
        >
          <LogOut className="mr-2 h-4 w-4" /> Sign out
        </Button>
      </Section>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border bg-card p-6 shadow-soft">
      <h2 className="mb-4 text-base font-semibold">{title}</h2>
      {children}
    </section>
  );
}
