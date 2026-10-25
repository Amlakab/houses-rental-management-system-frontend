'use client';

import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Button, TextField,
  Select, MenuItem, FormControl, InputLabel, Chip, Dialog,
  DialogTitle, DialogContent, DialogActions, IconButton,
  Paper, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Pagination, Alert, Snackbar, CircularProgress,
  useMediaQuery, Stack
} from '@mui/material';
import { useTheme } from '@/lib/theme-context';
import { useLanguage } from '@/lib/language-context';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Home as HomeIcon,
  AttachMoney as MoneyIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  AccountBalance as BankIcon,
  Receipt as ReceiptIcon,
  Visibility as VisibilityIcon,
  TrendingUp as TrendingUpIcon,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
  CalendarToday as CalendarIcon
} from '@mui/icons-material';
import { PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Document, Page, Text, View, StyleSheet, PDFDownloadLink } from '@react-pdf/renderer';
import { motion } from 'framer-motion';
import api from '@/app/utils/api';

// Types
interface Transaction {
  _id: string;
  userId: {
    _id: string;
    phone: string;
    name?: string;
  };
  houseId?: {
    _id: string;
    title: string;
  };
  orderId?: {
    _id: string;
  };
  class: string;
  type: 'deposit' | 'property_purchase';
  amount: number;
  amountInString?: string;
  status: 'pending' | 'approved' | 'completed' | 'confirmed' | 'failed';
  reference: string;
  description: string;
  transactionId?: string;
  senderPhone?: string;
  senderName?: string;
  receiverPhone?: string;
  receiverName?: string;
  method?: 'telebirr' | 'cbe' | 'cash';
  reason?: string;
  metadata?: any;
  approvedBy?: string;
  completedBy?: string;
  confirmedBy?: string;
  createdAt: string;
  approvedAt?: string;
  completedAt?: string;
  confirmedAt?: string;
  updatedAt: string;
}

interface TransactionFilters {
  search: string;
  type: string;
  status: string;
  method: string;
  startDate: string;
  endDate: string;
  page: number;
  limit: number;
}

interface TransactionStats {
  totalTransactions: number;
  totalDeposits: number;
  totalPropertyPurchases: number;
  pendingDeposits: number;
  pendingPropertyPayments: number;
  completedPayments: number;
  totalRevenue: number;
}

// PDF Styles
const pdfStyles = StyleSheet.create({
  page: { padding: 30, fontFamily: 'Helvetica', fontSize: 10 },
  header: { marginBottom: 20, borderBottomWidth: 1, borderBottomColor: '#000', borderBottomStyle: 'solid', paddingBottom: 10 },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 5, textAlign: 'center' },
  subtitle: { fontSize: 12, marginBottom: 10, textAlign: 'center', color: '#666' },
  section: { marginBottom: 15 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 10, backgroundColor: '#f0f0f0', padding: 5 },
  row: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#eee', borderBottomStyle: 'solid', paddingVertical: 5 },
  cell: { flex: 1, fontSize: 9 },
  cellHeader: { flex: 1, fontSize: 10, fontWeight: 'bold' },
  footer: { marginTop: 20, borderTopWidth: 1, borderTopColor: '#000', borderTopStyle: 'solid', paddingTop: 10, textAlign: 'center', fontSize: 8 }
});

