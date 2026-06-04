'use client';
import { Layers } from 'lucide-react';

interface Props {
  onSwitchBoards: () => void;
}

export function BoardBottomNav({ onSwitchBoards }: Props) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-30 flex justify-center px-4 lg:hidden">
      <nav className="pointer-events-auto flex animate-fade-up items-center rounded-2xl border border-white/10 bg-black/80 p-1.5 shadow-xl">
        <button
          type="button"
          onClick={onSwitchBoards}
          className="flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium text-white/90 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-0"
        >
          <Layers className="h-4 w-4" />
          <span>Switch boards</span>
        </button>
      </nav>
    </div>
  );
}
