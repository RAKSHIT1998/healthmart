'use client';

import 'leaflet/dist/leaflet.css';
import { useEffect, useState } from 'react';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Search, LocateFixed } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const pinIcon = L.divIcon({
  html: '<div style="font-size: 28px; transform: translate(-50%, -100%);">📍</div>',
  className: '',
  iconSize: [0, 0],
});

function Recenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng]);
  }, [lat, lng, map]);
  return null;
}

function ClickHandler({ onChange }: { onChange: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onChange(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

interface LocationPickerMapProps {
  lat: number;
  lng: number;
  onChange: (lat: number, lng: number) => void;
}

// Free OpenStreetMap-based picker (Leaflet + Nominatim search) — used instead of Google Maps
// since no GOOGLE_MAPS_API_KEY is configured; matches the live-tracking map's tile source.
export function LocationPickerMap({ lat, lng, onChange }: LocationPickerMapProps) {
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);

  async function handleSearch() {
    if (!query.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`,
      );
      const results = await res.json();
      if (results[0]) onChange(parseFloat(results[0].lat), parseFloat(results[0].lon));
    } finally {
      setSearching(false);
    }
  }

  function useCurrentLocation() {
    navigator.geolocation?.getCurrentPosition((pos) => onChange(pos.coords.latitude, pos.coords.longitude));
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          placeholder="Search for a location..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleSearch();
            }
          }}
        />
        <Button type="button" variant="outline" size="icon" onClick={handleSearch} disabled={searching}>
          <Search className="h-4 w-4" />
        </Button>
        <Button type="button" variant="outline" size="icon" onClick={useCurrentLocation} title="Use my current location">
          <LocateFixed className="h-4 w-4" />
        </Button>
      </div>
      <div className="h-56 w-full overflow-hidden rounded-lg border border-border/60">
        <MapContainer center={[lat, lng]} zoom={15} style={{ height: '100%', width: '100%' }} scrollWheelZoom>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={[lat, lng]} icon={pinIcon} />
          <ClickHandler onChange={onChange} />
          <Recenter lat={lat} lng={lng} />
        </MapContainer>
      </div>
      <p className="text-xs text-muted-foreground">Click the map to drop a pin at the exact location, or search above.</p>
    </div>
  );
}
