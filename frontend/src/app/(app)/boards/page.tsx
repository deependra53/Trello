'use client';
import Link from 'next/link';
import { Plus, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWorkspaces, useWorkspaceBoards } from '@/hooks/use-boards';
import { Button } from '@/components/ui/button';
import { CreateBoardDialog } from '@/components/board/create-board-dialog';
import type { Board } from '@/types/api';

function BoardCard({ board }: { board: Board }) {
  const bgStyle =
    board.background?.type === 'gradient'
      ? { backgroundImage: board.background.value }
      : { backgroundColor: board.background?.value ?? '#795DFF' };

  return (
    <Link
      href={`/boards/${board._id}`}
      className="group relative block aspect-[16/9] overflow-hidden rounded-xl shadow-soft transition hover:scale-[1.02] hover:shadow-glow focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
      style={bgStyle}
    >
      <div className="absolute inset-0 bg-gradient-to-tr from-black/40 via-transparent to-transparent" />
      <div className="absolute inset-0 flex flex-col justify-between p-4 text-white">
        <div className="flex items-start justify-between">
          <h3 className="text-base font-semibold drop-shadow-md">{board.title}</h3>
          {board.starredBy?.length > 0 && (
            <Star className="h-4 w-4 fill-yellow-300 text-yellow-300" />
          )}
        </div>
        <div className="flex items-center gap-2 text-xs opacity-80">
          <span>{board.members?.length ?? 0} members</span>
          <span>·</span>
          <span>{board.visibility}</span>
        </div>
      </div>
    </Link>
  );
}

function CreateTile({ workspaceId }: { workspaceId: string }) {
  return (
    <CreateBoardDialog workspaceId={workspaceId}>
      <button
        type="button"
        className={cn(
          'flex aspect-[16/9] flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-muted/30 text-sm font-medium text-muted-foreground transition',
          'hover:border-primary hover:bg-accent/40 hover:text-foreground',
        )}
      >
        <Plus className="h-5 w-5" />
        Create new board
      </button>
    </CreateBoardDialog>
  );
}

function WorkspaceSection({ workspaceId, name }: { workspaceId: string; name: string }) {
  const { data: boards, isLoading } = useWorkspaceBoards(workspaceId);

  return (
    <section className="space-y-4 fade-up">
      <div className="flex items-center gap-3">
        <div className="grid h-8 w-8 place-items-center rounded-lg brand-gradient text-sm font-bold text-primary-foreground shadow-glow">
          {name[0]?.toUpperCase()}
        </div>
        <h2 className="text-lg font-semibold tracking-tight">{name}</h2>
      </div>
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="aspect-[16/9] animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {boards?.map((b) => <BoardCard key={b._id} board={b} />)}
          <CreateTile workspaceId={workspaceId} />
        </div>
      )}
    </section>
  );
}

function EmptyState() {
  return (
    <div className="grid place-items-center rounded-2xl border-2 border-dashed border-border bg-muted/30 px-6 py-20 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-2xl brand-gradient text-white shadow-glow">
        <Plus className="h-8 w-8" />
      </div>
      <h2 className="mt-6 text-xl font-semibold">Create your first board</h2>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        Boards organize your work into lists and cards. A workspace will be created automatically
        for you.
      </p>
      <div className="mt-6">
        <CreateBoardDialog>
          <Button size="lg">
            <Plus className="mr-2 h-4 w-4" /> Create your first board
          </Button>
        </CreateBoardDialog>
      </div>
    </div>
  );
}

export default function BoardsPage() {
  const { data: workspaces, isLoading } = useWorkspaces();

  return (
    <main className="container max-w-7xl py-8 md:py-12">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Your boards</h1>
          <p className="mt-2 text-muted-foreground">
            Pick up where you left off, or start something new.
          </p>
        </div>
        <CreateBoardDialog />
      </div>

      <div className="mt-10 space-y-12">
        {isLoading ? (
          <div className="text-sm text-muted-foreground">Loading workspaces…</div>
        ) : !workspaces || workspaces.length === 0 ? (
          <EmptyState />
        ) : (
          workspaces.map((ws) => (
            <WorkspaceSection key={ws._id} workspaceId={ws._id} name={ws.name} />
          ))
        )}
      </div>
    </main>
  );
}
