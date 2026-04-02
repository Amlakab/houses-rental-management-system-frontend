'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Card, CardContent, CardActions,
  TextField, Chip, Alert, Snackbar, CircularProgress,
  useMediaQuery, Pagination, MenuItem, Select,
  FormControl, InputLabel, IconButton, Dialog,
  DialogTitle, DialogContent, DialogActions, Button,
  Tooltip, ToggleButton, ToggleButtonGroup,
  Divider
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/lib/theme-context';
import {
  Home, Visibility, Edit, Delete, Add,
  Search, Refresh, CheckCircle, Cancel,
  HourglassEmpty, LocationOn, AttachMoney,
  Bed, Bathtub, SquareFoot, TrendingUp,
  Apartment, Villa, Landscape,
  Approval, Inventory, FilterList
} from '@mui/icons-material';
import api from '@/app/utils/api';
import { House, HouseStatus, ApprovalStatus, PropertyType, PaginationData, HouseStats } from '@/types/houses';
import { format } from 'date-fns';

const propertyTypeLabels: Record<PropertyType, string> = {
  [PropertyType.APARTMENT]: 'Apartment',
  [PropertyType.VILLA]: 'Villa',
  [PropertyType.CONDO]: 'Condo',
  [PropertyType.HOUSE]: 'House',
  [PropertyType.LAND]: 'Land'
};

const statusColors: Record<string, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
  [HouseStatus.AVAILABLE]: 'success',
  [HouseStatus.SOLD]: 'error',
  [HouseStatus.RENTED]: 'warning',
  [HouseStatus.UNAVAILABLE]: 'default',
  [HouseStatus.PENDING_APPROVAL]: 'info'
};

const statusIcons: Record<string, React.ReactElement> = {
  [HouseStatus.AVAILABLE]: <CheckCircle fontSize="small" />,
  [HouseStatus.SOLD]: <Cancel fontSize="small" />,
  [HouseStatus.RENTED]: <HourglassEmpty fontSize="small" />,
  [HouseStatus.UNAVAILABLE]: <Cancel fontSize="small" />,
  [HouseStatus.PENDING_APPROVAL]: <Approval fontSize="small" />
};

