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
import { useLanguage } from '@/lib/language-context';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import {
  Home, LocationOn, Bed, Bathtub,
  SquareFoot, Search, FilterList, Close,
  Visibility, CheckCircle,
  Apartment, Villa, Landscape,
  Pool, FitnessCenter, Security, LocalParking, Wifi,
  Favorite, FavoriteBorder, CompareArrows, Verified,
  BookmarkBorder, Bookmark, ThreeDRotation, Whatshot,
  DirectionsCar, ClearAll, RestartAlt, Check
} from '@mui/icons-material';
import api from '@/app/utils/api';
import { House, PropertyType, PaginationData } from '@/types/houses';
import PropertyCompareModal from '@/components/PropertyCompareModal';
import Link from 'next/link';

const popularTags = [
  'Bole', 'Furnished', 'Luxury', 'FamilyHome', 'CMC', 'OfficeSpace',
  'Garden', 'Penthouse', 'NearAirport', 'Parking', 'TitleDeed'
];

const availableAmenities = [
  'Parking', 'Security System', 'High Speed Wifi', 'Swimming Pool',
  'Fitness Center / Gym', 'Backup Generator', 'Water Reservoir', 'Elevator'
];

export default function PublicHousesPage() {
  const { theme } = useTheme();
  const { t, isAmharic } = useLanguage();
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
    maxPrice: 10000000000,
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
      setError(err.response?.data?.message || (isAmharic ? 'ቤቶችን መጫን አልተቻለም' : 'Failed to fetch properties'));
    } finally {
      setLoading(false);
    }
  }, [filters, isAmharic]);

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

  const handleAmenityToggle = (amenity: string) => {
    setFilters(prev => {
      const current = prev.amenities || [];
      const updated = current.includes(amenity)
        ? current.filter(a => a !== amenity)
        : [...current, amenity];
      return { ...prev, amenities: updated, page: 1 };
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
        setSnackbarMessage(liked ? (isAmharic ? `"${house.title}" ወደ ተወዳጆች ተቀምጧል!` : `Saved "${house.title}" to favorites!`) : (isAmharic ? 'ከተወዳጆች ተወግዷል' : 'Removed from favorites'));
      }
    } catch (err: any) {
      setSnackbarMessage(isAmharic ? 'ቤቶችን ወደ ተወዳጅ ለማስገባት እባክዎ ይግቡ' : 'Please sign in to like properties');
    }
  };

  const toggleCompare = (e: React.MouseEvent, house: House) => {
    e.preventDefault();
    e.stopPropagation();
    if (compareList.some(p => p._id === house._id)) {
      setCompareList(prev => prev.filter(p => p._id !== house._id));
    } else {
      if (compareList.length >= 4) {
        setSnackbarMessage(isAmharic ? 'በአንድ ጊዜ እስከ 4 ቤቶችን ብቻ ማወዳደር ይችላሉ' : 'You can compare a maximum of 4 properties at once');
        return;
      }
      setCompareList(prev => [...prev, house]);
      setSnackbarMessage(isAmharic ? `"${house.title}" ወደ ማወዳደሪያ ተጨምሯል` : `Added "${house.title}" to comparison tray`);
    }
  };

  const handleSaveSearch = async () => {
    try {
      await api.post('/properties/saved-searches', {
        name: savedSearchName || `Search ${filters.transactionType || 'All'} - ${filters.search || 'Filters'}`,
        filters
      });
      setSnackbarMessage(isAmharic ? 'የፍለጋ ማንቂያ በተሳካ ሁኔታ ተቀምጧል!' : 'Search alert successfully saved! We will notify you of new matches.');
      setSaveSearchModalOpen(false);
      setSavedSearchName('');
    } catch (err: any) {
      setSnackbarMessage(isAmharic ? 'የፍለጋ ማንቂያ ለማስቀመጥ እባክዎ ይግቡ' : 'Please log in to save search alerts');
    }
  };

  const resetFilters = () => {
    setPriceRange([0, 50000000]);
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

  const applyPriceRange = () => {
    setFilters(prev => ({
      ...prev,
      minPrice: priceRange[0],
      maxPrice: priceRange[1],
      page: 1
    }));
  };

  const formatPrice = (price: number) => {
    return `ETB ${price.toLocaleString()}`;
  };

  const propertyTypeAmharic: Record<string, string> = {
    APARTMENT: 'አፓርታማ',
    VILLA: 'ቪላ እና መኖሪያ',
    CONDO: 'ኮንዶሚኒየም',
    HOUSE: 'መኖሪያ ቤት',
    LAND: 'መሬት',
    OFFICE: 'የንግድ ቢሮ',
    WAREHOUSE: 'መጋዘን',
    SHOP: 'የንግድ ሱቅ'
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default', pt: { xs: '64px', sm: '76px' } }}>
      <Navbar />

      <Box component="main" sx={{ flex: 1, maxWidth: 1360, width: '100%', mx: 'auto', px: { xs: 2, sm: 3, md: 4 }, py: 3 }}>
        {/* Hero & Discovery Search Header */}
        <Box sx={{ py: 2, mb: 2 }}>
          <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', mb: 1, letterSpacing: -0.5, fontSize: { xs: '1.75rem', sm: '2.25rem' } }}>
            {isAmharic ? 'የተረጋገጡ ቤቶች እና ሕንፃዎችን ያስሱ' : 'Explore Verified Real Estate'}
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary', maxWidth: 760, fontSize: { xs: '0.9rem', sm: '1rem' } }}>
            {isAmharic
              ? 'በኢትዮጵያ ውስጥ ምርጥ አፓርታማዎችን፣ ቪላዎችን፣ ቢሮዎችን እና የመሬት ይዞታዎችን በ 360° ምናባዊ እይታ እና ማወዳደሪያ አማካኝነት ያግኙ።'
              : 'Discover apartments, villas, commercial offices, industrial warehouses, and development land across Ethiopia with interactive 3D, 360° virtual tours, and side-by-side comparison.'}
          </Typography>
        </Box>

        {/* Transaction Type Tabs Bar */}
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          mb: 2.5,
          overflowX: 'auto',
          pb: 1,
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          '&::-webkit-scrollbar': { display: 'none' }
        }}>
          {[
            { label: isAmharic ? 'ሁሉም ቤቶች' : 'All Listings', value: '' },
            { label: isAmharic ? 'የሚከራዩ' : 'For Rent', value: 'RENT' },
            { label: isAmharic ? 'የሚሸጡ' : 'For Sale', value: 'BUY' },
            { label: isAmharic ? 'የአጭር ጊዜ ቆይታ' : 'Short Stay & Furnished', value: 'SHORT_STAY' }
          ].map((tab) => (
            <Button
              key={tab.value}
              onClick={() => handleFilterChange('transactionType', tab.value)}
              variant={filters.transactionType === tab.value ? 'contained' : 'outlined'}
              size="small"
              sx={{
                borderRadius: 2.5,
                textTransform: 'none',
                fontWeight: 700,
                px: { xs: 1.5, sm: 2 },
                py: 0.8,
                whiteSpace: 'nowrap',
                flexShrink: 0,
                fontSize: { xs: 12, sm: 13 },
                bgcolor: filters.transactionType === tab.value ? 'primary.main' : 'transparent',
                borderColor: filters.transactionType === tab.value ? 'primary.main' : 'divider',
                color: filters.transactionType === tab.value ? 'white' : 'text.primary',
                '&:hover': {
                  bgcolor: filters.transactionType === tab.value ? 'primary.dark' : 'action.hover'
                }
              }}
            >
              {tab.label}
            </Button>
          ))}
        </Box>

        {/* Popular Tags Discovery Strip */}
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          mb: 3,
          overflowX: 'auto',
          pb: 1,
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          '&::-webkit-scrollbar': { display: 'none' }
        }}>
          <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', mr: 0.5, whiteSpace: 'nowrap', flexShrink: 0 }}>
            {isAmharic ? 'ተመራጭ አካባቢዎች:' : 'Trending Tags:'}
          </Typography>
          {popularTags.map((tag) => {
            const isSelected = filters.tags.includes(tag);
            return (
              <Chip
                key={tag}
                label={`#${tag}`}
                onClick={() => handleTagToggle(tag)}
                clickable
                size="small"
                sx={{
                  fontWeight: 600,
                  fontSize: 12,
                  flexShrink: 0,
                  bgcolor: isSelected ? 'primary.main' : 'background.paper',
                  border: '1px solid',
                  borderColor: isSelected ? 'primary.main' : 'divider',
                  color: isSelected ? 'white' : 'text.secondary',
                  '&:hover': { bgcolor: isSelected ? 'primary.dark' : 'action.hover' }
                }}
              />
            );
          })}
        </Box>

        {/* Main Search & Filter Control Bar */}
        <Box sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 1.5,
          mb: 4,
          p: { xs: 1.5, sm: 2 },
          bgcolor: 'background.paper',
          borderRadius: 3,
          boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
          border: '1px solid',
          borderColor: 'divider'
        }}>
          {/* Keyword Search */}
          <TextField
            fullWidth
            placeholder={isAmharic ? 'በአካባቢ፣ ምልክት ወይም መግለጫ ይፈልጉ...' : 'Search by neighborhood, landmark, or description...'}
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            size="small"
            InputProps={{
              startAdornment: <Search sx={{ color: 'text.secondary', mr: 1, fontSize: 20 }} />
            }}
          />

          {/* Controls Row: Category, Sort, Verified, Action Buttons */}
          <Box sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            gap: 1.5,
            alignItems: { xs: 'stretch', md: 'center' },
            justifyContent: 'space-between'
          }}>
            {/* Dropdowns Row */}
            <Box sx={{
              display: 'grid',
              gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: '180px 180px' },
              gap: 1.5
            }}>
              {/* Property Category */}
              <FormControl size="small" fullWidth>
                <InputLabel>{t('property.type', 'Category')}</InputLabel>
                <Select
                  value={filters.propertyType}
                  label={t('property.type', 'Category')}
                  onChange={(e) => handleFilterChange('propertyType', e.target.value)}
                >
                  <MenuItem value="">{isAmharic ? 'ሁሉም ዓይነቶች' : 'All Categories'}</MenuItem>
                  <MenuItem value="APARTMENT">{isAmharic ? 'አፓርታማ' : 'Apartments'}</MenuItem>
                  <MenuItem value="VILLA">{isAmharic ? 'ቪላ እና ቤቶች' : 'Villas & Houses'}</MenuItem>
                  <MenuItem value="OFFICE">{isAmharic ? 'የንግድ ቢሮዎች' : 'Commercial Offices'}</MenuItem>
                  <MenuItem value="WAREHOUSE">{isAmharic ? 'መጋዘኖች' : 'Warehouses & Storage'}</MenuItem>
                  <MenuItem value="LAND">{isAmharic ? 'የልማት መሬት' : 'Development Land'}</MenuItem>
                </Select>
              </FormControl>

              {/* Sort By */}
              <FormControl size="small" fullWidth>
                <InputLabel>{isAmharic ? 'አስተካክል በ' : 'Sort By'}</InputLabel>
                <Select
                  value={filters.sortBy}
                  label={isAmharic ? 'አስተካክል በ' : 'Sort By'}
                  onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                >
                  <MenuItem value="created_at">{isAmharic ? 'አዳዲሶች' : 'Newest'}</MenuItem>
                  <MenuItem value="most_liked">{isAmharic ? 'ተወዳጅ' : 'Most Liked'}</MenuItem>
                  <MenuItem value="most_viewed">{isAmharic ? 'በብዛት የታዩ' : 'Most Viewed'}</MenuItem>
                  <MenuItem value="price">{isAmharic ? 'በዋጋ' : 'Price'}</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {/* Filter Toggle, Save Alert, Reset & Verified */}
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 1,
              flexWrap: 'wrap'
            }}>
              {/* Verified Only Checkbox */}
              <FormControlLabel
                control={
                  <Checkbox
                    checked={filters.isVerified === 'true'}
                    onChange={(e) => handleFilterChange('isVerified', e.target.checked ? 'true' : '')}
                    size="small"
                    color="primary"
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Verified sx={{ color: 'primary.main', fontSize: 17 }} />
                    <Typography variant="body2" sx={{ fontWeight: 600, fontSize: { xs: 12, sm: 13 } }}>
                      {isAmharic ? 'የተረጋገጡ' : 'Verified'}
                    </Typography>
                  </Box>
                }
                sx={{ mr: 0.5 }}
              />

              {/* Action Buttons */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<FilterList />}
                  onClick={() => setFilterDrawerOpen(true)}
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: { xs: 12, sm: 13 },
                    px: { xs: 1.2, sm: 1.8 }
                  }}
                >
                  {isAmharic ? 'ማጣሪያ' : 'Filters'}
                </Button>

                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<BookmarkBorder />}
                  onClick={() => setSaveSearchModalOpen(true)}
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: { xs: 12, sm: 13 },
                    px: { xs: 1.2, sm: 1.8 },
                    color: 'success.main',
                    borderColor: 'success.main',
                    '&:hover': { borderColor: 'success.dark', bgcolor: 'success.main', color: 'white' }
                  }}
                >
                  {isAmharic ? 'ማንቂያ' : 'Save'}
                </Button>

                <Tooltip title={isAmharic ? 'ሁሉንም ማጣሪያዎች ሰርዝ' : 'Reset All Filters'}>
                  <IconButton size="small" onClick={resetFilters} sx={{ border: '1px solid', borderColor: 'divider' }}>
                    <RestartAlt fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Trending Strip Banner */}
        {trendingHouses.length > 0 && !filters.search && !filters.propertyType && (
          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Whatshot sx={{ color: '#f43f5e' }} />
              <Typography variant="h6" sx={{ fontWeight: 800, fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
                {isAmharic ? 'በብዛት የታዩ እና ተወዳጅ ቤቶች' : 'Trending & Most Viewed Properties'}
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
                    bgcolor: 'background.paper',
                    position: 'relative',
                    transition: 'all 0.3s ease',
                    '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 12px 24px rgba(0,0,0,0.08)' }
                  }}
                >
                  <Box sx={{ position: 'relative', height: 170, bgcolor: 'action.hover' }}>
                    <Box
                      component="img"
                      src={getImageUrl(house._id)}
                      alt={house.title}
                      onError={(e: any) => {
                        e.target.src = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=400&q=80';
                      }}
                      sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <Box sx={{ position: 'absolute', top: 10, left: 10 }}>
                      <Chip
                        size="small"
                        icon={<Whatshot sx={{ fontSize: '14px !important', color: 'white' }} />}
                        label={isAmharic ? 'ተወዳጅ' : 'Trending'}
                        sx={{ bgcolor: '#f43f5e', color: 'white', fontWeight: 700, fontSize: 11 }}
                      />
                    </Box>
                  </Box>

                  <CardContent sx={{ p: 2 }}>
                    <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 700, display: 'block', mb: 0.5 }}>
                      {house.location.neighborhood || house.location.city}
                    </Typography>
                    <Typography sx={{ fontWeight: 700, fontSize: 14, color: 'text.primary', mb: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {house.title}
                    </Typography>
                    <Typography sx={{ fontWeight: 800, color: 'text.primary', fontSize: 15 }}>
                      {formatPrice(house.pricing.price)}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Box>
          </Box>
        )}

        {/* Results Count Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
            {isAmharic
              ? `${pagination.totalItems} የሚገኙ ቤቶች ተገኝተዋል`
              : `Showing ${pagination.totalItems} available ${pagination.totalItems === 1 ? 'property' : 'properties'}`}
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
          <Box sx={{ textAlign: 'center', py: 10, px: 3, bgcolor: 'background.paper', borderRadius: 3, border: '1px dashed', borderColor: 'divider' }}>
            <Home sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
            <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary', mb: 1 }}>
              {isAmharic ? 'ከመረጡት ማጣሪያ ጋር የሚስማማ ቤት አልተገኘም' : 'No properties match your current filters'}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
              {isAmharic ? 'እባክዎ የማጣሪያ መስፈርቶችን በማስተካከል እንደገና ይሞክሩ።' : 'Try broadening your search criteria or resetting filters.'}
            </Typography>
            <Button variant="contained" onClick={resetFilters} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}>
              {isAmharic ? 'ሁሉንም ማጣሪያዎች ሰርዝ' : 'Clear All Filters'}
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
                    borderColor: isInCompare ? 'primary.main' : 'divider',
                    bgcolor: 'background.paper',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'all 0.3s ease',
                    position: 'relative',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 12px 28px rgba(0,0,0,0.08)'
                    }
                  }}
                >
                  {/* Property Image & Badges */}
                  <Box sx={{ position: 'relative', height: 220, bgcolor: 'action.hover' }}>
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
                    <Box sx={{
                      position: 'absolute',
                      top: 12,
                      left: 12,
                      display: 'flex',
                      gap: 0.8,
                      flexWrap: 'wrap',
                      maxWidth: 'calc(100% - 92px)',
                      zIndex: 2
                    }}>
                      <Chip
                        size="small"
                        label={house.transactionType === 'BUY' ? (isAmharic ? 'ሽያጭ' : 'FOR SALE') : (isAmharic ? 'ኪራይ' : 'FOR RENT')}
                        sx={{
                          bgcolor: house.transactionType === 'BUY' ? 'success.main' : 'primary.main',
                          color: 'white',
                          fontWeight: 700,
                          fontSize: 11
                        }}
                      />
                      {house.isVerified && (
                        <Chip
                          size="small"
                          icon={<Verified sx={{ fontSize: '14px !important', color: 'white' }} />}
                          label={isAmharic ? 'የተረጋገጠ' : 'Verified'}
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

                    {/* Top Right Action Icons */}
                    <Box sx={{ position: 'absolute', top: 12, right: 12, display: 'flex', gap: 0.5 }}>
                      <Tooltip title={isInCompare ? (isAmharic ? 'ከማወዳደሪያ አስወግድ' : 'Remove from compare') : (isAmharic ? 'አወዳድር' : 'Compare side-by-side')}>
                        <IconButton
                          size="small"
                          onClick={(e) => toggleCompare(e, house)}
                          sx={{
                            bgcolor: isInCompare ? 'primary.main' : 'rgba(15, 23, 42, 0.7)',
                            color: 'white',
                            '&:hover': { bgcolor: isInCompare ? 'primary.dark' : 'rgba(15, 23, 42, 0.9)' }
                          }}
                        >
                          <CompareArrows fontSize="small" />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title={isLiked ? (isAmharic ? 'ከተወዳጆች አስወግድ' : 'Unlike') : (isAmharic ? 'ወደ ተወዳጆች ጨምር' : 'Like listing')}>
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
                      <LocationOn sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                        {house.location.neighborhood ? `${house.location.neighborhood}, ` : ''}{house.location.city}
                      </Typography>
                    </Box>

                    {/* Title */}
                    <Typography
                      component={Link}
                      href={`/public/houses/${house._id}`}
                      variant="h6"
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
                        lineHeight: 1.3,
                        '&:hover': { color: 'primary.main' }
                      }}
                    >
                      {house.title}
                    </Typography>

                    {/* Specs Row */}
                    <Box sx={{
                      display: 'flex',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      columnGap: 2,
                      rowGap: 0.8,
                      mb: 2,
                      py: 1,
                      borderTop: '1px solid',
                      borderBottom: '1px solid',
                      borderColor: 'divider'
                    }}>
                      {house.details.bedrooms > 0 && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Bed sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.primary', fontSize: { xs: 11.5, sm: 12 } }}>
                            {house.details.bedrooms} {isAmharic ? 'መኝታ' : 'Beds'}
                          </Typography>
                        </Box>
                      )}
                      {house.details.bathrooms > 0 && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Bathtub sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.primary', fontSize: { xs: 11.5, sm: 12 } }}>
                            {house.details.bathrooms} {isAmharic ? 'መታጠቢያ' : 'Baths'}
                          </Typography>
                        </Box>
                      )}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <SquareFoot sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.primary', fontSize: { xs: 11.5, sm: 12 } }}>
                          {house.details.area} m²
                        </Typography>
                      </Box>
                    </Box>

                    {/* Price & Action Button */}
                    <Box sx={{
                      mt: 'auto',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 1,
                      flexWrap: 'wrap'
                    }}>
                      <Box sx={{ minWidth: 0, flex: '1 1 auto' }}>
                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontSize: 11 }}>
                          {isAmharic ? 'ዋጋ' : 'Price'}
                        </Typography>
                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: 800,
                            color: 'primary.main',
                            lineHeight: 1.1,
                            fontSize: { xs: 15, sm: 17 },
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          {formatPrice(house.pricing.price)}
                          <Typography component="span" sx={{ fontSize: 11, color: 'text.secondary', ml: 0.5 }}>
                            {house.transactionType === 'RENT' ? (isAmharic ? '/ወር' : '/ mo') : ''}
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
                          textTransform: 'none',
                          fontWeight: 700,
                          fontSize: { xs: 12, sm: 13 },
                          px: { xs: 1.5, sm: 2 },
                          py: 0.8,
                          flexShrink: 0,
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {isAmharic ? 'ዝርዝር' : 'Explore Details'}
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
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6, mb: 4 }}>
            <Pagination
              count={pagination.totalPages}
              page={pagination.currentPage}
              onChange={(_, page) => handleFilterChange('page', page)}
              color="primary"
              size={isMobile ? 'medium' : 'large'}
            />
          </Box>
        )}
      </Box>

      {/* Floating Bottom Comparison Tray */}
      {compareList.length > 0 && (
        <Box sx={{
          position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)',
          bgcolor: theme === 'dark' ? 'rgba(15, 23, 42, 0.95)' : 'rgba(30, 41, 59, 0.95)',
          backdropFilter: 'blur(10px)',
          px: { xs: 2, sm: 3 }, py: 1.5, borderRadius: 3, zIndex: 50,
          boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
          display: 'flex', alignItems: 'center', gap: 2,
          maxWidth: '94vw', width: 'auto',
          border: '1px solid rgba(255,255,255,0.15)'
        }}>
          <Typography sx={{ color: 'white', fontWeight: 600, fontSize: 13, display: { xs: 'none', sm: 'block' } }}>
            {isAmharic
              ? `${compareList.length} ቤቶች ለማወዳደር ተመርጠዋል`
              : `${compareList.length} properties selected`}
          </Typography>

          <Button
            variant="contained"
            size="small"
            onClick={() => setCompareModalOpen(true)}
            startIcon={<CompareArrows />}
            sx={{
              borderRadius: 2,
              fontWeight: 700,
              textTransform: 'none',
              fontSize: 13
            }}
          >
            {isAmharic ? 'አሁን አወዳድር' : 'Compare Now'}
          </Button>

          <IconButton size="small" onClick={() => setCompareList([])} sx={{ color: '#94a3b8' }}>
            <Close fontSize="small" />
          </IconButton>
        </Box>
      )}

      {/* Slide-out Full Filters Drawer */}
      <Drawer
        anchor="right"
        open={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        PaperProps={{
          sx: {
            width: { xs: '100vw', sm: 380 },
            maxWidth: '100vw',
            bgcolor: 'background.paper',
            p: 3,
            display: 'flex',
            flexDirection: 'column'
          }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 2, borderBottom: '1px solid', borderColor: 'divider', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FilterList sx={{ color: 'primary.main' }} />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {isAmharic ? 'ዝርዝር ማጣሪያዎች' : 'Filter Properties'}
            </Typography>
          </Box>
          <IconButton size="small" onClick={() => setFilterDrawerOpen(false)}>
            <Close />
          </IconButton>
        </Box>

        <Box sx={{ flex: 1, overflowY: 'auto', pr: 0.5, display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Price Range Slider */}
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
              {isAmharic ? 'የዋጋ ክልል (ብር)' : 'Price Range (ETB)'}
            </Typography>
            <Box sx={{ px: 1 }}>
              <Slider
                value={priceRange}
                onChange={(_, newValue) => setPriceRange(newValue as number[])}
                onChangeCommitted={applyPriceRange}
                valueLabelDisplay="auto"
                min={0}
                max={50000000}
                step={500000}
                valueLabelFormat={(val) => `ETB ${(val / 1000000).toFixed(1)}M`}
              />
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', color: 'text.secondary', fontSize: 12 }}>
              <span>0 ETB</span>
              <span>50M+ ETB</span>
            </Box>
          </Box>

          {/* Bedrooms */}
          <FormControl fullWidth size="small">
            <InputLabel>{isAmharic ? 'አነስተኛ መኝታ ክፍሎች' : 'Min Bedrooms'}</InputLabel>
            <Select
              value={filters.minBedrooms}
              label={isAmharic ? 'አነስተኛ መኝታ ክፍሎች' : 'Min Bedrooms'}
              onChange={(e) => handleFilterChange('minBedrooms', e.target.value)}
            >
              <MenuItem value={0}>{isAmharic ? 'ማናቸውም' : 'Any'}</MenuItem>
              <MenuItem value={1}>1+ {isAmharic ? 'ክፍል' : 'Bed'}</MenuItem>
              <MenuItem value={2}>2+ {isAmharic ? 'ክፍሎች' : 'Beds'}</MenuItem>
              <MenuItem value={3}>3+ {isAmharic ? 'ክፍሎች' : 'Beds'}</MenuItem>
              <MenuItem value={4}>4+ {isAmharic ? 'ክፍሎች' : 'Beds'}</MenuItem>
              <MenuItem value={5}>5+ {isAmharic ? 'ክፍሎች' : 'Beds'}</MenuItem>
            </Select>
          </FormControl>

          {/* Bathrooms */}
          <FormControl fullWidth size="small">
            <InputLabel>{isAmharic ? 'አነስተኛ መታጠቢያ ክፍሎች' : 'Min Bathrooms'}</InputLabel>
            <Select
              value={filters.minBathrooms}
              label={isAmharic ? 'አነስተኛ መታጠቢያ ክፍሎች' : 'Min Bathrooms'}
              onChange={(e) => handleFilterChange('minBathrooms', e.target.value)}
            >
              <MenuItem value={0}>{isAmharic ? 'ማናቸውም' : 'Any'}</MenuItem>
              <MenuItem value={1}>1+ {isAmharic ? 'ክፍል' : 'Bath'}</MenuItem>
              <MenuItem value={2}>2+ {isAmharic ? 'ክፍሎች' : 'Baths'}</MenuItem>
              <MenuItem value={3}>3+ {isAmharic ? 'ክፍሎች' : 'Baths'}</MenuItem>
            </Select>
          </FormControl>

          {/* Intended Purpose */}
          <FormControl fullWidth size="small">
            <InputLabel>{isAmharic ? 'የንብረት ዓላማ' : 'Intended Purpose'}</InputLabel>
            <Select
              value={filters.intendedPurpose}
              label={isAmharic ? 'የንብረት ዓላማ' : 'Intended Purpose'}
              onChange={(e) => handleFilterChange('intendedPurpose', e.target.value)}
            >
              <MenuItem value="">{isAmharic ? 'ሁሉም ዓላማዎች' : 'All Purposes'}</MenuItem>
              <MenuItem value="RESIDENTIAL">{isAmharic ? 'መኖሪያ' : 'Residential'}</MenuItem>
              <MenuItem value="COMMERCIAL">{isAmharic ? 'ለንግድ' : 'Commercial'}</MenuItem>
              <MenuItem value="MIXED_USE">{isAmharic ? 'ድብልቅ አገልግሎት' : 'Mixed Use'}</MenuItem>
              <MenuItem value="INDUSTRIAL">{isAmharic ? 'ኢንዱስትሪ / ማምረቻ' : 'Industrial'}</MenuItem>
            </Select>
          </FormControl>

          {/* Amenities Multi-Checkboxes */}
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
              {isAmharic ? 'ተጨማሪ አገልግሎቶች' : 'Amenities & Features'}
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {availableAmenities.map((amenity) => {
                const checked = filters.amenities.includes(amenity);
                return (
                  <FormControlLabel
                    key={amenity}
                    control={
                      <Checkbox
                        size="small"
                        checked={checked}
                        onChange={() => handleAmenityToggle(amenity)}
                      />
                    }
                    label={<Typography variant="body2">{amenity}</Typography>}
                  />
                );
              })}
            </Box>
          </Box>
        </Box>

        {/* Drawer Footer Actions */}
        <Box sx={{ pt: 2, borderTop: '1px solid', borderColor: 'divider', display: 'flex', gap: 1.5, mt: 'auto' }}>
          <Button
            fullWidth
            variant="outlined"
            onClick={resetFilters}
            sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2 }}
          >
            {isAmharic ? 'እንደገና ጀምር' : 'Reset'}
          </Button>
          <Button
            fullWidth
            variant="contained"
            onClick={() => setFilterDrawerOpen(false)}
            sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}
          >
            {isAmharic ? 'አሳይ' : 'Apply'}
          </Button>
        </Box>
      </Drawer>

      {/* Side-by-Side Compare Modal */}
      <PropertyCompareModal
        open={compareModalOpen}
        onClose={() => setCompareModalOpen(false)}
        properties={compareList}
        onRemoveProperty={(id) => setCompareList(prev => prev.filter(p => p._id !== id))}
      />

      {/* Save Search Modal */}
      <Dialog open={saveSearchModalOpen} onClose={() => setSaveSearchModalOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {isAmharic ? 'የፍለጋ ማንቂያ አስቀምጥ' : 'Save Search Alert'}
        </DialogTitle>
        <DialogContent dividers sx={{ py: 2 }}>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
            {isAmharic
              ? 'አዳዲስ ቤቶች ከእርስዎ ምርጫ ጋር ሲመጡ ወዲያውኑ ማሳወቂያ ይደርስዎታል!'
              : 'Receive instant notifications when new properties matching your current criteria are listed!'}
          </Typography>
          <TextField
            label={isAmharic ? 'የማንቂያ ስም' : 'Search Alert Name'}
            fullWidth
            placeholder={isAmharic ? 'ምሳሌ፡ ቦሌ 3 መኝታ አፓርታማ' : 'e.g. Bole 3-Bed Apartments Under 70k'}
            value={savedSearchName}
            onChange={(e) => setSavedSearchName(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setSaveSearchModalOpen(false)}>
            {isAmharic ? 'ሰርዝ' : 'Cancel'}
          </Button>
          <Button variant="contained" onClick={handleSaveSearch} color="success">
            {isAmharic ? 'አስቀምጥ' : 'Save Alert'}
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

      <Footer />
    </Box>
  );
}