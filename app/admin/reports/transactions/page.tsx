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
    background: theme === 'dark' ? 'linear-gradient(135deg, #0a192f, #112240)' : 'linear-gradient(135deg, #f0f0f0, #ffffff)',
    textColor: theme === 'dark' ? '#ccd6f6' : '#333333',
    primaryColor: theme === 'dark' ? '#00ffff' : '#007bff',
    cardBg: theme === 'dark' ? '#0f172a80' : '#ffffff',
    cardBorder: theme === 'dark' ? '#334155' : '#e5e7eb',
  };

  const COLORS = ['#3c8dbc', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

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
      backgroundColor: theme === 'dark' ? '#1e293b' : 'white',
      color: theme === 'dark' ? '#ccd6f6' : '#333333',
      '& fieldset': { borderColor: theme === 'dark' ? '#334155' : '#e5e7eb' },
      '&:hover fieldset': { borderColor: theme === 'dark' ? '#00ffff' : '#007bff' },
      '&.Mui-focused fieldset': { borderColor: theme === 'dark' ? '#00ffff' : '#007bff' }
    },
    '& .MuiInputLabel-root': { color: theme === 'dark' ? '#a8b2d1' : '#666666' }
  };

  const selectStyle = {
    backgroundColor: theme === 'dark' ? '#1e293b' : 'white',
    color: theme === 'dark' ? '#ccd6f6' : '#333333',
    '& .MuiOutlinedInput-notchedOutline': { borderColor: theme === 'dark' ? '#334155' : '#e5e7eb' },
    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: theme === 'dark' ? '#00ffff' : '#007bff' },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: theme === 'dark' ? '#00ffff' : '#007bff' }
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
    { title: 'Total Transactions', value: stats?.totalTransactions || 0, icon: <ReceiptIcon />, color: '#00ffff' },
    { title: 'Total Revenue', value: formatPrice(stats?.totalRevenue || 0), icon: <MoneyIcon />, color: '#00ff00' },
    { title: 'Property Purchases', value: formatPrice(stats?.totalPropertyPurchases || 0), icon: <HomeIcon />, color: '#ff9900' },
    { title: 'Completed Payments', value: stats?.completedPayments || 0, icon: <CheckIcon />, color: '#00ffff' },
  ];

  return (
    <div className={`min-h-screen transition-colors duration-300 ${theme === 'dark' ? 'bg-[#0a192f]' : 'bg-gray-50'}`}>
      <Box sx={{ py: 3, px: { xs: 2, sm: 3, md: 4 } }}>
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mb: 4 }}>
            <Box>
              <Typography variant={isMobile ? "h5" : "h4"} sx={{ fontWeight: 'bold', color: themeStyles.textColor, mb: 1 }}>
                Transaction Reports
              </Typography>
              <Typography variant="body2" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                Track property purchases and deposit transactions
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={() => setOpenExportModal(true)}
              sx={{ background: 'linear-gradient(135deg, #28a745, #218838)', borderRadius: 2, px: 3, py: 1 }}
            >
              Export PDF
            </Button>
          </Box>
        </motion.div>

        {/* Stats Cards */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 4 }}>
            {statCards.map((stat, index) => (
              <Box key={index} sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 16px)', md: '1 1 calc(25% - 16px)' }, minWidth: '180px' }}>
                <Card sx={{ borderRadius: 3, borderLeft: `4px solid ${stat.color}`, backgroundColor: themeStyles.cardBg }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box><Typography variant="h5" sx={{ fontWeight: 'bold', color: themeStyles.textColor }}>{stat.value}</Typography><Typography variant="caption" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>{stat.title}</Typography></Box>
                      <Box sx={{ color: stat.color }}>{stat.icon}</Box>
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            ))}
          </Box>
        </motion.div>

        {/* Filters */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
          <Card sx={{ mb: 4, borderRadius: 3, backgroundColor: themeStyles.cardBg }}>
            <CardContent>
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, mb: 2 }}>
                <Box sx={{ flex: 1 }}><TextField fullWidth size="small" label="Search" value={filters.search} onChange={(e) => handleFilterChange('search', e.target.value)} placeholder="Reference, phone, property..." InputProps={{ startAdornment: <SearchIcon sx={{ mr: 1 }} /> }} sx={textFieldStyle} /></Box>
                <Box sx={{ display: 'flex', gap: 2 }}><Button variant="outlined" startIcon={<RefreshIcon />} onClick={resetFilters}>Reset</Button><Button variant="contained" startIcon={<FilterIcon />} onClick={fetchTransactions}>Filter</Button></Box>
              </Box>

              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(25% - 16px)' }, minWidth: '150px' }}>
                  <FormControl fullWidth size="small" sx={selectStyle}>
                    <InputLabel>Type</InputLabel>
                    <Select value={filters.type} label="Type" onChange={(e) => handleFilterChange('type', e.target.value)}>
                      <MenuItem value="">All</MenuItem>
                      <MenuItem value="deposit">Deposit</MenuItem>
                      <MenuItem value="property_purchase">Property Purchase</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
                <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(25% - 16px)' }, minWidth: '150px' }}>
                  <FormControl fullWidth size="small" sx={selectStyle}>
                    <InputLabel>Status</InputLabel>
                    <Select value={filters.status} label="Status" onChange={(e) => handleFilterChange('status', e.target.value)}>
                      <MenuItem value="">All</MenuItem>
                      <MenuItem value="pending">Pending</MenuItem>
                      <MenuItem value="approved">Approved</MenuItem>
                      <MenuItem value="completed">Completed</MenuItem>
                      <MenuItem value="failed">Failed</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
                <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(25% - 16px)' }, minWidth: '150px' }}>
                  <FormControl fullWidth size="small" sx={selectStyle}>
                    <InputLabel>Method</InputLabel>
                    <Select value={filters.method} label="Method" onChange={(e) => handleFilterChange('method', e.target.value)}>
                      <MenuItem value="">All</MenuItem>
                      <MenuItem value="cash">Cash</MenuItem>
                      <MenuItem value="telebirr">Telebirr</MenuItem>
                      <MenuItem value="cbe">CBE</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
                <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(25% - 16px)' }, minWidth: '150px' }}>
                  <TextField fullWidth size="small" label="Start Date" type="date" value={filters.startDate} onChange={(e) => handleFilterChange('startDate', e.target.value)} InputLabelProps={{ shrink: true }} sx={textFieldStyle} />
                </Box>
                <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(25% - 16px)' }, minWidth: '150px' }}>
                  <TextField fullWidth size="small" label="End Date" type="date" value={filters.endDate} onChange={(e) => handleFilterChange('endDate', e.target.value)} InputLabelProps={{ shrink: true }} sx={textFieldStyle} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </motion.div>

        {/* Transactions Table */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}>
          <Card sx={{ borderRadius: 3, backgroundColor: themeStyles.cardBg, overflow: 'hidden' }}>
            <CardContent sx={{ p: 0 }}>
              <Box sx={{ overflowX: 'auto' }}>
                <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse' }}>
                  <Box component="thead" sx={{ background: theme === 'dark' ? 'linear-gradient(135deg, #00ffff, #00b3b3)' : 'linear-gradient(135deg, #007bff, #0056b3)' }}>
                    <Box component="tr" sx={{ display: 'table-row' }}>
                      {['Ref', 'User', 'Type', 'Amount', 'Status', 'Method', 'Date', 'Actions'].map(header => (<Box key={header} component="th" sx={{ p: 2, textAlign: 'left', color: 'white', fontWeight: 'bold', fontSize: '0.875rem' }}>{header}</Box>))}
                    </Box>
                  </Box>
                  <Box component="tbody">
                    {loading ? (
                      <Box component="tr" sx={{ display: 'table-row' }}><Box component="td" colSpan={8} sx={{ p: 4, textAlign: 'center' }}><CircularProgress size={40} sx={{ color: themeStyles.primaryColor }} /></Box></Box>
                    ) : transactions.length === 0 ? (
                      <Box component="tr" sx={{ display: 'table-row' }}><Box component="td" colSpan={8} sx={{ p: 4, textAlign: 'center' }}><Typography color={theme === 'dark' ? '#a8b2d1' : '#666666'}>No transactions found</Typography></Box></Box>
                    ) : (
                      transactions.map((tx) => (
                        <Box key={tx._id} component="tr" sx={{ display: 'table-row', borderBottom: 1, borderColor: 'divider', '&:hover': { bgcolor: theme === 'dark' ? '#1e293b' : '#f8fafc' } }}>
                          <Box component="td" sx={{ p: 2 }}><Typography variant="body2" sx={{ fontFamily: 'monospace' }}>{tx.reference.slice(-8)}</Typography></Box>
                          <Box component="td" sx={{ p: 2 }}><Typography variant="body2">{tx.userId?.name || 'Unknown'}</Typography><Typography variant="caption" color="text.secondary">{tx.userId?.phone}</Typography></Box>
                          <Box component="td" sx={{ p: 2 }}><Chip label={tx.type === 'property_purchase' ? 'Property Purchase' : 'Deposit'} size="small" sx={{ backgroundColor: `${getTypeColor(tx.type)}20`, color: getTypeColor(tx.type) }} /></Box>
                          <Box component="td" sx={{ p: 2 }}><Typography variant="body2" sx={{ fontWeight: 'bold', color: getTypeColor(tx.type) }}>{formatPrice(tx.amount)}</Typography></Box>
                          <Box component="td" sx={{ p: 2 }}><Chip label={tx.status} size="small" sx={{ backgroundColor: `${getStatusColor(tx.status)}20`, color: getStatusColor(tx.status) }} /></Box>
                          <Box component="td" sx={{ p: 2 }}><Chip label={tx.method?.toUpperCase() || 'N/A'} size="small" /></Box>
                          <Box component="td" sx={{ p: 2 }}><Typography variant="body2">{formatDate(tx.createdAt)}</Typography></Box>
                          <Box component="td" sx={{ p: 2 }}><IconButton size="small" onClick={() => { setSelectedTransaction(tx); setOpenViewModal(true); }} sx={{ color: themeStyles.primaryColor }}><VisibilityIcon fontSize="small" /></IconButton></Box>
                        </Box>
                      ))
                    )}
                  </Box>
                </Box>
              </Box>
              {pagination.total > 1 && (<Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}><Pagination count={pagination.total} page={filters.page} onChange={(e, page) => handleFilterChange('page', page)} color="primary" /></Box>)}
            </CardContent>
          </Card>
        </motion.div>

        {/* Charts Section */}
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 3, mt: 3 }}>
          <Card sx={{ flex: 1, borderRadius: 3, backgroundColor: themeStyles.cardBg }}>
            <CardContent><Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}><PieChartIcon /> Transaction Type Distribution</Typography>
              <Box sx={{ height: 300 }}><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={typeData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}><Cell fill={COLORS[0]} /><Cell fill={COLORS[1]} /></Pie><Tooltip /></PieChart></ResponsiveContainer></Box>
            </CardContent>
          </Card>
          <Card sx={{ flex: 1, borderRadius: 3, backgroundColor: themeStyles.cardBg }}>
            <CardContent><Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}><BarChartIcon /> Payment Status Distribution</Typography>
              <Box sx={{ height: 300 }}><ResponsiveContainer width="100%" height="100%"><BarChart data={statusData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip /><Bar dataKey="count" fill={themeStyles.primaryColor} /></BarChart></ResponsiveContainer></Box>
            </CardContent>
          </Card>
        </Box>

        {/* Weekly Chart */}
        <Card sx={{ mt: 3, borderRadius: 3, backgroundColor: themeStyles.cardBg }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><TrendingUpIcon /> Weekly Transaction Trend - {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</Typography>
              <Box sx={{ display: 'flex', gap: 1 }}><Button variant="outlined" size="small" onClick={() => navigateMonth('prev')}>Previous</Button><Button variant="outlined" size="small" onClick={() => navigateMonth('next')}>Next</Button></Box>
            </Box>
            <Box sx={{ height: 350, width: '100%', overflowX: 'auto' }}>
              <Box sx={{ minWidth: 500, height: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weeklyData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="label" /><YAxis tickFormatter={(v) => formatPrice(v)} /><Tooltip formatter={(v) => formatPrice(Number(v))} /><Legend /><Line type="monotone" dataKey="deposits" stroke="#00C49F" name="Deposits" strokeWidth={2} /><Line type="monotone" dataKey="purchases" stroke="#FF8042" name="Property Purchases" strokeWidth={2} /><Line type="monotone" dataKey="total" stroke="#8884d8" name="Total Revenue" strokeWidth={2} /></LineChart>
                </ResponsiveContainer>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Monthly Stats */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 3 }}>
          <Card sx={{ flex: 1, borderRadius: 3, background: 'linear-gradient(135deg, #28a745, #218838)' }}><CardContent><Typography variant="h6" sx={{ color: 'white' }}>{formatPrice(monthlyStats.totalDeposit)}</Typography><Typography variant="body2" sx={{ color: 'white', opacity: 0.9 }}>Total Deposits</Typography></CardContent></Card>
          <Card sx={{ flex: 1, borderRadius: 3, background: 'linear-gradient(135deg, #007bff, #0056b3)' }}><CardContent><Typography variant="h6" sx={{ color: 'white' }}>{formatPrice(monthlyStats.totalPropertyPurchase)}</Typography><Typography variant="body2" sx={{ color: 'white', opacity: 0.9 }}>Property Purchases</Typography></CardContent></Card>
          <Card sx={{ flex: 1, borderRadius: 3, background: 'linear-gradient(135deg, #ff9900, #cc7a00)' }}><CardContent><Typography variant="h6" sx={{ color: 'white' }}>{formatPrice(monthlyStats.netRevenue)}</Typography><Typography variant="body2" sx={{ color: 'white', opacity: 0.9 }}>Total Revenue</Typography></CardContent></Card>
        </Box>

        {/* Export Modal */}
        <Dialog open={openExportModal} onClose={() => setOpenExportModal(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3, backgroundColor: themeStyles.cardBg } }}>
          <DialogTitle>Export Transaction Report</DialogTitle>
          <DialogContent><Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Total transactions to export: {transactions.length}</Typography><Alert severity="info" sx={{ mb: 2 }}>The report will include all property purchase and deposit transactions based on current filters.</Alert></DialogContent>
          <DialogActions><Button onClick={() => setOpenExportModal(false)}>Cancel</Button><PDFDownloadLink document={<TransactionReportPDF transactions={transactions} filters={filters} />} fileName={`transaction_report_${new Date().toISOString().slice(0, 10)}.pdf`}>{({ loading }) => <Button variant="contained" disabled={loading} sx={{ background: 'linear-gradient(135deg, #28a745, #218838)' }}>{loading ? 'Preparing...' : 'Download PDF'}</Button>}</PDFDownloadLink></DialogActions>
        </Dialog>

        {/* View Transaction Modal */}
        <Dialog open={openViewModal} onClose={() => setOpenViewModal(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3, backgroundColor: themeStyles.cardBg } }}>
          {selectedTransaction && (
            <>
              <DialogTitle>Transaction Details</DialogTitle>
              <DialogContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Paper sx={{ p: 2, bgcolor: theme === 'dark' ? '#1e293b' : '#f8f9fa' }}><Typography variant="caption" color="text.secondary">Reference</Typography><Typography variant="body2" sx={{ fontFamily: 'monospace' }}>{selectedTransaction.reference}</Typography></Paper>
                  <Paper sx={{ p: 2, bgcolor: theme === 'dark' ? '#1e293b' : '#f8f9fa' }}><Typography variant="caption" color="text.secondary">Amount</Typography><Typography variant="h6" sx={{ color: getTypeColor(selectedTransaction.type) }}>{formatPrice(selectedTransaction.amount)}</Typography></Paper>
                  <Paper sx={{ p: 2, bgcolor: theme === 'dark' ? '#1e293b' : '#f8f9fa' }}><Typography variant="caption" color="text.secondary">Type & Status</Typography><Box sx={{ display: 'flex', gap: 1, mt: 1 }}><Chip label={selectedTransaction.type === 'property_purchase' ? 'Property Purchase' : 'Deposit'} size="small" /><Chip label={selectedTransaction.status} size="small" color={selectedTransaction.status === 'completed' ? 'success' : 'warning'} /></Box></Paper>
                  <Paper sx={{ p: 2, bgcolor: theme === 'dark' ? '#1e293b' : '#f8f9fa' }}><Typography variant="caption" color="text.secondary">User</Typography><Typography variant="body2">{selectedTransaction.userId?.name || 'Unknown'}</Typography><Typography variant="caption" color="text.secondary">{selectedTransaction.userId?.phone}</Typography></Paper>
                  {selectedTransaction.houseId && (<Paper sx={{ p: 2, bgcolor: theme === 'dark' ? '#1e293b' : '#f8f9fa' }}><Typography variant="caption" color="text.secondary">Property</Typography><Typography variant="body2">{selectedTransaction.houseId.title}</Typography></Paper>)}
                  <Paper sx={{ p: 2, bgcolor: theme === 'dark' ? '#1e293b' : '#f8f9fa' }}><Typography variant="caption" color="text.secondary">Date</Typography><Typography variant="body2">{new Date(selectedTransaction.createdAt).toLocaleString()}</Typography></Paper>
                  {selectedTransaction.description && (<Paper sx={{ p: 2, bgcolor: theme === 'dark' ? '#1e293b' : '#f8f9fa' }}><Typography variant="caption" color="text.secondary">Description</Typography><Typography variant="body2">{selectedTransaction.description}</Typography></Paper>)}
                </Box>
              </DialogContent>
              <DialogActions><Button onClick={() => setOpenViewModal(false)}>Close</Button></DialogActions>
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