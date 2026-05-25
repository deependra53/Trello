'use client';
import { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { MapPin } from 'lucide-react';
import type { BoardFull, Card } from '@/types/api';

// Leaflet needs `window` — render only on the client.
const LeafletMap = dynamic(() => import('./map-leaflet').then((m) => m.LeafletMap), {
  ssr: false,
  loading: () => (
    <div className="grid h-full place-items-center text-sm text-muted-foreground">
      Loading map…
    </div>
  ),
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
        <div className="grid place-items-center rounded-2xl border-2 border-dashed border-white/40 bg-white/95 p-12 text-center shadow-soft">
          <div className="grid h-14 w-14 place-items-center rounded-2xl brand-gradient text-white shadow-glow">
            <MapPin className="h-7 w-7" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">No locations yet</h3>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Cards with a <code className="rounded bg-muted px-1">location</code> field
            (lat / lng) appear here as pins on the map.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full p-4">
      <div className="h-full overflow-hidden rounded-xl bg-white/95 shadow-soft">
        <LeafletMap cards={cardsWithLocation} onOpenCard={onOpenCard} />
      </div>
    </div>
  );
}
