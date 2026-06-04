import { BoardSkeleton } from '@/components/board/board-skeleton';

// Rendered instantly by the App Router during navigation to a board, so the
// user gets immediate feedback on click instead of staring at the old page
// for the 2-3s the route segment + data take to load.
export default function Loading() {
  return <BoardSkeleton />;
}
