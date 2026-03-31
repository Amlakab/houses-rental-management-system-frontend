'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Card, CardContent, Chip, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Divider, CircularProgress, useMediaQuery, Snackbar, Alert,
  Tooltip, TextField, Select, MenuItem, FormControl, InputLabel,
  Slider, Stack, Pagination, Drawer,
  Toolbar, Skeleton
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/lib/theme-context';
import Navbar from '@/components/ui/Navbar';
import {
  Home, LocationOn, AttachMoney, Bed, Bathtub,
  SquareFoot, Search, FilterList, Close,
  Visibility, ShoppingCart, CheckCircle,
  Cancel, Apartment, Villa, Landscape,
  Pool, FitnessCenter, Security, LocalParking, Wifi,
  Map as MapIcon, Image as ImageIcon
} from '@mui/icons-material';
import api from '@/app/utils/api';
import { House, PropertyType, PaginationData } from '@/types/houses';

const propertyTypeIcons: Record<PropertyType, React.ReactElement> = {
  [PropertyType.APARTMENT]: <Apartment />,
  [PropertyType.VILLA]: <Villa />,
  [PropertyType.CONDO]: <Villa />,
  [PropertyType.HOUSE]: <Home />,
  [PropertyType.LAND]: <Landscape />
};

const propertyTypeLabels: Record<PropertyType, string> = {
  [PropertyType.APARTMENT]: 'Apartment',
  [PropertyType.VILLA]: 'Villa',
  [PropertyType.CONDO]: 'Condo',
  [PropertyType.HOUSE]: 'House',
  [PropertyType.LAND]: 'Land'
};

const amenityIcons: Record<string, React.ReactElement> = {
  pool: <Pool />,
  gym: <FitnessCenter />,
  security: <Security />,
  parking: <LocalParking />,
  wifi: <Wifi />
};

