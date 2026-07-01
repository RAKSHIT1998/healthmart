'use client';

import 'leaflet/dist/leaflet.css';
import { MapContainer, Marker, TileLayer } from 'react-leaflet';
import L from 'leaflet';

const pinIcon = L.divIcon({
  html: '<div style="font-size: 26px; transform: translate(-50%, -100%);">📍</div>',
  className: '',
  iconSize: [0, 0],
});

interface DestinationMapProps {
  lat: number;
  lng: number;
}

/** Static preview of where a delivery needs to go — the driver taps "Navigate" for actual
 * turn-by-turn directions; this is just a quick visual sanity check before they leave. */
export function DestinationMap({ lat, lng }: DestinationMapProps) {
  return (
    <div className="h-36 w-full overflow-hidden rounded-lg border border-border/60">
      <MapContainer center={[lat, lng]} zoom={15} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false} dragging={false} zoomControl={false}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[lat, lng]} icon={pinIcon} />
      </MapContainer>
    </div>
  );
}
