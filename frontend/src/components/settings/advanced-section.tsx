'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Download, Loader2, SlidersHorizontal, Trash2, TriangleAlert } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useDeleteWorkspace } from '@/hooks/use-boards';
import { ApiError } from '@/lib/api';
import type { Workspace } from '@/types/api';
import { SectionCard } from './ui';

export function AdvancedSection({
  workspace,
  isOwner,
}: {
  workspace: Workspace;
  isOwner: boolean;
}) {
  const router = useRouter();
  const del = useDeleteWorkspace();
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  async function remove() {
    try {
      await del.mutateAsync(workspace._id);
      toast.success('Workspace deleted');
      setOpen(false);
      router.push('/boards');
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Could not delete workspace');
    }
  }

  return (
    <SectionCard
      id="advanced"
      icon={SlidersHorizontal}
      title="Advanced"
      description="Data export and irreversible actions."
    >
      <div className="flex flex-col gap-3 rounded-xl border border-border/60 bg-muted/30 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <div className="text-sm font-medium">Export workspace data</div>
          <div className="text-xs text-muted-foreground">
            Download all boards, cards, and members as JSON.
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="shrink-0"
          onClick={() => toast.info('Data export is coming soon.')}
        >
          <Download className="h-4 w-4" /> Export
        </Button>
      </div>

      {isOwner && (
        <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-destructive">
            <TriangleAlert className="h-4 w-4" /> Danger zone
          </div>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="text-sm font-medium">Delete this workspace</div>
              <div className="text-xs text-muted-foreground">
                Permanently deletes the workspace and closes all of its boards. This cannot be
                undone.
              </div>
            </div>
            <Button
              variant="destructive"
              size="sm"
              className="shrink-0"
              onClick={() => {
                setConfirmText('');
                setOpen(true);
              }}
            >
              <Trash2 className="h-4 w-4" /> Delete workspace
            </Button>
          </div>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete {workspace.name}?</DialogTitle>
            <DialogDescription>
              This permanently deletes the workspace and closes all of its boards. Type{' '}
              <span className="font-semibold text-foreground">{workspace.name}</span> to confirm.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={workspace.name}
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={remove}
              disabled={confirmText.trim() !== workspace.name || del.isPending}
            >
              {del.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Delete forever
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SectionCard>
  );
}
