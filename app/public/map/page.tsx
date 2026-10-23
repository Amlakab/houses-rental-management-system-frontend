'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import dynamic from 'next/dynamic';
import {
  Box, Typography, Card, Chip, IconButton,
  CircularProgress, useMediaQuery, Snackbar, Alert,
  Drawer, Slider, FormControl, InputLabel, Select, MenuItem,
  Button, Divider, Toolbar, TextField, Pagination, Tooltip,
  Badge, Popover, Stack, Autocomplete, Skeleton, Switch,
  FormControlLabel, InputAdornment, Collapse,
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/lib/theme-context';
import Navbar from '@/components/ui/Navbar';
import {
  Home, LocationOn, Bed, Bathtub,
  SquareFoot, Close, FilterList,
  MyLocation, Search, Visibility, Map as MapIcon, Refresh,
  ExpandMore, ExpandLess, Sell, VpnKey, Star, NewReleases,
  CalendarToday, Person, Email, Phone, Straighten,
  LocalParking, Pool, AcUnit, Wifi, Kitchen, Balcony, Yard,
  AttachMoney, FilterAltOff, CenterFocusStrong,
} from '@mui/icons-material';
import api from '@/app/utils/api';
import type { House, PaginationData } from '@/types/houses';

// ─── The Leaflet map, isolated and client-only ─────────────────────
const MapView = dynamic(() => import('@/components/MapView'), {
  ssr: false,
  loading: () => (
    <Box
      sx={{
        height: '100%', width: '100%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        bgcolor: '#1a1a2e',
      }}
    >
      <CircularProgress sx={{ color: '#00ffff' }} />
    </Box>
  ),
});

// ─── Constants ─────────────────────────────────────────────────────
const PROPERTY_TYPES: { value: number; label: string }[] = [
  { value: 0, label: 'Apartment' },
  { value: 1, label: 'Villa' },
  { value: 2, label: 'Condo' },
  { value: 3, label: 'House' },
  { value: 4, label: 'Land' },
];

const PROPERTY_TYPE_MAP: Record<number, string> = PROPERTY_TYPES.reduce(
  (acc, t) => ({ ...acc, [t.value]: t.label }),
  {}
);

const PRICE_TYPES = [
  { value: '', label: 'Any' },
  { value: 'sale', label: 'For Sale' },
  { value: 'rent', label: 'For Rent' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'Any Status' },
  { value: 'available', label: 'Available' },
  { value: 'pending', label: 'Pending' },
  { value: 'sold', label: 'Sold' },
  { value: 'rented', label: 'Rented' },
];

const SORT_OPTIONS = [
  { value: 'created_at', label: 'Newest First' },
  { value: '-created_at', label: 'Oldest First' },
  { value: 'pricing.price', label: 'Price: Low to High' },
  { value: '-pricing.price', label: 'Price: High to Low' },
  { value: 'details.area', label: 'Area: Small to Large' },
  { value: '-details.area', label: 'Area: Large to Small' },
  { value: 'details.bedrooms', label: 'Bedrooms: Fewest First' },
  { value: '-details.bedrooms', label: 'Bedrooms: Most First' },
];

const AMENITIES = [
  { key: 'parking', label: 'Parking', icon: <LocalParking fontSize="small" /> },
  { key: 'pool', label: 'Pool', icon: <Pool fontSize="small" /> },
  { key: 'ac', label: 'AC', icon: <AcUnit fontSize="small" /> },
  { key: 'wifi', label: 'WiFi', icon: <Wifi fontSize="small" /> },
  { key: 'kitchen', label: 'Kitchen', icon: <Kitchen fontSize="small" /> },
  { key: 'balcony', label: 'Balcony', icon: <Balcony fontSize="small" /> },
  { key: 'yard', label: 'Yard', icon: <Yard fontSize="small" /> },
];

const PRICE_MAX = 50_000_000;
const AREA_MAX = 10_000;

// ─── Types ─────────────────────────────────────────────────────────
interface Filters {
  search: string;
  propertyType: string;
  priceType: string;
  status: string;
  city: string;
  state: string;
  minPrice: number;
  maxPrice: number;
  minArea: number;
  maxArea: number;
  minBedrooms: number;
  minBathrooms: number;
  minYearBuilt: number;
  amenities: string[];
  hasImage: boolean;
  sortBy: string;         // combined field+direction
  page: number;
  limit: number;
}

const DEFAULT_FILTERS: Filters = {
  search: '',
  propertyType: '',
  priceType: '',
  status: '',
  city: '',
  state: '',
  minPrice: 0,
  maxPrice: PRICE_MAX,
  minArea: 0,
  maxArea: AREA_MAX,
  minBedrooms: 0,
  minBathrooms: 0,
  minYearBuilt: 0,
  amenities: [],
  hasImage: false,
  sortBy: 'created_at',
  page: 1,
  limit: 10,
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
    currentPage: 1, totalPages: 1, totalItems: 0,
    hasNext: false, hasPrev: false,
  });
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [searchInput, setSearchInput] = useState('');
  const [showActiveFilters, setShowActiveFilters] = useState(true);

  // For enriching list (city/state suggestions from current results)
  const [citySuggestions, setCitySuggestions] = useState<string[]>([]);
  const [stateSuggestions, setStateSuggestions] = useState<string[]>([]);

  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchFieldRef = useRef<HTMLInputElement>(null);

  // ─── Keyboard shortcut: "/" focuses search ──────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' &&
          document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        searchFieldRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // ─── Debounced search ───────────────────────────────────────────
  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      setFilters((prev) =>
        prev.search === searchInput ? prev : { ...prev, search: searchInput, page: 1 }
      );
    }, 350);
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [searchInput]);

  const getImageUrl = (houseId: string): string => {
    const serverUrl =
      process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3001/api';
    return `${serverUrl}/public/houses/${houseId}/image`;
  };

  const handleImageError = (houseId: string) => {
    setImageErrors((prev) => ({ ...prev, [houseId]: true }));
  };

  // ─── Build query params (only non-default values) ───────────────
  const buildParams = useCallback((f: Filters) => {
    const params = new URLSearchParams();

    if (f.search.trim()) params.append('search', f.search.trim());
    if (f.propertyType !== '') params.append('propertyType', f.propertyType);
    if (f.priceType) params.append('priceType', f.priceType);
    if (f.status) params.append('status', f.status);
    if (f.city) params.append('city', f.city);
    if (f.state) params.append('state', f.state);

    if (f.minPrice > 0) params.append('minPrice', String(f.minPrice));
    if (f.maxPrice < PRICE_MAX) params.append('maxPrice', String(f.maxPrice));

    if (f.minArea > 0) params.append('minArea', String(f.minArea));
    if (f.maxArea < AREA_MAX) params.append('maxArea', String(f.maxArea));

    if (f.minBedrooms > 0) params.append('minBedrooms', String(f.minBedrooms));
    if (f.minBathrooms > 0) params.append('minBathrooms', String(f.minBathrooms));
    if (f.minYearBuilt > 0) params.append('minYearBuilt', String(f.minYearBuilt));

    if (f.amenities.length) params.append('amenities', f.amenities.join(','));
    if (f.hasImage) params.append('hasImage', 'true');

    // Sort: split "field" / "-field" into sortBy + sortOrder
    const desc = f.sortBy.startsWith('-');
    params.append('sortBy', desc ? f.sortBy.slice(1) : f.sortBy);
    params.append('sortOrder', desc ? 'desc' : 'asc');

    params.append('page', String(f.page));
    params.append('limit', String(f.limit));
    return params;
  }, []);

  const fetchHouses = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(`/public/houses?${buildParams(filters)}`);
      const data = response.data.data;
      const list: House[] = data.houses || [];
      setHouses(list);
      setPagination(data.pagination);
      setError('');

      // Derive city/state suggestions from results (best-effort)
      const cities = Array.from(
        new Set(list.map((h) => h.location?.city).filter(Boolean))
      ).slice(0, 30);
      const states = Array.from(
        new Set(list.map((h) => h.location?.state).filter(Boolean))
      ).slice(0, 30);
      setCitySuggestions((prev) => Array.from(new Set([...prev, ...cities])));
      setStateSuggestions((prev) => Array.from(new Set([...prev, ...states])));
    } catch (err: any) {
      console.error('Error fetching houses:', err);
      setError(err.response?.data?.message || 'Failed to fetch houses');
    } finally {
      setLoading(false);
    }
  }, [filters, buildParams]);

  useEffect(() => {
    fetchHouses();
  }, [fetchHouses]);

  const handleFilterChange = <K extends keyof Filters>(field: K, value: Filters[K]) => {
    setFilters((prev) => ({ ...prev, [field]: value, page: 1 }));
  };

  const handlePageChange = (_: React.ChangeEvent<unknown>, value: number) => {
    setFilters((prev) => ({ ...prev, page: value }));
    // Scroll list to top
    document.getElementById('house-list-top')?.scrollIntoView({ behavior: 'smooth' });
  };

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setSearchInput('');
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

  const fitAllMarkers = () => {
    if (!houses.length) return;
    const pts = houses
      .map((h) => h.location?.coordinates)
      .filter(Boolean) as { lat: number; lng: number }[];
    if (!pts.length) return;
    const lat = pts.reduce((s, p) => s + p.lat, 0) / pts.length;
    const lng = pts.reduce((s, p) => s + p.lng, 0) / pts.length;
    setMapCenter([lat, lng]);
    setMapZoom(11);
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency', currency: 'USD',
      minimumFractionDigits: 0, maximumFractionDigits: 0,
    }).format(price);

  const handleMapMove = (center: [number, number], zoom: number) => {
    setMapCenter(center);
    setMapZoom(zoom);
  };

  const toggleAmenity = (key: string) => {
    setFilters((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(key)
        ? prev.amenities.filter((a) => a !== key)
        : [...prev.amenities, key],
      page: 1,
    }));
  };

  // ─── Active filter chips ────────────────────────────────────────
  const activeFilterChips = useMemo(() => {
    const chips: { key: string; label: string; onRemove: () => void }[] = [];
    if (filters.search)
      chips.push({ key: 'search', label: `Search: "${filters.search}"`, onRemove: () => { setSearchInput(''); handleFilterChange('search', ''); } });
    if (filters.propertyType !== '')
      chips.push({ key: 'propertyType', label: PROPERTY_TYPE_MAP[Number(filters.propertyType)] || 'Type', onRemove: () => handleFilterChange('propertyType', '') });
    if (filters.priceType)
      chips.push({ key: 'priceType', label: PRICE_TYPES.find(p => p.value === filters.priceType)?.label || filters.priceType, onRemove: () => handleFilterChange('priceType', '') });
    if (filters.status)
      chips.push({ key: 'status', label: `Status: ${filters.status}`, onRemove: () => handleFilterChange('status', '') });
    if (filters.city)
      chips.push({ key: 'city', label: `City: ${filters.city}`, onRemove: () => handleFilterChange('city', '') });
    if (filters.state)
      chips.push({ key: 'state', label: `State: ${filters.state}`, onRemove: () => handleFilterChange('state', '') });
    if (filters.minPrice > 0 || filters.maxPrice < PRICE_MAX)
      chips.push({ key: 'price', label: `${formatPrice(filters.minPrice)} – ${formatPrice(filters.maxPrice)}`, onRemove: () => { handleFilterChange('minPrice', 0); handleFilterChange('maxPrice', PRICE_MAX); } });
    if (filters.minArea > 0 || filters.maxArea < AREA_MAX)
      chips.push({ key: 'area', label: `${filters.minArea} – ${filters.maxArea} sqft`, onRemove: () => { handleFilterChange('minArea', 0); handleFilterChange('maxArea', AREA_MAX); } });
    if (filters.minBedrooms > 0)
      chips.push({ key: 'beds', label: `${filters.minBedrooms}+ beds`, onRemove: () => handleFilterChange('minBedrooms', 0) });
    if (filters.minBathrooms > 0)
      chips.push({ key: 'baths', label: `${filters.minBathrooms}+ baths`, onRemove: () => handleFilterChange('minBathrooms', 0) });
    if (filters.minYearBuilt > 0)
      chips.push({ key: 'year', label: `Built ≥ ${filters.minYearBuilt}`, onRemove: () => handleFilterChange('minYearBuilt', 0) });
    if (filters.hasImage)
      chips.push({ key: 'hasImage', label: 'Has Image', onRemove: () => handleFilterChange('hasImage', false) });
    filters.amenities.forEach((a) =>
      chips.push({ key: `amenity-${a}`, label: AMENITIES.find(x => x.key === a)?.label || a, onRemove: () => toggleAmenity(a) })
    );
    return chips;
  }, [filters]);

  // ─── Filter drawer content (memoized so inputs don't lose focus) ─
  const filterContent = useMemo(() => (
    <Box sx={{ p: 2, width: isMobile ? '100%' : 340 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Filters</Typography>
        <Box>
          <Tooltip title="Reset all">
            <IconButton onClick={resetFilters} size="small"><FilterAltOff /></IconButton>
          </Tooltip>
          <IconButton onClick={() => setFilterDrawerOpen(false)} size="small"><Close /></IconButton>
        </Box>
      </Box>
      <Divider sx={{ mb: 2 }} />

      {/* Search */}
      <TextField
        fullWidth size="small" label="Search by title or address"
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
        placeholder="e.g., Villa, Addis Ababa..."
        sx={{ mb: 2 }}
        InputProps={{ startAdornment: (<InputAdornment position="start"><Search fontSize="small" /></InputAdornment>) }}
      />

      {/* Property Type */}
      <FormControl fullWidth size="small" sx={{ mb: 2 }}>
        <InputLabel>Property Type</InputLabel>
        <Select
          value={filters.propertyType}
          label="Property Type"
          onChange={(e) => handleFilterChange('propertyType', e.target.value)}
        >
          <MenuItem value="">All Types</MenuItem>
          {PROPERTY_TYPES.map((t) => (
            <MenuItem key={t.value} value={String(t.value)}>{t.label}</MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Price Type + Status */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <FormControl fullWidth size="small">
          <InputLabel>Listing Type</InputLabel>
          <Select
            value={filters.priceType}
            label="Listing Type"
            onChange={(e) => handleFilterChange('priceType', e.target.value)}
          >
            {PRICE_TYPES.map((p) => <MenuItem key={p.value} value={p.value}>{p.label}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl fullWidth size="small">
          <InputLabel>Status</InputLabel>
          <Select
            value={filters.status}
            label="Status"
            onChange={(e) => handleFilterChange('status', e.target.value)}
          >
            {STATUS_OPTIONS.map((s) => <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>)}
          </Select>
        </FormControl>
      </Box>

      {/* City + State */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <Autocomplete
          freeSolo size="small" fullWidth
          options={citySuggestions}
          value={filters.city}
          onInputChange={(_, v) => handleFilterChange('city', v)}
          renderInput={(params) => <TextField {...params} label="City" />}
        />
        <Autocomplete
          freeSolo size="small" fullWidth
          options={stateSuggestions}
          value={filters.state}
          onInputChange={(_, v) => handleFilterChange('state', v)}
          renderInput={(params) => <TextField {...params} label="State" />}
        />
      </Box>

      {/* Price Range */}
      <Typography variant="body2" sx={{ mb: 1 }}>Price Range</Typography>
      <Slider
        value={[filters.minPrice, filters.maxPrice]}
        onChange={(_, v) => {
          const [min, max] = v as number[];
          handleFilterChange('minPrice', min);
          handleFilterChange('maxPrice', max);
        }}
        min={0} max={PRICE_MAX} step={100_000}
        valueLabelDisplay="auto" valueLabelFormat={formatPrice}
        sx={{ mb: 1 }}
      />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="caption">{formatPrice(filters.minPrice)}</Typography>
        <Typography variant="caption">{formatPrice(filters.maxPrice)}</Typography>
      </Box>

      {/* Area Range */}
      <Typography variant="body2" sx={{ mb: 1 }}>Area (sqft)</Typography>
      <Slider
        value={[filters.minArea, filters.maxArea]}
        onChange={(_, v) => {
          const [min, max] = v as number[];
          handleFilterChange('minArea', min);
          handleFilterChange('maxArea', max);
        }}
        min={0} max={AREA_MAX} step={50}
        valueLabelDisplay="auto"
        sx={{ mb: 1 }}
      />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="caption">{filters.minArea} sqft</Typography>
        <Typography variant="caption">{filters.maxArea} sqft</Typography>
      </Box>

      {/* Beds + Baths */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <FormControl fullWidth size="small">
          <InputLabel>Min Bedrooms</InputLabel>
          <Select
            value={filters.minBedrooms}
            label="Min Bedrooms"
            onChange={(e) => handleFilterChange('minBedrooms', Number(e.target.value))}
          >
            {[0, 1, 2, 3, 4, 5].map((n) => (
              <MenuItem key={n} value={n}>{n === 0 ? 'Any' : `${n}+`}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl fullWidth size="small">
          <InputLabel>Min Bathrooms</InputLabel>
          <Select
            value={filters.minBathrooms}
            label="Min Bathrooms"
            onChange={(e) => handleFilterChange('minBathrooms', Number(e.target.value))}
          >
            {[0, 1, 2, 3, 4].map((n) => (
              <MenuItem key={n} value={n}>{n === 0 ? 'Any' : `${n}+`}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Year built */}
      <TextField
        fullWidth size="small" type="number" label="Min Year Built"
        value={filters.minYearBuilt || ''}
        onChange={(e) => handleFilterChange('minYearBuilt', Number(e.target.value) || 0)}
        inputProps={{ min: 1900, max: new Date().getFullYear() }}
        sx={{ mb: 2 }}
      />

      {/* Amenities */}
      <Typography variant="body2" sx={{ mb: 1 }}>Amenities</Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
        {AMENITIES.map((a) => {
          const active = filters.amenities.includes(a.key);
          return (
            <Chip
              key={a.key} label={a.label} icon={a.icon} size="small"
              color={active ? 'primary' : 'default'}
              variant={active ? 'filled' : 'outlined'}
              onClick={() => toggleAmenity(a.key)}
            />
          );
        })}
      </Box>

      {/* Has image */}
      <FormControlLabel
        control={<Switch checked={filters.hasImage}
          onChange={(e) => handleFilterChange('hasImage', e.target.checked)} />}
        label="Only with images"
        sx={{ mb: 1 }}
      />

      {/* Sort */}
      <FormControl fullWidth size="small" sx={{ mt: 1, mb: 2 }}>
        <InputLabel>Sort By</InputLabel>
        <Select
          value={filters.sortBy}
          label="Sort By"
          onChange={(e) => handleFilterChange('sortBy', e.target.value)}
        >
          {SORT_OPTIONS.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
        </Select>
      </FormControl>

      <Button
        fullWidth variant="contained"
        onClick={() => setFilterDrawerOpen(false)}
        sx={{
          mt: 1,
          background: theme === 'dark'
            ? 'linear-gradient(135deg, #00ffff, #00b3b3)'
            : 'linear-gradient(135deg, #007bff, #0056b3)',
        }}
      >
        Apply Filters ({pagination.totalItems})
      </Button>
      <Button fullWidth variant="outlined" onClick={resetFilters} sx={{ mt: 1 }}>
        Reset All Filters
      </Button>
    </Box>
  ), [filters, searchInput, citySuggestions, stateSuggestions, pagination.totalItems, theme, isMobile]);

  // ─── Small helper: render badges for a house ────────────────────
  const renderBadges = (house: House) => {
    const badges: JSX.Element[] = [];
    const priceType = (house as any).pricing?.priceType || (house as any).priceType;
    const status = (house as any).status;
    const isNew = house.created_at
      ? Date.now() - new Date(house.created_at).getTime() < 7 * 24 * 3600 * 1000
      : false;
    const isFeatured = (house as any).featured;

    if (priceType === 'rent') badges.push(<Chip key="rent" size="small" icon={<VpnKey />} label="For Rent" color="secondary" />);
    else if (priceType === 'sale') badges.push(<Chip key="sale" size="small" icon={<Sell />} label="For Sale" color="primary" />);
    if (isFeatured) badges.push(<Chip key="feat" size="small" icon={<Star />} label="Featured" color="warning" />);
    if (isNew) badges.push(<Chip key="new" size="small" icon={<NewReleases />} label="New" color="success" />);
    if (status && status !== 'available')
      badges.push(<Chip key="status" size="small" label={status.toUpperCase()} color={status === 'sold' ? 'error' : 'default'} />);
    return badges;
  };

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
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: theme === 'dark' ? '#ccd6f6' : '#333333', mb: 1 }}>
          Find Properties on Map
        </Typography>
        <Typography variant="body1" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
          Search and explore properties visually on the map. Click on markers to see details, or browse the list below.
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
            borderRadius: 3, overflow: 'hidden',
            boxShadow: theme === 'dark' ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.1)',
            position: 'relative', bgcolor: '#1a1a2e', zIndex: 0,
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
            <Tooltip title="Filters">
              <Badge badgeContent={activeFilterChips.length} color="primary">
                <IconButton onClick={() => setFilterDrawerOpen(true)}
                  sx={{ backgroundColor: theme === 'dark' ? '#0f172a' : 'white', boxShadow: 2,
                    '&:hover': { backgroundColor: theme === 'dark' ? '#1e293b' : '#f8fafc' } }}>
                  <FilterList />
                </IconButton>
              </Badge>
            </Tooltip>
            <Tooltip title="Fit all markers">
              <IconButton onClick={fitAllMarkers}
                sx={{ backgroundColor: theme === 'dark' ? '#0f172a' : 'white', boxShadow: 2,
                  '&:hover': { backgroundColor: theme === 'dark' ? '#1e293b' : '#f8fafc' } }}>
                <CenterFocusStrong />
              </IconButton>
            </Tooltip>
            <Tooltip title="Reset map view">
              <IconButton onClick={() => { setMapCenter([9.03, 38.74]); setMapZoom(13); setSelectedHouse(null); }}
                sx={{ backgroundColor: theme === 'dark' ? '#0f172a' : 'white', boxShadow: 2,
                  '&:hover': { backgroundColor: theme === 'dark' ? '#1e293b' : '#f8fafc' } }}>
                <MyLocation />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* ── List section ────────────────────────────────────── */}
        <Box
          sx={{
            flex: { xs: '1 1 100%', lg: '1 1 40%' },
            height: { xs: 'auto', lg: '100%' },
            overflowY: 'auto', borderRadius: 3,
            backgroundColor: theme === 'dark' ? '#0f172a80' : 'white',
            backdropFilter: theme === 'dark' ? 'blur(10px)' : 'none',
            p: 2,
          }}
        >
          <div id="house-list-top" />

          {/* Search bar */}
          <Box sx={{ mb: 1.5, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <TextField
              inputRef={searchFieldRef}
              size="small" placeholder="Search properties... (press /)"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              InputProps={{ startAdornment: (<InputAdornment position="start"><Search sx={{ fontSize: 20 }} /></InputAdornment>) }}
              sx={{ flex: 1, minWidth: 200 }}
            />
            <Tooltip title="Filter">
              <Badge badgeContent={activeFilterChips.length} color="primary">
                <Button variant="outlined" size="small" startIcon={<FilterList />} onClick={() => setFilterDrawerOpen(true)}>
                  Filter
                </Button>
              </Badge>
            </Tooltip>
            <Button variant="outlined" size="small" startIcon={<Refresh />} onClick={resetFilters}>
              Reset
            </Button>
          </Box>

          {/* Advanced toggle */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Showing {houses.length} of {pagination.totalItems} properties
              {activeFilterChips.length > 0 && ` • ${activeFilterChips.length} filter(s)`}
            </Typography>
            <Button size="small" endIcon={filtersExpanded ? <ExpandLess /> : <ExpandMore />}
              onClick={() => setFiltersExpanded((v) => !v)}>
              {filtersExpanded ? 'Hide' : 'Advanced'} filters
            </Button>
          </Box>

          {/* Quick advanced filters (collapse) */}
          <Collapse in={filtersExpanded}>
            <Box sx={{ p: 1.5, mb: 1.5, borderRadius: 2, bgcolor: theme === 'dark' ? '#0a192f' : '#f8fafc' }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 1 }}>
                <FormControl size="small" sx={{ minWidth: 140 }}>
                  <InputLabel>Type</InputLabel>
                  <Select value={filters.propertyType} label="Type"
                    onChange={(e) => handleFilterChange('propertyType', e.target.value)}>
                    <MenuItem value="">All</MenuItem>
                    {PROPERTY_TYPES.map((t) => <MenuItem key={t.value} value={String(t.value)}>{t.label}</MenuItem>)}
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 140 }}>
                  <InputLabel>Listing</InputLabel>
                  <Select value={filters.priceType} label="Listing"
                    onChange={(e) => handleFilterChange('priceType', e.target.value)}>
                    {PRICE_TYPES.map((p) => <MenuItem key={p.value} value={p.value}>{p.label}</MenuItem>)}
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 140 }}>
                  <InputLabel>Sort</InputLabel>
                  <Select value={filters.sortBy} label="Sort"
                    onChange={(e) => handleFilterChange('sortBy', e.target.value)}>
                    {SORT_OPTIONS.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
                  </Select>
                </FormControl>
                <FormControlLabel control={
                  <Switch size="small" checked={filters.hasImage}
                    onChange={(e) => handleFilterChange('hasImage', e.target.checked)} />
                } label="Has image" />
              </Stack>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Beds</InputLabel>
                  <Select value={filters.minBedrooms} label="Beds"
                    onChange={(e) => handleFilterChange('minBedrooms', Number(e.target.value))}>
                    {[0, 1, 2, 3, 4, 5].map((n) => <MenuItem key={n} value={n}>{n === 0 ? 'Any' : `${n}+`}</MenuItem>)}
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Baths</InputLabel>
                  <Select value={filters.minBathrooms} label="Baths"
                    onChange={(e) => handleFilterChange('minBathrooms', Number(e.target.value))}>
                    {[0, 1, 2, 3, 4].map((n) => <MenuItem key={n} value={n}>{n === 0 ? 'Any' : `${n}+`}</MenuItem>)}
                  </Select>
                </FormControl>
                <TextField size="small" type="number" label="Min Year"
                  value={filters.minYearBuilt || ''}
                  onChange={(e) => handleFilterChange('minYearBuilt', Number(e.target.value) || 0)}
                  sx={{ minWidth: 120 }} />
              </Stack>
            </Box>
          </Collapse>

          {/* Active filter chips */}
          {activeFilterChips.length > 0 && (
            <Box sx={{ mb: 1.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                <Typography variant="caption" color="text.secondary">Active filters</Typography>
                <Button size="small" onClick={() => setShowActiveFilters((v) => !v)}>
                  {showActiveFilters ? 'Hide' : 'Show'}
                </Button>
              </Box>
              <Collapse in={showActiveFilters}>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {activeFilterChips.map((c) => (
                    <Chip key={c.key} label={c.label} size="small" onDelete={c.onRemove} />
                  ))}
                  <Chip label="Clear all" size="small" variant="outlined" onClick={resetFilters} />
                </Box>
              </Collapse>
            </Box>
          )}

          {/* Loading skeletons */}
          {loading ? (
            <Stack spacing={1.5}>
              {Array.from({ length: filters.limit }).map((_, i) => (
                <Card key={i} sx={{ p: 2, borderRadius: 2 }}>
                  <Stack direction="row" spacing={2}>
                    <Skeleton variant="rectangular" width={100} height={80} sx={{ borderRadius: 1 }} />
                    <Box sx={{ flex: 1 }}>
                      <Skeleton width="70%" height={24} />
                      <Skeleton width="40%" height={18} />
                      <Skeleton width="55%" height={18} />
                      <Skeleton width="30%" height={28} />
                    </Box>
                  </Stack>
                </Card>
              ))}
            </Stack>
          ) : houses.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Home sx={{ fontSize: 48, color: theme === 'dark' ? '#334155' : '#cbd5e1', mb: 2 }} />
              <Typography variant="body1">No properties found</Typography>
              <Typography variant="body2" color="text.secondary">Try adjusting your filters</Typography>
              <Button sx={{ mt: 2 }} variant="outlined" onClick={resetFilters}>Reset Filters</Button>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <AnimatePresence>
                {houses.map((house, index) => {
                  const imageUrl = getImageUrl(house._id);
                  const hasImageError = imageErrors[house._id];
                  const isSelected = selectedHouse?._id === house._id;
                  const area = house.details?.area || 0;
                  const price = house.pricing?.price || 0;
                  const pricePerSqft = area > 0 ? Math.round(price / area) : 0;
                  const typeLabel = PROPERTY_TYPE_MAP[(house as any).propertyType] || 'Property';
                  const created = house.created_at ? new Date(house.created_at) : null;
                  const daysAgo =
                    created && !isNaN(created.getTime())
                      ? Math.floor((Date.now() - created.getTime()) / 86_400_000)
                      : null;
                  return (
                    <motion.div
                      key={house._id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.03 }}
                    >
                      <Card
                        sx={{
                          borderRadius: 2, cursor: 'pointer',
                          border: isSelected
                            ? `2px solid ${theme === 'dark' ? '#00ffff' : '#007bff'}`
                            : '1px solid transparent',
                          backgroundColor: isSelected
                            ? theme === 'dark' ? '#00ffff20' : '#007bff10'
                            : theme === 'dark' ? '#0f172a80' : 'white',
                          transition: 'all 0.2s',
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: theme === 'dark'
                              ? '0 4px 12px rgba(0,0,0,0.3)'
                              : '0 4px 12px rgba(0,0,0,0.1)',
                          },
                        }}
                        onClick={() => handleViewOnMap(house)}
                      >
                        <Box sx={{ display: 'flex', p: 2, gap: 2 }}>
                          {/* Thumbnail */}
                          <Box sx={{
                            width: 120, height: 100, flexShrink: 0, borderRadius: 1,
                            overflow: 'hidden', position: 'relative',
                            bgcolor: theme === 'dark' ? '#334155' : '#e5e7eb',
                          }}>
                            {!hasImageError ? (
                              <img
                                src={imageUrl} alt={house.title}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                onError={() => handleImageError(house._id)}
                              />
                            ) : (
                              <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Home sx={{ fontSize: 32, color: theme === 'dark' ? '#a8b2d1' : '#94a3b8' }} />
                              </Box>
                            )}
                            <Chip
                              label={typeLabel}
                              size="small"
                              sx={{ position: 'absolute', top: 4, left: 4, fontSize: 10, height: 20 }}
                            />
                          </Box>

                          {/* Info */}
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography
                              variant="subtitle1"
                              sx={{ fontWeight: 'bold', mb: 0.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                            >
                              {house.title}
                            </Typography>

                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                              <LocationOn sx={{ fontSize: 12, color: 'text.secondary' }} />
                              <Typography variant="caption" color="text.secondary" noWrap>
                                {[house.location?.city, house.location?.state, house.location?.country].filter(Boolean).join(', ')}
                              </Typography>
                            </Box>

                            {/* Badges */}
                            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 0.75 }}>
                              {renderBadges(house)}
                              {daysAgo !== null && daysAgo <= 30 && (
                                <Chip size="small" icon={<CalendarToday />} label={`${daysAgo}d ago`} variant="outlined" />
                              )}
                            </Box>

                            {/* Specs */}
                            <Box sx={{ display: 'flex', gap: 1.5, mb: 0.75, flexWrap: 'wrap' }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Bed sx={{ fontSize: 12 }} />
                                <Typography variant="caption">{house.details?.bedrooms ?? 0} beds</Typography>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Bathtub sx={{ fontSize: 12 }} />
                                <Typography variant="caption">{house.details?.bathrooms ?? 0} baths</Typography>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <SquareFoot sx={{ fontSize: 12 }} />
                                <Typography variant="caption">{area.toLocaleString()} sqft</Typography>
                              </Box>
                            </Box>

                            {/* Price row */}
                            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, flexWrap: 'wrap' }}>
                              <Typography variant="h6" sx={{ fontWeight: 'bold', color: theme === 'dark' ? '#00ffff' : '#007bff' }}>
                                {formatPrice(price)}
                              </Typography>
                              {pricePerSqft > 0 && (
                                <Typography variant="caption" color="text.secondary">
                                  ${pricePerSqft}/sqft
                                </Typography>
                              )}
                            </Box>
                          </Box>

                          {/* Actions */}
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, justifyContent: 'center' }}>
                            <Tooltip title="View on Map">
                              <IconButton size="small"
                                onClick={(e) => { e.stopPropagation(); handleViewOnMap(house); }}
                                sx={{ color: theme === 'dark' ? '#00ffff' : '#007bff' }}>
                                <MapIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="View Details">
                              <IconButton size="small" href={`/public/houses/${house._id}`}
                                onClick={(e) => e.stopPropagation()}>
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
                color="primary" size="small"
              />
            </Box>
          )}
        </Box>
      </Box>

      <Drawer
        anchor="right" open={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        PaperProps={{
          sx: { backgroundColor: theme === 'dark' ? '#0f172a' : 'white', width: isMobile ? '100%' : 340 },
        }}
      >
        {filterContent}
      </Drawer>

      <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity="error" onClose={() => setError('')} sx={{ borderRadius: 2 }}>
          {error}
        </Alert>
      </Snackbar>
    </div>
  );
}