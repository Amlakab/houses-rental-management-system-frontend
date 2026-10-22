'use client';

import { useEffect, useRef } from 'react';
import { Box, CircularProgress } from '@mui/material';
import { Home } from '@mui/icons-material';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { House, PropertyType } from '@/types/houses';

// Fix default Leaflet marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function createMarkerIcon(_type: PropertyType, isSelected: boolean): L.DivIcon {
  const color = isSelected ? '#ff6b6b' : '#4a90e2';
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      background-color:${color};
      width:32px;height:32px;border-radius:50%;
      display:flex;align-items:center;justify-content:center;
      border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.2);
      cursor:pointer;transition:transform 0.2s;">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
      </svg>
    </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
}

function MapController({
  center,
  zoom,
  onMapMove,
}: {
  center: [number, number];
  zoom: number;
  onMapMove?: (center: [number, number], zoom: number) => void;
}) {
  const map = useMap();
  const skipRef = useRef(false);

  useEffect(() => {
    if (!map) return;
    skipRef.current = true;
    map.setView(center, zoom, { animate: true });
    const t = setTimeout(() => { skipRef.current = false; }, 400);
    return () => clearTimeout(t);
  }, [center[0], center[1], zoom, map]);

  useEffect(() => {
    if (!map) return;
    const handler = () => {
      if (skipRef.current) return;
      const c = map.getCenter();
      onMapMove?.([c.lat, c.lng], map.getZoom());
    };
    map.on('moveend', handler);
    return () => { map.off('moveend', handler); };
  }, [map, onMapMove]);

  return null;
}

interface MapViewProps {
  houses: House[];
  selectedHouse: House | null;
  center: [number, number];
  zoom: number;
  onSelectHouse: (house: House) => void;
  onMapMove?: (center: [number, number], zoom: number) => void;
  formatPrice: (price: number) => string;
  theme: 'dark' | 'light';
  loading?: boolean;
}

export default function MapView({
  houses,
  selectedHouse,
  center,
  zoom,
  onSelectHouse,
  onMapMove,
  formatPrice,
  theme,
  loading = false,
}: MapViewProps) {
  if (loading) {
    return (
      <Box sx={{ height: '100%', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#1a1a2e' }}>
        <CircularProgress sx={{ color: theme === 'dark' ? '#00ffff' : '#007bff' }} />
      </Box>
    );
  }

  return (
    <MapContainer
      key="houses-map"
      center={center}
      zoom={zoom}
      // CRITICAL FIX: Force absolute height and width for Leaflet
      style={{ height: '100%', width: '100%', position: 'absolute', top: 0, left: 0, zIndex: 1 }}
      zoomControl
      scrollWheelZoom
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        // CRITICAL FIX: Ensure tiles are visible
        zIndex={1} 
      />

      {houses.map((house) => {
        const lat = house.location?.coordinates?.lat;
        const lng = house.location?.coordinates?.lng;
        if (typeof lat !== 'number' || typeof lng !== 'number') return null;

        const icon = createMarkerIcon(house.propertyType, selectedHouse?._id === house._id);

        return (
          <Marker
            key={house._id}
            position={[lat, lng]}
            icon={icon}
            eventHandlers={{ click: () => onSelectHouse(house) }}
          >
            <Popup>
              <div style={{ minWidth: 200, padding: 4 }}>
                <div style={{ fontWeight: 'bold', marginBottom: 4 }}>
                  {house.title.length > 30 ? `${house.title.substring(0, 30)}...` : house.title}
                </div>
                <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>
                  {house.location.city}, {house.location.state}
                </div>
                <div style={{ fontSize: 18, fontWeight: 'bold', color: theme === 'dark' ? '#00ffff' : '#007bff', marginBottom: 8 }}>
                  {formatPrice(house.pricing.price)}
                </div>
                <a href={`/public/houses/${house._id}`} style={{
                  display: 'block', padding: '6px 12px', textAlign: 'center',
                  border: `1px solid ${theme === 'dark' ? '#00ffff' : '#007bff'}`,
                  color: theme === 'dark' ? '#00ffff' : '#007bff',
                  borderRadius: 4, textDecoration: 'none', fontSize: 13,
                }}>
                  View Details
                </a>
              </div>
            </Popup>
          </Marker>
        );
      })}

      <MapController center={center} zoom={zoom} onMapMove={onMapMove} />
    </MapContainer>
  );
}