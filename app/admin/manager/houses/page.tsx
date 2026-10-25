'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Card, CardContent, CardActions,
  TextField, Chip, Alert, Snackbar, CircularProgress,
  useMediaQuery, Pagination, MenuItem, Select,
  FormControl, InputLabel, IconButton, Dialog,
  DialogTitle, DialogContent, DialogActions, Button,
  Tooltip, ToggleButton, ToggleButtonGroup,
  Divider, Avatar
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/lib/theme-context';
import { useLanguage } from '@/lib/language-context';
import Navbar from '@/components/ui/Navbar';
import {
  Home, Visibility, CheckCircle, Cancel,
  HourglassEmpty, LocationOn, AttachMoney,
  Bed, Bathtub, SquareFoot,
  Apartment, Villa, Landscape,
  Approval, Inventory, FilterList,
  ThumbUp, ThumbDown, Refresh, Search,
  Person, CalendarToday, Close
} from '@mui/icons-material';
import api from '@/app/utils/api';
import { House, HouseStatus, ApprovalStatus, PropertyType, PaginationData } from '@/types/houses';
import { format } from 'date-fns';

const approvalStatusColors: Record<string, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
  [ApprovalStatus.APPROVED]: 'success',
  [ApprovalStatus.PENDING]: 'warning',
  [ApprovalStatus.REJECTED]: 'error'
};

const statusColors: Record<string, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
  [HouseStatus.AVAILABLE]: 'success',
  [HouseStatus.SOLD]: 'error',
  [HouseStatus.RENTED]: 'warning',
  [HouseStatus.UNAVAILABLE]: 'default',
  [HouseStatus.PENDING_APPROVAL]: 'info'
};

