// app/admin/houses/approve/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Card, CardContent,
  TextField, Button, Chip, Alert, Snackbar,
  CircularProgress, useMediaQuery, Pagination,
  MenuItem, Select, FormControl, InputLabel,
  IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, Divider, Tooltip, Avatar,
  ToggleButton, ToggleButtonGroup, LinearProgress
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/lib/theme-context';
import {
  Home, CheckCircle, Cancel, Pending,
  Visibility, LocationOn, AttachMoney,
  Bed, Bathtub, SquareFoot,
  Search, Refresh, Assignment,
  Phone, Email, Work, CalendarToday,
  Description, FileCopy, Person,
  ThumbUp, ThumbDown, Receipt
} from '@mui/icons-material';
import api from '@/app/utils/api';
import { format } from 'date-fns';

interface RentalApplication {
  _id: string;
  houseId: {
    _id: string;
    title: string;
    address: string;
    price: number;
    city: string;
    state: string;
    bedrooms: number;
    bathrooms: number;
    area: number;
    images?: any[];
  };
  userId: string | null;
  fullName: string;
  email: string;
  phone: string;
  occupation: string;
  monthlyIncome: number;
  numberOfOccupants: number;
  preferredMoveInDate: string;
  message?: string;
  documents?: Array<{
    data: any;
    contentType: string;
    fileName: string;
    documentType: string;
  }>;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  adminNotes?: string;
  created_at: string;
  updated_at: string;
}

interface PaginationData {
  currentPage: number;
  totalPages: number;
  totalApplications: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface ApplicationStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  cancelled: number;
}

const statusColors = {
  PENDING: { bg: '#ff990020', color: '#ff9900', icon: <Pending /> },
  APPROVED: { bg: '#00ff0020', color: '#00ff00', icon: <CheckCircle /> },
  REJECTED: { bg: '#ff000020', color: '#ff0000', icon: <Cancel /> },
  CANCELLED: { bg: '#88888820', color: '#888888', icon: <Cancel /> }
};

const statusOptions = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'CANCELLED', label: 'Cancelled' }
];

