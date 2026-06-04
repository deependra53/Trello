'use client';
import { Users } from 'lucide-react';
import type { Workspace } from '@/types/api';
import { OrgMembersSection } from './org-members';
import { SectionCard } from './ui';

export function MembersSection({
  workspace,
  currentUserId,
}: {
  workspace: Workspace;
  currentUserId: string;
}) {
  return (
    <SectionCard
      id="members"
      icon={Users}
      title="Members"
      description="Invite teammates and manage who has access."
    >
      <OrgMembersSection workspace={workspace} currentUserId={currentUserId} />
    </SectionCard>
  );
}
