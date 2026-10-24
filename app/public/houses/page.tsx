'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Card, CardContent, Chip, IconButton,
  Button, Divider, CircularProgress, useMediaQuery, Snackbar, Alert,
  Tooltip, TextField, Select, MenuItem, FormControl, InputLabel,
  Slider, Stack, Pagination, Drawer, Skeleton, Badge, Checkbox, FormControlLabel,
  Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/lib/theme-context';
import Navbar from '@/components/ui/Navbar';
import {
  Home, LocationOn, Bed, Bathtub,
  SquareFoot, Search, FilterList, Close,
  Visibility, CheckCircle,
  Apartment, Villa, Landscape,
  Pool, FitnessCenter, Security, LocalParking, Wifi,
  Favorite, FavoriteBorder, CompareArrows, Verified,
  BookmarkBorder, Bookmark, ThreeDRotation, Whatshot,
  DirectionsCar, ClearAll, RestartAlt
} from '@mui/icons-material';
import api from '@/app/utils/api';
import { House, PropertyType, PaginationData } from '@/types/houses';
import PropertyCompareModal from '@/components/PropertyCompareModal';
import Link from 'next/link';

const propertyTypeLabels: Record<string, string> = {
  APARTMENT: 'Apartment',
  VILLA: 'Villa',
  CONDO: 'Condo',
  HOUSE: 'House',
  LAND: 'Land',
  OFFICE: 'Office',
  WAREHOUSE: 'Warehouse',
  SHOP: 'Commercial Shop'
};

const popularTags = [
  'Bole', 'Furnished', 'Luxury', 'FamilyHome', 'CMC', 'OfficeSpace',
  'Garden', 'Penthouse', 'NearAirport', 'Parking', 'TitleDeed'
];

