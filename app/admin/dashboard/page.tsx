'use client';

import { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Chip,
  CircularProgress, useMediaQuery, Divider, Avatar,
  List, ListItem, ListItemText, ListItemAvatar, LinearProgress
} from '@mui/material';
import { motion } from 'framer-motion';
import { useTheme } from '@/lib/theme-context';
import { useLanguage } from '@/lib/language-context';
import {
  Home, TrendingUp, AttachMoney, People,
  ShoppingCart, CheckCircle, Cancel, HourglassEmpty,
  Visibility, LocationOn, CalendarToday, ArrowUpward,
  ArrowDownward, Apartment, Villa, Landscape
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
  const { t, isAmharic } = useLanguage();
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
        setError(error.response?.data?.message || (isAmharic ? 'የዳሽቦርድ መረጃ መጫን አልተቻለም' : 'Failed to fetch statistics'));
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();
  }, [isAmharic]);

  const formatPrice = (price: number) => {
    return `ETB ${Number(price || 0).toLocaleString()}`;
  };

  const chartTextColor = theme === 'dark' ? '#cbd5e1' : '#475569';
  const chartGridColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';

  // Chart data
  const propertyTypeData = {
    labels: houseStats?.propertyTypeStats?.map((s: any) => s._id) || [],
    datasets: [{
      label: isAmharic ? 'የቤቶች ብዛት' : 'Number of Properties',
      data: houseStats?.propertyTypeStats?.map((s: any) => s.count) || [],
      backgroundColor: [
        '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#64748b'
      ],
      borderWidth: 1,
      borderColor: theme === 'dark' ? '#1e293b' : '#ffffff'
    }]
  };

  const orderStatusData = {
    labels: isAmharic
      ? ['በመጠባበቅ ላይ', 'በግምገማ ላይ', 'የጸደቁ', 'የተጠናቀቁ', 'ውድቅ የተደረጉ']
      : ['Pending', 'Under Review', 'Approved', 'Completed', 'Rejected'],
    datasets: [{
      data: [
        orderStats?.pendingOrders || 0,
        orderStats?.underReviewOrders || 0,
        orderStats?.approvedOrders || 0,
        orderStats?.completedOrders || 0,
        orderStats?.rejectedOrders || 0
      ],
      backgroundColor: ['#f59e0b', '#06b6d4', '#3b82f6', '#10b981', '#ef4444'],
      borderWidth: 1,
      borderColor: theme === 'dark' ? '#1e293b' : '#ffffff'
    }]
  };

  const topViewedData = {
    labels: houseStats?.topViewedHouses?.map((h: any) => h.title.substring(0, 18)) || [],
    datasets: [{
      label: isAmharic ? 'እይታዎች' : 'Views',
      data: houseStats?.topViewedHouses?.map((h: any) => h.views) || [],
      backgroundColor: '#3b82f6',
      borderRadius: 6
    }]
  };

  const chartOptions = {
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: chartTextColor, font: { family: 'inherit', size: 12 } }
      }
    }
  };

  const barChartOptions = {
    maintainAspectRatio: false,
    indexAxis: 'y' as const,
    plugins: {
      legend: { display: false }
    },
    scales: {
      x: {
        ticks: { color: chartTextColor },
        grid: { color: chartGridColor }
      },
      y: {
        ticks: { color: chartTextColor },
        grid: { display: false }
      }
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress size={48} color="primary" />
      </Box>
    );
  }

  const statCards = [
    { title: t('dashboard.total_properties', 'Total Properties'), value: houseStats?.totalHouses || 0, icon: <Home />, color: '#3b82f6', change: '+12%' },
    { title: t('dashboard.available_properties', 'Available Properties'), value: houseStats?.availableHouses || 0, icon: <CheckCircle />, color: '#10b981', change: '+5%' },
    { title: t('dashboard.sold_rented', 'Sold / Rented'), value: (houseStats?.soldHouses || 0) + (houseStats?.rentedHouses || 0), icon: <TrendingUp />, color: '#f59e0b', change: '+8%' },
    { title: t('dashboard.total_orders', 'Total Orders'), value: orderStats?.totalOrders || 0, icon: <ShoppingCart />, color: '#8b5cf6', change: '+15%' },
    { title: t('dashboard.total_views', 'Total Views'), value: houseStats?.totalViews || 0, icon: <Visibility />, color: '#06b6d4', change: '+23%' },
    { title: t('dashboard.total_revenue', 'Total Revenue'), value: formatPrice(orderStats?.totalRevenue || 0), icon: <AttachMoney />, color: '#10b981', change: '+18%' }
  ];

  return (
    <Box sx={{ width: '100%', py: { xs: 2, sm: 3 } }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary', mb: 0.5, fontSize: { xs: '1.4rem', sm: '1.8rem' } }}>
            {t('dashboard.title', 'Admin Dashboard')}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {t('dashboard.overview', 'Overview of your real estate platform performance')}
          </Typography>
        </Box>
      </motion.div>
      
      {/* Statistics Cards Grid */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 mb-6">
          {statCards.map((stat, index) => (
            <Card
              key={index}
              sx={{
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'divider',
                borderLeft: `4px solid ${stat.color}`,
                bgcolor: 'background.paper',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
              }}
            >
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary', fontSize: { xs: '1.25rem', sm: '1.4rem' } }}>
                      {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, display: 'block', mt: 0.5 }}>
                      {stat.title}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                      <ArrowUpward sx={{ fontSize: 12, color: 'success.main' }} />
                      <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 700 }}>
                        {stat.change}
                      </Typography>
                    </Box>
                  </Box>
                  <Avatar sx={{ bgcolor: `${stat.color}15`, color: stat.color, width: 38, height: 38 }}>
                    {stat.icon}
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.div>
      
      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <Card sx={{ borderRadius: 3, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <CardContent sx={{ p: 2.5 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary', mb: 2 }}>
              {isAmharic ? 'ቤቶች በዓይነት' : 'Properties by Type'}
            </Typography>
            <Box sx={{ height: 280 }}>
              <Pie data={propertyTypeData} options={chartOptions} />
            </Box>
          </CardContent>
        </Card>
        
        <Card sx={{ borderRadius: 3, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <CardContent sx={{ p: 2.5 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary', mb: 2 }}>
              {isAmharic ? 'የትዕዛዞች ሁኔታ ስርጭት' : 'Order Status Distribution'}
            </Typography>
            <Box sx={{ height: 280 }}>
              <Pie data={orderStatusData} options={chartOptions} />
            </Box>
          </CardContent>
        </Card>
      </div>
      
      {/* Top Viewed Properties & Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <Card sx={{ borderRadius: 3, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <CardContent sx={{ p: 2.5 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary', mb: 2 }}>
              {isAmharic ? 'በብዛት የታዩ ቤቶች' : 'Most Viewed Properties'}
            </Typography>
            <Box sx={{ height: 280 }}>
              <Bar data={topViewedData} options={barChartOptions} />
            </Box>
          </CardContent>
        </Card>
        
        <Card sx={{ borderRadius: 3, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <CardContent sx={{ p: 2.5 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary', mb: 2 }}>
              {isAmharic ? 'የቅርብ ጊዜ ትዕዛዞች' : 'Recent Orders'}
            </Typography>
            <List sx={{ maxHeight: 280, overflowY: 'auto', p: 0 }}>
              {orderStats?.recentOrders && orderStats.recentOrders.length > 0 ? (
                orderStats.recentOrders.slice(0, 5).map((order: any) => (
                  <ListItem key={order._id} divider sx={{ px: 1, py: 1.2 }}>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'primary.main', color: 'white', width: 36, height: 36 }}>
                        <ShoppingCart fontSize="small" />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={<Typography variant="body2" sx={{ fontWeight: 600 }}>{order.customerName || 'Customer'}</Typography>}
                      secondary={`${order.orderType || 'Purchase'} - ${formatPrice(order.totalAmount)}`}
                    />
                    <Chip 
                      label={order.status} 
                      size="small" 
                      color={order.status === 'COMPLETED' ? 'success' : order.status === 'PENDING' ? 'warning' : 'default'}
                      sx={{ fontWeight: 600, fontSize: 11 }}
                    />
                  </ListItem>
                ))
              ) : (
                <Typography variant="body2" sx={{ color: 'text.secondary', py: 4, textAlign: 'center' }}>
                  {isAmharic ? 'ምንም የቅርብ ጊዜ ትዕዛዝ የለም' : 'No recent orders found'}
                </Typography>
              )}
            </List>
          </CardContent>
        </Card>
      </div>
      
      {/* Additional Stats 3-Column Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Price Stats */}
        <Card sx={{ borderRadius: 3, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
          <CardContent sx={{ p: 2.5 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary', mb: 2 }}>
              {isAmharic ? 'የዋጋ ስታቲስቲክስ' : 'Price Statistics'}
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {isAmharic ? 'አማካይ ዋጋ' : 'Average Price'}
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>
                  {formatPrice(houseStats?.priceStats?.avgPrice || 0)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {isAmharic ? 'ዝቅተኛ ዋጋ' : 'Min Price'}
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>
                  {formatPrice(houseStats?.priceStats?.minPrice || 0)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {isAmharic ? 'ከፍተኛ ዋጋ' : 'Max Price'}
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>
                  {formatPrice(houseStats?.priceStats?.maxPrice || 0)}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
        
        {/* Quick Progress Stats */}
        <Card sx={{ borderRadius: 3, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
          <CardContent sx={{ p: 2.5 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary', mb: 2 }}>
              {isAmharic ? 'የሥራ እንቅስቃሴ' : 'Platform Activity'}
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {isAmharic ? 'ማረጋገጫ የሚጠብቁ ቤቶች' : 'Pending Approval'}
                  </Typography>
                  <Typography variant="caption" sx={{ fontWeight: 700 }}>
                    {houseStats?.pendingApproval || 0}
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={Math.min(100, (((houseStats?.pendingApproval || 0) / (houseStats?.totalHouses || 1)) * 100))} 
                  sx={{ height: 6, borderRadius: 3 }} 
                />
              </Box>
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {isAmharic ? 'የሚገኙ ንቁ ቤቶች' : 'Available Properties'}
                  </Typography>
                  <Typography variant="caption" sx={{ fontWeight: 700 }}>
                    {houseStats?.availableHouses || 0}
                  </Typography>
                </Box>
                <LinearProgress 
                  color="success"
                  variant="determinate" 
                  value={Math.min(100, (((houseStats?.availableHouses || 0) / (houseStats?.totalHouses || 1)) * 100))} 
                  sx={{ height: 6, borderRadius: 3 }} 
                />
              </Box>
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {isAmharic ? 'የተጠናቀቁ ትዕዛዞች' : 'Orders Completed'}
                  </Typography>
                  <Typography variant="caption" sx={{ fontWeight: 700 }}>
                    {orderStats?.completedOrders || 0}
                  </Typography>
                </Box>
                <LinearProgress 
                  color="info"
                  variant="determinate" 
                  value={Math.min(100, (((orderStats?.completedOrders || 0) / (orderStats?.totalOrders || 1)) * 100))} 
                  sx={{ height: 6, borderRadius: 3 }} 
                />
              </Box>
            </Box>
          </CardContent>
        </Card>
        
        {/* Order Types */}
        <Card sx={{ borderRadius: 3, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
          <CardContent sx={{ p: 2.5 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary', mb: 2 }}>
              {isAmharic ? 'የትዕዛዝ ዓይነቶች' : 'Order Types'}
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {orderStats?.ordersByType && orderStats.ordersByType.length > 0 ? (
                orderStats.ordersByType.map((type: any) => (
                  <Box key={type._id}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{type._id}</Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>{type.count}</Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={Math.min(100, ((type.count / (orderStats?.totalOrders || 1)) * 100))} 
                      sx={{ height: 6, borderRadius: 3 }}
                    />
                  </Box>
                ))
              ) : (
                <Typography variant="body2" sx={{ color: 'text.secondary', py: 2 }}>
                  {isAmharic ? 'ምንም የትዕዛዝ መረጃ የለም' : 'No order breakdown available'}
                </Typography>
              )}
            </Box>
          </CardContent>
        </Card>
      </div>
    </Box>
  );
};

export default AdminDashboardPage;