'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Card, CardContent,
  TextField, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow,
  Chip, Alert, Snackbar, CircularProgress,
  useMediaQuery, Pagination,
  MenuItem, Select, FormControl, InputLabel,
  IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, Button, Avatar,
  FormControlLabel, Checkbox, Divider,
  Tooltip, Badge, Paper, Stack,
  Collapse
} from '@mui/material';
import { motion } from 'framer-motion';
import { useTheme } from '@/lib/theme-context';
import {
  AccountBalance, CheckCircle, Block,
  Add, Refresh, Delete, Edit,
  FilterList, ExpandMore, ExpandLess,
  Search, CalendarToday, AttachMoney,
  Person, Description, SwapHoriz,
  Paid, MoneyOff, TrendingUp,
  TrendingDown, DateRange, Receipt,
  ViewList, CheckBox, CheckBoxOutlineBlank,
  ArrowUpward, ArrowDownward, Visibility,
  Download, Print, Share,
  Close
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import api from '@/app/utils/api';
import { format, parseISO, startOfMonth, endOfMonth, subMonths } from 'date-fns';

interface Loan {
  _id: string;
  loanId: string;
  loanerId: string;
  name: string;
  amount: number;
  reason: string;
  loanType: 'TAKEN' | 'GIVEN';
  date: string;
  status: 'UNPAID' | 'PAID';
  createdBy: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
  formattedAmount?: string;
  formattedDate?: string;
}

interface LoanStats {
  summary: {
    totalLoans: number;
    unpaidLoans: number;
    paidLoans: number;
    recentLoans: number;
    totalTakenAmount: number;
    totalGivenAmount: number;
    totalUnpaidTakenAmount: number;
    totalUnpaidGivenAmount: number;
    netBalance: number;
  };
  statusStats: Array<{ _id: string; count: number; totalAmount: number }>;
  typeStats: Array<{ _id: string; count: number; totalAmount: number }>;
  monthlyStats: Array<{ month: number; monthName: string; count: number; totalAmount: number }>;
}

interface PaginationData {
  currentPage: number;
  totalPages: number;
  totalLoans: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface FilterOptions {
  loanerIds: string[];
  names: string[];
  reasons: string[];
  dateRange: {
    minDate: string;
    maxDate: string;
  };
  amountRange: {
    minAmount: number;
    maxAmount: number;
  };
}

interface LoanFormData {
  loanerId: string;
  name: string;
  amount: number | '';
  reason: string;
  loanType: 'TAKEN' | 'GIVEN';
  date: Date | null;
  status: 'UNPAID' | 'PAID';
}

// Stat card colors
const statColors = {
  total: '#3f51b5',
  unpaid: '#f44336',
  paid: '#4caf50',
  taken: '#ff9800',
  given: '#9c27b0',
  balance: '#2196f3'
};

const LoansPage = () => {
  const { theme } = useTheme();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const isTablet = useMediaQuery('(max-width: 1024px)');
  
  const [loans, setLoans] = useState<Loan[]>([]);
  const [stats, setStats] = useState<LoanStats | null>(null);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    loanerIds: [],
    names: [],
    reasons: [],
    dateRange: {
      minDate: new Date().toISOString(),
      maxDate: new Date().toISOString()
    },
    amountRange: {
      minAmount: 0,
      maxAmount: 0
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [pagination, setPagination] = useState<PaginationData>({
    currentPage: 1,
    totalPages: 1,
    totalLoans: 0,
    hasNext: false,
    hasPrev: false
  });
  const [totals, setTotals] = useState({
    totalTaken: 0,
    totalGiven: 0
  });

  // Filter states
  const [filters, setFilters] = useState({
    search: '',
    loanType: '',
    status: '',
    loanerId: '',
    name: '',
    reason: '',
    startDate: '',
    endDate: '',
    minAmount: '',
    maxAmount: '',
    page: 1,
    limit: 10
  });

  // Dialog states
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [openBulkDialog, setOpenBulkDialog] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [selectedLoans, setSelectedLoans] = useState<string[]>([]);
  const [expandedLoan, setExpandedLoan] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  
  // Mobile filter state
  const [showFilters, setShowFilters] = useState(false);

  // Form state
  const [formData, setFormData] = useState<LoanFormData>({
    loanerId: '',
    name: '',
    amount: '',
    reason: 'No Reason Provided',
    loanType: 'TAKEN',
    date: new Date(),
    status: 'UNPAID'
  });

  // Theme styles
  const themeStyles = {
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
    tableHeader: theme === 'dark' 
      ? 'linear-gradient(135deg, #00ffff, #00b3b3)' 
      : 'linear-gradient(135deg, #007bff, #0056b3)'
  };

  // Form field styles
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
    },
    '& .MuiInputLabel-root.Mui-focused': {
      color: theme === 'dark' ? '#00ffff' : '#007bff',
    }
  };

  const selectStyle = {
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
  };

  const labelStyle = {
    color: theme === 'dark' ? '#a8b2d1' : '#666666',
    '&.Mui-focused': {
      color: theme === 'dark' ? '#00ffff' : '#007bff',
    }
  };

  const datePickerStyle = {
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
  };

  // Stat cards
  const statCards = [
    {
      title: 'Total Loans',
      value: stats?.summary.totalLoans || 0,
      icon: <AccountBalance sx={{ fontSize: 28 }} />,
      color: statColors.total,
      change: stats && stats.summary.totalLoans > 0 ? 
        `${((stats.summary.recentLoans / stats.summary.totalLoans) * 100).toFixed(1)}% from last month` : 
        '0%',
      amount: (stats?.summary.totalTakenAmount || 0) + (stats?.summary.totalGivenAmount || 0)
    },
    {
      title: 'Unpaid Loans',
      value: stats?.summary.unpaidLoans || 0,
      icon: <MoneyOff sx={{ fontSize: 28 }} />,
      color: statColors.unpaid,
      amount: (stats?.summary.totalUnpaidTakenAmount || 0) + (stats?.summary.totalUnpaidGivenAmount || 0)
    },
    {
      title: 'Paid Loans',
      value: stats?.summary.paidLoans || 0,
      icon: <Paid sx={{ fontSize: 28 }} />,
      color: statColors.paid,
      amount: ((stats?.summary.totalTakenAmount || 0) - (stats?.summary.totalUnpaidTakenAmount || 0)) + 
              ((stats?.summary.totalGivenAmount || 0) - (stats?.summary.totalUnpaidGivenAmount || 0))
    },
    {
      title: 'Net Balance',
      value: stats?.summary.netBalance || 0,
      icon: (stats?.summary.netBalance || 0) >= 0 ? <TrendingUp sx={{ fontSize: 28 }} /> : <TrendingDown sx={{ fontSize: 28 }} />,
      color: (stats?.summary.netBalance || 0) >= 0 ? '#4caf50' : '#f44336',
      isAmount: true
    }
  ];

  useEffect(() => {
    fetchLoans();
    fetchStats();
    fetchFilterOptions();
  }, [filters.page, filters.limit, filters.loanType, filters.status, filters.search, filters.loanerId, filters.name, filters.reason, filters.startDate, filters.endDate, filters.minAmount, filters.maxAmount]);

  const fetchLoans = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value.toString());
      });

      const response = await api.get(`/loans?${params}`);
      setLoans(response.data.data.loans || []);
      setTotals(response.data.data.totals || { totalTaken: 0, totalGiven: 0 });
      setPagination(response.data.data.pagination || {
        currentPage: 1,
        totalPages: 1,
        totalLoans: 0,
        hasNext: false,
        hasPrev: false
      });
      setError('');
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to fetch loans');
      setLoans([]);
      setPagination({
        currentPage: 1,
        totalPages: 1,
        totalLoans: 0,
        hasNext: false,
        hasPrev: false
      });
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await api.get('/loans/stats');
      setStats(response.data.data);
    } catch (error: any) {
      console.error('Failed to fetch stats:', error);
    }
  }, []);

  const fetchFilterOptions = useCallback(async () => {
    try {
      const response = await api.get('/loans/filter-options');
      setFilterOptions(response.data.data);
    } catch (error: any) {
      console.error('Failed to fetch filter options:', error);
    }
  }, []);

  const handleCreateLoan = useCallback(async () => {
    try {
      const payload = {
        ...formData,
        amount: parseFloat(formData.amount as string)
      };

      await api.post('/loans', payload);
      
      setSuccess('Loan created successfully');
      setOpenDialog(false);
      resetForm();
      fetchLoans();
      fetchStats();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to create loan');
    }
  }, [formData, fetchLoans, fetchStats]);

  const handleUpdateLoan = useCallback(async () => {
    if (!selectedLoan) return;

    try {
      const payload = {
        ...formData,
        amount: parseFloat(formData.amount as string)
      };

      await api.put(`/loans/${selectedLoan._id}`, payload);
      
      setSuccess('Loan updated successfully');
      setOpenDialog(false);
      resetForm();
      fetchLoans();
      fetchStats();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to update loan');
    }
  }, [formData, selectedLoan, fetchLoans, fetchStats]);

  const handleMarkAsPaid = useCallback(async (loanId: string) => {
    try {
      await api.patch(`/loans/${loanId}/mark-paid`);
      setSuccess('Loan marked as paid successfully');
      fetchLoans();
      fetchStats();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to mark loan as paid');
    }
  }, [fetchLoans, fetchStats]);

  const handleBulkMarkAsPaid = useCallback(async () => {
    try {
      await api.post('/loans/bulk-mark-paid', { loanIds: selectedLoans });
      setSuccess(`${selectedLoans.length} loans marked as paid successfully`);
      setOpenBulkDialog(false);
      setSelectedLoans([]);
      fetchLoans();
      fetchStats();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to mark loans as paid');
    }
  }, [selectedLoans, fetchLoans, fetchStats]);

  const handleDeleteLoan = useCallback(async () => {
    if (!selectedLoan) return;

    try {
      await api.delete(`/loans/${selectedLoan._id}`);
      setSuccess('Loan deleted successfully');
      setOpenDeleteDialog(false);
      setSelectedLoan(null);
      fetchLoans();
      fetchStats();
    } catch (error: any) {
      setError('Failed to delete loan');
    }
  }, [selectedLoan, fetchLoans, fetchStats]);

  const handleOpenEditDialog = useCallback((loan: Loan) => {
    setSelectedLoan(loan);
    setIsEditMode(true);
    setFormData({
      loanerId: loan.loanerId,
      name: loan.name,
      amount: loan.amount,
      reason: loan.reason,
      loanType: loan.loanType,
      date: loan.date ? parseISO(loan.date) : new Date(),
      status: loan.status
    });
    setOpenDialog(true);
  }, []);

  const handleOpenViewDialog = useCallback((loan: Loan) => {
    setSelectedLoan(loan);
    setOpenViewDialog(true);
  }, []);

  const handleOpenCreateDialog = useCallback(() => {
    setIsEditMode(false);
    resetForm();
    setOpenDialog(true);
  }, []);

  const handleFilterChange = useCallback((field: string, value: string | number) => {
    setFilters(prev => ({
      ...prev,
      [field]: value,
      ...(field !== 'page' && { page: 1 })
    }));
  }, []);

  const handlePageChange = useCallback((event: React.ChangeEvent<unknown>, value: number) => {
    handleFilterChange('page', value);
  }, [handleFilterChange]);

  const handleFormChange = useCallback((field: keyof LoanFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const resetForm = useCallback(() => {
    setFormData({
      loanerId: '',
      name: '',
      amount: '',
      reason: '',
      loanType: 'TAKEN',
      date: new Date(),
      status: 'UNPAID'
    });
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      search: '',
      loanType: '',
      status: '',
      loanerId: '',
      name: '',
      reason: '',
      startDate: '',
      endDate: '',
      minAmount: '',
      maxAmount: '',
      page: 1,
      limit: 10
    });
    setSelectedLoans([]);
    setShowFilters(false);
  }, []);

  const toggleExpandLoan = useCallback((loanId: string) => {
    setExpandedLoan(expandedLoan === loanId ? null : loanId);
  }, [expandedLoan]);

  const toggleSelectLoan = useCallback((loanId: string) => {
    setSelectedLoans(prev => 
      prev.includes(loanId) 
        ? prev.filter(id => id !== loanId)
        : [...prev, loanId]
    );
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selectedLoans.length === loans.length) {
      setSelectedLoans([]);
    } else {
      setSelectedLoans(loans.map(loan => loan._id));
    }
  }, [loans, selectedLoans.length]);

  const formatDate = useCallback((dateString: string | Date) => {
    return format(new Date(dateString), 'MMM dd, yyyy');
  }, []);

  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat('en-ET', {
      style: 'currency',
      currency: 'ETB',
      minimumFractionDigits: 2
    }).format(amount);
  }, []);

  const getStatusColor = useCallback((status: string) => {
    return status === 'PAID' ? 'success' : 'error';
  }, []);

  const getLoanTypeColor = useCallback((loanType: string) => {
    return loanType === 'TAKEN' ? 'warning' : 'info';
  }, []);

  const getLoanTypeIcon = useCallback((loanType: string) => {
    return loanType === 'TAKEN' ? <ArrowDownward fontSize="small" /> : <ArrowUpward fontSize="small" />;
  }, []);

  const getAvatarColor = useCallback((name: string) => {
    const colors = ['#1976d2', '#2e7d32', '#ed6c02', '#d32f2f', '#7b1fa2', '#00796b', '#388e3c', '#f57c00', '#0288d1', '#c2185b'];
    const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    return colors[index];
  }, []);

  const getInitials = useCallback((name: string) => {
    const nameParts = name.split(' ').filter(part => part.length > 0);
    if (nameParts.length >= 2) {
      return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase();
    } else if (nameParts.length === 1) {
      return nameParts[0].substring(0, 2).toUpperCase();
    }
    return '??';
  }, []);

  // Calculate this month's range
  const thisMonthStart = startOfMonth(new Date());
  const thisMonthEnd = endOfMonth(new Date());
  const lastMonthStart = startOfMonth(subMonths(new Date(), 1));
  const lastMonthEnd = endOfMonth(subMonths(new Date(), 1));

  // Render filter controls
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
          label="Search Loans"
          value={filters.search}
          onChange={(e) => handleFilterChange('search', e.target.value)}
          placeholder="Loan ID, name, reason..."
          InputProps={{
            startAdornment: (
              <Search sx={{ 
                color: theme === 'dark' ? '#a8b2d1' : '#666666',
                mr: 1 
              }} />
            ),
          }}
          sx={textFieldStyle}
        />
        
        <FormControl fullWidth size="small">
          <InputLabel sx={labelStyle}>Loan Type</InputLabel>
          <Select
            value={filters.loanType}
            label="Loan Type"
            onChange={(e) => handleFilterChange('loanType', e.target.value)}
            sx={selectStyle}
          >
            <MenuItem value="">All Types</MenuItem>
            <MenuItem value="TAKEN">Taken</MenuItem>
            <MenuItem value="GIVEN">Given</MenuItem>
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
            <MenuItem value="UNPAID">Unpaid</MenuItem>
            <MenuItem value="PAID">Paid</MenuItem>
          </Select>
        </FormControl>
        
        <FormControl fullWidth size="small">
          <InputLabel sx={labelStyle}>Loaner</InputLabel>
          <Select
            value={filters.loanerId}
            label="Loaner"
            onChange={(e) => handleFilterChange('loanerId', e.target.value)}
            sx={selectStyle}
          >
            <MenuItem value="">All Loaners</MenuItem>
            {filterOptions.loanerIds.map((id) => (
              <MenuItem key={id} value={id}>{id}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth size="small">
          <InputLabel sx={labelStyle}>Name</InputLabel>
          <Select
            value={filters.name}
            label="Name"
            onChange={(e) => handleFilterChange('name', e.target.value)}
            sx={selectStyle}
          >
            <MenuItem value="">All Names</MenuItem>
            {filterOptions.names.map((name) => (
              <MenuItem key={name} value={name}>{name}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth size="small">
          <InputLabel sx={labelStyle}>Reason</InputLabel>
          <Select
            value={filters.reason}
            label="Reason"
            onChange={(e) => handleFilterChange('reason', e.target.value)}
            sx={selectStyle}
          >
            <MenuItem value="">All Reasons</MenuItem>
            {filterOptions.reasons.map((reason) => (
              <MenuItem key={reason} value={reason}>{reason}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <DatePicker
          label="Start Date"
          value={filters.startDate ? parseISO(filters.startDate) : null}
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
          value={filters.endDate ? parseISO(filters.endDate) : null}
          onChange={(date) => handleFilterChange('endDate', date ? format(date, 'yyyy-MM-dd') : '')}
          slotProps={{ 
            textField: { 
              fullWidth: true, 
              size: 'small',
              sx: datePickerStyle
            } 
          }}
        />

        <TextField
          fullWidth
          size="small"
          label="Min Amount"
          type="number"
          value={filters.minAmount}
          onChange={(e) => handleFilterChange('minAmount', e.target.value)}
          InputProps={{
            startAdornment: (
              <AttachMoney sx={{ 
                color: theme === 'dark' ? '#a8b2d1' : '#666666',
                mr: 1 
              }} />
            ),
          }}
          sx={textFieldStyle}
        />

        <TextField
          fullWidth
          size="small"
          label="Max Amount"
          type="number"
          value={filters.maxAmount}
          onChange={(e) => handleFilterChange('maxAmount', e.target.value)}
          InputProps={{
            startAdornment: (
              <AttachMoney sx={{ 
                color: theme === 'dark' ? '#a8b2d1' : '#666666',
                mr: 1 
              }} />
            ),
          }}
          sx={textFieldStyle}
        />

        <FormControl fullWidth size="small">
          <InputLabel sx={labelStyle}>Per Page</InputLabel>
          <Select
            value={filters.limit}
            label="Per Page"
            onChange={(e) => handleFilterChange('limit', Number(e.target.value))}
            sx={selectStyle}
          >
            <MenuItem value={10}>10</MenuItem>
            <MenuItem value={25}>25</MenuItem>
            <MenuItem value={50}>50</MenuItem>
            <MenuItem value={100}>100</MenuItem>
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
  }, [filters, filterOptions, theme, textFieldStyle, selectStyle, labelStyle, datePickerStyle, isMobile, showFilters, handleFilterChange]);

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
              <Box sx={{ mb: 3 }}>
                <Typography variant={isMobile ? "h5" : "h4"} sx={{ 
                  fontWeight: 'bold', 
                  color: theme === 'dark' ? '#ccd6f6' : '#333333',
                  mb: 1 
                }}>
                  Loan Management
                </Typography>
                <Typography variant={isMobile ? "body2" : "body1"} color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                  Track and manage all loan transactions
                </Typography>
              </Box>

              {/* Summary Cards */}
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
                {statCards.map((stat, index) => (
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
                            {stat.isAmount ? formatCurrency(stat.value) : stat.value}
                          </Typography>
                          {stat.change && (
                            <Typography variant="caption" sx={{ color: theme === 'dark' ? '#a8b2d1' : '#666666' }}>
                              {stat.change}
                            </Typography>
                          )}
                          {stat.amount !== undefined && (
                            <Typography variant="caption" sx={{ 
                              color: theme === 'dark' ? '#a8b2d1' : '#666666',
                              display: 'block',
                              fontWeight: 'medium'
                            }}>
                              {formatCurrency(stat.amount)}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Box>

              {/* Type Summary */}
              <Box sx={{ 
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr',
                  md: 'repeat(2, 1fr)'
                },
                gap: 3,
                mb: 4
              }}>
                <Card sx={{ 
                  borderRadius: 2,
                  boxShadow: theme === 'dark' 
                    ? '0 2px 8px rgba(0,0,0,0.3)' 
                    : '0 2px 8px rgba(0,0,0,0.1)',
                  backgroundColor: theme === 'dark' ? '#0f172a80' : 'white',
                  backdropFilter: theme === 'dark' ? 'blur(10px)' : 'none'
                }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <ArrowDownward sx={{ color: statColors.taken, mr: 1 }} />
                      <Typography variant="h6" sx={{ 
                        fontWeight: 'bold',
                        color: theme === 'dark' ? '#ccd6f6' : '#333333'
                      }}>
                        Taken Loans
                      </Typography>
                    </Box>
                    <Typography variant="h4" sx={{ 
                      fontWeight: 'bold', 
                      color: statColors.taken,
                      mb: 1
                    }}>
                      {formatCurrency(totals.totalTaken)}
                    </Typography>
                    <Typography variant="body2" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                      {stats?.summary.totalUnpaidTakenAmount ? 
                        `${formatCurrency(stats.summary.totalUnpaidTakenAmount)} unpaid` : 
                        'All loans paid'}
                    </Typography>
                  </CardContent>
                </Card>
                
                <Card sx={{ 
                  borderRadius: 2,
                  boxShadow: theme === 'dark' 
                    ? '0 2px 8px rgba(0,0,0,0.3)' 
                    : '0 2px 8px rgba(0,0,0,0.1)',
                  backgroundColor: theme === 'dark' ? '#0f172a80' : 'white',
                  backdropFilter: theme === 'dark' ? 'blur(10px)' : 'none'
                }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <ArrowUpward sx={{ color: statColors.given, mr: 1 }} />
                      <Typography variant="h6" sx={{ 
                        fontWeight: 'bold',
                        color: theme === 'dark' ? '#ccd6f6' : '#333333'
                      }}>
                        Given Loans
                      </Typography>
                    </Box>
                    <Typography variant="h4" sx={{ 
                      fontWeight: 'bold', 
                      color: statColors.given,
                      mb: 1
                    }}>
                      {formatCurrency(totals.totalGiven)}
                    </Typography>
                    <Typography variant="body2" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                      {stats?.summary.totalUnpaidGivenAmount ? 
                        `${formatCurrency(stats.summary.totalUnpaidGivenAmount)} unpaid` : 
                        'All loans paid'}
                    </Typography>
                  </CardContent>
                </Card>
              </Box>
            </Box>
          </motion.div>

          {/* Filter and Action Section */}
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
                  <Typography variant="h6" sx={{ 
                    fontWeight: 'bold',
                    color: theme === 'dark' ? '#ccd6f6' : '#333333',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}>
                    <FilterList /> Loan Filters
                  </Typography>
                  
                  <Box sx={{ 
                    display: 'flex', 
                    gap: 2,
                    flexDirection: { xs: 'column', sm: 'row' }
                  }}>
                    {/* Mobile Filter Toggle Button */}
                    {isMobile && (
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
                      onClick={resetFilters}
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
                    <Button
                      variant="contained"
                      startIcon={<Add />}
                      onClick={handleOpenCreateDialog}
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
                      New Loan
                    </Button>
                  </Box>
                </Box>
                
                {/* Filter Controls */}
                {renderFilterControls()}

                {/* Quick Date Filters */}
                <Collapse in={!isMobile || showFilters}>
                  <Box sx={{ mt: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => {
                        handleFilterChange('startDate', format(thisMonthStart, 'yyyy-MM-dd'));
                        handleFilterChange('endDate', format(thisMonthEnd, 'yyyy-MM-dd'));
                      }}
                      sx={{ 
                        borderRadius: 1,
                        fontSize: '0.75rem'
                      }}
                    >
                      This Month
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => {
                        handleFilterChange('startDate', format(lastMonthStart, 'yyyy-MM-dd'));
                        handleFilterChange('endDate', format(lastMonthEnd, 'yyyy-MM-dd'));
                      }}
                      sx={{ 
                        borderRadius: 1,
                        fontSize: '0.75rem'
                      }}
                    >
                      Last Month
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => {
                        handleFilterChange('status', 'UNPAID');
                      }}
                      sx={{ 
                        borderRadius: 1,
                        fontSize: '0.75rem'
                      }}
                    >
                      Show Unpaid Only
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => {
                        handleFilterChange('loanType', 'TAKEN');
                      }}
                      sx={{ 
                        borderRadius: 1,
                        fontSize: '0.75rem'
                      }}
                    >
                      Show Taken Only
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => {
                        handleFilterChange('loanType', 'GIVEN');
                      }}
                      sx={{ 
                        borderRadius: 1,
                        fontSize: '0.75rem'
                      }}
                    >
                      Show Given Only
                    </Button>
                  </Box>
                </Collapse>
              </CardContent>
            </Card>
          </motion.div>

          {/* Bulk Action Button - Only show when loans are selected */}
          {selectedLoans.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'flex-end',
                mb: 3
              }}>
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<CheckCircle />}
                  onClick={() => setOpenBulkDialog(true)}
                  sx={{
                    background: 'linear-gradient(135deg, #4caf50, #2e7d32)',
                    borderRadius: 1,
                    px: 3,
                    py: 1.5
                  }}
                >
                  Mark {selectedLoans.length} Selected as Paid
                </Button>
              </Box>
            </motion.div>
          )}

          {/* Loans List */}
          {loading ? (
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center',
              minHeight: '400px' 
            }}>
              <CircularProgress size={60} sx={{ color: theme === 'dark' ? '#00ffff' : '#007bff' }} />
            </Box>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              {/* Mobile View - Cards */}
              {isMobile ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {loans.map((loan) => {
                    const isExpanded = expandedLoan === loan._id;
                    const isSelected = selectedLoans.includes(loan._id);
                    
                    return (
                      <Card 
                        key={loan._id} 
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
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Checkbox
                                size="small"
                                checked={isSelected}
                                onChange={() => toggleSelectLoan(loan._id)}
                                icon={<CheckBoxOutlineBlank />}
                                checkedIcon={<CheckBox />}
                              />
                              <Avatar
                                sx={{ 
                                  width: 40, 
                                  height: 40,
                                  bgcolor: getAvatarColor(loan.name),
                                  fontSize: '0.875rem'
                                }}
                              >
                                {getInitials(loan.name)}
                              </Avatar>
                              <Box>
                                <Typography variant="subtitle1" sx={{ 
                                  fontWeight: 'bold',
                                  color: theme === 'dark' ? '#ccd6f6' : '#333333',
                                  mb: 0.5
                                }}>
                                  {loan.name}
                                </Typography>
                                <Typography variant="caption" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                                  {loan.loanId}
                                </Typography>
                              </Box>
                            </Box>
                            <IconButton 
                              size="small" 
                              onClick={() => toggleExpandLoan(loan._id)}
                              sx={{ color: theme === 'dark' ? '#a8b2d1' : '#666666' }}
                            >
                              {isExpanded ? <ExpandLess /> : <ExpandMore />}
                            </IconButton>
                          </Box>
                          
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Chip
                              label={loan.loanType}
                              color={getLoanTypeColor(loan.loanType)}
                              size="small"
                              icon={getLoanTypeIcon(loan.loanType)}
                              sx={{ height: 24 }}
                            />
                            <Chip
                              label={loan.status}
                              color={getStatusColor(loan.status)}
                              size="small"
                              sx={{ height: 24 }}
                            />
                          </Box>
                          
                          <Typography variant="h6" sx={{ 
                            color: theme === 'dark' ? '#00ffff' : '#007bff',
                            mb: 1
                          }}>
                            {formatCurrency(loan.amount)}
                          </Typography>
                          
                          <Typography variant="body2" color={theme === 'dark' ? '#a8b2d1' : '#666666'} sx={{ mb: 2 }}>
                            {loan.reason}
                          </Typography>
                          
                          <Box sx={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center'
                          }}>
                            <Typography variant="caption" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                              {formatDate(loan.date)}
                            </Typography>
                            <Typography variant="caption" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                              {loan.loanerId}
                            </Typography>
                          </Box>

                          {isExpanded && (
                            <Box sx={{ 
                              pt: 2,
                              borderTop: theme === 'dark' ? '1px solid #334155' : '1px solid #e5e7eb',
                              mt: 2
                            }}>
                              <Box sx={{ mb: 2 }}>
                                <Typography variant="body2" color={theme === 'dark' ? '#a8b2d1' : '#666666'} sx={{ fontWeight: 500, mb: 0.5 }}>
                                  Created By:
                                </Typography>
                                <Typography variant="body2" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                                  {loan.createdBy.firstName} {loan.createdBy.lastName}
                                </Typography>
                              </Box>
                              
                              <Box sx={{ mb: 2 }}>
                                <Typography variant="body2" color={theme === 'dark' ? '#a8b2d1' : '#666666'} sx={{ fontWeight: 500, mb: 0.5 }}>
                                  Created Date:
                                </Typography>
                                <Typography variant="body2" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                                  {formatDate(loan.createdAt)}
                                </Typography>
                              </Box>
                              
                              <Box sx={{ 
                                display: 'grid',
                                gridTemplateColumns: 'repeat(2, 1fr)',
                                gap: 1,
                                mt: 2
                              }}>
                                <Button
                                  variant="outlined"
                                  startIcon={<Visibility />}
                                  onClick={() => handleOpenViewDialog(loan)}
                                  size="small"
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
                                  startIcon={<Edit />}
                                  onClick={() => handleOpenEditDialog(loan)}
                                  size="small"
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
                                {loan.status === 'UNPAID' && (
                                  <Button
                                    variant="outlined"
                                    startIcon={<CheckCircle />}
                                    onClick={() => handleMarkAsPaid(loan._id)}
                                    size="small"
                                    color="success"
                                    sx={{ 
                                      borderRadius: 1,
                                      borderColor: theme === 'dark' ? '#00ff00' : '#28a745',
                                      color: theme === 'dark' ? '#00ff00' : '#28a745',
                                      '&:hover': {
                                        backgroundColor: theme === 'dark' ? '#00ff0020' : '#28a74510'
                                      }
                                    }}
                                  >
                                    Mark Paid
                                  </Button>
                                )}
                                <Button
                                  variant="outlined"
                                  startIcon={<Delete />}
                                  onClick={() => {
                                    setSelectedLoan(loan);
                                    setOpenDeleteDialog(true);
                                  }}
                                  size="small"
                                  color="error"
                                  sx={{ 
                                    borderRadius: 1,
                                    borderColor: theme === 'dark' ? '#ff0000' : '#dc3545',
                                    color: theme === 'dark' ? '#ff0000' : '#dc3545',
                                    '&:hover': {
                                      backgroundColor: theme === 'dark' ? '#ff000020' : '#dc354510'
                                    }
                                  }}
                                >
                                  Delete
                                </Button>
                              </Box>
                            </Box>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
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
                            width: 50
                          }}>
                            <Checkbox
                              size="small"
                              checked={selectedLoans.length === loans.length && loans.length > 0}
                              indeterminate={selectedLoans.length > 0 && selectedLoans.length < loans.length}
                              onChange={toggleSelectAll}
                              sx={{ 
                                color: 'white',
                                '&.Mui-checked': {
                                  color: 'white',
                                },
                                '&.MuiCheckbox-indeterminate': {
                                  color: 'white',
                                }
                              }}
                            />
                          </TableCell>
                          <TableCell sx={{ 
                            color: 'white', 
                            fontWeight: 'bold',
                            fontSize: '0.875rem',
                            py: 2
                          }}>
                            Loan Details
                          </TableCell>
                          <TableCell sx={{ 
                            color: 'white', 
                            fontWeight: 'bold',
                            fontSize: '0.875rem',
                            py: 2
                          }}>
                            Amount
                          </TableCell>
                          <TableCell sx={{ 
                            color: 'white', 
                            fontWeight: 'bold',
                            fontSize: '0.875rem',
                            py: 2
                          }}>
                            Type & Status
                          </TableCell>
                          <TableCell sx={{ 
                            color: 'white', 
                            fontWeight: 'bold',
                            fontSize: '0.875rem',
                            py: 2
                          }}>
                            Date
                          </TableCell>
                          <TableCell sx={{ 
                            color: 'white', 
                            fontWeight: 'bold',
                            fontSize: '0.875rem',
                            py: 2
                          }}>
                            Created By
                          </TableCell>
                          <TableCell sx={{ 
                            color: 'white', 
                            fontWeight: 'bold',
                            fontSize: '0.875rem',
                            py: 2
                          }}>
                            Actions
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {loans.map((loan) => {
                          const isSelected = selectedLoans.includes(loan._id);
                          
                          return (
                            <TableRow 
                              key={loan._id} 
                              hover
                              selected={isSelected}
                              sx={{ 
                                '&:hover': {
                                  backgroundColor: theme === 'dark' ? '#1e293b' : '#f8fafc'
                                },
                                '&.Mui-selected': {
                                  backgroundColor: theme === 'dark' ? '#00ffff20' : '#007bff10'
                                }
                              }}
                            >
                              <TableCell sx={{ py: 2.5 }}>
                                <Checkbox
                                  size="small"
                                  checked={isSelected}
                                  onChange={() => toggleSelectLoan(loan._id)}
                                />
                              </TableCell>
                              <TableCell sx={{ py: 2.5 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                  <Avatar
                                    sx={{ 
                                      width: 40, 
                                      height: 40,
                                      bgcolor: getAvatarColor(loan.name),
                                      fontSize: '0.875rem',
                                      fontWeight: 'bold'
                                    }}
                                  >
                                    {getInitials(loan.name)}
                                  </Avatar>
                                  <Box>
                                    <Typography variant="body2" sx={{ 
                                      fontWeight: 500,
                                      color: theme === 'dark' ? '#ccd6f6' : '#333333'
                                    }}>
                                      {loan.name}
                                    </Typography>
                                    <Typography variant="caption" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                                      ID: {loan.loanId}
                                    </Typography>
                                    <Typography variant="caption" sx={{ 
                                      display: 'block',
                                      color: theme === 'dark' ? '#a8b2d1' : '#666666'
                                    }}>
                                      {loan.loanerId}
                                    </Typography>
                                    <Typography variant="caption" sx={{ 
                                      display: 'block',
                                      color: theme === 'dark' ? '#94a3b8' : '#999999'
                                    }}>
                                      {loan.reason}
                                    </Typography>
                                  </Box>
                                </Box>
                              </TableCell>
                              <TableCell sx={{ py: 2.5 }}>
                                <Typography variant="body1" sx={{ 
                                  fontWeight: 'bold',
                                  color: theme === 'dark' ? '#00ffff' : '#007bff'
                                }}>
                                  {formatCurrency(loan.amount)}
                                </Typography>
                              </TableCell>
                              <TableCell sx={{ py: 2.5 }}>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                  <Chip
                                    label={loan.loanType}
                                    color={getLoanTypeColor(loan.loanType)}
                                    size="small"
                                    icon={getLoanTypeIcon(loan.loanType)}
                                    sx={{ width: 'fit-content' }}
                                  />
                                  <Chip
                                    label={loan.status}
                                    color={getStatusColor(loan.status)}
                                    size="small"
                                    sx={{ width: 'fit-content' }}
                                  />
                                </Box>
                              </TableCell>
                              <TableCell sx={{ py: 2.5 }}>
                                <Typography variant="body2" sx={{ 
                                  fontWeight: 'medium',
                                  color: theme === 'dark' ? '#ccd6f6' : '#333333'
                                }}>
                                  {formatDate(loan.date)}
                                </Typography>
                                <Typography variant="caption" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                                  Created: {formatDate(loan.createdAt)}
                                </Typography>
                              </TableCell>
                              <TableCell sx={{ py: 2.5 }}>
                                <Typography variant="body2" sx={{ 
                                  fontWeight: 'medium',
                                  color: theme === 'dark' ? '#ccd6f6' : '#333333'
                                }}>
                                  {loan.createdBy.firstName} {loan.createdBy.lastName}
                                </Typography>
                                <Typography variant="caption" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                                  {loan.createdBy.email}
                                </Typography>
                              </TableCell>
                              <TableCell sx={{ py: 2.5 }}>
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                  <Tooltip title="View Details">
                                    <IconButton
                                      size="small"
                                      onClick={() => handleOpenViewDialog(loan)}
                                      sx={{ 
                                        color: theme === 'dark' ? '#00ffff' : '#007bff',
                                        '&:hover': {
                                          backgroundColor: theme === 'dark' ? '#00ffff20' : '#007bff10'
                                        }
                                      }}
                                    >
                                      <Visibility fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Edit Loan">
                                    <IconButton
                                      size="small"
                                      onClick={() => handleOpenEditDialog(loan)}
                                      sx={{ 
                                        color: theme === 'dark' ? '#00ffff' : '#007bff',
                                        '&:hover': {
                                          backgroundColor: theme === 'dark' ? '#00ffff20' : '#007bff10'
                                        }
                                      }}
                                    >
                                      <Edit fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                  {loan.status === 'UNPAID' && (
                                    <Tooltip title="Mark as Paid">
                                      <IconButton
                                        size="small"
                                        onClick={() => handleMarkAsPaid(loan._id)}
                                        sx={{ 
                                          color: theme === 'dark' ? '#00ff00' : '#28a745',
                                          '&:hover': {
                                            backgroundColor: theme === 'dark' ? '#00ff0020' : '#28a74510'
                                          }
                                        }}
                                      >
                                        <CheckCircle fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                  )}
                                  <Tooltip title="Delete Loan">
                                    <IconButton
                                      size="small"
                                      onClick={() => {
                                        setSelectedLoan(loan);
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
                                  </Tooltip>
                                </Box>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  {loans.length === 0 && !loading && (
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
                        No loans found
                      </Typography>
                      <Typography variant="body2" color={theme === 'dark' ? '#94a3b8' : '#999999'}>
                        Try adjusting your filters or add a new loan
                      </Typography>
                    </Box>
                  )}
                </Card>
              )}

              {/* Pagination */}
              {pagination.totalPages > 1 && (
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
                    Showing {((filters.page - 1) * filters.limit) + 1} to {Math.min(filters.page * filters.limit, pagination.totalLoans)} of {pagination.totalLoans} loans
                  </Typography>
                </Box>
              )}
            </motion.div>
          )}

          {/* Add/Edit Loan Dialog */}
          <Dialog 
            open={openDialog} 
            onClose={() => setOpenDialog(false)} 
            maxWidth="sm" 
            fullWidth
            fullScreen={isMobile}
            PaperProps={{
              sx: { 
                borderRadius: 2,
                backgroundColor: theme === 'dark' ? '#0f172a' : 'white',
                color: theme === 'dark' ? '#ccd6f6' : '#333333',
                maxHeight: '90vh',
                overflow: 'hidden',
                marginTop: isMobile ? 0 : '5vh'
              }
            }}
          >
            <DialogTitle sx={{ 
              backgroundColor: theme === 'dark' ? '#0f172a' : 'white',
              borderBottom: theme === 'dark' ? '1px solid #334155' : '1px solid #e5e7eb',
              py: 3,
              position: 'sticky',
              top: 0,
              zIndex: 1,
              background: theme === 'dark' ? '#0f172a' : 'white'
            }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: theme === 'dark' ? '#ccd6f6' : '#333333' }}>
                {isEditMode ? 'Edit Loan' : 'Add New Loan'}
              </Typography>
            </DialogTitle>
            <DialogContent sx={{ p: 3, overflowY: 'auto' }}>
              <Stack spacing={3}>
                <TextField
                  fullWidth
                  label="Loaner ID"
                  value={formData.loanerId}
                  onChange={(e) => handleFormChange('loanerId', e.target.value)}
                  required
                  size="small"
                  InputProps={{
                    startAdornment: <Person fontSize="small" sx={{ mr: 1, color: theme === 'dark' ? '#a8b2d1' : '#666666' }} />,
                  }}
                  sx={textFieldStyle}
                  autoFocus={!isMobile}
                />
                
                <TextField
                  fullWidth
                  label="Name"
                  value={formData.name}
                  onChange={(e) => handleFormChange('name', e.target.value)}
                  required
                  size="small"
                  sx={textFieldStyle}
                />
                
                <TextField
                  fullWidth
                  label="Amount"
                  type="number"
                  value={formData.amount}
                  onChange={(e) => handleFormChange('amount', e.target.value)}
                  required
                  size="small"
                  InputProps={{
                    startAdornment: <AttachMoney fontSize="small" sx={{ mr: 1, color: theme === 'dark' ? '#a8b2d1' : '#666666' }} />,
                  }}
                  sx={textFieldStyle}
                  inputProps={{ min: 0, step: 0.01 }}
                />
                
                <TextField
                  fullWidth
                  label="Reason"
                  value={formData.reason}
                  onChange={(e) => handleFormChange('reason', e.target.value)}
                  required
                  size="small"
                  multiline
                  rows={3}
                  InputProps={{
                    startAdornment: <Description fontSize="small" sx={{ mr: 1, color: theme === 'dark' ? '#a8b2d1' : '#666666' }} />,
                  }}
                  sx={textFieldStyle}
                />
                
                <FormControl fullWidth size="small">
                  <InputLabel sx={labelStyle}>Loan Type</InputLabel>
                  <Select
                    value={formData.loanType}
                    label="Loan Type"
                    onChange={(e) => handleFormChange('loanType', e.target.value)}
                    sx={selectStyle}
                    required
                  >
                    <MenuItem value="TAKEN">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ArrowDownward fontSize="small" /> Taken (We owe)
                      </Box>
                    </MenuItem>
                    <MenuItem value="GIVEN">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ArrowUpward fontSize="small" /> Given (We are owed)
                      </Box>
                    </MenuItem>
                  </Select>
                </FormControl>
                
                <DatePicker
                  label="Loan Date"
                  value={formData.date}
                  onChange={(date) => handleFormChange('date', date)}
                  slotProps={{ 
                    textField: { 
                      fullWidth: true, 
                      size: 'small',
                      InputProps: {
                        startAdornment: <CalendarToday fontSize="small" sx={{ mr: 1, color: theme === 'dark' ? '#a8b2d1' : '#666666' }} />,
                      },
                      sx: datePickerStyle
                    } 
                  }}
                />
                
                {isEditMode && (
                  <FormControl fullWidth size="small">
                    <InputLabel sx={labelStyle}>Status</InputLabel>
                    <Select
                      value={formData.status}
                      label="Status"
                      onChange={(e) => handleFormChange('status', e.target.value)}
                      sx={selectStyle}
                    >
                      <MenuItem value="UNPAID">Unpaid</MenuItem>
                      <MenuItem value="PAID">Paid</MenuItem>
                    </Select>
                  </FormControl>
                )}
              </Stack>
            </DialogContent>
            <DialogActions sx={{ 
              p: 3,
              borderTop: theme === 'dark' ? '1px solid #334155' : '1px solid #e5e7eb',
              backgroundColor: theme === 'dark' ? '#0f172a' : 'white',
              position: 'sticky',
              bottom: 0,
              zIndex: 1
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
                onClick={isEditMode ? handleUpdateLoan : handleCreateLoan}
                variant="contained"
                disabled={!formData.loanerId || !formData.name || !formData.amount || !formData.loanType}
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
                {isEditMode ? 'Update Loan' : 'Create Loan'}
              </Button>
            </DialogActions>
          </Dialog>

          {/* View Loan Dialog */}
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
            {selectedLoan && (
              <>
                <DialogTitle sx={{ 
                  background: theme === 'dark'
                    ? 'linear-gradient(135deg, #00ffff, #00b3b3)'
                    : 'linear-gradient(135deg, #007bff, #0056b3)',
                  color: 'white',
                  py: 3
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar
                      sx={{ 
                        width: 50, 
                        height: 50,
                        bgcolor: getAvatarColor(selectedLoan.name),
                        fontSize: '1.2rem',
                        fontWeight: 'bold'
                      }}
                    >
                      {getInitials(selectedLoan.name)}
                    </Avatar>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        {selectedLoan.name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                        Loan ID: {selectedLoan.loanId}
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
                    <Stack spacing={3} sx={{ pt: 3, pb: 2 }}>
                      {/* Amount and Status */}
                      <Card sx={{ 
                        borderRadius: 2,
                        backgroundColor: theme === 'dark' ? '#1e293b' : '#f8f9fa'
                      }}>
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box>
                              <Typography variant="caption" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                                Amount
                              </Typography>
                              <Typography variant="h4" sx={{ 
                                fontWeight: 'bold',
                                color: theme === 'dark' ? '#00ffff' : '#007bff'
                              }}>
                                {formatCurrency(selectedLoan.amount)}
                              </Typography>
                            </Box>
                            <Box>
                              <Chip
                                label={selectedLoan.status}
                                color={getStatusColor(selectedLoan.status)}
                                size="medium"
                                sx={{ fontSize: '1rem', px: 2 }}
                              />
                              <Chip
                                label={selectedLoan.loanType}
                                color={getLoanTypeColor(selectedLoan.loanType)}
                                size="medium"
                                sx={{ ml: 1, fontSize: '1rem', px: 2 }}
                                icon={getLoanTypeIcon(selectedLoan.loanType)}
                              />
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>

                      {/* Loan Details */}
                      <Card sx={{ borderRadius: 2 }}>
                        <CardContent>
                          <Typography variant="h6" sx={{ 
                            mb: 3, 
                            fontWeight: 'bold',
                            color: theme === 'dark' ? '#ccd6f6' : '#333333',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1
                          }}>
                            <Description /> Loan Details
                          </Typography>
                          
                          <Stack spacing={2}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Typography variant="body2" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                                Loaner ID:
                              </Typography>
                              <Typography variant="body1" sx={{ fontWeight: 'medium', color: theme === 'dark' ? '#ccd6f6' : '#333333' }}>
                                {selectedLoan.loanerId}
                              </Typography>
                            </Box>
                            
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Typography variant="body2" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                                Name:
                              </Typography>
                              <Typography variant="body1" sx={{ fontWeight: 'medium', color: theme === 'dark' ? '#ccd6f6' : '#333333' }}>
                                {selectedLoan.name}
                              </Typography>
                            </Box>
                            
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Typography variant="body2" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                                Reason:
                              </Typography>
                              <Typography variant="body1" sx={{ fontWeight: 'medium', color: theme === 'dark' ? '#ccd6f6' : '#333333' }}>
                                {selectedLoan.reason}
                              </Typography>
                            </Box>
                            
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Typography variant="body2" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                                Loan Date:
                              </Typography>
                              <Typography variant="body1" sx={{ fontWeight: 'medium', color: theme === 'dark' ? '#ccd6f6' : '#333333' }}>
                                {formatDate(selectedLoan.date)}
                              </Typography>
                            </Box>
                          </Stack>
                        </CardContent>
                      </Card>

                      {/* System Information */}
                      <Card sx={{ borderRadius: 2 }}>
                        <CardContent>
                          <Typography variant="h6" sx={{ 
                            mb: 3, 
                            fontWeight: 'bold',
                            color: theme === 'dark' ? '#ccd6f6' : '#333333',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1
                          }}>
                            <CalendarToday /> System Information
                          </Typography>
                          
                          <Stack spacing={2}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Typography variant="body2" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                                Created By:
                              </Typography>
                              <Typography variant="body1" sx={{ fontWeight: 'medium', color: theme === 'dark' ? '#ccd6f6' : '#333333' }}>
                                {selectedLoan.createdBy.firstName} {selectedLoan.createdBy.lastName}
                              </Typography>
                            </Box>
                            
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Typography variant="body2" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                                Created Date:
                              </Typography>
                              <Typography variant="body1" sx={{ fontWeight: 'medium', color: theme === 'dark' ? '#ccd6f6' : '#333333' }}>
                                {formatDate(selectedLoan.createdAt)}
                              </Typography>
                            </Box>
                            
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Typography variant="body2" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                                Last Updated:
                              </Typography>
                              <Typography variant="body1" sx={{ fontWeight: 'medium', color: theme === 'dark' ? '#ccd6f6' : '#333333' }}>
                                {formatDate(selectedLoan.updatedAt)}
                              </Typography>
                            </Box>
                          </Stack>
                        </CardContent>
                      </Card>
                    </Stack>
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
                  {selectedLoan.status === 'UNPAID' && (
                    <Button 
                      onClick={() => {
                        setOpenViewDialog(false);
                        handleMarkAsPaid(selectedLoan._id);
                      }}
                      variant="contained"
                      color="success"
                      sx={{
                        background: 'linear-gradient(135deg, #4caf50, #2e7d32)',
                        borderRadius: 1,
                      }}
                    >
                      Mark as Paid
                    </Button>
                  )}
                  <Button 
                    onClick={() => {
                      setOpenViewDialog(false);
                      handleOpenEditDialog(selectedLoan);
                    }}
                    variant="contained"
                    sx={{
                      background: theme === 'dark'
                        ? 'linear-gradient(135deg, #00ffff, #00b3b3)'
                        : 'linear-gradient(135deg, #007bff, #0056b3)',
                      borderRadius: 1,
                    }}
                  >
                    Edit Loan
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
                Are you sure you want to delete the loan for <strong style={{color: theme === 'dark' ? '#ff0000' : '#dc3545'}}>
                  {selectedLoan?.name}
                </strong> ({selectedLoan?.loanId})? This action cannot be undone.
              </Typography>
              {selectedLoan && (
                <Typography variant="body1" color={theme === 'dark' ? '#a8b2d1' : '#666666'} sx={{ mt: 2 }}>
                  Amount: <strong>{formatCurrency(selectedLoan.amount)}</strong>
                </Typography>
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
                onClick={handleDeleteLoan} 
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

          {/* Bulk Mark as Paid Dialog */}
          <Dialog 
            open={openBulkDialog} 
            onClose={() => setOpenBulkDialog(false)}
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
                Mark {selectedLoans.length} Loans as Paid
              </Typography>
            </DialogTitle>
            <DialogContent sx={{ p: 3 }}>
              <Typography variant="body1" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                Are you sure you want to mark {selectedLoans.length} selected loans as paid?
              </Typography>
              <Typography variant="body2" color={theme === 'dark' ? '#94a3b8' : '#999999'} sx={{ mt: 2 }}>
                This action will update the status of all selected loans to "PAID".
              </Typography>
            </DialogContent>
            <DialogActions sx={{ 
              p: 3,
              borderTop: theme === 'dark' ? '1px solid #334155' : '1px solid #e5e7eb',
              backgroundColor: theme === 'dark' ? '#0f172a' : 'white'
            }}>
              <Button 
                onClick={() => setOpenBulkDialog(false)}
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
                onClick={handleBulkMarkAsPaid} 
                variant="contained"
                color="success"
                sx={{
                  borderRadius: 1,
                  background: theme === 'dark'
                    ? 'linear-gradient(135deg, #4caf50, #2e7d32)'
                    : 'linear-gradient(135deg, #28a745, #1e7e34)',
                  '&:hover': {
                    background: theme === 'dark'
                      ? 'linear-gradient(135deg, #2e7d32, #1b5e20)'
                      : 'linear-gradient(135deg, #1e7e34, #145523)'
                  }
                }}
              >
                Mark as Paid
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

export default LoansPage;