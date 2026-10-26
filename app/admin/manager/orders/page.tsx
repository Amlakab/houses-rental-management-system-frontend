'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Card, CardContent, Chip, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Divider, CircularProgress, useMediaQuery, Snackbar, Alert,
  Tooltip, TextField, Select, MenuItem, FormControl, InputLabel,
  Tab, Tabs, Avatar, LinearProgress, Stepper, Step, StepLabel
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/lib/theme-context';
import { useLanguage } from '@/lib/language-context';
import {
  ShoppingCart, Visibility, CheckCircle, Cancel,
  HourglassEmpty, LocalShipping, AttachMoney,
  Person, Home, CalendarToday, Message, Edit,
  Refresh, Search, Close, Send,
  Phone, Email, AccessTime
} from '@mui/icons-material';
import api from '@/app/utils/api';
import { Order, OrderStatus, OrderType, House } from '@/types/houses';
import { format } from 'date-fns';
import MessageConversation from '@/components/MessageConversation';

const statusColors: Record<OrderStatus, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
  [OrderStatus.PENDING]: 'warning',
  [OrderStatus.UNDER_REVIEW]: 'info',
  [OrderStatus.APPROVED]: 'success',
  [OrderStatus.REJECTED]: 'error',
  [OrderStatus.COMPLETED]: 'success',
  [OrderStatus.CANCELLED]: 'default'
};

const statusIcons: Record<OrderStatus, React.ReactElement> = {
  [OrderStatus.PENDING]: <HourglassEmpty fontSize="small" />,
  [OrderStatus.UNDER_REVIEW]: <Visibility fontSize="small" />,
  [OrderStatus.APPROVED]: <CheckCircle fontSize="small" />,
  [OrderStatus.REJECTED]: <Cancel fontSize="small" />,
  [OrderStatus.COMPLETED]: <LocalShipping fontSize="small" />,
  [OrderStatus.CANCELLED]: <Cancel fontSize="small" />
};

