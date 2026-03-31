'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Box, Typography, Card, CardContent,
  TextField, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow,
  Chip, Alert, Snackbar, CircularProgress,
  useMediaQuery, Pagination,
  MenuItem, Select, FormControl, InputLabel,
  IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, Button, Avatar,
  FormControlLabel, Autocomplete, Divider,
  Paper, Stack, ToggleButton, ToggleButtonGroup,
  LinearProgress, Badge, Tooltip,
  Popover, Collapse, Grid
} from '@mui/material';
import { motion } from 'framer-motion';
import { useTheme } from '@/lib/theme-context';
import {
  AccountBalanceWallet, AttachMoney, TrendingUp, TrendingDown,
  Add, Delete, Edit, FilterList,
  ExpandMore, ExpandLess, Search,
  CalendarToday, Category, Description,
  CheckCircle, Pending, Cancel,
  Download, Visibility, Refresh,
  ArrowUpward, ArrowDownward,
  PieChart, Timeline,
  MoreVert, Print, FileDownload,
  DateRange, Person, Receipt,
  Money, CreditCard, Savings,
  ShoppingCart, Restaurant, LocalHospital,
  School, Home, DirectionsCar,
  SportsEsports, Flight,
  LocalGroceryStore, Work,
  Payment, AccountBalance, EuroSymbol,
  CurrencyExchange, Analytics,
  AccessTime,
  GifBox,
  NavigateBefore,
  NavigateNext,
  Today,
  DateRange as DateRangeIcon,
  ShowChart,
  PictureAsPdf,
  TableChart,
  InsertChart,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Timeline as TimelineIcon,
  MultilineChart,
  StackedLineChart,
  Close
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import api from '@/app/utils/api';
import { 
  format, 
  subDays, 
  addDays, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  addYears,
  subYears,
  getWeek,
  getWeekOfMonth,
  startOfYear,
  endOfYear,
  eachMonthOfInterval,
  differenceInDays,
  isSameMonth,
  isSameYear,
  parseISO,
  eachWeekOfInterval,
  eachMonthOfInterval as eachMonthOfIntervalFn
} from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, AreaChart, Area, BarChart, Bar } from 'recharts';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface WalletTransaction {
  _id: string;
  date: string;
  type: 'INCOME' | 'EXPENSE';
  category: string;
  source: string;
  amount: number;
  description?: string;
  status: 'CONFIRMED' | 'PENDING' | 'CANCELLED';
  createdBy: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
  formattedDate?: string;
}

interface WalletSummary {
  totalIncome: number;
  totalExpense: number;
  totalTransactions: number;
  balance: number;
}

