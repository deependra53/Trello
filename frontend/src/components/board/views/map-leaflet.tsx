'use client';
import { useEffect } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Card } from '@/types/api';

// Fix the default-icon paths Leaflet expects (resolved relative to the bundler).
const DEFAULT_ICON = new L.Icon({
  iconUrl: 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface LocCard extends Card {
  location: { lat: number; lng: number; label?: string };
}

interface Props {
  cards: LocCard[];
  onOpenCard: (cardId: string) => void;
}

function FitBounds({ cards }: { cards: LocCard[] }) {
  const map = useMap();
  useEffect(() => {
    if (cards.length === 0) return;
    const bounds = L.latLngBounds(cards.map((c) => [c.location.lat, c.location.lng]));
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
  }, [cards, map]);
  return null;
}

export function LeafletMap({ cards, onOpenCard }: Props) {
  const first = cards[0]?.location;
  return (
    <MapContainer
      style={{ height: '100%', width: '100%' }}
      center={first ? [first.lat, first.lng] : [0, 0]}
      zoom={3}
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds cards={cards} />
      {cards.map((c) => (
        <Marker key={c._id} position={[c.location.lat, c.location.lng]} icon={DEFAULT_ICON}>
          <Popup>
            <div className="space-y-1">
              <div className="text-sm font-semibold">{c.title}</div>
              {c.location.label && (
                <div className="text-xs text-gray-600">{c.location.label}</div>
              )}
              <button
                className="text-xs font-medium text-purple-600 hover:underline"
                onClick={() => onOpenCard(c._id)}
              >
                Open card →
              </button>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