const TransactionReportsPage = () => {
  const { theme } = useTheme();
  const { t, language } = useLanguage();
  const isDark = theme === 'dark';
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openExportModal, setOpenExportModal] = useState(false);
  const [openViewModal, setOpenViewModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [stats, setStats] = useState<TransactionStats | null>(null);
  
  const [filters, setFilters] = useState<TransactionFilters>({
    search: '',
    type: '',
    status: '',
    method: '',
    startDate: '',
    endDate: '',
    page: 1,
    limit: 10
  });

  const [pagination, setPagination] = useState({
    current: 1,
    total: 1,
    count: 0,
    totalRecords: 0
  });

  // Chart data states
  const [typeData, setTypeData] = useState<any[]>([]);
  const [statusData, setStatusData] = useState<any[]>([]);
  const [methodData, setMethodData] = useState<any[]>([]);
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [monthlyStats, setMonthlyStats] = useState({
    totalDeposit: 0,
    totalPropertyPurchase: 0,
    netRevenue: 0
  });
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  const themeStyles = {
    background: isDark ? '#0a192f' : '#f8fafc',
    textColor: isDark ? '#f1f5f9' : '#0f172a',
    mutedColor: isDark ? '#94a3b8' : '#64748b',
    primaryColor: isDark ? '#38bdf8' : '#2563eb',
    cardBg: isDark ? '#112240' : '#ffffff',
    cardBorder: isDark ? '#233554' : '#e2e8f0',
  };

  const COLORS = ['#38bdf8', '#22c55e', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'];

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value.toString());
      });
      
      const res = await api.get(`/transactions?${params}`);
      setTransactions(res.data.data || []);
      setPagination(res.data.pagination);
      generateChartData(res.data.data || []);
    } catch (error: any) {
      console.error('Failed to fetch transactions:', error);
      setError(error.response?.data?.message || 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await api.get('/transactions/stats/overview');
      setStats(res.data.data);
    } catch (error: any) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const generateChartData = (data: Transaction[]) => {
    // Type distribution (Deposit vs Property Purchase)
    const typeCounts = data.reduce((acc: any, tx) => {
      const type = tx.type === 'property_purchase' ? 'Property Purchase' : 'Deposit';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});
    setTypeData(Object.keys(typeCounts).map(type => ({
      name: type,
      value: typeCounts[type],
      count: typeCounts[type]
    })));

    // Status distribution
    const statusCounts = data.reduce((acc: any, tx) => {
      const status = tx.status || 'UNKNOWN';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});
    setStatusData(Object.keys(statusCounts).map(status => ({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      count: statusCounts[status]
    })));

    // Method distribution
    const methodCounts = data.reduce((acc: any, tx) => {
      const method = tx.method || 'UNKNOWN';
      acc[method] = (acc[method] || 0) + 1;
      return acc;
    }, {});
    setMethodData(Object.keys(methodCounts).map(method => ({
      name: method.toUpperCase(),
      value: methodCounts[method],
      count: methodCounts[method]
    })));

    // Weekly data for current month
    generateWeeklyDataForMonth(data, currentMonth);
    calculateMonthlyStats(data, currentMonth);
  };

  const generateWeeklyDataForMonth = (data: Transaction[], month: Date) => {
    const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
    const lastDay = new Date(month.getFullYear(), month.getMonth() + 1, 0);
    
    const weeks: any[] = [];
    let currentWeekStart = new Date(firstDay);
    
    const dayOfWeek = currentWeekStart.getDay();
    const diff = currentWeekStart.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    currentWeekStart = new Date(currentWeekStart.setDate(diff));
    
    while (currentWeekStart <= lastDay) {
      const weekEnd = new Date(currentWeekStart);
      weekEnd.setDate(currentWeekStart.getDate() + 6);
      
      if (weekEnd > lastDay) {
        weekEnd.setTime(lastDay.getTime());
      }
      
      const weekTransactions = data.filter(tx => {
        const txDate = new Date(tx.createdAt);
        return txDate >= currentWeekStart && txDate <= weekEnd;
      });

      const weekDeposits = weekTransactions
        .filter(tx => tx.type === 'deposit')
        .reduce((sum, tx) => sum + tx.amount, 0);
      const weekPurchases = weekTransactions
        .filter(tx => tx.type === 'property_purchase')
        .reduce((sum, tx) => sum + tx.amount, 0);

      weeks.push({
        week: `Week ${weeks.length + 1}`,
        label: `${currentWeekStart.getDate()}/${currentWeekStart.getMonth() + 1}`,
        deposits: weekDeposits,
        purchases: weekPurchases,
        total: weekDeposits + weekPurchases
      });
      
      currentWeekStart.setDate(currentWeekStart.getDate() + 7);
    }
    
    setWeeklyData(weeks);
  };

  const calculateMonthlyStats = (data: Transaction[], month: Date) => {
    const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
    const lastDay = new Date(month.getFullYear(), month.getMonth() + 1, 0);
    
    const monthlyTransactions = data.filter(tx => {
      const txDate = new Date(tx.createdAt);
      return txDate >= firstDay && txDate <= lastDay;
    });

    const monthlyDeposits = monthlyTransactions
      .filter(tx => tx.type === 'deposit')
      .reduce((sum, tx) => sum + tx.amount, 0);
    
    const monthlyPurchases = monthlyTransactions
      .filter(tx => tx.type === 'property_purchase')
      .reduce((sum, tx) => sum + tx.amount, 0);
    
    setMonthlyStats({
      totalDeposit: monthlyDeposits,
      totalPropertyPurchase: monthlyPurchases,
      netRevenue: monthlyPurchases
    });
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + (direction === 'prev' ? -1 : 1));
    setCurrentMonth(newMonth);
    generateWeeklyDataForMonth(transactions, newMonth);
    calculateMonthlyStats(transactions, newMonth);
  };

  const handleFilterChange = (field: keyof TransactionFilters, value: any) => {
    setFilters(prev => ({ ...prev, [field]: value, page: 1 }));
  };

  const resetFilters = () => {
    setFilters({
      search: '',
      type: '',
      status: '',
      method: '',
      startDate: '',
      endDate: '',
      page: 1,
      limit: 10
    });
    fetchTransactions();
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
      return new Date(dateString).toLocaleDateString();
    } catch {
      return 'Invalid date';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return theme === 'dark' ? '#00ff00' : '#28a745';
      case 'approved': return theme === 'dark' ? '#00b3b3' : '#17a2b8';
      case 'pending': return theme === 'dark' ? '#ff9900' : '#ffc107';
      case 'confirmed': return theme === 'dark' ? '#00ffff' : '#20c997';
      case 'failed': return theme === 'dark' ? '#ff0000' : '#dc3545';
      default: return theme === 'dark' ? '#a8b2d1' : '#6c757d';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'deposit': return theme === 'dark' ? '#00ff00' : '#28a745';
      case 'property_purchase': return theme === 'dark' ? '#00ffff' : '#007bff';
      default: return theme === 'dark' ? '#ff9900' : '#ffc107';
    }
  };

  useEffect(() => {
    fetchTransactions();
    fetchStats();
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [filters.page, filters.limit]);

  const textFieldStyle = {
    '& .MuiOutlinedInput-root': {
      backgroundColor: isDark ? '#0a192f' : '#ffffff',
      color: themeStyles.textColor,
      borderRadius: '10px',
      '& fieldset': { borderColor: themeStyles.cardBorder },
      '&:hover fieldset': { borderColor: themeStyles.primaryColor },
      '&.Mui-focused fieldset': { borderColor: themeStyles.primaryColor }
    },
    '& .MuiInputLabel-root': { color: themeStyles.mutedColor }
  };

  const selectStyle = {
    backgroundColor: isDark ? '#0a192f' : '#ffffff',
    color: themeStyles.textColor,
    borderRadius: '10px',
    '& .MuiOutlinedInput-notchedOutline': { borderColor: themeStyles.cardBorder },
    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: themeStyles.primaryColor },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: themeStyles.primaryColor },
    '& .MuiSvgIcon-root': { color: themeStyles.mutedColor }
  };

  const TransactionReportPDF = ({ transactions, filters }: { transactions: Transaction[]; filters: TransactionFilters }) => (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        <View style={pdfStyles.header}>
          <Text style={pdfStyles.title}>PROPERTY TRANSACTION REPORT</Text>
          <Text style={pdfStyles.subtitle}>Real Estate Transaction Management System</Text>
          <Text style={pdfStyles.subtitle}>Generated: {new Date().toLocaleString()}</Text>
        </View>

        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionTitle}>Filter Criteria</Text>
          <View style={pdfStyles.row}><Text style={pdfStyles.cellHeader}>Date Range:</Text><Text style={pdfStyles.cell}>{filters.startDate || 'All'} to {filters.endDate || 'All'}</Text></View>
          <View style={pdfStyles.row}><Text style={pdfStyles.cellHeader}>Type:</Text><Text style={pdfStyles.cell}>{filters.type === 'property_purchase' ? 'Property Purchase' : filters.type || 'All'}</Text></View>
          <View style={pdfStyles.row}><Text style={pdfStyles.cellHeader}>Status:</Text><Text style={pdfStyles.cell}>{filters.status || 'All'}</Text></View>
        </View>

        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionTitle}>Transaction Summary</Text>
          <View style={pdfStyles.row}><Text style={pdfStyles.cellHeader}>Total Transactions:</Text><Text style={pdfStyles.cell}>{transactions.length}</Text></View>
          <View style={pdfStyles.row}><Text style={pdfStyles.cellHeader}>Total Revenue:</Text><Text style={pdfStyles.cell}>{formatPrice(transactions.reduce((sum, tx) => sum + tx.amount, 0))}</Text></View>
        </View>

        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionTitle}>Transaction Details</Text>
          <View style={pdfStyles.row}>
            <Text style={pdfStyles.cellHeader}>Ref</Text>
            <Text style={pdfStyles.cellHeader}>Type</Text>
            <Text style={pdfStyles.cellHeader}>Amount</Text>
            <Text style={pdfStyles.cellHeader}>Status</Text>
            <Text style={pdfStyles.cellHeader}>Date</Text>
          </View>
          {transactions.slice(0, 20).map((tx) => (
            <View key={tx._id} style={pdfStyles.row}>
              <Text style={pdfStyles.cell}>{tx.reference.slice(-8)}</Text>
              <Text style={pdfStyles.cell}>{tx.type === 'property_purchase' ? 'Purchase' : 'Deposit'}</Text>
              <Text style={pdfStyles.cell}>{formatPrice(tx.amount)}</Text>
              <Text style={pdfStyles.cell}>{tx.status}</Text>
              <Text style={pdfStyles.cell}>{formatDate(tx.createdAt)}</Text>
            </View>
          ))}
        </View>

        <View style={pdfStyles.footer}>
          <Text>This is an official report generated by the Real Estate Management System</Text>
          <Text>Report ID: REP-{Date.now()}</Text>
        </View>
      </Page>
    </Document>
  );

  const statCards = [
    { title: t('reports.total_transactions', 'Total Transactions'), value: stats?.totalTransactions || 0, icon: <ReceiptIcon />, color: '#38bdf8' },
    { title: t('reports.total_revenue', 'Total Revenue'), value: formatPrice(stats?.totalRevenue || 0), icon: <MoneyIcon />, color: '#22c55e' },
    { title: t('reports.property_purchases', 'Property Purchases'), value: formatPrice(stats?.totalPropertyPurchases || 0), icon: <HomeIcon />, color: '#f59e0b' },
    { title: t('reports.completed_payments', 'Completed Payments'), value: stats?.completedPayments || 0, icon: <CheckIcon />, color: '#06b6d4' },
  ];

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDark ? 'bg-[#0a192f]' : 'bg-slate-50'}`}>
      <Box sx={{ py: 3, px: { xs: 2, sm: 3, md: 4 } }}>
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' }, flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mb: 4 }}>
            <Box>
              <Typography variant={isMobile ? "h5" : "h4"} sx={{ fontWeight: 'bold', color: themeStyles.textColor, mb: 0.5 }}>
                {t('reports.title', 'Transaction Reports & Analytics')}
              </Typography>
              <Typography variant="body2" sx={{ color: themeStyles.mutedColor }}>
                {t('reports.subtitle', 'Detailed financial reports, payment charts, and transaction history')}
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={() => setOpenExportModal(true)}
              sx={{
                background: 'linear-gradient(135deg, #10b981, #059669)',
                borderRadius: '10px',
                px: 3,
                py: 1,
                fontWeight: 600,
                textTransform: 'none',
                boxShadow: '0 4px 14px rgba(16,185,129,0.3)',
                '&:hover': { background: 'linear-gradient(135deg, #059669, #047857)' }
              }}
            >
              {t('reports.export_pdf', 'Export PDF')}
            </Button>
          </Box>
        </motion.div>

        {/* Stats Cards */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 2.5, mb: 4 }}>
            {statCards.map((stat, index) => (
              <Card
                key={index}
                sx={{
                  borderRadius: 3,
                  backgroundColor: themeStyles.cardBg,
                  border: `1px solid ${themeStyles.cardBorder}`,
                  borderLeft: `4px solid ${stat.color}`,
                  boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.05)',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  '&:hover': { transform: 'translateY(-2px)' }
                }}
              >
                <CardContent sx={{ p: 2.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="caption" sx={{ color: themeStyles.mutedColor, fontWeight: 500 }}>
                        {stat.title}
                      </Typography>
                      <Typography variant="h5" sx={{ fontWeight: 'bold', color: themeStyles.textColor, mt: 0.5 }}>
                        {stat.value}
                      </Typography>
                    </Box>
                    <Box sx={{ p: 1.5, borderRadius: '12px', bgcolor: `${stat.color}15`, color: stat.color, display: 'flex' }}>
                      {stat.icon}
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        </motion.div>

        {/* Filters */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
          <Card
            sx={{
              mb: 4,
              borderRadius: 3,
              backgroundColor: themeStyles.cardBg,
              border: `1px solid ${themeStyles.cardBorder}`,
              boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.05)'
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, mb: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label={t('action.search', 'Search')}
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    placeholder={t('reports.search_placeholder', 'Reference, phone, property...')}
                    InputProps={{
                      startAdornment: <SearchIcon sx={{ mr: 1, color: themeStyles.mutedColor }} />
                    }}
                    sx={textFieldStyle}
                  />
                </Box>
                <Box sx={{ display: 'flex', gap: 1.5, width: { xs: '100%', md: 'auto' } }}>
                  <Button
                    variant="outlined"
                    startIcon={<RefreshIcon />}
                    onClick={resetFilters}
                    sx={{
                      flex: { xs: 1, md: 'none' },
                      borderRadius: '10px',
                      textTransform: 'none',
                      borderColor: themeStyles.cardBorder,
                      color: themeStyles.textColor,
                      '&:hover': { borderColor: themeStyles.primaryColor }
                    }}
                  >
                    {t('action.reset', 'Reset')}
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<FilterIcon />}
                    onClick={fetchTransactions}
                    sx={{
                      flex: { xs: 1, md: 'none' },
                      borderRadius: '10px',
                      textTransform: 'none',
                      bgcolor: themeStyles.primaryColor,
                      '&:hover': { bgcolor: isDark ? '#0284c7' : '#1d4ed8' }
                    }}
                  >
                    {t('action.filter', 'Filter')}
                  </Button>
                </Box>
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(5, 1fr)' }, gap: 2 }}>
                <FormControl fullWidth size="small" sx={selectStyle}>
                  <InputLabel sx={{ color: themeStyles.mutedColor }}>{t('common.type', 'Type')}</InputLabel>
                  <Select value={filters.type} label={t('common.type', 'Type')} onChange={(e) => handleFilterChange('type', e.target.value)}>
                    <MenuItem value="">{t('common.all', 'All')}</MenuItem>
                    <MenuItem value="deposit">{t('reports.deposit', 'Deposit')}</MenuItem>
                    <MenuItem value="property_purchase">{t('reports.property_purchase', 'Property Purchase')}</MenuItem>
                  </Select>
                </FormControl>

                <FormControl fullWidth size="small" sx={selectStyle}>
                  <InputLabel sx={{ color: themeStyles.mutedColor }}>{t('common.status', 'Status')}</InputLabel>
                  <Select value={filters.status} label={t('common.status', 'Status')} onChange={(e) => handleFilterChange('status', e.target.value)}>
                    <MenuItem value="">{t('common.all', 'All')}</MenuItem>
                    <MenuItem value="pending">{t('status.pending', 'Pending')}</MenuItem>
                    <MenuItem value="approved">{t('status.approved', 'Approved')}</MenuItem>
                    <MenuItem value="completed">{t('status.completed', 'Completed')}</MenuItem>
                    <MenuItem value="failed">{t('status.rejected', 'Failed')}</MenuItem>
                  </Select>
                </FormControl>

                <FormControl fullWidth size="small" sx={selectStyle}>
                  <InputLabel sx={{ color: themeStyles.mutedColor }}>{t('reports.method', 'Method')}</InputLabel>
                  <Select value={filters.method} label={t('reports.method', 'Method')} onChange={(e) => handleFilterChange('method', e.target.value)}>
                    <MenuItem value="">{t('common.all', 'All')}</MenuItem>
                    <MenuItem value="cash">Cash</MenuItem>
                    <MenuItem value="telebirr">Telebirr</MenuItem>
                    <MenuItem value="cbe">CBE</MenuItem>
                  </Select>
                </FormControl>

                <TextField
                  fullWidth
                  size="small"
                  label={t('common.start_date', 'Start Date')}
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  sx={textFieldStyle}
                />

                <TextField
                  fullWidth
                  size="small"
                  label={t('common.end_date', 'End Date')}
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  sx={textFieldStyle}
                />
              </Box>
            </CardContent>
          </Card>
        </motion.div>

        {/* Transactions Table */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}>
          <Card
            sx={{
              borderRadius: 3,
              backgroundColor: themeStyles.cardBg,
              border: `1px solid ${themeStyles.cardBorder}`,
              overflow: 'hidden',
              boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.05)'
            }}
          >
            <CardContent sx={{ p: 0 }}>
              <Box sx={{ overflowX: 'auto', width: '100%' }}>
                <Box component="table" sx={{ width: '100%', minWidth: 700, borderCollapse: 'collapse' }}>
                  <Box component="thead" sx={{ background: isDark ? '#1e293b' : '#f1f5f9', borderBottom: `1px solid ${themeStyles.cardBorder}` }}>
                    <Box component="tr" sx={{ display: 'table-row' }}>
                      {[
                        t('reports.reference', 'Ref'),
                        t('reports.user', 'User'),
                        t('common.type', 'Type'),
                        t('reports.amount', 'Amount'),
                        t('common.status', 'Status'),
                        t('reports.method', 'Method'),
                        t('common.date', 'Date'),
                        t('common.actions', 'Actions')
                      ].map(header => (
                        <Box key={header} component="th" sx={{ p: 2, textAlign: 'left', color: themeStyles.textColor, fontWeight: 600, fontSize: '0.85rem' }}>
                          {header}
                        </Box>
                      ))}
                    </Box>
                  </Box>
                  <Box component="tbody">
                    {loading ? (
                      <Box component="tr" sx={{ display: 'table-row' }}>
                        <Box component="td" colSpan={8} sx={{ p: 4, textAlign: 'center' }}>
                          <CircularProgress size={36} sx={{ color: themeStyles.primaryColor }} />
                        </Box>
                      </Box>
                    ) : transactions.length === 0 ? (
                      <Box component="tr" sx={{ display: 'table-row' }}>
                        <Box component="td" colSpan={8} sx={{ p: 4, textAlign: 'center' }}>
                          <Typography sx={{ color: themeStyles.mutedColor }}>
                            {t('reports.no_transactions', 'No transactions found')}
                          </Typography>
                        </Box>
                      </Box>
                    ) : (
                      transactions.map((tx) => (
                        <Box
                          key={tx._id}
                          component="tr"
                          sx={{
                            display: 'table-row',
                            borderBottom: `1px solid ${themeStyles.cardBorder}`,
                            transition: 'background-color 0.15s ease',
                            '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }
                          }}
                        >
                          <Box component="td" sx={{ p: 2 }}>
                            <Typography variant="body2" sx={{ fontFamily: 'monospace', color: themeStyles.textColor, fontWeight: 600 }}>
                              {tx.reference.slice(-8)}
                            </Typography>
                          </Box>
                          <Box component="td" sx={{ p: 2 }}>
                            <Typography variant="body2" sx={{ color: themeStyles.textColor, fontWeight: 500 }}>
                              {tx.userId?.name || 'Unknown'}
                            </Typography>
                            <Typography variant="caption" sx={{ color: themeStyles.mutedColor }}>
                              {tx.userId?.phone}
                            </Typography>
                          </Box>
                          <Box component="td" sx={{ p: 2 }}>
                            <Chip
                              label={tx.type === 'property_purchase' ? t('reports.property_purchase', 'Property Purchase') : t('reports.deposit', 'Deposit')}
                              size="small"
                              sx={{
                                backgroundColor: tx.type === 'property_purchase' ? 'rgba(56,189,248,0.15)' : 'rgba(34,197,94,0.15)',
                                color: tx.type === 'property_purchase' ? (isDark ? '#38bdf8' : '#0284c7') : (isDark ? '#4ade80' : '#16a34a'),
                                fontWeight: 600,
                                fontSize: '0.75rem'
                              }}
                            />
                          </Box>
                          <Box component="td" sx={{ p: 2 }}>
                            <Typography variant="body2" sx={{ fontWeight: 'bold', color: themeStyles.textColor }}>
                              {formatPrice(tx.amount)}
                            </Typography>
                          </Box>
                          <Box component="td" sx={{ p: 2 }}>
                            <Chip
                              label={tx.status}
                              size="small"
                              sx={{
                                backgroundColor: `${getStatusColor(tx.status)}20`,
                                color: getStatusColor(tx.status),
                                fontWeight: 600,
                                textTransform: 'capitalize'
                              }}
                            />
                          </Box>
                          <Box component="td" sx={{ p: 2 }}>
                            <Chip
                              label={tx.method?.toUpperCase() || 'N/A'}
                              size="small"
                              sx={{
                                bgcolor: isDark ? '#1e293b' : '#e2e8f0',
                                color: themeStyles.textColor,
                                fontWeight: 500
                              }}
                            />
                          </Box>
                          <Box component="td" sx={{ p: 2 }}>
                            <Typography variant="body2" sx={{ color: themeStyles.mutedColor }}>
                              {formatDate(tx.createdAt)}
                            </Typography>
                          </Box>
                          <Box component="td" sx={{ p: 2 }}>
                            <IconButton
                              size="small"
                              onClick={() => { setSelectedTransaction(tx); setOpenViewModal(true); }}
                              sx={{
                                color: themeStyles.primaryColor,
                                bgcolor: `${themeStyles.primaryColor}15`,
                                '&:hover': { bgcolor: `${themeStyles.primaryColor}30` }
                              }}
                            >
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </Box>
                      ))
                    )}
                  </Box>
                </Box>
              </Box>
              {pagination.total > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3, borderTop: `1px solid ${themeStyles.cardBorder}` }}>
                  <Pagination
                    count={pagination.total}
                    page={filters.page}
                    onChange={(e, page) => handleFilterChange('page', page)}
                    color="primary"
                    sx={{
                      '& .MuiPaginationItem-root': {
                        color: themeStyles.textColor
                      }
                    }}
                  />
                </Box>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Charts Section */}
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 3, mt: 4 }}>
          <Card
            sx={{
              flex: 1,
              borderRadius: 3,
              backgroundColor: themeStyles.cardBg,
              border: `1px solid ${themeStyles.cardBorder}`,
              boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.05)'
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Typography
                variant="h6"
                sx={{
                  mb: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  fontWeight: 600,
                  color: themeStyles.textColor
                }}
              >
                <PieChartIcon sx={{ color: themeStyles.primaryColor }} />
                {t('reports.type_distribution', 'Transaction Type Distribution')}
              </Typography>

              <Box sx={{ height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={typeData}
                      cx="50%"
                      cy="50%"
                      outerRadius={85}
                      dataKey="value"
                      label={({ name, percent = 0 }) =>
                        `${name}: ${(percent * 100).toFixed(0)}%`
                      }
                    >
                      <Cell fill={COLORS[0]} />
                      <Cell fill={COLORS[1]} />
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: themeStyles.cardBg,
                        borderColor: themeStyles.cardBorder,
                        color: themeStyles.textColor,
                        borderRadius: '8px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>

          <Card
            sx={{
              flex: 1,
              borderRadius: 3,
              backgroundColor: themeStyles.cardBg,
              border: `1px solid ${themeStyles.cardBorder}`,
              boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.05)'
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Typography
                variant="h6"
                sx={{
                  mb: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  fontWeight: 600,
                  color: themeStyles.textColor
                }}
              >
                <BarChartIcon sx={{ color: themeStyles.primaryColor }} />
                {t('reports.status_distribution', 'Payment Status Distribution')}
              </Typography>
              <Box sx={{ height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statusData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={themeStyles.cardBorder} />
                    <XAxis dataKey="name" stroke={themeStyles.mutedColor} tick={{ fill: themeStyles.mutedColor, fontSize: 12 }} />
                    <YAxis stroke={themeStyles.mutedColor} tick={{ fill: themeStyles.mutedColor, fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: themeStyles.cardBg,
                        borderColor: themeStyles.cardBorder,
                        color: themeStyles.textColor,
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey="count" fill={themeStyles.primaryColor} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* Weekly Chart */}
        <Card
          sx={{
            mt: 4,
            borderRadius: 3,
            backgroundColor: themeStyles.cardBg,
            border: `1px solid ${themeStyles.cardBorder}`,
            boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.05)'
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 600, color: themeStyles.textColor }}>
                <TrendingUpIcon sx={{ color: themeStyles.primaryColor }} />
                {t('reports.weekly_trend', 'Weekly Transaction Trend')} - {currentMonth.toLocaleDateString(language === 'am' ? 'am-ET' : 'en-US', { month: 'long', year: 'numeric' })}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => navigateMonth('prev')}
                  sx={{
                    borderRadius: '8px',
                    borderColor: themeStyles.cardBorder,
                    color: themeStyles.textColor,
                    textTransform: 'none'
                  }}
                >
                  {t('reports.prev', 'Previous')}
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => navigateMonth('next')}
                  sx={{
                    borderRadius: '8px',
                    borderColor: themeStyles.cardBorder,
                    color: themeStyles.textColor,
                    textTransform: 'none'
                  }}
                >
                  {t('reports.next', 'Next')}
                </Button>
              </Box>
            </Box>
            <Box sx={{ height: 350, width: '100%', overflowX: 'auto' }}>
              <Box sx={{ minWidth: 500, height: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={themeStyles.cardBorder} />
                    <XAxis dataKey="label" stroke={themeStyles.mutedColor} tick={{ fill: themeStyles.mutedColor }} />
                    <YAxis stroke={themeStyles.mutedColor} tickFormatter={(v) => formatPrice(v)} tick={{ fill: themeStyles.mutedColor }} />
                    <Tooltip
                      formatter={(v) => formatPrice(Number(v))}
                      contentStyle={{
                        backgroundColor: themeStyles.cardBg,
                        borderColor: themeStyles.cardBorder,
                        color: themeStyles.textColor,
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="deposits" stroke="#22c55e" name={t('reports.deposit', 'Deposits')} strokeWidth={2.5} />
                    <Line type="monotone" dataKey="purchases" stroke="#f59e0b" name={t('reports.property_purchases', 'Property Purchases')} strokeWidth={2.5} />
                    <Line type="monotone" dataKey="total" stroke="#38bdf8" name={t('reports.total_revenue', 'Total Revenue')} strokeWidth={2.5} />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Monthly Stats */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2.5, mt: 4 }}>
          <Card sx={{ borderRadius: 3, background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', p: 1 }}>
            <CardContent>
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>{formatPrice(monthlyStats.totalDeposit)}</Typography>
              <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>{t('reports.total_deposits', 'Total Deposits')}</Typography>
            </CardContent>
          </Card>
          <Card sx={{ borderRadius: 3, background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: 'white', p: 1 }}>
            <CardContent>
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>{formatPrice(monthlyStats.totalPropertyPurchase)}</Typography>
              <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>{t('reports.property_purchases', 'Property Purchases')}</Typography>
            </CardContent>
          </Card>
          <Card sx={{ borderRadius: 3, background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: 'white', p: 1 }}>
            <CardContent>
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>{formatPrice(monthlyStats.netRevenue)}</Typography>
              <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>{t('reports.total_revenue', 'Total Revenue')}</Typography>
            </CardContent>
          </Card>
        </Box>

        {/* Export Modal */}
        <Dialog
          open={openExportModal}
          onClose={() => setOpenExportModal(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 3,
              backgroundColor: themeStyles.cardBg,
              border: `1px solid ${themeStyles.cardBorder}`,
              color: themeStyles.textColor,
              p: 1
            }
          }}
        >
          <DialogTitle sx={{ fontWeight: 'bold', color: themeStyles.textColor }}>
            {t('reports.export_title', 'Export Transaction Report')}
          </DialogTitle>
          <DialogContent>
            <Typography variant="body2" sx={{ color: themeStyles.mutedColor, mb: 2 }}>
              {t('reports.total_transactions', 'Total transactions to export')}: <strong>{transactions.length}</strong>
            </Typography>
            <Alert
              severity="info"
              sx={{
                mb: 2,
                borderRadius: 2,
                bgcolor: isDark ? 'rgba(56,189,248,0.1)' : undefined,
                color: isDark ? '#f1f5f9' : undefined
              }}
            >
              {t('reports.export_desc', 'The report will include all property purchase and deposit transactions based on current filters.')}
            </Alert>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button
              onClick={() => setOpenExportModal(false)}
              sx={{ color: themeStyles.mutedColor, textTransform: 'none' }}
            >
              {t('action.cancel', 'Cancel')}
            </Button>
            <PDFDownloadLink
              document={<TransactionReportPDF transactions={transactions} filters={filters} />}
              fileName={`transaction_report_${new Date().toISOString().slice(0, 10)}.pdf`}
            >
              {({ loading }) => (
                <Button
                  variant="contained"
                  disabled={loading}
                  sx={{
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    borderRadius: '8px',
                    textTransform: 'none',
                    fontWeight: 600
                  }}
                >
                  {loading ? t('reports.preparing', 'Preparing...') : t('reports.download_pdf', 'Download PDF')}
                </Button>
              )}
            </PDFDownloadLink>
          </DialogActions>
        </Dialog>

        {/* View Transaction Modal */}
        <Dialog
          open={openViewModal}
          onClose={() => setOpenViewModal(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 3,
              backgroundColor: themeStyles.cardBg,
              border: `1px solid ${themeStyles.cardBorder}`,
              color: themeStyles.textColor,
              p: 1
            }
          }}
        >
          {selectedTransaction && (
            <>
              <DialogTitle sx={{ fontWeight: 'bold', color: themeStyles.textColor }}>
                {t('reports.tx_details', 'Transaction Details')}
              </DialogTitle>
              <DialogContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                  <Paper sx={{ p: 2, bgcolor: isDark ? '#0a192f' : '#f8fafc', border: `1px solid ${themeStyles.cardBorder}`, borderRadius: 2 }}>
                    <Typography variant="caption" sx={{ color: themeStyles.mutedColor, display: 'block' }}>
                      {t('reports.reference', 'Reference')}
                    </Typography>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', color: themeStyles.textColor, fontWeight: 600 }}>
                      {selectedTransaction.reference}
                    </Typography>
                  </Paper>
                  <Paper sx={{ p: 2, bgcolor: isDark ? '#0a192f' : '#f8fafc', border: `1px solid ${themeStyles.cardBorder}`, borderRadius: 2 }}>
                    <Typography variant="caption" sx={{ color: themeStyles.mutedColor, display: 'block' }}>
                      {t('reports.amount', 'Amount')}
                    </Typography>
                    <Typography variant="h6" sx={{ color: getTypeColor(selectedTransaction.type), fontWeight: 'bold' }}>
                      {formatPrice(selectedTransaction.amount)}
                    </Typography>
                  </Paper>
                  <Paper sx={{ p: 2, bgcolor: isDark ? '#0a192f' : '#f8fafc', border: `1px solid ${themeStyles.cardBorder}`, borderRadius: 2 }}>
                    <Typography variant="caption" sx={{ color: themeStyles.mutedColor, display: 'block' }}>
                      {t('common.type', 'Type')} & {t('common.status', 'Status')}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                      <Chip
                        label={selectedTransaction.type === 'property_purchase' ? t('reports.property_purchase', 'Property Purchase') : t('reports.deposit', 'Deposit')}
                        size="small"
                        sx={{ bgcolor: isDark ? '#1e293b' : '#e2e8f0', color: themeStyles.textColor, fontWeight: 600 }}
                      />
                      <Chip
                        label={selectedTransaction.status}
                        size="small"
                        color={selectedTransaction.status === 'completed' ? 'success' : 'warning'}
                      />
                    </Box>
                  </Paper>
                  <Paper sx={{ p: 2, bgcolor: isDark ? '#0a192f' : '#f8fafc', border: `1px solid ${themeStyles.cardBorder}`, borderRadius: 2 }}>
                    <Typography variant="caption" sx={{ color: themeStyles.mutedColor, display: 'block' }}>
                      {t('reports.user', 'User')}
                    </Typography>
                    <Typography variant="body2" sx={{ color: themeStyles.textColor, fontWeight: 600 }}>
                      {selectedTransaction.userId?.name || 'Unknown'}
                    </Typography>
                    <Typography variant="caption" sx={{ color: themeStyles.mutedColor }}>
                      {selectedTransaction.userId?.phone}
                    </Typography>
                  </Paper>
                  {selectedTransaction.houseId && (
                    <Paper sx={{ p: 2, bgcolor: isDark ? '#0a192f' : '#f8fafc', border: `1px solid ${themeStyles.cardBorder}`, borderRadius: 2 }}>
                      <Typography variant="caption" sx={{ color: themeStyles.mutedColor, display: 'block' }}>
                        {t('reports.property', 'Property')}
                      </Typography>
                      <Typography variant="body2" sx={{ color: themeStyles.textColor, fontWeight: 600 }}>
                        {selectedTransaction.houseId.title}
                      </Typography>
                    </Paper>
                  )}
                  <Paper sx={{ p: 2, bgcolor: isDark ? '#0a192f' : '#f8fafc', border: `1px solid ${themeStyles.cardBorder}`, borderRadius: 2 }}>
                    <Typography variant="caption" sx={{ color: themeStyles.mutedColor, display: 'block' }}>
                      {t('common.date', 'Date')}
                    </Typography>
                    <Typography variant="body2" sx={{ color: themeStyles.textColor }}>
                      {new Date(selectedTransaction.createdAt).toLocaleString(language === 'am' ? 'am-ET' : 'en-US')}
                    </Typography>
                  </Paper>
                  {selectedTransaction.description && (
                    <Paper sx={{ p: 2, bgcolor: isDark ? '#0a192f' : '#f8fafc', border: `1px solid ${themeStyles.cardBorder}`, borderRadius: 2 }}>
                      <Typography variant="caption" sx={{ color: themeStyles.mutedColor, display: 'block' }}>
                        {t('common.description', 'Description')}
                      </Typography>
                      <Typography variant="body2" sx={{ color: themeStyles.textColor }}>
                        {selectedTransaction.description}
                      </Typography>
                    </Paper>
                  )}
                </Box>
              </DialogContent>
              <DialogActions sx={{ p: 2 }}>
                <Button
                  onClick={() => setOpenViewModal(false)}
                  variant="outlined"
                  sx={{
                    borderRadius: '8px',
                    textTransform: 'none',
                    borderColor: themeStyles.cardBorder,
                    color: themeStyles.textColor
                  }}
                >
                  {t('action.close', 'Close')}
                </Button>
              </DialogActions>
            </>
          )}
        </Dialog>

        <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError('')}><Alert severity="error" onClose={() => setError('')}>{error}</Alert></Snackbar>
        <Snackbar open={!!success} autoHideDuration={6000} onClose={() => setSuccess('')}><Alert severity="success" onClose={() => setSuccess('')}>{success}</Alert></Snackbar>
      </Box>
    </div>
  );
};

export default TransactionReportsPage;