export default function PublicHousesPage() {
  const { theme } = useTheme();
  const isMobile = useMediaQuery('(max-width: 768px)');

  const [houses, setHouses] = useState<House[]>([]);
  const [trendingHouses, setTrendingHouses] = useState<House[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [pagination, setPagination] = useState<PaginationData>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    hasNext: false,
    hasPrev: false
  });

  // Filters State
  const [filters, setFilters] = useState({
    search: '',
    transactionType: '',
    propertyType: '',
    intendedPurpose: '',
    minPrice: 0,
    maxPrice: 50000000,
    minBedrooms: 0,
    minBathrooms: 0,
    isVerified: '',
    tags: [] as string[],
    amenities: [] as string[],
    sortBy: 'created_at',
    sortOrder: 'desc',
    page: 1,
    limit: 12
  });

  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [priceRange, setPriceRange] = useState<number[]>([0, 50000000]);
  const [amenitiesList, setAmenitiesList] = useState<string[]>([]);
  const [likedHouseIds, setLikedHouseIds] = useState<Record<string, boolean>>({});

  // Side-by-Side Comparison State
  const [compareList, setCompareList] = useState<House[]>([]);
  const [compareModalOpen, setCompareModalOpen] = useState(false);

  // Saved Search Modal
  const [saveSearchModalOpen, setSaveSearchModalOpen] = useState(false);
  const [savedSearchName, setSavedSearchName] = useState('');

  const getImageUrl = (houseId: string): string => {
    const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3001/api';
    return `${serverUrl}/public/houses/${houseId}/image`;
  };

  const fetchTrending = async () => {
    try {
      const res = await api.get('/public/houses/trending?limit=4');
      if (res.data?.success) {
        setTrendingHouses(res.data.data || []);
      }
    } catch (e) {
      // Ignored
    }
  };

  const fetchHouses = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== '' && value !== 0 && value !== null && value !== undefined) {
          if (Array.isArray(value)) {
            if (value.length > 0) params.append(key, value.join(','));
          } else {
            params.append(key, value.toString());
          }
        }
      });

      const response = await api.get(`/public/houses?${params}`);
      setHouses(response.data.data?.houses || []);
      setPagination(response.data.data?.pagination || {
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        hasNext: false,
        hasPrev: false
      });
      setError('');
    } catch (err: any) {
      console.error('Error fetching houses:', err);
      setError(err.response?.data?.message || 'Failed to fetch properties');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchHouses();
  }, [fetchHouses]);

  useEffect(() => {
    fetchTrending();
  }, []);

  const handleFilterChange = (field: string, value: any) => {
    setFilters(prev => ({ ...prev, [field]: value, page: 1 }));
  };

  const handleTagToggle = (tag: string) => {
    setFilters(prev => {
      const currentTags = prev.tags || [];
      const updated = currentTags.includes(tag)
        ? currentTags.filter(t => t !== tag)
        : [...currentTags, tag];
      return { ...prev, tags: updated, page: 1 };
    });
  };

  const handleLike = async (e: React.MouseEvent, house: House) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const res = await api.post(`/properties/${house._id}/like`, {});
      if (res.data?.success) {
        const liked = res.data.data.liked;
        const newCount = res.data.data.likesCount;
        setLikedHouseIds(prev => ({ ...prev, [house._id]: liked }));
        setHouses(prev => prev.map(h => h._id === house._id ? { ...h, likesCount: newCount } : h));
        setSnackbarMessage(liked ? `Saved "${house.title}" to favorites!` : 'Removed from favorites');
      }
    } catch (err: any) {
      setSnackbarMessage('Please sign in to like properties');
    }
  };

  const toggleCompare = (e: React.MouseEvent, house: House) => {
    e.preventDefault();
    e.stopPropagation();
    if (compareList.some(p => p._id === house._id)) {
      setCompareList(prev => prev.filter(p => p._id !== house._id));
    } else {
      if (compareList.length >= 4) {
        setSnackbarMessage('You can compare a maximum of 4 properties at once');
        return;
      }
      setCompareList(prev => [...prev, house]);
      setSnackbarMessage(`Added "${house.title}" to comparison tray`);
    }
  };

  const handleSaveSearch = async () => {
    try {
      await api.post('/properties/saved-searches', {
        name: savedSearchName || `Search ${filters.transactionType || 'All'} - ${filters.search || 'Filters'}`,
        filters
      });
      setSnackbarMessage('Search alert successfully saved! We will notify you of new matches.');
      setSaveSearchModalOpen(false);
      setSavedSearchName('');
    } catch (err: any) {
      setSnackbarMessage('Please log in to save search alerts');
    }
  };

  const resetFilters = () => {
    setFilters({
      search: '',
      transactionType: '',
      propertyType: '',
      intendedPurpose: '',
      minPrice: 0,
      maxPrice: 50000000,
      minBedrooms: 0,
      minBathrooms: 0,
      isVerified: '',
      tags: [],
      amenities: [],
      sortBy: 'created_at',
      sortOrder: 'desc',
      page: 1,
      limit: 12
    });
  };

  const formatPrice = (price: number) => {
    return `ETB ${price.toLocaleString()}`;
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', pt: { xs: 8, md: 10 }, pb: 8 }}>
      <Navbar />

      <Box sx={{ maxWidth: 1320, mx: 'auto', px: { xs: 2, sm: 3 } }}>
        {/* Hero & Discovery Search Header */}
        <Box sx={{ py: 3, mb: 2 }}>
          <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', mb: 1, letterSpacing: -0.5 }}>
            Explore Verified Real Estate
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary', maxWidth: 700 }}>
            Discover apartments, villas, commercial offices, industrial warehouses, and development land across Ethiopia with interactive 3D, 360° virtual tours, and side-by-side comparison.
          </Typography>
        </Box>

        {/* Transaction Type Tabs Bar */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3, overflowX: 'auto', pb: 0.5 }}>
          {[
            { label: 'All Listings', value: '' },
            { label: 'For Rent', value: 'RENT' },
            { label: 'For Sale (Outright Purchase)', value: 'BUY' },
            { label: 'Short Stay & Furnished', value: 'SHORT_STAY' }
          ].map((tab) => (
            <Button
              key={tab.value}
              onClick={() => handleFilterChange('transactionType', tab.value)}
              variant={filters.transactionType === tab.value ? 'contained' : 'outlined'}
              sx={{
                borderRadius: 3,
                textTransform: 'none',
                fontWeight: 700,
                px: 2.5,
                py: 1,
                bgcolor: filters.transactionType === tab.value ? '#06b6d4' : 'transparent',
                borderColor: filters.transactionType === tab.value ? '#06b6d4' : 'divider',
                color: filters.transactionType === tab.value ? 'white' : 'text.primary',
                '&:hover': {
                  bgcolor: filters.transactionType === tab.value ? '#0891b2' : 'action.hover'
                }
              }}
            >
              {tab.label}
            </Button>
          ))}
        </Box>

        {/* YouTube-Style Tags Discovery Strip */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3, overflowX: 'auto', pb: 1 }}>
          <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', mr: 1, whiteSpace: 'nowrap' }}>
            Trending Tags:
          </Typography>
          {popularTags.map((tag) => {
            const isSelected = filters.tags.includes(tag);
            return (
              <Chip
                key={tag}
                label={`#${tag}`}
                onClick={() => handleTagToggle(tag)}
                clickable
                color={isSelected ? 'primary' : 'default'}
                sx={{
                  fontWeight: 600,
                  fontSize: 13,
                  bgcolor: isSelected ? '#06b6d4' : 'background.paper',
                  border: '1px solid',
                  borderColor: isSelected ? '#06b6d4' : 'divider',
                  color: isSelected ? 'white' : 'text.secondary',
                  '&:hover': { bgcolor: isSelected ? '#0891b2' : 'action.hover' }
                }}
              />
            );
          })}
        </Box>

        {/* Main Search & Filter Control Bar */}
        <Box sx={{
          display: 'flex', gap: 1.5, mb: 4, flexWrap: 'wrap',
          p: 2, bgcolor: 'background.paper', borderRadius: 3,
          boxShadow: '0 4px 20px rgba(0,0,0,0.06)', border: '1px solid', borderColor: 'divider'
        }}>
          {/* Keyword Search */}
          <TextField
            placeholder="Search by neighborhood, landmark, or description..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            sx={{ flex: { xs: '1 1 100%', md: '1 1 300px' } }}
            size="small"
            InputProps={{
              startAdornment: <Search sx={{ color: 'text.secondary', mr: 1 }} />
            }}
          />

          {/* Property Category */}
          <FormControl size="small" sx={{ minWidth: 160, flex: { xs: '1 1 45%', sm: 'none' } }}>
            <InputLabel>Category</InputLabel>
            <Select
              value={filters.propertyType}
              label="Category"
              onChange={(e) => handleFilterChange('propertyType', e.target.value)}
            >
              <MenuItem value="">All Categories</MenuItem>
              <MenuItem value="APARTMENT">Apartments</MenuItem>
              <MenuItem value="VILLA">Villas & Houses</MenuItem>
              <MenuItem value="OFFICE">Commercial Offices</MenuItem>
              <MenuItem value="WAREHOUSE">Warehouses & Storage</MenuItem>
              <MenuItem value="LAND">Development Land</MenuItem>
            </Select>
          </FormControl>

          {/* Sort By */}
          <FormControl size="small" sx={{ minWidth: 160, flex: { xs: '1 1 45%', sm: 'none' } }}>
            <InputLabel>Sort By</InputLabel>
            <Select
              value={filters.sortBy}
              label="Sort By"
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
            >
              <MenuItem value="created_at">Newest First</MenuItem>
              <MenuItem value="most_liked">Most Liked & Popular</MenuItem>
              <MenuItem value="most_viewed">Most Viewed</MenuItem>
              <MenuItem value="price">Price</MenuItem>
            </Select>
          </FormControl>

          {/* Verified Only Check */}
          <FormControlLabel
            control={
              <Checkbox
                checked={filters.isVerified === 'true'}
                onChange={(e) => handleFilterChange('isVerified', e.target.checked ? 'true' : '')}
                sx={{ color: '#06b6d4', '&.Mui-checked': { color: '#06b6d4' } }}
              />
            }
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Verified sx={{ color: '#0284c7', fontSize: 18 }} />
                <Typography variant="body2" sx={{ fontWeight: 600 }}>Verified Only</Typography>
              </Box>
            }
          />

          <Box sx={{ display: 'flex', gap: 1, ml: 'auto' }}>
            {/* Filter Drawer Toggle */}
            <Button
              variant="outlined"
              size="small"
              startIcon={<FilterList />}
              onClick={() => setFilterDrawerOpen(true)}
              sx={{ borderRadius: 2, textTransform: 'none' }}
            >
              More Filters
            </Button>

            {/* Save Search Button */}
            <Button
              variant="outlined"
              size="small"
              startIcon={<BookmarkBorder />}
              onClick={() => setSaveSearchModalOpen(true)}
              sx={{ borderRadius: 2, textTransform: 'none', color: '#10b981', borderColor: '#10b981' }}
            >
              Save Alert
            </Button>

            {/* Reset Filters */}
            <IconButton size="small" onClick={resetFilters} title="Reset All Filters">
              <RestartAlt />
            </IconButton>
          </Box>
        </Box>

        {/* Trending Strip Banner */}
        {trendingHouses.length > 0 && !filters.search && !filters.propertyType && (
          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Whatshot sx={{ color: '#f43f5e' }} />
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                Trending & Most Viewed Properties
              </Typography>
            </Box>

            <Box sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
              gap: 2.5
            }}>
              {trendingHouses.map((house) => (
                <Card
                  key={house._id}
                  component={Link}
                  href={`/public/houses/${house._id}`}
                  sx={{
                    textDecoration: 'none',
                    borderRadius: 3,
                    border: '1px solid',
                    borderColor: 'divider',
                    position: 'relative',
                    transition: 'all 0.3s',
                    '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 12px 30px rgba(0,0,0,0.1)' }
                  }}
                >
                  <Box sx={{ position: 'relative', height: 180, bgcolor: '#0f172a' }}>
                    <Box
                      component="img"
                      src={getImageUrl(house._id)}
                      alt={house.title}
                      onError={(e: any) => {
                        e.target.src = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=400&q=80';
                      }}
                      sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <Box sx={{ position: 'absolute', top: 10, left: 10, display: 'flex', gap: 0.5 }}>
                      <Chip
                        size="small"
                        icon={<Whatshot sx={{ fontSize: '14px !important', color: 'white' }} />}
                        label="Trending"
                        sx={{ bgcolor: '#f43f5e', color: 'white', fontWeight: 700, fontSize: 11 }}
                      />
                    </Box>
                  </Box>

                  <CardContent sx={{ p: 2 }}>
                    <Typography variant="caption" sx={{ color: '#06b6d4', fontWeight: 700 }}>
                      {house.location.neighborhood || house.location.city}
                    </Typography>
                    <Typography sx={{ fontWeight: 700, fontSize: 15, color: 'text.primary', mb: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {house.title}
                    </Typography>
                    <Typography sx={{ fontWeight: 800, color: 'text.primary', fontSize: 16 }}>
                      {formatPrice(house.pricing.price)}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Box>
          </Box>
        )}

        {/* Results Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
            Showing {pagination.totalItems} available {pagination.totalItems === 1 ? 'property' : 'properties'}
          </Typography>
        </Box>

        {/* Property Grid List */}
        {loading ? (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }, gap: 3 }}>
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <Skeleton key={n} variant="rounded" height={360} sx={{ borderRadius: 3 }} />
            ))}
          </Box>
        ) : houses.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 10, bgcolor: 'background.paper', borderRadius: 3, border: '1px dashed', borderColor: 'divider' }}>
            <Home sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>No properties match your current filters</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>Try broadening your search criteria or resetting filters.</Typography>
            <Button variant="contained" onClick={resetFilters} sx={{ borderRadius: 2, bgcolor: '#06b6d4' }}>
              Clear All Filters
            </Button>
          </Box>
        ) : (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }, gap: 3 }}>
            {houses.map((house) => {
              const isLiked = likedHouseIds[house._id];
              const isInCompare = compareList.some(p => p._id === house._id);

              return (
                <Card
                  key={house._id}
                  sx={{
                    borderRadius: 3,
                    border: '1px solid',
                    borderColor: isInCompare ? '#06b6d4' : 'divider',
                    bgcolor: 'background.paper',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'all 0.3s',
                    position: 'relative',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 12px 30px rgba(0,0,0,0.08)'
                    }
                  }}
                >
                  {/* Property Image & Overlay Badges */}
                  <Box sx={{ position: 'relative', height: 230, bgcolor: '#0f172a' }}>
                    <Link href={`/public/houses/${house._id}`}>
                      <Box
                        component="img"
                        src={getImageUrl(house._id)}
                        alt={house.title}
                        onError={(e: any) => {
                          e.target.src = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80';
                        }}
                        sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </Link>

                    {/* Top Badges */}
                    <Box sx={{ position: 'absolute', top: 12, left: 12, display: 'flex', gap: 0.8, flexWrap: 'wrap' }}>
                      <Chip
                        size="small"
                        label={house.transactionType || 'RENT'}
                        sx={{
                          bgcolor: house.transactionType === 'BUY' ? '#10b981' : '#06b6d4',
                          color: 'white',
                          fontWeight: 700,
                          fontSize: 11
                        }}
                      />
                      {house.isVerified && (
                        <Chip
                          size="small"
                          icon={<Verified sx={{ fontSize: '14px !important', color: 'white' }} />}
                          label="Verified"
                          sx={{ bgcolor: 'rgba(2, 132, 199, 0.9)', color: 'white', fontWeight: 600, fontSize: 11 }}
                        />
                      )}
                      {house.panoramic360?.enabled && (
                        <Chip
                          size="small"
                          icon={<ThreeDRotation sx={{ fontSize: '14px !important', color: 'white' }} />}
                          label="360°"
                          sx={{ bgcolor: 'rgba(168, 85, 247, 0.9)', color: 'white', fontWeight: 700, fontSize: 11 }}
                        />
                      )}
                    </Box>

                    {/* Top Right Heart Like & Compare */}
                    <Box sx={{ position: 'absolute', top: 12, right: 12, display: 'flex', gap: 0.5 }}>
                      <Tooltip title={isInCompare ? 'Remove from compare' : 'Compare side-by-side'}>
                        <IconButton
                          size="small"
                          onClick={(e) => toggleCompare(e, house)}
                          sx={{
                            bgcolor: isInCompare ? '#06b6d4' : 'rgba(15, 23, 42, 0.7)',
                            color: 'white',
                            '&:hover': { bgcolor: '#0891b2' }
                          }}
                        >
                          <CompareArrows fontSize="small" />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title={isLiked ? 'Unlike' : 'Like listing'}>
                        <IconButton
                          size="small"
                          onClick={(e) => handleLike(e, house)}
                          sx={{
                            bgcolor: 'rgba(15, 23, 42, 0.7)',
                            color: isLiked ? '#f43f5e' : 'white',
                            '&:hover': { bgcolor: 'rgba(15, 23, 42, 0.9)' }
                          }}
                        >
                          {isLiked ? <Favorite fontSize="small" /> : <FavoriteBorder fontSize="small" />}
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>

                  {/* Card Content */}
                  <CardContent sx={{ p: 2.5, flex: 1, display: 'flex', flexDirection: 'column' }}>
                    {/* Location */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                      <LocationOn sx={{ color: 'text.secondary', fontSize: 16 }} />
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                        {house.location.neighborhood ? `${house.location.neighborhood}, ` : ''}{house.location.city}
                      </Typography>
                    </Box>

                    {/* Title */}
                    <Typography
                      component={Link}
                      href={`/public/houses/${house._id}`}
                      sx={{
                        fontWeight: 700,
                        fontSize: 16,
                        color: 'text.primary',
                        textDecoration: 'none',
                        mb: 1.5,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        '&:hover': { color: '#06b6d4' }
                      }}
                    >
                      {house.title}
                    </Typography>

                    {/* Tags Row */}
                    {(house.tags && house.tags.length > 0) && (
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 2 }}>
                        {house.tags.slice(0, 3).map((t, idx) => (
                          <Chip
                            key={idx}
                            label={`#${t}`}
                            size="small"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleTagToggle(t);
                            }}
                            sx={{ fontSize: 11, height: 22, bgcolor: 'action.hover' }}
                          />
                        ))}
                      </Box>
                    )}

                    {/* Details Pill (Bed, Bath, Area) */}
                    <Box sx={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      py: 1.2, px: 2, bgcolor: 'action.hover', borderRadius: 2, mb: 2
                    }}>
                      {house.details.bedrooms > 0 && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Bed sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="caption" sx={{ fontWeight: 600 }}>{house.details.bedrooms} Beds</Typography>
                        </Box>
                      )}
                      {house.details.bathrooms > 0 && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Bathtub sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="caption" sx={{ fontWeight: 600 }}>{house.details.bathrooms} Baths</Typography>
                        </Box>
                      )}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <SquareFoot sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="caption" sx={{ fontWeight: 600 }}>{house.details.area} m²</Typography>
                      </Box>
                    </Box>

                    {/* Price & Action Button */}
                    <Box sx={{ mt: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>Price</Typography>
                        <Typography variant="h6" sx={{ fontWeight: 800, color: '#06b6d4', lineHeight: 1.1 }}>
                          {formatPrice(house.pricing.price)}
                          <Typography component="span" sx={{ fontSize: 12, color: 'text.secondary', ml: 0.5 }}>
                            {house.transactionType === 'RENT' ? '/ mo' : ''}
                          </Typography>
                        </Typography>
                      </Box>

                      <Button
                        component={Link}
                        href={`/public/houses/${house._id}`}
                        variant="contained"
                        size="small"
                        sx={{
                          borderRadius: 2,
                          bgcolor: '#06b6d4',
                          '&:hover': { bgcolor: '#0891b2' },
                          textTransform: 'none',
                          fontWeight: 700
                        }}
                      >
                        Explore Details
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              );
            })}
          </Box>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
            <Pagination
              count={pagination.totalPages}
              page={pagination.currentPage}
              onChange={(_, page) => handleFilterChange('page', page)}
              color="primary"
              size="large"
            />
          </Box>
        )}
      </Box>

      {/* Floating Bottom Comparison Tray */}
      {compareList.length > 0 && (
        <Box sx={{
          position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          bgcolor: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(10px)',
          px: 3, py: 1.5, borderRadius: 4, zIndex: 50,
          boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
          display: 'flex', alignItems: 'center', gap: 2,
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <Typography sx={{ color: 'white', fontWeight: 600, fontSize: 14 }}>
            {compareList.length} properties selected for comparison
          </Typography>

          <Button
            variant="contained"
            size="small"
            onClick={() => setCompareModalOpen(true)}
            startIcon={<CompareArrows />}
            sx={{
              bgcolor: '#06b6d4',
              '&:hover': { bgcolor: '#0891b2' },
              borderRadius: 2,
              fontWeight: 700,
              textTransform: 'none'
            }}
          >
            Compare Now
          </Button>

          <IconButton size="small" onClick={() => setCompareList([])} sx={{ color: '#94a3b8' }}>
            <Close fontSize="small" />
          </IconButton>
        </Box>
      )}

      {/* Side-by-Side Compare Modal */}
      <PropertyCompareModal
        open={compareModalOpen}
        onClose={() => setCompareModalOpen(false)}
        properties={compareList}
        onRemoveProperty={(id) => setCompareList(prev => prev.filter(p => p._id !== id))}
      />

      {/* Save Search Modal */}
      <Dialog open={saveSearchModalOpen} onClose={() => setSaveSearchModalOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Save Search Alert</DialogTitle>
        <DialogContent dividers sx={{ py: 2 }}>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
            Receive instant notifications when new properties matching your current criteria are listed!
          </Typography>
          <TextField
            label="Search Alert Name"
            fullWidth
            placeholder="e.g. Bole 3-Bed Apartments Under 70k"
            value={savedSearchName}
            onChange={(e) => setSavedSearchName(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setSaveSearchModalOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveSearch} sx={{ bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' } }}>
            Save Alert
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notification Snackbar */}
      <Snackbar
        open={Boolean(snackbarMessage)}
        autoHideDuration={3000}
        onClose={() => setSnackbarMessage('')}
        message={snackbarMessage}
      />
    </Box>
  );
}