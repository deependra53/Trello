'use client';
import { useEffect, useState } from 'react';
import { Building2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useUpdateWorkspace } from '@/hooks/use-boards';
import { ApiError } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { Workspace } from '@/types/api';
import { SectionCard, Field } from './ui';

const VISIBILITIES = [
  { id: 'private', label: 'Private', desc: 'Only members can find it' },
  { id: 'public', label: 'Public', desc: 'Anyone can find this workspace' },
] as const;

export function WorkspaceSection({
  workspace,
  canManage,
}: {
  workspace: Workspace;
  canManage: boolean;
}) {
  const update = useUpdateWorkspace();
  const [name, setName] = useState(workspace.name);
  const [description, setDescription] = useState(workspace.description ?? '');
  const [visibility, setVisibility] = useState<'private' | 'public'>(workspace.visibility);

  // Re-sync the form only when the active workspace SWITCHES (id changes). We
  // deliberately don't depend on the individual fields: a background refetch of
  // the same workspace must not wipe edits the user is in the middle of typing.
  useEffect(() => {
    setName(workspace.name);
    setDescription(workspace.description ?? '');
    setVisibility(workspace.visibility);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspace._id]);

  const dirty =
    name.trim() !== workspace.name ||
    description !== (workspace.description ?? '') ||
    visibility !== workspace.visibility;

  async function save() {
    if (!name.trim()) {
      toast.error('Workspace name is required');
      return;
    }
    try {
      await update.mutateAsync({
        workspaceId: workspace._id,
        name: name.trim(),
        description,
        visibility,
      });
      // Reflect the persisted (trimmed) value so the field doesn't keep stray
      // whitespace and the dirty flag settles correctly.
      setName(name.trim());
      toast.success('Workspace updated');
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Could not update workspace');
    }
  }

  return (
    <SectionCard
      id="workspace"
      icon={Building2}
      title="Workspace"
      description="Manage your workspace name, description, and visibility."
      action={
        canManage ? (
          <Button size="sm" onClick={save} disabled={!dirty || update.isPending}>
            {update.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Save
          </Button>
        ) : undefined
      }
    >
      <div className="space-y-4">
        <Field label="Workspace name" htmlFor="ws-name">
          <Input
            id="ws-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={120}
            disabled={!canManage}
          />
        </Field>
        <Field label="Description" htmlFor="ws-desc">
          <Textarea
            id="ws-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={500}
            rows={3}
            disabled={!canManage}
            placeholder="What is this workspace for?"
          />
        </Field>
        <Field label="Visibility">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {VISIBILITIES.map((v) => (
              <button
                key={v.id}
                type="button"
                disabled={!canManage}
                aria-pressed={visibility === v.id}
                onClick={() => setVisibility(v.id)}
                className={cn(
                  'rounded-xl border p-3 text-left text-sm outline-none transition-all focus-visible:ring-2 focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-70',
                  visibility === v.id
                    ? 'border-primary/60 bg-primary/10'
                    : 'border-border/60 hover:bg-muted/60',
                )}
              >
                <div className="font-semibold">{v.label}</div>
                <div className="text-xs text-muted-foreground">{v.desc}</div>
              </button>
            ))}
          </div>
        </Field>
      </div>
      {!canManage && (
        <p className="mt-4 text-xs text-muted-foreground">
          Only workspace owners and admins can change these settings.
        </p>
      )}
    </SectionCard>
  );
}
