'use client';
import { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { MapPin } from 'lucide-react';
import type { BoardFull, Card } from '@/types/api';

// Leaflet needs `window` — render only on the client.
const LeafletMap = dynamic(() => import('./map-leaflet').then((m) => m.LeafletMap), {
  ssr: false,
  loading: () => <div className="skeleton h-full w-full" />,
});

interface Props {
  board: BoardFull;
  onOpenCard: (cardId: string) => void;
}

export function MapView({ board, onOpenCard }: Props) {
  const cardsWithLocation = useMemo(
    () =>
      (board.cards ?? []).filter(
        (c): c is Card & { location: { lat: number; lng: number; label?: string } } =>
          !!c.location?.lat && !!c.location?.lng && !c.archived,
      ),
    [board.cards],
  );

  if (cardsWithLocation.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <div className="grid max-w-md place-items-center rounded-2xl border border-border/60 bg-card p-12 text-center shadow-lg animate-scale-in">
          <div className="grid h-12 w-12 place-items-center rounded-2xl brand-gradient text-white shadow-glow-sm">
            <MapPin className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-sm font-medium">No locations yet</h3>
          <p className="mt-1 max-w-sm text-xs text-muted-foreground">
            Cards with a{' '}
            <code className="rounded bg-muted px-1 py-0.5 text-[11px] font-medium text-foreground">
              location
            </code>{' '}
            field (lat / lng) appear here as pins on the map.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full p-4 pb-24 lg:pb-4">
      <div className="h-full overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
        <LeafletMap cards={cardsWithLocation} onOpenCard={onOpenCard} />
      </div>
    </div>
  );
}
