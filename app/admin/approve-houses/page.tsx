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
import { useLanguage } from '@/lib/language-context';
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
  const { t, isAmharic } = useLanguage();
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
    primaryColor: theme === 'dark' ? '#3b82f6' : '#2563eb',
    cardBg: theme === 'dark' ? '#112240' : '#ffffff',
    cardBorder: theme === 'dark' ? '#233554' : '#e5e7eb',
  };

  const textFieldStyle = {
    '& .MuiOutlinedInput-root': {
      backgroundColor: theme === 'dark' ? '#1e293b' : 'white',
      color: theme === 'dark' ? '#f1f5f9' : '#0f172a',
      '& fieldset': {
        borderColor: theme === 'dark' ? '#334155' : '#e5e7eb',
      },
      '&:hover fieldset': {
        borderColor: theme === 'dark' ? '#3b82f6' : '#2563eb',
      },
      '&.Mui-focused fieldset': {
        borderColor: theme === 'dark' ? '#3b82f6' : '#2563eb',
      },
    },
    '& .MuiInputLabel-root': {
      color: theme === 'dark' ? '#94a3b8' : '#64748b',
    },
  };

  const selectStyle = {
    borderRadius: 1,
    backgroundColor: theme === 'dark' ? '#1e293b' : 'white',
    color: theme === 'dark' ? '#f1f5f9' : '#0f172a',
    '& .MuiOutlinedInput-notchedOutline': {
      borderColor: theme === 'dark' ? '#334155' : '#e5e7eb',
    },
    '&:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: theme === 'dark' ? '#3b82f6' : '#2563eb',
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
    if (!price && price !== 0) return '0 ETB';
    return `${Number(price).toLocaleString()} ETB`;
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
    const labelMap: Record<string, string> = {
      PENDING: isAmharic ? 'በመጠባበቅ ላይ' : 'PENDING',
      APPROVED: isAmharic ? 'የጸደቀ' : 'APPROVED',
      REJECTED: isAmharic ? 'ውድቅ የተደረገ' : 'REJECTED',
      CANCELLED: isAmharic ? 'የተሰረዘ' : 'CANCELLED'
    };
    return (
      <Chip
        label={labelMap[status] || status}
        size="small"
        icon={config.icon}
        sx={{
          backgroundColor: config.bg,
          color: config.color,
          '& .MuiChip-icon': { color: config.color },
          fontWeight: 600
        }}
      />
    );
  };

  const getIncomeLevel = (income: number) => {
    if (income >= 50000) return { label: isAmharic ? 'ከፍተኛ' : 'High', color: '#10b981' };
    if (income >= 25000) return { label: isAmharic ? 'መካከለኛ' : 'Medium', color: '#f59e0b' };
    return { label: isAmharic ? 'ዝቅተኛ' : 'Low', color: '#ef4444' };
  };

  const statCards = [
    { title: isAmharic ? 'ጠቅላላ ማመልከቻዎች' : 'Total Applications', value: stats.total, icon: <Assignment />, color: '#2563eb' },
    { title: t('review.pending_approval'), value: stats.pending, icon: <Pending />, color: '#f59e0b' },
    { title: t('review.approved'), value: stats.approved, icon: <CheckCircle />, color: '#10b981' },
    { title: t('review.rejected'), value: stats.rejected, icon: <Cancel />, color: '#ef4444' }
  ];

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      theme === 'dark' 
        ? 'bg-gradient-to-br from-[#0a192f] to-[#112240] text-white' 
        : 'bg-gradient-to-br from-[#f8fafc] to-[#ffffff] text-slate-900'
    }`}>
      <Box sx={{ py: 3, px: { xs: 1.5, sm: 2, md: 3 } }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Box sx={{ mb: 4 }}>
            <Typography variant={isMobile ? "h5" : "h4"} sx={{ 
              fontWeight: 700, 
              color: theme === 'dark' ? '#f1f5f9' : '#0f172a',
              mb: 1 
            }}>
              {t('applications.title')}
            </Typography>
            <Typography variant={isMobile ? "body2" : "body1"} color={theme === 'dark' ? '#94a3b8' : '#64748b'}>
              {t('applications.subtitle')}
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
                  <Assignment /> {isAmharic ? 'ማመልከቻዎች' : 'Applications'}
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
                        color: theme === 'dark' ? '#94a3b8' : '#64748b',
                        textTransform: 'none',
                        '&.Mui-selected': {
                          backgroundColor: theme === 'dark' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(37, 99, 235, 0.1)',
                          color: theme === 'dark' ? '#60a5fa' : '#2563eb',
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
                    onClick={() => fetchApplications()}
                    sx={{ 
                      borderRadius: 1.5,
                      textTransform: 'none',
                      borderColor: theme === 'dark' ? '#3b82f6' : '#2563eb',
                      color: theme === 'dark' ? '#60a5fa' : '#2563eb',
                    }}
                  >
                    {isAmharic ? 'አድስ' : 'Refresh'}
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
                  label={isAmharic ? 'ፈልግ' : 'Search'}
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
                  placeholder={isAmharic ? 'በስም፣ ኢሜይል፣ ስልክ...' : 'Name, email, phone...'}
                  InputProps={{
                    startAdornment: <Search sx={{ mr: 1, fontSize: 20 }} />
                  }}
                  sx={textFieldStyle}
                />
                
                <FormControl size="small">
                  <InputLabel>{isAmharic ? 'ሁኔታ' : 'Status'}</InputLabel>
                  <Select
                    value={filters.status}
                    label={isAmharic ? 'ሁኔታ' : 'Status'}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
                    sx={selectStyle}
                  >
                    <MenuItem value="">{isAmharic ? 'ሁሉም' : 'All'}</MenuItem>
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
            <CircularProgress size={48} sx={{ color: '#2563eb' }} />
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
                        background: theme === 'dark' ? 'linear-gradient(135deg, rgba(37, 99, 235, 0.15), rgba(30, 58, 138, 0.15))' : 'linear-gradient(135deg, rgba(37, 99, 235, 0.06), rgba(219, 234, 254, 0.3))',
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
                          <Avatar sx={{ bgcolor: theme === 'dark' ? '#3b82f6' : '#2563eb' }}>
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
                              {t('applications.occupation')}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <Work sx={{ fontSize: 14 }} />
                              <Typography variant="body2">{app.occupation}</Typography>
                            </Box>
                          </Box>
                          <Box>
                            <Typography variant="caption" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                              {t('applications.monthly_income')}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <AttachMoney sx={{ fontSize: 14 }} />
                              <Typography variant="body2" sx={{ color: incomeLevel.color, fontWeight: 600 }}>
                                {formatPrice(app.monthlyIncome)} ({incomeLevel.label})
                              </Typography>
                            </Box>
                          </Box>
                          <Box>
                            <Typography variant="caption" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                              {t('applications.occupants')}
                            </Typography>
                            <Typography variant="body2">{app.numberOfOccupants} {isAmharic ? 'ሰዎች' : 'people'}</Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                              {t('applications.move_in_date')}
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
                              {isAmharic ? 'መልእክት' : 'Message'}
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
                          {isAmharic ? 'የቀረበበት ቀን:' : 'Applied:'} {formatDateTime(app.created_at)}
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
                              borderColor: theme === 'dark' ? '#3b82f6' : '#2563eb',
                              color: theme === 'dark' ? '#60a5fa' : '#2563eb',
                              textTransform: 'none',
                              fontWeight: 600
                            }}
                          >
                            {isAmharic ? 'ዝርዝር እይ' : 'View Details'}
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
                                bgcolor: '#059669',
                                '&:hover': { bgcolor: '#047857' },
                                textTransform: 'none',
                                fontWeight: 600
                              }}
                            >
                              {t('applications.approve')}
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
            borderRadius: 2.5,
            backgroundColor: theme === 'dark' ? '#112240' : 'white',
            border: theme === 'dark' ? '1px solid #233554' : '1px solid #e2e8f0',
            overflowX: 'auto'
          }}>
            <Box sx={{ minWidth: 1000 }}>
              {/* Header */}
              <Box sx={{ 
                display: 'flex',
                background: theme === 'dark'
                  ? 'linear-gradient(135deg, #1e3a8a, #2563eb)'
                  : 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                p: 2,
                color: 'white',
                fontWeight: 600
              }}>
                <Box sx={{ flex: 2 }}>{isAmharic ? 'አመልካች / ቤት' : 'Applicant / Property'}</Box>
                <Box sx={{ flex: 1 }}>{isAmharic ? 'አድራሻ' : 'Contact'}</Box>
                <Box sx={{ flex: 1 }}>{isAmharic ? 'የገንዘብ ሁኔታ' : 'Financial'}</Box>
                <Box sx={{ flex: 1 }}>{isAmharic ? 'የመግቢያ ቀን' : 'Move-in'}</Box>
                <Box sx={{ flex: 1 }}>{isAmharic ? 'ሁኔታ' : 'Status'}</Box>
                <Box sx={{ flex: 1 }}>{isAmharic ? 'እርምጃዎች' : 'Actions'}</Box>
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
                      borderBottom: theme === 'dark' ? '1px solid #233554' : '1px solid #e2e8f0',
                      alignItems: 'center',
                      '&:hover': { backgroundColor: theme === 'dark' ? '#1e293b' : '#f8fafc' }
                    }}
                  >
                    <Box sx={{ flex: 2 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{app.fullName}</Typography>
                      <Typography variant="caption" color={theme === 'dark' ? '#94a3b8' : '#64748b'}>
                        {app.houseId?.title} - {app.houseId?.city}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="caption" sx={{ display: 'block' }}>{app.email}</Typography>
                      <Typography variant="caption" color={theme === 'dark' ? '#94a3b8' : '#64748b'}>
                        {app.phone}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2">{app.occupation}</Typography>
                      <Typography variant="caption" sx={{ color: incomeLevel.color, fontWeight: 600 }}>
                        {formatPrice(app.monthlyIncome)} ({incomeLevel.label})
                      </Typography>
                    </Box>
                    
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2">{formatDate(app.preferredMoveInDate)}</Typography>
                      <Typography variant="caption" color={theme === 'dark' ? '#94a3b8' : '#64748b'}>
                        {app.numberOfOccupants} {isAmharic ? 'ሰዎች' : 'occupants'}
                      </Typography>
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
                        sx={{ color: theme === 'dark' ? '#60a5fa' : '#2563eb' }}
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
                    backgroundColor: '#2563eb',
                    color: 'white',
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
              borderRadius: isMobile ? 0 : 2.5,
              backgroundColor: theme === 'dark' ? '#112240' : 'white',
              border: theme === 'dark' ? '1px solid #233554' : '1px solid #e2e8f0',
              maxHeight: '90vh'
            }
          }}
        >
          {selectedApp && (
            <>
              <DialogTitle sx={{ 
                borderBottom: theme === 'dark' ? '1px solid #233554' : '1px solid #e2e8f0',
                py: 2,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {isAmharic ? 'የማመልከቻ ዝርዝር' : 'Application Details'}
                </Typography>
                {getStatusBadge(selectedApp.status)}
              </DialogTitle>
              
              <DialogContent sx={{ p: 3, overflowY: 'auto' }}>
                {/* Property Info */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" sx={{ 
                    color: theme === 'dark' ? '#60a5fa' : '#2563eb',
                    mb: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    fontWeight: 600
                  }}>
                    <Home /> {isAmharic ? 'የቤቱ መረጃ' : 'Property Information'}
                  </Typography>
                  <Box sx={{ 
                    p: 2, 
                    borderRadius: 1.5,
                    backgroundColor: theme === 'dark' ? '#1e293b' : '#f8f9fa',
                    border: theme === 'dark' ? '1px solid #334155' : '1px solid #e2e8f0'
                  }}>
                    <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                      {selectedApp.houseId?.title}
                    </Typography>
                    <Typography variant="body2" color={theme === 'dark' ? '#94a3b8' : '#64748b'} sx={{ mb: 1 }}>
                      {selectedApp.houseId?.address}
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{formatPrice(selectedApp.houseId?.price)}/month</Typography>
                      <Typography variant="body2">{selectedApp.houseId?.bedrooms} {isAmharic ? 'መኝታ ክፍሎች' : 'beds'}</Typography>
                      <Typography variant="body2">{selectedApp.houseId?.bathrooms} {isAmharic ? 'መታጠቢያዎች' : 'baths'}</Typography>
                      <Typography variant="body2">{selectedApp.houseId?.area} sqft</Typography>
                    </Box>
                  </Box>
                </Box>

                {/* Applicant Info */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" sx={{ 
                    color: theme === 'dark' ? '#60a5fa' : '#2563eb',
                    mb: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    fontWeight: 600
                  }}>
                    <Person /> {isAmharic ? 'የአመልካች መረጃ' : 'Applicant Information'}
                  </Typography>
                  <Box sx={{ 
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 2
                  }}>
                    <Box sx={{ flex: 1, minWidth: '200px' }}>
                      <Typography variant="caption" color={theme === 'dark' ? '#94a3b8' : '#64748b'}>
                        {isAmharic ? 'ሙሉ ስም' : 'Full Name'}
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedApp.fullName}</Typography>
                    </Box>
                    <Box sx={{ flex: 1, minWidth: '200px' }}>
                      <Typography variant="caption" color={theme === 'dark' ? '#94a3b8' : '#64748b'}>
                        {isAmharic ? 'ኢሜይል' : 'Email'}
                      </Typography>
                      <Typography variant="body2">{selectedApp.email}</Typography>
                    </Box>
                    <Box sx={{ flex: 1, minWidth: '200px' }}>
                      <Typography variant="caption" color={theme === 'dark' ? '#94a3b8' : '#64748b'}>
                        {isAmharic ? 'ስልክ ቁጥር' : 'Phone'}
                      </Typography>
                      <Typography variant="body2">{selectedApp.phone}</Typography>
                    </Box>
                  </Box>
                </Box>

                {/* Employment & Income */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" sx={{ 
                    color: theme === 'dark' ? '#60a5fa' : '#2563eb',
                    mb: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    fontWeight: 600
                  }}>
                    <Work /> {isAmharic ? 'የስራ እና የገቢ ሁኔታ' : 'Employment & Income'}
                  </Typography>
                  <Box sx={{ 
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 2
                  }}>
                    <Box sx={{ flex: 1, minWidth: '200px' }}>
                      <Typography variant="caption" color={theme === 'dark' ? '#94a3b8' : '#64748b'}>
                        {t('applications.occupation')}
                      </Typography>
                      <Typography variant="body2">{selectedApp.occupation}</Typography>
                    </Box>
                    <Box sx={{ flex: 1, minWidth: '200px' }}>
                      <Typography variant="caption" color={theme === 'dark' ? '#94a3b8' : '#64748b'}>
                        {t('applications.monthly_income')}
                      </Typography>
                      <Typography variant="body2" sx={{ 
                        color: getIncomeLevel(selectedApp.monthlyIncome).color,
                        fontWeight: 'bold'
                      }}>
                        {formatPrice(selectedApp.monthlyIncome)}
                      </Typography>
                    </Box>
                    <Box sx={{ flex: 1, minWidth: '200px' }}>
                      <Typography variant="caption" color={theme === 'dark' ? '#94a3b8' : '#64748b'}>
                        {t('applications.occupants')}
                      </Typography>
                      <Typography variant="body2">{selectedApp.numberOfOccupants} {isAmharic ? 'ሰዎች' : 'people'}</Typography>
                    </Box>
                  </Box>
                </Box>

                {/* Move-in Details */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" sx={{ 
                    color: theme === 'dark' ? '#60a5fa' : '#2563eb',
                    mb: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    fontWeight: 600
                  }}>
                    <CalendarToday /> {isAmharic ? 'የመግቢያ ዝርዝር' : 'Move-in Details'}
                  </Typography>
                  <Box sx={{ 
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 2
                  }}>
                    <Box sx={{ flex: 1, minWidth: '200px' }}>
                      <Typography variant="caption" color={theme === 'dark' ? '#94a3b8' : '#64748b'}>
                        {t('applications.move_in_date')}
                      </Typography>
                      <Typography variant="body2">{formatDate(selectedApp.preferredMoveInDate)}</Typography>
                    </Box>
                    <Box sx={{ flex: 1, minWidth: '200px' }}>
                      <Typography variant="caption" color={theme === 'dark' ? '#94a3b8' : '#64748b'}>
                        {isAmharic ? 'የቀረበበት ቀን' : 'Application Date'}
                      </Typography>
                      <Typography variant="body2">{formatDateTime(selectedApp.created_at)}</Typography>
                    </Box>
                  </Box>
                </Box>

                {/* Message */}
                {selectedApp.message && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" sx={{ 
                      color: theme === 'dark' ? '#60a5fa' : '#2563eb',
                      mb: 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      fontWeight: 600
                    }}>
                      <Description /> {isAmharic ? 'ከአመልካች የተላከ መልእክት' : 'Message from Applicant'}
                    </Typography>
                    <Box sx={{ 
                      p: 2, 
                      borderRadius: 1.5,
                      backgroundColor: theme === 'dark' ? '#1e293b' : '#f8f9fa',
                      fontStyle: 'italic',
                      border: theme === 'dark' ? '1px solid #334155' : '1px solid #e2e8f0'
                    }}>
                      "{selectedApp.message}"
                    </Box>
                  </Box>
                )}

                {/* Admin Notes */}
                {selectedApp.adminNotes && (
                  <Box>
                    <Typography variant="subtitle2" sx={{ 
                      color: theme === 'dark' ? '#60a5fa' : '#2563eb',
                      mb: 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      fontWeight: 600
                    }}>
                      <Receipt /> {isAmharic ? 'የአድሚን ማስታወሻ' : 'Admin Notes'}
                    </Typography>
                    <Box sx={{ 
                      p: 2, 
                      borderRadius: 1.5,
                      backgroundColor: theme === 'dark' ? '#1e293b' : '#f8f9fa',
                      border: theme === 'dark' ? '1px solid #334155' : '1px solid #e2e8f0'
                    }}>
                      {selectedApp.adminNotes}
                    </Box>
                  </Box>
                )}
              </DialogContent>
              
              <DialogActions sx={{ 
                p: 2.5,
                borderTop: theme === 'dark' ? '1px solid #233554' : '1px solid #e2e8f0'
              }}>
                <Button onClick={() => setOpenViewDialog(false)} sx={{ textTransform: 'none' }}>
                  {isAmharic ? 'ዝጋ' : 'Close'}
                </Button>
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
                      sx={{ textTransform: 'none', fontWeight: 600 }}
                    >
                      {t('applications.reject')}
                    </Button>
                    <Button 
                      onClick={() => {
                        setOpenViewDialog(false);
                        setReviewStatus('APPROVED');
                        setAdminNotes('');
                        setOpenReviewDialog(true);
                      }}
                      variant="contained"
                      sx={{ 
                        bgcolor: '#059669', 
                        '&:hover': { bgcolor: '#047857' },
                        textTransform: 'none', 
                        fontWeight: 600 
                      }}
                    >
                      {t('applications.approve')}
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
              borderRadius: 2.5,
              backgroundColor: theme === 'dark' ? '#112240' : 'white',
              border: theme === 'dark' ? '1px solid #233554' : '1px solid #e2e8f0'
            }
          }}
        >
          <DialogTitle sx={{ borderBottom: theme === 'dark' ? '1px solid #233554' : '1px solid #e2e8f0', py: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {reviewStatus === 'APPROVED' ? t('applications.approve') : t('applications.reject')}
            </Typography>
          </DialogTitle>
          <DialogContent sx={{ pt: 2.5 }}>
            <Typography variant="body2" sx={{ mb: 2, color: theme === 'dark' ? '#cbd5e1' : '#475569' }}>
              {reviewStatus === 'APPROVED' 
                ? (isAmharic ? 'ይህን የኪራይ ማመልከቻ በእርግጥ ማጽደቅ ይፈልጋሉ? ይሄ ቤቱን እንደተከራየ ያደርገዋል።' : 'Are you sure you want to approve this rental application? This will mark the property as rented.')
                : (isAmharic ? 'ይህን የኪራይ ማመልከቻ በእርግጥ ውድቅ ማድረግ ይፈልጋሉ?' : 'Are you sure you want to reject this rental application?')
              }
            </Typography>
            <TextField
              fullWidth
              label={isAmharic ? 'የአድሚን ማስታወሻ (አማራጭ)' : 'Admin Notes (Optional)'}
              multiline
              rows={3}
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder={isAmharic ? 'ስለ ውሳኔው ተጨማሪ ማስታወሻ ያስገቡ...' : 'Add any notes about this decision...'}
              sx={textFieldStyle}
            />
          </DialogContent>
          <DialogActions sx={{ p: 2.5, borderTop: theme === 'dark' ? '1px solid #233554' : '1px solid #e2e8f0' }}>
            <Button onClick={() => setOpenReviewDialog(false)} sx={{ textTransform: 'none' }}>
              {isAmharic ? 'ሰርዝ' : 'Cancel'}
            </Button>
            <Button 
              onClick={handleUpdateStatus}
              variant="contained"
              sx={{
                bgcolor: reviewStatus === 'APPROVED' ? '#059669' : '#dc2626',
                '&:hover': { bgcolor: reviewStatus === 'APPROVED' ? '#047857' : '#b91c1c' },
                textTransform: 'none',
                fontWeight: 600
              }}
            >
              {reviewStatus === 'APPROVED' ? (isAmharic ? 'አጽድቅ' : 'Approve') : (isAmharic ? 'ውድቅ አድርግ' : 'Reject')}
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