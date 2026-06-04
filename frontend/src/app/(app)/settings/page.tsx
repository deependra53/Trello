'use client';
import { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '@/stores/auth';
import { useOrgMembers } from '@/hooks/use-chat';
import { useTemplates } from '@/hooks/use-templates';
import { useWorkspaces, useWorkspaceBoards } from '@/hooks/use-boards';
import { cn } from '@/lib/utils';
import { SETTINGS_NAV } from '@/components/settings/settings-nav';
import { useScrollSpy } from '@/components/settings/use-scrollspy';
import { ProfileSection } from '@/components/settings/profile-section';
import { AppearanceSection } from '@/components/settings/appearance-section';
import { NotificationsSection } from '@/components/settings/notifications-section';
import { WorkspaceSection } from '@/components/settings/workspace-section';
import { MembersSection } from '@/components/settings/members-section';
import { SecuritySection } from '@/components/settings/security-section';
import { IntegrationsSection } from '@/components/settings/integrations-section';
import { BillingSection } from '@/components/settings/billing-section';
import { AdvancedSection } from '@/components/settings/advanced-section';
import {
  AccountCard,
  HelpCard,
  WorkspaceSummary,
} from '@/components/settings/sidebar-cards';

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export default function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const currentUserId = user?._id ?? user?.id ?? '';

  const { data: workspaces } = useWorkspaces();
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);
  const activeWorkspace =
    workspaces?.find((w) => w._id === activeWorkspaceId) ?? workspaces?.[0];

  const role = activeWorkspace
    ? String(activeWorkspace.ownerId) === currentUserId
      ? 'owner'
      : activeWorkspace.members?.find((m) => String(m.userId) === currentUserId)?.role ?? 'member'
    : 'member';
  const canManage = role === 'owner' || role === 'admin';
  const isOwner = role === 'owner';

  const { data: members } = useOrgMembers(activeWorkspace?._id);
  const { data: wsBoards } = useWorkspaceBoards(activeWorkspace?._id);
  const { data: templates } = useTemplates();

  const navItems = SETTINGS_NAV.filter((i) => !i.requiresWorkspace || !!activeWorkspace);
  const active = useScrollSpy(navItems.map((i) => i.id));

  // On the mobile horizontal nav strip, keep the active chip scrolled into view
  // as the user scrolls content. No-op on the desktop column (no h-overflow).
  const navRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const container = navRef.current;
    if (!container || container.scrollWidth <= container.clientWidth) return;
    const btn = container.querySelector<HTMLElement>(`[data-section="${active}"]`);
    btn?.scrollIntoView({ inline: 'center', block: 'nearest' });
  }, [active]);

  return (
    <div className="mx-auto max-w-[100rem] px-4 py-8 animate-fade-up sm:px-6 lg:px-10">
      <header>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Settings</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Manage your profile, preferences, and workspace settings.
        </p>
      </header>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[220px_minmax(0,1fr)_320px]">
        {/* Left: section nav (scrollspy) + help */}
        <nav className="lg:sticky lg:top-6 lg:self-start">
          <div
            ref={navRef}
            className="flex gap-1 overflow-x-auto rounded-2xl border border-border/60 bg-card p-2 shadow-sm scrollbar-thin lg:flex-col lg:overflow-visible"
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              const on = active === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  data-section={item.id}
                  aria-current={on ? 'true' : undefined}
                  onClick={() => scrollToSection(item.id)}
                  className={cn(
                    'flex items-center gap-2.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/40',
                    on
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </button>
              );
            })}
          </div>
          <div className="mt-4 hidden lg:block">
            <HelpCard />
          </div>
        </nav>

        {/* Center: stacked section panels */}
        <div className="min-w-0 space-y-6">
          <ProfileSection />
          <AppearanceSection />
          <NotificationsSection />
          {activeWorkspace && (
            <WorkspaceSection workspace={activeWorkspace} canManage={canManage} />
          )}
          {activeWorkspace && (
            <MembersSection workspace={activeWorkspace} currentUserId={currentUserId} />
          )}
          <SecuritySection />
          <IntegrationsSection />
          {activeWorkspace && <BillingSection workspace={activeWorkspace} />}
          {activeWorkspace && <AdvancedSection workspace={activeWorkspace} isOwner={isOwner} />}
        </div>

        {/* Right: workspace summary + account */}
        <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          {workspaces && workspaces.length > 1 && (
            <div className="rounded-2xl border border-border/60 bg-card p-3 shadow-sm">
              <label
                htmlFor="ws-switcher"
                className="mb-1.5 block text-xs font-medium text-muted-foreground"
              >
                Workspace
              </label>
              <select
                id="ws-switcher"
                value={activeWorkspace?._id ?? ''}
                onChange={(e) => setActiveWorkspaceId(e.target.value)}
                className="h-9 w-full rounded-lg border border-border/60 bg-background px-2 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/40"
              >
                {workspaces.map((ws) => (
                  <option key={ws._id} value={ws._id}>
                    {ws.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          {activeWorkspace && (
            <WorkspaceSummary
              workspace={activeWorkspace}
              role={role}
              memberCount={members?.length}
              boardCount={wsBoards?.length}
              templateCount={templates?.length}
              onManage={() => scrollToSection('workspace')}
            />
          )}
          <AccountCard />
          <div className="lg:hidden">
            <HelpCard />
          </div>
        </aside>
      </div>
    </div>
  );
}
