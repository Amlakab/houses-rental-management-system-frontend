'use client';

import { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, Chip,
  CircularProgress, useMediaQuery, Divider, Avatar,
  List, ListItem, ListItemText, ListItemAvatar, LinearProgress
} from '@mui/material';
import { motion } from 'framer-motion';
import { useTheme } from '@/lib/theme-context';
import Navbar from '@/components/ui/Navbar';
import {
  Home, TrendingUp, AttachMoney, People,
  ShoppingCart, CheckCircle, Cancel, HourglassEmpty,
  Visibility, LocationOn, CalendarToday, ArrowUpward,
  ArrowDownward, Apartment, House, Villa, Landscape
} from '@mui/icons-material';
import api from '@/app/utils/api';
import { HouseStats, OrderStats } from '@/types/houses';
import { Line, Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const AdminDashboardPage = () => {
  const { theme } = useTheme();
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  const [houseStats, setHouseStats] = useState<HouseStats | null>(null);
  const [orderStats, setOrderStats] = useState<OrderStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const [housesRes, ordersRes] = await Promise.all([
          api.get('/houses/stats'),
          api.get('/orders/stats')
        ]);
        setHouseStats(housesRes.data.data);
        setOrderStats(ordersRes.data.data);
      } catch (error: any) {
        console.error('Error fetching stats:', error);
        setError(error.response?.data?.message || 'Failed to fetch statistics');
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(price);
  };

  // Chart data
  const propertyTypeData = {
    labels: houseStats?.propertyTypeStats?.map(s => s._id) || [],
    datasets: [{
      label: 'Number of Properties',
      data: houseStats?.propertyTypeStats?.map(s => s.count) || [],
      backgroundColor: theme === 'dark' 
        ? ['#00ffff', '#00b3b3', '#008080', '#00ffff80', '#00b3b380']
        : ['#007bff', '#0056b3', '#004080', '#007bff80', '#0056b380'],
      borderColor: theme === 'dark' ? '#00ffff' : '#007bff',
      borderWidth: 1
    }]
  };

  const orderStatusData = {
    labels: ['Pending', 'Under Review', 'Approved', 'Completed', 'Rejected'],
    datasets: [{
      data: [
        orderStats?.pendingOrders || 0,
        orderStats?.underReviewOrders || 0,
        orderStats?.approvedOrders || 0,
        orderStats?.completedOrders || 0,
        orderStats?.rejectedOrders || 0
      ],
      backgroundColor: ['#ff9900', '#00ffff', '#00ff00', '#28a745', '#dc3545']
    }]
  };

  const topViewedData = {
    labels: houseStats?.topViewedHouses?.map(h => h.title.substring(0, 20)) || [],
    datasets: [{
      label: 'Views',
      data: houseStats?.topViewedHouses?.map(h => h.views) || [],
      backgroundColor: theme === 'dark' ? '#00ffff' : '#007bff',
      borderRadius: 8
    }]
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${theme === 'dark' ? 'bg-gradient-to-br from-[#0a192f] to-[#112240]' : 'bg-gradient-to-br from-[#f0f0f0] to-[#ffffff]'}`}>
        {/* <Navbar /> */}
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
          <CircularProgress size={60} sx={{ color: theme === 'dark' ? '#00ffff' : '#007bff' }} />
        </Box>
      </div>
    );
  }

  const statCards = [
    { title: 'Total Properties', value: houseStats?.totalHouses || 0, icon: <Home />, color: '#00ffff', change: '+12%' },
    { title: 'Available', value: houseStats?.availableHouses || 0, icon: <CheckCircle />, color: '#00ff00', change: '+5%' },
    { title: 'Sold/Rented', value: (houseStats?.soldHouses || 0) + (houseStats?.rentedHouses || 0), icon: <AttachMoney />, color: '#ff9900', change: '+8%' },
    { title: 'Total Orders', value: orderStats?.totalOrders || 0, icon: <ShoppingCart />, color: '#00ffff', change: '+15%' },
    { title: 'Total Views', value: houseStats?.totalViews || 0, icon: <Visibility />, color: '#00ffff', change: '+23%' },
    { title: 'Total Revenue', value: formatPrice(orderStats?.totalRevenue || 0), icon: <AttachMoney />, color: '#00ff00', change: '+18%' }
  ];

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
            Admin Dashboard
          </Typography>
          <Typography variant="body2" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
            Overview of your real estate platform performance
          </Typography>
        </motion.div>
        
        {/* Statistics Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 4, mt: 3 }}>
            {statCards.map((stat, index) => (
              <Box key={index} sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(33.33% - 16px)', md: '1 1 calc(16.66% - 16px)' }, minWidth: '180px' }}>
                <Card sx={{ 
                  borderRadius: 3,
                  borderLeft: `4px solid ${stat.color}`,
                  backgroundColor: theme === 'dark' ? '#0f172a80' : 'white',
                  backdropFilter: theme === 'dark' ? 'blur(10px)' : 'none'
                }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box>
                        <Typography variant="h4" sx={{ fontWeight: 'bold', color: theme === 'dark' ? '#ccd6f6' : '#333333' }}>
                          {stat.value}
                        </Typography>
                        <Typography variant="caption" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                          {stat.title}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                          <ArrowUpward sx={{ fontSize: 12, color: '#00ff00' }} />
                          <Typography variant="caption" sx={{ color: '#00ff00' }}>{stat.change}</Typography>
                        </Box>
                      </Box>
                      <Avatar sx={{ bgcolor: `${stat.color}20`, color: stat.color }}>
                        {stat.icon}
                      </Avatar>
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            ))}
          </Box>
        </motion.div>
        
        {/* Charts Row */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 3 }}>
          <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 calc(50% - 24px)' } }}>
            <Card sx={{ borderRadius: 3, backgroundColor: theme === 'dark' ? '#0f172a80' : 'white', height: '100%' }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: theme === 'dark' ? '#00ffff' : '#007bff', mb: 2 }}>
                  Properties by Type
                </Typography>
                <Box sx={{ height: 300 }}>
                  <Pie data={propertyTypeData} options={{ maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }} />
                </Box>
              </CardContent>
            </Card>
          </Box>
          
          <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 calc(50% - 24px)' } }}>
            <Card sx={{ borderRadius: 3, backgroundColor: theme === 'dark' ? '#0f172a80' : 'white', height: '100%' }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: theme === 'dark' ? '#00ffff' : '#007bff', mb: 2 }}>
                  Order Status Distribution
                </Typography>
                <Box sx={{ height: 300 }}>
                  <Pie data={orderStatusData} options={{ maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }} />
                </Box>
              </CardContent>
            </Card>
          </Box>
        </Box>
        
        {/* Top Viewed Properties */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 3 }}>
          <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 calc(50% - 24px)' } }}>
            <Card sx={{ borderRadius: 3, backgroundColor: theme === 'dark' ? '#0f172a80' : 'white' }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: theme === 'dark' ? '#00ffff' : '#007bff', mb: 2 }}>
                  Most Viewed Properties
                </Typography>
                <Box sx={{ height: 300 }}>
                  <Bar 
                    data={topViewedData} 
                    options={{ 
                      maintainAspectRatio: false,
                      indexAxis: 'y' as const,
                      plugins: { legend: { display: false } }
                    }} 
                  />
                </Box>
              </CardContent>
            </Card>
          </Box>
          
          <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 calc(50% - 24px)' } }}>
            <Card sx={{ borderRadius: 3, backgroundColor: theme === 'dark' ? '#0f172a80' : 'white' }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: theme === 'dark' ? '#00ffff' : '#007bff', mb: 2 }}>
                  Recent Orders
                </Typography>
                <List sx={{ maxHeight: 300, overflow: 'auto' }}>
                  {orderStats?.recentOrders?.slice(0, 5).map((order) => (
                    <ListItem key={order._id} divider>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: theme === 'dark' ? '#00ffff20' : '#007bff10', color: theme === 'dark' ? '#00ffff' : '#007bff' }}>
                          <ShoppingCart />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={order.customerName}
                        secondary={`${order.orderType} - ${formatPrice(order.totalAmount)}`}
                      />
                      <Chip 
                        label={order.status} 
                        size="small" 
                        color={order.status === 'COMPLETED' ? 'success' : order.status === 'PENDING' ? 'warning' : 'default'}
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Box>
        </Box>
        
        {/* Additional Stats */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
          <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 calc(33.33% - 24px)' } }}>
            <Card sx={{ borderRadius: 3, backgroundColor: theme === 'dark' ? '#0f172a80' : 'white' }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: theme === 'dark' ? '#00ffff' : '#007bff', mb: 2 }}>
                  Price Statistics
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Average Price</Typography>
                    <Typography variant="h5">{formatPrice(houseStats?.priceStats?.avgPrice || 0)}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Min Price</Typography>
                    <Typography variant="h5">{formatPrice(houseStats?.priceStats?.minPrice || 0)}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Max Price</Typography>
                    <Typography variant="h5">{formatPrice(houseStats?.priceStats?.maxPrice || 0)}</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Box>
          
          <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 calc(33.33% - 24px)' } }}>
            <Card sx={{ borderRadius: 3, backgroundColor: theme === 'dark' ? '#0f172a80' : 'white' }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: theme === 'dark' ? '#00ffff' : '#007bff', mb: 2 }}>
                  Quick Stats
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Properties Pending Approval</Typography>
                    <Typography variant="h5">{houseStats?.pendingApproval || 0}</Typography>
                    <LinearProgress variant="determinate" value={((houseStats?.pendingApproval || 0) / (houseStats?.totalHouses || 1)) * 100} sx={{ mt: 1 }} />
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Properties Available</Typography>
                    <Typography variant="h5">{houseStats?.availableHouses || 0}</Typography>
                    <LinearProgress variant="determinate" value={((houseStats?.availableHouses || 0) / (houseStats?.totalHouses || 1)) * 100} sx={{ mt: 1 }} />
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Orders Completed</Typography>
                    <Typography variant="h5">{orderStats?.completedOrders || 0}</Typography>
                    <LinearProgress variant="determinate" value={((orderStats?.completedOrders || 0) / (orderStats?.totalOrders || 1)) * 100} sx={{ mt: 1 }} />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Box>
          
          <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 calc(33.33% - 24px)' } }}>
            <Card sx={{ borderRadius: 3, backgroundColor: theme === 'dark' ? '#0f172a80' : 'white' }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: theme === 'dark' ? '#00ffff' : '#007bff', mb: 2 }}>
                  Order Types
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {orderStats?.ordersByType?.map(type => (
                    <Box key={type._id}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2">{type._id}</Typography>
                        <Typography variant="body2">{type.count}</Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={(type.count / (orderStats?.totalOrders || 1)) * 100} 
                        sx={{ mt: 0.5, height: 6, borderRadius: 3 }}
                      />
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Box>
        </Box>
      </Box>
    </div>
  );
};

export default AdminDashboardPage;