const PublicHousesPage = () => {
  const { theme } = useTheme();
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  const [houses, setHouses] = useState<House[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState<PaginationData>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    hasNext: false,
    hasPrev: false
  });
  const [filters, setFilters] = useState({
    search: '',
    propertyType: '',
    minPrice: 0,
    maxPrice: 1000000,
    minBedrooms: 0,
    minBathrooms: 0,
    amenities: [] as string[],
    sortBy: 'created_at',
    sortOrder: 'desc',
    page: 1,
    limit: 12
  });
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [priceRange, setPriceRange] = useState<number[]>([0, 1000000]);
  const [amenitiesList, setAmenitiesList] = useState<string[]>([]);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  // Use the same image URL pattern as detail page but with API endpoint
  const getImageUrl = (houseId: string): string => {
    const serverUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    return `${serverUrl}/api/public/houses/${houseId}/image`;
  };

  const handleImageError = (houseId: string) => {
    setImageErrors(prev => ({ ...prev, [houseId]: true }));
  };

  const fetchHouses = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== '' && value !== 0) {
          if (key === 'amenities' && Array.isArray(value)) {
            if (value.length > 0) params.append(key, value.join(','));
          } else {
            params.append(key, value.toString());
          }
        }
      });

      const response = await api.get(`/public/houses?${params}`);
      setHouses(response.data.data.houses || []);
      setPagination(response.data.data.pagination);
      setError('');
    } catch (error: any) {
      console.error('Error fetching houses:', error);
      setError(error.response?.data?.message || 'Failed to fetch houses');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const fetchFilterOptions = useCallback(async () => {
    try {
      const response = await api.get('/public/houses/filter-options');
      setAmenitiesList(response.data.data.amenities || []);
      const priceRangeData = response.data.data.priceRange;
      if (priceRangeData) {
        setPriceRange([priceRangeData.minPrice, priceRangeData.maxPrice]);
        setFilters(prev => ({
          ...prev,
          minPrice: priceRangeData.minPrice,
          maxPrice: priceRangeData.maxPrice
        }));
      }
    } catch (error: any) {
      console.error('Failed to fetch filter options:', error);
    }
  }, []);

  useEffect(() => {
    fetchHouses();
  }, [fetchHouses]);

  useEffect(() => {
    fetchFilterOptions();
  }, []);

  const handleFilterChange = (field: string, value: any) => {
    setFilters(prev => ({ ...prev, [field]: value, page: 1 }));
  };

  const handlePriceChange = (event: Event, newValue: number | number[]) => {
    const value = newValue as number[];
    setPriceRange(value);
    setFilters(prev => ({ ...prev, minPrice: value[0], maxPrice: value[1], page: 1 }));
  };

  const handleAmenityToggle = (amenity: string) => {
    const updated = filters.amenities.includes(amenity)
      ? filters.amenities.filter(a => a !== amenity)
      : [...filters.amenities, amenity];
    handleFilterChange('amenities', updated);
  };

  const resetFilters = () => {
    setFilters({
      search: '',
      propertyType: '',
      minPrice: priceRange[0],
      maxPrice: priceRange[1],
      minBedrooms: 0,
      minBathrooms: 0,
      amenities: [],
      sortBy: 'created_at',
      sortOrder: 'desc',
      page: 1,
      limit: 12
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  const FilterContent = () => (
    <Box sx={{ p: 2, width: isMobile ? '100%' : 320 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', color: theme === 'dark' ? '#ccd6f6' : '#333333' }}>
          Filters
        </Typography>
        <IconButton onClick={() => setFilterDrawerOpen(false)}>
          <Close />
        </IconButton>
      </Box>
      
      <Divider sx={{ mb: 2 }} />
      
      <FormControl fullWidth size="small" sx={{ mb: 2 }}>
        <InputLabel>Property Type</InputLabel>
        <Select
          value={filters.propertyType}
          label="Property Type"
          onChange={(e) => handleFilterChange('propertyType', e.target.value)}
        >
          <MenuItem value="">All Types</MenuItem>
          {Object.entries(propertyTypeLabels).map(([value, label]) => (
            <MenuItem key={value} value={value}>{label}</MenuItem>
          ))}
        </Select>
      </FormControl>
      
      <Typography variant="body2" sx={{ mb: 1, color: theme === 'dark' ? '#a8b2d1' : '#666666' }}>
        Price Range
      </Typography>
      <Slider
        value={priceRange}
        onChange={handlePriceChange}
        min={0}
        max={1000000}
        step={10000}
        valueLabelDisplay="auto"
        valueLabelFormat={(value) => formatPrice(value)}
        sx={{ mb: 2 }}
      />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="caption">{formatPrice(priceRange[0])}</Typography>
        <Typography variant="caption">{formatPrice(priceRange[1])}</Typography>
      </Box>
      
      <TextField
        fullWidth
        size="small"
        label="Min Bedrooms"
        type="number"
        value={filters.minBedrooms}
        onChange={(e) => handleFilterChange('minBedrooms', parseInt(e.target.value))}
        sx={{ mb: 2 }}
      />
      
      <TextField
        fullWidth
        size="small"
        label="Min Bathrooms"
        type="number"
        value={filters.minBathrooms}
        onChange={(e) => handleFilterChange('minBathrooms', parseInt(e.target.value))}
        sx={{ mb: 2 }}
      />
      
      <Typography variant="body2" sx={{ mb: 1, color: theme === 'dark' ? '#a8b2d1' : '#666666' }}>
        Amenities
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
        {amenitiesList.map(amenity => (
          <Chip
            key={amenity}
            label={amenity}
            icon={amenityIcons[amenity] || <CheckCircle />}
            onClick={() => handleAmenityToggle(amenity)}
            color={filters.amenities.includes(amenity) ? 'primary' : 'default'}
            sx={{
              backgroundColor: filters.amenities.includes(amenity)
                ? (theme === 'dark' ? '#00ffff20' : '#007bff10')
                : (theme === 'dark' ? '#334155' : '#e5e7eb')
            }}
          />
        ))}
      </Box>
      
      <Button
        fullWidth
        variant="outlined"
        onClick={resetFilters}
        sx={{ mt: 2 }}
      >
        Reset All Filters
      </Button>
    </Box>
  );

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      theme === 'dark' 
        ? 'bg-gradient-to-br from-[#0a192f] to-[#112240]' 
        : 'bg-gradient-to-br from-[#f0f0f0] to-[#ffffff]'
    }`}>
      <Navbar />
      <Toolbar />
      
      <Box sx={{ pt: 10, pb: 4, px: { xs: 2, md: 4 } }}>
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography variant={isMobile ? "h4" : "h3"} sx={{ fontWeight: 'bold', color: theme === 'dark' ? '#00ffff' : '#007bff', mb: 2 }}>
              Find Your Dream Home
            </Typography>
            <Typography variant="body1" color={theme === 'dark' ? '#a8b2d1' : '#666666'} sx={{ maxWidth: 600, mx: 'auto' }}>
              Discover the perfect property from our curated collection of homes, apartments, and villas
            </Typography>
            
            {/* <Button
              variant="outlined"
              startIcon={<MapIcon />}
              onClick={() => window.location.href = '/public/map'}
              sx={{
                mt: 2,
                borderColor: theme === 'dark' ? '#00ffff' : '#007bff',
                color: theme === 'dark' ? '#00ffff' : '#007bff',
                '&:hover': {
                  borderColor: theme === 'dark' ? '#00b3b3' : '#0056b3',
                  backgroundColor: theme === 'dark' ? '#00ffff20' : '#007bff10'
                }
              }}
            >
              View on Map
            </Button> */}
          </Box>
        </motion.div>
        
        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card sx={{ mb: 4, borderRadius: 3, backgroundColor: theme === 'dark' ? '#0f172a80' : 'white', backdropFilter: theme === 'dark' ? 'blur(10px)' : 'none' }}>
            <CardContent>
              <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', md: 'row' } }}>
                <TextField
                  fullWidth
                  placeholder="Search by title, location, or description..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  InputProps={{ startAdornment: <Search sx={{ mr: 1 }} /> }}
                  sx={{ flex: 1 }}
                />
                <FormControl sx={{ minWidth: 150 }}>
                  <Select
                    value={filters.sortBy}
                    onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                  >
                    <MenuItem value="created_at">Newest First</MenuItem>
                    <MenuItem value="pricing.price">Price: Low to High</MenuItem>
                    <MenuItem value="-pricing.price">Price: High to Low</MenuItem>
                    <MenuItem value="details.area">Size: Small to Large</MenuItem>
                    <MenuItem value="-details.area">Size: Large to Small</MenuItem>
                  </Select>
                </FormControl>
                <Button
                  variant="outlined"
                  startIcon={<FilterList />}
                  onClick={() => setFilterDrawerOpen(true)}
                >
                  Filters
                </Button>

                <Button
                  variant="outlined"
                  startIcon={<MapIcon />}
                  onClick={() => window.location.href = '/public/map'}
                  sx={{
                    mt: { xs: 1, md: 0 },
                    borderColor: theme === 'dark' ? '#00ffff' : '#007bff',
                    color: theme === 'dark' ? '#00ffff' : '#007bff',
                    '&:hover': {
                      borderColor: theme === 'dark' ? '#00b3b3' : '#0056b3',
                      backgroundColor: theme === 'dark' ? '#00ffff20' : '#007bff10'
                    }
                  }}
                >
                  View on Map
                </Button>

              </Box>
            </CardContent>
          </Card>
        </motion.div>
        
        {/* Results Count */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="body2" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
            Showing {houses.length} of {pagination.totalItems} properties
          </Typography>
        </Box>
        
        {/* Houses Grid */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
            <CircularProgress size={60} sx={{ color: theme === 'dark' ? '#00ffff' : '#007bff' }} />
          </Box>
        ) : houses.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Home sx={{ fontSize: 64, color: theme === 'dark' ? '#334155' : '#cbd5e1', mb: 2 }} />
            <Typography variant="h6" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>No properties found</Typography>
            <Typography variant="body2" color={theme === 'dark' ? '#94a3b8' : '#999999'}>Try adjusting your search filters</Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
            <AnimatePresence>
              {houses.map((house, index) => {
                const imageUrl = getImageUrl(house._id);
                const hasImageError = imageErrors[house._id];
                
                return (
                  <Box key={house._id} sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 24px)', md: '1 1 calc(33.33% - 24px)' }, minWidth: { xs: '100%', sm: '300px' } }}>
                    <motion.div
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.05 }}
                      whileHover={{ y: -8 }}
                    >
                      <Card sx={{ 
                        height: '100%',
                        borderRadius: 3,
                        overflow: 'hidden',
                        boxShadow: theme === 'dark' ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.1)',
                        border: theme === 'dark' ? '1px solid #334155' : '1px solid #e5e7eb',
                        backgroundColor: theme === 'dark' ? '#0f172a80' : 'white',
                        backdropFilter: theme === 'dark' ? 'blur(10px)' : 'none',
                        transition: 'all 0.3s ease',
                        cursor: 'pointer'
                      }}
                      onClick={() => window.location.href = `/public/houses/${house._id}`}
                      >
                        <Box sx={{ position: 'relative', height: 220, overflow: 'hidden', backgroundColor: theme === 'dark' ? '#1e293b' : '#f5f5f5' }}>
                          {!hasImageError ? (
                            <img 
                              src={imageUrl} 
                              alt={house.title}
                              style={{ 
                                width: '100%', 
                                height: '100%', 
                                objectFit: 'cover',
                                display: 'block'
                              }}
                              onError={() => handleImageError(house._id)}
                            />
                          ) : (
                            <Box sx={{ 
                              width: '100%', 
                              height: '100%', 
                              backgroundColor: theme === 'dark' ? '#334155' : '#e5e7eb', 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center',
                              flexDirection: 'column',
                              gap: 1
                            }}>
                              <Home sx={{ fontSize: 48, color: theme === 'dark' ? '#a8b2d1' : '#94a3b8' }} />
                              <Typography variant="caption" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                                No Image Available
                              </Typography>
                            </Box>
                          )}
                          <Chip
                            label={propertyTypeLabels[house.propertyType]}
                            size="small"
                            icon={propertyTypeIcons[house.propertyType]}
                            sx={{ position: 'absolute', top: 12, right: 12, height: 24, backgroundColor: theme === 'dark' ? '#334155' : '#e5e7eb', zIndex: 1 }}
                          />
                          {house.details.amenities.slice(0, 2).map((amenity, i) => (
                            <Chip
                              key={amenity}
                              label={amenity}
                              size="small"
                              sx={{ 
                                position: 'absolute', 
                                bottom: 12, 
                                left: 12 + (i * 80), 
                                height: 24, 
                                backgroundColor: theme === 'dark' ? '#00ffff20' : '#007bff10', 
                                color: theme === 'dark' ? '#00ffff' : '#007bff',
                                fontSize: '0.7rem',
                                zIndex: 1
                              }}
                            />
                          ))}
                        </Box>
                        
                        <CardContent>
                          <Typography variant="h6" sx={{ fontWeight: 'bold', color: theme === 'dark' ? '#ccd6f6' : '#333333', mb: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {house.title}
                          </Typography>
                          
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                            <LocationOn sx={{ fontSize: 14, color: theme === 'dark' ? '#a8b2d1' : '#666666' }} />
                            <Typography variant="caption" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                              {house.location.city}, {house.location.state}
                            </Typography>
                          </Box>
                          
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <Bed sx={{ fontSize: 14, color: theme === 'dark' ? '#a8b2d1' : '#666666' }} />
                              <Typography variant="body2" color={theme === 'dark' ? '#ccd6f6' : '#333333'}>{house.details.bedrooms}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <Bathtub sx={{ fontSize: 14, color: theme === 'dark' ? '#a8b2d1' : '#666666' }} />
                              <Typography variant="body2" color={theme === 'dark' ? '#ccd6f6' : '#333333'}>{house.details.bathrooms}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <SquareFoot sx={{ fontSize: 14, color: theme === 'dark' ? '#a8b2d1' : '#666666' }} />
                              <Typography variant="body2" color={theme === 'dark' ? '#ccd6f6' : '#333333'}>{house.details.area.toLocaleString()} sqft</Typography>
                            </Box>
                          </Box>
                          
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="h5" sx={{ fontWeight: 'bold', color: theme === 'dark' ? '#00ffff' : '#007bff' }}>
                              {formatPrice(house.pricing.price)}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <Tooltip title="View on Map">
                                <IconButton
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    window.location.href = `/public/map?house=${house._id}`;
                                  }}
                                  sx={{ 
                                    color: theme === 'dark' ? '#00ffff' : '#007bff',
                                    '&:hover': { backgroundColor: theme === 'dark' ? '#00ffff20' : '#007bff10' }
                                  }}
                                >
                                  <MapIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Button
                                size="small"
                                variant="contained"
                                startIcon={<Visibility />}
                                sx={{
                                  background: theme === 'dark' ? 'linear-gradient(135deg, #00ffff, #00b3b3)' : 'linear-gradient(135deg, #007bff, #0056b3)',
                                  borderRadius: 2
                                }}
                              >
                                View Details
                              </Button>
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </Box>
                );
              })}
            </AnimatePresence>
          </Box>
        )}
        
        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <Pagination
              count={pagination.totalPages}
              page={filters.page}
              onChange={(e, page) => handleFilterChange('page', page)}
              color="primary"
              size={isMobile ? "small" : "medium"}
              showFirstButton
              showLastButton
              sx={{
                '& .MuiPaginationItem-root': {
                  color: theme === 'dark' ? '#ccd6f6' : '#333333',
                  '&.Mui-selected': { backgroundColor: theme === 'dark' ? '#00ffff' : '#007bff', color: theme === 'dark' ? '#0a192f' : 'white' }
                }
              }}
            />
          </Box>
        )}
        
        {/* Filter Drawer */}
        <Drawer
          anchor="right"
          open={filterDrawerOpen}
          onClose={() => setFilterDrawerOpen(false)}
          PaperProps={{ sx: { backgroundColor: theme === 'dark' ? '#0f172a' : 'white' } }}
        >
          <FilterContent />
        </Drawer>
        
        <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError('')} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
          <Alert severity="error" onClose={() => setError('')} sx={{ borderRadius: 2 }}>{error}</Alert>
        </Snackbar>
      </Box>
    </div>
  );
};

export default PublicHousesPage;