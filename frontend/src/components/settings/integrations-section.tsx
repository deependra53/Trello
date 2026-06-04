'use client';
import { Blocks, Calendar, Github, Webhook, type LucideIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { SectionCard } from './ui';

const INTEGRATIONS: { icon: LucideIcon; name: string; desc: string }[] = [
  { icon: Github, name: 'GitHub', desc: 'Link pull requests and issues to cards.' },
  { icon: Calendar, name: 'Google Calendar', desc: 'Sync card due dates to your calendar.' },
  { icon: Webhook, name: 'Webhooks', desc: 'Send board events to any HTTPS endpoint.' },
];

export function IntegrationsSection() {
  return (
    <SectionCard
      id="integrations"
      icon={Blocks}
      title="Integrations"
      description="Connect IndiHive with the tools your team already uses."
    >
      <ul className="space-y-2.5">
        {INTEGRATIONS.map(({ icon: Icon, name, desc }) => (
          <li
            key={name}
            className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/30 px-3.5 py-3"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-background text-muted-foreground shadow-xs">
              <Icon className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium">{name}</div>
              <div className="text-xs text-muted-foreground">{desc}</div>
            </div>
            <Badge variant="secondary" className="shrink-0">
              Coming soon
            </Badge>
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}