const ManagerOrdersPage = () => {
  const { theme } = useTheme();
  const { t, isAmharic } = useLanguage();
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  const orderTypeLabels: Record<OrderType, string> = {
    [OrderType.PURCHASE]: t('orders.purchase'),
    [OrderType.RENT]: t('orders.rent'),
    [OrderType.INQUIRY]: t('orders.inquiry'),
    [OrderType.APPLICATION]: t('orders.application')
  };
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [openStatusDialog, setOpenStatusDialog] = useState(false);
  const [openMessageDialog, setOpenMessageDialog] = useState(false);
  const [selectedOrderForMessage, setSelectedOrderForMessage] = useState<Order | null>(null);
  const [statusUpdate, setStatusUpdate] = useState({ status: '', comment: '' });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalOrders: 0,
    hasNext: false,
    hasPrev: false
  });

  const [filters, setFilters] = useState({
    search: '',
    status: '',
    orderType: '',
    page: 1,
    limit: 10
  });

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== '') params.append(key, value.toString());
      });
      
      const response = await api.get(`/orders?${params}`);
      setOrders(response.data.data.orders || []);
      setPagination(response.data.data.pagination);
    } catch (error: any) {
      console.error('Error fetching orders:', error);
      setError(error.response?.data?.message || 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await api.get('/orders/stats');
      setStats(response.data.data);
    } catch (error: any) {
      console.error('Failed to fetch stats:', error);
    }
  }, []);

  const handleFilterChange = (field: string, value: string | number) => {
    setFilters(prev => ({
      ...prev,
      [field]: value,
      page: 1
    }));
  };

  useEffect(() => {
    fetchOrders();
    fetchStats();
  }, [fetchOrders, fetchStats]);

  const handleUpdateStatus = async () => {
    if (!selectedOrder) return;
    
    try {
      await api.patch(`/orders/${selectedOrder._id}/status`, {
        status: statusUpdate.status,
        comment: statusUpdate.comment
      });
      
      setSuccess(`Order status updated to ${statusUpdate.status}`);
      setOpenStatusDialog(false);
      fetchOrders();
      fetchStats();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to update status');
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
    { title: t('orders.total'), value: stats?.totalOrders || 0, icon: <ShoppingCart />, color: '#2563eb' },
    { title: t('orders.pending'), value: stats?.pendingOrders || 0, icon: <HourglassEmpty />, color: '#f59e0b' },
    { title: t('orders.under_review'), value: stats?.underReviewOrders || 0, icon: <Visibility />, color: '#3b82f6' },
    { title: isAmharic ? 'የጸደቁ' : 'Approved', value: stats?.approvedOrders || 0, icon: <CheckCircle />, color: '#10b981' },
    { title: t('orders.completed'), value: stats?.completedOrders || 0, icon: <LocalShipping />, color: '#059669' },
    { title: isAmharic ? 'ጠቅላላ ገቢ' : 'Revenue', value: `${(stats?.totalRevenue || 0).toLocaleString()} ETB`, icon: <AttachMoney />, color: '#8b5cf6' }
  ];

  const tabs = [
    { label: isAmharic ? 'ሁሉም ትዕዛዞች' : 'All Orders', status: '' },
    { label: t('orders.pending'), status: OrderStatus.PENDING },
    { label: t('orders.under_review'), status: OrderStatus.UNDER_REVIEW },
    { label: isAmharic ? 'የጸደቀ' : 'Approved', status: OrderStatus.APPROVED },
    { label: t('orders.completed'), status: OrderStatus.COMPLETED },
    { label: isAmharic ? 'ውድቅ የተደረገ' : 'Rejected', status: OrderStatus.REJECTED }
  ];

  const textFieldStyle = {
    '& .MuiOutlinedInput-root': {
      backgroundColor: theme === 'dark' ? '#1e293b' : 'white',
      color: theme === 'dark' ? '#ccd6f6' : '#333333',
      '& fieldset': { borderColor: theme === 'dark' ? '#334155' : '#e5e7eb' },
      '&:hover fieldset': { borderColor: theme === 'dark' ? '#3b82f6' : '#2563eb' },
      '&.Mui-focused fieldset': { borderColor: theme === 'dark' ? '#3b82f6' : '#2563eb' }
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      theme === 'dark' 
        ? 'bg-gradient-to-br from-[#0a192f] to-[#112240] text-white' 
        : 'bg-gradient-to-br from-[#f8fafc] to-[#ffffff] text-slate-900'
    }`}>
      <Box sx={{ pt: 2, pb: 4, px: { xs: 2, md: 4 } }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Typography variant={isMobile ? "h5" : "h4"} sx={{ fontWeight: 700, color: theme === 'dark' ? '#f1f5f9' : '#0f172a', mb: 1 }}>
            {t('orders.title')}
          </Typography>
          <Typography variant="body2" color={theme === 'dark' ? '#94a3b8' : '#64748b'} sx={{ mb: 3 }}>
            {t('orders.subtitle')}
          </Typography>
        </motion.div>
        
        {/* Statistics Cards - No Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 4 }}>
            {statCards.map((stat, index) => (
              <Box key={index} sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(33.33% - 16px)', md: '1 1 calc(16.66% - 16px)' }, minWidth: '150px' }}>
                <Card sx={{ 
                  borderRadius: 3,
                  borderLeft: `4px solid ${stat.color}`,
                  backgroundColor: theme === 'dark' ? '#0f172a80' : 'white',
                  backdropFilter: theme === 'dark' ? 'blur(10px)' : 'none'
                }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="h4" sx={{ fontWeight: 'bold', color: theme === 'dark' ? '#ccd6f6' : '#333333' }}>
                          {stat.value}
                        </Typography>
                        <Typography variant="caption" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                          {stat.title}
                        </Typography>
                      </Box>
                      <Box sx={{ color: stat.color }}>{stat.icon}</Box>
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            ))}
          </Box>
        </motion.div>
        
        {/* Tabs and Filters */}
        <Card sx={{ mb: 3, borderRadius: 3, backgroundColor: theme === 'dark' ? '#0f172a80' : 'white' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs
              value={selectedTab}
              onChange={(e, newValue) => {
                setSelectedTab(newValue);
                handleFilterChange('status', tabs[newValue].status);
              }}
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                '& .MuiTab-root': { color: theme === 'dark' ? '#94a3b8' : '#64748b', textTransform: 'none', fontWeight: 600 },
                '& .Mui-selected': { color: theme === 'dark' ? '#60a5fa' : '#2563eb' }
              }}
            >
              {tabs.map((tab, index) => (
                <Tab key={index} label={tab.label} />
              ))}
            </Tabs>
          </Box>
          
          <CardContent>
            <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', md: 'row' } }}>
              <TextField
                fullWidth
                size="small"
                placeholder={isAmharic ? 'በደንበኛ ስም፣ ኢሜይል ወይም ስልክ ፈልግ...' : 'Search by customer name, email, or phone...'}
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                InputProps={{ startAdornment: <Search sx={{ mr: 1 }} /> }}
                sx={textFieldStyle}
              />
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>{isAmharic ? 'የትዕዛዝ ዓይነት' : 'Order Type'}</InputLabel>
                <Select
                  value={filters.orderType}
                  label={isAmharic ? 'የትዕዛዝ ዓይነት' : 'Order Type'}
                  onChange={(e) => handleFilterChange('orderType', e.target.value)}
                >
                  <MenuItem value="">{isAmharic ? 'ሁሉም ዓይነቶች' : 'All Types'}</MenuItem>
                  {Object.entries(orderTypeLabels).map(([value, label]) => (
                    <MenuItem key={value} value={value}>{label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={() => {
                  setFilters({ search: '', status: '', orderType: '', page: 1, limit: 10 });
                  setSelectedTab(0);
                }}
                sx={{
                  textTransform: 'none',
                  borderColor: theme === 'dark' ? '#3b82f6' : '#2563eb',
                  color: theme === 'dark' ? '#60a5fa' : '#2563eb'
                }}
              >
                {isAmharic ? 'ዳግም አስጀምር' : 'Reset'}
              </Button>
            </Box>
          </CardContent>
        </Card>
        
        {/* Orders List */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress size={48} sx={{ color: '#2563eb' }} />
          </Box>
        ) : orders.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <ShoppingCart sx={{ fontSize: 64, color: theme === 'dark' ? '#334155' : '#cbd5e1', mb: 2 }} />
            <Typography variant="h6" color={theme === 'dark' ? '#94a3b8' : '#64748b'}>
              {isAmharic ? 'ምንም ትዕዛዝ አልተገኘም' : 'No orders found'}
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <AnimatePresence>
              {orders.map((order, index) => (
                <motion.div
                  key={order._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Card sx={{ 
                    borderRadius: 2.5,
                    backgroundColor: theme === 'dark' ? '#112240' : 'white',
                    border: theme === 'dark' ? '1px solid #233554' : '1px solid #e2e8f0',
                    '&:hover': { transform: 'translateY(-2px)', transition: 'transform 0.2s' }
                  }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, gap: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 2 }}>
                          <Avatar sx={{ bgcolor: theme === 'dark' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(37, 99, 235, 0.1)', color: theme === 'dark' ? '#60a5fa' : '#2563eb' }}>
                            <Person />
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: theme === 'dark' ? '#f1f5f9' : '#0f172a' }}>
                              {order.customerName}
                            </Typography>
                            <Typography variant="caption" color={theme === 'dark' ? '#94a3b8' : '#64748b'}>
                              {order.customerEmail} • {order.customerPhone}
                            </Typography>
                          </Box>
                        </Box>
                        
                        <Box sx={{ flex: 1 }}>
                          <Chip
                            label={orderTypeLabels[order.orderType]}
                            size="small"
                            sx={{ backgroundColor: theme === 'dark' ? '#1e293b' : '#f1f5f9', fontWeight: 600 }}
                          />
                          <Typography variant="body2" sx={{ mt: 0.5, color: theme === 'dark' ? '#cbd5e1' : '#334155' }}>
                            {(order.houseId as House)?.title || 'Property'}
                          </Typography>
                        </Box>
                        
                        <Box sx={{ textAlign: { xs: 'left', md: 'right' } }}>
                          <Typography variant="h6" sx={{ fontWeight: 700, color: theme === 'dark' ? '#60a5fa' : '#2563eb' }}>
                            {formatPrice(order.totalAmount)}
                          </Typography>
                          <Chip
                            label={order.status}
                            size="small"
                            icon={statusIcons[order.status]}
                            color={statusColors[order.status]}
                          />
                        </Box>
                        
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Tooltip title={isAmharic ? 'ዝርዝር እይ' : 'View Details'}>
                            <IconButton
                              onClick={() => { setSelectedOrder(order); setOpenViewDialog(true); }}
                              sx={{ color: theme === 'dark' ? '#60a5fa' : '#2563eb' }}
                            >
                              <Visibility />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={isAmharic ? 'ሁኔታ አስተካክል' : 'Update Status'}>
                            <IconButton
                              onClick={() => { setSelectedOrder(order); setStatusUpdate({ status: order.status, comment: '' }); setOpenStatusDialog(true); }}
                              sx={{ color: '#10b981' }}
                            >
                              <Edit />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={isAmharic ? 'መልእክት ላክ' : 'Send Message'}>
                            <IconButton
                              onClick={() => { 
                                setSelectedOrderForMessage(order); 
                                setOpenMessageDialog(true); 
                              }}
                              sx={{ color: '#8b5cf6' }}
                            >
                              <Message />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Box>
                      
                      <Divider sx={{ my: 2 }} />
                      
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CalendarToday sx={{ fontSize: 14, color: theme === 'dark' ? '#a8b2d1' : '#666666' }} />
                          <Typography variant="caption" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                            Created: {formatDate(order.created_at)}
                          </Typography>
                        </Box>
                        {order.details.visitDate && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <AccessTime sx={{ fontSize: 14, color: theme === 'dark' ? '#a8b2d1' : '#666666' }} />
                            <Typography variant="caption" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                              Visit: {order.details.visitDate} {order.details.visitTime}
                            </Typography>
                          </Box>
                        )}
                        {order.details.specialRequests && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="caption" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                              Special requests: {order.details.specialRequests.substring(0, 50)}...
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </Box>
        )}
        
        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mt: 4 }}>
            <Button
              disabled={!pagination.hasPrev}
              onClick={() => handleFilterChange('page', pagination.currentPage - 1)}
            >
              Previous
            </Button>
            <Typography sx={{ alignSelf: 'center', px: 2 }}>
              Page {pagination.currentPage} of {pagination.totalPages}
            </Typography>
            <Button
              disabled={!pagination.hasNext}
              onClick={() => handleFilterChange('page', pagination.currentPage + 1)}
            >
              Next
            </Button>
          </Box>
        )}
        
        {/* View Order Dialog */}
        <Dialog
          open={openViewDialog}
          onClose={() => setOpenViewDialog(false)}
          maxWidth="md"
          fullWidth
          PaperProps={{ sx: { borderRadius: 3, backgroundColor: theme === 'dark' ? '#0f172a' : 'white', maxHeight: '80vh' } }}
        >
          {selectedOrder && (
            <>
              <DialogTitle sx={{ borderBottom: theme === 'dark' ? '1px solid #233554' : '1px solid #e2e8f0', py: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {isAmharic ? 'የትዕዛዝ ዝርዝር' : 'Order Details'}
                  </Typography>
                  <IconButton onClick={() => setOpenViewDialog(false)}><Close /></IconButton>
                </Box>
              </DialogTitle>
              <DialogContent dividers sx={{ borderBottom: theme === 'dark' ? '1px solid #233554' : '1px solid #e2e8f0' }}>
                {/* Customer Info */}
                <Typography variant="subtitle2" sx={{ color: theme === 'dark' ? '#60a5fa' : '#2563eb', mb: 1, fontWeight: 600 }}>
                  {isAmharic ? 'የደንበኛ መረጃ' : 'Customer Information'}
                </Typography>
                <Box sx={{ mb: 3, p: 2, bgcolor: theme === 'dark' ? '#1e293b' : '#f8f9fa', borderRadius: 2, border: theme === 'dark' ? '1px solid #334155' : '1px solid #e2e8f0' }}>
                  <Typography><strong>{isAmharic ? 'ስም:' : 'Name:'}</strong> {selectedOrder.customerName}</Typography>
                  <Typography><strong>{isAmharic ? 'ኢሜይል:' : 'Email:'}</strong> {selectedOrder.customerEmail}</Typography>
                  <Typography><strong>{isAmharic ? 'ስልክ:' : 'Phone:'}</strong> {selectedOrder.customerPhone}</Typography>
                </Box>
                
                {/* Order Info */}
                <Typography variant="subtitle2" sx={{ color: theme === 'dark' ? '#60a5fa' : '#2563eb', mb: 1, fontWeight: 600 }}>
                  {isAmharic ? 'የትዕዛዝ መረጃ' : 'Order Information'}
                </Typography>
                <Box sx={{ mb: 3, p: 2, bgcolor: theme === 'dark' ? '#1e293b' : '#f8f9fa', borderRadius: 2, border: theme === 'dark' ? '1px solid #334155' : '1px solid #e2e8f0' }}>
                  <Typography><strong>{isAmharic ? 'የትዕዛዝ ዓይነት:' : 'Order Type:'}</strong> {orderTypeLabels[selectedOrder.orderType]}</Typography>
                  <Typography><strong>{isAmharic ? 'ሁኔታ:' : 'Status:'}</strong> <Chip label={selectedOrder.status} size="small" color={statusColors[selectedOrder.status]} sx={{ ml: 1 }} /></Typography>
                  <Typography sx={{ mt: 0.5 }}><strong>{isAmharic ? 'ጠቅላላ ዋጋ:' : 'Total Amount:'}</strong> {formatPrice(selectedOrder.totalAmount)}</Typography>
                  <Typography><strong>{isAmharic ? 'የተፈጠረበት:' : 'Created:'}</strong> {formatDate(selectedOrder.created_at)}</Typography>
                  {selectedOrder.details.visitDate && (
                    <Typography><strong>{isAmharic ? 'የጉብኝት ቀን:' : 'Visit Date:'}</strong> {selectedOrder.details.visitDate} {selectedOrder.details.visitTime}</Typography>
                  )}
                  {selectedOrder.details.numberOfPeople && (
                    <Typography><strong>{isAmharic ? 'የሰዎች ብዛት:' : 'Number of People:'}</strong> {selectedOrder.details.numberOfPeople}</Typography>
                  )}
                  {selectedOrder.details.specialRequests && (
                    <Typography><strong>{isAmharic ? 'ልዩ ጥያቄዎች:' : 'Special Requests:'}</strong> {selectedOrder.details.specialRequests}</Typography>
                  )}
                </Box>
                
                {/* Property Info */}
                <Typography variant="subtitle2" sx={{ color: theme === 'dark' ? '#60a5fa' : '#2563eb', mb: 1, fontWeight: 600 }}>
                  {isAmharic ? 'የንብረት መረጃ' : 'Property Information'}
                </Typography>
                <Box sx={{ p: 2, bgcolor: theme === 'dark' ? '#1e293b' : '#f8f9fa', borderRadius: 2, border: theme === 'dark' ? '1px solid #334155' : '1px solid #e2e8f0' }}>
                  <Typography><strong>{isAmharic ? 'ቤት:' : 'Property:'}</strong> {(selectedOrder.houseId as House)?.title || 'Property'}</Typography>
                  <Typography><strong>{isAmharic ? 'አድራሻ:' : 'Location:'}</strong> {(selectedOrder.houseId as House)?.location?.city || 'N/A'}</Typography>
                  <Typography><strong>{isAmharic ? 'ዋጋ:' : 'Price:'}</strong> {formatPrice((selectedOrder.houseId as House)?.pricing?.price || selectedOrder.totalAmount || 0)}</Typography>
                </Box>
                
                {/* Timeline */}
                {selectedOrder.timeline && selectedOrder.timeline.length > 0 && (
                  <>
                    <Typography variant="subtitle2" sx={{ color: theme === 'dark' ? '#60a5fa' : '#2563eb', mt: 3, mb: 1, fontWeight: 600 }}>
                      {isAmharic ? 'የሂደት ታሪክ' : 'Timeline'}
                    </Typography>
                    <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                      {selectedOrder.timeline.map((event, index) => (
                        <Box key={index} sx={{ mb: 2 }}>
                          <Typography variant="body2"><strong>{event.status}</strong></Typography>
                          <Typography variant="caption" color="text.secondary">{formatDate(event.timestamp)}</Typography>
                          {event.comment && <Typography variant="caption" display="block">{event.comment}</Typography>}
                          {index < selectedOrder.timeline.length - 1 && <Divider sx={{ mt: 1 }} />}
                        </Box>
                      ))}
                    </Box>
                  </>
                )}
              </DialogContent>
              <DialogActions sx={{ p: 2 }}>
                <Button onClick={() => setOpenViewDialog(false)} sx={{ textTransform: 'none' }}>
                  {isAmharic ? 'ዝጋ' : 'Close'}
                </Button>
                <Button
                  variant="contained"
                  startIcon={<Message />}
                  onClick={() => { 
                    setOpenViewDialog(false); 
                    setSelectedOrderForMessage(selectedOrder);
                    setOpenMessageDialog(true); 
                  }}
                >
                  Send Message
                </Button>
                <Button
                  variant="contained"
                  startIcon={<Edit />}
                  onClick={() => { setOpenViewDialog(false); setOpenStatusDialog(true); }}
                >
                  Update Status
                </Button>
              </DialogActions>
            </>
          )}
        </Dialog>
        
        {/* Update Status Dialog */}
        <Dialog
          open={openStatusDialog}
          onClose={() => setOpenStatusDialog(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{ sx: { borderRadius: 3, backgroundColor: theme === 'dark' ? '#0f172a' : 'white' } }}
        >
          <DialogTitle>Update Order Status</DialogTitle>
          <DialogContent>
            <FormControl fullWidth sx={{ mt: 1, mb: 2 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusUpdate.status}
                label="Status"
                onChange={(e) => setStatusUpdate(prev => ({ ...prev, status: e.target.value }))}
              >
                {Object.values(OrderStatus).map(status => (
                  <MenuItem key={status} value={status}>{status}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Comment (Optional)"
              multiline
              rows={3}
              value={statusUpdate.comment}
              onChange={(e) => setStatusUpdate(prev => ({ ...prev, comment: e.target.value }))}
              placeholder="Add a comment about this status change..."
              sx={textFieldStyle}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenStatusDialog(false)}>Cancel</Button>
            <Button onClick={handleUpdateStatus} variant="contained">Update</Button>
          </DialogActions>
        </Dialog>
        
        {/* Message Conversation Dialog */}
        <MessageConversation
          open={openMessageDialog}
          onClose={() => {
            setOpenMessageDialog(false);
            setSelectedOrderForMessage(null);
          }}
          orderId={selectedOrderForMessage?._id || ''}
          houseId={(selectedOrderForMessage?.houseId as House)?._id || ''}
          houseTitle={(selectedOrderForMessage?.houseId as House)?.title}
          orderType={selectedOrderForMessage?.orderType}
          customerName={selectedOrderForMessage?.customerName}
          customerEmail={selectedOrderForMessage?.customerEmail}
          customerPhone={selectedOrderForMessage?.customerPhone}
          userRole="admin"
        />
        
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

export default ManagerOrdersPage;