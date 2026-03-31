'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Card, CardContent, Chip, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Divider, CircularProgress, useMediaQuery, Snackbar, Alert,
  Tooltip, Avatar, LinearProgress,
  Tabs,
  Tab
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/lib/theme-context';
import Navbar from '@/components/ui/Navbar';
import {
  ShoppingCart, Visibility, CheckCircle, Cancel,
  HourglassEmpty, LocalShipping, AttachMoney,
  Home, CalendarToday, Message, Refresh,
  TrendingUp, Phone, Email, Person,
  Close
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

const CustomerOrdersPage = () => {
  const { theme } = useTheme();
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [openCancelDialog, setOpenCancelDialog] = useState(false);
  const [openMessageDialog, setOpenMessageDialog] = useState(false);
  const [selectedOrderForMessage, setSelectedOrderForMessage] = useState<Order | null>(null);
  const [stats, setStats] = useState<any>(null);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/orders/my');
      setOrders(response.data.data || []);
    } catch (error: any) {
      console.error('Error fetching orders:', error);
      setError(error.response?.data?.message || 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const response = await api.get('/orders/stats');
      setStats(response.data.data);
    } catch (error: any) {
      console.error('Failed to fetch stats:', error);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    fetchStats();
  }, [fetchOrders, fetchStats]);

  const handleCancelOrder = async () => {
    if (!selectedOrder) return;
    
    try {
      await api.patch(`/orders/${selectedOrder._id}/status`, {
        status: OrderStatus.CANCELLED,
        comment: 'Cancelled by customer'
      });
      
      setSuccess('Order cancelled successfully');
      setOpenCancelDialog(false);
      fetchOrders();
      fetchStats();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to cancel order');
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

  const getFilteredOrders = () => {
    if (selectedTab === 0) return orders;
    const statusMap: Record<number, OrderStatus> = {
      1: OrderStatus.PENDING,
      2: OrderStatus.UNDER_REVIEW,
      3: OrderStatus.APPROVED,
      4: OrderStatus.COMPLETED,
      5: OrderStatus.REJECTED
    };
    return orders.filter(order => order.status === statusMap[selectedTab]);
  };

  const tabs = [
    'All Orders', 'Pending', 'Under Review', 'Approved', 'Completed', 'Rejected'
  ];

  const statCards = [
    { title: 'Total Orders', value: stats?.totalOrders || 0, icon: <ShoppingCart />, color: '#00ffff' },
    { title: 'Pending', value: stats?.pendingOrders || 0, icon: <HourglassEmpty />, color: '#ff9900' },
    { title: 'Approved', value: stats?.approvedOrders || 0, icon: <CheckCircle />, color: '#00ff00' },
    { title: 'Completed', value: stats?.completedOrders || 0, icon: <LocalShipping />, color: '#28a745' }
  ];

  const filteredOrders = getFilteredOrders();

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      theme === 'dark' 
        ? 'bg-gradient-to-br from-[#0a192f] to-[#112240]' 
        : 'bg-gradient-to-br from-[#f0f0f0] to-[#ffffff]'
    }`}>
      {/* <Navbar /> */}
      
      <Box sx={{ pt: 2, pb: 4, px: { xs: 2, md: 4 } }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Typography variant={isMobile ? "h5" : "h4"} sx={{ fontWeight: 'bold', color: theme === 'dark' ? '#ccd6f6' : '#333333', mb: 1 }}>
            My Orders
          </Typography>
          <Typography variant="body2" color={theme === 'dark' ? '#a8b2d1' : '#666666'} sx={{ mb: 3 }}>
            Track and manage your property applications and inquiries
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
              <Box key={index} sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(25% - 16px)' }, minWidth: '150px' }}>
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
        
        {/* Tabs */}
        <Card sx={{ mb: 3, borderRadius: 3, backgroundColor: theme === 'dark' ? '#0f172a80' : 'white' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', overflowX: 'auto' }}>
            <Tabs
              value={selectedTab}
              onChange={(e, newValue) => setSelectedTab(newValue)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                '& .MuiTab-root': { color: theme === 'dark' ? '#a8b2d1' : '#666666' },
                '& .Mui-selected': { color: theme === 'dark' ? '#00ffff' : '#007bff' }
              }}
            >
              {tabs.map((tab, index) => (
                <Tab key={index} label={tab} />
              ))}
            </Tabs>
          </Box>
        </Card>
        
        {/* Orders List */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress size={60} sx={{ color: theme === 'dark' ? '#00ffff' : '#007bff' }} />
          </Box>
        ) : filteredOrders.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <ShoppingCart sx={{ fontSize: 64, color: theme === 'dark' ? '#334155' : '#cbd5e1', mb: 2 }} />
            <Typography variant="h6" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>No orders found</Typography>
            <Button
              variant="contained"
              href="/public/houses"
              sx={{ mt: 2, borderRadius: 2 }}
            >
              Browse Properties
            </Button>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <AnimatePresence>
              {filteredOrders.map((order, index) => (
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
                            <Home />
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: theme === 'dark' ? '#ccd6f6' : '#333333' }}>
                              {(order.houseId as House)?.title || 'Property'}
                            </Typography>
                            <Typography variant="caption" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                              {(order.houseId as House)?.location?.city}
                            </Typography>
                          </Box>
                        </Box>
                        
                        <Box>
                          <Chip
                            label={orderTypeLabels[order.orderType]}
                            size="small"
                            sx={{ backgroundColor: theme === 'dark' ? '#334155' : '#e5e7eb' }}
                          />
                          <Typography variant="h6" sx={{ fontWeight: 'bold', color: theme === 'dark' ? '#00ffff' : '#007bff', mt: 0.5 }}>
                            {formatPrice(order.totalAmount)}
                          </Typography>
                        </Box>
                        
                        <Box sx={{ textAlign: 'right' }}>
                          <Chip
                            label={order.status}
                            size="small"
                            icon={statusIcons[order.status]}
                            color={statusColors[order.status]}
                          />
                          <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
                            {formatDate(order.created_at)}
                          </Typography>
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
                          {(order.status === OrderStatus.PENDING || order.status === OrderStatus.UNDER_REVIEW) && (
                            <Tooltip title="Cancel Order">
                              <IconButton
                                onClick={() => { setSelectedOrder(order); setOpenCancelDialog(true); }}
                                sx={{ color: theme === 'dark' ? '#ff0000' : '#dc3545' }}
                              >
                                <Cancel />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      </Box>
                      
                      {order.details.visitDate && (
                        <Box sx={{ mt: 2, p: 1.5, bgcolor: theme === 'dark' ? '#1e293b' : '#f8f9fa', borderRadius: 2 }}>
                          <Typography variant="caption" color="text.secondary">
                            <strong>Scheduled Visit:</strong> {order.details.visitDate} {order.details.visitTime}
                          </Typography>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
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
                {/* Order Status */}
                <Box sx={{ mb: 3, p: 2, bgcolor: theme === 'dark' ? '#1e293b' : '#f8f9fa', borderRadius: 2 }}>
                  <Typography variant="subtitle2" sx={{ color: theme === 'dark' ? '#00ffff' : '#007bff', mb: 1 }}>
                    Current Status
                  </Typography>
                  <Chip
                    label={selectedOrder.status}
                    icon={statusIcons[selectedOrder.status]}
                    color={statusColors[selectedOrder.status]}
                    sx={{ fontSize: '1rem', p: 1 }}
                  />
                  {selectedOrder.status === OrderStatus.UNDER_REVIEW && (
                    <LinearProgress sx={{ mt: 2 }} />
                  )}
                </Box>
                
                {/* Property Info */}
                <Typography variant="subtitle2" sx={{ color: theme === 'dark' ? '#00ffff' : '#007bff', mb: 1 }}>Property Information</Typography>
                <Box sx={{ mb: 3, p: 2, bgcolor: theme === 'dark' ? '#1e293b' : '#f8f9fa', borderRadius: 2 }}>
                  <Typography><strong>Property:</strong> {(selectedOrder.houseId as House)?.title}</Typography>
                  <Typography><strong>Location:</strong> {(selectedOrder.houseId as House)?.location?.address}, {(selectedOrder.houseId as House)?.location?.city}</Typography>
                  <Typography><strong>Price:</strong> {formatPrice((selectedOrder.houseId as House)?.pricing?.price || 0)}</Typography>
                  <Button
                    size="small"
                    variant="outlined"
                    href={`/public/houses/${(selectedOrder.houseId as House)?._id}`}
                    sx={{ mt: 1 }}
                  >
                    View Property Details
                  </Button>
                </Box>
                
                {/* Order Details */}
                <Typography variant="subtitle2" sx={{ color: theme === 'dark' ? '#00ffff' : '#007bff', mb: 1 }}>Order Details</Typography>
                <Box sx={{ mb: 3, p: 2, bgcolor: theme === 'dark' ? '#1e293b' : '#f8f9fa', borderRadius: 2 }}>
                  <Typography><strong>Order Type:</strong> {orderTypeLabels[selectedOrder.orderType]}</Typography>
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
                
                {/* Contact Info */}
                <Typography variant="subtitle2" sx={{ color: theme === 'dark' ? '#00ffff' : '#007bff', mb: 1 }}>Contact Information</Typography>
                <Box sx={{ p: 2, bgcolor: theme === 'dark' ? '#1e293b' : '#f8f9fa', borderRadius: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Person fontSize="small" />
                    <Typography variant="body2">{(selectedOrder.houseId as House)?.agentName || 'Property Manager'}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                    <Phone fontSize="small" />
                    <Typography variant="body2">{(selectedOrder.houseId as House)?.agentContact || 'Contact for details'}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                    <Email fontSize="small" />
                    <Typography variant="body2">{(selectedOrder.houseId as House)?.agentId?.email || 'agent@example.com'}</Typography>
                  </Box>
                </Box>
                
                {/* Timeline */}
                {selectedOrder.timeline && selectedOrder.timeline.length > 0 && (
                  <>
                    <Typography variant="subtitle2" sx={{ color: theme === 'dark' ? '#00ffff' : '#007bff', mt: 3, mb: 1 }}>Timeline</Typography>
                    <Box sx={{ p: 2, bgcolor: theme === 'dark' ? '#1e293b' : '#f8f9fa', borderRadius: 2, maxHeight: 200, overflow: 'auto' }}>
                      {selectedOrder.timeline.map((event, index) => (
                        <Box key={index} sx={{ mb: 1, pb: 1, borderBottom: index < selectedOrder.timeline.length - 1 ? 1 : 0, borderColor: 'divider' }}>
                          <Typography variant="body2"><strong>{event.status}</strong></Typography>
                          <Typography variant="caption" color="text.secondary">{formatDate(event.timestamp)}</Typography>
                          {event.comment && <Typography variant="caption" display="block">{event.comment}</Typography>}
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
                {(selectedOrder.status === OrderStatus.PENDING || selectedOrder.status === OrderStatus.UNDER_REVIEW) && (
                  <Button
                    variant="contained"
                    color="error"
                    onClick={() => { setOpenViewDialog(false); setOpenCancelDialog(true); }}
                  >
                    Cancel Order
                  </Button>
                )}
              </DialogActions>
            </>
          )}
        </Dialog>
        
        {/* Cancel Order Dialog */}
        <Dialog
          open={openCancelDialog}
          onClose={() => setOpenCancelDialog(false)}
          PaperProps={{ sx: { borderRadius: 3, backgroundColor: theme === 'dark' ? '#0f172a' : 'white' } }}
        >
          <DialogTitle>Cancel Order</DialogTitle>
          <DialogContent>
            <Typography>Are you sure you want to cancel this order? This action cannot be undone.</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenCancelDialog(false)}>No, Keep</Button>
            <Button onClick={handleCancelOrder} variant="contained" color="error">Yes, Cancel</Button>
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
          userRole="customer"
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

export default CustomerOrdersPage;