const HouseApprovalPage = () => {
  const { theme } = useTheme();
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  const [applications, setApplications] = useState<RentalApplication[]>([]);
  const [stats, setStats] = useState<ApplicationStats>({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    cancelled: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [pagination, setPagination] = useState<PaginationData>({
    currentPage: 1,
    totalPages: 1,
    totalApplications: 0,
    hasNext: false,
    hasPrev: false
  });
  const [selectedApp, setSelectedApp] = useState<RentalApplication | null>(null);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [openReviewDialog, setOpenReviewDialog] = useState(false);
  const [reviewStatus, setReviewStatus] = useState<'APPROVED' | 'REJECTED'>('APPROVED');
  const [adminNotes, setAdminNotes] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'cards'>('cards');

  const [filters, setFilters] = useState({
    search: '',
    status: '',
    page: 1,
    limit: 10
  });

  const themeStyles = {
    background: theme === 'dark' 
      ? 'linear-gradient(135deg, #0a192f, #112240)' 
      : 'linear-gradient(135deg, #f0f0f0, #ffffff)',
    textColor: theme === 'dark' ? '#ccd6f6' : '#333333',
    primaryColor: theme === 'dark' ? '#00ffff' : '#007bff',
    cardBg: theme === 'dark' ? '#0f172a80' : '#ffffff',
    cardBorder: theme === 'dark' ? '#334155' : '#e5e7eb',
  };

  const textFieldStyle = {
    '& .MuiOutlinedInput-root': {
      backgroundColor: theme === 'dark' ? '#1e293b' : 'white',
      color: theme === 'dark' ? '#ccd6f6' : '#333333',
      '& fieldset': {
        borderColor: theme === 'dark' ? '#334155' : '#e5e7eb',
      },
      '&:hover fieldset': {
        borderColor: theme === 'dark' ? '#00ffff' : '#007bff',
      },
      '&.Mui-focused fieldset': {
        borderColor: theme === 'dark' ? '#00ffff' : '#007bff',
      },
    },
    '& .MuiInputLabel-root': {
      color: theme === 'dark' ? '#a8b2d1' : '#666666',
    },
  };

  const selectStyle = {
    borderRadius: 1,
    backgroundColor: theme === 'dark' ? '#1e293b' : 'white',
    color: theme === 'dark' ? '#ccd6f6' : '#333333',
    '& .MuiOutlinedInput-notchedOutline': {
      borderColor: theme === 'dark' ? '#334155' : '#e5e7eb',
    },
    '&:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: theme === 'dark' ? '#00ffff' : '#007bff',
    },
  };

  const fetchApplications = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== '') {
          params.append(key, value.toString());
        }
      });

      const response = await api.get(`/houses/applications?${params}`);
      const apps = response.data.data.applications || [];
      setApplications(apps);
      setPagination(response.data.data.pagination);
      
      // Calculate stats
      const total = apps.length;
      const pending = apps.filter((a: any) => a.status === 'PENDING').length;
      const approved = apps.filter((a: any) => a.status === 'APPROVED').length;
      const rejected = apps.filter((a: any) => a.status === 'REJECTED').length;
      const cancelled = apps.filter((a: any) => a.status === 'CANCELLED').length;
      setStats({ total, pending, approved, rejected, cancelled });
      
      setError('');
    } catch (error: any) {
      console.error('Error fetching applications:', error);
      setError(error.response?.data?.message || 'Failed to fetch applications');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const handleUpdateStatus = async () => {
    if (!selectedApp) return;

    try {
      await api.patch(`/houses/applications/${selectedApp._id}`, {
        status: reviewStatus,
        adminNotes: adminNotes
      });
      
      setSuccess(`Application ${reviewStatus.toLowerCase()} successfully`);
      setOpenReviewDialog(false);
      setSelectedApp(null);
      setAdminNotes('');
      fetchApplications();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to update application status');
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch {
      return 'Invalid date';
    }
  };

  const formatDateTime = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
    } catch {
      return 'Invalid date';
    }
  };

  const getStatusBadge = (status: string) => {
    const config = statusColors[status as keyof typeof statusColors] || statusColors.PENDING;
    return (
      <Chip
        label={status}
        size="small"
        icon={config.icon}
        sx={{
          backgroundColor: config.bg,
          color: config.color,
          '& .MuiChip-icon': { color: config.color },
          fontWeight: 500
        }}
      />
    );
  };

  const getIncomeLevel = (income: number) => {
    if (income >= 5000) return { label: 'High', color: '#00ff00' };
    if (income >= 3000) return { label: 'Medium', color: '#ff9900' };
    return { label: 'Low', color: '#ff0000' };
  };

  const statCards = [
    { title: 'Total Applications', value: stats.total, icon: <Assignment />, color: theme === 'dark' ? '#00ffff' : '#007bff' },
    { title: 'Pending Review', value: stats.pending, icon: <Pending />, color: '#ff9900' },
    { title: 'Approved', value: stats.approved, icon: <CheckCircle />, color: '#00ff00' },
    { title: 'Rejected', value: stats.rejected, icon: <Cancel />, color: '#ff0000' }
  ];

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      theme === 'dark' 
        ? 'bg-gradient-to-br from-[#0a192f] to-[#112240] text-white' 
        : 'bg-gradient-to-br from-[#f0f0f0] to-[#ffffff] text-[#333333]'
    }`}>
      <Box sx={{ py: 3, px: 2 }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Box sx={{ mb: 4 }}>
            <Typography variant={isMobile ? "h5" : "h4"} sx={{ 
              fontWeight: 'bold', 
              color: theme === 'dark' ? '#ccd6f6' : '#333333',
              mb: 1 
            }}>
              Rental Applications
            </Typography>
            <Typography variant={isMobile ? "body2" : "body1"} color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
              Review and manage tenant applications
            </Typography>
          </Box>
        </motion.div>

        {/* Statistics Cards - Flexbox Layout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Box sx={{ 
            display: 'flex',
            flexWrap: 'wrap',
            gap: 2,
            mb: 4,
            '& > *': {
              flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 16px)', md: '1 1 calc(25% - 16px)' },
              minWidth: { xs: '100%', sm: '200px' }
            }
          }}>
            {statCards.map((stat, index) => (
              <Card 
                key={index}
                sx={{ 
                  borderRadius: 2,
                  boxShadow: theme === 'dark' ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.1)',
                  borderLeft: `4px solid ${stat.color}`,
                  backgroundColor: theme === 'dark' ? '#0f172a80' : 'white',
                  backdropFilter: theme === 'dark' ? 'blur(10px)' : 'none'
                }}
              >
                <CardContent sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="h4" sx={{ fontWeight: 'bold', fontSize: '1.75rem' }}>
                        {stat.value}
                      </Typography>
                      <Typography variant="caption" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                        {stat.title}
                      </Typography>
                    </Box>
                    <Box sx={{ 
                      width: 48, height: 48, borderRadius: '50%',
                      backgroundColor: `${stat.color}20`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: stat.color
                    }}>
                      {stat.icon}
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        </motion.div>

        {/* Filter Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card sx={{ 
            mb: 4, 
            borderRadius: 2,
            backgroundColor: theme === 'dark' ? '#0f172a80' : 'white',
            backdropFilter: theme === 'dark' ? 'blur(10px)' : 'none'
          }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ 
                display: 'flex', 
                flexDirection: { xs: 'column', md: 'row' },
                justifyContent: 'space-between',
                alignItems: { xs: 'stretch', md: 'center' },
                gap: 3,
                mb: 3
              }}>
                <Typography variant="h6" sx={{ 
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}>
                  <Assignment /> Applications
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                  <ToggleButtonGroup
                    value={viewMode}
                    exclusive
                    onChange={(e, newMode) => newMode && setViewMode(newMode)}
                    size="small"
                    sx={{
                      '& .MuiToggleButton-root': {
                        borderColor: theme === 'dark' ? '#334155' : '#e5e7eb',
                        color: theme === 'dark' ? '#a8b2d1' : '#666666',
                        '&.Mui-selected': {
                          backgroundColor: theme === 'dark' ? '#00ffff20' : '#007bff10',
                          color: theme === 'dark' ? '#00ffff' : '#007bff',
                        }
                      }
                    }}
                  >
                    <ToggleButton value="cards">Cards</ToggleButton>
                    <ToggleButton value="list">List</ToggleButton>
                  </ToggleButtonGroup>
                  
                  <Button
                    variant="outlined"
                    startIcon={<Refresh />}
                    onClick={() => fetchApplications()}
                    sx={{ 
                      borderRadius: 1,
                      borderColor: theme === 'dark' ? '#00ffff' : '#007bff',
                      color: theme === 'dark' ? '#00ffff' : '#007bff',
                    }}
                  >
                    Refresh
                  </Button>
                </Box>
              </Box>
              
              {/* Filters */}
              <Box sx={{ 
                display: 'flex',
                flexWrap: 'wrap',
                gap: 2,
                '& > *': {
                  flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 16px)', md: '1 1 calc(33.33% - 16px)' },
                  minWidth: '150px'
                }
              }}>
                <TextField
                  size="small"
                  label="Search"
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
                  placeholder="Name, email, phone..."
                  InputProps={{
                    startAdornment: <Search sx={{ mr: 1, fontSize: 20 }} />
                  }}
                  sx={textFieldStyle}
                />
                
                <FormControl size="small">
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={filters.status}
                    label="Status"
                    onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
                    sx={selectStyle}
                  >
                    <MenuItem value="">All</MenuItem>
                    {statusOptions.map(opt => (
                      <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </CardContent>
          </Card>
        </motion.div>

        {/* Applications List */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
            <CircularProgress size={60} sx={{ color: theme === 'dark' ? '#00ffff' : '#007bff' }} />
          </Box>
        ) : applications.length === 0 ? (
          <Card sx={{ 
            textAlign: 'center', 
            py: 8, 
            backgroundColor: theme === 'dark' ? '#0f172a80' : 'white',
            borderRadius: 2
          }}>
            <Assignment sx={{ fontSize: 64, color: theme === 'dark' ? '#334155' : '#cbd5e1', mb: 2 }} />
            <Typography variant="h6">No applications found</Typography>
            <Typography variant="body2" color={theme === 'dark' ? '#94a3b8' : '#999999'}>
              {filters.search || filters.status ? 'Try adjusting your filters' : 'No rental applications yet'}
            </Typography>
          </Card>
        ) : viewMode === 'cards' ? (
          // Card View - Flexbox Layout
          <Box sx={{ 
            display: 'flex',
            flexWrap: 'wrap',
            gap: 3,
            '& > *': {
              flex: { xs: '1 1 100%', md: '1 1 calc(50% - 24px)', lg: '1 1 calc(33.33% - 24px)' },
              minWidth: { xs: '100%', md: '320px' }
            }
          }}>
            <AnimatePresence>
              {applications.map((app, index) => {
                const incomeLevel = getIncomeLevel(app.monthlyIncome);
                const propertyImage = app.houseId?.images?.[0]?.data;
                
                return (
                  <motion.div
                    key={app._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    style={{ width: '100%' }}
                  >
                    <Card sx={{ 
                      borderRadius: 2,
                      overflow: 'hidden',
                      backgroundColor: theme === 'dark' ? '#0f172a80' : 'white',
                      backdropFilter: theme === 'dark' ? 'blur(10px)' : 'none',
                      border: theme === 'dark' ? '1px solid #334155' : '1px solid #e5e7eb',
                      transition: 'transform 0.2s',
                      '&:hover': { transform: 'translateY(-4px)' }
                    }}>
                      {/* Header with Property Info */}
                      <Box sx={{ 
                        p: 2, 
                        background: theme === 'dark' ? 'linear-gradient(135deg, #00ffff20, #00b3b320)' : 'linear-gradient(135deg, #007bff10, #0056b310)',
                        borderBottom: theme === 'dark' ? '1px solid #334155' : '1px solid #e5e7eb'
                      }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                              {app.houseId?.title || 'Property'}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <LocationOn sx={{ fontSize: 14, color: theme === 'dark' ? '#a8b2d1' : '#666666' }} />
                              <Typography variant="caption" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                                {app.houseId?.city}, {app.houseId?.state}
                              </Typography>
                            </Box>
                          </Box>
                          {getStatusBadge(app.status)}
                        </Box>
                        
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <AttachMoney sx={{ fontSize: 14 }} />
                            <Typography variant="body2">{formatPrice(app.houseId?.price)}/month</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Bed sx={{ fontSize: 14 }} />
                            <Typography variant="body2">{app.houseId?.bedrooms} bed</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Bathtub sx={{ fontSize: 14 }} />
                            <Typography variant="body2">{app.houseId?.bathrooms} bath</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <SquareFoot sx={{ fontSize: 14 }} />
                            <Typography variant="body2">{app.houseId?.area} sqft</Typography>
                          </Box>
                        </Box>
                      </Box>
                      
                      {/* Applicant Info */}
                      <CardContent sx={{ p: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                          <Avatar sx={{ bgcolor: theme === 'dark' ? '#00ffff' : '#007bff' }}>
                            <Person />
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                              {app.fullName}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                              <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Email sx={{ fontSize: 12 }} /> {app.email}
                              </Typography>
                              <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Phone sx={{ fontSize: 12 }} /> {app.phone}
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                        
                        <Box sx={{ 
                          display: 'flex', 
                          flexWrap: 'wrap', 
                          gap: 2,
                          mb: 2,
                          p: 1.5,
                          borderRadius: 1,
                          backgroundColor: theme === 'dark' ? '#1e293b' : '#f8f9fa'
                        }}>
                          <Box>
                            <Typography variant="caption" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                              Occupation
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <Work sx={{ fontSize: 14 }} />
                              <Typography variant="body2">{app.occupation}</Typography>
                            </Box>
                          </Box>
                          <Box>
                            <Typography variant="caption" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                              Monthly Income
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <AttachMoney sx={{ fontSize: 14 }} />
                              <Typography variant="body2" sx={{ color: incomeLevel.color }}>
                                {formatPrice(app.monthlyIncome)} ({incomeLevel.label})
                              </Typography>
                            </Box>
                          </Box>
                          <Box>
                            <Typography variant="caption" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                              Occupants
                            </Typography>
                            <Typography variant="body2">{app.numberOfOccupants} people</Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                              Move-in Date
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <CalendarToday sx={{ fontSize: 14 }} />
                              <Typography variant="body2">{formatDate(app.preferredMoveInDate)}</Typography>
                            </Box>
                          </Box>
                        </Box>
                        
                        {app.message && (
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="caption" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                              Message
                            </Typography>
                            <Typography variant="body2" sx={{ 
                              p: 1, 
                              borderRadius: 1,
                              backgroundColor: theme === 'dark' ? '#1e293b' : '#f8f9fa',
                              fontStyle: 'italic'
                            }}>
                              "{app.message}"
                            </Typography>
                          </Box>
                        )}
                        
                        <Typography variant="caption" color={theme === 'dark' ? '#94a3b8' : '#999999'} sx={{ display: 'block', mb: 2 }}>
                          Applied: {formatDateTime(app.created_at)}
                        </Typography>
                        
                        {/* Action Buttons */}
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<Visibility />}
                            onClick={() => {
                              setSelectedApp(app);
                              setOpenViewDialog(true);
                            }}
                            fullWidth
                            sx={{
                              borderColor: theme === 'dark' ? '#00ffff' : '#007bff',
                              color: theme === 'dark' ? '#00ffff' : '#007bff',
                            }}
                          >
                            View Details
                          </Button>
                          
                          {app.status === 'PENDING' && (
                            <Button
                              size="small"
                              variant="contained"
                              startIcon={<ThumbUp />}
                              onClick={() => {
                                setSelectedApp(app);
                                setReviewStatus('APPROVED');
                                setAdminNotes('');
                                setOpenReviewDialog(true);
                              }}
                              sx={{
                                background: 'linear-gradient(135deg, #00ff00, #00b300)',
                                '&:hover': { background: 'linear-gradient(135deg, #00b300, #008000)' }
                              }}
                            >
                              Approve
                            </Button>
                          )}
                        </Box>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </Box>
        ) : (
          // List View - Table
          <Card sx={{ 
            borderRadius: 2,
            backgroundColor: theme === 'dark' ? '#0f172a80' : 'white',
            overflowX: 'auto'
          }}>
            <Box sx={{ minWidth: 1000 }}>
              {/* Header */}
              <Box sx={{ 
                display: 'flex',
                background: theme === 'dark'
                  ? 'linear-gradient(135deg, #00ffff, #00b3b3)'
                  : 'linear-gradient(135deg, #007bff, #0056b3)',
                p: 2,
                color: 'white',
                fontWeight: 'bold'
              }}>
                <Box sx={{ flex: 2 }}>Applicant / Property</Box>
                <Box sx={{ flex: 1 }}>Contact</Box>
                <Box sx={{ flex: 1 }}>Financial</Box>
                <Box sx={{ flex: 1 }}>Move-in</Box>
                <Box sx={{ flex: 1 }}>Status</Box>
                <Box sx={{ flex: 1 }}>Actions</Box>
              </Box>
              
              {/* Body */}
              {applications.map((app) => {
                const incomeLevel = getIncomeLevel(app.monthlyIncome);
                
                return (
                  <Box 
                    key={app._id}
                    sx={{ 
                      display: 'flex',
                      p: 2,
                      borderBottom: theme === 'dark' ? '1px solid #334155' : '1px solid #e5e7eb',
                      alignItems: 'center',
                      '&:hover': { backgroundColor: theme === 'dark' ? '#1e293b' : '#f8fafc' }
                    }}
                  >
                    <Box sx={{ flex: 2 }}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>{app.fullName}</Typography>
                      <Typography variant="caption" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                        {app.houseId?.title} - {app.houseId?.city}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="caption" sx={{ display: 'block' }}>{app.email}</Typography>
                      <Typography variant="caption" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                        {app.phone}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2">{app.occupation}</Typography>
                      <Typography variant="caption" sx={{ color: incomeLevel.color }}>
                        {formatPrice(app.monthlyIncome)} ({incomeLevel.label})
                      </Typography>
                    </Box>
                    
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2">{formatDate(app.preferredMoveInDate)}</Typography>
                      <Typography variant="caption">{app.numberOfOccupants} occupants</Typography>
                    </Box>
                    
                    <Box sx={{ flex: 1 }}>
                      {getStatusBadge(app.status)}
                    </Box>
                    
                    <Box sx={{ flex: 1, display: 'flex', gap: 1 }}>
                      <IconButton
                        size="small"
                        onClick={() => {
                          setSelectedApp(app);
                          setOpenViewDialog(true);
                        }}
                        sx={{ color: theme === 'dark' ? '#00ffff' : '#007bff' }}
                      >
                        <Visibility />
                      </IconButton>
                      
                      {app.status === 'PENDING' && (
                        <IconButton
                          size="small"
                          onClick={() => {
                            setSelectedApp(app);
                            setReviewStatus('APPROVED');
                            setAdminNotes('');
                            setOpenReviewDialog(true);
                          }}
                          sx={{ color: '#00ff00' }}
                        >
                          <ThumbUp />
                        </IconButton>
                      )}
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </Card>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <Pagination
              count={pagination.totalPages}
              page={filters.page}
              onChange={(e, value) => setFilters({ ...filters, page: value })}
              color="primary"
              size={isMobile ? "small" : "medium"}
              sx={{
                '& .MuiPaginationItem-root': {
                  color: theme === 'dark' ? '#ccd6f6' : '#333333',
                  '&.Mui-selected': {
                    backgroundColor: theme === 'dark' ? '#00ffff' : '#007bff',
                    color: theme === 'dark' ? '#0a192f' : 'white',
                  }
                }
              }}
            />
          </Box>
        )}

        {/* View Application Dialog */}
        <Dialog 
          open={openViewDialog} 
          onClose={() => setOpenViewDialog(false)} 
          maxWidth="md" 
          fullWidth
          fullScreen={isMobile}
          PaperProps={{
            sx: { 
              borderRadius: 2,
              backgroundColor: theme === 'dark' ? '#0f172a' : 'white',
              maxHeight: '90vh'
            }
          }}
        >
          {selectedApp && (
            <>
              <DialogTitle sx={{ 
                borderBottom: theme === 'dark' ? '1px solid #334155' : '1px solid #e5e7eb',
                py: 2,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <Typography variant="h6">Application Details</Typography>
                {getStatusBadge(selectedApp.status)}
              </DialogTitle>
              
              <DialogContent sx={{ p: 3, overflowY: 'auto' }}>
                {/* Property Info */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" sx={{ 
                    color: theme === 'dark' ? '#00ffff' : '#007bff',
                    mb: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}>
                    <Home /> Property Information
                  </Typography>
                  <Box sx={{ 
                    p: 2, 
                    borderRadius: 1,
                    backgroundColor: theme === 'dark' ? '#1e293b' : '#f8f9fa'
                  }}>
                    <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                      {selectedApp.houseId?.title}
                    </Typography>
                    <Typography variant="body2" color={theme === 'dark' ? '#a8b2d1' : '#666666'} sx={{ mb: 1 }}>
                      {selectedApp.houseId?.address}
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                      <Typography variant="body2">{formatPrice(selectedApp.houseId?.price)}/month</Typography>
                      <Typography variant="body2">{selectedApp.houseId?.bedrooms} beds</Typography>
                      <Typography variant="body2">{selectedApp.houseId?.bathrooms} baths</Typography>
                      <Typography variant="body2">{selectedApp.houseId?.area} sqft</Typography>
                    </Box>
                  </Box>
                </Box>

                {/* Applicant Info */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" sx={{ 
                    color: theme === 'dark' ? '#00ffff' : '#007bff',
                    mb: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}>
                    <Person /> Applicant Information
                  </Typography>
                  <Box sx={{ 
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 2
                  }}>
                    <Box sx={{ flex: 1, minWidth: '200px' }}>
                      <Typography variant="caption" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                        Full Name
                      </Typography>
                      <Typography variant="body2">{selectedApp.fullName}</Typography>
                    </Box>
                    <Box sx={{ flex: 1, minWidth: '200px' }}>
                      <Typography variant="caption" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                        Email
                      </Typography>
                      <Typography variant="body2">{selectedApp.email}</Typography>
                    </Box>
                    <Box sx={{ flex: 1, minWidth: '200px' }}>
                      <Typography variant="caption" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                        Phone
                      </Typography>
                      <Typography variant="body2">{selectedApp.phone}</Typography>
                    </Box>
                  </Box>
                </Box>

                {/* Employment & Income */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" sx={{ 
                    color: theme === 'dark' ? '#00ffff' : '#007bff',
                    mb: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}>
                    <Work /> Employment & Income
                  </Typography>
                  <Box sx={{ 
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 2
                  }}>
                    <Box sx={{ flex: 1, minWidth: '200px' }}>
                      <Typography variant="caption" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                        Occupation
                      </Typography>
                      <Typography variant="body2">{selectedApp.occupation}</Typography>
                    </Box>
                    <Box sx={{ flex: 1, minWidth: '200px' }}>
                      <Typography variant="caption" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                        Monthly Income
                      </Typography>
                      <Typography variant="body2" sx={{ 
                        color: getIncomeLevel(selectedApp.monthlyIncome).color,
                        fontWeight: 'bold'
                      }}>
                        {formatPrice(selectedApp.monthlyIncome)}
                      </Typography>
                    </Box>
                    <Box sx={{ flex: 1, minWidth: '200px' }}>
                      <Typography variant="caption" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                        Number of Occupants
                      </Typography>
                      <Typography variant="body2">{selectedApp.numberOfOccupants}</Typography>
                    </Box>
                  </Box>
                </Box>

                {/* Move-in Details */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" sx={{ 
                    color: theme === 'dark' ? '#00ffff' : '#007bff',
                    mb: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}>
                    <CalendarToday /> Move-in Details
                  </Typography>
                  <Box sx={{ 
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 2
                  }}>
                    <Box sx={{ flex: 1, minWidth: '200px' }}>
                      <Typography variant="caption" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                        Preferred Move-in Date
                      </Typography>
                      <Typography variant="body2">{formatDate(selectedApp.preferredMoveInDate)}</Typography>
                    </Box>
                    <Box sx={{ flex: 1, minWidth: '200px' }}>
                      <Typography variant="caption" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                        Application Date
                      </Typography>
                      <Typography variant="body2">{formatDateTime(selectedApp.created_at)}</Typography>
                    </Box>
                  </Box>
                </Box>

                {/* Message */}
                {selectedApp.message && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" sx={{ 
                      color: theme === 'dark' ? '#00ffff' : '#007bff',
                      mb: 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}>
                      <Description /> Message from Applicant
                    </Typography>
                    <Box sx={{ 
                      p: 2, 
                      borderRadius: 1,
                      backgroundColor: theme === 'dark' ? '#1e293b' : '#f8f9fa',
                      fontStyle: 'italic'
                    }}>
                      "{selectedApp.message}"
                    </Box>
                  </Box>
                )}

                {/* Admin Notes */}
                {selectedApp.adminNotes && (
                  <Box>
                    <Typography variant="subtitle2" sx={{ 
                      color: theme === 'dark' ? '#00ffff' : '#007bff',
                      mb: 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}>
                      <Receipt /> Admin Notes
                    </Typography>
                    <Box sx={{ 
                      p: 2, 
                      borderRadius: 1,
                      backgroundColor: theme === 'dark' ? '#1e293b' : '#f8f9fa'
                    }}>
                      {selectedApp.adminNotes}
                    </Box>
                  </Box>
                )}
              </DialogContent>
              
              <DialogActions sx={{ 
                p: 3,
                borderTop: theme === 'dark' ? '1px solid #334155' : '1px solid #e5e7eb'
              }}>
                <Button onClick={() => setOpenViewDialog(false)}>Close</Button>
                {selectedApp.status === 'PENDING' && (
                  <>
                    <Button 
                      onClick={() => {
                        setOpenViewDialog(false);
                        setReviewStatus('REJECTED');
                        setAdminNotes('');
                        setOpenReviewDialog(true);
                      }}
                      variant="outlined"
                      color="error"
                    >
                      Reject
                    </Button>
                    <Button 
                      onClick={() => {
                        setOpenViewDialog(false);
                        setReviewStatus('APPROVED');
                        setAdminNotes('');
                        setOpenReviewDialog(true);
                      }}
                      variant="contained"
                      sx={{ background: 'linear-gradient(135deg, #00ff00, #00b300)' }}
                    >
                      Approve Application
                    </Button>
                  </>
                )}
              </DialogActions>
            </>
          )}
        </Dialog>

        {/* Review Dialog */}
        <Dialog 
          open={openReviewDialog} 
          onClose={() => setOpenReviewDialog(false)} 
          maxWidth="sm" 
          fullWidth
          PaperProps={{
            sx: { 
              borderRadius: 2,
              backgroundColor: theme === 'dark' ? '#0f172a' : 'white'
            }
          }}
        >
          <DialogTitle>
            <Typography variant="h6">
              {reviewStatus === 'APPROVED' ? 'Approve Application' : 'Reject Application'}
            </Typography>
          </DialogTitle>
          <DialogContent>
            <Typography variant="body2" sx={{ mb: 2 }}>
              {reviewStatus === 'APPROVED' 
                ? 'Are you sure you want to approve this rental application? This will mark the property as rented.'
                : 'Are you sure you want to reject this rental application?'
              }
            </Typography>
            <TextField
              fullWidth
              label="Admin Notes (Optional)"
              multiline
              rows={3}
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Add any notes about this decision..."
              sx={textFieldStyle}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenReviewDialog(false)}>Cancel</Button>
            <Button 
              onClick={handleUpdateStatus}
              variant="contained"
              sx={{
                background: reviewStatus === 'APPROVED' 
                  ? 'linear-gradient(135deg, #00ff00, #00b300)'
                  : 'linear-gradient(135deg, #ff0000, #cc0000)'
              }}
            >
              {reviewStatus === 'APPROVED' ? 'Approve' : 'Reject'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Notifications */}
        <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError('')}>
          <Alert severity="error" onClose={() => setError('')}>{error}</Alert>
        </Snackbar>
        <Snackbar open={!!success} autoHideDuration={6000} onClose={() => setSuccess('')}>
          <Alert severity="success" onClose={() => setSuccess('')}>{success}</Alert>
        </Snackbar>
      </Box>
    </div>
  );
};

export default HouseApprovalPage;