'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import {
  Box, Typography, Card, Chip, IconButton,
  CircularProgress, useMediaQuery, Snackbar, Alert,
  Drawer, Slider, FormControl, InputLabel, Select, MenuItem,
  Button, Divider, Toolbar, TextField, Pagination, Tooltip,
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/lib/theme-context';
import Navbar from '@/components/ui/Navbar';
import {
  Home, LocationOn, Bed, Bathtub,
  SquareFoot, Close, FilterList,
  MyLocation, Search, Visibility, Map as MapIcon, Refresh,
} from '@mui/icons-material';
import api from '@/app/utils/api';
import type { House, PropertyType, PaginationData } from '@/types/houses';

// ─── The Leaflet map, isolated and client-only ─────────────────────
const MapView = dynamic(() => import('@/components/MapView'), {
  ssr: false,
  loading: () => (
    <Box
      sx={{
        height: '100%',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#1a1a2e',
      }}
    >
      <CircularProgress sx={{ color: '#00ffff' }} />
    </Box>
  ),
});

const propertyTypeLabels: Record<PropertyType, string> = {
  [0]: 'Apartment',
  [1]: 'Villa',
  [2]: 'Condo',
  [3]: 'House',
  [4]: 'Land',
} as any;

export default function MapViewPage() {
  const { theme } = useTheme();
  const isMobile = useMediaQuery('(max-width: 1024px)');

  const [houses, setHouses] = useState<House[]>([]);
  const [selectedHouse, setSelectedHouse] = useState<House | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mapCenter, setMapCenter] = useState<[number, number]>([9.03, 38.74]);
  const [mapZoom, setMapZoom] = useState(13);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const [pagination, setPagination] = useState<PaginationData>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  const [filters, setFilters] = useState({
    search: '',
    propertyType: '',
    minPrice: 0,
    maxPrice: 50000000,
    minBedrooms: 0,
    minBathrooms: 0,
    sortBy: 'created_at',
    sortOrder: 'desc',
    page: 1,
    limit: 10,
  });

  const getImageUrl = (houseId: string): string => {
    const serverUrl =
      process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3001/api';
    return `${serverUrl}/public/houses/${houseId}/image`;
  };

  const handleImageError = (houseId: string) => {
    setImageErrors((prev) => ({ ...prev, [houseId]: true }));
  };

  const fetchHouses = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== '' && value !== 0 && value !== null && value !== undefined) {
          params.append(key, value.toString());
        }
      });
      const response = await api.get(`/public/houses?${params}`);
      setHouses(response.data.data.houses || []);
      setPagination(response.data.data.pagination);
      setError('');
    } catch (err: any) {
      console.error('Error fetching houses:', err);
      setError(err.response?.data?.message || 'Failed to fetch houses');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchHouses();
  }, [fetchHouses]);

  const handleFilterChange = (field: string, value: any) => {
    setFilters((prev) => ({ ...prev, [field]: value, page: 1 }));
  };

  const handlePageChange = (_: React.ChangeEvent<unknown>, value: number) => {
    handleFilterChange('page', value);
  };

  const resetFilters = () => {
    setFilters({
      search: '',
      propertyType: '',
      minPrice: 0,
      maxPrice: 50000000,
      minBedrooms: 0,
      minBathrooms: 0,
      sortBy: 'created_at',
      sortOrder: 'desc',
      page: 1,
      limit: 10,
    });
  };

  const handleViewOnMap = (house: House) => {
    setSelectedHouse(house);
    if (house.location?.coordinates) {
      setMapCenter([
        house.location.coordinates.lat,
        house.location.coordinates.lng,
      ]);
      setMapZoom(16);
    }
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);

  const handleMapMove = (center: [number, number], zoom: number) => {
    setMapCenter(center);
    setMapZoom(zoom);
  };

  // ─── Filter drawer content ───────────────────────────────────────
  const FilterContent = () => (
    <Box sx={{ p: 2, width: isMobile ? '100%' : 320 }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2,
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
          Filters
        </Typography>
        <IconButton onClick={() => setFilterDrawerOpen(false)}>
          <Close />
        </IconButton>
      </Box>
      <Divider sx={{ mb: 2 }} />

      <TextField
        fullWidth
        size="small"
        label="Search by title or location"
        value={filters.search}
        onChange={(e) => handleFilterChange('search', e.target.value)}
        placeholder="e.g., Villa, Addis Ababa..."
        sx={{ mb: 2 }}
      />

      <FormControl fullWidth size="small" sx={{ mb: 2 }}>
        <InputLabel>Property Type</InputLabel>
        <Select
          value={filters.propertyType}
          label="Property Type"
          onChange={(e) => handleFilterChange('propertyType', e.target.value)}
        >
          <MenuItem value="">All Types</MenuItem>
          {Object.entries(propertyTypeLabels).map(([value, label]) => (
            <MenuItem key={value} value={value}>
              {label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Typography variant="body2" sx={{ mb: 1 }}>
        Price Range
      </Typography>
      <Slider
        value={[filters.minPrice, filters.maxPrice]}
        onChange={(_, newValue) => {
          const [min, max] = newValue as number[];
          handleFilterChange('minPrice', min);
          handleFilterChange('maxPrice', max);
        }}
        min={0}
        max={50000000}
        step={100000}
        valueLabelDisplay="auto"
        valueLabelFormat={(v) => formatPrice(v)}
        sx={{ mb: 2 }}
      />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="caption">{formatPrice(filters.minPrice)}</Typography>
        <Typography variant="caption">{formatPrice(filters.maxPrice)}</Typography>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <FormControl fullWidth size="small">
          <InputLabel>Min Bedrooms</InputLabel>
          <Select
            value={filters.minBedrooms}
            label="Min Bedrooms"
            onChange={(e) =>
              handleFilterChange('minBedrooms', e.target.value as number)
            }
          >
            <MenuItem value={0}>Any</MenuItem>
            <MenuItem value={1}>1+</MenuItem>
            <MenuItem value={2}>2+</MenuItem>
            <MenuItem value={3}>3+</MenuItem>
            <MenuItem value={4}>4+</MenuItem>
            <MenuItem value={5}>5+</MenuItem>
          </Select>
        </FormControl>

        <FormControl fullWidth size="small">
          <InputLabel>Min Bathrooms</InputLabel>
          <Select
            value={filters.minBathrooms}
            label="Min Bathrooms"
            onChange={(e) =>
              handleFilterChange('minBathrooms', e.target.value as number)
            }
          >
            <MenuItem value={0}>Any</MenuItem>
            <MenuItem value={1}>1+</MenuItem>
            <MenuItem value={2}>2+</MenuItem>
            <MenuItem value={3}>3+</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <FormControl fullWidth size="small" sx={{ mb: 2 }}>
        <InputLabel>Sort By</InputLabel>
        <Select
          value={filters.sortBy}
          label="Sort By"
          onChange={(e) => handleFilterChange('sortBy', e.target.value)}
        >
          <MenuItem value="created_at">Newest First</MenuItem>
          <MenuItem value="pricing.price">Price: Low to High</MenuItem>
          <MenuItem value="-pricing.price">Price: High to Low</MenuItem>
          <MenuItem value="details.area">Size: Small to Large</MenuItem>
        </Select>
      </FormControl>

      <Button
        fullWidth
        variant="contained"
        onClick={() => setFilterDrawerOpen(false)}
        sx={{
          mt: 2,
          background:
            theme === 'dark'
              ? 'linear-gradient(135deg, #00ffff, #00b3b3)'
              : 'linear-gradient(135deg, #007bff, #0056b3)',
        }}
      >
        Apply Filters
      </Button>

      <Button fullWidth variant="outlined" onClick={resetFilters} sx={{ mt: 1 }}>
        Reset All Filters
      </Button>
    </Box>
  );

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        theme === 'dark'
          ? 'bg-gradient-to-br from-[#0a192f] to-[#112240]'
          : 'bg-gradient-to-br from-[#f0f0f0] to-[#ffffff]'
      }`}
    >
      <Navbar />
      <Toolbar />
      <Toolbar />

      {/* Header */}
      <Box sx={{ px: { xs: 2, md: 4 }, pt: 2, pb: 2 }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 'bold',
            color: theme === 'dark' ? '#ccd6f6' : '#333333',
            mb: 1,
          }}
        >
          Find Properties on Map
        </Typography>
        <Typography
          variant="body1"
          color={theme === 'dark' ? '#a8b2d1' : '#666666'}
        >
          Search and explore properties visually on the map. Click on markers to
          see details, or browse the list below.
        </Typography>
      </Box>

      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', lg: 'row' },
          height: { lg: 'calc(100vh - 160px)' },
          px: { xs: 2, md: 4 },
          pb: 4,
          gap: 3,
        }}
      >
        {/* ── Map section ─────────────────────────────────────── */}
        <Box
          sx={{
            flex: { xs: '1 1 100%', lg: '1 1 60%' },
            height: { xs: 400, lg: '100%' },
            borderRadius: 3,
            overflow: 'hidden',
            boxShadow:
              theme === 'dark'
                ? '0 4px 12px rgba(0,0,0,0.3)'
                : '0 4px 12px rgba(0,0,0,0.1)',
            position: 'relative',
            bgcolor: '#1a1a2e',
            zIndex: 0,
          }}
        >
          <MapView
            houses={houses}
            selectedHouse={selectedHouse}
            center={mapCenter}
            zoom={mapZoom}
            onSelectHouse={setSelectedHouse}
            onMapMove={handleMapMove}
            formatPrice={formatPrice}
            theme={theme === 'dark' ? 'dark' : 'light'}
            loading={loading}
          />

          {/* Floating map controls — always visible above the map */}
          <Box
            sx={{
              position: 'absolute',
              top: 16,
              right: 16,
              display: 'flex',
              gap: 1,
              zIndex: 1000,
            }}
          >
            <IconButton
              onClick={() => setFilterDrawerOpen(true)}
              sx={{
                backgroundColor: theme === 'dark' ? '#0f172a' : 'white',
                boxShadow: 2,
                '&:hover': {
                  backgroundColor: theme === 'dark' ? '#1e293b' : '#f8fafc',
                },
              }}
            >
              <FilterList />
            </IconButton>
            <IconButton
              onClick={() => {
                setMapCenter([9.03, 38.74]);
                setMapZoom(13);
                setSelectedHouse(null);
              }}
              sx={{
                backgroundColor: theme === 'dark' ? '#0f172a' : 'white',
                boxShadow: 2,
                '&:hover': {
                  backgroundColor: theme === 'dark' ? '#1e293b' : '#f8fafc',
                },
              }}
            >
              <MyLocation />
            </IconButton>
          </Box>
        </Box>

        {/* ── List section ────────────────────────────────────── */}
        <Box
          sx={{
            flex: { xs: '1 1 100%', lg: '1 1 40%' },
            height: { xs: 'auto', lg: '100%' },
            overflowY: 'auto',
            borderRadius: 3,
            backgroundColor: theme === 'dark' ? '#0f172a80' : 'white',
            backdropFilter: theme === 'dark' ? 'blur(10px)' : 'none',
            p: 2,
          }}
        >
          <Box sx={{ mb: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <TextField
              size="small"
              placeholder="Search properties..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, fontSize: 20 }} />,
              }}
              sx={{ flex: 1, minWidth: 200 }}
            />
            <Button
              variant="outlined"
              size="small"
              startIcon={<FilterList />}
              onClick={() => setFilterDrawerOpen(true)}
            >
              Filter
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<Refresh />}
              onClick={resetFilters}
            >
              Reset
            </Button>
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Showing {houses.length} of {pagination.totalItems} properties
          </Typography>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress
                size={40}
                sx={{ color: theme === 'dark' ? '#00ffff' : '#007bff' }}
              />
            </Box>
          ) : houses.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Home
                sx={{
                  fontSize: 48,
                  color: theme === 'dark' ? '#334155' : '#cbd5e1',
                  mb: 2,
                }}
              />
              <Typography variant="body1">No properties found</Typography>
              <Typography variant="body2" color="text.secondary">
                Try adjusting your filters
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <AnimatePresence>
                {houses.map((house, index) => {
                  const imageUrl = getImageUrl(house._id);
                  const hasImageError = imageErrors[house._id];
                  const isSelected = selectedHouse?._id === house._id;

                  return (
                    <motion.div
                      key={house._id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                      <Card
                        sx={{
                          borderRadius: 2,
                          cursor: 'pointer',
                          border: isSelected
                            ? `2px solid ${
                                theme === 'dark' ? '#00ffff' : '#007bff'
                              }`
                            : '1px solid transparent',
                          backgroundColor: isSelected
                            ? theme === 'dark'
                              ? '#00ffff20'
                              : '#007bff10'
                            : theme === 'dark'
                            ? '#0f172a80'
                            : 'white',
                          transition: 'all 0.2s',
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow:
                              theme === 'dark'
                                ? '0 4px 12px rgba(0,0,0,0.3)'
                                : '0 4px 12px rgba(0,0,0,0.1)',
                          },
                        }}
                        onClick={() => handleViewOnMap(house)}
                      >
                        <Box sx={{ display: 'flex', p: 2, gap: 2 }}>
                          <Box
                            sx={{
                              width: 100,
                              height: 80,
                              flexShrink: 0,
                              borderRadius: 1,
                              overflow: 'hidden',
                              bgcolor:
                                theme === 'dark' ? '#334155' : '#e5e7eb',
                            }}
                          >
                            {!hasImageError ? (
                              <img
                                src={imageUrl}
                                alt={house.title}
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'cover',
                                }}
                                onError={() => handleImageError(house._id)}
                              />
                            ) : (
                              <Box
                                sx={{
                                  width: '100%',
                                  height: '100%',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                <Home
                                  sx={{
                                    fontSize: 32,
                                    color:
                                      theme === 'dark' ? '#a8b2d1' : '#94a3b8',
                                  }}
                                />
                              </Box>
                            )}
                          </Box>

                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography
                              variant="subtitle1"
                              sx={{
                                fontWeight: 'bold',
                                mb: 0.5,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {house.title}
                            </Typography>
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.5,
                                mb: 0.5,
                              }}
                            >
                              <LocationOn
                                sx={{ fontSize: 12, color: 'text.secondary' }}
                              />
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                {house.location.city}, {house.location.state}
                              </Typography>
                            </Box>
                            <Box
                              sx={{
                                display: 'flex',
                                gap: 2,
                                mb: 1,
                                flexWrap: 'wrap',
                              }}
                            >
                              <Box
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 0.5,
                                }}
                              >
                                <Bed sx={{ fontSize: 12 }} />
                                <Typography variant="caption">
                                  {house.details.bedrooms} beds
                                </Typography>
                              </Box>
                              <Box
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 0.5,
                                }}
                              >
                                <Bathtub sx={{ fontSize: 12 }} />
                                <Typography variant="caption">
                                  {house.details.bathrooms} baths
                                </Typography>
                              </Box>
                              <Box
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 0.5,
                                }}
                              >
                                <SquareFoot sx={{ fontSize: 12 }} />
                                <Typography variant="caption">
                                  {house.details.area.toLocaleString()} sqft
                                </Typography>
                              </Box>
                            </Box>
                            <Typography
                              variant="h6"
                              sx={{
                                fontWeight: 'bold',
                                color:
                                  theme === 'dark' ? '#00ffff' : '#007bff',
                              }}
                            >
                              {formatPrice(house.pricing.price)}
                            </Typography>
                          </Box>

                          <Box
                            sx={{
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 1,
                              justifyContent: 'center',
                            }}
                          >
                            <Tooltip title="View on Map">
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewOnMap(house);
                                }}
                                sx={{
                                  color:
                                    theme === 'dark' ? '#00ffff' : '#007bff',
                                }}
                              >
                                <MapIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="View Details">
                              <IconButton
                                size="small"
                                href={`/public/houses/${house._id}`}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Visibility />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </Box>
                      </Card>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </Box>
          )}

          {pagination.totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Pagination
                count={pagination.totalPages}
                page={filters.page}
                onChange={handlePageChange}
                color="primary"
                size="small"
              />
            </Box>
          )}
        </Box>
      </Box>

      <Drawer
        anchor="right"
        open={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        PaperProps={{
          sx: {
            backgroundColor: theme === 'dark' ? '#0f172a' : 'white',
            width: isMobile ? '100%' : 320,
          },
        }}
      >
        <FilterContent />
      </Drawer>

      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          severity="error"
          onClose={() => setError('')}
          sx={{ borderRadius: 2 }}
        >
          {error}
        </Alert>
      </Snackbar>
    </div>
  );
}