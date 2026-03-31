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

const orderTypeLabels: Record<OrderType, string> = {
  [OrderType.PURCHASE]: 'Purchase',
  [OrderType.RENT]: 'Rent',
  [OrderType.INQUIRY]: 'Inquiry',
  [OrderType.APPLICATION]: 'Application'
};

const ManagerOrdersPage = () => {
  const { theme } = useTheme();
  const isMobile = useMediaQuery('(max-width: 768px)');
  
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
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
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
    { title: 'Total Orders', value: stats?.totalOrders || 0, icon: <ShoppingCart />, color: '#00ffff' },
    { title: 'Pending', value: stats?.pendingOrders || 0, icon: <HourglassEmpty />, color: '#ff9900' },
    { title: 'Under Review', value: stats?.underReviewOrders || 0, icon: <Visibility />, color: '#00ffff' },
    { title: 'Approved', value: stats?.approvedOrders || 0, icon: <CheckCircle />, color: '#00ff00' },
    { title: 'Completed', value: stats?.completedOrders || 0, icon: <LocalShipping />, color: '#28a745' },
    { title: 'Revenue', value: `$${(stats?.totalRevenue || 0).toLocaleString()}`, icon: <AttachMoney />, color: '#00ffff' }
  ];

  const tabs = [
    { label: 'All Orders', status: '' },
    { label: 'Pending', status: OrderStatus.PENDING },
    { label: 'Under Review', status: OrderStatus.UNDER_REVIEW },
    { label: 'Approved', status: OrderStatus.APPROVED },
    { label: 'Completed', status: OrderStatus.COMPLETED },
    { label: 'Rejected', status: OrderStatus.REJECTED }
  ];

  const textFieldStyle = {
    '& .MuiOutlinedInput-root': {
      backgroundColor: theme === 'dark' ? '#1e293b' : 'white',
      color: theme === 'dark' ? '#ccd6f6' : '#333333',
      '& fieldset': { borderColor: theme === 'dark' ? '#334155' : '#e5e7eb' },
      '&:hover fieldset': { borderColor: theme === 'dark' ? '#00ffff' : '#007bff' },
      '&.Mui-focused fieldset': { borderColor: theme === 'dark' ? '#00ffff' : '#007bff' }
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      theme === 'dark' 
        ? 'bg-gradient-to-br from-[#0a192f] to-[#112240]' 
        : 'bg-gradient-to-br from-[#f0f0f0] to-[#ffffff]'
    }`}>
      <Box sx={{ pt: 2, pb: 4, px: { xs: 2, md: 4 } }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Typography variant={isMobile ? "h5" : "h4"} sx={{ fontWeight: 'bold', color: theme === 'dark' ? '#ccd6f6' : '#333333', mb: 1 }}>
            Order Management
          </Typography>
          <Typography variant="body2" color={theme === 'dark' ? '#a8b2d1' : '#666666'} sx={{ mb: 3 }}>
            Manage customer orders, applications, and inquiries
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
                '& .MuiTab-root': { color: theme === 'dark' ? '#a8b2d1' : '#666666' },
                '& .Mui-selected': { color: theme === 'dark' ? '#00ffff' : '#007bff' }
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
                placeholder="Search by customer name, email, or phone..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                InputProps={{ startAdornment: <Search sx={{ mr: 1 }} /> }}
                sx={textFieldStyle}
              />
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Order Type</InputLabel>
                <Select
                  value={filters.orderType}
                  label="Order Type"
                  onChange={(e) => handleFilterChange('orderType', e.target.value)}
                >
                  <MenuItem value="">All Types</MenuItem>
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
              >
                Reset
              </Button>
            </Box>
          </CardContent>
        </Card>
        
        {/* Orders List */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress size={60} sx={{ color: theme === 'dark' ? '#00ffff' : '#007bff' }} />
          </Box>
        ) : orders.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <ShoppingCart sx={{ fontSize: 64, color: theme === 'dark' ? '#334155' : '#cbd5e1', mb: 2 }} />
            <Typography variant="h6" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>No orders found</Typography>
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
                    borderRadius: 3,
                    backgroundColor: theme === 'dark' ? '#0f172a80' : 'white',
                    '&:hover': { transform: 'translateY(-2px)', transition: 'transform 0.2s' }
                  }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, gap: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 2 }}>
                          <Avatar sx={{ bgcolor: theme === 'dark' ? '#00ffff20' : '#007bff10', color: theme === 'dark' ? '#00ffff' : '#007bff' }}>
                            <Person />
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: theme === 'dark' ? '#ccd6f6' : '#333333' }}>
                              {order.customerName}
                            </Typography>
                            <Typography variant="caption" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                              {order.customerEmail} • {order.customerPhone}
                            </Typography>
                          </Box>
                        </Box>
                        
                        <Box sx={{ flex: 1 }}>
                          <Chip
                            label={orderTypeLabels[order.orderType]}
                            size="small"
                            sx={{ backgroundColor: theme === 'dark' ? '#334155' : '#e5e7eb' }}
                          />
                          <Typography variant="body2" sx={{ mt: 0.5, color: theme === 'dark' ? '#ccd6f6' : '#333333' }}>
                            {(order.houseId as House)?.title || 'Property'}
                          </Typography>
                        </Box>
                        
                        <Box sx={{ textAlign: 'right' }}>
                          <Typography variant="h6" sx={{ fontWeight: 'bold', color: theme === 'dark' ? '#00ffff' : '#007bff' }}>
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
                          <Tooltip title="View Details">
                            <IconButton
                              onClick={() => { setSelectedOrder(order); setOpenViewDialog(true); }}
                              sx={{ color: theme === 'dark' ? '#00ffff' : '#007bff' }}
                            >
                              <Visibility />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Update Status">
                            <IconButton
                              onClick={() => { setSelectedOrder(order); setStatusUpdate({ status: order.status, comment: '' }); setOpenStatusDialog(true); }}
                              sx={{ color: theme === 'dark' ? '#00ff00' : '#28a745' }}
                            >
                              <Edit />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Send Message">
                            <IconButton
                              onClick={() => { 
                                setSelectedOrderForMessage(order); 
                                setOpenMessageDialog(true); 
                              }}
                              sx={{ color: theme === 'dark' ? '#00ffff' : '#8B5CF6' }}
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
              <DialogTitle>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6">Order Details</Typography>
                  <IconButton onClick={() => setOpenViewDialog(false)}><Close /></IconButton>
                </Box>
              </DialogTitle>
              <DialogContent dividers>
                {/* Customer Info */}
                <Typography variant="subtitle2" sx={{ color: theme === 'dark' ? '#00ffff' : '#007bff', mb: 1 }}>Customer Information</Typography>
                <Box sx={{ mb: 3, p: 2, bgcolor: theme === 'dark' ? '#1e293b' : '#f8f9fa', borderRadius: 2 }}>
                  <Typography><strong>Name:</strong> {selectedOrder.customerName}</Typography>
                  <Typography><strong>Email:</strong> {selectedOrder.customerEmail}</Typography>
                  <Typography><strong>Phone:</strong> {selectedOrder.customerPhone}</Typography>
                </Box>
                
                {/* Order Info */}
                <Typography variant="subtitle2" sx={{ color: theme === 'dark' ? '#00ffff' : '#007bff', mb: 1 }}>Order Information</Typography>
                <Box sx={{ mb: 3, p: 2, bgcolor: theme === 'dark' ? '#1e293b' : '#f8f9fa', borderRadius: 2 }}>
                  <Typography><strong>Order Type:</strong> {orderTypeLabels[selectedOrder.orderType]}</Typography>
                  <Typography><strong>Status:</strong> <Chip label={selectedOrder.status} size="small" color={statusColors[selectedOrder.status]} /></Typography>
                  <Typography><strong>Total Amount:</strong> {formatPrice(selectedOrder.totalAmount)}</Typography>
                  <Typography><strong>Created:</strong> {formatDate(selectedOrder.created_at)}</Typography>
                  {selectedOrder.details.visitDate && (
                    <Typography><strong>Visit Date:</strong> {selectedOrder.details.visitDate} {selectedOrder.details.visitTime}</Typography>
                  )}
                  {selectedOrder.details.numberOfPeople && (
                    <Typography><strong>Number of People:</strong> {selectedOrder.details.numberOfPeople}</Typography>
                  )}
                  {selectedOrder.details.specialRequests && (
                    <Typography><strong>Special Requests:</strong> {selectedOrder.details.specialRequests}</Typography>
                  )}
                </Box>
                
                {/* Property Info */}
                <Typography variant="subtitle2" sx={{ color: theme === 'dark' ? '#00ffff' : '#007bff', mb: 1 }}>Property Information</Typography>
                <Box sx={{ p: 2, bgcolor: theme === 'dark' ? '#1e293b' : '#f8f9fa', borderRadius: 2 }}>
                  <Typography><strong>Property:</strong> {(selectedOrder.houseId as House)?.title}</Typography>
                  <Typography><strong>Location:</strong> {(selectedOrder.houseId as House)?.location?.city}</Typography>
                  <Typography><strong>Price:</strong> {formatPrice((selectedOrder.houseId as House)?.pricing?.price || 0)}</Typography>
                </Box>
                
                {/* Timeline */}
                {selectedOrder.timeline && selectedOrder.timeline.length > 0 && (
                  <>
                    <Typography variant="subtitle2" sx={{ color: theme === 'dark' ? '#00ffff' : '#007bff', mt: 3, mb: 1 }}>Timeline</Typography>
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
              <DialogActions>
                <Button onClick={() => setOpenViewDialog(false)}>Close</Button>
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