interface PaginationData {
  currentPage: number;
  totalPages: number;
  totalTransactions: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface FilterOptions {
  categories: string[];
  sources: string[];
  types: string[];
  statuses: string[];
}

interface DailyStat {
  date: string;
  day: string;
  dateStr: string;
  income: number;
  expense: number;
  balance: number;
}

interface WeeklyStat {
  weekNumber: number;
  startDate: string;
  endDate: string;
  label: string;
  income: number;
  expense: number;
  balance: number;
  transactions: number;
}

interface MonthlyStat {
  month: number;
  monthName: string;
  year: number;
  income: number;
  expense: number;
  balance: number;
  transactions: number;
}

interface DailyStatistics {
  days: DailyStat[];
  summary: WalletSummary;
  period: {
    startDate: string;
    endDate: string;
    year: number;
    month: number;
    week: number;
  };
}

interface WeeklyStatistics {
  weeks: WeeklyStat[];
  summary: WalletSummary;
  period: {
    startDate: string;
    endDate: string;
    year: number;
    month: number;
  };
}

interface MonthlyStatistics {
  months: MonthlyStat[];
  summary: WalletSummary;
  period: {
    startDate: string;
    endDate: string;
    year: number;
  };
}

interface WalletFormData {
  date: Date | null;
  type: 'INCOME' | 'EXPENSE';
  category: string;
  source: string;
  amount: number | '';
  description: string;
  status: 'CONFIRMED' | 'PENDING' | 'CANCELLED';
}

// Predefined categories with icons
const expenseCategories = [
  { value: 'FOOD', label: 'Food & Dining', icon: <Restaurant /> },
  { value: 'TRANSPORTATION', label: 'Transportation', icon: <DirectionsCar /> },
  { value: 'SHOPPING', label: 'Shopping', icon: <ShoppingCart /> },
  { value: 'ENTERTAINMENT', label: 'Entertainment', icon: <SportsEsports /> },
  { value: 'HEALTHCARE', label: 'Healthcare', icon: <LocalHospital /> },
  { value: 'EDUCATION', label: 'Education', icon: <School /> },
  { value: 'HOUSING', label: 'Housing', icon: <Home /> },
  { value: 'UTILITIES', label: 'Utilities', icon: <Home /> },
  { value: 'TRAVEL', label: 'Travel', icon: <Flight /> },
  { value: 'GROCERIES', label: 'Groceries', icon: <LocalGroceryStore /> },
  { value: 'SUBSCRIPTIONS', label: 'Subscriptions', icon: <Payment /> },
  { value: 'OTHER_EXPENSE', label: 'Other Expense', icon: <MoreVert /> }
];

const incomeCategories = [
  { value: 'SALARY', label: 'Salary', icon: <Work /> },
  { value: 'FREELANCE', label: 'Freelance', icon: <Work /> },
  { value: 'INVESTMENT', label: 'Investment', icon: <TrendingUp /> },
  { value: 'GIFT', label: 'Gift', icon: <GifBox /> },
  { value: 'REFUND', label: 'Refund', icon: <Payment /> },
  { value: 'SALES', label: 'Sales', icon: <AccountBalance /> },
  { value: 'OTHER_INCOME', label: 'Other Income', icon: <MoreVert /> }
];

const sources = [
  'Cash',
  'Bank Transfer',
  'Credit Card',
  'Debit Card',
  'Mobile Payment',
  'Online Payment',
  'Check',
  'Other'
];

const statusOptions = [
  { value: 'CONFIRMED', label: 'Confirmed', color: 'success' },
  { value: 'PENDING', label: 'Pending', color: 'warning' },
  { value: 'CANCELLED', label: 'Cancelled', color: 'error' }
];

const WalletPage = () => {
  const { theme } = useTheme();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const isTablet = useMediaQuery('(max-width: 1024px)');
  
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [summary, setSummary] = useState<WalletSummary>({
    totalIncome: 0,
    totalExpense: 0,
    totalTransactions: 0,
    balance: 0
  });
  const [dailyStats, setDailyStats] = useState<DailyStatistics | null>(null);
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStatistics | null>(null);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStatistics | null>(null);
  const [categoryStats, setCategoryStats] = useState<any[]>([]);
  const [sourceStats, setSourceStats] = useState<any[]>([]);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    categories: [],
    sources: [],
    types: ['INCOME', 'EXPENSE'],
    statuses: ['CONFIRMED', 'PENDING', 'CANCELLED']
  });
  const [loading, setLoading] = useState(true);
  const [loadingStats, setLoadingStats] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [pagination, setPagination] = useState<PaginationData>({
    currentPage: 1,
    totalPages: 1,
    totalTransactions: 0,
    hasNext: false,
    hasPrev: false
  });

  // Filter states
  const [filters, setFilters] = useState({
    search: '',
    type: '',
    category: '',
    status: '',
    source: '',
    startDate: '',
    endDate: '',
    sortBy: '-date',
    sortOrder: 'desc',
    page: 1,
    limit: 10
  });

  // Dialog states
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<WalletTransaction | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'stats'>('list');
  
  // Chart navigation states - FIXED: Use proper initial values
  const [dailyPeriod, setDailyPeriod] = useState<Date>(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [weeklyPeriod, setWeeklyPeriod] = useState<Date>(() => startOfMonth(new Date()));
  const [monthlyPeriod, setMonthlyPeriod] = useState<Date>(() => new Date(new Date().getFullYear(), 0, 1));
  
  // Mobile filter state
  const [showFilters, setShowFilters] = useState(false);
  
  // Tooltip state
  const [tooltip, setTooltip] = useState<{
    open: boolean;
    anchorEl: HTMLElement | null;
    data: any;
  }>({
    open: false,
    anchorEl: null,
    data: null
  });

  // Form state - FIXED: Use useMemo for stable references
  const [formData, setFormData] = useState<WalletFormData>({
    date: new Date(),
    type: 'EXPENSE',
    category: '',
    source: '',
    amount: '',
    description: 'add reason',
    status: 'CONFIRMED'
  });

  // Refs for form fields
  const amountRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLInputElement>(null);

  // Ref for PDF export
  const transactionsRef = useRef<HTMLDivElement>(null);

  // Theme styles
  const themeStyles = useMemo(() => ({
    background: theme === 'dark' 
      ? 'linear-gradient(135deg, #0a192f, #112240)' 
      : 'linear-gradient(135deg, #f0f0f0, #ffffff)',
    textColor: theme === 'dark' ? '#ccd6f6' : '#333333',
    primaryColor: theme === 'dark' ? '#00ffff' : '#007bff',
    borderColor: theme === 'dark' ? '#00ffff' : '#007bff',
    surface: theme === 'dark' ? '#1e293b' : '#ffffff',
    cardBg: theme === 'dark' ? '#0f172a80' : '#ffffff',
    cardBorder: theme === 'dark' ? '#334155' : '#e5e7eb',
    headerBg: theme === 'dark' 
      ? 'linear-gradient(135deg, #00ffff, #00b3b3)' 
      : 'linear-gradient(135deg, #007bff, #0056b3)',
    hoverBg: theme === 'dark' ? '#1e293b' : '#f8fafc',
    incomeColor: theme === 'dark' ? '#00ff00' : '#28a745',
    expenseColor: theme === 'dark' ? '#ff0000' : '#dc3545',
    balanceColor: theme === 'dark' ? '#00ffff' : '#17a2b8',
    chartGrid: theme === 'dark' ? '#334155' : '#e5e7eb',
    chartText: theme === 'dark' ? '#a8b2d1' : '#666666'
  }), [theme]);

  // MUI styles
  const labelStyle = useMemo(() => ({
    color: theme === 'dark' ? '#a8b2d1' : '#666666',
    '&.Mui-focused': {
      color: theme === 'dark' ? '#00ffff' : '#007bff',
    }
  }), [theme]);

  const selectStyle = useMemo(() => ({
    borderRadius: 1,
    backgroundColor: theme === 'dark' ? '#1e293b' : 'white',
    color: theme === 'dark' ? '#ccd6f6' : '#333333',
    '& .MuiOutlinedInput-notchedOutline': {
      borderColor: theme === 'dark' ? '#334155' : '#e5e7eb',
    },
    '&:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: theme === 'dark' ? '#00ffff' : '#007bff',
    },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: theme === 'dark' ? '#00ffff' : '#007bff',
    }
  }), [theme]);

  const textFieldStyle = useMemo(() => ({
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
    },
    '& .MuiInputLabel-root.Mui-focused': {
      color: theme === 'dark' ? '#00ffff' : '#007bff',
    },
    '& .MuiFormHelperText-root': {
      color: theme === 'dark' ? '#ff6b6b' : '#dc3545',
    }
  }), [theme]);

  const datePickerStyle = useMemo(() => ({
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
    },
    '& .MuiInputLabel-root.Mui-focused': {
      color: theme === 'dark' ? '#00ffff' : '#007bff',
    }
  }), [theme]);

  // Summary cards
  const summaryCards = useMemo(() => [
    {
      title: 'Total Balance',
      value: `$${summary.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: <AccountBalanceWallet sx={{ fontSize: 28 }} />,
      color: themeStyles.balanceColor,
      change: '+12.5%',
      trend: 'up'
    },
    {
      title: 'Total Income',
      value: `$${summary.totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: <TrendingUp sx={{ fontSize: 28 }} />,
      color: themeStyles.incomeColor,
      change: '+8.2%',
      trend: 'up'
    },
    {
      title: 'Total Expense',
      value: `$${summary.totalExpense.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: <TrendingDown sx={{ fontSize: 28 }} />,
      color: themeStyles.expenseColor,
      change: '-3.4%',
      trend: 'down'
    },
    {
      title: 'Transactions',
      value: summary.totalTransactions.toLocaleString(),
      icon: <Receipt sx={{ fontSize: 28 }} />,
      color: theme === 'dark' ? '#ff00ff' : '#9333ea',
      change: '+15.7%',
      trend: 'up'
    }
  ], [summary, themeStyles, theme]);

  // Custom Tooltip for Recharts
  const CustomTooltip = useCallback(({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <Card sx={{ 
          p: 2, 
          borderRadius: 2,
          backgroundColor: theme === 'dark' ? '#1e293b' : 'white',
          border: `1px solid ${theme === 'dark' ? '#334155' : '#e5e7eb'}`,
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          <Typography variant="subtitle2" sx={{ 
            fontWeight: 'bold', 
            mb: 1,
            color: theme === 'dark' ? '#ccd6f6' : '#333333'
          }}>
            {label}
          </Typography>
          {payload.map((entry: any, index: number) => (
            <Box key={index} sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1, 
              mb: 0.5 
            }}>
              <Box sx={{ 
                width: 12, 
                height: 12, 
                borderRadius: '50%', 
                backgroundColor: entry.color 
              }} />
              <Typography variant="body2" sx={{ 
                color: theme === 'dark' ? '#a8b2d1' : '#666666',
                minWidth: 80 
              }}>
                {entry.dataKey}:
              </Typography>
              <Typography variant="body2" sx={{ 
                fontWeight: 'bold',
                color: theme === 'dark' ? '#ccd6f6' : '#333333'
              }}>
                {`$${entry.value.toFixed(2)}`}
              </Typography>
            </Box>
          ))}
        </Card>
      );
    }
    return null;
  }, [theme]);

  // Helper components
  const FormRow = useCallback(({ children, columns = 1, spacing = 2 }: { 
    children: React.ReactNode; 
    columns?: 1 | 2 | 3 | 4;
    spacing?: number;
  }) => {
    return (
      <Box sx={{ 
        display: 'grid',
        gridTemplateColumns: { 
          xs: '1fr',
          sm: columns === 1 ? '1fr' : `repeat(${Math.min(columns, 2)}, 1fr)`,
          md: columns === 1 ? '1fr' : `repeat(${Math.min(columns, 3)}, 1fr)`,
          lg: columns === 1 ? '1fr' : `repeat(${columns}, 1fr)`
        },
        gap: spacing,
        mb: 3
      }}>
        {children}
      </Box>
    );
  }, []);

  const renderFormSection = useCallback((title: string, icon: React.ReactNode, content: React.ReactNode) => (
    <>
      <Typography variant="h6" sx={{ 
        color: theme === 'dark' ? '#00ffff' : '#007bff', 
        mb: 2,
        display: 'flex',
        alignItems: 'center',
        gap: 1
      }}>
        {icon} {title}
      </Typography>
      {content}
      <Divider sx={{ my: 3 }} />
    </>
  ), [theme]);

  // Fetch data
  useEffect(() => {
    fetchTransactions();
    fetchFilterOptions();
    if (viewMode === 'stats') {
      fetchAllStatistics();
    }
  }, [filters.page, filters.limit, filters.type, filters.category, filters.status, filters.source, filters.search, filters.startDate, filters.endDate, viewMode]);

  useEffect(() => {
    if (viewMode === 'stats') {
      fetchAllStatistics();
    }
  }, [dailyPeriod, weeklyPeriod, monthlyPeriod]);

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value.toString());
      });

      const response = await api.get(`/wallet?${params}`);
      setTransactions(response.data.data.transactions || []);
      setSummary(response.data.data.summary || {
        totalIncome: 0,
        totalExpense: 0,
        totalTransactions: 0,
        balance: 0
      });
      setPagination(response.data.data.pagination || {
        currentPage: 1,
        totalPages: 1,
        totalTransactions: 0,
        hasNext: false,
        hasPrev: false
      });
      setError('');
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to fetch transactions');
      setTransactions([]);
      setSummary({
        totalIncome: 0,
        totalExpense: 0,
        totalTransactions: 0,
        balance: 0
      });
      setPagination({
        currentPage: 1,
        totalPages: 1,
        totalTransactions: 0,
        hasNext: false,
        hasPrev: false
      });
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const fetchAllStatistics = useCallback(async () => {
    try {
      setLoadingStats(true);
      
      // Fetch daily statistics for current week
      const weekStart = dailyPeriod;
      const weekEnd = endOfWeek(dailyPeriod, { weekStartsOn: 1 });
      const weekNumber = getWeek(dailyPeriod, { weekStartsOn: 1 });
      const year = dailyPeriod.getFullYear();
      const month = dailyPeriod.getMonth() + 1;
      
      const dailyResponse = await api.get(`/wallet/stats/daily?year=${year}&month=${month}&week=${weekNumber}`);
      setDailyStats(dailyResponse.data.data);
      
      // Fetch weekly statistics for current month
      const weeklyYear = weeklyPeriod.getFullYear();
      const weeklyMonth = weeklyPeriod.getMonth() + 1;
      const weeklyResponse = await api.get(`/wallet/stats/weekly?year=${weeklyYear}&month=${weeklyMonth}`);
      setWeeklyStats(weeklyResponse.data.data);
      
      // Fetch monthly statistics for current year
      const monthlyYear = monthlyPeriod.getFullYear();
      const monthlyResponse = await api.get(`/wallet/stats/monthly?year=${monthlyYear}`);
      setMonthlyStats(monthlyResponse.data.data);
      
      // Fetch category and source statistics
      const statsResponse = await api.get('/wallet/stats');
      setCategoryStats(statsResponse.data.data.categoryStats || []);
      setSourceStats(statsResponse.data.data.sourceStats || []);
      
    } catch (error: any) {
      console.error('Failed to fetch statistics:', error);
      setDailyStats(null);
      setWeeklyStats(null);
      setMonthlyStats(null);
      setCategoryStats([]);
      setSourceStats([]);
    } finally {
      setLoadingStats(false);
    }
  }, [dailyPeriod, weeklyPeriod, monthlyPeriod]);

  const fetchFilterOptions = useCallback(async () => {
    try {
      const response = await api.get('/wallet/filter-options');
      setFilterOptions(response.data.data);
    } catch (error: any) {
      console.error('Failed to fetch filter options:', error);
    }
  }, []);

  const handleCreateTransaction = useCallback(async () => {
    try {
      if (!formData.category || !formData.source || !formData.amount) {
        setError('Category, source, and amount are required');
        return;
      }

      if (Number(formData.amount) <= 0) {
        setError('Amount must be greater than 0');
        return;
      }

      const transactionData = {
        ...formData,
        amount: Number(formData.amount),
        date: formData.date ? format(formData.date, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')
      };

      await api.post('/wallet', transactionData);
      
      setSuccess('Transaction created successfully');
      setOpenDialog(false);
      resetForm();
      fetchTransactions();
      if (viewMode === 'stats') {
        fetchAllStatistics();
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to create transaction');
    }
  }, [formData, fetchTransactions, fetchAllStatistics, viewMode]);

  const handleUpdateTransaction = useCallback(async () => {
    if (!selectedTransaction) return;

    try {
      if (!formData.category || !formData.source || !formData.amount) {
        setError('Category, source, and amount are required');
        return;
      }

      if (Number(formData.amount) <= 0) {
        setError('Amount must be greater than 0');
        return;
      }

      const transactionData = {
        ...formData,
        amount: Number(formData.amount),
        date: formData.date ? format(formData.date, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')
      };

      await api.put(`/wallet/${selectedTransaction._id}`, transactionData);
      
      setSuccess('Transaction updated successfully');
      setOpenDialog(false);
      resetForm();
      fetchTransactions();
      if (viewMode === 'stats') {
        fetchAllStatistics();
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to update transaction');
    }
  }, [formData, selectedTransaction, fetchTransactions, fetchAllStatistics, viewMode]);

  const handleStatusUpdate = useCallback(async (transactionId: string, status: string) => {
    try {
      await api.patch(`/wallet/${transactionId}/status`, { status });
      setSuccess(`Transaction status updated to ${status}`);
      fetchTransactions();
      if (viewMode === 'stats') {
        fetchAllStatistics();
      }
    } catch (error: any) {
      setError('Failed to update transaction status');
    }
  }, [fetchTransactions, fetchAllStatistics, viewMode]);

  const handleDeleteTransaction = useCallback(async () => {
    if (!selectedTransaction) return;

    try {
      await api.delete(`/wallet/${selectedTransaction._id}`);
      setSuccess('Transaction deleted successfully');
      setOpenDeleteDialog(false);
      setSelectedTransaction(null);
      fetchTransactions();
      if (viewMode === 'stats') {
        fetchAllStatistics();
      }
    } catch (error: any) {
      setError('Failed to delete transaction');
    }
  }, [selectedTransaction, fetchTransactions, fetchAllStatistics, viewMode]);

  const handleOpenEditDialog = useCallback((transaction: WalletTransaction) => {
    setSelectedTransaction(transaction);
    setIsEditMode(true);
    setFormData({
      date: new Date(transaction.date),
      type: transaction.type,
      category: transaction.category,
      source: transaction.source,
      amount: transaction.amount,
      description: transaction.description || '',
      status: transaction.status
    });
    setOpenDialog(true);
    
    // Focus on amount field when dialog opens
    setTimeout(() => {
      if (amountRef.current) {
        amountRef.current.focus();
        amountRef.current.select();
      }
    }, 100);
  }, []);

  const handleOpenViewDialog = useCallback((transaction: WalletTransaction) => {
    setSelectedTransaction(transaction);
    setOpenViewDialog(true);
  }, []);

  const handleOpenCreateDialog = useCallback(() => {
    setIsEditMode(false);
    resetForm();
    setOpenDialog(true);
    
    // Focus on amount field when dialog opens
    setTimeout(() => {
      if (amountRef.current) {
        amountRef.current.focus();
      }
    }, 100);
  }, []);

  const handleFilterChange = useCallback((field: string, value: string | number | Date | null) => {
    setFilters(prev => ({
      ...prev,
      [field]: value,
      ...(field !== 'page' && { page: 1 })
    }));
  }, []);

  const handlePageChange = useCallback((event: React.ChangeEvent<unknown>, value: number) => {
    handleFilterChange('page', value);
  }, [handleFilterChange]);

  const handleFormChange = useCallback((field: keyof WalletFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const resetForm = useCallback(() => {
    setFormData({
      date: new Date(),
      type: 'EXPENSE',
      category: '',
      source: '',
      amount: '',
      description: '',
      status: 'CONFIRMED'
    });
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      search: '',
      type: '',
      category: '',
      status: '',
      source: '',
      startDate: '',
      endDate: '',
      sortBy: '-date',
      sortOrder: 'desc',
      page: 1,
      limit: 10
    });
    setShowFilters(false);
  }, []);

  // Chart navigation handlers - FIXED: Proper week/month/year navigation
  const handleDailyPrev = useCallback(() => {
    setDailyPeriod(prev => subWeeks(prev, 1));
  }, []);

  const handleDailyNext = useCallback(() => {
    setDailyPeriod(prev => addWeeks(prev, 1));
  }, []);

  const handleWeeklyPrev = useCallback(() => {
    setWeeklyPeriod(prev => subMonths(prev, 1));
  }, []);

  const handleWeeklyNext = useCallback(() => {
    setWeeklyPeriod(prev => addMonths(prev, 1));
  }, []);

  const handleMonthlyPrev = useCallback(() => {
    setMonthlyPeriod(prev => subYears(prev, 1));
  }, []);

  const handleMonthlyNext = useCallback(() => {
    setMonthlyPeriod(prev => addYears(prev, 1));
  }, []);

  const formatDate = useCallback((dateString: string | Date) => {
    return format(new Date(dateString), 'MMMM dd, yyyy');
  }, []);

  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }, []);

  const getStatusIcon = useCallback((status: string) => {
    switch (status) {
      case 'CONFIRMED': return <CheckCircle fontSize="small" />;
      case 'PENDING': return <Pending fontSize="small" />;
      case 'CANCELLED': return <Cancel fontSize="small" />;
      default: return <CheckCircle fontSize="small" />;
    }
  }, []);

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'CONFIRMED': return 'success';
      case 'PENDING': return 'warning';
      case 'CANCELLED': return 'error';
      default: return 'default';
    }
  }, []);

  const getTypeIcon = useCallback((type: string) => {
    return type === 'INCOME' ? 
      <ArrowUpward sx={{ color: themeStyles.incomeColor }} /> : 
      <ArrowDownward sx={{ color: themeStyles.expenseColor }} />;
  }, [themeStyles]);

  const getCategoryIcon = useCallback((category: string) => {
    const allCategories = [...expenseCategories, ...incomeCategories];
    const cat = allCategories.find(c => c.value === category);
    return cat ? cat.icon : <Category />;
  }, []);

  const getCategoryLabel = useCallback((category: string) => {
    const allCategories = [...expenseCategories, ...incomeCategories];
    const cat = allCategories.find(c => c.value === category);
    return cat ? cat.label : category;
  }, []);

  // FIXED: Export functions
  const exportToCSV = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value && !['page', 'limit', 'sortBy', 'sortOrder'].includes(key)) {
          params.append(key, value.toString());
        }
      });

      const response = await api.get(`/wallet/export?${params}`);
      
      const csvContent = [
        ['Date', 'Type', 'Category', 'Source', 'Amount', 'Description', 'Status', 'Created By', 'Created At'],
        ...response.data.data.transactions.map((t: any) => [
          t.Date,
          t.Type,
          t.Category,
          t.Source,
          t.Amount,
          t.Description,
          t.Status,
          t['Created By'],
          t['Created At']
        ])
      ].map(row => row.join(',')).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `wallet-transactions-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      setSuccess('Transactions exported to CSV successfully');
    } catch (error: any) {
      setError('Failed to export transactions to CSV');
    }
  }, [filters]);

  const exportToPDF = useCallback(async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value && !['page', 'limit', 'sortBy', 'sortOrder'].includes(key)) {
          params.append(key, value.toString());
        }
      });

      const response = await api.get(`/wallet/export/pdf?${params}`);
      const transactions = response.data.data.transactions;

      const pdf = new jsPDF('landscape', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      pdf.setFontSize(20);
      pdf.setTextColor(50);
      pdf.text('Wallet Transactions Report', pageWidth / 2, 20, { align: 'center' });

      pdf.setFontSize(12);
      pdf.text(`Generated on: ${format(new Date(), 'MMMM dd, yyyy')}`, pageWidth / 2, 30, { align: 'center' });

      pdf.setFontSize(14);
      pdf.text('Summary', 20, 45);
      
      pdf.setFontSize(10);
      let yPos = 55;
      pdf.text(`Total Income: $${summary.totalIncome.toFixed(2)}`, 20, yPos);
      yPos += 8;
      pdf.text(`Total Expense: $${summary.totalExpense.toFixed(2)}`, 20, yPos);
      yPos += 8;
      pdf.text(`Net Balance: $${summary.balance.toFixed(2)}`, 20, yPos);
      yPos += 8;
      pdf.text(`Total Transactions: ${summary.totalTransactions}`, 20, yPos);

      yPos = 85;
      const headers = ['Date', 'Type', 'Category', 'Source', 'Amount', 'Status'];
      const columnWidths = [30, 25, 40, 40, 25, 25];
      let xPos = 20;

      pdf.setFillColor(240, 240, 240);
      pdf.rect(20, yPos - 5, pageWidth - 40, 8, 'F');
      
      headers.forEach((header, i) => {
        pdf.text(header, xPos, yPos);
        xPos += columnWidths[i];
      });

      yPos += 10;
      transactions.forEach((transaction: any, index: number) => {
        if (yPos > pageHeight - 20) {
          pdf.addPage();
          yPos = 20;
          
          xPos = 20;
          pdf.setFillColor(240, 240, 240);
          pdf.rect(20, yPos - 5, pageWidth - 40, 8, 'F');
          
          headers.forEach((header, i) => {
            pdf.text(header, xPos, yPos);
            xPos += columnWidths[i];
          });
          yPos += 10;
        }

        xPos = 20;
        const rowData = [
          transaction.Date,
          transaction.Type,
          transaction.Category,
          transaction.Source,
          transaction.Amount,
          transaction.Status
        ];

        rowData.forEach((data, i) => {
          pdf.text(data.toString(), xPos, yPos);
          xPos += columnWidths[i];
        });

        yPos += 8;
      });

      pdf.save(`wallet-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      
      setSuccess('Transactions exported to PDF successfully');
    } catch (error: any) {
      console.error('PDF export error:', error);
      setError('Failed to export transactions to PDF');
    } finally {
      setLoading(false);
    }
  }, [filters, summary]);

  // FIXED: Render daily chart with proper week handling
  const renderDailyChart = useCallback(() => {
    if (!dailyStats) return null;

    const weekStart = startOfWeek(dailyPeriod, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(dailyPeriod, { weekStartsOn: 1 });
    const weekNumber = getWeek(dailyPeriod, { weekStartsOn: 1 });

    const chartData = dailyStats.days.map(day => ({
      ...day,
      date: format(new Date(day.date), 'EEE dd')
    }));

    return (
      <Card sx={{ 
        borderRadius: 2, 
        boxShadow: theme === 'dark' 
          ? '0 4px 12px rgba(0,0,0,0.3)' 
          : '0 4px 12px rgba(0,0,0,0.08)',
        backgroundColor: theme === 'dark' ? '#0f172a80' : 'white',
        backdropFilter: theme === 'dark' ? 'blur(10px)' : 'none',
        height: '100%'
      }}>
        <CardContent>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            mb: 3,
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 2
          }}>
            <Typography variant="h6" sx={{ 
              fontWeight: 'bold',
              color: theme === 'dark' ? '#ccd6f6' : '#333333',
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              <Today /> Daily Overview - Week {weekNumber}
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton 
                size="small" 
                onClick={handleDailyPrev}
                sx={{ 
                  color: theme === 'dark' ? '#00ffff' : '#007bff',
                  '&:hover': {
                    backgroundColor: theme === 'dark' ? '#00ffff20' : '#007bff10'
                  }
                }}
              >
                <NavigateBefore />
              </IconButton>
              
              <Typography variant="body2" sx={{ 
                color: theme === 'dark' ? '#a8b2d1' : '#666666',
                minWidth: 200,
                textAlign: 'center'
              }}>
                {format(weekStart, 'MMM dd')} - {format(weekEnd, 'MMM dd, yyyy')}
              </Typography>
              
              <IconButton 
                size="small" 
                onClick={handleDailyNext}
                sx={{ 
                  color: theme === 'dark' ? '#00ffff' : '#007bff',
                  '&:hover': {
                    backgroundColor: theme === 'dark' ? '#00ffff20' : '#007bff10'
                  }
                }}
              >
                <NavigateNext />
              </IconButton>
            </Box>
          </Box>

          <Box sx={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke={themeStyles.chartGrid}
                />
                <XAxis 
                  dataKey="date" 
                  stroke={themeStyles.chartText}
                  tick={{ fill: themeStyles.chartText }}
                />
                <YAxis 
                  stroke={themeStyles.chartText}
                  tick={{ fill: themeStyles.chartText }}
                  tickFormatter={(value) => `$${value.toFixed(0)}`}
                />
                <RechartsTooltip 
                  content={<CustomTooltip />}
                  cursor={{ stroke: themeStyles.chartGrid, strokeWidth: 1 }}
                />
                <Legend 
                  wrapperStyle={{ color: themeStyles.chartText }}
                />
                <Line 
                  type="monotone" 
                  dataKey="income" 
                  name="Income"
                  stroke={themeStyles.incomeColor} 
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="expense" 
                  name="Expense"
                  stroke={themeStyles.expenseColor} 
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="balance" 
                  name="Balance"
                  stroke={themeStyles.balanceColor} 
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Box>

          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            mt: 2,
            pt: 2,
            borderTop: `1px solid ${themeStyles.chartGrid}`,
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 2
          }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="caption" color={themeStyles.chartText}>
                Total Income
              </Typography>
              <Typography variant="body1" sx={{ 
                fontWeight: 'bold',
                color: themeStyles.incomeColor
              }}>
                {formatCurrency(dailyStats?.summary?.totalIncome || 0)}
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="caption" color={themeStyles.chartText}>
                Total Expense
              </Typography>
              <Typography variant="body1" sx={{ 
                fontWeight: 'bold',
                color: themeStyles.expenseColor
              }}>
                {formatCurrency(dailyStats?.summary?.totalExpense || 0)}
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="caption" color={themeStyles.chartText}>
                Net Balance
              </Typography>
              <Typography variant="body1" sx={{ 
                fontWeight: 'bold',
                color: themeStyles.balanceColor
              }}>
                {formatCurrency(dailyStats?.summary?.balance || 0)}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    );
  }, [dailyStats, dailyPeriod, theme, themeStyles, handleDailyPrev, handleDailyNext, CustomTooltip, formatCurrency]);

  const renderWeeklyChart = useCallback(() => {
    if (!weeklyStats) return null;

    const monthStart = startOfMonth(weeklyPeriod);
    const monthEnd = endOfMonth(weeklyPeriod);
    const monthName = format(monthStart, 'MMMM yyyy');

    const chartData = weeklyStats.weeks.map(week => ({
      ...week,
      label: `Week ${week.weekNumber}`
    }));

    return (
      <Card sx={{ 
        borderRadius: 2, 
        boxShadow: theme === 'dark' 
          ? '0 4px 12px rgba(0,0,0,0.3)' 
          : '0 4px 12px rgba(0,0,0,0.08)',
        backgroundColor: theme === 'dark' ? '#0f172a80' : 'white',
        backdropFilter: theme === 'dark' ? 'blur(10px)' : 'none',
        height: '100%'
      }}>
        <CardContent>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            mb: 3,
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 2
          }}>
            <Typography variant="h6" sx={{ 
              fontWeight: 'bold',
              color: theme === 'dark' ? '#ccd6f6' : '#333333',
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              <DateRangeIcon /> Weekly Overview - {monthName}
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton 
                size="small" 
                onClick={handleWeeklyPrev}
                sx={{ 
                  color: theme === 'dark' ? '#00ffff' : '#007bff',
                  '&:hover': {
                    backgroundColor: theme === 'dark' ? '#00ffff20' : '#007bff10'
                  }
                }}
              >
                <NavigateBefore />
              </IconButton>
              
              <Typography variant="body2" sx={{ 
                color: theme === 'dark' ? '#a8b2d1' : '#666666',
                minWidth: 150,
                textAlign: 'center'
              }}>
                {format(monthStart, 'MMM dd')} - {format(monthEnd, 'MMM dd, yyyy')}
              </Typography>
              
              <IconButton 
                size="small" 
                onClick={handleWeeklyNext}
                sx={{ 
                  color: theme === 'dark' ? '#00ffff' : '#007bff',
                  '&:hover': {
                    backgroundColor: theme === 'dark' ? '#00ffff20' : '#007bff10'
                  }
                }}
              >
                <NavigateNext />
              </IconButton>
            </Box>
          </Box>

          <Box sx={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke={themeStyles.chartGrid}
                />
                <XAxis 
                  dataKey="label" 
                  stroke={themeStyles.chartText}
                  tick={{ fill: themeStyles.chartText }}
                />
                <YAxis 
                  stroke={themeStyles.chartText}
                  tick={{ fill: themeStyles.chartText }}
                  tickFormatter={(value) => `$${value.toFixed(0)}`}
                />
                <RechartsTooltip 
                  content={<CustomTooltip />}
                  cursor={{ fill: theme === 'dark' ? '#ffffff10' : '#00000010' }}
                />
                <Legend 
                  wrapperStyle={{ color: themeStyles.chartText }}
                />
                <Line 
                  type="monotone" 
                  dataKey="income" 
                  name="Income"
                  stroke={themeStyles.incomeColor}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="expense" 
                  name="Expense"
                  stroke={themeStyles.expenseColor}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="balance" 
                  name="Balance"
                  stroke={themeStyles.balanceColor}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Box>

          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            mt: 2,
            pt: 2,
            borderTop: `1px solid ${themeStyles.chartGrid}`,
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 2
          }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="caption" color={themeStyles.chartText}>
                Total Income
              </Typography>
              <Typography variant="body1" sx={{ 
                fontWeight: 'bold',
                color: themeStyles.incomeColor
              }}>
                {formatCurrency(weeklyStats?.summary?.totalIncome || 0)}
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="caption" color={themeStyles.chartText}>
                Total Expense
              </Typography>
              <Typography variant="body1" sx={{ 
                fontWeight: 'bold',
                color: themeStyles.expenseColor
              }}>
                {formatCurrency(weeklyStats?.summary?.totalExpense || 0)}
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="caption" color={themeStyles.chartText}>
                Net Balance
              </Typography>
              <Typography variant="body1" sx={{ 
                fontWeight: 'bold',
                color: themeStyles.balanceColor
              }}>
                {formatCurrency(weeklyStats?.summary?.balance || 0)}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    );
  }, [weeklyStats, weeklyPeriod, theme, themeStyles, handleWeeklyPrev, handleWeeklyNext, CustomTooltip, formatCurrency]);

  const renderMonthlyChart = useCallback(() => {
    if (!monthlyStats) return null;

    const year = monthlyPeriod.getFullYear();
    const chartData = monthlyStats.months.map(month => ({
      ...month,
      month: month.monthName.substring(0, 3)
    }));

    return (
      <Card sx={{ 
        borderRadius: 2, 
        boxShadow: theme === 'dark' 
          ? '0 4px 12px rgba(0,0,0,0.3)' 
          : '0 4px 12px rgba(0,0,0,0.08)',
        backgroundColor: theme === 'dark' ? '#0f172a80' : 'white',
        backdropFilter: theme === 'dark' ? 'blur(10px)' : 'none',
        height: '100%'
      }}>
        <CardContent>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            mb: 3,
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 2
          }}>
            <Typography variant="h6" sx={{ 
              fontWeight: 'bold',
              color: theme === 'dark' ? '#ccd6f6' : '#333333',
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              <CalendarToday /> Monthly Overview - {year}
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton 
                size="small" 
                onClick={handleMonthlyPrev}
                sx={{ 
                  color: theme === 'dark' ? '#00ffff' : '#007bff',
                  '&:hover': {
                    backgroundColor: theme === 'dark' ? '#00ffff20' : '#007bff10'
                  }
                }}
              >
                <NavigateBefore />
              </IconButton>
              
              <Typography variant="body2" sx={{ 
                color: theme === 'dark' ? '#a8b2d1' : '#666666',
                minWidth: 100,
                textAlign: 'center'
              }}>
                {year}
              </Typography>
              
              <IconButton 
                size="small" 
                onClick={handleMonthlyNext}
                sx={{ 
                  color: theme === 'dark' ? '#00ffff' : '#007bff',
                  '&:hover': {
                    backgroundColor: theme === 'dark' ? '#00ffff20' : '#007bff10'
                  }
                }}
              >
                <NavigateNext />
              </IconButton>
            </Box>
          </Box>

          <Box sx={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke={themeStyles.chartGrid}
                />
                <XAxis 
                  dataKey="month" 
                  stroke={themeStyles.chartText}
                  tick={{ fill: themeStyles.chartText }}
                />
                <YAxis 
                  stroke={themeStyles.chartText}
                  tick={{ fill: themeStyles.chartText }}
                  tickFormatter={(value) => `$${value.toFixed(0)}`}
                />
                <RechartsTooltip 
                  content={<CustomTooltip />}
                  cursor={{ stroke: themeStyles.chartGrid, strokeWidth: 1 }}
                />
                <Legend 
                  wrapperStyle={{ color: themeStyles.chartText }}
                />
                <Line 
                  type="monotone" 
                  dataKey="income" 
                  name="Income"
                  stroke={themeStyles.incomeColor}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="expense" 
                  name="Expense"
                  stroke={themeStyles.expenseColor}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="balance" 
                  name="Balance"
                  stroke={themeStyles.balanceColor}
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Box>

          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            mt: 2,
            pt: 2,
            borderTop: `1px solid ${themeStyles.chartGrid}`,
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 2
          }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="caption" color={themeStyles.chartText}>
                Total Income
              </Typography>
              <Typography variant="body1" sx={{ 
                fontWeight: 'bold',
                color: themeStyles.incomeColor
              }}>
                {formatCurrency(monthlyStats?.summary?.totalIncome || 0)}
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="caption" color={themeStyles.chartText}>
                Total Expense
              </Typography>
              <Typography variant="body1" sx={{ 
                fontWeight: 'bold',
                color: themeStyles.expenseColor
              }}>
                {formatCurrency(monthlyStats?.summary?.totalExpense || 0)}
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="caption" color={themeStyles.chartText}>
                Net Balance
              </Typography>
              <Typography variant="body1" sx={{ 
                fontWeight: 'bold',
                color: themeStyles.balanceColor
              }}>
                {formatCurrency(monthlyStats?.summary?.balance || 0)}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    );
  }, [monthlyStats, monthlyPeriod, theme, themeStyles, handleMonthlyPrev, handleMonthlyNext, CustomTooltip, formatCurrency]);

  const renderCategoryBreakdown = useCallback(() => {
    if (!categoryStats.length) return null;

    return (
      <Card sx={{ 
        borderRadius: 2, 
        boxShadow: theme === 'dark' 
          ? '0 4px 12px rgba(0,0,0,0.3)' 
          : '0 4px 12px rgba(0,0,0,0.08)',
        backgroundColor: theme === 'dark' ? '#0f172a80' : 'white',
        backdropFilter: theme === 'dark' ? 'blur(10px)' : 'none'
      }}>
        <CardContent>
          <Typography variant="h6" sx={{ 
            mb: 3, 
            fontWeight: 'bold',
            color: theme === 'dark' ? '#ccd6f6' : '#333333',
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}>
            <PieChart /> Category Breakdown
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {categoryStats.slice(0, 10).map((category, index) => (
              <Box key={category._id} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1,
                  flex: 1
                }}>
                  <Box sx={{ color: category.type === 'INCOME' ? themeStyles.incomeColor : themeStyles.expenseColor }}>
                    {getCategoryIcon(category._id)}
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" sx={{ color: theme === 'dark' ? '#ccd6f6' : '#333333' }}>
                      {getCategoryLabel(category._id)}
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={Math.min((category.totalAmount / Math.max(...categoryStats.map(c => c.totalAmount))) * 100, 100)}
                      sx={{ 
                        height: 6, 
                        borderRadius: 3,
                        backgroundColor: theme === 'dark' ? '#334155' : '#e5e7eb',
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: category.type === 'INCOME' ? themeStyles.incomeColor : themeStyles.expenseColor
                        }
                      }}
                    />
                  </Box>
                </Box>
                <Typography variant="body2" sx={{ 
                  fontWeight: 'bold',
                  color: category.type === 'INCOME' ? themeStyles.incomeColor : themeStyles.expenseColor
                }}>
                  {formatCurrency(category.totalAmount)}
                </Typography>
              </Box>
            ))}
          </Box>
        </CardContent>
      </Card>
    );
  }, [categoryStats, theme, themeStyles, getCategoryIcon, getCategoryLabel, formatCurrency]);

  const renderSourceAnalysis = useCallback(() => {
    if (!sourceStats.length) return null;

    return (
      <Card sx={{ 
        borderRadius: 2, 
        boxShadow: theme === 'dark' 
          ? '0 4px 12px rgba(0,0,0,0.3)' 
          : '0 4px 12px rgba(0,0,0,0.08)',
        backgroundColor: theme === 'dark' ? '#0f172a80' : 'white',
        backdropFilter: theme === 'dark' ? 'blur(10px)' : 'none'
      }}>
        <CardContent>
          <Typography variant="h6" sx={{ 
            mb: 3, 
            fontWeight: 'bold',
            color: theme === 'dark' ? '#ccd6f6' : '#333333',
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}>
            <CreditCard /> Source Analysis
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            {sourceStats.slice(0, 8).map((source, index) => (
              <Card key={source._id} sx={{ 
                flex: '1 1 calc(25% - 16px)', 
                minWidth: 150,
                borderRadius: 2,
                backgroundColor: theme === 'dark' ? '#1e293b' : '#f8f9fa',
                border: `1px solid ${theme === 'dark' ? '#334155' : '#e5e7eb'}`
              }}>
                <CardContent sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="body2" color={theme === 'dark' ? '#a8b2d1' : '#666666'} sx={{ mb: 1 }}>
                    {source._id}
                  </Typography>
                  <Typography variant="h6" sx={{ 
                    fontWeight: 'bold',
                    color: theme === 'dark' ? '#ccd6f6' : '#333333'
                  }}>
                    {formatCurrency(source.totalAmount)}
                  </Typography>
                  <Typography variant="caption" color={theme === 'dark' ? '#94a3b8' : '#999999'}>
                    {source.count} transaction{source.count !== 1 ? 's' : ''}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Box>
        </CardContent>
      </Card>
    );
  }, [sourceStats, theme, themeStyles, formatCurrency]);

  // Render statistics view
  const renderStatisticsView = useCallback(() => {
    if (loadingStats) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress size={60} sx={{ color: theme === 'dark' ? '#00ffff' : '#007bff' }} />
        </Box>
      );
    }

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Daily Chart */}
        {renderDailyChart()}

        {/* Weekly Chart */}
        {renderWeeklyChart()}

        {/* Monthly Chart */}
        {renderMonthlyChart()}

        {/* Category Breakdown */}
        {renderCategoryBreakdown()}

        {/* Source Analysis */}
        {renderSourceAnalysis()}
      </Box>
    );
  }, [loadingStats, theme, renderDailyChart, renderWeeklyChart, renderMonthlyChart, renderCategoryBreakdown, renderSourceAnalysis]);

  // FIXED: Filter controls component for mobile/desktop
  const renderFilterControls = useCallback(() => {
    const filterContent = (
      <Box sx={{ 
        display: 'grid',
        gridTemplateColumns: {
          xs: '1fr',
          sm: 'repeat(2, 1fr)',
          md: 'repeat(4, 1fr)'
        },
        gap: 3
      }}>
        <TextField
          fullWidth
          size="small"
          label="Search"
          value={filters.search}
          onChange={(e) => handleFilterChange('search', e.target.value)}
          placeholder="Search by source or description..."
          InputProps={{
            startAdornment: (
              <Search sx={{ 
                color: theme === 'dark' ? '#a8b2d1' : '#666666',
                mr: 1 
              }} />
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 1,
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
            },
            '& .MuiInputLabel-root.Mui-focused': {
              color: theme === 'dark' ? '#00ffff' : '#007bff',
            }
          }}
        />
        
        <FormControl fullWidth size="small">
          <InputLabel sx={labelStyle}>Type</InputLabel>
          <Select
            value={filters.type}
            label="Type"
            onChange={(e) => handleFilterChange('type', e.target.value)}
            sx={selectStyle}
          >
            <MenuItem value="">All Types</MenuItem>
            <MenuItem value="INCOME">Income</MenuItem>
            <MenuItem value="EXPENSE">Expense</MenuItem>
          </Select>
        </FormControl>
        
        <FormControl fullWidth size="small">
          <InputLabel sx={labelStyle}>Category</InputLabel>
          <Select
            value={filters.category}
            label="Category"
            onChange={(e) => handleFilterChange('category', e.target.value)}
            sx={selectStyle}
          >
            <MenuItem value="">All Categories</MenuItem>
            {filterOptions.categories.map((category) => (
              <MenuItem key={category} value={category}>
                {category}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        <FormControl fullWidth size="small">
          <InputLabel sx={labelStyle}>Status</InputLabel>
          <Select
            value={filters.status}
            label="Status"
            onChange={(e) => handleFilterChange('status', e.target.value)}
            sx={selectStyle}
          >
            <MenuItem value="">All Status</MenuItem>
            {filterOptions.statuses.map((status) => (
              <MenuItem key={status} value={status}>
                {status}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth size="small">
          <InputLabel sx={labelStyle}>Source</InputLabel>
          <Select
            value={filters.source}
            label="Source"
            onChange={(e) => handleFilterChange('source', e.target.value)}
            sx={selectStyle}
          >
            <MenuItem value="">All Sources</MenuItem>
            {filterOptions.sources.map((source) => (
              <MenuItem key={source} value={source}>
                {source}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <DatePicker
          label="Start Date"
          value={filters.startDate ? new Date(filters.startDate) : null}
          onChange={(date) => handleFilterChange('startDate', date ? format(date, 'yyyy-MM-dd') : '')}
          slotProps={{ 
            textField: { 
              fullWidth: true, 
              size: 'small',
              sx: datePickerStyle
            } 
          }}
        />

        <DatePicker
          label="End Date"
          value={filters.endDate ? new Date(filters.endDate) : null}
          onChange={(date) => handleFilterChange('endDate', date ? format(date, 'yyyy-MM-dd') : '')}
          slotProps={{ 
            textField: { 
              fullWidth: true, 
              size: 'small',
              sx: datePickerStyle
            } 
          }}
        />

        <FormControl fullWidth size="small">
          <InputLabel sx={labelStyle}>Sort By</InputLabel>
          <Select
            value={filters.sortBy}
            label="Sort By"
            onChange={(e) => handleFilterChange('sortBy', e.target.value)}
            sx={selectStyle}
          >
            <MenuItem value="-date">Date (Newest First)</MenuItem>
            <MenuItem value="date">Date (Oldest First)</MenuItem>
            <MenuItem value="-amount">Amount (High to Low)</MenuItem>
            <MenuItem value="amount">Amount (Low to High)</MenuItem>
          </Select>
        </FormControl>
      </Box>
    );

    if (isMobile) {
      return (
        <Collapse in={showFilters}>
          {filterContent}
        </Collapse>
      );
    }

    return filterContent;
  }, [filters, filterOptions, theme, labelStyle, selectStyle, datePickerStyle, isMobile, showFilters, handleFilterChange]);

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <div className={`min-h-screen transition-colors duration-300 ${
        theme === 'dark' 
          ? 'bg-gradient-to-br from-[#0a192f] to-[#112240] text-white' 
          : 'bg-gradient-to-br from-[#f0f0f0] to-[#ffffff] text-[#333333]'
      }`}>
        <Box sx={{ 
          py: 3,
          px: 2
        }}>
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Box sx={{ mb: 4 }}>
              <Typography variant={isMobile ? "h5" : "h4"} sx={{ 
                fontWeight: 'bold', 
                color: theme === 'dark' ? '#ccd6f6' : '#333333',
                mb: 1 
              }}>
                Wallet Management
              </Typography>
              <Typography variant={isMobile ? "body2" : "body1"} color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                Track your income and expenses with detailed analytics
              </Typography>
            </Box>
          </motion.div>

          {/* Summary Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Box sx={{ 
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(4, 1fr)'
              },
              gap: 3,
              mb: 4
            }}>
              {summaryCards.map((stat, index) => (
                <Card 
                  key={index}
                  sx={{ 
                    borderRadius: 2,
                    boxShadow: theme === 'dark' 
                      ? '0 2px 8px rgba(0,0,0,0.3)' 
                      : '0 2px 8px rgba(0,0,0,0.1)',
                    borderLeft: `4px solid ${stat.color}`,
                    backgroundColor: theme === 'dark' ? '#0f172a80' : 'white',
                    height: '100%',
                    backdropFilter: theme === 'dark' ? 'blur(10px)' : 'none'
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Box sx={{ 
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 48,
                        height: 48,
                        borderRadius: '50%',
                        bgcolor: theme === 'dark' ? `${stat.color}20` : `${stat.color}10`,
                        mr: 2
                      }}>
                        <Box sx={{ color: stat.color }}>
                          {stat.icon}
                        </Box>
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" color={theme === 'dark' ? '#a8b2d1' : '#666666'} sx={{ fontWeight: 500 }}>
                          {stat.title}
                        </Typography>
                        <Typography variant="h4" sx={{ 
                          fontWeight: 'bold', 
                          color: theme === 'dark' ? '#ccd6f6' : '#333333',
                          fontSize: { xs: '1.75rem', md: '2rem' }
                        }}>
                          {stat.value}
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Typography variant="caption" sx={{ 
                        color: stat.trend === 'up' ? 
                          (theme === 'dark' ? '#00ff00' : '#28a745') : 
                          (theme === 'dark' ? '#ff0000' : '#dc3545')
                      }}>
                        {stat.change} from last month
                      </Typography>
                      {stat.trend === 'up' ? 
                        <TrendingUp sx={{ fontSize: 16, color: theme === 'dark' ? '#00ff00' : '#28a745' }} /> : 
                        <TrendingDown sx={{ fontSize: 16, color: theme === 'dark' ? '#ff0000' : '#dc3545' }} />
                      }
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          </motion.div>

          {/* View Toggle */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card sx={{ 
              mb: 4, 
              borderRadius: 2, 
              boxShadow: theme === 'dark' 
                ? '0 4px 12px rgba(0,0,0,0.3)' 
                : '0 4px 12px rgba(0,0,0,0.08)',
              backgroundColor: theme === 'dark' ? '#0f172a80' : 'white',
              backdropFilter: theme === 'dark' ? 'blur(10px)' : 'none'
            }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: { xs: 'column', md: 'row' },
                  justifyContent: 'space-between',
                  alignItems: { xs: 'stretch', md: 'center' },
                  gap: 3,
                  mb: 3
                }}>
                  <ToggleButtonGroup
                    value={viewMode}
                    exclusive
                    onChange={(e, newValue) => newValue && setViewMode(newValue)}
                    sx={{ 
                      '& .MuiToggleButton-root': {
                        borderRadius: 1,
                        borderColor: theme === 'dark' ? '#334155' : '#e5e7eb',
                        color: theme === 'dark' ? '#a8b2d1' : '#666666',
                        '&.Mui-selected': {
                          backgroundColor: theme === 'dark' ? '#00ffff' : '#007bff',
                          color: theme === 'dark' ? '#0a192f' : 'white',
                          '&:hover': {
                            backgroundColor: theme === 'dark' ? '#00b3b3' : '#0056b3'
                          }
                        }
                      }
                    }}
                  >
                    <ToggleButton value="list">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Receipt fontSize="small" />
                        <Typography variant="body2">Transaction List</Typography>
                      </Box>
                    </ToggleButton>
                    <ToggleButton value="stats">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Analytics fontSize="small" />
                        <Typography variant="body2">Statistics</Typography>
                      </Box>
                    </ToggleButton>
                  </ToggleButtonGroup>
                  
                  <Box sx={{ 
                    display: 'flex', 
                    gap: 2,
                    flexDirection: { xs: 'column', sm: 'row' },
                    flexWrap: 'wrap'
                  }}>
                    {/* Mobile Filter Toggle Button */}
                    {isMobile && viewMode === 'list' && (
                      <Button
                        variant="outlined"
                        startIcon={showFilters ? <Close /> : <FilterList />}
                        onClick={() => setShowFilters(!showFilters)}
                        sx={{ 
                          borderRadius: 1,
                          borderColor: theme === 'dark' ? '#00ffff' : '#007bff',
                          color: theme === 'dark' ? '#00ffff' : '#007bff',
                          '&:hover': {
                            borderColor: theme === 'dark' ? '#00b3b3' : '#0056b3',
                            backgroundColor: theme === 'dark' ? '#00ffff20' : '#007bff10'
                          }
                        }}
                      >
                        {showFilters ? 'Hide Filters' : 'Show Filters'}
                      </Button>
                    )}
                    
                    <Button
                      variant="outlined"
                      startIcon={<Refresh />}
                      onClick={() => {
                        resetFilters();
                        if (viewMode === 'stats') {
                          fetchAllStatistics();
                        }
                      }}
                      sx={{ 
                        borderRadius: 1,
                        borderColor: theme === 'dark' ? '#00ffff' : '#007bff',
                        color: theme === 'dark' ? '#00ffff' : '#007bff',
                        '&:hover': {
                          borderColor: theme === 'dark' ? '#00b3b3' : '#0056b3',
                          backgroundColor: theme === 'dark' ? '#00ffff20' : '#007bff10'
                        }
                      }}
                    >
                      Reset
                    </Button>
                    {viewMode === 'list' && (
                      <>
                        <Button
                          variant="outlined"
                          startIcon={<FileDownload />}
                          onClick={exportToCSV}
                          sx={{ 
                            borderRadius: 1,
                            borderColor: theme === 'dark' ? '#00ff00' : '#28a745',
                            color: theme === 'dark' ? '#00ff00' : '#28a745',
                            '&:hover': {
                              borderColor: theme === 'dark' ? '#00b300' : '#1e7e34',
                              backgroundColor: theme === 'dark' ? '#00ff0020' : '#28a74510'
                            }
                          }}
                        >
                          Export CSV
                        </Button>
                        <Button
                          variant="outlined"
                          startIcon={<PictureAsPdf />}
                          onClick={exportToPDF}
                          sx={{ 
                            borderRadius: 1,
                            borderColor: theme === 'dark' ? '#ff0000' : '#dc3545',
                            color: theme === 'dark' ? '#ff0000' : '#dc3545',
                            '&:hover': {
                              borderColor: theme === 'dark' ? '#cc0000' : '#c82333',
                              backgroundColor: theme === 'dark' ? '#ff000020' : '#dc354510'
                            }
                          }}
                        >
                          Export PDF
                        </Button>
                      </>
                    )}
                    <Button
                      variant="contained"
                      startIcon={<Add />}
                      onClick={handleOpenCreateDialog}
                      sx={{
                        background: theme === 'dark'
                          ? 'linear-gradient(135deg, #00ffff, #00b3b3)'
                          : 'linear-gradient(135deg, #007bff, #0056b3)',
                        borderRadius: 1,
                        boxShadow: theme === 'dark'
                          ? '0 2px 4px rgba(0, 255, 255, 0.2)'
                          : '0 2px 4px rgba(37, 99, 235, 0.2)',
                        '&:hover': {
                          background: theme === 'dark'
                            ? 'linear-gradient(135deg, #00b3b3, #008080)'
                            : 'linear-gradient(135deg, #0056b3, #004080)',
                          boxShadow: theme === 'dark'
                            ? '0 4px 8px rgba(0, 255, 255, 0.3)'
                            : '0 4px 8px rgba(37, 99, 235, 0.3)'
                        }
                      }}
                    >
                      Add Transaction
                    </Button>
                  </Box>
                </Box>

                {/* Filter Controls (only show in list view) */}
                {viewMode === 'list' && renderFilterControls()}
              </CardContent>
            </Card>
          </motion.div>

          {/* Content Area */}
          {loading && viewMode === 'list' ? (
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center',
              minHeight: '400px' 
            }}>
              <CircularProgress size={60} sx={{ color: theme === 'dark' ? '#00ffff' : '#007bff' }} />
            </Box>
          ) : viewMode === 'stats' ? (
            renderStatisticsView()
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              {/* Mobile View - Cards */}
              {isMobile ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {transactions.map((transaction) => (
                    <Card 
                      key={transaction._id} 
                      sx={{ 
                        borderRadius: 2,
                        boxShadow: theme === 'dark' 
                          ? '0 2px 8px rgba(0,0,0,0.3)' 
                          : '0 2px 8px rgba(0,0,0,0.1)',
                        border: theme === 'dark' 
                          ? '1px solid #334155' 
                          : '1px solid #e5e7eb',
                        backgroundColor: theme === 'dark' ? '#0f172a80' : 'white',
                        backdropFilter: theme === 'dark' ? 'blur(10px)' : 'none'
                      }}
                    >
                      <CardContent sx={{ p: 3 }}>
                        <Box sx={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'flex-start',
                          mb: 2
                        }}>
                          <Box sx={{ flex: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                              {getTypeIcon(transaction.type)}
                              <Typography variant="subtitle1" sx={{ 
                                fontWeight: 'bold',
                                color: theme === 'dark' ? '#ccd6f6' : '#333333'
                              }}>
                                {formatCurrency(transaction.amount)}
                              </Typography>
                              <Chip
                                label={transaction.type}
                                size="small"
                                sx={{ 
                                  height: 20,
                                  fontSize: '0.7rem',
                                  backgroundColor: transaction.type === 'INCOME' 
                                    ? themeStyles.incomeColor + '20' 
                                    : themeStyles.expenseColor + '20',
                                  color: transaction.type === 'INCOME' 
                                    ? themeStyles.incomeColor 
                                    : themeStyles.expenseColor
                                }}
                              />
                            </Box>
                            <Typography variant="body2" color={theme === 'dark' ? '#a8b2d1' : '#666666'} sx={{ mb: 0.5 }}>
                              {transaction.source}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                {getCategoryIcon(transaction.category)}
                                <Typography variant="caption" color={theme === 'dark' ? '#94a3b8' : '#999999'}>
                                  {getCategoryLabel(transaction.category)}
                                </Typography>
                              </Box>
                              <Chip
                                label={transaction.status}
                                size="small"
                                icon={getStatusIcon(transaction.status)}
                                color={getStatusColor(transaction.status) as any}
                                sx={{ height: 20, fontSize: '0.7rem' }}
                              />
                            </Box>
                          </Box>
                          <Typography variant="caption" color={theme === 'dark' ? '#94a3b8' : '#999999'}>
                            {formatDate(transaction.date)}
                          </Typography>
                        </Box>
                        
                        {transaction.description && (
                          <Typography variant="body2" color={theme === 'dark' ? '#a8b2d1' : '#666666'} sx={{ mb: 2 }}>
                            {transaction.description}
                          </Typography>
                        )}
                        
                        <Box sx={{ 
                          display: 'flex', 
                          justifyContent: 'space-between',
                          pt: 2,
                          borderTop: theme === 'dark' ? '1px solid #334155' : '1px solid #e5e7eb'
                        }}>
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => handleOpenViewDialog(transaction)}
                            sx={{
                              borderRadius: 1,
                              borderColor: theme === 'dark' ? '#00ffff' : '#007bff',
                              color: theme === 'dark' ? '#00ffff' : '#007bff',
                              '&:hover': {
                                backgroundColor: theme === 'dark' ? '#00ffff20' : '#007bff10'
                              }
                            }}
                          >
                            View
                          </Button>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <IconButton
                              size="small"
                              onClick={() => handleOpenEditDialog(transaction)}
                              sx={{ 
                                color: theme === 'dark' ? '#00ffff' : '#007bff',
                                '&:hover': {
                                  backgroundColor: theme === 'dark' ? '#00ffff20' : '#007bff10'
                                }
                              }}
                            >
                              <Edit fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => {
                                setSelectedTransaction(transaction);
                                setOpenDeleteDialog(true);
                              }}
                              sx={{ 
                                color: theme === 'dark' ? '#ff0000' : '#dc3545',
                                '&:hover': {
                                  backgroundColor: theme === 'dark' ? '#ff000020' : '#dc354510'
                                }
                              }}
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              ) : (
                /* Desktop/Tablet View - Table */
                <Card sx={{ 
                  borderRadius: 2,
                  boxShadow: theme === 'dark' 
                    ? '0 4px 12px rgba(0,0,0,0.3)' 
                    : '0 4px 12px rgba(0,0,0,0.08)',
                  border: theme === 'dark' 
                    ? '1px solid #334155' 
                    : '1px solid #e5e7eb',
                  backgroundColor: theme === 'dark' ? '#0f172a80' : 'white',
                  backdropFilter: theme === 'dark' ? 'blur(10px)' : 'none'
                }}>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow sx={{ 
                          background: theme === 'dark'
                            ? 'linear-gradient(135deg, #00ffff, #00b3b3)'
                            : 'linear-gradient(135deg, #007bff, #0056b3)'
                        }}>
                          <TableCell sx={{ 
                            color: 'white', 
                            fontWeight: 'bold',
                            fontSize: '0.875rem',
                            py: 2,
                            width: '15%'
                          }}>
                            Date
                          </TableCell>
                          <TableCell sx={{ 
                            color: 'white', 
                            fontWeight: 'bold',
                            fontSize: '0.875rem',
                            py: 2,
                            width: '15%'
                          }}>
                            Type/Amount
                          </TableCell>
                          <TableCell sx={{ 
                            color: 'white', 
                            fontWeight: 'bold',
                            fontSize: '0.875rem',
                            py: 2,
                            width: '20%'
                          }}>
                            Source
                          </TableCell>
                          <TableCell sx={{ 
                            color: 'white', 
                            fontWeight: 'bold',
                            fontSize: '0.875rem',
                            py: 2,
                            width: '15%'
                          }}>
                            Category
                          </TableCell>
                          <TableCell sx={{ 
                            color: 'white', 
                            fontWeight: 'bold',
                            fontSize: '0.875rem',
                            py: 2,
                            width: '10%'
                          }}>
                            Status
                          </TableCell>
                          <TableCell sx={{ 
                            color: 'white', 
                            fontWeight: 'bold',
                            fontSize: '0.875rem',
                            py: 2,
                            width: '25%'
                          }}>
                            Actions
                          </TableCell>
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
                            <TableCell sx={{ py: 2.5 }}>
                              <Typography variant="body2" sx={{ 
                                fontWeight: 'medium',
                                color: theme === 'dark' ? '#ccd6f6' : '#333333'
                              }}>
                                {formatDate(transaction.date)}
                              </Typography>
                              <Typography variant="caption" color={theme === 'dark' ? '#94a3b8' : '#999999'}>
                                {transaction.formattedDate}
                              </Typography>
                            </TableCell>
                            <TableCell sx={{ py: 2.5 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                {getTypeIcon(transaction.type)}
                                <Typography variant="body2" sx={{ 
                                  fontWeight: 'bold',
                                  color: transaction.type === 'INCOME' 
                                    ? themeStyles.incomeColor 
                                    : themeStyles.expenseColor
                                }}>
                                  {formatCurrency(transaction.amount)}
                                </Typography>
                              </Box>
                              <Chip
                                label={transaction.type}
                                size="small"
                                sx={{ 
                                  height: 20,
                                  fontSize: '0.7rem',
                                  mt: 0.5,
                                  backgroundColor: transaction.type === 'INCOME' 
                                    ? themeStyles.incomeColor + '20' 
                                    : themeStyles.expenseColor + '20',
                                  color: transaction.type === 'INCOME' 
                                    ? themeStyles.incomeColor 
                                    : themeStyles.expenseColor
                                }}
                              />
                            </TableCell>
                            <TableCell sx={{ py: 2.5 }}>
                              <Typography variant="body2" sx={{ 
                                fontWeight: 'medium',
                                color: theme === 'dark' ? '#ccd6f6' : '#333333'
                              }}>
                                {transaction.source}
                              </Typography>
                              {transaction.description && (
                                <Typography variant="caption" color={theme === 'dark' ? '#a8b2d1' : '#666666'} sx={{ display: 'block', mt: 0.5 }}>
                                  {transaction.description.length > 50 
                                    ? transaction.description.substring(0, 50) + '...' 
                                    : transaction.description}
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell sx={{ py: 2.5 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Box sx={{ color: theme === 'dark' ? '#a8b2d1' : '#666666' }}>
                                  {getCategoryIcon(transaction.category)}
                                </Box>
                                <Typography variant="body2" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                                  {getCategoryLabel(transaction.category)}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell sx={{ py: 2.5 }}>
                              <Chip
                                label={transaction.status}
                                size="small"
                                icon={getStatusIcon(transaction.status)}
                                color={getStatusColor(transaction.status) as any}
                                sx={{ height: 24, fontSize: '0.75rem' }}
                              />
                            </TableCell>
                            <TableCell sx={{ py: 2.5 }}>
                              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                <Button
                                  variant="outlined"
                                  size="small"
                                  startIcon={<Visibility />}
                                  onClick={() => handleOpenViewDialog(transaction)}
                                  sx={{
                                    borderRadius: 1,
                                    borderColor: theme === 'dark' ? '#00ffff' : '#007bff',
                                    color: theme === 'dark' ? '#00ffff' : '#007bff',
                                    '&:hover': {
                                      backgroundColor: theme === 'dark' ? '#00ffff20' : '#007bff10'
                                    }
                                  }}
                                >
                                  View
                                </Button>
                                <Button
                                  variant="outlined"
                                  size="small"
                                  startIcon={<Edit />}
                                  onClick={() => handleOpenEditDialog(transaction)}
                                  sx={{
                                    borderRadius: 1,
                                    borderColor: theme === 'dark' ? '#00ffff' : '#007bff',
                                    color: theme === 'dark' ? '#00ffff' : '#007bff',
                                    '&:hover': {
                                      backgroundColor: theme === 'dark' ? '#00ffff20' : '#007bff10'
                                    }
                                  }}
                                >
                                  Edit
                                </Button>
                                <IconButton
                                  size="small"
                                  onClick={() => handleStatusUpdate(
                                    transaction._id, 
                                    transaction.status === 'CONFIRMED' ? 'CANCELLED' : 'CONFIRMED'
                                  )}
                                  sx={{ 
                                    color: transaction.status === 'CONFIRMED' 
                                      ? (theme === 'dark' ? '#ff0000' : '#dc3545')
                                      : (theme === 'dark' ? '#00ff00' : '#28a745'),
                                    '&:hover': {
                                      backgroundColor: transaction.status === 'CONFIRMED' 
                                        ? (theme === 'dark' ? '#ff000020' : '#dc354510')
                                        : (theme === 'dark' ? '#00ff0020' : '#28a74510')
                                    }
                                  }}
                                >
                                  {transaction.status === 'CONFIRMED' ? <Cancel /> : <CheckCircle />}
                                </IconButton>
                                <IconButton
                                  size="small"
                                  onClick={() => {
                                    setSelectedTransaction(transaction);
                                    setOpenDeleteDialog(true);
                                  }}
                                  sx={{ 
                                    color: theme === 'dark' ? '#ff0000' : '#dc3545',
                                    '&:hover': {
                                      backgroundColor: theme === 'dark' ? '#ff000020' : '#dc354510'
                                    }
                                  }}
                                >
                                  <Delete />
                                </IconButton>
                              </Box>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  {transactions.length === 0 && !loading && (
                    <Box sx={{ 
                      textAlign: 'center', 
                      py: 8,
                      px: 2
                    }}>
                      <Receipt sx={{ 
                        fontSize: 64, 
                        color: theme === 'dark' ? '#334155' : '#cbd5e1',
                        mb: 2
                      }} />
                      <Typography variant="h6" color={theme === 'dark' ? '#a8b2d1' : '#666666'} sx={{ mb: 1 }}>
                        No transactions found
                      </Typography>
                      <Typography variant="body2" color={theme === 'dark' ? '#94a3b8' : '#999999'}>
                        Try adjusting your filters or add a new transaction
                      </Typography>
                    </Box>
                  )}
                </Card>
              )}

              {/* Pagination */}
              {pagination.totalPages > 1 && viewMode === 'list' && (
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center',
                  mt: 4,
                  flexDirection: { xs: 'column', sm: 'row' },
                  gap: 2
                }}>
                  <Pagination
                    count={pagination.totalPages}
                    page={filters.page}
                    onChange={handlePageChange}
                    color="primary"
                    size={isMobile ? "small" : "medium"}
                    showFirstButton
                    showLastButton
                    sx={{
                      '& .MuiPaginationItem-root': {
                        borderRadius: 1,
                        color: theme === 'dark' ? '#ccd6f6' : '#333333',
                        '&.Mui-selected': {
                          backgroundColor: theme === 'dark' ? '#00ffff' : '#007bff',
                          color: theme === 'dark' ? '#0a192f' : 'white',
                        },
                        '&:hover': {
                          backgroundColor: theme === 'dark' ? '#00ffff20' : '#007bff10'
                        }
                      }
                    }}
                  />
                  
                  <Typography variant="body2" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                    Showing {((filters.page - 1) * filters.limit) + 1} to {Math.min(filters.page * filters.limit, pagination.totalTransactions)} of {pagination.totalTransactions} transactions
                  </Typography>
                </Box>
              )}
            </motion.div>
          )}

          {/* Add/Edit Transaction Dialog - FIXED: Added refs and auto-focus */}
          <Dialog 
            open={openDialog} 
            onClose={() => setOpenDialog(false)} 
            maxWidth="md" 
            fullWidth
            fullScreen={isMobile}
            PaperProps={{
              sx: { 
                borderRadius: 2,
                backgroundColor: theme === 'dark' ? '#0f172a' : 'white',
                color: theme === 'dark' ? '#ccd6f6' : '#333333',
                maxHeight: '90vh',
                overflow: 'hidden'
              }
            }}
          >
            <DialogTitle sx={{ 
              backgroundColor: theme === 'dark' ? '#0f172a' : 'white',
              borderBottom: theme === 'dark' ? '1px solid #334155' : '1px solid #e5e7eb',
              py: 3
            }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: theme === 'dark' ? '#ccd6f6' : '#333333' }}>
                {isEditMode ? 'Edit Transaction' : 'Add New Transaction'}
              </Typography>
            </DialogTitle>
            <DialogContent sx={{ p: 3, overflowY: 'auto' }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {/* Basic Information Section */}
                {renderFormSection(
                  "Basic Information",
                  <Receipt />,
                  <>
                    <FormRow columns={isMobile ? 1 : 2}>
                      <FormControl fullWidth size="small">
                        <InputLabel sx={labelStyle}>Type</InputLabel>
                        <Select
                          value={formData.type}
                          label="Type"
                          onChange={(e) => {
                            handleFormChange('type', e.target.value);
                            handleFormChange('category', '');
                          }}
                          sx={selectStyle}
                          required
                        >
                          <MenuItem value="INCOME">
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <ArrowUpward fontSize="small" sx={{ color: themeStyles.incomeColor }} /> Income
                            </Box>
                          </MenuItem>
                          <MenuItem value="EXPENSE">
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <ArrowDownward fontSize="small" sx={{ color: themeStyles.expenseColor }} /> Expense
                            </Box>
                          </MenuItem>
                        </Select>
                      </FormControl>
                      
                      <FormControl fullWidth size="small">
                        <InputLabel sx={labelStyle}>Category</InputLabel>
                        <Select
                          value={formData.category}
                          label="Category"
                          onChange={(e) => handleFormChange('category', e.target.value)}
                          sx={selectStyle}
                          required
                        >
                          <MenuItem value="">
                            <Typography variant="body2" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                              Select Category
                            </Typography>
                          </MenuItem>
                          {(formData.type === 'INCOME' ? incomeCategories : expenseCategories).map((category) => (
                            <MenuItem key={category.value} value={category.value}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Box sx={{ color: theme === 'dark' ? '#a8b2d1' : '#666666' }}>
                                  {category.icon}
                                </Box>
                                {category.label}
                              </Box>
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </FormRow>

                    <FormRow columns={isMobile ? 1 : 2}>
                      <TextField
                        fullWidth
                        label="Amount"
                        type="number"
                        value={formData.amount}
                        onChange={(e) => handleFormChange('amount', e.target.value === '' ? '' : parseFloat(e.target.value))}
                        required
                        size="small"
                        inputRef={amountRef}
                        InputProps={{
                          startAdornment: <AttachMoney fontSize="small" sx={{ mr: 1, color: theme === 'dark' ? '#a8b2d1' : '#666666' }} />,
                          inputProps: { min: 0, step: 0.01 }
                        }}
                        sx={textFieldStyle}
                      />
                      
                      <FormControl fullWidth size="small">
                        <InputLabel sx={labelStyle}>Source</InputLabel>
                        <Select
                          value={formData.source}
                          label="Source"
                          onChange={(e) => handleFormChange('source', e.target.value)}
                          sx={selectStyle}
                          required
                        >
                          <MenuItem value="">
                            <Typography variant="body2" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                              Select Source
                            </Typography>
                          </MenuItem>
                          {sources.map((source) => (
                            <MenuItem key={source} value={source}>
                              {source}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </FormRow>

                    <FormRow columns={isMobile ? 1 : 2}>
                      <DatePicker
                        label="Date"
                        value={formData.date}
                        onChange={(date) => handleFormChange('date', date)}
                        slotProps={{ 
                          textField: { 
                            fullWidth: true, 
                            size: 'small',
                            sx: datePickerStyle
                          } 
                        }}
                      />
                      
                      <FormControl fullWidth size="small">
                        <InputLabel sx={labelStyle}>Status</InputLabel>
                        <Select
                          value={formData.status}
                          label="Status"
                          onChange={(e) => handleFormChange('status', e.target.value)}
                          sx={selectStyle}
                        >
                          {statusOptions.map((status) => (
                            <MenuItem key={status.value} value={status.value}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Box sx={{ color: `${status.color}.main` }}>
                                  {status.value === 'CONFIRMED' ? <CheckCircle fontSize="small" /> :
                                   status.value === 'PENDING' ? <Pending fontSize="small" /> :
                                   <Cancel fontSize="small" />}
                                </Box>
                                {status.label}
                              </Box>
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </FormRow>
                  </>
                )}

                {/* Additional Information Section */}
                {renderFormSection(
                  "Additional Information",
                  <Description />,
                  <>
                    <FormRow columns={1}>
                      <TextField
                        fullWidth
                        label="Description"
                        value={formData.description}
                        onChange={(e) => handleFormChange('description', e.target.value)}
                        size="small"
                        multiline
                        rows={3}
                        placeholder="Add any additional details about this transaction..."
                        inputRef={descriptionRef}
                        sx={textFieldStyle}
                      />
                    </FormRow>
                  </>
                )}
              </Box>
            </DialogContent>
            <DialogActions sx={{ 
              p: 3,
              borderTop: theme === 'dark' ? '1px solid #334155' : '1px solid #e5e7eb',
              backgroundColor: theme === 'dark' ? '#0f172a' : 'white'
            }}>
              <Button 
                onClick={() => setOpenDialog(false)}
                sx={{
                  color: theme === 'dark' ? '#00ffff' : '#007bff',
                  '&:hover': {
                    backgroundColor: theme === 'dark' ? '#00ffff20' : '#007bff10'
                  }
                }}
              >
                Cancel
              </Button>
              <Button 
                onClick={isEditMode ? handleUpdateTransaction : handleCreateTransaction}
                variant="contained"
                disabled={!formData.category || !formData.source || !formData.amount || Number(formData.amount) <= 0}
                sx={{
                  background: theme === 'dark'
                    ? 'linear-gradient(135deg, #00ffff, #00b3b3)'
                    : 'linear-gradient(135deg, #007bff, #0056b3)',
                  borderRadius: 1,
                  '&:hover': {
                    background: theme === 'dark'
                      ? 'linear-gradient(135deg, #00b3b3, #008080)'
                      : 'linear-gradient(135deg, #0056b3, #004080)'
                  },
                  '&.Mui-disabled': {
                    background: theme === 'dark' ? '#334155' : '#e5e7eb',
                    color: theme === 'dark' ? '#94a3b8' : '#94a3b8'
                  }
                }}
              >
                {isEditMode ? 'Update Transaction' : 'Create Transaction'}
              </Button>
            </DialogActions>
          </Dialog>

          {/* View Transaction Dialog */}
          <Dialog 
            open={openViewDialog} 
            onClose={() => setOpenViewDialog(false)} 
            maxWidth="md" 
            fullWidth
            fullScreen={isMobile}
            PaperProps={{
              sx: { 
                borderRadius: 2,
                backgroundColor: theme === 'dark' ? '#0f172a' : 'white',
                color: theme === 'dark' ? '#ccd6f6' : '#333333'
              }
            }}
          >
            {selectedTransaction && (
              <>
                <DialogTitle sx={{ 
                  background: selectedTransaction.type === 'INCOME'
                    ? (theme === 'dark'
                        ? 'linear-gradient(135deg, #00ff00, #00b300)'
                        : 'linear-gradient(135deg, #28a745, #1e7e34)')
                    : (theme === 'dark'
                        ? 'linear-gradient(135deg, #ff0000, #cc0000)'
                        : 'linear-gradient(135deg, #dc3545, #c82333)'),
                  color: 'white',
                  py: 3
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar
                      sx={{ 
                        width: 50, 
                        height: 50,
                        backgroundColor: 'rgba(255,255,255,0.2)',
                        fontSize: '1.2rem',
                        fontWeight: 'bold'
                      }}
                    >
                      {selectedTransaction.type === 'INCOME' ? 
                        <ArrowUpward /> : 
                        <ArrowDownward />
                      }
                    </Avatar>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        {selectedTransaction.type === 'INCOME' ? 'Income' : 'Expense'} Transaction
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                        {formatDate(selectedTransaction.date)}
                      </Typography>
                    </Box>
                  </Box>
                </DialogTitle>
                <DialogContent sx={{ p: 3 }}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <Box sx={{ pt: 3, pb: 2 }}>
                      {/* Transaction Details */}
                      <Card sx={{ 
                        mb: 3, 
                        borderRadius: 2, 
                        boxShadow: theme === 'dark' 
                          ? '0 2px 8px rgba(0,0,0,0.3)' 
                          : '0 2px 8px rgba(0,0,0,0.1)',
                        backgroundColor: theme === 'dark' ? '#0f172a80' : 'white'
                      }}>
                        <CardContent>
                          <Typography variant="h6" sx={{ 
                            mb: 3, 
                            fontWeight: 'bold',
                            color: theme === 'dark' ? '#ccd6f6' : '#333333',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1
                          }}>
                            <Receipt /> Transaction Details
                          </Typography>
                          <Box sx={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 3 }}>
                            <Box>
                              <Typography variant="caption" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                                Amount
                              </Typography>
                              <Typography variant="h4" sx={{ 
                                fontWeight: 'bold',
                                color: selectedTransaction.type === 'INCOME' 
                                  ? themeStyles.incomeColor 
                                  : themeStyles.expenseColor
                              }}>
                                {formatCurrency(selectedTransaction.amount)}
                              </Typography>
                            </Box>
                            <Box>
                              <Typography variant="caption" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                                Type
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                {selectedTransaction.type === 'INCOME' ? 
                                  <ArrowUpward sx={{ color: themeStyles.incomeColor }} /> : 
                                  <ArrowDownward sx={{ color: themeStyles.expenseColor }} />
                                }
                                <Chip
                                  label={selectedTransaction.type}
                                  sx={{ 
                                    backgroundColor: selectedTransaction.type === 'INCOME' 
                                      ? themeStyles.incomeColor + '20' 
                                      : themeStyles.expenseColor + '20',
                                    color: selectedTransaction.type === 'INCOME' 
                                      ? themeStyles.incomeColor 
                                      : themeStyles.expenseColor
                                  }}
                                />
                              </Box>
                            </Box>
                            <Box>
                              <Typography variant="caption" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                                Category
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                {getCategoryIcon(selectedTransaction.category)}
                                <Typography variant="body1" sx={{ fontWeight: 'medium', color: theme === 'dark' ? '#ccd6f6' : '#333333' }}>
                                  {getCategoryLabel(selectedTransaction.category)}
                                </Typography>
                              </Box>
                            </Box>
                            <Box>
                              <Typography variant="caption" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                                Source
                              </Typography>
                              <Typography variant="body1" sx={{ fontWeight: 'medium', color: theme === 'dark' ? '#ccd6f6' : '#333333' }}>
                                {selectedTransaction.source}
                              </Typography>
                            </Box>
                            <Box>
                              <Typography variant="caption" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                                Status
                              </Typography>
                              <Box sx={{ mt: 0.5 }}>
                                <Chip
                                  label={selectedTransaction.status}
                                  icon={getStatusIcon(selectedTransaction.status)}
                                  color={getStatusColor(selectedTransaction.status) as any}
                                  size="medium"
                                />
                              </Box>
                            </Box>
                            <Box>
                              <Typography variant="caption" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                                Transaction Date
                              </Typography>
                              <Typography variant="body1" sx={{ fontWeight: 'medium', color: theme === 'dark' ? '#ccd6f6' : '#333333' }}>
                                {formatDate(selectedTransaction.date)}
                              </Typography>
                            </Box>
                          </Box>
                          {selectedTransaction.description && (
                            <Box sx={{ mt: 3 }}>
                              <Typography variant="caption" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                                Description
                              </Typography>
                              <Typography variant="body1" sx={{ mt: 0.5, color: theme === 'dark' ? '#a8b2d1' : '#666666' }}>
                                {selectedTransaction.description}
                              </Typography>
                            </Box>
                          )}
                        </CardContent>
                      </Card>

                      {/* System Information */}
                      <Card sx={{ 
                        borderRadius: 2, 
                        boxShadow: theme === 'dark' 
                          ? '0 2px 8px rgba(0,0,0,0.3)' 
                          : '0 2px 8px rgba(0,0,0,0.1)',
                        backgroundColor: theme === 'dark' ? '#0f172a80' : 'white'
                      }}>
                        <CardContent>
                          <Typography variant="h6" sx={{ 
                            mb: 2, 
                            fontWeight: 'bold',
                            color: theme === 'dark' ? '#ccd6f6' : '#333333',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1
                          }}>
                            <AccessTime /> System Information
                          </Typography>
                          <Box sx={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 2 }}>
                            <Box>
                              <Typography variant="caption" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                                Created By
                              </Typography>
                              <Typography variant="body1" sx={{ fontWeight: 'medium', color: theme === 'dark' ? '#ccd6f6' : '#333333' }}>
                                {selectedTransaction.createdBy.firstName} {selectedTransaction.createdBy.lastName}
                              </Typography>
                              <Typography variant="caption" color={theme === 'dark' ? '#94a3b8' : '#999999'}>
                                {selectedTransaction.createdBy.email}
                              </Typography>
                            </Box>
                            <Box>
                              <Typography variant="caption" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                                Created Date
                              </Typography>
                              <Typography variant="body1" sx={{ fontWeight: 'medium', color: theme === 'dark' ? '#ccd6f6' : '#333333' }}>
                                {formatDate(selectedTransaction.createdAt)}
                              </Typography>
                            </Box>
                            <Box>
                              <Typography variant="caption" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                                Last Updated
                              </Typography>
                              <Typography variant="body1" sx={{ fontWeight: 'medium', color: theme === 'dark' ? '#ccd6f6' : '#333333' }}>
                                {formatDate(selectedTransaction.updatedAt)}
                              </Typography>
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    </Box>
                  </motion.div>
                </DialogContent>
                <DialogActions sx={{ 
                  p: 3,
                  borderTop: theme === 'dark' ? '1px solid #334155' : '1px solid #e5e7eb',
                  backgroundColor: theme === 'dark' ? '#0f172a' : 'white'
                }}>
                  <Button 
                    onClick={() => setOpenViewDialog(false)}
                    sx={{
                      color: theme === 'dark' ? '#00ffff' : '#007bff',
                      '&:hover': {
                        backgroundColor: theme === 'dark' ? '#00ffff20' : '#007bff10'
                      }
                    }}
                  >
                    Close
                  </Button>
                  <Button 
                    onClick={() => {
                      setOpenViewDialog(false);
                      handleOpenEditDialog(selectedTransaction);
                    }}
                    variant="contained"
                    sx={{
                      background: theme === 'dark'
                        ? 'linear-gradient(135deg, #00ffff, #00b3b3)'
                        : 'linear-gradient(135deg, #007bff, #0056b3)',
                      borderRadius: 1,
                      '&:hover': {
                        background: theme === 'dark'
                          ? 'linear-gradient(135deg, #00b3b3, #008080)'
                          : 'linear-gradient(135deg, #0056b3, #004080)'
                      }
                    }}
                  >
                    Edit Transaction
                  </Button>
                </DialogActions>
              </>
            )}
          </Dialog>

          {/* Delete Confirmation Dialog */}
          <Dialog 
            open={openDeleteDialog} 
            onClose={() => setOpenDeleteDialog(false)}
            PaperProps={{
              sx: { 
                borderRadius: 2,
                backgroundColor: theme === 'dark' ? '#0f172a' : 'white',
                color: theme === 'dark' ? '#ccd6f6' : '#333333'
              }
            }}
          >
            <DialogTitle sx={{ 
              backgroundColor: theme === 'dark' ? '#0f172a' : 'white',
              borderBottom: theme === 'dark' ? '1px solid #334155' : '1px solid #e5e7eb',
              py: 3
            }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: theme === 'dark' ? '#ccd6f6' : '#333333' }}>
                Confirm Delete
              </Typography>
            </DialogTitle>
            <DialogContent sx={{ p: 3 }}>
              <Typography variant="body1" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                Are you sure you want to delete this transaction? This action cannot be undone.
              </Typography>
              {selectedTransaction && (
                <Box sx={{ 
                  mt: 2, 
                  p: 2, 
                  backgroundColor: theme === 'dark' ? '#1e293b' : '#f8f9fa',
                  borderRadius: 1,
                  border: `1px solid ${theme === 'dark' ? '#334155' : '#e5e7eb'}`
                }}>
                  <Typography variant="body2" sx={{ fontWeight: 'bold', color: theme === 'dark' ? '#ccd6f6' : '#333333' }}>
                    {selectedTransaction.type === 'INCOME' ? 'Income' : 'Expense'}: {formatCurrency(selectedTransaction.amount)}
                  </Typography>
                  <Typography variant="body2" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                    Source: {selectedTransaction.source}
                  </Typography>
                  <Typography variant="body2" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                    Date: {formatDate(selectedTransaction.date)}
                  </Typography>
                </Box>
              )}
            </DialogContent>
            <DialogActions sx={{ 
              p: 3,
              borderTop: theme === 'dark' ? '1px solid #334155' : '1px solid #e5e7eb',
              backgroundColor: theme === 'dark' ? '#0f172a' : 'white'
            }}>
              <Button 
                onClick={() => setOpenDeleteDialog(false)}
                sx={{
                  color: theme === 'dark' ? '#00ffff' : '#007bff',
                  '&:hover': {
                    backgroundColor: theme === 'dark' ? '#00ffff20' : '#007bff10'
                  }
                }}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleDeleteTransaction} 
                variant="contained"
                color="error"
                sx={{
                  borderRadius: 1,
                  background: theme === 'dark'
                    ? 'linear-gradient(135deg, #ff0000, #cc0000)'
                    : 'linear-gradient(135deg, #dc3545, #c82333)',
                  '&:hover': {
                    background: theme === 'dark'
                      ? 'linear-gradient(135deg, #cc0000, #990000)'
                      : 'linear-gradient(135deg, #c82333, #bd2130)'
                  }
                }}
              >
                Delete
              </Button>
            </DialogActions>
          </Dialog>

          {/* Notifications */}
          <Snackbar 
            open={!!error} 
            autoHideDuration={6000} 
            onClose={() => setError('')}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          >
            <Alert 
              severity="error" 
              onClose={() => setError('')}
              sx={{ 
                borderRadius: 1,
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                backgroundColor: theme === 'dark' ? '#0f172a' : 'white',
                color: theme === 'dark' ? '#ff0000' : '#dc3545'
              }}
            >
              {error}
            </Alert>
          </Snackbar>
          
          <Snackbar 
            open={!!success} 
            autoHideDuration={6000} 
            onClose={() => setSuccess('')}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          >
            <Alert 
              severity="success" 
              onClose={() => setSuccess('')}
              sx={{ 
                borderRadius: 1,
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                backgroundColor: theme === 'dark' ? '#0f172a' : 'white',
                color: theme === 'dark' ? '#00ff00' : '#28a745'
              }}
            >
              {success}
            </Alert>
          </Snackbar>
        </Box>
      </div>
    </LocalizationProvider>
  );
};

export default WalletPage;