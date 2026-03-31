'use client';

import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Button, TextField,
  Select, MenuItem, FormControl, InputLabel, Chip, Dialog,
  DialogTitle, DialogContent, DialogActions, IconButton,
  Paper, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Pagination, Alert, Snackbar, CircularProgress,
  useMediaQuery, Stack, CardActions, Modal
} from '@mui/material';
import { useTheme } from '@/lib/theme-context';
import { useAuth } from '@/lib/auth';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  CalendarToday as CalendarIcon,
  AccountBalanceWallet as WalletIcon,
  ArrowUpward as WithdrawIcon,
  ArrowDownward as DepositIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  ContentCopy as CopyIcon,
  OpenInNew as OpenInNewIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  AccountBalance as BankIcon,
  AttachMoney as CashIcon,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
  Timeline as TimelineIcon,
  Calculate as CalculatorIcon,
  PictureAsPdf as PdfIcon,
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon
} from '@mui/icons-material';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { Document, Page, Text, View, StyleSheet, PDFDownloadLink, Image } from '@react-pdf/renderer';
import { motion } from 'framer-motion';
import api from '@/app/utils/api';
import { formatCurrency } from '@/lib/utils';

// Types
interface Transaction {
  _id: string;
  userId: {
    _id: string;
    phone: string;
    name?: string;
  };
  class: string;
  type: 'deposit' | 'withdrawal' | 'game_purchase' | 'winning';
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

interface WalletStats {
  wallet: number;
  totalDeposit: number;
  totalWithdrawal: number;
  pendingDeposits: number;
  pendingWithdrawals: number;
  recentTransactions: Transaction[];
}

interface TransactionFilters {
  search: string;
  type: string;
  status: string;
  method: string;
  class: string;
  startDate: string;
  endDate: string;
  page: number;
  limit: number;
}

interface TransactionReportFilters {
  start?: string;
  end?: string;
  type?: string;
  status?: string;
  method?: string;
  class?: string;
}

// PDF Styles
const pdfStyles = StyleSheet.create({
  page: {
    paddingTop: 100,
    paddingBottom: 60,
    paddingHorizontal: 40,
    fontFamily: 'Helvetica',
    position: 'relative',
    fontSize: 10,
    lineHeight: 1.4
  },
  header: {
    position: 'absolute',
    top: 20,
    left: 40,
    right: 40,
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    borderBottomStyle: 'solid',
    paddingBottom: 15,
    marginBottom: 20,
    flexDirection: 'column'
  },
  headerTable: {
    width: '100%',
    flexDirection: 'row',
    marginBottom: 5,
    borderWidth: 1,
    borderColor: '#000',
    borderStyle: 'solid'
  },
  headerTableCell: {
    padding: 5,
    borderWidth: 1,
    borderColor: '#000',
    borderStyle: 'solid',
  },
  headerLeft: {
    width: '20%',
    alignItems: 'center',
    justifyContent: 'center'
  },
  headerCenter: {
    width: '60%',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center'
  },
  headerRight: {
    width: '20%',
    alignItems: 'flex-end',
    justifyContent: 'center',
    textAlign: 'right'
  },
  headerTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 3
  },
  headerSubtitle: {
    fontSize: 10,
    marginBottom: 3
  },
  headerInfo: {
    fontSize: 8,
    marginBottom: 3
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: '#000',
    borderTopStyle: 'solid',
    paddingTop: 10,
    flexDirection: 'column',
    fontSize: 8,
    textAlign: 'center'
  },
  section: {
    marginBottom: 25,
    breakInside: 'avoid'
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    borderBottomStyle: 'solid',
    paddingBottom: 3
  },
  filterItem: {
    flexDirection: 'row',
    marginBottom: 8
  },
  filterLabel: {
    width: 100,
    fontWeight: 'bold'
  },
  filterValue: {
    flex: 1
  },
  transactionCard: {
    borderWidth: 1,
    borderColor: '#eee',
    borderStyle: 'solid',
    borderRadius: 3,
    padding: 10,
    marginBottom: 10,
    backgroundColor: '#f9f9f9'
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    borderBottomStyle: 'solid',
    paddingBottom: 3
  },
  transactionId: {
    fontSize: 11,
    fontWeight: 'bold'
  },
  transactionType: {
    fontSize: 10,
    color: '#555'
  },
  transactionDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 5
  },
  detailItem: {
    width: '50%',
    marginBottom: 5
  },
  detailLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#666'
  },
  detailValue: {
    fontSize: 9
  },
  pageNumber: {
    position: 'absolute',
    fontSize: 10,
    bottom: 30,
    left: 0,
    right: 0,
    textAlign: 'center'
  }
});

