'use client';

import 'leaflet/dist/leaflet.css';
import { useEffect } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';

const driverIcon = L.divIcon({
  html: '<div style="font-size: 26px; transform: translate(-50%, -100%);">🛵</div>',
  className: '',
  iconSize: [0, 0],
});

const destinationIcon = L.divIcon({
  html: '<div style="font-size: 24px; transform: translate(-50%, -100%);">📍</div>',
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

interface LiveMapProps {
  driver: { lat: number; lng: number } | null;
  destination: { lat: number; lng: number };
}

export function LiveMap({ driver, destination }: LiveMapProps) {
  const center = driver ?? destination;

  return (
    <div className="h-72 w-full overflow-hidden rounded-xl border border-border/60">
      <MapContainer center={[center.lat, center.lng]} zoom={14} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[destination.lat, destination.lng]} icon={destinationIcon}>
          <Popup>Delivery address</Popup>
        </Marker>
        {driver && (
          <Marker position={[driver.lat, driver.lng]} icon={driverIcon}>
            <Popup>Your delivery partner</Popup>
          </Marker>
        )}
        <Recenter lat={center.lat} lng={center.lng} />
      </MapContainer>
    </div>
  );
}
