'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Card, CardContent, Chip, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  CircularProgress, useMediaQuery, Snackbar, Alert,
  Tooltip, Avatar, LinearProgress,
  Tabs, Tab, Stack
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/lib/theme-context';
import { useLanguage } from '@/lib/language-context';
import {
  ShoppingCart, Visibility, CheckCircle, Cancel,
  HourglassEmpty, LocalShipping,
  Home, CalendarToday, Message, Refresh,
  Phone, Email, Person,
  Close, Payment as PaymentIcon, Receipt,
  LocationOn, Bed, Bathtub, SquareFoot,
  AccessTime, WhatsApp
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

export default function CustomerOrdersPage() {
  const { theme } = useTheme();
  const { t, isAmharic } = useLanguage();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const isDark = theme === 'dark';
  
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

  const orderTypeLabels: Record<OrderType, string> = {
    [OrderType.PURCHASE]: t('orders.purchase', 'Purchase'),
    [OrderType.RENT]: t('orders.rent', 'Rent'),
    [OrderType.INQUIRY]: t('orders.inquiry', 'Inquiry'),
    [OrderType.APPLICATION]: t('orders.application', 'Application')
  };

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/orders/my');
      setOrders(response.data.data || []);
    } catch (err: any) {
      console.error('Error fetching orders:', err);
      setError(err.response?.data?.message || (isAmharic ? 'ትዕዛዞችን ማምጣት አልተቻለም' : 'Failed to fetch orders'));
    } finally {
      setLoading(false);
    }
  }, [isAmharic]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await api.get('/orders/stats');
      setStats(response.data.data);
    } catch (err: any) {
      console.error('Failed to fetch stats:', err);
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
      
      setSuccess(isAmharic ? 'ትዕዛዙ በተሳካ ሁኔታ ተሰርዟል' : 'Order cancelled successfully');
      setOpenCancelDialog(false);
      fetchOrders();
      fetchStats();
    } catch (err: any) {
      setError(err.response?.data?.message || (isAmharic ? 'ትዕዛዙን መሰረዝ አልተቻለም' : 'Failed to cancel order'));
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat(isAmharic ? 'am-ET' : 'en-US', {
      style: 'currency',
      currency: 'ETB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
    } catch {
      return dateString || '-';
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
    t('customer_orders.all', 'All Orders'),
    t('customer_orders.pending', 'Pending'),
    t('customer_orders.under_review', 'Under Review'),
    t('customer_orders.approved', 'Approved'),
    t('customer_orders.completed', 'Completed'),
    t('customer_orders.rejected', 'Rejected')
  ];

  const statCards = [
    { title: t('dashboard.total_orders', 'Total Orders'), value: stats?.totalOrders || orders.length, icon: <ShoppingCart />, color: '#38bdf8' },
    { title: t('customer_orders.pending', 'Pending'), value: stats?.pendingOrders || orders.filter(o => o.status === OrderStatus.PENDING).length, icon: <HourglassEmpty />, color: '#f59e0b' },
    { title: t('customer_orders.approved', 'Approved'), value: stats?.approvedOrders || orders.filter(o => o.status === OrderStatus.APPROVED).length, icon: <CheckCircle />, color: '#22c55e' },
    { title: t('customer_orders.completed', 'Completed'), value: stats?.completedOrders || orders.filter(o => o.status === OrderStatus.COMPLETED).length, icon: <LocalShipping />, color: '#10b981' }
  ];

  const filteredOrders = getFilteredOrders();

  return (
    <div className="w-full max-w-full overflow-x-hidden min-h-screen">
      <Box sx={{ pt: 1, pb: 4, px: { xs: 1, sm: 2, md: 3 } }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
        >
          <div>
            <Typography variant={isMobile ? "h5" : "h4"} sx={{ fontWeight: 800, color: isDark ? '#f1f5f9' : '#0f172a', letterSpacing: '-0.02em', mb: 0.5 }}>
              {t('customer_orders.title', 'My Orders')}
            </Typography>
            <Typography variant="body2" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>
              {t('customer_orders.subtitle', 'Track and manage your property applications, inquiries, and purchases')}
            </Typography>
          </div>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={() => { fetchOrders(); fetchStats(); }}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              borderColor: isDark ? '#334155' : '#cbd5e1',
              color: isDark ? '#e2e8f0' : '#334155',
              alignSelf: { xs: 'flex-start', sm: 'center' },
              '&:hover': {
                borderColor: isDark ? '#38bdf8' : '#2563eb',
                bgcolor: isDark ? 'rgba(56, 189, 248, 0.08)' : 'rgba(37, 99, 235, 0.04)'
              }
            }}
          >
            {t('action.refresh', 'Refresh')}
          </Button>
        </motion.div>
        
        {/* Statistics Cards */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 2, mb: 4 }}>
            {statCards.map((stat, index) => (
              <Card 
                key={index} 
                sx={{ 
                  borderRadius: 3,
                  borderLeft: `4px solid ${stat.color}`,
                  bgcolor: isDark ? '#112240' : '#ffffff',
                  color: isDark ? '#f1f5f9' : '#0f172a',
                  borderTop: `1px solid ${isDark ? '#233554' : '#e2e8f0'}`,
                  borderRight: `1px solid ${isDark ? '#233554' : '#e2e8f0'}`,
                  borderBottom: `1px solid ${isDark ? '#233554' : '#e2e8f0'}`,
                  boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.25)' : '0 2px 8px rgba(15,23,42,0.04)',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: isDark ? '0 8px 25px rgba(0,0,0,0.35)' : '0 6px 16px rgba(15,23,42,0.08)'
                  }
                }}
              >
                <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="h4" sx={{ fontWeight: 800, color: isDark ? '#f1f5f9' : '#0f172a' }}>
                        {stat.value}
                      </Typography>
                      <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b', fontWeight: 600 }}>
                        {stat.title}
                      </Typography>
                    </Box>
                    <Box sx={{ color: stat.color, p: 1.2, borderRadius: 2.5, bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }}>
                      {stat.icon}
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        </motion.div>
        
        {/* Tabs */}
        <Card 
          sx={{ 
            mb: 3, 
            borderRadius: 3, 
            bgcolor: isDark ? '#112240' : '#ffffff',
            border: `1px solid ${isDark ? '#233554' : '#e2e8f0'}`,
            boxShadow: 'none'
          }}
        >
          <Box sx={{ borderBottom: 1, borderColor: isDark ? '#233554' : '#e2e8f0', overflowX: 'auto' }}>
            <Tabs
              value={selectedTab}
              onChange={(e, newValue) => setSelectedTab(newValue)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                '& .MuiTab-root': { 
                  color: isDark ? '#94a3b8' : '#64748b',
                  fontWeight: 600,
                  textTransform: 'none',
                  fontSize: { xs: '0.85rem', sm: '0.95rem' }
                },
                '& .Mui-selected': { 
                  color: isDark ? '#38bdf8 !important' : '#2563eb !important',
                  fontWeight: 700 
                },
                '& .MuiTabs-indicator': {
                  backgroundColor: isDark ? '#38bdf8' : '#2563eb',
                  height: 3,
                  borderRadius: 2
                }
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
            <CircularProgress size={48} sx={{ color: isDark ? '#38bdf8' : '#2563eb' }} />
          </Box>
        ) : filteredOrders.length === 0 ? (
          <Card 
            sx={{ 
              textAlign: 'center', 
              py: 8, 
              px: 3,
              borderRadius: 3, 
              bgcolor: isDark ? '#112240' : '#ffffff',
              border: `1px solid ${isDark ? '#233554' : '#e2e8f0'}`
            }}
          >
            <ShoppingCart sx={{ fontSize: 64, color: isDark ? '#334155' : '#cbd5e1', mb: 2 }} />
            <Typography variant="h6" sx={{ color: isDark ? '#f1f5f9' : '#0f172a', fontWeight: 700 }}>
              {t('orders.no_orders', 'No orders found')}
            </Typography>
            <Typography variant="body2" sx={{ color: isDark ? '#94a3b8' : '#64748b', mt: 0.5, mb: 3 }}>
              {t('messages.no_messages_desc', 'Try adjusting your search or filters to see more results.')}
            </Typography>
            <Button
              variant="contained"
              href="/public/houses"
              sx={{ 
                borderRadius: 2.5,
                bgcolor: isDark ? '#38bdf8' : '#2563eb',
                color: isDark ? '#0a192f' : '#ffffff',
                fontWeight: 700,
                textTransform: 'none',
                px: 3,
                py: 1,
                '&:hover': {
                  bgcolor: isDark ? '#7dd3fc' : '#1d4ed8'
                }
              }}
            >
              {t('action.browse_properties', 'Browse Properties')}
            </Button>
          </Card>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <AnimatePresence>
              {filteredOrders.map((order, index) => (
                <motion.div
                  key={order._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.04 }}
                >
                  <Card 
                    sx={{ 
                      borderRadius: 3,
                      bgcolor: isDark ? '#112240' : '#ffffff',
                      border: `1px solid ${isDark ? '#233554' : '#e2e8f0'}`,
                      boxShadow: isDark ? '0 4px 15px rgba(0,0,0,0.2)' : '0 2px 8px rgba(15,23,42,0.04)',
                      transition: 'transform 0.2s ease, border-color 0.2s ease',
                      '&:hover': { 
                        transform: 'translateY(-2px)',
                        borderColor: isDark ? '#38bdf8' : '#2563eb'
                      }
                    }}
                  >
                    <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, gap: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 2, minWidth: 0 }}>
                          <Avatar sx={{ bgcolor: isDark ? 'rgba(56, 189, 248, 0.15)' : 'rgba(37, 99, 235, 0.1)', color: isDark ? '#38bdf8' : '#2563eb', width: 44, height: 44 }}>
                            <Home />
                          </Avatar>
                          <Box sx={{ minWidth: 0 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: isDark ? '#f1f5f9' : '#0f172a', lineHeight: 1.3 }}>
                              {(order.houseId as House)?.title || (isAmharic ? 'የተመረጠ ቤት' : 'Property')}
                            </Typography>
                            <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b', display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.3 }}>
                              <LocationOn sx={{ fontSize: 13 }} />
                              {(order.houseId as House)?.location?.city || (order.houseId as House)?.location?.address || 'Ethiopia'}
                            </Typography>
                          </Box>
                        </Box>
                        
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.5 }}>
                          <Chip
                            label={orderTypeLabels[order.orderType] || order.orderType}
                            size="small"
                            sx={{ 
                              bgcolor: isDark ? '#1e293b' : '#f1f5f9',
                              color: isDark ? '#e2e8f0' : '#475569',
                              fontWeight: 600,
                              borderRadius: 1.5
                            }}
                          />
                          <Typography variant="h6" sx={{ fontWeight: 800, color: isDark ? '#38bdf8' : '#2563eb' }}>
                            {formatPrice(order.totalAmount)}
                          </Typography>
                        </Box>
                        
                        <Box sx={{ textAlign: { xs: 'left', md: 'right' } }}>
                          <Chip
                            label={t(`status.${order.status.toLowerCase()}`, order.status)}
                            size="small"
                            icon={statusIcons[order.status]}
                            color={statusColors[order.status]}
                            sx={{ fontWeight: 700, borderRadius: 1.5 }}
                          />
                          <Typography variant="caption" display="block" sx={{ color: isDark ? '#94a3b8' : '#64748b', mt: 0.5 }}>
                            {formatDate(order.created_at)}
                          </Typography>
                        </Box>
                        
                        <Box sx={{ display: 'flex', gap: 1, alignSelf: { xs: 'flex-end', md: 'center' } }}>
                          <Tooltip title={t('action.view_details', 'View Details')}>
                            <IconButton
                              onClick={() => { setSelectedOrder(order); setOpenViewDialog(true); }}
                              sx={{ 
                                color: isDark ? '#38bdf8' : '#2563eb',
                                bgcolor: isDark ? 'rgba(56, 189, 248, 0.1)' : 'rgba(37, 99, 235, 0.08)',
                                '&:hover': { bgcolor: isDark ? 'rgba(56, 189, 248, 0.2)' : 'rgba(37, 99, 235, 0.15)' }
                              }}
                            >
                              <Visibility fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={t('action.send_message', 'Send Message')}>
                            <IconButton
                              onClick={() => { 
                                setSelectedOrderForMessage(order); 
                                setOpenMessageDialog(true); 
                              }}
                              sx={{ 
                                color: isDark ? '#c084fc' : '#8b5cf6',
                                bgcolor: isDark ? 'rgba(192, 132, 252, 0.1)' : 'rgba(139, 92, 246, 0.08)',
                                '&:hover': { bgcolor: isDark ? 'rgba(192, 132, 252, 0.2)' : 'rgba(139, 92, 246, 0.15)' }
                              }}
                            >
                              <Message fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          {(order.status === OrderStatus.PENDING || order.status === OrderStatus.UNDER_REVIEW) && (
                            <Tooltip title={t('customer_orders.cancel_order', 'Cancel Order')}>
                              <IconButton
                                onClick={() => { setSelectedOrder(order); setOpenCancelDialog(true); }}
                                sx={{ 
                                  color: isDark ? '#f87171' : '#dc2626',
                                  bgcolor: isDark ? 'rgba(248, 113, 113, 0.1)' : 'rgba(220, 38, 38, 0.08)',
                                  '&:hover': { bgcolor: isDark ? 'rgba(248, 113, 113, 0.2)' : 'rgba(220, 38, 38, 0.15)' }
                                }}
                              >
                                <Cancel fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      </Box>
                      
                      {order.details?.visitDate && (
                        <Box sx={{ mt: 2, p: 1.5, bgcolor: isDark ? '#1e293b' : '#f8fafc', borderRadius: 2, border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}` }}>
                          <Typography variant="caption" sx={{ color: isDark ? '#cbd5e1' : '#475569' }}>
                            <strong>{t('orders.visit_date', 'Visit Date')}:</strong> {order.details.visitDate} {order.details.visitTime || ''}
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
          fullScreen={isMobile}
          PaperProps={{ 
            sx: { 
              borderRadius: isMobile ? 0 : 3, 
              bgcolor: isDark ? '#112240' : '#ffffff',
              color: isDark ? '#f1f5f9' : '#0f172a',
              border: `1px solid ${isDark ? '#233554' : '#e2e8f0'}`,
              maxHeight: '92vh' 
            } 
          }}
        >
          {selectedOrder && (
            <>
              <DialogTitle sx={{ 
                borderBottom: `1px solid ${isDark ? '#233554' : '#e2e8f0'}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                py: 2,
                px: { xs: 2, sm: 3 }
              }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: isDark ? '#f1f5f9' : '#0f172a' }}>
                    {t('action.view_details', 'Order Details')}
                  </Typography>
                  <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>
                    {t('customer_orders.order_id', 'Order ID')}: {selectedOrder._id.slice(-8)}
                  </Typography>
                </Box>
                <IconButton onClick={() => setOpenViewDialog(false)} sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>
                  <Close />
                </IconButton>
              </DialogTitle>
              
              <DialogContent dividers sx={{ p: 0, borderColor: isDark ? '#233554' : '#e2e8f0' }}>
                {/* Order Status Header */}
                <Box sx={{ 
                  p: { xs: 2, sm: 3 }, 
                  bgcolor: isDark ? 'rgba(30, 41, 59, 0.5)' : '#f8fafc',
                  borderBottom: `1px solid ${isDark ? '#233554' : '#e2e8f0'}`
                }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                    <Box>
                      <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b', fontWeight: 600 }}>
                        {t('customer_payments.status', 'Current Status')}
                      </Typography>
                      <Box sx={{ mt: 0.5 }}>
                        <Chip
                          label={t(`status.${selectedOrder.status.toLowerCase()}`, selectedOrder.status)}
                          icon={statusIcons[selectedOrder.status]}
                          color={statusColors[selectedOrder.status]}
                          sx={{ fontWeight: 700 }}
                        />
                      </Box>
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b', fontWeight: 600 }}>
                        {t('customer_orders.created_at', 'Order Date')}
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: isDark ? '#f1f5f9' : '#0f172a' }}>
                        {formatDate(selectedOrder.created_at)}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b', fontWeight: 600 }}>
                        {t('orders.order_type', 'Order Type')}
                      </Typography>
                      <Box sx={{ mt: 0.5 }}>
                        <Chip label={orderTypeLabels[selectedOrder.orderType]} size="small" />
                      </Box>
                    </Box>
                  </Box>
                  {selectedOrder.status === OrderStatus.UNDER_REVIEW && (
                    <LinearProgress sx={{ mt: 2, borderRadius: 1 }} />
                  )}
                </Box>
                
                {/* Property Information */}
                <Box sx={{ p: { xs: 2, sm: 3 }, borderBottom: `1px solid ${isDark ? '#233554' : '#e2e8f0'}` }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: isDark ? '#38bdf8' : '#2563eb', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Home fontSize="small" /> {t('messages.property_info', 'Property Information')}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 3 }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>{t('customer_orders.property_name', 'Property Title')}</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 700, mb: 1, color: isDark ? '#f1f5f9' : '#0f172a' }}>
                        {(selectedOrder.houseId as House)?.title || 'Property'}
                      </Typography>
                      
                      <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>{t('property.location', 'Location')}</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                        <LocationOn sx={{ fontSize: 15, color: isDark ? '#38bdf8' : '#2563eb' }} />
                        <Typography variant="body2" sx={{ color: isDark ? '#e2e8f0' : '#334155' }}>
                          {(selectedOrder.houseId as House)?.location?.address}, {(selectedOrder.houseId as House)?.location?.city}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Bed sx={{ fontSize: 16, color: isDark ? '#94a3b8' : '#64748b' }} />
                          <Typography variant="body2">{(selectedOrder.houseId as House)?.details?.bedrooms || 0} {t('property.beds', 'beds')}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Bathtub sx={{ fontSize: 16, color: isDark ? '#94a3b8' : '#64748b' }} />
                          <Typography variant="body2">{(selectedOrder.houseId as House)?.details?.bathrooms || 0} {t('property.baths', 'baths')}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <SquareFoot sx={{ fontSize: 16, color: isDark ? '#94a3b8' : '#64748b' }} />
                          <Typography variant="body2">{(selectedOrder.houseId as House)?.details?.area || 0} {t('property.sqft', 'sqft')}</Typography>
                        </Box>
                      </Box>
                    </Box>
                    
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>{t('property.price', 'Price')}</Typography>
                      <Typography variant="h5" sx={{ fontWeight: 800, color: isDark ? '#38bdf8' : '#2563eb', mb: 1 }}>
                        {formatPrice((selectedOrder.houseId as House)?.pricing?.price || selectedOrder.totalAmount)}
                      </Typography>
                      
                      <Button
                        size="small"
                        variant="outlined"
                        href={`/public/houses/${(selectedOrder.houseId as House)?._id}`}
                        sx={{ 
                          mt: 1,
                          textTransform: 'none',
                          borderRadius: 2,
                          borderColor: isDark ? '#334155' : '#cbd5e1',
                          color: isDark ? '#e2e8f0' : '#334155'
                        }}
                      >
                        {t('action.view_details', 'View Property Details')}
                      </Button>
                    </Box>
                  </Box>
                </Box>
                
                {/* Order Details */}
                <Box sx={{ p: { xs: 2, sm: 3 }, borderBottom: `1px solid ${isDark ? '#233554' : '#e2e8f0'}` }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: isDark ? '#38bdf8' : '#2563eb', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Receipt fontSize="small" /> {t('customer_payments.type', 'Order Summary')}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1, borderBottom: `1px solid ${isDark ? '#1e293b' : '#f1f5f9'}` }}>
                      <Typography variant="body2" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>{t('orders.order_type', 'Order Type')}</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{orderTypeLabels[selectedOrder.orderType]}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1, borderBottom: `1px solid ${isDark ? '#1e293b' : '#f1f5f9'}` }}>
                      <Typography variant="body2" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>{t('orders.total_amount', 'Total Amount')}</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 800, color: isDark ? '#38bdf8' : '#2563eb' }}>
                        {formatPrice(selectedOrder.totalAmount)}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
                
                {/* Visit Schedule */}
                {(selectedOrder.details?.visitDate || selectedOrder.details?.visitTime) && (
                  <Box sx={{ p: { xs: 2, sm: 3 }, borderBottom: `1px solid ${isDark ? '#233554' : '#e2e8f0'}` }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: isDark ? '#38bdf8' : '#2563eb', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AccessTime fontSize="small" /> {t('orders.visit_date', 'Visit Schedule')}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                      {selectedOrder.details?.visitDate && (
                        <Box>
                          <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>{t('orders.visit_date', 'Visit Date')}</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedOrder.details.visitDate}</Typography>
                        </Box>
                      )}
                      {selectedOrder.details?.visitTime && (
                        <Box>
                          <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>{t('workflows.preferred_time', 'Visit Time')}</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedOrder.details.visitTime}</Typography>
                        </Box>
                      )}
                      {selectedOrder.details?.numberOfPeople && (
                        <Box>
                          <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>{t('orders.number_of_people', 'Number of People')}</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedOrder.details.numberOfPeople}</Typography>
                        </Box>
                      )}
                    </Box>
                  </Box>
                )}
                
                {/* Timeline */}
                {selectedOrder.timeline && selectedOrder.timeline.length > 0 && (
                  <Box sx={{ p: { xs: 2, sm: 3 } }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: isDark ? '#38bdf8' : '#2563eb', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AccessTime fontSize="small" /> {t('orders.timeline', 'Timeline')}
                    </Typography>
                    
                    <Box sx={{ maxHeight: 220, overflow: 'auto' }}>
                      {selectedOrder.timeline.map((event, index) => (
                        <Box key={index} sx={{ 
                          mb: 2, 
                          pb: 2, 
                          borderBottom: index < (selectedOrder.timeline?.length || 0) - 1 ? `1px solid ${isDark ? '#233554' : '#e2e8f0'}` : 0, 
                          position: 'relative',
                          pl: 3
                        }}>
                          <Box sx={{ 
                            position: 'absolute', 
                            left: 0, 
                            top: 4,
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            backgroundColor: event.status === OrderStatus.COMPLETED || event.status === OrderStatus.APPROVED ? '#22c55e' : 
                                          event.status === OrderStatus.PENDING ? '#f59e0b' :
                                          event.status === OrderStatus.REJECTED || event.status === OrderStatus.CANCELLED ? '#ef4444' : '#38bdf8'
                          }} />
                          <Typography variant="body2" sx={{ fontWeight: 700, color: isDark ? '#f1f5f9' : '#0f172a' }}>
                            {t(`status.${event.status.toLowerCase()}`, event.status)}
                          </Typography>
                          <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b', display: 'block' }}>
                            {formatDate(event.timestamp)}
                          </Typography>
                          {event.comment && (
                            <Typography variant="caption" display="block" sx={{ mt: 0.5, color: isDark ? '#cbd5e1' : '#475569' }}>
                              {event.comment}
                            </Typography>
                          )}
                        </Box>
                      ))}
                    </Box>
                  </Box>
                )}
              </DialogContent>
              
              <DialogActions sx={{ p: { xs: 2, sm: 3 }, gap: 1.5, flexWrap: 'wrap', borderColor: isDark ? '#233554' : '#e2e8f0', borderTop: `1px solid ${isDark ? '#233554' : '#e2e8f0'}` }}>
                <Button 
                  onClick={() => setOpenViewDialog(false)}
                  sx={{ textTransform: 'none', color: isDark ? '#94a3b8' : '#64748b' }}
                >
                  {t('action.close', 'Close')}
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<WhatsApp />}
                  onClick={() => {
                    const phone = (selectedOrder.houseId as House)?.agentContact;
                    if (phone) {
                      window.open(`https://wa.me/${phone.replace(/[^0-9]/g, '')}`, '_blank');
                    }
                  }}
                  sx={{ textTransform: 'none', borderRadius: 2 }}
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
                  sx={{ textTransform: 'none', borderRadius: 2 }}
                >
                  {t('action.send_message', 'Send Message')}
                </Button>
                <Button
                  variant="contained"
                  startIcon={<PaymentIcon />}
                  onClick={() => {
                    setOpenViewDialog(false);
                    setOpenPaymentModal(true);
                  }}
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 700,
                    bgcolor: isDark ? '#38bdf8' : '#2563eb',
                    color: isDark ? '#0a192f' : '#ffffff',
                    '&:hover': {
                      bgcolor: isDark ? '#7dd3fc' : '#1d4ed8'
                    }
                  }}
                >
                  {t('customer_orders.pay_now', 'Pay Now')} ({formatPrice(selectedOrder.totalAmount)})
                </Button>
                {(selectedOrder.status === OrderStatus.PENDING || selectedOrder.status === OrderStatus.UNDER_REVIEW) && (
                  <Button
                    variant="contained"
                    color="error"
                    startIcon={<Cancel />}
                    onClick={() => { setOpenViewDialog(false); setOpenCancelDialog(true); }}
                    sx={{ borderRadius: 2, textTransform: 'none' }}
                  >
                    {t('customer_orders.cancel_order', 'Cancel Order')}
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
          PaperProps={{ 
            sx: { 
              borderRadius: 3, 
              bgcolor: isDark ? '#112240' : '#ffffff',
              color: isDark ? '#f1f5f9' : '#0f172a',
              border: `1px solid ${isDark ? '#233554' : '#e2e8f0'}`
            } 
          }}
        >
          <DialogTitle sx={{ fontWeight: 800 }}>{t('customer_orders.cancel_order', 'Cancel Order')}</DialogTitle>
          <DialogContent>
            <Typography sx={{ color: isDark ? '#cbd5e1' : '#475569' }}>
              {t('customer_orders.cancel_confirm', 'Are you sure you want to cancel this order? This action cannot be undone.')}
            </Typography>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setOpenCancelDialog(false)} sx={{ textTransform: 'none' }}>
              {t('action.cancel', 'Cancel')}
            </Button>
            <Button onClick={handleCancelOrder} variant="contained" color="error" sx={{ textTransform: 'none', borderRadius: 2 }}>
              {t('action.confirm', 'Yes, Cancel')}
            </Button>
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
}