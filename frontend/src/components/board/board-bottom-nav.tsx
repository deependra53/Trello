'use client';
import { Layers } from 'lucide-react';

interface Props {
  onSwitchBoards: () => void;
}

export function BoardBottomNav({ onSwitchBoards }: Props) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-30 flex justify-center px-4">
      <nav className="pointer-events-auto flex items-center rounded-2xl border border-white/15 bg-black/75 p-1.5 shadow-lg">
        <button
          type="button"
          onClick={onSwitchBoards}
          className="flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium text-white/90 transition-colors hover:bg-white/10 hover:text-white"
        >
          <Layers className="h-4 w-4" />
          <span>Switch boards</span>
        </button>
      </nav>
    </div>
  );
}
