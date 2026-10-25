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
import { useLanguage } from '@/lib/language-context';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import {
  Home, LocationOn, Bed, Bathtub,
  SquareFoot, Close, FilterList,
  MyLocation, Search, Visibility, Map as MapIcon, Refresh,
} from '@mui/icons-material';
import api from '@/app/utils/api';
import type { House, PropertyType, PaginationData } from '@/types/houses';
import Link from 'next/link';

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
      <CircularProgress sx={{ color: 'primary.main' }} />
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
  const { t, isAmharic } = useLanguage();
  const isMobile = useMediaQuery('(max-width: 1024px)');

  const [mobileView, setMobileView] = useState<'map' | 'list'>('map');
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
    transactionType: '',
    propertyType: '',
    isVerified: '',
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
      transactionType: '',
      propertyType: '',
      isVerified: '',
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
    if (isMobile) {
      setMobileView('map');
    }
  };

  const formatPrice = (price: number) => {
    if (!price && price !== 0) return '0 ETB';
    return `${Number(price).toLocaleString()} ETB`;
  };

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
          {isAmharic ? 'ማጣሪያዎች' : 'Filters'}
        </Typography>
        <IconButton onClick={() => setFilterDrawerOpen(false)}>
          <Close />
        </IconButton>
      </Box>
      <Divider sx={{ mb: 2 }} />

      <TextField
        fullWidth
        size="small"
        label={isAmharic ? 'በርዕስ ወይም በአድራሻ ፈልግ' : 'Search by title or location'}
        value={filters.search}
        onChange={(e) => handleFilterChange('search', e.target.value)}
        placeholder={isAmharic ? 'ምሳሌ፡ ቪላ፣ አዲስ አበባ...' : 'e.g., Villa, Addis Ababa...'}
        sx={{ mb: 2 }}
      />

      <FormControl fullWidth size="small" sx={{ mb: 2 }}>
        <InputLabel>{isAmharic ? 'የንብረት ዓይነት' : 'Property Type'}</InputLabel>
        <Select
          value={filters.propertyType}
          label={isAmharic ? 'የንብረት ዓይነት' : 'Property Type'}
          onChange={(e) => handleFilterChange('propertyType', e.target.value)}
        >
          <MenuItem value="">{isAmharic ? 'ሁሉም ዓይነቶች' : 'All Types'}</MenuItem>
          <MenuItem value="0">{isAmharic ? 'አፓርታማ' : 'Apartment'}</MenuItem>
          <MenuItem value="1">{isAmharic ? 'ቪላ' : 'Villa'}</MenuItem>
          <MenuItem value="2">{isAmharic ? 'ኮንዶሚኒየም' : 'Condo'}</MenuItem>
          <MenuItem value="3">{isAmharic ? 'ቤት' : 'House'}</MenuItem>
          <MenuItem value="4">{isAmharic ? 'መሬት' : 'Land'}</MenuItem>
        </Select>
      </FormControl>

      <Typography variant="body2" sx={{ mb: 1 }}>
        {isAmharic ? 'የዋጋ ክልል' : 'Price Range'}
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
          <InputLabel>{isAmharic ? 'መኝታ ክፍሎች' : 'Min Bedrooms'}</InputLabel>
          <Select
            value={filters.minBedrooms}
            label={isAmharic ? 'መኝታ ክፍሎች' : 'Min Bedrooms'}
            onChange={(e) =>
              handleFilterChange('minBedrooms', e.target.value as number)
            }
          >
            <MenuItem value={0}>{isAmharic ? 'ማንኛውም' : 'Any'}</MenuItem>
            <MenuItem value={1}>1+</MenuItem>
            <MenuItem value={2}>2+</MenuItem>
            <MenuItem value={3}>3+</MenuItem>
            <MenuItem value={4}>4+</MenuItem>
            <MenuItem value={5}>5+</MenuItem>
          </Select>
        </FormControl>

        <FormControl fullWidth size="small">
          <InputLabel>{isAmharic ? 'መታጠቢያ ክፍሎች' : 'Min Bathrooms'}</InputLabel>
          <Select
            value={filters.minBathrooms}
            label={isAmharic ? 'መታጠቢያ ክፍሎች' : 'Min Bathrooms'}
            onChange={(e) =>
              handleFilterChange('minBathrooms', e.target.value as number)
            }
          >
            <MenuItem value={0}>{isAmharic ? 'ማንኛውም' : 'Any'}</MenuItem>
            <MenuItem value={1}>1+</MenuItem>
            <MenuItem value={2}>2+</MenuItem>
            <MenuItem value={3}>3+</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <FormControl fullWidth size="small" sx={{ mb: 2 }}>
        <InputLabel>{isAmharic ? 'አደራድር በ' : 'Sort By'}</InputLabel>
        <Select
          value={filters.sortBy}
          label={isAmharic ? 'አደራድር በ' : 'Sort By'}
          onChange={(e) => handleFilterChange('sortBy', e.target.value)}
        >
          <MenuItem value="created_at">{isAmharic ? 'አዲሶቹ አስቀድመው' : 'Newest First'}</MenuItem>
          <MenuItem value="pricing.price">{isAmharic ? 'ዋጋ፡ ከዝቅተኛ ወደ ከፍተኛ' : 'Price: Low to High'}</MenuItem>
          <MenuItem value="-pricing.price">{isAmharic ? 'ዋጋ፡ ከከፍተኛ ወደ ዝቅተኛ' : 'Price: High to Low'}</MenuItem>
          <MenuItem value="details.area">{isAmharic ? 'ስፋት፡ ከትንሽ ወደ ትልቅ' : 'Size: Small to Large'}</MenuItem>
        </Select>
      </FormControl>

      <Button
        fullWidth
        variant="contained"
        onClick={() => setFilterDrawerOpen(false)}
        sx={{
          mt: 2,
          fontWeight: 700,
          textTransform: 'none',
          borderRadius: 2
        }}
      >
        {isAmharic ? 'ማጣሪያዎችን ተግብር' : 'Apply Filters'}
      </Button>

      <Button
        fullWidth
        variant="outlined"
        onClick={resetFilters}
        sx={{ mt: 1, textTransform: 'none', fontWeight: 600, borderRadius: 2 }}
      >
        {isAmharic ? 'ሁሉንም ማጣሪያዎች ሰርዝ' : 'Reset All Filters'}
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
      
      {/* Page Content below Navbar */}
      <div className="pt-16 sm:pt-20">
        {/* Header */}
        <Box sx={{ px: { xs: 2, sm: 3, md: 4 }, pt: 2, pb: 1.5 }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
              color: theme === 'dark' ? '#ccd6f6' : '#1e293b',
              mb: 0.5,
              fontSize: { xs: '1.35rem', sm: '1.85rem', md: '2.2rem' },
              letterSpacing: -0.5
            }}
          >
            {isAmharic ? 'ቤቶችን በካርታ ላይ ይፈልጉ' : 'Find Properties on Interactive Map'}
          </Typography>
          <Typography
            variant="body1"
            color={theme === 'dark' ? '#a8b2d1' : '#64748b'}
            sx={{ fontSize: { xs: '0.85rem', sm: '0.95rem' } }}
          >
            {isAmharic
              ? 'ቤቶችን በካርታ እይታ ያስሱ። ዝርዝር ለማየት ምልክቶቹን ይጫኑ ወይም ከስር ያለውን ዝርዝር ይመልከቱ።'
              : 'Search and explore properties visually across Ethiopia. Click markers to preview details, or browse the list.'}
          </Typography>
        </Box>

        {/* Mobile View Switcher Tab Pill (Map vs List) */}
        {isMobile && (
          <Box sx={{ px: { xs: 2, sm: 3 }, mb: 2 }}>
            <Box sx={{
              display: 'flex',
              p: 0.5,
              borderRadius: 3,
              bgcolor: theme === 'dark' ? 'rgba(15, 23, 42, 0.85)' : 'rgba(241, 245, 249, 0.95)',
              border: '1px solid',
              borderColor: 'divider',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
            }}>
              <Button
                fullWidth
                size="small"
                onClick={() => setMobileView('map')}
                startIcon={<MapIcon />}
                variant={mobileView === 'map' ? 'contained' : 'text'}
                sx={{
                  borderRadius: 2.5,
                  fontWeight: 700,
                  textTransform: 'none',
                  fontSize: 13,
                  py: 1,
                  bgcolor: mobileView === 'map' ? 'primary.main' : 'transparent',
                  color: mobileView === 'map' ? 'white' : 'text.primary',
                  boxShadow: mobileView === 'map' ? '0 2px 8px rgba(2, 132, 199, 0.3)' : 'none',
                  '&:hover': {
                    bgcolor: mobileView === 'map' ? 'primary.dark' : 'action.hover'
                  }
                }}
              >
                {isAmharic ? 'የካርታ እይታ' : 'Map View'} ({houses.length})
              </Button>
              <Button
                fullWidth
                size="small"
                onClick={() => setMobileView('list')}
                startIcon={<Home />}
                variant={mobileView === 'list' ? 'contained' : 'text'}
                sx={{
                  borderRadius: 2.5,
                  fontWeight: 700,
                  textTransform: 'none',
                  fontSize: 13,
                  py: 1,
                  bgcolor: mobileView === 'list' ? 'primary.main' : 'transparent',
                  color: mobileView === 'list' ? 'white' : 'text.primary',
                  boxShadow: mobileView === 'list' ? '0 2px 8px rgba(2, 132, 199, 0.3)' : 'none',
                  '&:hover': {
                    bgcolor: mobileView === 'list' ? 'primary.dark' : 'action.hover'
                  }
                }}
              >
                {isAmharic ? 'የዝርዝር እይታ' : 'List View'} ({pagination.totalItems || houses.length})
              </Button>
            </Box>
          </Box>
        )}

        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', lg: 'row' },
            height: { lg: 'calc(100vh - 170px)' },
            px: { xs: 2, sm: 3, md: 4 },
            pb: { xs: 2, lg: 3 },
            gap: 2.5,
          }}
        >
          {/* ── Map section ─────────────────────────────────────── */}
          <Box
            sx={{
              display: { xs: mobileView === 'map' ? 'block' : 'none', lg: 'block' },
              flex: { xs: '1 1 100%', lg: '1 1 60%' },
              height: {
                xs: 'calc(100dvh - 200px)',
                sm: 'calc(100vh - 210px)',
                lg: '100%'
              },
              minHeight: { xs: 460, sm: 540, lg: 'auto' },
              borderRadius: 3,
              overflow: 'hidden',
              boxShadow:
                theme === 'dark'
                  ? '0 6px 20px rgba(0,0,0,0.4)'
                  : '0 6px 20px rgba(0,0,0,0.08)',
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
                zIndex: 800,
              }}
            >
              <Tooltip title={isAmharic ? 'ማጣሪያዎች' : 'Filter Properties'}>
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
              </Tooltip>
              <Tooltip title={isAmharic ? 'ወደ መጀመሪያው አቀማመጥ መልስ' : 'Recenter Map'}>
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
              </Tooltip>
            </Box>

            {/* Floating Selected House Bottom Preview Card */}
            {selectedHouse && (
              <Box
                sx={{
                  position: 'absolute',
                  bottom: { xs: 12, sm: 16 },
                  left: { xs: 12, sm: 16 },
                  right: { xs: 12, sm: 16 },
                  zIndex: 850,
                  maxWidth: 480,
                  mx: 'auto',
                  bgcolor: theme === 'dark' ? 'rgba(15, 23, 42, 0.96)' : 'rgba(255, 255, 255, 0.96)',
                  backdropFilter: 'blur(12px)',
                  borderRadius: 3,
                  p: 1.5,
                  boxShadow: '0 12px 32px rgba(0,0,0,0.3)',
                  border: '1px solid',
                  borderColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
                }}
              >
                <Box sx={{ display: 'flex', gap: 1.5, position: 'relative' }}>
                  <Box
                    component="img"
                    src={getImageUrl(selectedHouse._id)}
                    alt={selectedHouse.title}
                    onError={(e: any) => {
                      e.target.src = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=300&q=80';
                    }}
                    sx={{
                      width: 90,
                      height: 80,
                      borderRadius: 2,
                      objectFit: 'cover',
                      flexShrink: 0
                    }}
                  />

                  <Box sx={{ flex: 1, minWidth: 0, pr: 3 }}>
                    <Typography variant="caption" sx={{ color: '#06b6d4', fontWeight: 700, display: 'block', fontSize: 11 }}>
                      {selectedHouse.transactionType === 'BUY' ? (isAmharic ? 'ሽያጭ' : 'FOR SALE') : (isAmharic ? 'ኪራይ' : 'FOR RENT')}
                      {selectedHouse.isVerified && ` • ${isAmharic ? 'የተረጋገጠ' : 'Verified'}`}
                    </Typography>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, lineHeight: 1.2, mb: 0.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 13 }}>
                      {selectedHouse.title}
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 800, color: 'primary.main', mb: 0.8, fontSize: 14 }}>
                      {formatPrice(selectedHouse.pricing.price)}
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Button
                        component={Link}
                        href={`/public/houses/${selectedHouse._id}`}
                        variant="contained"
                        size="small"
                        sx={{ borderRadius: 1.5, textTransform: 'none', fontWeight: 700, fontSize: 11, py: 0.4, px: 1.2 }}
                      >
                        {isAmharic ? 'ዝርዝር እይ' : 'Details'}
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => {
                          const lat = selectedHouse.location?.coordinates?.lat || 9.03;
                          const lng = selectedHouse.location?.coordinates?.lng || 38.74;
                          window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
                        }}
                        sx={{ borderRadius: 1.5, textTransform: 'none', fontWeight: 600, fontSize: 11, py: 0.4, px: 1.2 }}
                      >
                        {isAmharic ? 'አቅጣጫ' : 'Directions'}
                      </Button>
                    </Box>
                  </Box>

                  <IconButton
                    size="small"
                    onClick={() => setSelectedHouse(null)}
                    sx={{ position: 'absolute', top: -4, right: -4, color: 'text.secondary' }}
                  >
                    <Close fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
            )}
          </Box>

          {/* ── List section ────────────────────────────────────── */}
          <Box
            sx={{
              display: { xs: mobileView === 'list' ? 'flex' : 'none', lg: 'flex' },
              flexDirection: 'column',
              flex: { xs: '1 1 100%', lg: '1 1 40%' },
              height: { xs: 'auto', lg: '100%' },
              overflowY: 'auto',
              borderRadius: 3,
              backgroundColor: theme === 'dark' ? '#0f172a80' : 'white',
              backdropFilter: theme === 'dark' ? 'blur(10px)' : 'none',
              p: { xs: 1.5, sm: 2 },
              border: '1px solid',
              borderColor: 'divider',
              maxHeight: { xs: 'none', lg: '100%' }
            }}
          >
            {/* Search and filter controls */}
            <Box sx={{ mb: 2, display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
              <TextField
                size="small"
                placeholder={isAmharic ? 'በአካባቢ ወይም በንብረት ስም ይፈልጉ...' : 'Search properties...'}
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                InputProps={{
                  startAdornment: <Search sx={{ mr: 1, fontSize: 20, color: 'text.secondary' }} />,
                }}
                sx={{ flex: 1, minWidth: { xs: '100%', sm: 180 } }}
              />
              <Box sx={{ display: 'flex', gap: 1, width: { xs: '100%', sm: 'auto' }, justifyContent: { xs: 'space-between', sm: 'flex-end' } }}>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<FilterList />}
                  onClick={() => setFilterDrawerOpen(true)}
                  sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, fontSize: 13, flex: { xs: 1, sm: 'none' } }}
                >
                  {isAmharic ? 'ማጣሪያ' : 'Filters'}
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<Refresh />}
                  onClick={resetFilters}
                  sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, fontSize: 13, flex: { xs: 1, sm: 'none' } }}
                >
                  {isAmharic ? 'እንደገና ጀምር' : 'Reset'}
                </Button>
              </Box>
            </Box>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontWeight: 600, fontSize: 13 }}>
              {isAmharic
                ? `${pagination.totalItems || houses.length} የሚገኙ ቤቶች ተገኝተዋል`
                : `Showing ${houses.length} of ${pagination.totalItems} properties`}
            </Typography>

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress
                  size={40}
                  sx={{ color: theme === 'dark' ? '#00ffff' : 'primary.main' }}
                />
              </Box>
            ) : houses.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 8, px: 2, borderRadius: 2, border: '1px dashed', borderColor: 'divider' }}>
                <Home
                  sx={{
                    fontSize: 48,
                    color: theme === 'dark' ? '#334155' : '#cbd5e1',
                    mb: 1.5,
                  }}
                />
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>
                  {isAmharic ? 'ምንም ቤቶች አልተገኙም' : 'No properties found'}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {isAmharic ? 'እባክዎ ማጣሪያዎችን በማስተካከል እንደገና ይሞክሩ' : 'Try adjusting your search criteria or resetting filters'}
                </Typography>
                <Button variant="outlined" size="small" onClick={resetFilters} sx={{ textTransform: 'none', fontWeight: 600 }}>
                  {isAmharic ? 'ማጣሪያዎችን ሰርዝ' : 'Reset Filters'}
                </Button>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <AnimatePresence>
                  {houses.map((house, index) => {
                    const imageUrl = getImageUrl(house._id);
                    const hasImageError = imageErrors[house._id];
                    const isSelected = selectedHouse?._id === house._id;

                    return (
                      <motion.div
                        key={house._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25, delay: index * 0.04 }}
                      >
                        <Card
                          sx={{
                            borderRadius: 2.5,
                            cursor: 'pointer',
                            border: isSelected
                              ? '2px solid #00ffff'
                              : '1px solid',
                            borderColor: isSelected ? '#00ffff' : 'divider',
                            backgroundColor: isSelected
                              ? theme === 'dark'
                                ? 'rgba(0, 255, 255, 0.08)'
                                : 'rgba(2, 132, 199, 0.08)'
                              : theme === 'dark'
                              ? '#0f172a80'
                              : 'white',
                            transition: 'all 0.2s',
                            '&:hover': {
                              transform: 'translateY(-2px)',
                              boxShadow:
                                theme === 'dark'
                                  ? '0 6px 16px rgba(0,0,0,0.3)'
                                  : '0 6px 16px rgba(0,0,0,0.06)',
                            },
                          }}
                          onClick={() => handleViewOnMap(house)}
                        >
                          <Box sx={{ display: 'flex', p: 1.5, gap: 1.5, alignItems: 'center' }}>
                            <Box
                              sx={{
                                width: { xs: 90, sm: 105 },
                                height: { xs: 80, sm: 85 },
                                flexShrink: 0,
                                borderRadius: 1.5,
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
                                  fontWeight: 700,
                                  fontSize: { xs: 13.5, sm: 15 },
                                  mb: 0.3,
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
                                  sx={{ fontSize: 13, color: 'text.secondary', flexShrink: 0 }}
                                />
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                                >
                                  {house.location.neighborhood ? `${house.location.neighborhood}, ` : ''}{house.location.city}
                                </Typography>
                              </Box>
                              <Box
                                sx={{
                                  display: 'flex',
                                  gap: 1.5,
                                  mb: 0.5,
                                  flexWrap: 'wrap',
                                }}
                              >
                                {house.details.bedrooms > 0 && (
                                  <Box
                                    sx={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 0.3,
                                    }}
                                  >
                                    <Bed sx={{ fontSize: 13, color: 'text.secondary' }} />
                                    <Typography variant="caption" sx={{ fontWeight: 600, fontSize: 11 }}>
                                      {house.details.bedrooms} {isAmharic ? 'መኝታ' : 'beds'}
                                    </Typography>
                                  </Box>
                                )}
                                {house.details.bathrooms > 0 && (
                                  <Box
                                    sx={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 0.3,
                                    }}
                                  >
                                    <Bathtub sx={{ fontSize: 13, color: 'text.secondary' }} />
                                    <Typography variant="caption" sx={{ fontWeight: 600, fontSize: 11 }}>
                                      {house.details.bathrooms} {isAmharic ? 'መታጠቢያ' : 'baths'}
                                    </Typography>
                                  </Box>
                                )}
                                <Box
                                  sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 0.3,
                                  }}
                                >
                                  <SquareFoot sx={{ fontSize: 13, color: 'text.secondary' }} />
                                  <Typography variant="caption" sx={{ fontWeight: 600, fontSize: 11 }}>
                                    {house.details.area} m²
                                  </Typography>
                                </Box>
                              </Box>
                              <Typography
                                variant="h6"
                                sx={{
                                  fontWeight: 800,
                                  fontSize: { xs: 14.5, sm: 16 },
                                  color: 'primary.main',
                                  lineHeight: 1.1
                                }}
                              >
                                {formatPrice(house.pricing.price)}
                              </Typography>
                            </Box>

                            <Box
                              sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 0.8,
                                justifyContent: 'center',
                                flexShrink: 0
                              }}
                            >
                              <Tooltip title={isAmharic ? 'በካርታ ላይ እይ' : 'View on Map'}>
                                <IconButton
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleViewOnMap(house);
                                  }}
                                  sx={{
                                    color: isSelected ? 'primary.main' : 'text.secondary',
                                    border: '1px solid',
                                    borderColor: 'divider'
                                  }}
                                >
                                  <MapIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title={isAmharic ? 'ዝርዝር እይ' : 'View Details'}>
                                <IconButton
                                  size="small"
                                  component={Link}
                                  href={`/public/houses/${house._id}`}
                                  onClick={(e) => e.stopPropagation()}
                                  sx={{
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    color: 'text.secondary'
                                  }}
                                >
                                  <Visibility fontSize="small" />
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
      <Footer />
    </div>
  );
}