'use client';

import { useEffect, useRef, useState } from 'react';
import { Box, CircularProgress, Typography, Chip, Button } from '@mui/material';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  LayersControl
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

function createPriceMarker(price: number, isSelected: boolean, isVerified: boolean = false): L.DivIcon {
  const formatted = price >= 1000000 
    ? `${(price / 1000000).toFixed(1)}M` 
    : price >= 1000 
    ? `${Math.round(price / 1000)}k` 
    : `${price}`;

  const bgColor = isSelected ? '#ff385c' : '#0f172a';
  const borderColor = isVerified ? '#00ffff' : isSelected ? '#ff385c' : '#334155';

  return L.divIcon({
    className: 'custom-price-marker',
    html: `<div style="
      background-color: ${bgColor};
      color: white;
      font-weight: 800;
      font-size: 11px;
      font-family: system-ui, sans-serif;
      padding: 4px 8px;
      border-radius: 12px;
      border: 2px solid ${borderColor};
      box-shadow: 0 4px 12px rgba(0,0,0,0.35);
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 3px;
      white-space: nowrap;
      transform: translate(-50%, -50%);
    ">
      ${isVerified ? '<span style="color:#00ffff;font-size:10px;">★</span>' : ''}
      <span>ETB ${formatted}</span>
    </div>`,
    iconSize: [60, 24],
    iconAnchor: [30, 12],
    popupAnchor: [0, -14],
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
      <Box sx={{ height: '100%', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#0f172a' }}>
        <CircularProgress sx={{ color: '#00ffff' }} />
      </Box>
    );
  }

  const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3001/api';

  return (
    <MapContainer
      key="houses-map"
      center={center}
      zoom={zoom}
      style={{ height: '100%', width: '100%', position: 'absolute', top: 0, left: 0, zIndex: 1 }}
      zoomControl
      scrollWheelZoom
    >
      <LayersControl position="topright">
        <LayersControl.BaseLayer checked name="OpenStreetMap Standard">
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
        </LayersControl.BaseLayer>

        <LayersControl.BaseLayer name="Satellite Imagery">
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            attribution='&copy; Esri &mdash; Earthstar Geographics'
          />
        </LayersControl.BaseLayer>
      </LayersControl>

      {houses.map((house) => {
        const lat = house.location?.coordinates?.lat;
        const lng = house.location?.coordinates?.lng;
        if (typeof lat !== 'number' || typeof lng !== 'number') return null;

        const isSelected = selectedHouse?._id === house._id;
        const icon = createPriceMarker(house.pricing.price, isSelected, house.isVerified);

        return (
          <Marker
            key={house._id}
            position={[lat, lng]}
            icon={icon}
            eventHandlers={{ click: () => onSelectHouse(house) }}
          >
            <Popup>
              <div style={{ minWidth: 220, padding: 2, fontFamily: 'system-ui, sans-serif' }}>
                <img
                  src={`${serverUrl}/public/houses/${house._id}/image`}
                  alt={house.title}
                  style={{
                    width: '100%',
                    height: 110,
                    objectFit: 'cover',
                    borderRadius: 6,
                    marginBottom: 6
                  }}
                  onError={(e: any) => {
                    e.target.src = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=300&q=80';
                  }}
                />

                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                  <span style={{
                    fontSize: 10,
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: 4,
                    backgroundColor: house.transactionType === 'BUY' ? '#10b981' : '#06b6d4',
                    color: 'white'
                  }}>
                    {house.transactionType || 'RENT'}
                  </span>
                  {house.isVerified && (
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#0284c7' }}>
                      ✓ Verified
                    </span>
                  )}
                </div>

                <div style={{ fontWeight: 'bold', fontSize: 13, marginBottom: 4, lineHeight: 1.3 }}>
                  {house.title.length > 35 ? `${house.title.substring(0, 35)}...` : house.title}
                </div>

                <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>
                  {house.location.neighborhood ? `${house.location.neighborhood}, ` : ''}{house.location.city}
                </div>

                <div style={{ fontSize: 16, fontWeight: '800', color: '#06b6d4', marginBottom: 8 }}>
                  {formatPrice(house.pricing.price)}
                </div>

                <div style={{ display: 'flex', gap: 6 }}>
                  <a
                    href={`/public/houses/${house._id}`}
                    style={{
                      flex: 1,
                      display: 'block',
                      padding: '5px 8px',
                      textAlign: 'center',
                      backgroundColor: '#06b6d4',
                      color: 'white',
                      borderRadius: 4,
                      textDecoration: 'none',
                      fontSize: 12,
                      fontWeight: 600
                    }}
                  >
                    View Details
                  </a>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'block',
                      padding: '5px 8px',
                      textAlign: 'center',
                      border: '1px solid #cbd5e1',
                      color: '#475569',
                      borderRadius: 4,
                      textDecoration: 'none',
                      fontSize: 12
                    }}
                  >
                    Directions
                  </a>
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}

      <MapController center={center} zoom={zoom} onMapMove={onMapMove} />
    </MapContainer>
  );
}