const HouseReviewPage = () => {
  const { theme } = useTheme();
  const { t, isAmharic } = useLanguage();
  const isDark = theme === 'dark';
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  const propertyTypeLabels: Record<PropertyType, string> = {
    [PropertyType.APARTMENT]: isAmharic ? 'አፓርታማ' : 'Apartment',
    [PropertyType.VILLA]: isAmharic ? 'ቪላ' : 'Villa',
    [PropertyType.CONDO]: isAmharic ? 'ኮንዶሚኒየም' : 'Condo',
    [PropertyType.HOUSE]: isAmharic ? 'ቤት' : 'House',
    [PropertyType.LAND]: isAmharic ? 'መሬት' : 'Land',
  };

  const approvalStatusLabels: Record<string, string> = {
    [ApprovalStatus.APPROVED]: isAmharic ? 'የጸደቀ' : 'Approved',
    [ApprovalStatus.PENDING]: isAmharic ? 'በመጠባበቅ ላይ' : 'Pending',
    [ApprovalStatus.REJECTED]: isAmharic ? 'ውድቅ የተደረገ' : 'Rejected'
  };

  const houseStatusLabels: Record<string, string> = {
    [HouseStatus.AVAILABLE]: isAmharic ? 'ይገኛል' : 'Available',
    [HouseStatus.SOLD]: isAmharic ? 'የተሸጠ' : 'Sold',
    [HouseStatus.RENTED]: isAmharic ? 'የተከራየ' : 'Rented',
    [HouseStatus.UNAVAILABLE]: isAmharic ? 'አይገኝም' : 'Unavailable',
    [HouseStatus.PENDING_APPROVAL]: isAmharic ? 'ማጽደቅ የሚጠብቅ' : 'Pending Approval'
  };
  
  const [houses, setHouses] = useState<House[]>([]);
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
  const [openApproveDialog, setOpenApproveDialog] = useState(false);
  const [openRejectDialog, setOpenRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    total: 0
  });

  const [filters, setFilters] = useState({
    search: '',
    propertyType: '',
    approvalStatus: '',
    sortBy: 'created_at',
    sortOrder: 'desc',
    page: 1,
    limit: 12
  });

  // Get image URL from admin image endpoint (public now)
  const getImageUrl = (houseId: string): string => {
    const serverUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    return `${serverUrl}/api/houses/${houseId}/image`;
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
          params.append(key, value.toString());
        }
      });

      const response = await api.get(`/houses?${params}`);
      setHouses(response.data.data.houses || []);
      setPagination(response.data.data.pagination);
      
      const statsResponse = await api.get('/houses/stats');
      setStats({
        pending: statsResponse.data.data.pendingApproval || 0,
        approved: statsResponse.data.data.availableHouses || 0,
        rejected: statsResponse.data.data.soldHouses || 0,
        total: statsResponse.data.data.totalHouses || 0
      });
      
      setError('');
      setImageErrors({});
    } catch (error: any) {
      console.error('Error fetching houses:', error);
      setError(error.response?.data?.message || 'Failed to fetch houses');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchHouses();
  }, [fetchHouses]);

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
      approvalStatus: '',
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
        approvalStatus: ApprovalStatus.APPROVED,
        status: HouseStatus.AVAILABLE
      });
      setSuccess(`House "${selectedHouse.title}" approved successfully!`);
      setOpenApproveDialog(false);
      fetchHouses();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to approve house');
    }
  };

  const handleRejectHouse = async () => {
    if (!selectedHouse) return;
    try {
      await api.patch(`/houses/${selectedHouse._id}/approve`, {
        approvalStatus: ApprovalStatus.REJECTED,
        status: HouseStatus.UNAVAILABLE
      });
      setSuccess(`House "${selectedHouse.title}" rejected. ${rejectReason ? `Reason: ${rejectReason}` : ''}`);
      setOpenRejectDialog(false);
      setRejectReason('');
      fetchHouses();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to reject house');
    }
  };

  const formatPrice = (price: number) => {
    if (!price && price !== 0) return '0 ETB';
    return `${Number(price).toLocaleString()} ETB`;
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
    } catch {
      return 'Invalid date';
    }
  };

  const statCards = [
    { title: t('review.total_properties'), value: stats.total, icon: <Home />, color: '#2563eb', description: isAmharic ? 'በስርዓቱ ውስጥ ያሉ ሁሉም ቤቶች' : 'All properties in system' },
    { title: t('review.pending_approval'), value: stats.pending, icon: <HourglassEmpty />, color: '#f59e0b', description: isAmharic ? 'ግምገማ የሚጠብቁ' : 'Waiting for review' },
    { title: t('review.approved'), value: stats.approved, icon: <CheckCircle />, color: '#10b981', description: isAmharic ? 'የጸደቁ ንቁ ቤቶች' : 'Active listings' },
    { title: t('review.rejected'), value: stats.rejected, icon: <Cancel />, color: '#ef4444', description: isAmharic ? 'ውድቅ የተደረጉ ቤቶች' : 'Inactive properties' }
  ];

  const textFieldStyle = {
    '& .MuiOutlinedInput-root': {
      backgroundColor: isDark ? '#112240' : '#ffffff',
      color: isDark ? '#f1f5f9' : '#0f172a',
      borderRadius: '10px',
      '& fieldset': { borderColor: isDark ? '#233554' : '#cbd5e1' },
      '&:hover fieldset': { borderColor: isDark ? '#38bdf8' : '#2563eb' },
      '&.Mui-focused fieldset': { borderColor: isDark ? '#38bdf8' : '#2563eb' }
    },
    '& .MuiInputLabel-root': { color: isDark ? '#94a3b8' : '#64748b' },
    '& .MuiInputLabel-root.Mui-focused': { color: isDark ? '#38bdf8' : '#2563eb' }
  };

  const selectStyle = {
    backgroundColor: isDark ? '#112240' : '#ffffff',
    color: isDark ? '#f1f5f9' : '#0f172a',
    borderRadius: '10px',
    '& .MuiOutlinedInput-notchedOutline': { borderColor: isDark ? '#233554' : '#cbd5e1' },
    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: isDark ? '#38bdf8' : '#2563eb' },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: isDark ? '#38bdf8' : '#2563eb' },
    '& .MuiSvgIcon-root': { color: isDark ? '#94a3b8' : '#64748b' }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      theme === 'dark' 
        ? 'bg-gradient-to-br from-[#0a192f] to-[#112240] text-white' 
        : 'bg-gradient-to-br from-[#f8fafc] to-[#ffffff] text-slate-900'
    }`}>
      {/* <Navbar /> */}
      
      <Box sx={{ pt: 2, pb: 4, px: { xs: 2, md: 4 } }}>
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Box sx={{ mb: 4 }}>
            <Typography variant={isMobile ? "h5" : "h4"} sx={{ fontWeight: 700, color: isDark ? '#f1f5f9' : '#0f172a', mb: 1 }}>
              {t('review.title')}
            </Typography>
            <Typography variant="body2" color={isDark ? '#94a3b8' : '#64748b'}>
              {t('review.subtitle')}
            </Typography>
          </Box>
        </motion.div>

        {/* Statistics Cards */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 4 }}>
            {statCards.map((stat, index) => (
              <Box key={index} sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 16px)', md: '1 1 calc(25% - 16px)' }, minWidth: '200px' }}>
                <Card sx={{
                  borderRadius: 3,
                  borderLeft: `4px solid ${stat.color}`,
                  borderTop: '1px solid',
                  borderRight: '1px solid',
                  borderBottom: '1px solid',
                  borderColor: isDark ? '#233554' : '#e2e8f0',
                  backgroundColor: isDark ? '#112240' : '#ffffff',
                  boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.25)' : '0 2px 10px rgba(0,0,0,0.04)'
                }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box>
                        <Typography variant="h3" sx={{ fontWeight: 'bold', color: isDark ? '#f1f5f9' : '#0f172a', fontSize: '2.5rem' }}>
                          {stat.value}
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: isDark ? '#cbd5e1' : '#334155', mt: 0.5 }}>{stat.title}</Typography>
                        <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>{stat.description}</Typography>
                      </Box>
                      <Box sx={{ width: 56, height: 56, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: isDark ? `${stat.color}25` : `${stat.color}15` }}>
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
          <Card sx={{
            mb: 4,
            borderRadius: 3,
            backgroundColor: isDark ? '#112240' : '#ffffff',
            border: '1px solid',
            borderColor: isDark ? '#233554' : '#e2e8f0',
            boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.25)' : '0 2px 10px rgba(0,0,0,0.04)'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'stretch', md: 'center' }, gap: 2, mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: isDark ? '#f1f5f9' : '#0f172a', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <FilterList sx={{ color: 'primary.main' }} /> {isAmharic ? `ጠቅላላ ቤቶች (${stats.total})` : `All Properties (${stats.total})`}
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                  <ToggleButtonGroup
                    value={viewMode}
                    exclusive
                    onChange={(e, newMode) => newMode && setViewMode(newMode)}
                    size="small"
                    sx={{
                      bgcolor: isDark ? '#0a192f' : '#f1f5f9',
                      '& .MuiToggleButton-root': {
                        color: isDark ? '#94a3b8' : '#64748b',
                        borderColor: isDark ? '#233554' : '#cbd5e1',
                        '&.Mui-selected': {
                          bgcolor: 'primary.main',
                          color: '#ffffff'
                        }
                      }
                    }}
                  >
                    <ToggleButton value="cards">{isAmharic ? 'ካርዶች' : 'Cards'}</ToggleButton>
                    <ToggleButton value="list">{isAmharic ? 'ዝርዝር' : 'List'}</ToggleButton>
                  </ToggleButtonGroup>
                  <Button
                    variant="outlined"
                    startIcon={<Refresh />}
                    onClick={resetFilters}
                    sx={{
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 600,
                      borderColor: isDark ? '#233554' : '#cbd5e1',
                      color: isDark ? '#38bdf8' : '#2563eb'
                    }}
                  >
                    {isAmharic ? 'ማጣሪያ አጽዳ' : 'Reset Filters'}
                  </Button>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(33.33% - 16px)', md: '1 1 calc(33.33% - 16px)' }, minWidth: '200px' }}>
                  <TextField
                    fullWidth
                    size="small"
                    label={isAmharic ? 'ፈልግ' : 'Search'}
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    placeholder={isAmharic ? 'ርዕስ፣ አድራሻ፣ ከተማ...' : 'Title, address, city...'}
                    InputProps={{ startAdornment: <Search sx={{ mr: 1, color: isDark ? '#94a3b8' : '#64748b' }} /> }}
                    sx={textFieldStyle}
                  />
                </Box>
                <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(33.33% - 16px)', md: '1 1 calc(33.33% - 16px)' }, minWidth: '150px' }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>{isAmharic ? 'የንብረት ዓይነት' : 'Property Type'}</InputLabel>
                    <Select value={filters.propertyType} label={isAmharic ? 'የንብረት ዓይነት' : 'Property Type'} onChange={(e) => handleFilterChange('propertyType', e.target.value)} sx={selectStyle}>
                      <MenuItem value="">{isAmharic ? 'ሁሉም ዓይነቶች' : 'All Types'}</MenuItem>
                      {Object.entries(propertyTypeLabels).map(([value, label]) => <MenuItem key={value} value={value}>{label}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Box>
                <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(33.33% - 16px)', md: '1 1 calc(33.33% - 16px)' }, minWidth: '150px' }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>{isAmharic ? 'የማጽደቅ ሁኔታ' : 'Approval Status'}</InputLabel>
                    <Select value={filters.approvalStatus} label={isAmharic ? 'የማጽደቅ ሁኔታ' : 'Approval Status'} onChange={(e) => handleFilterChange('approvalStatus', e.target.value)} sx={selectStyle}>
                      <MenuItem value="">{isAmharic ? 'ሁሉም ሁኔታ' : 'All Status'}</MenuItem>
                      <MenuItem value={ApprovalStatus.PENDING}>{isAmharic ? 'በመጠባበቅ ላይ' : 'Pending'}</MenuItem>
                      <MenuItem value={ApprovalStatus.APPROVED}>{isAmharic ? 'የጸደቀ' : 'Approved'}</MenuItem>
                      <MenuItem value={ApprovalStatus.REJECTED}>{isAmharic ? 'ውድቅ የተደረገ' : 'Rejected'}</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
                <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(33.33% - 16px)', md: '1 1 calc(33.33% - 16px)' }, minWidth: '150px' }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>{isAmharic ? 'ደርድር በ' : 'Sort By'}</InputLabel>
                    <Select value={filters.sortBy} label={isAmharic ? 'ደርድር በ' : 'Sort By'} onChange={(e) => handleFilterChange('sortBy', e.target.value)} sx={selectStyle}>
                      <MenuItem value="created_at">{isAmharic ? 'አዳዲስ መጀመሪያ' : 'Newest First'}</MenuItem>
                      <MenuItem value="title">{isAmharic ? 'ርዕስ ሀ-ፐ' : 'Title A-Z'}</MenuItem>
                      <MenuItem value="pricing.price">{isAmharic ? 'ዋጋ፡ ከዝቅተኛ ወደ ከፍተኛ' : 'Price: Low to High'}</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </motion.div>

        {/* Houses Display */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
            <CircularProgress size={60} sx={{ color: isDark ? '#38bdf8' : '#2563eb' }} />
          </Box>
        ) : houses.length === 0 ? (
          <Box sx={{
            textAlign: 'center',
            py: 8,
            px: 3,
            bgcolor: isDark ? '#112240' : '#ffffff',
            borderRadius: 3,
            border: '1px dashed',
            borderColor: isDark ? '#233554' : '#cbd5e1'
          }}>
            <Home sx={{ fontSize: 64, color: isDark ? '#475569' : '#cbd5e1', mb: 2 }} />
            <Typography variant="h6" sx={{ fontWeight: 700, color: isDark ? '#f1f5f9' : '#0f172a', mb: 1 }}>
              {isAmharic ? 'ምንም ቤቶች አልተገኙም' : 'No properties found'}
            </Typography>
            <Typography variant="body2" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>
              {isAmharic ? 'እባክዎ የማጣሪያ ምርጫዎችዎን በማስተካከል እንደገና ይሞክሩ' : 'Try adjusting your filters or resetting search parameters.'}
            </Typography>
          </Box>
        ) : viewMode === 'cards' ? (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
            <AnimatePresence>
              {houses.map((house, index) => {
                const imageUrl = getImageUrl(house._id);
                const hasImageError = imageErrors[house._id];
                return (
                  <Box key={house._id} sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 24px)', md: '1 1 calc(33.33% - 24px)' }, minWidth: { xs: '100%', sm: '320px' } }}>
                    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: index * 0.04 }} whileHover={{ y: -6 }}>
                      <Card sx={{
                        height: '100%',
                        borderRadius: 3,
                        overflow: 'hidden',
                        backgroundColor: isDark ? '#112240' : '#ffffff',
                        border: '1px solid',
                        borderColor: isDark ? '#233554' : '#e2e8f0',
                        boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.25)' : '0 2px 10px rgba(0,0,0,0.04)'
                      }}>
                        <Box sx={{ position: 'relative', height: 200, overflow: 'hidden', bgcolor: isDark ? '#1e293b' : '#f1f5f9' }}>
                          {!hasImageError ? (
                            <img 
                              src={imageUrl} 
                              alt={house.title} 
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              onError={() => handleImageError(house._id)}
                            />
                          ) : (
                            <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: isDark ? '#1e293b' : '#e2e8f0' }}>
                              <Home sx={{ fontSize: 48, color: isDark ? '#64748b' : '#94a3b8' }} />
                            </Box>
                          )}
                          <Chip 
                            label={approvalStatusLabels[house.approvalStatus]} 
                            size="small" 
                            color={approvalStatusColors[house.approvalStatus]} 
                            sx={{ position: 'absolute', top: 12, right: 12, height: 24, fontWeight: 700, fontSize: 11 }} 
                          />
                          <Chip 
                            label={propertyTypeLabels[house.propertyType]} 
                            size="small" 
                            sx={{
                              position: 'absolute',
                              top: 12,
                              left: 12,
                              height: 24,
                              fontWeight: 600,
                              fontSize: 11,
                              backgroundColor: isDark ? 'rgba(15, 23, 42, 0.85)' : 'rgba(255, 255, 255, 0.9)',
                              color: isDark ? '#f1f5f9' : '#0f172a'
                            }} 
                          />
                          {house.pricing?.quantity > 1 && (
                            <Chip 
                              icon={<Inventory sx={{ fontSize: '14px !important', color: 'inherit' }} />} 
                              label={`${house.pricing.quantity} ${isAmharic ? 'ቤቶች' : 'units'}`} 
                              size="small" 
                              sx={{
                                position: 'absolute',
                                bottom: 12,
                                right: 12,
                                height: 24,
                                fontWeight: 700,
                                fontSize: 11,
                                backgroundColor: isDark ? 'rgba(56, 189, 248, 0.2)' : 'rgba(37, 99, 235, 0.1)',
                                color: isDark ? '#38bdf8' : '#2563eb'
                              }} 
                            />
                          )}
                        </Box>
                        <CardContent sx={{ p: 2.5 }}>
                          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1, color: isDark ? '#f1f5f9' : '#0f172a', display: '-webkit-box', WebkitLineClamp: 2, overflow: 'hidden' }}>{house.title}</Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                            <LocationOn sx={{ fontSize: 14, color: isDark ? '#94a3b8' : '#64748b' }} />
                            <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>{house.location.city}, {house.location.state}</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <Bed sx={{ fontSize: 14, color: isDark ? '#94a3b8' : '#64748b' }} />
                              <Typography variant="body2" sx={{ color: isDark ? '#f1f5f9' : '#0f172a', fontWeight: 600 }}>{house.details.bedrooms}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <Bathtub sx={{ fontSize: 14, color: isDark ? '#94a3b8' : '#64748b' }} />
                              <Typography variant="body2" sx={{ color: isDark ? '#f1f5f9' : '#0f172a', fontWeight: 600 }}>{house.details.bathrooms}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <SquareFoot sx={{ fontSize: 14, color: isDark ? '#94a3b8' : '#64748b' }} />
                              <Typography variant="body2" sx={{ color: isDark ? '#f1f5f9' : '#0f172a', fontWeight: 600 }}>{house.details.area.toLocaleString()} m²</Typography>
                            </Box>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h5" sx={{ fontWeight: 'bold', color: isDark ? '#38bdf8' : '#2563eb' }}>{formatPrice(house.pricing.price)}</Typography>
                            <Chip 
                              label={houseStatusLabels[house.status] || house.status} 
                              size="small" 
                              color={statusColors[house.status]} 
                              sx={{ fontWeight: 600, fontSize: 11 }}
                            />
                          </Box>
                          <Divider sx={{ my: 1, borderColor: isDark ? '#233554' : '#e2e8f0' }} />
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Person sx={{ fontSize: 14, color: isDark ? '#94a3b8' : '#64748b' }} />
                            <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>
                              {isAmharic ? 'ወኪል:' : 'Agent:'} {house.agentName || house.agentId?.name || (isAmharic ? 'ያልታወቀ' : 'Unknown')}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CalendarToday sx={{ fontSize: 14, color: isDark ? '#94a3b8' : '#64748b' }} />
                            <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>
                              {isAmharic ? 'የቀረበበት:' : 'Submitted:'} {formatDate(house.created_at)}
                            </Typography>
                          </Box>
                        </CardContent>
                        <Divider sx={{ borderColor: isDark ? '#233554' : '#e2e8f0' }} />
                        <CardActions sx={{ p: 2, display: 'flex', gap: 1, flexDirection: { xs: 'column', sm: 'row' } }}>
                          <Button 
                            size="small" 
                            variant="outlined" 
                            startIcon={<Visibility />} 
                            onClick={() => { setSelectedHouse(house); setOpenViewDialog(true); }}
                            sx={{
                              width: { xs: '100%', sm: 'auto' },
                              flex: 1,
                              borderRadius: 2,
                              textTransform: 'none',
                              fontWeight: 600,
                              borderColor: isDark ? '#233554' : '#cbd5e1',
                              color: isDark ? '#f1f5f9' : '#0f172a'
                            }}
                          >
                            {isAmharic ? 'ገምግም' : 'Review'}
                          </Button>
                          {house.approvalStatus !== ApprovalStatus.APPROVED && (
                            <Button 
                              size="small" 
                              variant="contained" 
                              startIcon={<ThumbUp />} 
                              onClick={() => { setSelectedHouse(house); setOpenApproveDialog(true); }}
                              sx={{
                                width: { xs: '100%', sm: 'auto' },
                                flex: 1,
                                borderRadius: 2,
                                textTransform: 'none',
                                fontWeight: 600,
                                bgcolor: '#10b981',
                                '&:hover': { bgcolor: '#059669' },
                                color: '#ffffff'
                              }}
                            >
                              {isAmharic ? 'አጽድቅ' : 'Approve'}
                            </Button>
                          )}
                          {house.approvalStatus !== ApprovalStatus.REJECTED && (
                            <Button 
                              size="small" 
                              variant="contained" 
                              startIcon={<ThumbDown />} 
                              onClick={() => { setSelectedHouse(house); setOpenRejectDialog(true); }}
                              sx={{
                                width: { xs: '100%', sm: 'auto' },
                                flex: 1,
                                borderRadius: 2,
                                textTransform: 'none',
                                fontWeight: 600,
                                bgcolor: '#ef4444',
                                '&:hover': { bgcolor: '#dc2626' },
                                color: '#ffffff'
                              }}
                            >
                              {isAmharic ? 'ውድቅ አድርግ' : 'Reject'}
                            </Button>
                          )}
                        </CardActions>
                      </Card>
                    </motion.div>
                  </Box>
                );
              })}
            </AnimatePresence>
          </Box>
        ) : (
          <Card sx={{
            borderRadius: 3,
            overflow: 'hidden',
            backgroundColor: isDark ? '#112240' : '#ffffff',
            border: '1px solid',
            borderColor: isDark ? '#233554' : '#e2e8f0',
            boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.25)' : '0 2px 10px rgba(0,0,0,0.04)'
          }}>
            <Box sx={{ overflowX: 'auto' }}>
              <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse', minWidth: 800 }}>
                <Box component="thead" sx={{ background: isDark ? '#0f172a' : '#1e293b' }}>
                  <Box component="tr" sx={{ display: 'table-row' }}>
                    {[
                      isAmharic ? 'ንብረት' : 'Property', 
                      isAmharic ? 'ዓይነት' : 'Type', 
                      isAmharic ? 'አድራሻ' : 'Location', 
                      isAmharic ? 'ዋጋ' : 'Price', 
                      isAmharic ? 'ብዛት' : 'Units', 
                      isAmharic ? 'ሁኔታ' : 'Status', 
                      isAmharic ? 'ማጽደቅ' : 'Approval', 
                      isAmharic ? 'የቀረበበት' : 'Submitted', 
                      isAmharic ? 'እርምጃዎች' : 'Actions'
                    ].map(header => (
                      <Box key={header} component="th" sx={{ p: 2, textAlign: 'left', color: 'white', fontWeight: 600, fontSize: 13 }}>{header}</Box>
                    ))}
                  </Box>
                </Box>
                <Box component="tbody">
                  {houses.map(house => {
                    const imageUrl = getImageUrl(house._id);
                    return (
                      <Box key={house._id} component="tr" sx={{
                        display: 'table-row',
                        borderBottom: 1,
                        borderColor: isDark ? '#233554' : '#e2e8f0',
                        '&:hover': { bgcolor: isDark ? '#1e293b' : '#f8fafc' }
                      }}>
                        <Box component="td" sx={{ p: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box sx={{ width: 50, height: 40, borderRadius: 1.5, overflow: 'hidden', bgcolor: isDark ? '#1e293b' : '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <img 
                                src={imageUrl} 
                                alt="" 
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                              />
                            </Box>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 600, color: isDark ? '#f1f5f9' : '#0f172a' }}>{house.title}</Typography>
                              <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>
                                {house.details.bedrooms} {isAmharic ? 'መኝታ' : 'beds'} • {house.details.bathrooms} {isAmharic ? 'መታጠቢያ' : 'baths'} • {house.details.area} m²
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                        <Box component="td" sx={{ p: 2 }}><Chip label={propertyTypeLabels[house.propertyType]} size="small" sx={{ fontWeight: 600, fontSize: 11 }} /></Box>
                        <Box component="td" sx={{ p: 2 }}>
                          <Typography variant="body2" sx={{ color: isDark ? '#f1f5f9' : '#0f172a', fontWeight: 500 }}>{house.location.city}</Typography>
                          <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>{house.location.state}</Typography>
                        </Box>
                        <Box component="td" sx={{ p: 2 }}>
                          <Typography variant="body2" sx={{ fontWeight: 'bold', color: isDark ? '#38bdf8' : '#2563eb' }}>{formatPrice(house.pricing.price)}</Typography>
                        </Box>
                        <Box component="td" sx={{ p: 2 }}>
                          <Chip label={`${house.pricing?.quantity || 1} ${isAmharic ? 'ቤቶች' : 'units'}`} size="small" icon={<Inventory sx={{ fontSize: '13px !important' }} />} sx={{ fontWeight: 600, fontSize: 11 }} />
                        </Box>
                        <Box component="td" sx={{ p: 2 }}>
                          <Chip 
                            label={houseStatusLabels[house.status] || house.status} 
                            size="small" 
                            color={statusColors[house.status]} 
                            sx={{ fontWeight: 600, fontSize: 11 }}
                          />
                        </Box>
                        <Box component="td" sx={{ p: 2 }}>
                          <Chip 
                            label={approvalStatusLabels[house.approvalStatus]} 
                            size="small" 
                            color={approvalStatusColors[house.approvalStatus]} 
                            sx={{ fontWeight: 600, fontSize: 11 }}
                          />
                        </Box>
                        <Box component="td" sx={{ p: 2 }}>
                          <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>{formatDate(house.created_at)}</Typography>
                        </Box>
                        <Box component="td" sx={{ p: 2 }}>
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <Tooltip title={isAmharic ? 'ገምግም' : 'Review'}>
                              <IconButton size="small" onClick={() => { setSelectedHouse(house); setOpenViewDialog(true); }} sx={{ color: isDark ? '#f1f5f9' : '#0f172a' }}>
                                <Visibility fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            {house.approvalStatus !== ApprovalStatus.APPROVED && (
                              <Tooltip title={isAmharic ? 'አጽድቅ' : 'Approve'}>
                                <IconButton size="small" onClick={() => { setSelectedHouse(house); setOpenApproveDialog(true); }} sx={{ color: '#10b981' }}>
                                  <ThumbUp fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                            {house.approvalStatus !== ApprovalStatus.REJECTED && (
                              <Tooltip title={isAmharic ? 'ውድቅ አድርግ' : 'Reject'}>
                                <IconButton size="small" onClick={() => { setSelectedHouse(house); setOpenRejectDialog(true); }} sx={{ color: '#ef4444' }}>
                                  <ThumbDown fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Box>
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              </Box>
            </Box>
          </Card>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <Pagination 
              count={pagination.totalPages} 
              page={filters.page} 
              onChange={handlePageChange} 
              color="primary" 
              size={isMobile ? "small" : "medium"} 
              showFirstButton 
              showLastButton 
            />
          </Box>
        )}

        {/* Items Per Page */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <Select value={filters.limit} onChange={(e) => handleFilterChange('limit', e.target.value)} sx={selectStyle}>
              <MenuItem value={12}>12 {isAmharic ? 'በአንድ ገጽ' : 'per page'}</MenuItem>
              <MenuItem value={24}>24 {isAmharic ? 'በአንድ ገጽ' : 'per page'}</MenuItem>
              <MenuItem value={48}>48 {isAmharic ? 'በአንድ ገጽ' : 'per page'}</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* View Dialog */}
        <Dialog
          open={openViewDialog}
          onClose={() => setOpenViewDialog(false)}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 3,
              backgroundColor: isDark ? '#112240' : '#ffffff',
              border: '1px solid',
              borderColor: isDark ? '#233554' : '#e2e8f0',
              color: isDark ? '#f1f5f9' : '#0f172a',
              maxHeight: '85vh'
            }
          }}
        >
          {selectedHouse && (
            <>
              <DialogTitle sx={{ borderBottom: '1px solid', borderColor: isDark ? '#233554' : '#e2e8f0', pb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: isDark ? '#f1f5f9' : '#0f172a' }}>
                    {isAmharic ? 'ንብረቱን ይገምግሙ' : 'Review Property'}
                  </Typography>
                  <IconButton onClick={() => setOpenViewDialog(false)} sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>
                    <Close />
                  </IconButton>
                </Box>
              </DialogTitle>
              <DialogContent dividers sx={{ borderColor: isDark ? '#233554' : '#e2e8f0', py: 3 }}>
                {/* Image */}
                <Box sx={{ mb: 3, position: 'relative', height: 260, borderRadius: 3, overflow: 'hidden', bgcolor: isDark ? '#1e293b' : '#f1f5f9' }}>
                  <img 
                    src={getImageUrl(selectedHouse._id)} 
                    alt={selectedHouse.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                </Box>

                {/* Status Badges */}
                <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                  <Chip label={approvalStatusLabels[selectedHouse.approvalStatus]} color={approvalStatusColors[selectedHouse.approvalStatus]} sx={{ fontWeight: 700 }} />
                  <Chip label={houseStatusLabels[selectedHouse.status] || selectedHouse.status} color={statusColors[selectedHouse.status]} sx={{ fontWeight: 600 }} />
                  <Chip label={propertyTypeLabels[selectedHouse.propertyType]} sx={{ fontWeight: 600 }} />
                </Box>

                {/* Title */}
                <Typography variant="h5" sx={{ fontWeight: 800, mb: 1, color: isDark ? '#f1f5f9' : '#0f172a' }}>{selectedHouse.title}</Typography>
                
                {/* Location */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                  <LocationOn sx={{ fontSize: 18, color: isDark ? '#94a3b8' : '#64748b' }} />
                  <Typography variant="body2" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>
                    {selectedHouse.location.address}, {selectedHouse.location.city}, {selectedHouse.location.state} {selectedHouse.location.zipCode}
                  </Typography>
                </Box>

                {/* Details Grid */}
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 3 }}>
                  <Box sx={{ p: 2, bgcolor: isDark ? '#0a192f' : '#f8fafc', borderRadius: 2.5, border: '1px solid', borderColor: isDark ? '#233554' : '#e2e8f0' }}>
                    <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>{isAmharic ? 'ዋጋ' : 'Price'}</Typography>
                    <Typography variant="h6" sx={{ color: isDark ? '#38bdf8' : '#2563eb', fontWeight: 800 }}>{formatPrice(selectedHouse.pricing.price)}</Typography>
                  </Box>
                  <Box sx={{ p: 2, bgcolor: isDark ? '#0a192f' : '#f8fafc', borderRadius: 2.5, border: '1px solid', borderColor: isDark ? '#233554' : '#e2e8f0' }}>
                    <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>{isAmharic ? 'የሚገኙ ቤቶች ብዛት' : 'Units Available'}</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: isDark ? '#f1f5f9' : '#0f172a' }}>{selectedHouse.pricing?.quantity || 1}</Typography>
                  </Box>
                  <Box sx={{ p: 2, bgcolor: isDark ? '#0a192f' : '#f8fafc', borderRadius: 2.5, border: '1px solid', borderColor: isDark ? '#233554' : '#e2e8f0' }}>
                    <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>{isAmharic ? 'መኝታ ቤቶች' : 'Bedrooms'}</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: isDark ? '#f1f5f9' : '#0f172a' }}>{selectedHouse.details.bedrooms}</Typography>
                  </Box>
                  <Box sx={{ p: 2, bgcolor: isDark ? '#0a192f' : '#f8fafc', borderRadius: 2.5, border: '1px solid', borderColor: isDark ? '#233554' : '#e2e8f0' }}>
                    <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>{isAmharic ? 'መታጠቢያ ቤቶች' : 'Bathrooms'}</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: isDark ? '#f1f5f9' : '#0f172a' }}>{selectedHouse.details.bathrooms}</Typography>
                  </Box>
                  <Box sx={{ p: 2, bgcolor: isDark ? '#0a192f' : '#f8fafc', borderRadius: 2.5, border: '1px solid', borderColor: isDark ? '#233554' : '#e2e8f0' }}>
                    <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>{isAmharic ? 'ስፋት' : 'Area'}</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: isDark ? '#f1f5f9' : '#0f172a' }}>{selectedHouse.details.area.toLocaleString()} m²</Typography>
                  </Box>
                  <Box sx={{ p: 2, bgcolor: isDark ? '#0a192f' : '#f8fafc', borderRadius: 2.5, border: '1px solid', borderColor: isDark ? '#233554' : '#e2e8f0' }}>
                    <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>{isAmharic ? 'የተገነባበት ዓመት' : 'Year Built'}</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: isDark ? '#f1f5f9' : '#0f172a' }}>{selectedHouse.details.yearBuilt || (isAmharic ? 'አልተጠቀሰም' : 'N/A')}</Typography>
                  </Box>
                </Box>

                {/* Description */}
                <Typography variant="body1" sx={{ mb: 3, color: isDark ? '#cbd5e1' : '#334155', lineHeight: 1.6 }}>{selectedHouse.description}</Typography>

                {/* Amenities */}
                {selectedHouse.details.amenities.length > 0 && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 700, color: isDark ? '#38bdf8' : '#2563eb' }}>
                      {isAmharic ? 'ተጨማሪ አገልግሎቶች' : 'Amenities'}
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {selectedHouse.details.amenities.map(amenity => (
                        <Chip key={amenity} label={amenity} size="small" sx={{ fontWeight: 500 }} />
                      ))}
                    </Box>
                  </Box>
                )}

                {/* Agent Info */}
                <Box sx={{ p: 2, bgcolor: isDark ? '#0a192f' : '#f8fafc', borderRadius: 2.5, border: '1px solid', borderColor: isDark ? '#233554' : '#e2e8f0' }}>
                  <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 700, color: isDark ? '#38bdf8' : '#2563eb' }}>
                    {isAmharic ? 'የወኪል መረጃ' : 'Agent Information'}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: isDark ? 'rgba(56, 189, 248, 0.2)' : 'rgba(37, 99, 235, 0.1)', color: isDark ? '#38bdf8' : '#2563eb' }}>
                      <Person />
                    </Avatar>
                    <Box>
                      <Typography variant="body2" sx={{ color: isDark ? '#f1f5f9' : '#0f172a' }}>
                        <strong>{isAmharic ? 'ስም:' : 'Name:'}</strong> {selectedHouse.agentName || selectedHouse.agentId?.name || (isAmharic ? 'ያልታወቀ' : 'Unknown')}
                      </Typography>
                      <Typography variant="body2" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>
                        <strong>{isAmharic ? 'አድራሻ / ስልክ:' : 'Contact:'}</strong> {selectedHouse.agentContact || selectedHouse.agentId?.email || (isAmharic ? 'አልተጠቀሰም' : 'N/A')}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </DialogContent>
              <DialogActions sx={{ p: 2.5, display: 'flex', gap: 1.5, flexDirection: { xs: 'column-reverse', sm: 'row' }, borderTop: '1px solid', borderColor: isDark ? '#233554' : '#e2e8f0' }}>
                <Button
                  onClick={() => setOpenViewDialog(false)}
                  sx={{
                    width: { xs: '100%', sm: 'auto' },
                    color: isDark ? '#94a3b8' : '#64748b',
                    textTransform: 'none',
                    fontWeight: 600
                  }}
                >
                  {isAmharic ? 'ዝጋ' : 'Close'}
                </Button>
                {selectedHouse.approvalStatus !== ApprovalStatus.APPROVED && (
                  <Button
                    variant="contained"
                    startIcon={<ThumbUp />}
                    onClick={() => { setOpenViewDialog(false); setOpenApproveDialog(true); }}
                    sx={{
                      width: { xs: '100%', sm: 'auto' },
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 600,
                      bgcolor: '#10b981',
                      '&:hover': { bgcolor: '#059669' },
                      color: '#ffffff'
                    }}
                  >
                    {isAmharic ? 'አጽድቅ' : 'Approve'}
                  </Button>
                )}
                {selectedHouse.approvalStatus !== ApprovalStatus.REJECTED && (
                  <Button
                    variant="contained"
                    startIcon={<ThumbDown />}
                    onClick={() => { setOpenViewDialog(false); setOpenRejectDialog(true); }}
                    sx={{
                      width: { xs: '100%', sm: 'auto' },
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 600,
                      bgcolor: '#ef4444',
                      '&:hover': { bgcolor: '#dc2626' },
                      color: '#ffffff'
                    }}
                  >
                    {isAmharic ? 'ውድቅ አድርግ' : 'Reject'}
                  </Button>
                )}
              </DialogActions>
            </>
          )}
        </Dialog>

        {/* Approve Dialog */}
        <Dialog
          open={openApproveDialog}
          onClose={() => setOpenApproveDialog(false)}
          PaperProps={{
            sx: {
              borderRadius: 3,
              backgroundColor: isDark ? '#112240' : '#ffffff',
              border: '1px solid',
              borderColor: isDark ? '#233554' : '#e2e8f0',
              color: isDark ? '#f1f5f9' : '#0f172a',
              p: 1
            }
          }}
        >
          <DialogTitle sx={{ fontWeight: 700, color: isDark ? '#f1f5f9' : '#0f172a' }}>
            {isAmharic ? 'ቤቱን ማጽደቅ' : 'Approve Property'}
          </DialogTitle>
          <DialogContent>
            <Typography sx={{ color: isDark ? '#f1f5f9' : '#0f172a' }}>
              {isAmharic
                ? `እርግጠኛ ነዎት "${selectedHouse?.title}" ማጽደቅ ይፈልጋሉ?`
                : `Are you sure you want to approve "${selectedHouse?.title}"?`}
            </Typography>
            <Typography variant="caption" sx={{ display: 'block', mt: 1, color: isDark ? '#94a3b8' : '#64748b' }}>
              {isAmharic
                ? 'ይህ ቤት ወዲያውኑ ለደንበኞች ዝርዝር ውስጥ ይታያል።'
                : 'This property will become visible to customers immediately.'}
            </Typography>
          </DialogContent>
          <DialogActions sx={{ p: 2, display: 'flex', gap: 1.5, flexDirection: { xs: 'column-reverse', sm: 'row' } }}>
            <Button
              onClick={() => setOpenApproveDialog(false)}
              sx={{ width: { xs: '100%', sm: 'auto' }, color: isDark ? '#94a3b8' : '#64748b', textTransform: 'none', fontWeight: 600 }}
            >
              {isAmharic ? 'ተመለስ' : 'Cancel'}
            </Button>
            <Button
              onClick={handleApproveHouse}
              variant="contained"
              startIcon={<CheckCircle />}
              sx={{
                width: { xs: '100%', sm: 'auto' },
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                bgcolor: '#10b981',
                '&:hover': { bgcolor: '#059669' },
                color: '#ffffff'
              }}
            >
              {isAmharic ? 'አጽድቅ' : 'Approve'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Reject Dialog */}
        <Dialog
          open={openRejectDialog}
          onClose={() => setOpenRejectDialog(false)}
          PaperProps={{
            sx: {
              borderRadius: 3,
              backgroundColor: isDark ? '#112240' : '#ffffff',
              border: '1px solid',
              borderColor: isDark ? '#233554' : '#e2e8f0',
              color: isDark ? '#f1f5f9' : '#0f172a',
              p: 1
            }
          }}
        >
          <DialogTitle sx={{ fontWeight: 700, color: isDark ? '#f1f5f9' : '#0f172a' }}>
            {isAmharic ? 'ቤቱን ውድቅ ማድረግ' : 'Reject Property'}
          </DialogTitle>
          <DialogContent>
            <Typography sx={{ color: isDark ? '#f1f5f9' : '#0f172a' }}>
              {isAmharic
                ? `እርግጠኛ ነዎት "${selectedHouse?.title}" ውድቅ ማድረግ ይፈልጋሉ?`
                : `Are you sure you want to reject "${selectedHouse?.title}"?`}
            </Typography>
            <TextField
              fullWidth
              label={isAmharic ? 'ውድቅ የተደረገበት ምክንያት (አማራጭ)' : 'Reason for Rejection (Optional)'}
              multiline
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder={isAmharic ? 'ለወኪሉ አስተያየት ይስጡ...' : 'Provide feedback to the agent...'}
              sx={{ mt: 2, ...textFieldStyle }}
            />
          </DialogContent>
          <DialogActions sx={{ p: 2, display: 'flex', gap: 1.5, flexDirection: { xs: 'column-reverse', sm: 'row' } }}>
            <Button
              onClick={() => setOpenRejectDialog(false)}
              sx={{ width: { xs: '100%', sm: 'auto' }, color: isDark ? '#94a3b8' : '#64748b', textTransform: 'none', fontWeight: 600 }}
            >
              {isAmharic ? 'ተመለስ' : 'Cancel'}
            </Button>
            <Button
              onClick={handleRejectHouse}
              variant="contained"
              startIcon={<Cancel />}
              sx={{
                width: { xs: '100%', sm: 'auto' },
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                bgcolor: '#ef4444',
                '&:hover': { bgcolor: '#dc2626' },
                color: '#ffffff'
              }}
            >
              {isAmharic ? 'ውድቅ አድርግ' : 'Reject'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Notifications */}
        <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError('')} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
          <Alert severity="error" onClose={() => setError('')}>{error}</Alert>
        </Snackbar>
        <Snackbar open={!!success} autoHideDuration={6000} onClose={() => setSuccess('')} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
          <Alert severity="success" onClose={() => setSuccess('')}>{success}</Alert>
        </Snackbar>
      </Box>
    </div>
  );
};

export default HouseReviewPage;