const AdminHousesPage = () => {
  const { theme } = useTheme();
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  const [houses, setHouses] = useState<House[]>([]);
  const [stats, setStats] = useState<HouseStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [pagination, setPagination] = useState<PaginationData>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    hasNext: false,
    hasPrev: false
  });
  const [viewMode, setViewMode] = useState<'list' | 'cards'>('cards');
  const [selectedHouse, setSelectedHouse] = useState<House | null>(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openApproveDialog, setOpenApproveDialog] = useState(false);
  const [approveAction, setApproveAction] = useState<'approve' | 'reject'>('approve');
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const [imageLoading, setImageLoading] = useState<Record<string, boolean>>({});


  const [filterOptions, setFilterOptions] = useState({
    propertyTypes: [] as string[],
    statuses: [] as string[],
    approvalStatuses: [] as string[],
    amenities: [] as string[],
    features: [] as string[],
    bedroomOptions: [] as Array<{ _id: number; count: number }>,
    bathroomOptions: [] as Array<{ _id: number; count: number }>
  });

  const [filters, setFilters] = useState({
    search: '',
    propertyType: '',
    status: '',
    approvalStatus: '',
    minPrice: '',
    maxPrice: '',
    minBedrooms: '',
    minBathrooms: '',
    amenities: [] as string[],
    sortBy: 'created_at',
    sortOrder: 'desc',
    page: 1,
    limit: 12
  });

 const getImageUrl = (houseId: string): string => {
  const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3001/api';
  const url = `${serverUrl}/houses/${houseId}/image`;
  console.log('Image URL for house:', houseId, url); // Debug log
  return url;
};

  const handleImageError = (houseId: string) => {
    setImageErrors(prev => ({ ...prev, [houseId]: true }));
  };

  const fetchFilterOptions = useCallback(async () => {
    try {
      const response = await api.get('/houses/filter-options');
      setFilterOptions(response.data.data);
    } catch (error: any) {
      console.error('Failed to fetch filter options:', error);
    }
  }, []);

  const fetchHouses = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== '' && value !== 0) {
          if (key === 'amenities' && Array.isArray(value) && value.length > 0) {
            params.append(key, value.join(','));
          } else if (value !== undefined && value !== null && value !== '') {
            params.append(key, value.toString());
          }
        }
      });

      const response = await api.get(`/houses?${params}`);
      setHouses(response.data.data.houses || []);
      setPagination(response.data.data.pagination);
      setError('');
      setImageErrors({});
    } catch (error: any) {
      console.error('Error fetching houses:', error);
      setError(error.response?.data?.message || 'Failed to fetch houses');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await api.get('/houses/stats');
      setStats(response.data.data);
    } catch (error: any) {
      console.error('Failed to fetch stats:', error);
    }
  }, []);

  useEffect(() => {
    fetchFilterOptions();
    fetchHouses();
    fetchStats();
  }, [fetchHouses, fetchStats, fetchFilterOptions]);

  const handleFilterChange = (field: string, value: any) => {
    setFilters(prev => ({ ...prev, [field]: value, page: 1 }));
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    handleFilterChange('page', value);
  };

  const resetFilters = () => {
    setFilters({
      search: '',
      propertyType: '',
      status: '',
      approvalStatus: '',
      minPrice: '',
      maxPrice: '',
      minBedrooms: '',
      minBathrooms: '',
      amenities: [],
      sortBy: 'created_at',
      sortOrder: 'desc',
      page: 1,
      limit: 12
    });
  };

  const handleApproveHouse = async () => {
    if (!selectedHouse) return;
    try {
      await api.patch(`/houses/${selectedHouse._id}/approve`, {
        approvalStatus: approveAction === 'approve' ? ApprovalStatus.APPROVED : ApprovalStatus.REJECTED,
        status: approveAction === 'approve' ? HouseStatus.AVAILABLE : undefined
      });
      setSuccess(`House ${approveAction === 'approve' ? 'approved' : 'rejected'} successfully`);
      setOpenApproveDialog(false);
      fetchHouses();
      fetchStats();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to update house approval');
    }
  };

  const handleDeleteHouse = async () => {
    if (!selectedHouse) return;
    try {
      await api.delete(`/houses/${selectedHouse._id}`);
      setSuccess('House deleted successfully');
      setOpenDeleteDialog(false);
      fetchHouses();
      fetchStats();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to delete house');
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch {
      return 'Invalid date';
    }
  };

  const statCards = [
    { title: 'Total Houses', value: stats?.totalHouses || 0, icon: <Home />, color: '#00ffff', description: 'All properties' },
    { title: 'Available', value: stats?.availableHouses || 0, icon: <CheckCircle />, color: '#00ff00', description: 'Ready for sale/rent' },
    { title: 'Pending Approval', value: stats?.pendingApproval || 0, icon: <Approval />, color: '#ff9900', description: 'Awaiting review' },
    { title: 'Total Views', value: stats?.totalViews || 0, icon: <TrendingUp />, color: '#00ffff', description: 'Total views count' }
  ];

  const textFieldStyle = {
    '& .MuiOutlinedInput-root': {
      backgroundColor: theme === 'dark' ? '#1e293b' : 'white',
      color: theme === 'dark' ? '#ccd6f6' : '#333333',
      '& fieldset': { borderColor: theme === 'dark' ? '#334155' : '#e5e7eb' },
      '&:hover fieldset': { borderColor: theme === 'dark' ? '#00ffff' : '#007bff' },
      '&.Mui-focused fieldset': { borderColor: theme === 'dark' ? '#00ffff' : '#007bff' }
    },
    '& .MuiInputLabel-root': { color: theme === 'dark' ? '#a8b2d1' : '#666666' },
    '& .MuiInputLabel-root.Mui-focused': { color: theme === 'dark' ? '#00ffff' : '#007bff' }
  };

  const selectStyle = {
    backgroundColor: theme === 'dark' ? '#1e293b' : 'white',
    color: theme === 'dark' ? '#ccd6f6' : '#333333',
    '& .MuiOutlinedInput-notchedOutline': { borderColor: theme === 'dark' ? '#334155' : '#e5e7eb' },
    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: theme === 'dark' ? '#00ffff' : '#007bff' },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: theme === 'dark' ? '#00ffff' : '#007bff' }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      theme === 'dark' 
        ? 'bg-gradient-to-br from-[#0a192f] to-[#112240]' 
        : 'bg-gradient-to-br from-[#f0f0f0] to-[#ffffff]'
    }`}>
      <Box sx={{ py: 3, px: { xs: 2, md: 4 } }}>
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Box sx={{ mb: 4, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, gap: 2 }}>
            <Box>
              <Typography variant={isMobile ? "h5" : "h4"} sx={{ fontWeight: 'bold', color: theme === 'dark' ? '#ccd6f6' : '#333333', mb: 1 }}>
                House Management
              </Typography>
              <Typography variant="body2" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                Manage all properties, approve listings, and track performance
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<Add />}
              href="/admin/houses/create"
              sx={{
                background: theme === 'dark' ? 'linear-gradient(135deg, #00ffff, #00b3b3)' : 'linear-gradient(135deg, #007bff, #0056b3)',
                borderRadius: 2, px: 3, py: 1,
                '&:hover': { background: theme === 'dark' ? 'linear-gradient(135deg, #00b3b3, #008080)' : 'linear-gradient(135deg, #0056b3, #004080)' }
              }}
            >
              Add New Property
            </Button>
          </Box>
        </motion.div>

        {/* Statistics Cards */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 4 }}>
            {statCards.map((stat, index) => (
              <Box key={index} sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 16px)', md: '1 1 calc(25% - 16px)' }, minWidth: { xs: '100%', sm: '200px' } }}>
                <Card sx={{ borderRadius: 3, borderLeft: `4px solid ${stat.color}`, backgroundColor: theme === 'dark' ? '#0f172a80' : 'white', backdropFilter: theme === 'dark' ? 'blur(10px)' : 'none' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box>
                        <Typography variant="h3" sx={{ fontWeight: 'bold', color: theme === 'dark' ? '#ccd6f6' : '#333333', fontSize: { xs: '2rem', md: '2.5rem' } }}>
                          {stat.value.toLocaleString()}
                        </Typography>
                        <Typography variant="body2" color={theme === 'dark' ? '#a8b2d1' : '#666666'} sx={{ fontWeight: 500 }}>{stat.title}</Typography>
                        <Typography variant="caption" color={theme === 'dark' ? '#94a3b8' : '#999999'}>{stat.description}</Typography>
                      </Box>
                      <Box sx={{ width: 56, height: 56, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: theme === 'dark' ? `${stat.color}20` : `${stat.color}10` }}>
                        <Box sx={{ color: stat.color }}>{stat.icon}</Box>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            ))}
          </Box>
        </motion.div>

        {/* Filters Section */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
          <Card sx={{ mb: 4, borderRadius: 3, backgroundColor: theme === 'dark' ? '#0f172a80' : 'white', backdropFilter: theme === 'dark' ? 'blur(10px)' : 'none' }}>
            <CardContent>
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'stretch', md: 'center' }, gap: 2, mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: theme === 'dark' ? '#ccd6f6' : '#333333', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <FilterList /> Filter Properties
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                  <ToggleButtonGroup value={viewMode} exclusive onChange={(e, newMode) => newMode && setViewMode(newMode)} size="small">
                    <ToggleButton value="cards">Cards</ToggleButton>
                    <ToggleButton value="list">List</ToggleButton>
                  </ToggleButtonGroup>
                  <Button variant="outlined" startIcon={<Refresh />} onClick={resetFilters} sx={{ borderColor: theme === 'dark' ? '#00ffff' : '#007bff', color: theme === 'dark' ? '#00ffff' : '#007bff' }}>
                    Reset Filters
                  </Button>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(33.33% - 16px)', md: '1 1 calc(20% - 16px)' }, minWidth: '150px' }}>
                  <TextField fullWidth size="small" label="Search" value={filters.search} onChange={(e) => handleFilterChange('search', e.target.value)} placeholder="Title, address, city..." InputProps={{ startAdornment: <Search sx={{ mr: 1 }} /> }} sx={textFieldStyle} />
                </Box>
                <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(33.33% - 16px)', md: '1 1 calc(20% - 16px)' }, minWidth: '150px' }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Property Type</InputLabel>
                    <Select value={filters.propertyType} label="Property Type" onChange={(e) => handleFilterChange('propertyType', e.target.value)} sx={selectStyle}>
                      <MenuItem value="">All Types</MenuItem>
                      {filterOptions.propertyTypes.map(type => <MenuItem key={type} value={type}>{propertyTypeLabels[type as PropertyType]}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Box>
                <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(33.33% - 16px)', md: '1 1 calc(20% - 16px)' }, minWidth: '150px' }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Status</InputLabel>
                    <Select value={filters.status} label="Status" onChange={(e) => handleFilterChange('status', e.target.value)} sx={selectStyle}>
                      <MenuItem value="">All Status</MenuItem>
                      {filterOptions.statuses.map(status => <MenuItem key={status} value={status}>{status === HouseStatus.AVAILABLE ? 'Available' : status === HouseStatus.SOLD ? 'Sold' : status === HouseStatus.RENTED ? 'Rented' : status === HouseStatus.UNAVAILABLE ? 'Unavailable' : 'Pending Approval'}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Box>
                <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(33.33% - 16px)', md: '1 1 calc(20% - 16px)' }, minWidth: '150px' }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Approval</InputLabel>
                    <Select value={filters.approvalStatus} label="Approval" onChange={(e) => handleFilterChange('approvalStatus', e.target.value)} sx={selectStyle}>
                      <MenuItem value="">All</MenuItem>
                      <MenuItem value={ApprovalStatus.PENDING}>Pending</MenuItem>
                      <MenuItem value={ApprovalStatus.APPROVED}>Approved</MenuItem>
                      <MenuItem value={ApprovalStatus.REJECTED}>Rejected</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
                <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(33.33% - 16px)', md: '1 1 calc(20% - 16px)' }, minWidth: '150px' }}>
                  <TextField fullWidth size="small" label="Min Price" type="number" value={filters.minPrice} onChange={(e) => handleFilterChange('minPrice', e.target.value)} placeholder="0" InputProps={{ startAdornment: <AttachMoney sx={{ mr: 1 }} /> }} sx={textFieldStyle} />
                </Box>
                <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(33.33% - 16px)', md: '1 1 calc(20% - 16px)' }, minWidth: '150px' }}>
                  <TextField fullWidth size="small" label="Max Price" type="number" value={filters.maxPrice} onChange={(e) => handleFilterChange('maxPrice', e.target.value)} placeholder="1000000" InputProps={{ startAdornment: <AttachMoney sx={{ mr: 1 }} /> }} sx={textFieldStyle} />
                </Box>
                <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(33.33% - 16px)', md: '1 1 calc(20% - 16px)' }, minWidth: '150px' }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Min Bedrooms</InputLabel>
                    <Select value={filters.minBedrooms} label="Min Bedrooms" onChange={(e) => handleFilterChange('minBedrooms', e.target.value)} sx={selectStyle}>
                      <MenuItem value="">Any</MenuItem>
                      {filterOptions.bedroomOptions.map(opt => <MenuItem key={opt._id} value={opt._id}>{opt._id}+</MenuItem>)}
                    </Select>
                  </FormControl>
                </Box>
                <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(33.33% - 16px)', md: '1 1 calc(20% - 16px)' }, minWidth: '150px' }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Sort By</InputLabel>
                    <Select value={filters.sortBy} label="Sort By" onChange={(e) => handleFilterChange('sortBy', e.target.value)} sx={selectStyle}>
                      <MenuItem value="created_at">Newest First</MenuItem>
                      <MenuItem value="pricing.price">Price: Low to High</MenuItem>
                      <MenuItem value="-pricing.price">Price: High to Low</MenuItem>
                      <MenuItem value="views">Most Viewed</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              </Box>

              {filterOptions.amenities.length > 0 && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1, color: theme === 'dark' ? '#a8b2d1' : '#666666' }}>Amenities</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {filterOptions.amenities.map(amenity => (
                      <Chip
                        key={amenity}
                        label={amenity}
                        size="small"
                        onClick={() => {
                          const updated = filters.amenities.includes(amenity)
                            ? filters.amenities.filter(a => a !== amenity)
                            : [...filters.amenities, amenity];
                          handleFilterChange('amenities', updated);
                        }}
                        color={filters.amenities.includes(amenity) ? 'primary' : 'default'}
                        sx={{
                          backgroundColor: filters.amenities.includes(amenity)
                            ? (theme === 'dark' ? '#00ffff20' : '#007bff10')
                            : (theme === 'dark' ? '#334155' : '#e5e7eb'),
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Houses Display */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
            <CircularProgress size={60} sx={{ color: theme === 'dark' ? '#00ffff' : '#007bff' }} />
          </Box>
        ) : houses.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Home sx={{ fontSize: 64, color: theme === 'dark' ? '#334155' : '#cbd5e1', mb: 2 }} />
            <Typography variant="h6">No properties found</Typography>
            <Typography variant="body2" color="text.secondary">Try adjusting your filters</Typography>
          </Box>
        ) : viewMode === 'cards' ? (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
            <AnimatePresence>
              {houses.map((house, index) => {
                const imageUrl = getImageUrl(house._id);
                const hasImageError = imageErrors[house._id];
                return (
                  <Box key={house._id} sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 24px)', md: '1 1 calc(33.33% - 24px)', lg: '1 1 calc(25% - 24px)' }, minWidth: { xs: '100%', sm: '280px' } }}>
                    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: index * 0.05 }} whileHover={{ y: -8 }}>
                      <Card sx={{ height: '100%', borderRadius: 3, overflow: 'hidden', backgroundColor: theme === 'dark' ? '#0f172a80' : 'white', backdropFilter: theme === 'dark' ? 'blur(10px)' : 'none' }}>
                        <Box sx={{ position: 'relative', height: 200, overflow: 'hidden', bgcolor: theme === 'dark' ? '#1e293b' : '#f5f5f5' }}>
                          {!hasImageError ? (
                          <img 
                            src={imageUrl} 
                            alt={house.title} 
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onLoad={() => {
                              console.log('Image loaded for house:', house._id);
                              setImageLoading(prev => ({ ...prev, [house._id]: false }));
                            }}
                            onError={(e) => {
                              console.error('Image failed to load for house:', house._id);
                              console.error('Image URL was:', imageUrl);
                              handleImageError(house._id);
                            }}
                          />
                        ) : (
                            <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: theme === 'dark' ? '#334155' : '#e5e7eb' }}>
                              <Home sx={{ fontSize: 48, color: theme === 'dark' ? '#a8b2d1' : '#94a3b8' }} />
                            </Box>
                          )}
                          <Chip label={house.approvalStatus === ApprovalStatus.APPROVED ? 'Approved' : house.approvalStatus === ApprovalStatus.PENDING ? 'Pending' : 'Rejected'} size="small" color={house.approvalStatus === ApprovalStatus.APPROVED ? 'success' : house.approvalStatus === ApprovalStatus.PENDING ? 'warning' : 'error'} sx={{ position: 'absolute', top: 12, left: 12, height: 24 }} />
                          <Chip label={propertyTypeLabels[house.propertyType]} size="small" sx={{ position: 'absolute', top: 12, right: 12, height: 24, backgroundColor: theme === 'dark' ? '#334155' : '#e5e7eb' }} />
                          {house.pricing?.quantity > 1 && (
                            <Chip icon={<Inventory />} label={`${house.pricing.quantity} units`} size="small" sx={{ position: 'absolute', bottom: 12, right: 12, height: 24, backgroundColor: theme === 'dark' ? '#00ffff20' : '#007bff10', color: theme === 'dark' ? '#00ffff' : '#007bff' }} />
                          )}
                        </Box>
                        <CardContent>
                          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1, display: '-webkit-box', WebkitLineClamp: 2, overflow: 'hidden' }}>{house.title}</Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}><LocationOn sx={{ fontSize: 14 }} /><Typography variant="caption">{house.location.city}, {house.location.state}</Typography></Box>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><Bed sx={{ fontSize: 14 }} /><Typography variant="body2">{house.details.bedrooms}</Typography></Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><Bathtub sx={{ fontSize: 14 }} /><Typography variant="body2">{house.details.bathrooms}</Typography></Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><SquareFoot sx={{ fontSize: 14 }} /><Typography variant="body2">{house.details.area.toLocaleString()} sqft</Typography></Box>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="h5" sx={{ fontWeight: 'bold', color: theme === 'dark' ? '#00ffff' : '#007bff' }}>{formatPrice(house.pricing.price)}</Typography>
                            <Chip label={house.status === HouseStatus.AVAILABLE ? 'Available' : house.status === HouseStatus.SOLD ? 'Sold' : house.status === HouseStatus.RENTED ? 'Rented' : 'Unavailable'} size="small" icon={statusIcons[house.status]} color={statusColors[house.status]} />
                          </Box>
                        </CardContent>
                        <Divider />
                        <CardActions sx={{ p: 2, display: 'flex', gap: 1 }}>
                          <Button size="small" variant="outlined" startIcon={<Visibility />} href={`/admin/houses/${house._id}`} sx={{ flex: 1 }}>View</Button>
                          <Button size="small" variant="outlined" startIcon={<Edit />} href={`/admin/houses/edit/${house._id}`} sx={{ flex: 1 }}>Edit</Button>
                          {house.approvalStatus === ApprovalStatus.PENDING && (
                            <Button size="small" variant="contained" startIcon={<Approval />} onClick={() => { setSelectedHouse(house); setApproveAction('approve'); setOpenApproveDialog(true); }} sx={{ flex: 1, background: theme === 'dark' ? 'linear-gradient(135deg, #00ff00, #00b300)' : 'linear-gradient(135deg, #28a745, #218838)' }}>Approve</Button>
                          )}
                          <IconButton size="small" onClick={() => { setSelectedHouse(house); setOpenDeleteDialog(true); }} sx={{ color: theme === 'dark' ? '#ff0000' : '#dc3545' }}><Delete /></IconButton>
                        </CardActions>
                      </Card>
                    </motion.div>
                  </Box>
                );
              })}
            </AnimatePresence>
          </Box>
        ) : (
          <Card sx={{ borderRadius: 3, overflow: 'hidden', backgroundColor: theme === 'dark' ? '#0f172a80' : 'white' }}>
            <Box sx={{ overflowX: 'auto' }}>
              <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse' }}>
                <Box component="thead" sx={{ background: theme === 'dark' ? 'linear-gradient(135deg, #00ffff, #00b3b3)' : 'linear-gradient(135deg, #007bff, #0056b3)' }}>
                  <Box component="tr" sx={{ display: 'table-row' }}>
                    {['Property', 'Type', 'Location', 'Price', 'Units', 'Status', 'Approval', 'Actions'].map(header => <Box key={header} component="th" sx={{ p: 2, textAlign: 'left', color: 'white', fontWeight: 'bold' }}>{header}</Box>)}
                  </Box>
                </Box>
                <Box component="tbody">
                  {houses.map(house => (
                    <Box key={house._id} component="tr" sx={{ display: 'table-row', borderBottom: 1, borderColor: 'divider', '&:hover': { bgcolor: theme === 'dark' ? '#1e293b' : '#f8fafc' } }}>
                      <Box component="td" sx={{ p: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Box sx={{ width: 50, height: 40, borderRadius: 1, overflow: 'hidden', bgcolor: theme === 'dark' ? '#334155' : '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <img 
                              src={getImageUrl(house._id)} 
                              alt="" 
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                              onError={(e) => { 
                                (e.target as HTMLImageElement).style.display = 'none';
                                const parent = (e.target as HTMLImageElement).parentElement;
                                if (parent) {
                                  const fallback = document.createElement('div');
                                  fallback.style.width = '100%';
                                  fallback.style.height = '100%';
                                  fallback.style.backgroundColor = theme === 'dark' ? '#334155' : '#e5e7eb';
                                  fallback.style.display = 'flex';
                                  fallback.style.alignItems = 'center';
                                  fallback.style.justifyContent = 'center';
                                  fallback.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="' + (theme === 'dark' ? '#a8b2d1' : '#94a3b8') + '"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/></svg>';
                                  parent.appendChild(fallback);
                                }
                              }}
                            />
                          </Box>
                          <Box><Typography variant="body2" sx={{ fontWeight: 500 }}>{house.title}</Typography><Typography variant="caption" color="text.secondary">{house.details.bedrooms} beds • {house.details.bathrooms} baths • {house.details.area} sqft</Typography></Box>
                        </Box>
                      </Box>
                      <Box component="td" sx={{ p: 2 }}><Chip label={propertyTypeLabels[house.propertyType]} size="small" /></Box>
                      <Box component="td" sx={{ p: 2 }}><Typography variant="body2">{house.location.city}</Typography><Typography variant="caption" color="text.secondary">{house.location.state}</Typography></Box>
                      <Box component="td" sx={{ p: 2 }}><Typography variant="body2" sx={{ fontWeight: 'bold', color: theme === 'dark' ? '#00ffff' : '#007bff' }}>{formatPrice(house.pricing.price)}</Typography></Box>
                      <Box component="td" sx={{ p: 2 }}><Chip label={`${house.pricing?.quantity || 1} units`} size="small" icon={<Inventory />} /></Box>
                      <Box component="td" sx={{ p: 2 }}><Chip label={house.status === HouseStatus.AVAILABLE ? 'Available' : house.status === HouseStatus.SOLD ? 'Sold' : house.status === HouseStatus.RENTED ? 'Rented' : 'Unavailable'} size="small" icon={statusIcons[house.status]} color={statusColors[house.status]} /></Box>
                      <Box component="td" sx={{ p: 2 }}><Chip label={house.approvalStatus === ApprovalStatus.APPROVED ? 'Approved' : house.approvalStatus === ApprovalStatus.PENDING ? 'Pending' : 'Rejected'} size="small" color={house.approvalStatus === ApprovalStatus.APPROVED ? 'success' : house.approvalStatus === ApprovalStatus.PENDING ? 'warning' : 'error'} /></Box>
                      <Box component="td" sx={{ p: 2 }}>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <IconButton size="small" href={`/admin/houses/${house._id}`}><Visibility /></IconButton>
                          <IconButton size="small" href={`/admin/houses/edit/${house._id}`}><Edit /></IconButton>
                          <IconButton size="small" onClick={() => { setSelectedHouse(house); setOpenDeleteDialog(true); }}><Delete /></IconButton>
                        </Box>
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Box>
            </Box>
          </Card>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <Pagination count={pagination.totalPages} page={filters.page} onChange={handlePageChange} color="primary" size={isMobile ? "small" : "medium"} showFirstButton showLastButton />
          </Box>
        )}

        {/* Items Per Page */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <Select value={filters.limit} onChange={(e) => handleFilterChange('limit', e.target.value)} sx={selectStyle}>
              <MenuItem value={12}>12 per page</MenuItem>
              <MenuItem value={24}>24 per page</MenuItem>
              <MenuItem value={48}>48 per page</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* Delete Dialog */}
        <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)} PaperProps={{ sx: { borderRadius: 3, backgroundColor: theme === 'dark' ? '#0f172a' : 'white' } }}>
          <DialogTitle>Confirm Delete</DialogTitle>
          <DialogContent><Typography>Are you sure you want to delete <strong>"{selectedHouse?.title}"</strong>? This action cannot be undone.</Typography></DialogContent>
          <DialogActions><Button onClick={() => setOpenDeleteDialog(false)}>Cancel</Button><Button onClick={handleDeleteHouse} variant="contained" color="error">Delete</Button></DialogActions>
        </Dialog>

        {/* Approve Dialog */}
        <Dialog open={openApproveDialog} onClose={() => setOpenApproveDialog(false)} PaperProps={{ sx: { borderRadius: 3, backgroundColor: theme === 'dark' ? '#0f172a' : 'white' } }}>
          <DialogTitle>{approveAction === 'approve' ? 'Approve Property' : 'Reject Property'}</DialogTitle>
          <DialogContent><Typography>Are you sure you want to {approveAction === 'approve' ? 'approve' : 'reject'} <strong>"{selectedHouse?.title}"</strong>?</Typography></DialogContent>
          <DialogActions><Button onClick={() => setOpenApproveDialog(false)}>Cancel</Button><Button onClick={handleApproveHouse} variant="contained" color={approveAction === 'approve' ? 'success' : 'error'}>{approveAction === 'approve' ? 'Approve' : 'Reject'}</Button></DialogActions>
        </Dialog>

        {/* Notifications */}
        <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError('')} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}><Alert severity="error" onClose={() => setError('')}>{error}</Alert></Snackbar>
        <Snackbar open={!!success} autoHideDuration={6000} onClose={() => setSuccess('')} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}><Alert severity="success" onClose={() => setSuccess('')}>{success}</Alert></Snackbar>
      </Box>
    </div>
  );
};

export default AdminHousesPage;