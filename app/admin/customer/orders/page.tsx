'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Card, CardContent, Chip, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Divider, CircularProgress, useMediaQuery, Snackbar, Alert,
  Tooltip, Avatar, LinearProgress,
  Tabs, Tab, Grid, Paper, Stack
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/lib/theme-context';
import Navbar from '@/components/ui/Navbar';
import {
  ShoppingCart, Visibility, CheckCircle, Cancel,
  HourglassEmpty, LocalShipping, AttachMoney,
  Home, CalendarToday, Message, Refresh,
  TrendingUp, Phone, Email, Person,
  Close, Payment as PaymentIcon, Receipt,
  LocationOn, Bed, Bathtub, SquareFoot,
  AccessTime, Description, WhatsApp
} from '@mui/icons-material';
import api from '@/app/utils/api';
import { Order, OrderStatus, OrderType, House } from '@/types/houses';
import { format } from 'date-fns';
import MessageConversation from '@/components/MessageConversation';
import PaymentModal from '@/components/PaymentModal';

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
  const [openPaymentModal, setOpenPaymentModal] = useState(false);
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

  const getPaymentStatusColor = (status: OrderStatus) => {
    if (status === OrderStatus.APPROVED || status === OrderStatus.COMPLETED) {
      return '#00ff00';
    }
    return '#ff9900';
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
        
        {/* Statistics Cards */}
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
        
        {/* View Order Dialog - Enhanced with Payment Button */}
        <Dialog
          open={openViewDialog}
          onClose={() => setOpenViewDialog(false)}
          maxWidth="md"
          fullWidth
          fullScreen={isMobile}
          PaperProps={{ sx: { borderRadius: 3, backgroundColor: theme === 'dark' ? '#0f172a' : 'white', maxHeight: '90vh' } }}
        >
          {selectedOrder && (
            <>
              <DialogTitle sx={{ 
                borderBottom: 1, 
                borderColor: 'divider',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                py: 2
              }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    Order Details
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Order ID: {selectedOrder._id.slice(-8)}
                  </Typography>
                </Box>
                <IconButton onClick={() => setOpenViewDialog(false)}>
                  <Close />
                </IconButton>
              </DialogTitle>
              
              <DialogContent dividers sx={{ p: 0 }}>
                {/* Order Status Header */}
                <Box sx={{ 
                  p: 3, 
                  background: theme === 'dark' 
                    ? 'linear-gradient(135deg, #1e293b, #0f172a)' 
                    : 'linear-gradient(135deg, #f8f9fa, #ffffff)',
                  borderBottom: 1,
                  borderColor: 'divider'
                }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">Current Status</Typography>
                      <Chip
                        label={selectedOrder.status}
                        icon={statusIcons[selectedOrder.status]}
                        color={statusColors[selectedOrder.status]}
                        sx={{ mt: 0.5, fontSize: '0.9rem', p: 1 }}
                      />
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">Order Date</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>{formatDate(selectedOrder.created_at)}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">Order Type</Typography>
                      <Chip label={orderTypeLabels[selectedOrder.orderType]} size="small" />
                    </Box>
                  </Box>
                  {selectedOrder.status === OrderStatus.UNDER_REVIEW && (
                    <LinearProgress sx={{ mt: 2 }} />
                  )}
                </Box>
                
                {/* Property Information */}
                <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: theme === 'dark' ? '#00ffff' : '#007bff', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Home fontSize="small" /> Property Information
                  </Typography>
                  
                  <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 3 }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="caption" color="text.secondary">Property Title</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
                        {(selectedOrder.houseId as House)?.title}
                      </Typography>
                      
                      <Typography variant="caption" color="text.secondary">Location</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                        <LocationOn sx={{ fontSize: 14, color: 'text.secondary' }} />
                        <Typography variant="body2">
                          {(selectedOrder.houseId as House)?.location?.address}, {(selectedOrder.houseId as House)?.location?.city}
                        </Typography>
                      </Box>
                      
                      <Typography variant="caption" color="text.secondary">Property Details</Typography>
                      <Box sx={{ display: 'flex', gap: 2, mt: 0.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Bed sx={{ fontSize: 14 }} />
                          <Typography variant="body2">{(selectedOrder.houseId as House)?.details?.bedrooms} beds</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Bathtub sx={{ fontSize: 14 }} />
                          <Typography variant="body2">{(selectedOrder.houseId as House)?.details?.bathrooms} baths</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <SquareFoot sx={{ fontSize: 14 }} />
                          <Typography variant="body2">{(selectedOrder.houseId as House)?.details?.area} sqft</Typography>
                        </Box>
                      </Box>
                    </Box>
                    
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="caption" color="text.secondary">Price</Typography>
                      <Typography variant="h5" sx={{ fontWeight: 'bold', color: theme === 'dark' ? '#00ffff' : '#007bff', mb: 1 }}>
                        {formatPrice((selectedOrder.houseId as House)?.pricing?.price || 0)}
                      </Typography>
                      
                      {(selectedOrder.houseId as House)?.pricing?.quantity > 1 && (
                        <>
                          <Typography variant="caption" color="text.secondary">Units Available</Typography>
                          <Typography variant="body2" sx={{ mb: 1 }}>{(selectedOrder.houseId as House)?.pricing?.quantity} units</Typography>
                        </>
                      )}
                      
                      <Button
                        size="small"
                        variant="outlined"
                        href={`/public/houses/${(selectedOrder.houseId as House)?._id}`}
                        sx={{ mt: 1 }}
                      >
                        View Property Details
                      </Button>
                    </Box>
                  </Box>
                </Box>
                
                {/* Order Details */}
                <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: theme === 'dark' ? '#00ffff' : '#007bff', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Receipt fontSize="small" /> Order Summary
                  </Typography>
                  
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1, borderBottom: 1, borderColor: 'divider' }}>
                      <Typography variant="body2" color="text.secondary">Order Type</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>{orderTypeLabels[selectedOrder.orderType]}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1, borderBottom: 1, borderColor: 'divider' }}>
                      <Typography variant="body2" color="text.secondary">Total Amount</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', color: theme === 'dark' ? '#00ffff' : '#007bff' }}>
                        {formatPrice(selectedOrder.totalAmount)}
                      </Typography>
                    </Box>
                    {selectedOrder.details.quantity && selectedOrder.details.quantity > 1 && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1, borderBottom: 1, borderColor: 'divider' }}>
                        <Typography variant="body2" color="text.secondary">Quantity</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>{selectedOrder.details.quantity} units</Typography>
                      </Box>
                    )}
                  </Box>
                </Box>
                
                {/* Visit Details */}
                {(selectedOrder.details.visitDate || selectedOrder.details.visitTime) && (
                  <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: theme === 'dark' ? '#00ffff' : '#007bff', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AccessTime fontSize="small" /> Visit Schedule
                    </Typography>
                    
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                      {selectedOrder.details.visitDate && (
                        <Box>
                          <Typography variant="caption" color="text.secondary">Visit Date</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>{selectedOrder.details.visitDate}</Typography>
                        </Box>
                      )}
                      {selectedOrder.details.visitTime && (
                        <Box>
                          <Typography variant="caption" color="text.secondary">Visit Time</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>{selectedOrder.details.visitTime}</Typography>
                        </Box>
                      )}
                      {selectedOrder.details.numberOfPeople && (
                        <Box>
                          <Typography variant="caption" color="text.secondary">Number of People</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>{selectedOrder.details.numberOfPeople}</Typography>
                        </Box>
                      )}
                    </Box>
                    
                    {selectedOrder.details.specialRequests && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="caption" color="text.secondary">Special Requests</Typography>
                        <Typography variant="body2" sx={{ fontStyle: 'italic' }}>{selectedOrder.details.specialRequests}</Typography>
                      </Box>
                    )}
                  </Box>
                )}
                
                {/* Contact Information */}
                <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: theme === 'dark' ? '#00ffff' : '#007bff', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Person fontSize="small" /> Contact Information
                  </Typography>
                  
                  <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 3 }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Agent Name</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {(selectedOrder.houseId as House)?.agentName || 'Property Manager'}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Phone</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Phone sx={{ fontSize: 14 }} />
                        <Typography variant="body2">{(selectedOrder.houseId as House)?.agentContact || 'Contact for details'}</Typography>
                      </Box>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Email</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Email sx={{ fontSize: 14 }} />
                        <Typography variant="body2">{(selectedOrder.houseId as House)?.agentId?.email || 'agent@example.com'}</Typography>
                      </Box>
                    </Box>
                  </Box>
                </Box>
                
                {/* Timeline */}
                {selectedOrder.timeline && selectedOrder.timeline.length > 0 && (
                  <Box sx={{ p: 3 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: theme === 'dark' ? '#00ffff' : '#007bff', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AccessTime fontSize="small" /> Timeline
                    </Typography>
                    
                    <Box sx={{ maxHeight: 250, overflow: 'auto' }}>
                      {selectedOrder.timeline.map((event, index) => (
                        <Box key={index} sx={{ 
                          mb: 2, 
                          pb: 2, 
                          borderBottom: index < selectedOrder.timeline.length - 1 ? 1 : 0, 
                          borderColor: 'divider',
                          position: 'relative',
                          pl: 3
                        }}>
                          <Box sx={{ 
                            position: 'absolute', 
                            left: 0, 
                            top: 0,
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            backgroundColor: statusColors[event.status] === 'success' ? '#00ff00' : 
                                          statusColors[event.status] === 'warning' ? '#ff9900' :
                                          statusColors[event.status] === 'error' ? '#ff0000' : '#00ffff'
                          }} />
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{event.status}</Typography>
                          <Typography variant="caption" color="text.secondary" display="block">
                            {formatDate(event.timestamp)}
                          </Typography>
                          {event.comment && (
                            <Typography variant="caption" display="block" sx={{ mt: 0.5, color: theme === 'dark' ? '#a8b2d1' : '#666666' }}>
                              {event.comment}
                            </Typography>
                          )}
                        </Box>
                      ))}
                    </Box>
                  </Box>
                )}
              </DialogContent>
              
              <DialogActions sx={{ p: 3, gap: 2, flexWrap: 'wrap' }}>
                <Button onClick={() => setOpenViewDialog(false)}>Close</Button>
                <Button
                  variant="outlined"
                  startIcon={<WhatsApp />}
                  onClick={() => {
                    const phone = (selectedOrder.houseId as House)?.agentContact;
                    if (phone) {
                      window.open(`https://wa.me/${phone.replace(/[^0-9]/g, '')}`, '_blank');
                    }
                  }}
                >
                  WhatsApp
                </Button>
                <Button
                  variant="outlined"
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
                  startIcon={<PaymentIcon />}
                  onClick={() => {
                    setOpenViewDialog(false);
                    setOpenPaymentModal(true);
                  }}
                  sx={{
                    background: theme === 'dark' ? 'linear-gradient(135deg, #ff9900, #ff6600)' : 'linear-gradient(135deg, #ff9900, #ff6600)',
                    '&:hover': {
                      background: theme === 'dark' ? 'linear-gradient(135deg, #ff8800, #ff5500)' : 'linear-gradient(135deg, #ff8800, #ff5500)'
                    }
                  }}
                >
                  Make Payment ({formatPrice(selectedOrder.totalAmount)})
                </Button>
                {(selectedOrder.status === OrderStatus.PENDING || selectedOrder.status === OrderStatus.UNDER_REVIEW) && (
                  <Button
                    variant="contained"
                    color="error"
                    startIcon={<Cancel />}
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
        
        {/* Payment Modal */}
        {selectedOrder && (
          <PaymentModal
            open={openPaymentModal}
            onClose={() => {
              setOpenPaymentModal(false);
              setSelectedOrder(null);
            }}
            houseId={(selectedOrder.houseId as House)?._id || ''}
            houseTitle={(selectedOrder.houseId as House)?.title || ''}
            amount={selectedOrder.totalAmount}
          />
        )}
        
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

export default CustomerOrdersPage;