export default function TransactionReportsPage() {
  const { theme } = useTheme();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const { user } = useAuth();
  
  // Main states
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [walletStats, setWalletStats] = useState<WalletStats | null>(null);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [openExportModal, setOpenExportModal] = useState(false);
  const [openViewModal, setOpenViewModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  
  // Filters state
  const [filters, setFilters] = useState<TransactionFilters>({
    search: '',
    type: '',
    status: '',
    method: '',
    class: '',
    startDate: '',
    endDate: '',
    page: 1,
    limit: 10
  });

  // Chart filters
  const [chartFilters, setChartFilters] = useState<TransactionReportFilters>({});
  
  // Monthly navigation for weekly chart
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  
  // Pagination state
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
  const [classData, setClassData] = useState<any[]>([]);
  const [classTrendData, setClassTrendData] = useState<any[]>([]);
  const [monthlyStats, setMonthlyStats] = useState({
    totalDeposit: 0,
    totalWithdrawal: 0,
    netBalance: 0
  });

  const renderPieLabel = (props: any) => {
  const { name = '', percent = 0 } = props;
  return `${name}: ${(percent * 100).toFixed(0)}%`;
};

  // Colors for charts
  const COLORS = ['#3c8dbc', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];
  const CLASS_COLORS = ['#3c8dbc', '#00C49F', '#FFBB28'];
  const themeStyles = {
    background: theme === 'dark' 
      ? 'linear-gradient(135deg, #0a192f, #112240)' 
      : 'linear-gradient(135deg, #f0f0f0, #ffffff)',
    textColor: theme === 'dark' ? '#ccd6f6' : '#333333',
    primaryColor: theme === 'dark' ? '#00ffff' : '#007bff',
    cardBg: theme === 'dark' ? '#0f172a80' : '#ffffff',
    cardBorder: theme === 'dark' ? '#334155' : '#e5e7eb',
  };

  const textFieldStyle = {
    '& .MuiOutlinedInput-root': {
      backgroundColor: theme === 'dark' ? '#1e293b' : 'white',
      color: theme === 'dark' ? '#ccd6f6' : '#333333',
      '& fieldset': {
        borderColor: theme === 'dark' ? '#334155' : '#e5e7eb',
      },
      '&:hover fieldset': {
        borderColor: theme === 'dark' ? '#00ffff' : '#007bff',
      },
      '&.Mui-focused fieldset': {
        borderColor: theme === 'dark' ? '#00ffff' : '#007bff',
      },
    },
    '& .MuiInputLabel-root': {
      color: theme === 'dark' ? '#a8b2d1' : '#666666',
      fontSize: '0.95rem',
      '&.Mui-focused': {
        color: theme === 'dark' ? '#00ffff' : '#007bff',
      },
      '&.MuiInputLabel-shrink': {
        fontSize: '1rem',
        transform: 'translate(14px, -9px) scale(0.75)'
      }
    },
    '& .MuiInputLabel-outlined': {
      transform: 'translate(14px, 16px) scale(1)',
    }
  };

  const selectStyle = {
    '& .MuiOutlinedInput-root': {
      backgroundColor: theme === 'dark' ? '#1e293b' : 'white',
      color: theme === 'dark' ? '#ccd6f6' : '#333333',
      '& fieldset': {
        borderColor: theme === 'dark' ? '#334155' : '#e5e7eb',
      },
      '&:hover fieldset': {
        borderColor: theme === 'dark' ? '#00ffff' : '#007bff',
      },
      '&.Mui-focused fieldset': {
        borderColor: theme === 'dark' ? '#00ffff' : '#007bff',
      },
    },
    '& .MuiInputLabel-root': {
      color: theme === 'dark' ? '#a8b2d1' : '#666666',
      fontSize: '0.95rem',
      '&.Mui-focused': {
        color: theme === 'dark' ? '#00ffff' : '#007bff',
      },
      '&.MuiInputLabel-shrink': {
        fontSize: '1rem',
        transform: 'translate(14px, -9px) scale(0.75)'
      }
    },
    '& .MuiSelect-select': {
      paddingTop: '12px',
      paddingBottom: '12px',
    }
  };

  // Fetch transactions
  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value.toString());
      });
      
      const res = await api.get(`/transactions?${params}`);
      setTransactions(res.data.data);
      setFilteredTransactions(res.data.data);
      setPagination(res.data.pagination);
      generateChartData(res.data.data);
    } catch (error: any) {
      console.error('Failed to fetch transactions:', error);
      showMessage('Failed to load transactions', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Fetch wallet stats
  const fetchWalletStats = async () => {
    try {
      setStatsLoading(true);
      const res = await api.get('/wallet/stats');
      setWalletStats(res.data.data);
    } catch (error: any) {
      console.error('Failed to fetch wallet stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  // Generate chart data
  const generateChartData = (data: Transaction[]) => {
    // Type distribution
    const typeCounts = data.reduce((acc: any, tx) => {
      const type = tx.type || 'UNKNOWN';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    setTypeData(Object.keys(typeCounts).map(type => ({
      name: type.toUpperCase(),
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

    // Class distribution
    const classCounts = data.reduce((acc: any, tx) => {
      const cls = tx.class || 'UNKNOWN';
      acc[cls] = (acc[cls] || 0) + 1;
      return acc;
    }, {});

    setClassData(Object.keys(classCounts).map(cls => ({
      name: cls.charAt(0).toUpperCase() + cls.slice(1),
      value: classCounts[cls],
      count: classCounts[cls]
    })));

    // Generate class trend data (last 6 months)
    generateClassTrendData(data);

    // Generate weekly data for current month
    generateWeeklyDataForMonth(data, currentMonth);

    // Calculate monthly stats
    calculateMonthlyStats(data, currentMonth);
  };

  // Generate class trend data for last 6 months
  const generateClassTrendData = (data: Transaction[]) => {
    const months = [];
    const now = new Date();
    const classes = ['user', 'agent', 'admin'];
    
    // Get last 6 months
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now);
      monthDate.setMonth(now.getMonth() - i);
      
      const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
      const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
      
      const monthData: any = {
        month: monthDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        date: monthStart
      };
      
      // Count transactions per class for this month
      classes.forEach(cls => {
        const classTransactions = data.filter(tx => {
          const txDate = new Date(tx.createdAt);
          return tx.class === cls && txDate >= monthStart && txDate <= monthEnd;
        });
        
        monthData[cls] = classTransactions.length;
        monthData[`${cls}Amount`] = classTransactions.reduce((sum, tx) => sum + tx.amount, 0);
      });
      
      months.push(monthData);
    }
    
    setClassTrendData(months);
  };

  // Generate weekly data for specific month
  const generateWeeklyDataForMonth = (data: Transaction[], month: Date) => {
    const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
    const lastDay = new Date(month.getFullYear(), month.getMonth() + 1, 0);
    
    const weeks: any[] = [];
    let currentWeekStart = new Date(firstDay);
    
    // Adjust to start of week (Monday)
    const dayOfWeek = currentWeekStart.getDay();
    const diff = currentWeekStart.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    currentWeekStart = new Date(currentWeekStart.setDate(diff));
    
    while (currentWeekStart <= lastDay) {
      const weekEnd = new Date(currentWeekStart);
      weekEnd.setDate(currentWeekStart.getDate() + 6);
      
      // Adjust week end if it goes beyond month end
      if (weekEnd > lastDay) {
        weekEnd.setTime(lastDay.getTime());
      }
      
      const weekTransactions = data.filter(tx => {
        const txDate = new Date(tx.createdAt);
        return txDate >= currentWeekStart && txDate <= weekEnd;
      });

      const weekTotal = weekTransactions.reduce((sum, tx) => sum + tx.amount, 0);
      const weekCount = weekTransactions.length;
      const weekDeposits = weekTransactions
        .filter(tx => tx.type === 'deposit')
        .reduce((sum, tx) => sum + tx.amount, 0);
      const weekWithdrawals = weekTransactions
        .filter(tx => tx.type === 'withdrawal')
        .reduce((sum, tx) => sum + tx.amount, 0);

      weeks.push({
        week: `Week ${weeks.length + 1}`,
        dateRange: `${currentWeekStart.getDate()}/${currentWeekStart.getMonth() + 1} - ${weekEnd.getDate()}/${weekEnd.getMonth() + 1}`,
        label: `${currentWeekStart.getDate()}/${currentWeekStart.getMonth() + 1}`,
        total: weekTotal,
        count: weekCount,
        deposits: weekDeposits,
        withdrawals: weekWithdrawals,
        net: weekDeposits - weekWithdrawals
      });
      
      currentWeekStart.setDate(currentWeekStart.getDate() + 7);
    }
    
    setWeeklyData(weeks);
  };

  // Calculate monthly stats
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
    
    const monthlyWithdrawals = monthlyTransactions
      .filter(tx => tx.type === 'withdrawal')
      .reduce((sum, tx) => sum + tx.amount, 0);
    
    const netBalance = monthlyDeposits - monthlyWithdrawals;
    
    setMonthlyStats({
      totalDeposit: monthlyDeposits,
      totalWithdrawal: monthlyWithdrawals,
      netBalance: netBalance
    });
  };

  // Handle filter changes
  const handleFilterChange = (newFilters: TransactionFilters) => {
    setFilters(newFilters);
    fetchTransactions();
  };

  const handleChartFilterChange = (newFilters: TransactionReportFilters) => {
    setChartFilters(newFilters);
    // Apply chart filters to transactions
    let filtered = [...transactions];
    
    if (newFilters.start && newFilters.end) {
      filtered = filtered.filter(tx => {
        const txDate = new Date(tx.createdAt);
        const start = new Date(newFilters.start!);
        const end = new Date(newFilters.end!);
        return txDate >= start && txDate <= end;
      });
    }
    
    if (newFilters.type) {
      filtered = filtered.filter(tx => tx.type === newFilters.type);
    }
    
    if (newFilters.status) {
      filtered = filtered.filter(tx => tx.status === newFilters.status);
    }
    
    if (newFilters.method) {
      filtered = filtered.filter(tx => tx.method === newFilters.method);
    }
    
    if (newFilters.class) {
      filtered = filtered.filter(tx => tx.class === newFilters.class);
    }
    
    generateChartData(filtered);
  };

  const resetFilters = () => {
    const clearedFilters = {
      search: '',
      type: '',
      status: '',
      method: '',
      class: '',
      startDate: '',
      endDate: '',
      page: 1,
      limit: 10
    };
    setFilters(clearedFilters);
    setChartFilters({});
    setCurrentMonth(new Date());
    fetchTransactions();
  };

  const resetChartFilters = () => {
    setChartFilters({});
    setCurrentMonth(new Date());
    generateChartData(transactions);
  };

  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleViewTransaction = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setOpenViewModal(true);
  };

  // Navigate months
  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1);
    }
    setCurrentMonth(newMonth);
    generateWeeklyDataForMonth(transactions, newMonth);
    calculateMonthlyStats(transactions, newMonth);
  };

  // PDF Export Component
  const TransactionReportPDF = ({ transactions, filters }: { transactions: Transaction[]; filters: TransactionReportFilters }) => {
    const filteredTransactions = Array.isArray(transactions) ? transactions : [];
    const currentDate = new Date().toLocaleDateString();
    const reportNumber = `GUB/REP/${new Date().getFullYear()}/${Math.floor(Math.random() * 1000)}`;

    // Split transactions into pages (5 per page)
    const pages = [];
    for (let i = 0; i < filteredTransactions.length; i += 5) {
      pages.push(filteredTransactions.slice(i, i + 5));
    }

    const getTransactionDetails = (tx: Transaction) => {
      return [
        { label: 'Transaction ID', value: tx._id },
        { label: 'Reference', value: tx.reference },
        { label: 'Type', value: tx.type },
        { label: 'Amount', value: formatCurrency(tx.amount) },
        { label: 'Amount in Words', value: tx.amountInString },
        { label: 'Status', value: tx.status },
        { label: 'Method', value: tx.method },
        { label: 'Class', value: tx.class },
        { label: 'Description', value: tx.description },
        { label: 'User Phone', value: tx.userId?.phone },
        { label: 'User Name', value: tx.userId?.name || 'Unknown' },
        { label: 'Transaction ID', value: tx.transactionId },
        { label: 'Sender Phone', value: tx.senderPhone },
        { label: 'Sender Name', value: tx.senderName },
        { label: 'Receiver Phone', value: tx.receiverPhone },
        { label: 'Receiver Name', value: tx.receiverName },
        { label: 'Created At', value: new Date(tx.createdAt).toLocaleString() },
        { label: 'Approved By', value: tx.approvedBy },
        { label: 'Approved At', value: tx.approvedAt ? new Date(tx.approvedAt).toLocaleString() : undefined },
        { label: 'Completed By', value: tx.completedBy },
        { label: 'Completed At', value: tx.completedAt ? new Date(tx.completedAt).toLocaleString() : undefined },
        { label: 'Confirmed By', value: tx.confirmedBy },
        { label: 'Confirmed At', value: tx.confirmedAt ? new Date(tx.confirmedAt).toLocaleString() : undefined },
        { label: 'Reason', value: tx.reason },
      ].filter(field => field.value !== undefined && field.value !== null && field.value !== '');
    };

    const renderTransactionDetails = (tx: Transaction) => {
      const fields = getTransactionDetails(tx);
      
      return (
        <View style={pdfStyles.transactionDetails}>
          {fields.map((field, idx) => (
            <View key={`${tx._id}-${idx}`} style={pdfStyles.detailItem}>
              <Text style={pdfStyles.detailLabel}>{field.label}:</Text>
              <Text style={pdfStyles.detailValue}>{String(field.value)}</Text>
            </View>
          ))}
        </View>
      );
    };

    return (
      <Document>
        {pages.map((pageTransactions, pageIndex) => (
          <Page key={pageIndex} size="A4" style={pdfStyles.page} wrap>
            {/* Header */}
            <View fixed style={pdfStyles.header}>
              <View style={pdfStyles.headerTable}>
                <View style={[pdfStyles.headerTableCell, pdfStyles.headerLeft]}>
                  <Text>GUB</Text>
                </View>
                
                <View style={[pdfStyles.headerTableCell, pdfStyles.headerCenter]}>
                  <Text style={pdfStyles.headerTitle}>
                    GUB - TEPI
                  </Text>
                  
                  <Text style={pdfStyles.headerSubtitle}>
                    TRANSACTION REPORT
                  </Text>
                </View>
                
                <View style={[pdfStyles.headerTableCell, pdfStyles.headerRight]}>
                  <Text style={pdfStyles.headerInfo}>Report No: {reportNumber}</Text>
                  <Text style={pdfStyles.headerInfo}>Date: {currentDate}</Text>
                  <Text style={pdfStyles.headerInfo}>Page: {pageIndex + 1} of {pages.length}</Text>
                </View>
              </View>
            </View>

            {/* Filter criteria on first page */}
            {pageIndex === 0 && (
              <View style={pdfStyles.section}>
                <Text style={pdfStyles.sectionTitle}>FILTER CRITERIA</Text>
                <View style={pdfStyles.filterItem}>
                  <Text style={pdfStyles.filterLabel}>Date Range:</Text>
                  <Text style={pdfStyles.filterValue}>
                    {filters.start ? new Date(filters.start).toLocaleDateString() : 'Not specified'} to{' '}
                    {filters.end ? new Date(filters.end).toLocaleDateString() : 'Not specified'}
                  </Text>
                </View>
                <View style={pdfStyles.filterItem}>
                  <Text style={pdfStyles.filterLabel}>Type:</Text>
                  <Text style={pdfStyles.filterValue}>{filters.type || 'All'}</Text>
                </View>
                <View style={pdfStyles.filterItem}>
                  <Text style={pdfStyles.filterLabel}>Status:</Text>
                  <Text style={pdfStyles.filterValue}>{filters.status || 'All'}</Text>
                </View>
                <View style={pdfStyles.filterItem}>
                  <Text style={pdfStyles.filterLabel}>Method:</Text>
                  <Text style={pdfStyles.filterValue}>{filters.method || 'All'}</Text>
                </View>
                <View style={pdfStyles.filterItem}>
                  <Text style={pdfStyles.filterLabel}>Class:</Text>
                  <Text style={pdfStyles.filterValue}>{filters.class || 'All'}</Text>
                </View>
              </View>
            )}

            {/* Transaction details */}
            <View style={pdfStyles.section}>
              {pageIndex === 0 && (
                <Text style={pdfStyles.sectionTitle}>
                  TRANSACTION DETAILS ({filteredTransactions.length} records)
                </Text>
              )}
              {pageTransactions.map((tx, index) => (
                <View key={`${tx._id}-${index}`} style={pdfStyles.transactionCard}>
                  <View style={pdfStyles.transactionHeader}>
                    <Text style={pdfStyles.transactionId}>{tx.reference}</Text>
                    <Text style={pdfStyles.transactionType}>{tx.type.toUpperCase()}</Text>
                  </View>
                  {renderTransactionDetails(tx)}
                </View>
              ))}
            </View>
            
            {/* Footer */}
            <View fixed style={pdfStyles.footer}>
              <Text>GUB - TEPI TRANSACTION MANAGEMENT SYSTEM</Text>
              <Text>Make sure whether the report is correct or not before use</Text>
            </View>
          </Page>
        ))}
      </Document>
    );
  };

  // Get status color
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
      case 'withdrawal': return theme === 'dark' ? '#ff0000' : '#dc3545';
      case 'game_purchase': return theme === 'dark' ? '#ff9900' : '#ffc107';
      case 'winning': return theme === 'dark' ? '#00b3b3' : '#17a2b8';
      default: return theme === 'dark' ? '#a8b2d1' : '#6c757d';
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchTransactions();
    fetchWalletStats();
  }, []);

  // Custom Tooltip for charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ 
          backgroundColor: theme === 'dark' ? '#1e293b' : 'white',
          padding: '10px',
          border: `1px solid ${themeStyles.cardBorder}`,
          borderRadius: '4px',
          color: themeStyles.textColor,
          fontSize: '12px',
          boxShadow: theme === 'dark' ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          <p style={{ fontWeight: 'bold', margin: '0 0 5px 0' }}>{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ 
              color: entry.color, 
              margin: '2px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}>
              <span style={{
                display: 'inline-block',
                width: '10px',
                height: '10px',
                backgroundColor: entry.color,
                borderRadius: '2px'
              }}></span>
              <span>{`${entry.name}: ${formatCurrency(entry.value)}`}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const CustomClassTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ 
          backgroundColor: theme === 'dark' ? '#1e293b' : 'white',
          padding: '10px',
          border: `1px solid ${themeStyles.cardBorder}`,
          borderRadius: '4px',
          color: themeStyles.textColor,
          fontSize: '12px',
          boxShadow: theme === 'dark' ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          <p style={{ fontWeight: 'bold', margin: '0 0 5px 0' }}>{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ 
              color: entry.color, 
              margin: '2px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}>
              <span style={{
                display: 'inline-block',
                width: '10px',
                height: '10px',
                backgroundColor: entry.color,
                borderRadius: '2px'
              }}></span>
              <span>{`${entry.name}: ${entry.value} transactions`}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${theme === 'dark' ? 'bg-[#0a192f]' : 'bg-gray-50'}`}>
      <Box sx={{ py: 3, px: { xs: 2, sm: 3, md: 4 } }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Box sx={{ 
            mb: 4,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 2
          }}>
            <Box>
              <Typography variant={isMobile ? "h5" : "h4"} sx={{ 
                fontWeight: 'bold', 
                color: themeStyles.textColor,
                mb: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}>
                <BarChartIcon /> Transaction Reports
              </Typography>
              <Typography variant={isMobile ? "body2" : "body1"} color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                Comprehensive transaction analysis and reporting
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                startIcon={<RefreshIcon />}
                onClick={fetchTransactions}
                sx={{
                  background: theme === 'dark'
                    ? 'linear-gradient(135deg, #00b3b3, #008080)'
                    : 'linear-gradient(135deg, #17a2b8, #138496)',
                  borderRadius: 2,
                  px: 3,
                  py: 1.5,
                  '&:hover': {
                    background: theme === 'dark'
                      ? 'linear-gradient(135deg, #008080, #006666)'
                      : 'linear-gradient(135deg, #138496, #117a8b)'
                  }
                }}
              >
                Refresh
              </Button>
              
              <Button
                variant="contained"
                startIcon={<DownloadIcon />}
                onClick={() => setOpenExportModal(true)}
                sx={{
                  background: theme === 'dark'
                    ? 'linear-gradient(135deg, #00ff00, #00b300)'
                    : 'linear-gradient(135deg, #28a745, #218838)',
                  borderRadius: 2,
                  px: 3,
                  py: 1.5,
                  '&:hover': {
                    background: theme === 'dark'
                      ? 'linear-gradient(135deg, #00b300, #008000)'
                      : 'linear-gradient(135deg, #218838, #1e7e34)'
                  }
                }}
              >
                Export PDF
              </Button>
            </Box>
          </Box>
        </motion.div>

        {/* Filters - Improved Layout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card sx={{ 
            mb: 4, 
            borderRadius: 2,
            backgroundColor: themeStyles.cardBg,
            border: `1px solid ${themeStyles.cardBorder}`,
            boxShadow: theme === 'dark' 
              ? '0 4px 12px rgba(0,0,0,0.3)' 
              : '0 4px 12px rgba(0,0,0,0.08)'
          }}>
            <CardContent>
              {/* First Row: Search and Buttons */}
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, mb: 3 }}>
                <Box sx={{ flex: 1 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Search"
                    value={filters.search}
                    onChange={(e) => setFilters({...filters, search: e.target.value, page: 1})}
                    placeholder="Reference, phone, or description..."
                    InputProps={{
                      startAdornment: <SearchIcon sx={{ color: theme === 'dark' ? '#a8b2d1' : '#666666', mr: 1 }} />
                    }}
                    sx={textFieldStyle}
                  />
                </Box>
                
                <Box sx={{ display: 'flex', gap: 2, width: { xs: '100%', md: 'auto' } }}>
                  <Button
                    variant="outlined"
                    startIcon={<RefreshIcon />}
                    onClick={resetFilters}
                    sx={{
                      borderColor: themeStyles.primaryColor,
                      color: themeStyles.primaryColor,
                      minWidth: '100px',
                      '&:hover': {
                        borderColor: themeStyles.primaryColor,
                        backgroundColor: theme === 'dark' ? '#00ffff20' : '#007bff10'
                      }
                    }}
                  >
                    Reset All
                  </Button>
                  
                  <Button
                    variant="contained"
                    startIcon={<FilterIcon />}
                    onClick={fetchTransactions}
                    sx={{
                      background: theme === 'dark'
                        ? 'linear-gradient(135deg, #00ffff, #00b3b3)'
                        : 'linear-gradient(135deg, #007bff, #0056b3)',
                      borderRadius: 1,
                      minWidth: '100px',
                      '&:hover': {
                        background: theme === 'dark'
                          ? 'linear-gradient(135deg, #00b3b3, #008080)'
                          : 'linear-gradient(135deg, #0056b3, #004080)'
                      }
                    }}
                  >
                    Filter
                  </Button>
                </Box>
              </Box>
              
              {/* Second Row: Filter Options */}
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
                    <FormControl fullWidth size="small" sx={selectStyle}>
                      <InputLabel>Type</InputLabel>
                      <Select
                        value={filters.type}
                        label="Type"
                        onChange={(e) => setFilters({...filters, type: e.target.value, page: 1})}
                      >
                        <MenuItem value="">All Types</MenuItem>
                        <MenuItem value="deposit">Deposit</MenuItem>
                        <MenuItem value="withdrawal">Withdrawal</MenuItem>
                        <MenuItem value="game_purchase">Game Purchase</MenuItem>
                        <MenuItem value="winning">Winning</MenuItem>
                      </Select>
                    </FormControl>
                    
                    <FormControl fullWidth size="small" sx={selectStyle}>
                      <InputLabel>Status</InputLabel>
                      <Select
                        value={filters.status}
                        label="Status"
                        onChange={(e) => setFilters({...filters, status: e.target.value, page: 1})}
                      >
                        <MenuItem value="">All Status</MenuItem>
                        <MenuItem value="pending">Pending</MenuItem>
                        <MenuItem value="approved">Approved</MenuItem>
                        <MenuItem value="completed">Completed</MenuItem>
                        <MenuItem value="confirmed">Confirmed</MenuItem>
                        <MenuItem value="failed">Failed</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                  
                  <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
                    <FormControl fullWidth size="small" sx={selectStyle}>
                      <InputLabel>Method</InputLabel>
                      <Select
                        value={filters.method}
                        label="Method"
                        onChange={(e) => setFilters({...filters, method: e.target.value, page: 1})}
                      >
                        <MenuItem value="">All Methods</MenuItem>
                        <MenuItem value="cash">Cash</MenuItem>
                        <MenuItem value="telebirr">Telebirr</MenuItem>
                        <MenuItem value="cbe">CBE</MenuItem>
                      </Select>
                    </FormControl>
                    
                    <FormControl fullWidth size="small" sx={selectStyle}>
                      <InputLabel>Class</InputLabel>
                      <Select
                        value={filters.class}
                        label="Class"
                        onChange={(e) => setFilters({...filters, class: e.target.value, page: 1})}
                      >
                        <MenuItem value="">All Classes</MenuItem>
                        <MenuItem value="user">User</MenuItem>
                        <MenuItem value="agent">Agent</MenuItem>
                        <MenuItem value="admin">Admin</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                </Box>
                
                {/* Date Filters */}
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Start Date"
                      type="date"
                      value={filters.startDate}
                      onChange={(e) => setFilters({...filters, startDate: e.target.value, page: 1})}
                      InputLabelProps={{ shrink: true }}
                      sx={textFieldStyle}
                    />
                    
                    <TextField
                      fullWidth
                      size="small"
                      label="End Date"
                      type="date"
                      value={filters.endDate}
                      onChange={(e) => setFilters({...filters, endDate: e.target.value, page: 1})}
                      InputLabelProps={{ shrink: true }}
                      sx={textFieldStyle}
                    />
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </motion.div>

        {/* Row 1: Table (3/4) + Type Distribution (1/4) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 3, mb: 3 }}>
            {/* Transactions Table - 3/4 width */}
            <Box sx={{ flex: 3 }}>
              <Card sx={{ 
                borderRadius: 2,
                backgroundColor: themeStyles.cardBg,
                border: `1px solid ${themeStyles.cardBorder}`,
                height: '100%'
              }}>
                <CardContent>
                  <Typography variant="h6" sx={{ 
                    mb: 3,
                    color: themeStyles.textColor,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}>
                    All Transactions ({pagination.totalRecords})
                  </Typography>

                  {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                      <CircularProgress size={40} sx={{ color: themeStyles.primaryColor }} />
                    </Box>
                  ) : transactions.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <CheckIcon sx={{ fontSize: 48, color: theme === 'dark' ? '#334155' : '#cbd5e1', mb: 2 }} />
                      <Typography variant="body1" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                        No transactions found
                      </Typography>
                    </Box>
                  ) : (
                    <>
                      <TableContainer>
                        <Table>
                          <TableHead>
                            <TableRow sx={{ 
                              background: theme === 'dark'
                                ? 'linear-gradient(135deg, #00ffff, #00b3b3)'
                                : 'linear-gradient(135deg, #007bff, #0056b3)'
                            }}>
                              <TableCell sx={{ color: 'white', fontWeight: 'bold', py: 2 }}>Reference</TableCell>
                              <TableCell sx={{ color: 'white', fontWeight: 'bold', py: 2 }}>User</TableCell>
                              <TableCell sx={{ color: 'white', fontWeight: 'bold', py: 2 }}>Type</TableCell>
                              <TableCell sx={{ color: 'white', fontWeight: 'bold', py: 2 }}>Amount</TableCell>
                              <TableCell sx={{ color: 'white', fontWeight: 'bold', py: 2 }}>Status</TableCell>
                              <TableCell sx={{ color: 'white', fontWeight: 'bold', py: 2 }}>Date</TableCell>
                              <TableCell sx={{ color: 'white', fontWeight: 'bold', py: 2 }}>Actions</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {transactions.map((transaction) => (
                              <TableRow 
                                key={transaction._id}
                                hover
                                sx={{ 
                                  '&:hover': {
                                    backgroundColor: theme === 'dark' ? '#1e293b' : '#f8fafc'
                                  }
                                }}
                              >
                                <TableCell>
                                  <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                                    {transaction.reference}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Box>
                                    <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                      {transaction.userId?.name || 'Unknown'}
                                    </Typography>
                                    <Typography variant="caption" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                                      {transaction.userId?.phone}
                                    </Typography>
                                  </Box>
                                </TableCell>
                                <TableCell>
                                  <Chip
                                    label={transaction.type.toUpperCase()}
                                    size="small"
                                    sx={{
                                      backgroundColor: transaction.type === 'deposit' 
                                        ? (theme === 'dark' ? '#00ffff20' : '#007bff20')
                                        : transaction.type === 'withdrawal'
                                        ? (theme === 'dark' ? '#ff000020' : '#dc354520')
                                        : (theme === 'dark' ? '#ff990020' : '#ffc10720'),
                                      color: getTypeColor(transaction.type),
                                      fontWeight: 'medium'
                                    }}
                                  />
                                </TableCell>
                                <TableCell>
                                  <Typography variant="body2" sx={{ 
                                    fontWeight: 'bold',
                                    color: transaction.type === 'deposit' 
                                      ? (theme === 'dark' ? '#00ff00' : '#28a745')
                                      : (theme === 'dark' ? '#ff0000' : '#dc3545')
                                  }}>
                                    {formatCurrency(transaction.amount)}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Chip
                                    label={transaction.status.toUpperCase()}
                                    size="small"
                                    sx={{
                                      backgroundColor: `${getStatusColor(transaction.status)}20`,
                                      color: getStatusColor(transaction.status),
                                      fontWeight: 'medium'
                                    }}
                                  />
                                </TableCell>
                                <TableCell>
                                  <Typography variant="body2">
                                    {new Date(transaction.createdAt).toLocaleDateString()}
                                  </Typography>
                                  <Typography variant="caption" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                                    {new Date(transaction.createdAt).toLocaleTimeString()}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    onClick={() => handleViewTransaction(transaction)}
                                    sx={{
                                      borderColor: themeStyles.primaryColor,
                                      color: themeStyles.primaryColor,
                                      '&:hover': {
                                        borderColor: themeStyles.primaryColor,
                                        backgroundColor: theme === 'dark' ? '#00ffff20' : '#007bff10'
                                      }
                                    }}
                                  >
                                    View
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>

                      {pagination.total > 1 && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                          <Pagination
                            count={pagination.total}
                            page={filters.page}
                            onChange={(event, page) => setFilters({...filters, page})}
                            color="primary"
                            sx={{
                              '& .MuiPaginationItem-root': {
                                borderRadius: 1,
                                color: theme === 'dark' ? '#ccd6f6' : '#333333',
                                '&.Mui-selected': {
                                  backgroundColor: themeStyles.primaryColor,
                                  color: theme === 'dark' ? '#0a192f' : 'white',
                                },
                                '&:hover': {
                                  backgroundColor: theme === 'dark' ? '#00ffff20' : '#007bff10'
                                }
                              }
                            }}
                          />
                        </Box>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </Box>

            {/* Type Distribution - 1/4 width */}
            <Box sx={{ flex: 1 }}>
              <Card sx={{ 
                borderRadius: 2,
                backgroundColor: themeStyles.cardBg,
                border: `1px solid ${themeStyles.cardBorder}`,
                height: '100%'
              }}>
                <CardContent>
                  <Typography variant="h6" sx={{ 
                    color: themeStyles.textColor, 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1,
                    mb: 2
                  }}>
                    <PieChartIcon /> Type Distribution
                  </Typography>
                  
                  {typeData.length > 0 ? (
                    <Box sx={{ height: 300 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={typeData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label={renderPieLabel}
                          >
                            {typeData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip content={<CustomTooltip />} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </Box>
                  ) : (
                    <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Typography color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                        No type data available
                      </Typography>
                    </Box>
                  )}
                  
                  <Box sx={{ mt: 2 }}>
                    {typeData.map((item, index) => (
                      <Box key={index} sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        mb: 1,
                        p: 1,
                        borderRadius: 1,
                        backgroundColor: theme === 'dark' ? '#1e293b' : '#f8f9fa'
                      }}>
                        <Typography variant="body2" sx={{ color: themeStyles.textColor }}>
                          {item.name}
                        </Typography>
                        <Chip
                          label={item.count}
                          size="small"
                          sx={{
                            backgroundColor: `${COLORS[index % COLORS.length]}20`,
                            color: COLORS[index % COLORS.length],
                          }}
                        />
                      </Box>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Box>
          </Box>
        </motion.div>

        {/* Row 2: Status Distribution (3/4) + Method Distribution (1/4) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 3, mb: 3 }}>
            {/* Status Distribution - 3/4 width */}
            <Box sx={{ flex: 3 }}>
              <Card sx={{ 
                borderRadius: 2,
                backgroundColor: themeStyles.cardBg,
                border: `1px solid ${themeStyles.cardBorder}`,
                height: '100%'
              }}>
                <CardContent>
                  <Typography variant="h6" sx={{ 
                    color: themeStyles.textColor, 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1,
                    mb: 2
                  }}>
                    <BarChartIcon /> Status Distribution
                  </Typography>
                  
                  {statusData.length > 0 ? (
                    <Box sx={{ height: 300 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={statusData}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#334155' : '#e5e7eb'} />
                          <XAxis 
                            dataKey="name" 
                            stroke={themeStyles.textColor}
                            tick={{ fontSize: 12 }}
                          />
                          <YAxis 
                            stroke={themeStyles.textColor}
                            tick={{ fontSize: 12 }}
                          />
                          <Tooltip content={<CustomTooltip />} />
                          <Legend />
                          <Bar 
                            dataKey="count" 
                            fill={themeStyles.primaryColor} 
                            name="Number of Transactions"
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </Box>
                  ) : (
                    <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Typography color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                        No status data available
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Box>

            {/* Method Distribution - 1/4 width */}
            <Box sx={{ flex: 1 }}>
              <Card sx={{ 
                borderRadius: 2,
                backgroundColor: themeStyles.cardBg,
                border: `1px solid ${themeStyles.cardBorder}`,
                height: '100%'
              }}>
                <CardContent>
                  <Typography variant="h6" sx={{ 
                    color: themeStyles.textColor, 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1,
                    mb: 2
                  }}>
                    <PieChartIcon /> Method Distribution
                  </Typography>
                  
                  {methodData.length > 0 ? (
                    <Box sx={{ height: 300 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={methodData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label={renderPieLabel}
                          >
                            {methodData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip content={<CustomTooltip />} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </Box>
                  ) : (
                    <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Typography color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                        No method data available
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Box>
          </Box>
        </motion.div>

        {/* Row 3: Weekly Distribution (Full Width) with Stats Cards - CHANGED TO LINE CHART */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <Card sx={{ 
            borderRadius: 2,
            backgroundColor: themeStyles.cardBg,
            border: `1px solid ${themeStyles.cardBorder}`,
            mb: 3
          }}>
            <CardContent>
              {/* Monthly Stats Cards */}
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, mb: 3 }}>
                <Card sx={{ 
                  flex: 1,
                  background: theme === 'dark'
                    ? 'linear-gradient(135deg, #00ff00, #00b300)'
                    : 'linear-gradient(135deg, #28a745, #218838)',
                  borderRadius: 2
                }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box>
                        <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
                          {formatCurrency(monthlyStats.totalDeposit)}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'white', opacity: 0.9 }}>
                          Total Deposit
                        </Typography>
                      </Box>
                      <DepositIcon sx={{ fontSize: 40, color: 'white', opacity: 0.8 }} />
                    </Box>
                  </CardContent>
                </Card>
                
                <Card sx={{ 
                  flex: 1,
                  background: theme === 'dark'
                    ? 'linear-gradient(135deg, #ff0000, #b30000)'
                    : 'linear-gradient(135deg, #dc3545, #c82333)',
                  borderRadius: 2
                }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box>
                        <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
                          {formatCurrency(monthlyStats.totalWithdrawal)}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'white', opacity: 0.9 }}>
                          Total Withdrawal
                        </Typography>
                      </Box>
                      <WithdrawIcon sx={{ fontSize: 40, color: 'white', opacity: 0.8 }} />
                    </Box>
                  </CardContent>
                </Card>
                
                <Card sx={{ 
                  flex: 1,
                  background: theme === 'dark'
                    ? 'linear-gradient(135deg, #00ffff, #00b3b3)'
                    : 'linear-gradient(135deg, #007bff, #0056b3)',
                  borderRadius: 2
                }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box>
                        <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
                          {formatCurrency(monthlyStats.netBalance)}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'white', opacity: 0.9 }}>
                          Net Balance
                        </Typography>
                      </Box>
                      <WalletIcon sx={{ fontSize: 40, color: 'white', opacity: 0.8 }} />
                    </Box>
                  </CardContent>
                </Card>
              </Box>
              
              {/* Weekly Chart Header with Month Navigation */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ 
                  color: themeStyles.textColor, 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1
                }}>
                  <TimelineIcon /> Weekly Distribution - {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="outlined"
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigateMonth('prev')}
                    size="small"
                    sx={{
                      borderColor: themeStyles.primaryColor,
                      color: themeStyles.primaryColor,
                      '&:hover': {
                        borderColor: themeStyles.primaryColor,
                        backgroundColor: theme === 'dark' ? '#00ffff20' : '#007bff10'
                      }
                    }}
                  >
                    Previous
                  </Button>
                  
                  <Button
                    variant="outlined"
                    endIcon={<ArrowForwardIcon />}
                    onClick={() => navigateMonth('next')}
                    size="small"
                    sx={{
                      borderColor: themeStyles.primaryColor,
                      color: themeStyles.primaryColor,
                      '&:hover': {
                        borderColor: themeStyles.primaryColor,
                        backgroundColor: theme === 'dark' ? '#00ffff20' : '#007bff10'
                      }
                    }}
                  >
                    Next
                  </Button>
                </Box>
              </Box>
              
              {/* Weekly Chart - CHANGED TO LINE CHART */}
              {weeklyData.length > 0 ? (
                <Box sx={{ height: 350 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={weeklyData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#334155' : '#e5e7eb'} />
                      <XAxis 
                        dataKey="label" 
                        stroke={themeStyles.textColor}
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis 
                        stroke={themeStyles.textColor}
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => formatCurrency(value)}
                      />
                      <Tooltip 
                        content={<CustomTooltip />}
                        formatter={(value) => formatCurrency(Number(value))}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="deposits" 
                        stroke="#00C49F" 
                        name="Deposits"
                        strokeWidth={3}
                        dot={{ r: 5, strokeWidth: 2 }}
                        activeDot={{ r: 8, strokeWidth: 2 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="withdrawals" 
                        stroke="#FF8042" 
                        name="Withdrawals"
                        strokeWidth={3}
                        dot={{ r: 5, strokeWidth: 2 }}
                        activeDot={{ r: 8, strokeWidth: 2 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="net" 
                        stroke="#8884d8" 
                        name="Net Balance"
                        strokeWidth={3}
                        strokeDasharray="5 5"
                        dot={{ r: 5, strokeWidth: 2 }}
                        activeDot={{ r: 8, strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              ) : (
                <Box sx={{ height: 350, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                    No weekly data available for {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Row 4: Class Distribution (Full Width) - CHANGED TO AREA CHART */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <Card sx={{ 
            borderRadius: 2,
            backgroundColor: themeStyles.cardBg,
            border: `1px solid ${themeStyles.cardBorder}`
          }}>
            <CardContent>
              <Typography variant="h6" sx={{ 
                color: themeStyles.textColor, 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1,
                mb: 2
              }}>
                <TimelineIcon /> Class Distribution Trend (Last 6 Months)
              </Typography>
              
              {classTrendData.length > 0 ? (
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
                  <Box sx={{ flex: 2, height: 350 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={classTrendData}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#334155' : '#e5e7eb'} />
                        <XAxis 
                          dataKey="month" 
                          stroke={themeStyles.textColor}
                          tick={{ fontSize: 12 }}
                        />
                        <YAxis 
                          stroke={themeStyles.textColor}
                          tick={{ fontSize: 12 }}
                        />
                        <Tooltip content={<CustomClassTooltip />} />
                        <Legend />
                        <Area 
                          type="monotone" 
                          dataKey="user" 
                          stackId="1"
                          stroke="#3c8dbc" 
                          fill="#3c8dbc" 
                          fillOpacity={0.6}
                          name="User Transactions"
                        />
                        <Area 
                          type="monotone" 
                          dataKey="agent" 
                          stackId="1"
                          stroke="#00C49F" 
                          fill="#00C49F" 
                          fillOpacity={0.6}
                          name="Agent Transactions"
                        />
                        <Area 
                          type="monotone" 
                          dataKey="admin" 
                          stackId="1"
                          stroke="#FFBB28" 
                          fill="#FFBB28" 
                          fillOpacity={0.6}
                          name="Admin Transactions"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </Box>
                  
                  <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box sx={{ 
                      p: 2,
                      borderRadius: 2,
                      backgroundColor: theme === 'dark' ? '#1e293b' : '#f8f9fa',
                      borderLeft: `4px solid #3c8dbc`
                    }}>
                      <Typography variant="subtitle1" sx={{ 
                        fontWeight: 'bold',
                        color: themeStyles.textColor,
                        mb: 1
                      }}>
                        User Class
                      </Typography>
                      <Typography variant="h5" sx={{ color: '#3c8dbc', fontWeight: 'bold' }}>
                        {classData.find(c => c.name === 'User')?.count || 0}
                      </Typography>
                      <Typography variant="body2" sx={{ 
                        color: theme === 'dark' ? '#a8b2d1' : '#666666'
                      }}>
                        Total Transactions
                      </Typography>
                    </Box>
                    
                    <Box sx={{ 
                      p: 2,
                      borderRadius: 2,
                      backgroundColor: theme === 'dark' ? '#1e293b' : '#f8f9fa',
                      borderLeft: `4px solid #00C49F`
                    }}>
                      <Typography variant="subtitle1" sx={{ 
                        fontWeight: 'bold',
                        color: themeStyles.textColor,
                        mb: 1
                      }}>
                        Agent Class
                      </Typography>
                      <Typography variant="h5" sx={{ color: '#00C49F', fontWeight: 'bold' }}>
                        {classData.find(c => c.name === 'Agent')?.count || 0}
                      </Typography>
                      <Typography variant="body2" sx={{ 
                        color: theme === 'dark' ? '#a8b2d1' : '#666666'
                      }}>
                        Total Transactions
                      </Typography>
                    </Box>
                    
                    <Box sx={{ 
                      p: 2,
                      borderRadius: 2,
                      backgroundColor: theme === 'dark' ? '#1e293b' : '#f8f9fa',
                      borderLeft: `4px solid #FFBB28`
                    }}>
                      <Typography variant="subtitle1" sx={{ 
                        fontWeight: 'bold',
                        color: themeStyles.textColor,
                        mb: 1
                      }}>
                        Admin Class
                      </Typography>
                      <Typography variant="h5" sx={{ color: '#FFBB28', fontWeight: 'bold' }}>
                        {classData.find(c => c.name === 'Admin')?.count || 0}
                      </Typography>
                      <Typography variant="body2" sx={{ 
                        color: theme === 'dark' ? '#a8b2d1' : '#666666'
                      }}>
                        Total Transactions
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              ) : (
                <Box sx={{ height: 350, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                    No class trend data available
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </Box>

      {/* Export Modal */}
      <Dialog 
        open={openExportModal} 
        onClose={() => setOpenExportModal(false)} 
        maxWidth="lg" 
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: { 
            borderRadius: 2,
            backgroundColor: themeStyles.cardBg,
            color: themeStyles.textColor,
            maxHeight: '90vh',
            overflow: 'hidden'
          }
        }}
      >
        <DialogTitle sx={{ 
          borderBottom: `1px solid ${themeStyles.cardBorder}`,
          py: 3,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Export Transaction Report
          </Typography>
          <IconButton onClick={() => setOpenExportModal(false)} sx={{ color: themeStyles.textColor }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent sx={{ p: 3, overflowY: 'auto' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Filter Summary */}
            <Paper sx={{ p: 3, backgroundColor: theme === 'dark' ? '#1e293b' : '#f8f9fa', borderRadius: 1 }}>
              <Typography variant="subtitle1" sx={{ 
                mb: 2,
                color: themeStyles.textColor,
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}>
                📋 Report Summary
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                    Total Transactions
                  </Typography>
                  <Typography variant="h6">
                    {pagination.totalRecords}
                  </Typography>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                    Total Amount
                  </Typography>
                  <Typography variant="h6">
                    {formatCurrency(transactions.reduce((sum, tx) => sum + tx.amount, 0))}
                  </Typography>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                    Date Range
                  </Typography>
                  <Typography variant="body2">
                    {filters.startDate ? new Date(filters.startDate).toLocaleDateString() : 'All time'} to{' '}
                    {filters.endDate ? new Date(filters.endDate).toLocaleDateString() : 'Now'}
                  </Typography>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                    Generated
                  </Typography>
                  <Typography variant="body2">
                    {new Date().toLocaleString()}
                  </Typography>
                </Box>
              </Box>
            </Paper>

            {/* Preview */}
            <Paper sx={{ p: 3, backgroundColor: theme === 'dark' ? '#1e293b' : '#f8f9fa', borderRadius: 1 }}>
              <Typography variant="subtitle1" sx={{ 
                mb: 2,
                color: themeStyles.textColor,
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}>
                👁️ Preview (First 3 records)
              </Typography>
              
              {transactions.slice(0, 3).map((tx, index) => (
                <Paper key={tx._id} sx={{ 
                  p: 2, 
                  mb: 2, 
                  backgroundColor: theme === 'dark' ? '#0f172a' : 'white',
                  border: `1px solid ${themeStyles.cardBorder}`,
                  borderRadius: 1
                }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      {tx.reference}
                    </Typography>
                    <Chip
                      label={tx.type.toUpperCase()}
                      size="small"
                      sx={{
                        backgroundColor: tx.type === 'deposit' 
                          ? (theme === 'dark' ? '#00ffff20' : '#007bff20')
                          : (theme === 'dark' ? '#ff000020' : '#dc354520'),
                        color: tx.type === 'deposit' 
                          ? (theme === 'dark' ? '#00ffff' : '#007bff')
                          : (theme === 'dark' ? '#ff0000' : '#dc3545'),
                      }}
                    />
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="caption" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                        Amount:
                      </Typography>
                      <Typography variant="body2">
                        {formatCurrency(tx.amount)}
                      </Typography>
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="caption" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                        Status:
                      </Typography>
                      <Typography variant="body2">
                        {tx.status}
                      </Typography>
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="caption" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                        Method:
                      </Typography>
                      <Typography variant="body2">
                        {tx.method}
                      </Typography>
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="caption" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                        Date:
                      </Typography>
                      <Typography variant="body2">
                        {new Date(tx.createdAt).toLocaleDateString()}
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
              ))}
              
              {transactions.length > 3 && (
                <Typography variant="body2" color={theme === 'dark' ? '#a8b2d1' : '#666666'} sx={{ textAlign: 'center', mt: 2 }}>
                  + {transactions.length - 3} more records will be included in the export
                </Typography>
              )}
            </Paper>
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ p: 3, borderTop: `1px solid ${themeStyles.cardBorder}` }}>
          <Button 
            onClick={() => setOpenExportModal(false)}
            sx={{
              color: themeStyles.primaryColor,
              '&:hover': {
                backgroundColor: theme === 'dark' ? '#00ffff20' : '#007bff10'
              }
            }}
          >
            Cancel
          </Button>
          
          {transactions.length > 0 ? (
            <PDFDownloadLink
              document={<TransactionReportPDF transactions={transactions} filters={chartFilters} />}
              fileName={`transaction_report_${new Date().toISOString().slice(0, 10)}.pdf`}
              className="no-underline"
            >
              {({ loading }) => (
                <Button
                  variant="contained"
                  startIcon={<PdfIcon />}
                  disabled={loading}
                  sx={{
                    background: theme === 'dark'
                      ? 'linear-gradient(135deg, #00ff00, #00b300)'
                      : 'linear-gradient(135deg, #28a745, #218838)',
                    borderRadius: 1,
                    '&:hover': {
                      background: theme === 'dark'
                        ? 'linear-gradient(135deg, #00b300, #008000)'
                        : 'linear-gradient(135deg, #218838, #1e7e34)'
                    },
                    '&.Mui-disabled': {
                      background: theme === 'dark' ? '#334155' : '#e5e7eb',
                      color: theme === 'dark' ? '#94a3b8' : '#94a3b8'
                    }
                  }}
                >
                  {loading ? 'Preparing PDF...' : 'Download PDF Report'}
                </Button>
              )}
            </PDFDownloadLink>
          ) : (
            <Button
              variant="contained"
              disabled
              sx={{
                background: theme === 'dark' ? '#334155' : '#e5e7eb',
                color: theme === 'dark' ? '#94a3b8' : '#94a3b8',
                borderRadius: 1,
              }}
            >
              No Data to Export
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* View Transaction Modal */}
      <Dialog 
        open={openViewModal} 
        onClose={() => setOpenViewModal(false)} 
        maxWidth="md" 
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: { 
            borderRadius: 2,
            backgroundColor: themeStyles.cardBg,
            color: themeStyles.textColor,
            maxHeight: '90vh',
            overflow: 'hidden'
          }
        }}
      >
        {selectedTransaction && (
          <>
            <DialogTitle sx={{ 
              borderBottom: `1px solid ${themeStyles.cardBorder}`,
              py: 3,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                Transaction Details
              </Typography>
              <IconButton onClick={() => setOpenViewModal(false)} sx={{ color: themeStyles.textColor }}>
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            
            <DialogContent sx={{ p: 3, overflowY: 'auto' }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
                  <Paper sx={{ flex: 1, p: 2, backgroundColor: theme === 'dark' ? '#1e293b' : '#f8f9fa', borderRadius: 1 }}>
                    <Typography variant="subtitle2" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                      Transaction ID
                    </Typography>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                      {selectedTransaction._id}
                    </Typography>
                  </Paper>
                  
                  <Paper sx={{ flex: 1, p: 2, backgroundColor: theme === 'dark' ? '#1e293b' : '#f8f9fa', borderRadius: 1 }}>
                    <Typography variant="subtitle2" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                      Reference
                    </Typography>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                      {selectedTransaction.reference}
                    </Typography>
                  </Paper>
                </Box>
                
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
                  <Paper sx={{ flex: 1, p: 2, backgroundColor: theme === 'dark' ? '#1e293b' : '#f8f9fa', borderRadius: 1 }}>
                    <Typography variant="subtitle2" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                      Amount
                    </Typography>
                    <Typography variant="h6" sx={{ 
                      color: selectedTransaction.type === 'deposit' 
                        ? (theme === 'dark' ? '#00ff00' : '#28a745')
                        : (theme === 'dark' ? '#ff0000' : '#dc3545')
                    }}>
                      {formatCurrency(selectedTransaction.amount)}
                    </Typography>
                    <Typography variant="caption" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                      {selectedTransaction.amountInString}
                    </Typography>
                  </Paper>
                  
                  <Paper sx={{ flex: 1, p: 2, backgroundColor: theme === 'dark' ? '#1e293b' : '#f8f9fa', borderRadius: 1 }}>
                    <Typography variant="subtitle2" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                      Type & Status
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                      <Chip
                        label={selectedTransaction.type.toUpperCase()}
                        size="small"
                        sx={{
                          backgroundColor: selectedTransaction.type === 'deposit' 
                            ? (theme === 'dark' ? '#00ffff20' : '#007bff20')
                            : (theme === 'dark' ? '#ff000020' : '#dc354520'),
                          color: selectedTransaction.type === 'deposit' 
                            ? (theme === 'dark' ? '#00ffff' : '#007bff')
                            : (theme === 'dark' ? '#ff0000' : '#dc3545'),
                        }}
                      />
                      <Chip
                        label={selectedTransaction.status.toUpperCase()}
                        size="small"
                        sx={{
                          backgroundColor: `${getStatusColor(selectedTransaction.status)}20`,
                          color: getStatusColor(selectedTransaction.status),
                        }}
                      />
                    </Box>
                  </Paper>
                </Box>
                
                <Paper sx={{ p: 2, backgroundColor: theme === 'dark' ? '#1e293b' : '#f8f9fa', borderRadius: 1 }}>
                  <Typography variant="subtitle2" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                    User Information
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mt: 1 }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="caption" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                        Name
                      </Typography>
                      <Typography variant="body2">
                        {selectedTransaction.userId?.name || 'Unknown'}
                      </Typography>
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="caption" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                        Phone
                      </Typography>
                      <Typography variant="body2">
                        {selectedTransaction.userId?.phone}
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
                
                <Paper sx={{ p: 2, backgroundColor: theme === 'dark' ? '#1e293b' : '#f8f9fa', borderRadius: 1 }}>
                  <Typography variant="subtitle2" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                    Dates
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mt: 1 }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="caption" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                        Created
                      </Typography>
                      <Typography variant="body2">
                        {new Date(selectedTransaction.createdAt).toLocaleString()}
                      </Typography>
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="caption" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                        Updated
                      </Typography>
                      <Typography variant="body2">
                        {new Date(selectedTransaction.updatedAt).toLocaleString()}
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
                
                {selectedTransaction.description && (
                  <Paper sx={{ p: 2, backgroundColor: theme === 'dark' ? '#1e293b' : '#f8f9fa', borderRadius: 1 }}>
                    <Typography variant="subtitle2" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                      Description
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      {selectedTransaction.description}
                    </Typography>
                  </Paper>
                )}
              </Box>
            </DialogContent>
            
            <DialogActions sx={{ p: 3, borderTop: `1px solid ${themeStyles.cardBorder}` }}>
              <Button 
                onClick={() => setOpenViewModal(false)}
                sx={{
                  color: themeStyles.primaryColor,
                  '&:hover': {
                    backgroundColor: theme === 'dark' ? '#00ffff20' : '#007bff10'
                  }
                }}
              >
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Snackbar for messages */}
      <Snackbar 
        open={!!message} 
        autoHideDuration={6000} 
        onClose={() => setMessage(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          severity={message?.type} 
          onClose={() => setMessage(null)}
          sx={{ 
            borderRadius: 1,
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            backgroundColor: theme === 'dark' ? '#0f172a' : 'white',
            color: message?.type === 'success' 
              ? (theme === 'dark' ? '#00ff00' : '#28a745')
              : (theme === 'dark' ? '#ff0000' : '#dc3545')
          }}
        >
          {message?.text}
        </Alert>
      </Snackbar>
    </div>
  );
}