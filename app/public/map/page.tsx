'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import {
  Box, Typography, Card, Chip, IconButton,
  CircularProgress, useMediaQuery, Snackbar, Alert,
  Drawer, Slider, FormControl, InputLabel, Select, MenuItem,
  Button, Divider, Toolbar, TextField, Pagination, Tooltip,
  InputAdornment,
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/lib/theme-context';
import Navbar from '@/components/ui/Navbar';
import {
  Home, LocationOn, Bed, Bathtub,
  SquareFoot, Close, FilterList,
  MyLocation, Search, Visibility, Map as MapIcon, Refresh,
  Business, Store, Warehouse, Clear
} from '@mui/icons-material';
import api from '@/app/utils/api';
import { House, PropertyType, PaginationData, TransactionType } from '@/types/houses';

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
  [PropertyType.APARTMENT]: 'Apartment',
  [PropertyType.VILLA]: 'Villa',
  [PropertyType.CONDO]: 'Condo',
  [PropertyType.HOUSE]: 'House',
  [PropertyType.LAND]: 'Land',
  [PropertyType.OFFICE]: 'Office',
  [PropertyType.SHOP]: 'Shop',
  [PropertyType.WAREHOUSE]: 'Warehouse'
};

const transactionTypeLabels: Record<TransactionType, string> = {
  [TransactionType.SALE]: 'For Sale',
  [TransactionType.RENT]: 'For Rent',
  [TransactionType.SHORT_STAY]: 'Short Stay'
};

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

  // Search Debounce state
  const [searchTerm, setSearchTerm] = useState('');
  
  const [filters, setFilters] = useState({
    search: '',
    propertyType: '',
    transactionType: '',
    minPrice: 0,
    maxPrice: 100000000, // Increased for higher end properties
    minBedrooms: 0,
    minBathrooms: 0,
    sortBy: 'created_at',
    sortOrder: 'desc',
    page: 1,
    limit: 10,
  });

  // Debounce the search input
  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchTerm !== filters.search) {
        handleFilterChange('search', searchTerm);
      }
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const getImageUrl = (houseId: string): string => {
    const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3001/api';
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
          // Don't send default max price if it's the max possible
          if (key === 'maxPrice' && value === 100000000) return; 
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
    setSearchTerm('');
    setFilters({
      search: '',
      propertyType: '',
      transactionType: '',
      minPrice: 0,
      maxPrice: 100000000,
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

  const handleMapMove = useCallback((center: [number, number], zoom: number) => {
    setMapCenter(center);
    setMapZoom(zoom);
  }, []);

  // Active filter count for the badge
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.propertyType) count++;
    if (filters.transactionType) count++;
    if (filters.minBedrooms > 0) count++;
    if (filters.minBathrooms > 0) count++;
    if (filters.minPrice > 0 || filters.maxPrice < 100000000) count++;
    return count;
  }, [filters]);

  // ─── Filter drawer content ───────────────────────────────────────
  const FilterContent = () => (
    <Box sx={{ p: 3, width: isMobile ? '100%' : 350, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
          Filters {activeFilterCount > 0 && <Chip label={activeFilterCount} size="small" color="primary" sx={{ ml: 1 }} />}
        </Typography>
        <IconButton onClick={() => setFilterDrawerOpen(false)}>
          <Close />
        </IconButton>
      </Box>
      <Divider sx={{ mb: 3 }} />

      <Box sx={{ flex: 1, overflowY: 'auto', pr: 1 }}>
        <FormControl fullWidth size="small" sx={{ mb: 3 }}>
          <InputLabel>Purpose</InputLabel>
          <Select
            value={filters.transactionType}
            label="Purpose"
            onChange={(e) => handleFilterChange('transactionType', e.target.value)}
          >
            <MenuItem value="">Any Purpose</MenuItem>
            <MenuItem value={TransactionType.SALE}>For Sale</MenuItem>
            <MenuItem value={TransactionType.RENT}>For Rent</MenuItem>
            <MenuItem value={TransactionType.SHORT_STAY}>Short Stay</MenuItem>
          </Select>
        </FormControl>

        <FormControl fullWidth size="small" sx={{ mb: 3 }}>
          <InputLabel>Property Type</InputLabel>
          <Select
            value={filters.propertyType}
            label="Property Type"
            onChange={(e) => handleFilterChange('propertyType', e.target.value)}
          >
            <MenuItem value="">Any Type</MenuItem>
            {Object.entries(propertyTypeLabels).map(([value, label]) => (
              <MenuItem key={value} value={value}>{label}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>Price Range</Typography>
        <Slider
          value={[filters.minPrice, filters.maxPrice]}
          onChange={(_, newValue) => {
            const [min, max] = newValue as number[];
            handleFilterChange('minPrice', min);
            handleFilterChange('maxPrice', max);
          }}
          min={0}
          max={100000000}
          step={500000}
          valueLabelDisplay="auto"
          valueLabelFormat={(v) => formatPrice(v)}
          sx={{ mb: 1 }}
        />
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="caption" sx={{ fontWeight: 'bold' }}>{formatPrice(filters.minPrice)}</Typography>
          <Typography variant="caption" sx={{ fontWeight: 'bold' }}>{formatPrice(filters.maxPrice)}</Typography>
        </Box>

        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>Bedrooms</Typography>
        <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap' }}>
          {[0, 1, 2, 3, 4, 5].map((num) => (
            <Chip
              key={num}
              label={num === 0 ? 'Any' : `${num}+`}
              onClick={() => handleFilterChange('minBedrooms', num)}
              color={filters.minBedrooms === num ? 'primary' : 'default'}
              variant={filters.minBedrooms === num ? 'filled' : 'outlined'}
              sx={{ flex: 1, minWidth: 50 }}
            />
          ))}
        </Box>

        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>Bathrooms</Typography>
        <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap' }}>
          {[0, 1, 2, 3, 4].map((num) => (
            <Chip
              key={num}
              label={num === 0 ? 'Any' : `${num}+`}
              onClick={() => handleFilterChange('minBathrooms', num)}
              color={filters.minBathrooms === num ? 'primary' : 'default'}
              variant={filters.minBathrooms === num ? 'filled' : 'outlined'}
              sx={{ flex: 1, minWidth: 50 }}
            />
          ))}
        </Box>

        <FormControl fullWidth size="small" sx={{ mb: 3 }}>
          <InputLabel>Sort By</InputLabel>
          <Select
            value={filters.sortBy}
            label="Sort By"
            onChange={(e) => handleFilterChange('sortBy', e.target.value)}
          >
            <MenuItem value="created_at">Newest First</MenuItem>
            <MenuItem value="pricing.price">Price: Low to High</MenuItem>
            <MenuItem value="-pricing.price">Price: High to Low</MenuItem>
            <MenuItem value="views">Most Viewed</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Box sx={{ pt: 2, borderTop: 1, borderColor: 'divider' }}>
        <Button
          fullWidth
          variant="contained"
          onClick={() => setFilterDrawerOpen(false)}
          sx={{
            mb: 1,
            background: theme === 'dark' ? 'linear-gradient(135deg, #00ffff, #00b3b3)' : 'linear-gradient(135deg, #007bff, #0056b3)',
            fontWeight: 'bold',
            py: 1.2
          }}
        >
          Show {pagination.totalItems} Results
        </Button>
        <Button fullWidth variant="text" onClick={resetFilters} startIcon={<Clear />}>
          Clear All Filters
        </Button>
      </Box>
    </Box>
  );

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      theme === 'dark' ? 'bg-gradient-to-br from-[#0a192f] to-[#112240]' : 'bg-gradient-to-br from-[#f0f0f0] to-[#ffffff]'
    }`}>
      <Navbar />
      <Toolbar />
      <Toolbar />

      {/* Header */}
      <Box sx={{ px: { xs: 2, md: 4 }, pt: 2, pb: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: theme === 'dark' ? '#ccd6f6' : '#333333', mb: 1 }}>
          Find Properties on Map
        </Typography>
        <Typography variant="body1" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
          Search and explore properties visually on the map. Click on markers to see details.
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, height: { lg: 'calc(100vh - 160px)' }, px: { xs: 2, md: 4 }, pb: 4, gap: 3 }}>
        
        {/* ── Map section ─────────────────────────────────────── */}
        <Box sx={{
            flex: { xs: '1 1 100%', lg: '1 1 60%' },
            height: { xs: 400, lg: '100%' },
            borderRadius: 3,
            overflow: 'hidden',
            boxShadow: theme === 'dark' ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.1)',
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

          {/* Floating map controls */}
          <Box sx={{ position: 'absolute', top: 16, right: 16, display: 'flex', gap: 1, zIndex: 1000 }}>
            <IconButton
              onClick={() => setFilterDrawerOpen(true)}
              sx={{
                backgroundColor: theme === 'dark' ? '#0f172a' : 'white',
                boxShadow: 2,
                '&:hover': { backgroundColor: theme === 'dark' ? '#1e293b' : '#f8fafc' },
              }}
            >
              <FilterList />
            </IconButton>
            <Tooltip title="Center Map">
              <IconButton
                onClick={() => {
                  setMapCenter([9.03, 38.74]);
                  setMapZoom(13);
                  setSelectedHouse(null);
                }}
                sx={{
                  backgroundColor: theme === 'dark' ? '#0f172a' : 'white',
                  boxShadow: 2,
                  '&:hover': { backgroundColor: theme === 'dark' ? '#1e293b' : '#f8fafc' },
                }}
              >
                <MyLocation />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* ── List section ────────────────────────────────────── */}
        <Box sx={{
            flex: { xs: '1 1 100%', lg: '1 1 40%' },
            height: { xs: 'auto', lg: '100%' },
            overflowY: 'auto',
            borderRadius: 3,
            backgroundColor: theme === 'dark' ? '#0f172a80' : 'white',
            backdropFilter: theme === 'dark' ? 'blur(10px)' : 'none',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Sticky Search & Quick Filters */}
          <Box sx={{ p: 2, borderBottom: 1, borderColor: theme === 'dark' ? '#334155' : '#e5e7eb', bgcolor: theme === 'dark' ? '#0f172a' : 'white', position: 'sticky', top: 0, zIndex: 10, borderTopLeftRadius: 12, borderTopRightRadius: 12 }}>
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search by title, city, or #tag..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ fontSize: 20 }} />
                    </InputAdornment>
                  ),
                  endAdornment: searchTerm ? (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setSearchTerm('')}>
                        <Clear fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ) : null
                }}
              />
              <Button
                variant={activeFilterCount > 0 ? "contained" : "outlined"}
                onClick={() => setFilterDrawerOpen(true)}
                sx={{ minWidth: 'auto', px: 2 }}
              >
                <FilterList />
                {activeFilterCount > 0 && (
                  <Chip label={activeFilterCount} size="small" sx={{ ml: 1, height: 20, minWidth: 20 }} color="secondary" />
                )}
              </Button>
            </Box>

            {/* Quick Purpose Filters */}
            <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', pb: 0.5, '&::-webkit-scrollbar': { display: 'none' } }}>
              <Chip
                label="All"
                onClick={() => handleFilterChange('transactionType', '')}
                color={filters.transactionType === '' ? 'primary' : 'default'}
                variant={filters.transactionType === '' ? 'filled' : 'outlined'}
                size="small"
              />
              <Chip
                label="For Sale"
                onClick={() => handleFilterChange('transactionType', TransactionType.SALE)}
                color={filters.transactionType === TransactionType.SALE ? 'primary' : 'default'}
                variant={filters.transactionType === TransactionType.SALE ? 'filled' : 'outlined'}
                size="small"
              />
              <Chip
                label="For Rent"
                onClick={() => handleFilterChange('transactionType', TransactionType.RENT)}
                color={filters.transactionType === TransactionType.RENT ? 'primary' : 'default'}
                variant={filters.transactionType === TransactionType.RENT ? 'filled' : 'outlined'}
                size="small"
              />
              <Chip
                label="Short Stay"
                onClick={() => handleFilterChange('transactionType', TransactionType.SHORT_STAY)}
                color={filters.transactionType === TransactionType.SHORT_STAY ? 'primary' : 'default'}
                variant={filters.transactionType === TransactionType.SHORT_STAY ? 'filled' : 'outlined'}
                size="small"
              />
            </Box>
          </Box>

          <Box sx={{ p: 2, flex: 1, overflowY: 'auto' }}>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
              Showing {houses.length} of {pagination.totalItems} properties
            </Typography>

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress size={40} sx={{ color: theme === 'dark' ? '#00ffff' : '#007bff' }} />
              </Box>
            ) : houses.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Home sx={{ fontSize: 48, color: theme === 'dark' ? '#334155' : '#cbd5e1', mb: 2 }} />
                <Typography variant="body1">No properties found</Typography>
                <Typography variant="body2" color="text.secondary">Try adjusting your filters or search term</Typography>
                <Button onClick={resetFilters} sx={{ mt: 2 }}>Clear Filters</Button>
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
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                      >
                        <Card
                          sx={{
                            borderRadius: 2,
                            cursor: 'pointer',
                            border: isSelected
                              ? `2px solid ${theme === 'dark' ? '#00ffff' : '#007bff'}`
                              : `1px solid ${theme === 'dark' ? '#334155' : '#e5e7eb'}`,
                            backgroundColor: isSelected
                              ? theme === 'dark' ? '#00ffff10' : '#007bff05'
                              : theme === 'dark' ? '#0f172a80' : 'white',
                            transition: 'all 0.2s',
                            '&:hover': {
                              boxShadow: theme === 'dark' ? '0 4px 12px rgba(0,0,0,0.5)' : '0 4px 12px rgba(0,0,0,0.1)',
                              transform: 'translateY(-2px)'
                            },
                          }}
                          onClick={() => handleViewOnMap(house)}
                        >
                          <Box sx={{ display: 'flex', p: 2, gap: 2 }}>
                            <Box sx={{ width: 120, height: 100, flexShrink: 0, borderRadius: 1.5, overflow: 'hidden', bgcolor: theme === 'dark' ? '#334155' : '#e5e7eb', position: 'relative' }}>
                              {!hasImageError ? (
                                <img
                                  src={imageUrl}
                                  alt={house.title}
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                  onError={() => handleImageError(house._id)}
                                />
                              ) : (
                                <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <Home sx={{ fontSize: 32, color: theme === 'dark' ? '#a8b2d1' : '#94a3b8' }} />
                                </Box>
                              )}
                              <Chip
                                label={transactionTypeLabels[house.transactionType] || 'Sale'}
                                size="small"
                                color={house.transactionType === TransactionType.RENT ? 'success' : house.transactionType === TransactionType.SHORT_STAY ? 'warning' : 'primary'}
                                sx={{ position: 'absolute', top: 8, left: 8, height: 20, fontSize: '0.65rem', fontWeight: 'bold' }}
                              />
                            </Box>

                            <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                              <Box>
                                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {house.title}
                                </Typography>
                                
                                {house.tags && house.tags.length > 0 && (
                                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                                    {house.tags.slice(0, 2).map((tag) => (
                                      <Typography key={tag} variant="caption" sx={{ color: theme === 'dark' ? '#00ffff' : '#007bff', fontSize: '0.65rem', fontWeight: 500 }}>
                                        #{tag}
                                      </Typography>
                                    ))}
                                  </Box>
                                )}

                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                                  <LocationOn sx={{ fontSize: 12, color: 'text.secondary' }} />
                                  <Typography variant="caption" color="text.secondary" noWrap>
                                    {house.location.city}, {house.location.state}
                                  </Typography>
                                </Box>
                              </Box>

                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mt: 1 }}>
                                <Box sx={{ display: 'flex', gap: 1.5 }}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                                    <Bed sx={{ fontSize: 14, color: 'text.secondary' }} />
                                    <Typography variant="caption" sx={{ fontWeight: 500 }}>{house.details.bedrooms}</Typography>
                                  </Box>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                                    <Bathtub sx={{ fontSize: 14, color: 'text.secondary' }} />
                                    <Typography variant="caption" sx={{ fontWeight: 500 }}>{house.details.bathrooms}</Typography>
                                  </Box>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                                    <SquareFoot sx={{ fontSize: 14, color: 'text.secondary' }} />
                                    <Typography variant="caption" sx={{ fontWeight: 500 }}>{house.details.area.toLocaleString()}</Typography>
                                  </Box>
                                </Box>
                                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: theme === 'dark' ? '#00ffff' : '#007bff', lineHeight: 1 }}>
                                  {formatPrice(house.pricing.price)}
                                </Typography>
                              </Box>
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
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, mb: 2 }}>
                <Pagination
                  count={pagination.totalPages}
                  page={filters.page}
                  onChange={handlePageChange}
                  color="primary"
                  size="small"
                  siblingCount={0}
                />
              </Box>
            )}
          </Box>
        </Box>
      </Box>

      <Drawer
        anchor="right"
        open={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        PaperProps={{
          sx: { backgroundColor: theme === 'dark' ? '#0f172a' : 'white' },
        }}
      >
        <FilterContent />
      </Drawer>

      <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError('')} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity="error" onClose={() => setError('')} sx={{ borderRadius: 2 }}>{error}</Alert>
      </Snackbar>
    </div>
  );
}