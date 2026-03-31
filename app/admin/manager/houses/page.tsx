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

const propertyTypeLabels: Record<PropertyType, string> = {
  [PropertyType.APARTMENT]: 'Apartment',
  [PropertyType.VILLA]: 'Villa',
  [PropertyType.CONDO]: 'Condo',
  [PropertyType.HOUSE]: 'House',
  [PropertyType.LAND]: 'Land'
};

const approvalStatusColors: Record<string, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
  [ApprovalStatus.APPROVED]: 'success',
  [ApprovalStatus.PENDING]: 'warning',
  [ApprovalStatus.REJECTED]: 'error'
};

const approvalStatusLabels: Record<string, string> = {
  [ApprovalStatus.APPROVED]: 'Approved',
  [ApprovalStatus.PENDING]: 'Pending',
  [ApprovalStatus.REJECTED]: 'Rejected'
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
  const isMobile = useMediaQuery('(max-width: 768px)');
  
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
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
    } catch {
      return 'Invalid date';
    }
  };

  const statCards = [
    { title: 'Total Properties', value: stats.total, icon: <Home />, color: '#00ffff', description: 'All properties in system' },
    { title: 'Pending Approval', value: stats.pending, icon: <HourglassEmpty />, color: '#ff9900', description: 'Waiting for review' },
    { title: 'Approved', value: stats.approved, icon: <CheckCircle />, color: '#00ff00', description: 'Active listings' },
    { title: 'Rejected', value: stats.rejected, icon: <Cancel />, color: '#ff0000', description: 'Inactive properties' }
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
      {/* <Navbar /> */}
      
      <Box sx={{ pt: 2, pb: 4, px: { xs: 2, md: 4 } }}>
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Box sx={{ mb: 4 }}>
            <Typography variant={isMobile ? "h5" : "h4"} sx={{ fontWeight: 'bold', color: theme === 'dark' ? '#ccd6f6' : '#333333', mb: 1 }}>
              House Review Management
            </Typography>
            <Typography variant="body2" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
              Review and manage all properties - approve, reject, or update status
            </Typography>
          </Box>
        </motion.div>

        {/* Statistics Cards */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 4 }}>
            {statCards.map((stat, index) => (
              <Box key={index} sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 16px)', md: '1 1 calc(25% - 16px)' }, minWidth: '200px' }}>
                <Card sx={{ borderRadius: 3, borderLeft: `4px solid ${stat.color}`, backgroundColor: theme === 'dark' ? '#0f172a80' : 'white', backdropFilter: theme === 'dark' ? 'blur(10px)' : 'none' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box>
                        <Typography variant="h3" sx={{ fontWeight: 'bold', color: theme === 'dark' ? '#ccd6f6' : '#333333', fontSize: '2.5rem' }}>
                          {stat.value}
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
                  <FilterList /> All Properties ({stats.total})
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
                <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(33.33% - 16px)', md: '1 1 calc(33.33% - 16px)' }, minWidth: '200px' }}>
                  <TextField fullWidth size="small" label="Search" value={filters.search} onChange={(e) => handleFilterChange('search', e.target.value)} placeholder="Title, address, city..." InputProps={{ startAdornment: <Search sx={{ mr: 1 }} /> }} sx={textFieldStyle} />
                </Box>
                <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(33.33% - 16px)', md: '1 1 calc(33.33% - 16px)' }, minWidth: '150px' }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Property Type</InputLabel>
                    <Select value={filters.propertyType} label="Property Type" onChange={(e) => handleFilterChange('propertyType', e.target.value)} sx={selectStyle}>
                      <MenuItem value="">All Types</MenuItem>
                      {Object.entries(propertyTypeLabels).map(([value, label]) => <MenuItem key={value} value={value}>{label}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Box>
                <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(33.33% - 16px)', md: '1 1 calc(33.33% - 16px)' }, minWidth: '150px' }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Approval Status</InputLabel>
                    <Select value={filters.approvalStatus} label="Approval Status" onChange={(e) => handleFilterChange('approvalStatus', e.target.value)} sx={selectStyle}>
                      <MenuItem value="">All Status</MenuItem>
                      <MenuItem value={ApprovalStatus.PENDING}>Pending</MenuItem>
                      <MenuItem value={ApprovalStatus.APPROVED}>Approved</MenuItem>
                      <MenuItem value={ApprovalStatus.REJECTED}>Rejected</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
                <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(33.33% - 16px)', md: '1 1 calc(33.33% - 16px)' }, minWidth: '150px' }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Sort By</InputLabel>
                    <Select value={filters.sortBy} label="Sort By" onChange={(e) => handleFilterChange('sortBy', e.target.value)} sx={selectStyle}>
                      <MenuItem value="created_at">Newest First</MenuItem>
                      <MenuItem value="title">Title A-Z</MenuItem>
                      <MenuItem value="pricing.price">Price: Low to High</MenuItem>
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
                  <Box key={house._id} sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 24px)', md: '1 1 calc(33.33% - 24px)' }, minWidth: { xs: '100%', sm: '350px' } }}>
                    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: index * 0.05 }} whileHover={{ y: -8 }}>
                      <Card sx={{ height: '100%', borderRadius: 3, overflow: 'hidden', backgroundColor: theme === 'dark' ? '#0f172a80' : 'white', backdropFilter: theme === 'dark' ? 'blur(10px)' : 'none' }}>
                        <Box sx={{ position: 'relative', height: 200, overflow: 'hidden', bgcolor: theme === 'dark' ? '#1e293b' : '#f5f5f5' }}>
                          {!hasImageError ? (
                            <img 
                              src={imageUrl} 
                              alt={house.title} 
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              onError={() => handleImageError(house._id)}
                            />
                          ) : (
                            <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: theme === 'dark' ? '#334155' : '#e5e7eb' }}>
                              <Home sx={{ fontSize: 48, color: theme === 'dark' ? '#a8b2d1' : '#94a3b8' }} />
                            </Box>
                          )}
                          <Chip 
                            label={approvalStatusLabels[house.approvalStatus]} 
                            size="small" 
                            color={approvalStatusColors[house.approvalStatus]} 
                            sx={{ position: 'absolute', top: 12, right: 12, height: 24 }} 
                          />
                          <Chip 
                            label={propertyTypeLabels[house.propertyType]} 
                            size="small" 
                            sx={{ position: 'absolute', top: 12, left: 12, height: 24, backgroundColor: theme === 'dark' ? '#334155' : '#e5e7eb' }} 
                          />
                          {house.pricing?.quantity > 1 && (
                            <Chip 
                              icon={<Inventory />} 
                              label={`${house.pricing.quantity} units`} 
                              size="small" 
                              sx={{ position: 'absolute', bottom: 12, right: 12, height: 24, backgroundColor: theme === 'dark' ? '#00ffff20' : '#007bff10', color: theme === 'dark' ? '#00ffff' : '#007bff' }} 
                            />
                          )}
                        </Box>
                        <CardContent>
                          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1, display: '-webkit-box', WebkitLineClamp: 2, overflow: 'hidden' }}>{house.title}</Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                            <LocationOn sx={{ fontSize: 14, color: 'text.secondary' }} />
                            <Typography variant="caption" color="text.secondary">{house.location.city}, {house.location.state}</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><Bed sx={{ fontSize: 14 }} /><Typography variant="body2">{house.details.bedrooms}</Typography></Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><Bathtub sx={{ fontSize: 14 }} /><Typography variant="body2">{house.details.bathrooms}</Typography></Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><SquareFoot sx={{ fontSize: 14 }} /><Typography variant="body2">{house.details.area.toLocaleString()} sqft</Typography></Box>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h5" sx={{ fontWeight: 'bold', color: theme === 'dark' ? '#00ffff' : '#007bff' }}>{formatPrice(house.pricing.price)}</Typography>
                            <Chip 
                              label={house.status === HouseStatus.AVAILABLE ? 'Available' : house.status === HouseStatus.SOLD ? 'Sold' : house.status === HouseStatus.RENTED ? 'Rented' : 'Unavailable'} 
                              size="small" 
                              color={statusColors[house.status]} 
                            />
                          </Box>
                          <Divider sx={{ my: 1 }} />
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Person sx={{ fontSize: 14, color: 'text.secondary' }} />
                            <Typography variant="caption" color="text.secondary">Agent: {house.agentName || house.agentId?.name || 'Unknown'}</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CalendarToday sx={{ fontSize: 14, color: 'text.secondary' }} />
                            <Typography variant="caption" color="text.secondary">Submitted: {formatDate(house.created_at)}</Typography>
                          </Box>
                        </CardContent>
                        <Divider />
                        <CardActions sx={{ p: 2, display: 'flex', gap: 1 }}>
                          <Button 
                            size="small" 
                            variant="outlined" 
                            startIcon={<Visibility />} 
                            onClick={() => { setSelectedHouse(house); setOpenViewDialog(true); }}
                            sx={{ flex: 1 }}>Review</Button>
                          {house.approvalStatus !== ApprovalStatus.APPROVED && (
                            <Button 
                              size="small" 
                              variant="contained" 
                              startIcon={<ThumbUp />} 
                              onClick={() => { setSelectedHouse(house); setOpenApproveDialog(true); }}
                              sx={{ flex: 1, background: theme === 'dark' ? 'linear-gradient(135deg, #00ff00, #00b300)' : 'linear-gradient(135deg, #28a745, #218838)' }}>Approve</Button>
                          )}
                          {house.approvalStatus !== ApprovalStatus.REJECTED && (
                            <Button 
                              size="small" 
                              variant="contained" 
                              startIcon={<ThumbDown />} 
                              onClick={() => { setSelectedHouse(house); setOpenRejectDialog(true); }}
                              sx={{ flex: 1, background: theme === 'dark' ? 'linear-gradient(135deg, #ff0000, #cc0000)' : 'linear-gradient(135deg, #dc3545, #c82333)' }}>Reject</Button>
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
          <Card sx={{ borderRadius: 3, overflow: 'hidden', backgroundColor: theme === 'dark' ? '#0f172a80' : 'white' }}>
            <Box sx={{ overflowX: 'auto' }}>
              <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse' }}>
                <Box component="thead" sx={{ background: theme === 'dark' ? 'linear-gradient(135deg, #00ffff, #00b3b3)' : 'linear-gradient(135deg, #007bff, #0056b3)' }}>
                  <Box component="tr" sx={{ display: 'table-row' }}>
                    {['Property', 'Type', 'Location', 'Price', 'Units', 'Status', 'Approval', 'Submitted', 'Actions'].map(header => (
                      <Box key={header} component="th" sx={{ p: 2, textAlign: 'left', color: 'white', fontWeight: 'bold' }}>{header}</Box>
                    ))}
                  </Box>
                </Box>
                <Box component="tbody">
                  {houses.map(house => {
                    const imageUrl = getImageUrl(house._id);
                    return (
                      <Box key={house._id} component="tr" sx={{ display: 'table-row', borderBottom: 1, borderColor: 'divider', '&:hover': { bgcolor: theme === 'dark' ? '#1e293b' : '#f8fafc' } }}>
                        <Box component="td" sx={{ p: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box sx={{ width: 50, height: 40, borderRadius: 1, overflow: 'hidden', bgcolor: theme === 'dark' ? '#334155' : '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <img 
                                src={imageUrl} 
                                alt="" 
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                              />
                            </Box>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>{house.title}</Typography>
                              <Typography variant="caption" color="text.secondary">{house.details.bedrooms} beds • {house.details.bathrooms} baths • {house.details.area} sqft</Typography>
                            </Box>
                          </Box>
                        </Box>
                        <Box component="td" sx={{ p: 2 }}><Chip label={propertyTypeLabels[house.propertyType]} size="small" /></Box>
                        <Box component="td" sx={{ p: 2 }}><Typography variant="body2">{house.location.city}</Typography><Typography variant="caption" color="text.secondary">{house.location.state}</Typography></Box>
                        <Box component="td" sx={{ p: 2 }}><Typography variant="body2" sx={{ fontWeight: 'bold', color: theme === 'dark' ? '#00ffff' : '#007bff' }}>{formatPrice(house.pricing.price)}</Typography></Box>
                        <Box component="td" sx={{ p: 2 }}><Chip label={`${house.pricing?.quantity || 1} units`} size="small" icon={<Inventory />} /></Box>
                        <Box component="td" sx={{ p: 2 }}>
                          <Chip 
                            label={house.status === HouseStatus.AVAILABLE ? 'Available' : house.status === HouseStatus.SOLD ? 'Sold' : house.status === HouseStatus.RENTED ? 'Rented' : 'Unavailable'} 
                            size="small" 
                            color={statusColors[house.status]} 
                          />
                        </Box>
                        <Box component="td" sx={{ p: 2 }}>
                          <Chip 
                            label={approvalStatusLabels[house.approvalStatus]} 
                            size="small" 
                            color={approvalStatusColors[house.approvalStatus]} 
                          />
                        </Box>
                        <Box component="td" sx={{ p: 2 }}><Typography variant="caption">{formatDate(house.created_at)}</Typography></Box>
                        <Box component="td" sx={{ p: 2 }}>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <IconButton size="small" onClick={() => { setSelectedHouse(house); setOpenViewDialog(true); }}><Visibility /></IconButton>
                            {house.approvalStatus !== ApprovalStatus.APPROVED && (
                              <IconButton size="small" onClick={() => { setSelectedHouse(house); setOpenApproveDialog(true); }} sx={{ color: '#00ff00' }}><ThumbUp /></IconButton>
                            )}
                            {house.approvalStatus !== ApprovalStatus.REJECTED && (
                              <IconButton size="small" onClick={() => { setSelectedHouse(house); setOpenRejectDialog(true); }} sx={{ color: '#ff0000' }}><ThumbDown /></IconButton>
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
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <Select value={filters.limit} onChange={(e) => handleFilterChange('limit', e.target.value)} sx={selectStyle}>
              <MenuItem value={12}>12 per page</MenuItem>
              <MenuItem value={24}>24 per page</MenuItem>
              <MenuItem value={48}>48 per page</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* View Dialog */}
        <Dialog
          open={openViewDialog}
          onClose={() => setOpenViewDialog(false)}
          maxWidth="md"
          fullWidth
          PaperProps={{ sx: { borderRadius: 3, backgroundColor: theme === 'dark' ? '#0f172a' : 'white', maxHeight: '80vh' } }}
        >
          {selectedHouse && (
            <>
              <DialogTitle>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6">Review Property</Typography>
                  <IconButton onClick={() => setOpenViewDialog(false)}><Close /></IconButton>
                </Box>
              </DialogTitle>
              <DialogContent dividers>
                {/* Image */}
                <Box sx={{ mb: 3, position: 'relative', height: 250, borderRadius: 2, overflow: 'hidden', bgcolor: theme === 'dark' ? '#1e293b' : '#f5f5f5' }}>
                  <img 
                    src={getImageUrl(selectedHouse._id)} 
                    alt={selectedHouse.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                </Box>

                {/* Status Badges */}
                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                  <Chip label={approvalStatusLabels[selectedHouse.approvalStatus]} color={approvalStatusColors[selectedHouse.approvalStatus]} />
                  <Chip label={selectedHouse.status === HouseStatus.AVAILABLE ? 'Available' : selectedHouse.status === HouseStatus.SOLD ? 'Sold' : selectedHouse.status === HouseStatus.RENTED ? 'Rented' : 'Unavailable'} color={statusColors[selectedHouse.status]} />
                  <Chip label={propertyTypeLabels[selectedHouse.propertyType]} />
                </Box>

                {/* Title */}
                <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>{selectedHouse.title}</Typography>
                
                {/* Location */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <LocationOn sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    {selectedHouse.location.address}, {selectedHouse.location.city}, {selectedHouse.location.state} {selectedHouse.location.zipCode}
                  </Typography>
                </Box>

                {/* Details Grid */}
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 3 }}>
                  <Box sx={{ p: 2, bgcolor: theme === 'dark' ? '#1e293b' : '#f8f9fa', borderRadius: 2 }}>
                    <Typography variant="caption" color="text.secondary">Price</Typography>
                    <Typography variant="h6" sx={{ color: theme === 'dark' ? '#00ffff' : '#007bff' }}>{formatPrice(selectedHouse.pricing.price)}</Typography>
                  </Box>
                  <Box sx={{ p: 2, bgcolor: theme === 'dark' ? '#1e293b' : '#f8f9fa', borderRadius: 2 }}>
                    <Typography variant="caption" color="text.secondary">Units Available</Typography>
                    <Typography variant="h6">{selectedHouse.pricing?.quantity || 1}</Typography>
                  </Box>
                  <Box sx={{ p: 2, bgcolor: theme === 'dark' ? '#1e293b' : '#f8f9fa', borderRadius: 2 }}>
                    <Typography variant="caption" color="text.secondary">Bedrooms</Typography>
                    <Typography variant="h6">{selectedHouse.details.bedrooms}</Typography>
                  </Box>
                  <Box sx={{ p: 2, bgcolor: theme === 'dark' ? '#1e293b' : '#f8f9fa', borderRadius: 2 }}>
                    <Typography variant="caption" color="text.secondary">Bathrooms</Typography>
                    <Typography variant="h6">{selectedHouse.details.bathrooms}</Typography>
                  </Box>
                  <Box sx={{ p: 2, bgcolor: theme === 'dark' ? '#1e293b' : '#f8f9fa', borderRadius: 2 }}>
                    <Typography variant="caption" color="text.secondary">Area</Typography>
                    <Typography variant="h6">{selectedHouse.details.area.toLocaleString()} sqft</Typography>
                  </Box>
                  <Box sx={{ p: 2, bgcolor: theme === 'dark' ? '#1e293b' : '#f8f9fa', borderRadius: 2 }}>
                    <Typography variant="caption" color="text.secondary">Year Built</Typography>
                    <Typography variant="h6">{selectedHouse.details.yearBuilt || 'N/A'}</Typography>
                  </Box>
                </Box>

                {/* Description */}
                <Typography variant="body1" sx={{ mb: 2 }}>{selectedHouse.description}</Typography>

                {/* Amenities */}
                {selectedHouse.details.amenities.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1, color: theme === 'dark' ? '#00ffff' : '#007bff' }}>Amenities</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {selectedHouse.details.amenities.map(amenity => (
                        <Chip key={amenity} label={amenity} size="small" />
                      ))}
                    </Box>
                  </Box>
                )}

                {/* Agent Info */}
                <Box sx={{ mt: 2, p: 2, bgcolor: theme === 'dark' ? '#1e293b' : '#f8f9fa', borderRadius: 2 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1, color: theme === 'dark' ? '#00ffff' : '#007bff' }}>Agent Information</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: theme === 'dark' ? '#00ffff20' : '#007bff10' }}><Person /></Avatar>
                    <Box>
                      <Typography variant="body2"><strong>Name:</strong> {selectedHouse.agentName || selectedHouse.agentId?.name || 'Unknown'}</Typography>
                      <Typography variant="body2"><strong>Contact:</strong> {selectedHouse.agentContact || selectedHouse.agentId?.email || 'N/A'}</Typography>
                    </Box>
                  </Box>
                </Box>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setOpenViewDialog(false)}>Close</Button>
                {selectedHouse.approvalStatus !== ApprovalStatus.APPROVED && (
                  <Button variant="contained" color="success" startIcon={<ThumbUp />} onClick={() => { setOpenViewDialog(false); setOpenApproveDialog(true); }}>Approve</Button>
                )}
                {selectedHouse.approvalStatus !== ApprovalStatus.REJECTED && (
                  <Button variant="contained" color="error" startIcon={<ThumbDown />} onClick={() => { setOpenViewDialog(false); setOpenRejectDialog(true); }}>Reject</Button>
                )}
              </DialogActions>
            </>
          )}
        </Dialog>

        {/* Approve Dialog */}
        <Dialog open={openApproveDialog} onClose={() => setOpenApproveDialog(false)} PaperProps={{ sx: { borderRadius: 3, backgroundColor: theme === 'dark' ? '#0f172a' : 'white' } }}>
          <DialogTitle>Approve Property</DialogTitle>
          <DialogContent>
            <Typography>Are you sure you want to approve <strong>"{selectedHouse?.title}"</strong>?</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
              This property will become visible to customers immediately.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenApproveDialog(false)}>Cancel</Button>
            <Button onClick={handleApproveHouse} variant="contained" color="success" startIcon={<CheckCircle />}>Approve</Button>
          </DialogActions>
        </Dialog>

        {/* Reject Dialog */}
        <Dialog open={openRejectDialog} onClose={() => setOpenRejectDialog(false)} PaperProps={{ sx: { borderRadius: 3, backgroundColor: theme === 'dark' ? '#0f172a' : 'white' } }}>
          <DialogTitle>Reject Property</DialogTitle>
          <DialogContent>
            <Typography>Are you sure you want to reject <strong>"{selectedHouse?.title}"</strong>?</Typography>
            <TextField
              fullWidth
              label="Reason for Rejection (Optional)"
              multiline
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Provide feedback to the agent..."
              sx={{ mt: 2, ...textFieldStyle }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenRejectDialog(false)}>Cancel</Button>
            <Button onClick={handleRejectHouse} variant="contained" color="error" startIcon={<Cancel />}>Reject</Button>
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