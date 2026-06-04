'use client';
import { useEffect, useState } from 'react';
import { Check, Monitor, Moon, Palette, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useUpdateProfile } from '@/hooks/use-profile';
import { cn } from '@/lib/utils';
import { SectionCard } from './ui';

const THEMES = [
  { id: 'light', icon: Sun, label: 'Light', desc: 'Use light theme' },
  { id: 'dark', icon: Moon, label: 'Dark', desc: 'Use dark theme' },
  { id: 'system', icon: Monitor, label: 'System', desc: 'Use system theme' },
] as const;

export function AppearanceSection() {
  const { theme, setTheme } = useTheme();
  const update = useUpdateProfile();
  const [mounted, setMounted] = useState(false);
  // next-themes only knows the resolved value after mount; guard against an SSR
  // hydration mismatch by not marking any card active until then.
  useEffect(() => setMounted(true), []);
  const current = mounted ? theme : undefined;

  function choose(id: 'light' | 'dark' | 'system') {
    setTheme(id);
    // Best-effort: persist to the account so the choice follows the user across
    // devices. We don't surface failures here — next-themes already applied it.
    update.mutate({ preferences: { theme: id } });
  }

  return (
    <SectionCard
      id="appearance"
      icon={Palette}
      title="Appearance"
      description="Customize the look and feel of IndiHive."
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {THEMES.map(({ id, icon: Icon, label, desc }) => {
          const active = current === id;
          return (
            <button
              key={id}
              type="button"
              aria-pressed={active}
              onClick={() => choose(id)}
              className={cn(
                'relative flex flex-col items-center gap-2 rounded-xl border p-4 text-center outline-none transition-all duration-150 focus-visible:ring-2 focus-visible:ring-ring/40',
                active
                  ? 'border-primary/60 bg-primary/10 shadow-glow-sm'
                  : 'border-border/60 hover:border-border hover:bg-muted/60',
              )}
            >
              {active && (
                <span className="absolute right-2 top-2 grid h-5 w-5 place-items-center rounded-full bg-primary text-primary-foreground">
                  <Check className="h-3 w-3" />
                </span>
              )}
              <Icon className={cn('h-5 w-5', active ? 'text-primary' : 'text-muted-foreground')} />
              <span className={cn('text-sm font-semibold', active ? 'text-primary' : 'text-foreground')}>
                {label}
              </span>
              <span className="text-xs text-muted-foreground">{desc}</span>
            </button>
          );
        })}
      </div>
    </SectionCard>
  );
}
