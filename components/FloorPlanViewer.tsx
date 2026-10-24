'use client';

import { useState } from 'react';
import { Box, Typography, Paper, Grid, Chip } from '@mui/material';
import { SquareFoot, MeetingRoom, Straighten } from '@mui/icons-material';
import { FloorPlanRoom } from '@/types/houses';

interface FloorPlanViewerProps {
  floorPlanUrl?: string;
  rooms?: FloorPlanRoom[];
  totalArea?: number;
}

export default function FloorPlanViewer({
  floorPlanUrl,
  rooms = [],
  totalArea
}: FloorPlanViewerProps) {
  const [activeRoom, setActiveRoom] = useState<number | null>(null);

  const defaultRooms: FloorPlanRoom[] = rooms.length > 0 ? rooms : [
    { name: 'Living & Dining Room', dimensions: '7.5m x 5.8m', areaSqM: 43.5 },
    { name: 'Master Bedroom', dimensions: '5.0m x 4.2m', areaSqM: 21.0 },
    { name: 'Kitchen & Pantry', dimensions: '4.2m x 3.5m', areaSqM: 14.7 },
    { name: 'Bedroom 2', dimensions: '4.0m x 3.6m', areaSqM: 14.4 },
    { name: 'Balcony / Terrace', dimensions: '5.5m x 2.0m', areaSqM: 11.0 }
  ];

  const calculatedTotalArea = totalArea || defaultRooms.reduce((acc, r) => acc + (r.areaSqM || 0), 0);

  return (
    <Box sx={{ width: '100%', py: 2 }}>
      {/* Header Stat Strip */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ p: 1.2, borderRadius: 2, bgcolor: 'rgba(6, 182, 212, 0.1)', color: '#06b6d4' }}>
            <Straighten />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary', fontSize: 18 }}>
              Architectural Floor Plan & Room Dimensions
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Precision dimension specs & interior layout breakdown
            </Typography>
          </Box>
        </Box>

        <Chip
          icon={<SquareFoot />}
          label={`Total Area: ${calculatedTotalArea.toFixed(1)} m²`}
          sx={{
            bgcolor: 'rgba(6, 182, 212, 0.15)',
            color: '#06b6d4',
            fontWeight: 700,
            fontSize: 14,
            px: 1,
            py: 2.2
          }}
        />
      </Box>

      <Grid container spacing={3}>
        {/* Floor Plan Diagram or Visual Canvas */}
        <Grid item xs={12} md={7}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.paper',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 380,
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {floorPlanUrl ? (
              <Box
                component="img"
                src={floorPlanUrl}
                alt="Floor Plan Schema"
                sx={{
                  maxWidth: '100%',
                  maxHeight: 360,
                  objectFit: 'contain',
                  borderRadius: 2
                }}
              />
            ) : (
              /* Vector Architectural Floor Blueprint Visualization */
              <Box sx={{ width: '100%', height: 320, position: 'relative' }}>
                <svg width="100%" height="100%" viewBox="0 0 500 320" style={{ overflow: 'visible' }}>
                  <defs>
                    <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(100, 116, 139, 0.15)" strokeWidth="0.8" />
                    </pattern>
                  </defs>
                  <rect width="500" height="320" fill="url(#grid)" rx="8" />

                  {/* Outer Wall Boundary */}
                  <rect x="20" y="20" width="460" height="280" fill="none" stroke="#06b6d4" strokeWidth="4" rx="4" />

                  {/* Room 1: Living & Dining */}
                  <rect
                    x="25" y="25" width="260" height="175"
                    fill={activeRoom === 0 ? 'rgba(6, 182, 212, 0.25)' : 'rgba(6, 182, 212, 0.06)'}
                    stroke="#0284c7" strokeWidth="2" strokeDasharray="3 3"
                    style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                    onClick={() => setActiveRoom(0)}
                  />
                  <text x="155" y="105" textAnchor="middle" fill="#0284c7" fontWeight="bold" fontSize="13">Living & Dining Room</text>
                  <text x="155" y="125" textAnchor="middle" fill="#64748b" fontSize="11">7.5m x 5.8m (43.5 m²)</text>

                  {/* Room 2: Master Bed */}
                  <rect
                    x="290" y="25" width="185" height="150"
                    fill={activeRoom === 1 ? 'rgba(168, 85, 247, 0.25)' : 'rgba(168, 85, 247, 0.06)'}
                    stroke="#a855f7" strokeWidth="2"
                    style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                    onClick={() => setActiveRoom(1)}
                  />
                  <text x="382" y="90" textAnchor="middle" fill="#a855f7" fontWeight="bold" fontSize="13">Master Suite</text>
                  <text x="382" y="110" textAnchor="middle" fill="#64748b" fontSize="11">5.0m x 4.2m (21.0 m²)</text>

                  {/* Room 3: Kitchen */}
                  <rect
                    x="25" y="205" width="180" height="90"
                    fill={activeRoom === 2 ? 'rgba(16, 185, 129, 0.25)' : 'rgba(16, 185, 129, 0.06)'}
                    stroke="#10b981" strokeWidth="2"
                    style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                    onClick={() => setActiveRoom(2)}
                  />
                  <text x="115" y="245" textAnchor="middle" fill="#10b981" fontWeight="bold" fontSize="12">Kitchen & Pantry</text>
                  <text x="115" y="265" textAnchor="middle" fill="#64748b" fontSize="10">4.2m x 3.5m (14.7 m²)</text>

                  {/* Room 4: Bedroom 2 */}
                  <rect
                    x="210" y="205" width="160" height="90"
                    fill={activeRoom === 3 ? 'rgba(245, 158, 11, 0.25)' : 'rgba(245, 158, 11, 0.06)'}
                    stroke="#f59e0b" strokeWidth="2"
                    style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                    onClick={() => setActiveRoom(3)}
                  />
                  <text x="290" y="245" textAnchor="middle" fill="#f59e0b" fontWeight="bold" fontSize="12">Bedroom 2</text>
                  <text x="290" y="265" textAnchor="middle" fill="#64748b" fontSize="10">4.0m x 3.6m (14.4 m²)</text>

                  {/* Room 5: Balcony */}
                  <rect
                    x="375" y="180" width="100" height="115"
                    fill={activeRoom === 4 ? 'rgba(59, 130, 246, 0.25)' : 'rgba(59, 130, 246, 0.06)'}
                    stroke="#3b82f6" strokeWidth="2" strokeDasharray="4 2"
                    style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                    onClick={() => setActiveRoom(4)}
                  />
                  <text x="425" y="235" textAnchor="middle" fill="#3b82f6" fontWeight="bold" fontSize="12">Balcony</text>
                  <text x="425" y="255" textAnchor="middle" fill="#64748b" fontSize="10">5.5m x 2.0m</text>
                </svg>
              </Box>
            )}
            <Typography variant="caption" sx={{ color: 'text.secondary', mt: 1 }}>
              * Click any room above to view detailed dimensions
            </Typography>
          </Paper>
        </Grid>

        {/* Room Specifications Table / List */}
        <Grid item xs={12} md={5}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {defaultRooms.map((room, idx) => {
              const isSelected = activeRoom === idx;
              return (
                <Paper
                  key={idx}
                  onClick={() => setActiveRoom(idx)}
                  elevation={0}
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    border: '1.5px solid',
                    borderColor: isSelected ? '#06b6d4' : 'divider',
                    bgcolor: isSelected ? 'rgba(6, 182, 212, 0.08)' : 'background.paper',
                    '&:hover': {
                      borderColor: '#06b6d4',
                      transform: 'translateY(-2px)'
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <MeetingRoom sx={{ color: isSelected ? '#06b6d4' : 'text.secondary', fontSize: 20 }} />
                      <Typography sx={{ fontWeight: 600, color: 'text.primary', fontSize: 15 }}>
                        {room.name}
                      </Typography>
                    </Box>
                    <Chip
                      size="small"
                      label={`${room.areaSqM} m²`}
                      sx={{
                        bgcolor: isSelected ? '#06b6d4' : 'action.hover',
                        color: isSelected ? 'white' : 'text.primary',
                        fontWeight: 700
                      }}
                    />
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1, pl: 4 }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: 13 }}>
                      Dimensions: <strong style={{ color: '#06b6d4' }}>{room.dimensions}</strong>
                    </Typography>
                  </Box>
                </Paper>
              );
            })}
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}
