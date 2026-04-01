'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert,
  Snackbar,
  CircularProgress,
  useTheme as useMuiTheme,
  useMediaQuery,
  Pagination,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  IconButton,
  Collapse,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Tooltip,
  Checkbox,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Radio,
  RadioGroup,
  FormControlLabel,
  Stack,
  Avatar,
  Paper,
  InputAdornment
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AccountBalanceWallet,
  ArrowUpward,
  ArrowDownward,
  Casino,
  EmojiEvents,
  Search,
  FilterList,
  ExpandMore,
  ExpandLess,
  VisibilityOff,
  Lock,
  LockOpen,
  History,
  Warning,
  Info,
  Refresh,
  Archive,
  Payment,
  Receipt,
  SwapHoriz,
  AttachMoney,
  Person,
  Phone,
  Fingerprint,
  Update,
  ClearAll,
  CheckCircle,
  Block,
  AssignmentTurnedIn,
  Schedule,
  DateRange,
  Class as ClassIcon,
  Group,
  AdminPanelSettings,
  SupervisorAccount,
  Description as DescriptionIcon,
  School,
  Work
} from '@mui/icons-material';
import { useTheme } from '@/lib/theme-context';
import api from '@/app/utils/api';
import { format } from 'date-fns';

interface User {
  _id: string;
  phone: string;
  name?: string;
  role?: string;
  class?: string;
}

interface AvailabilityHistoryEntry {
  changedBy: string;
  changedAt: string;
  from: string;
  to: string;
  reason?: string;
}

interface Metadata {
  availabilityHistory?: AvailabilityHistoryEntry[];
}

interface Transaction {
  _id: string;
  userId: User;
  type: 'deposit' | 'withdrawal' | 'game_purchase' | 'winning';
  amount: number;
  status: 'pending' | 'completed' | 'failed' | 'approved' | 'confirmed';
  availability: 'active' | 'closed' | 'hidden' | 'pending';
  class: string;
  reference: string;
  description: string;
  metadata?: Metadata;
  reason?: string;
  createdAt: string;
  updatedAt: string;
  method?: 'telebirr' | 'cbe' | 'cash';
  transactionId?: string;
  senderPhone?: string;
  receiverPhone?: string;
}

interface TransactionStats {
  totalTransactions: number;
  totalDeposits: number;
  totalWithdrawals: number;
  totalWinnings: number;
  totalGamePurchases: number;
  netBalance: number;
  pendingDeposits: number;
  pendingWithdrawals: number;
}

interface PaginationData {
  current: number;
  total: number;
  count: number;
  totalRecords: number;
}

interface AvailabilityOption {
  value: 'active' | 'closed' | 'hidden' | 'pending';
  label: string;
  icon: JSX.Element;
  color: 'success' | 'error' | 'warning' | 'info' | 'default';
}

interface AvailabilityDialogState {
  open: boolean;
  transactionId: string | null;
  currentAvailability: string;
  newAvailability: '' | 'active' | 'closed' | 'hidden' | 'pending';
  reason: string;
  isBulk: boolean;
}

interface HistoryDialogState {
  open: boolean;
  transaction: Transaction | null;
}

interface Filters {
  type: string;
  status: string;
  availability: string;
  class: string;
  search: string;
  startDate: string;
  endDate: string;
  page: number;
  limit: number;
}

export default function TransactionsPage() {
  const muiTheme = useMuiTheme();
  const { theme } = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(muiTheme.breakpoints.down('md'));

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<TransactionStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [warning, setWarning] = useState<string>('');
  const [pagination, setPagination] = useState<PaginationData>({
    current: 1,
    total: 1,
    count: 0,
    totalRecords: 0
  });
  const [expandedTransaction, setExpandedTransaction] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState<boolean>(false);
  const [uniqueClasses, setUniqueClasses] = useState<string[]>([]);

  const [availabilityDialog, setAvailabilityDialog] = useState<AvailabilityDialogState>({
    open: false,
    transactionId: null,
    currentAvailability: '',
    newAvailability: '',
    reason: '',
    isBulk: false
  });

  const [historyDialog, setHistoryDialog] = useState<HistoryDialogState>({
    open: false,
    transaction: null
  });

  const [filters, setFilters] = useState<Filters>({
    type: '',
    status: '',
    availability: '',
    class: '',
    search: '',
    startDate: '',
    endDate: '',
    page: 1,
    limit: 10
  });

  const availabilityOptions: AvailabilityOption[] = [
    { value: 'active', label: 'Active', icon: <LockOpen fontSize="small" />, color: 'success' },
    { value: 'closed', label: 'Closed', icon: <Lock fontSize="small" />, color: 'error' },
    { value: 'hidden', label: 'Hidden', icon: <VisibilityOff fontSize="small" />, color: 'warning' },
    { value: 'pending', label: 'Pending', icon: <Info fontSize="small" />, color: 'info' }
  ];

  const classOptions = [
    { value: 'admin', label: 'Admin', icon: <AdminPanelSettings fontSize="small" />, color: 'error' },
    { value: 'supervisor', label: 'Supervisor', icon: <SupervisorAccount fontSize="small" />, color: 'warning' },
    { value: 'teacher', label: 'Teacher', icon: <School fontSize="small" />, color: 'info' },
    { value: 'student', label: 'Student', icon: <Group fontSize="small" />, color: 'success' },
    { value: 'user', label: 'User', icon: <Person fontSize="small" />, color: 'default' }
  ];

  // Theme styles matching StudentAvailabilityPage
  const themeStyles = {
    background: theme === 'dark' 
      ? 'linear-gradient(135deg, #0a192f, #112240)' 
      : 'linear-gradient(135deg, #f0f0f0, #ffffff)',
    textColor: theme === 'dark' ? '#ccd6f6' : '#333333',
    primaryColor: theme === 'dark' ? '#00ffff' : '#007bff',
    surface: theme === 'dark' ? '#1e293b' : '#ffffff',
    cardBg: theme === 'dark' ? '#0f172a80' : '#ffffff',
    cardBorder: theme === 'dark' ? '#334155' : '#e5e7eb',
    headerBg: theme === 'dark' 
      ? 'linear-gradient(135deg, #00ffff, #00b3b3)' 
      : 'linear-gradient(135deg, #007bff, #0056b3)',
    hoverBg: theme === 'dark' ? '#1e293b' : '#f8fafc',
    tableHeader: theme === 'dark' 
      ? 'linear-gradient(135deg, #00ffff, #00b3b3)' 
      : 'linear-gradient(135deg, #007bff, #0056b3)',
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
    },
    '& .MuiInputLabel-root.Mui-focused': {
      color: theme === 'dark' ? '#00ffff' : '#007bff',
    },
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

  useEffect(() => {
    fetchTransactions();
    fetchStats();
  }, [filters]);

  useEffect(() => {
    if (selectAll) {
      setSelectedTransactions(transactions.map(t => t._id));
    } else {
      setSelectedTransactions([]);
    }
  }, [selectAll, transactions]);

  useEffect(() => {
    // Extract unique classes from transactions
    const classes = transactions
      .map(t => t.class)
      .filter((value, index, self) => value && self.indexOf(value) === index)
      .sort();
    setUniqueClasses(classes);
  }, [transactions]);

  const fetchTransactions = async (): Promise<void> => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value.toString());
      });
      const response = await api.get(`/transactions?${params}`);
      setTransactions(response.data.data);
      setPagination(response.data.pagination);
      setError('');
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async (): Promise<void> => {
    try {
      const response = await api.get('/transactions/stats/overview');
      setStats(response.data.data);
    } catch (error: any) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleFilterChange = (field: keyof Filters, value: string | number): void => {
    setFilters(prev => ({
      ...prev,
      [field]: value,
      page: field !== 'page' ? 1 : (typeof value === 'number' ? value : prev.page)
    }));
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number): void => {
    handleFilterChange('page', value);
  };

  const toggleExpandTransaction = (transactionId: string): void => {
    setExpandedTransaction(expandedTransaction === transactionId ? null : transactionId);
  };

  const handleSelectTransaction = (transactionId: string): void => {
    setSelectedTransactions(prev => {
      if (prev.includes(transactionId)) {
        return prev.filter(id => id !== transactionId);
      } else {
        return [...prev, transactionId];
      }
    });
    setSelectAll(false);
  };

  const handleSelectAll = (): void => {
    setSelectAll(!selectAll);
  };

  const handleBulkAvailability = (): void => {
    if (selectedTransactions.length === 0) {
      setError('Please select at least one transaction');
      return;
    }

    setAvailabilityDialog({
      open: true,
      transactionId: null,
      currentAvailability: 'multiple',
      newAvailability: '',
      reason: '',
      isBulk: true
    });
  };

  const openAvailabilityDialog = (transaction: Transaction): void => {
    setAvailabilityDialog({
      open: true,
      transactionId: transaction._id,
      currentAvailability: transaction.availability || 'active',
      newAvailability: '',
      reason: '',
      isBulk: false
    });
  };

  const openHistoryDialog = (transaction: Transaction): void => {
    setHistoryDialog({
      open: true,
      transaction
    });
  };

  const handleAvailabilityChange = async (): Promise<void> => {
    const { transactionId, newAvailability, reason, isBulk } = availabilityDialog;
    
    if (!newAvailability) {
      setError('Please select a new availability status');
      return;
    }

    try {
      setLoading(true);
      
      if (isBulk) {
        const response = await api.put('/transactions/availability/bulk', {
          transactionIds: selectedTransactions,
          availability: newAvailability,
          reason: reason || `Bulk changed to ${newAvailability}`
        });
        
        if (response.data.success) {
          setSuccess(response.data.message);
          setSelectedTransactions([]);
          setSelectAll(false);
          
          // If there were partial failures, show warning
          if (response.data.data?.failed?.length > 0) {
            setWarning(`${response.data.data.failed.length} transactions failed to update`);
          }
        }
      } else {
        const response = await api.put(`/transactions/availability/${transactionId}`, {
          availability: newAvailability,
          reason
        });
        setSuccess(response.data.message);
      }
      
      await fetchTransactions();
      
      setAvailabilityDialog({
        open: false,
        transactionId: null,
        currentAvailability: '',
        newAvailability: '',
        reason: '',
        isBulk: false
      });
    } catch (error: any) {
      console.error('Bulk update error:', error);
      
      // Handle specific error cases
      if (error.response?.status === 207) {
        // Partial success
        const data = error.response.data.data;
        setWarning(`Partially updated: ${data.successful.length} succeeded, ${data.failed.length} failed`);
        await fetchTransactions();
      } else if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else {
        setError('Failed to update availability. Please check the console for details.');
      }
    } finally {
      setLoading(false);
    }
  };

  const resetFilters = (): void => {
    setFilters({
      type: '',
      status: '',
      availability: '',
      class: '',
      search: '',
      startDate: '',
      endDate: '',
      page: 1,
      limit: 10
    });
    setSelectedTransactions([]);
    setSelectAll(false);
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString: string): string => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
    } catch {
      return 'Invalid date';
    }
  };

  const getTypeIcon = (type: string): JSX.Element | null => {
    switch (type) {
      case 'deposit':
        return <ArrowDownward sx={{ color: '#4caf50', fontSize: 18 }} />;
      case 'withdrawal':
        return <ArrowUpward sx={{ color: '#f44336', fontSize: 18 }} />;
      case 'game_purchase':
        return <Casino sx={{ color: '#ff9800', fontSize: 18 }} />;
      case 'winning':
        return <EmojiEvents sx={{ color: '#2196f3', fontSize: 18 }} />;
      default:
        return null;
    }
  };

  const getTypeColor = (type: string): 'success' | 'error' | 'warning' | 'info' | 'default' => {
    switch (type) {
      case 'deposit': return 'success';
      case 'withdrawal': return 'error';
      case 'game_purchase': return 'warning';
      case 'winning': return 'info';
      default: return 'default';
    }
  };

  const getStatusColor = (status: string): 'success' | 'warning' | 'error' | 'info' | 'default' => {
    switch (status) {
      case 'completed':
      case 'confirmed':
        return 'success';
      case 'pending':
      case 'approved':
        return 'warning';
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string): JSX.Element => {
    switch (status) {
      case 'completed':
      case 'confirmed':
        return <CheckCircle fontSize="small" />;
      case 'pending':
      case 'approved':
        return <Schedule fontSize="small" />;
      case 'failed':
        return <Block fontSize="small" />;
      default:
        return <Info fontSize="small" />;
    }
  };

  const getAvailabilityColor = (availability: string = 'active'): 'success' | 'error' | 'warning' | 'info' | 'default' => {
    const option = availabilityOptions.find(opt => opt.value === availability);
    return option?.color || 'default';
  };

  const getAvailabilityIcon = (availability: string = 'active'): JSX.Element => {
    const option = availabilityOptions.find(opt => opt.value === availability);
    return option?.icon || <Info fontSize="small" />;
  };

  const getClassIcon = (className: string): JSX.Element => {
    const option = classOptions.find(opt => opt.value === className);
    return option?.icon || <ClassIcon fontSize="small" />;
  };

  const getClassColor = (className: string): 'error' | 'warning' | 'info' | 'success' | 'default' => {
    const option = classOptions.find(opt => opt.value === className);
    return option?.color as any || 'default';
  };

  const getMethodIcon = (method?: string): JSX.Element => {
    switch (method) {
      case 'telebirr':
        return <Payment fontSize="small" />;
      case 'cbe':
        return <AccountBalanceWallet fontSize="small" />;
      case 'cash':
        return <AttachMoney fontSize="small" />;
      default:
        return <Receipt fontSize="small" />;
    }
  };

  const getAvailabilityTransitionOptions = (current: string): AvailabilityOption[] => {
    switch (current) {
      case 'active':
        return availabilityOptions.filter(opt => opt.value === 'closed' || opt.value === 'hidden');
      case 'closed':
        return availabilityOptions.filter(opt => opt.value === 'hidden' || opt.value === 'active');
      case 'hidden':
        return availabilityOptions.filter(opt => opt.value === 'closed' || opt.value === 'active');
      case 'pending':
        return availabilityOptions.filter(opt => opt.value === 'active' || opt.value === 'closed');
      default:
        return availabilityOptions;
    }
  };

  // Calculate statistics
  const calculatedStats = {
    total: transactions.length,
    deposits: transactions.filter(t => t.type === 'deposit').reduce((sum, t) => sum + t.amount, 0),
    withdrawals: transactions.filter(t => t.type === 'withdrawal').reduce((sum, t) => sum + t.amount, 0),
    gamePurchases: transactions.filter(t => t.type === 'game_purchase').reduce((sum, t) => sum + t.amount, 0),
    winnings: transactions.filter(t => t.type === 'winning').reduce((sum, t) => sum + t.amount, 0),
    selected: selectedTransactions.length,
    byClass: transactions.reduce((acc, t) => {
      const className = t.class || 'Unknown';
      if (!acc[className]) {
        acc[className] = { count: 0, total: 0 };
      }
      acc[className].count++;
      acc[className].total += t.amount;
      return acc;
    }, {} as Record<string, { count: number; total: number }>)
  };

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      background: themeStyles.background,
      py: 3,
      px: { xs: 2, sm: 3, md: 4 }
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
            Transaction Management
          </Typography>
          <Typography variant={isMobile ? "body2" : "body1"} color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
            Track and manage all financial transactions and availability status
          </Typography>
        </Box>
      </motion.div>

      {/* Statistics Cards */}
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
          {/* Net Balance Card */}
          <Card sx={{ 
            borderRadius: 2,
            boxShadow: theme === 'dark' 
              ? '0 2px 8px rgba(0,0,0,0.3)' 
              : '0 2px 8px rgba(0,0,0,0.1)',
            backgroundColor: theme === 'dark' ? '#0f172a80' : 'white',
            borderLeft: '4px solid #2196f3'
          }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box sx={{ 
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  bgcolor: theme === 'dark' ? '#2196f320' : '#2196f310',
                  mr: 2
                }}>
                  <AccountBalanceWallet sx={{ color: '#2196f3' }} />
                </Box>
                <Box>
                  <Typography variant="body2" color={theme === 'dark' ? '#a8b2d1' : '#666666'} sx={{ fontWeight: 500 }}>
                    Net Balance
                  </Typography>
                  <Typography variant="h4" sx={{ 
                    fontWeight: 'bold', 
                    color: theme === 'dark' ? '#ccd6f6' : '#333333',
                    fontSize: { xs: '1.75rem', md: '2rem' }
                  }}>
                    {formatCurrency(stats?.netBalance || 0)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Total Deposits Card */}
          <Card sx={{ 
            borderRadius: 2,
            boxShadow: theme === 'dark' 
              ? '0 2px 8px rgba(0,0,0,0.3)' 
              : '0 2px 8px rgba(0,0,0,0.1)',
            backgroundColor: theme === 'dark' ? '#0f172a80' : 'white',
            borderLeft: '4px solid #4caf50'
          }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box sx={{ 
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  bgcolor: theme === 'dark' ? '#4caf5020' : '#4caf5010',
                  mr: 2
                }}>
                  <ArrowDownward sx={{ color: '#4caf50' }} />
                </Box>
                <Box>
                  <Typography variant="body2" color={theme === 'dark' ? '#a8b2d1' : '#666666'} sx={{ fontWeight: 500 }}>
                    Total Deposits
                  </Typography>
                  <Typography variant="h4" sx={{ 
                    fontWeight: 'bold', 
                    color: theme === 'dark' ? '#ccd6f6' : '#333333',
                    fontSize: { xs: '1.75rem', md: '2rem' }
                  }}>
                    {formatCurrency(stats?.totalDeposits || 0)}
                  </Typography>
                  <Typography variant="caption" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                    {stats?.pendingDeposits || 0} pending
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Total Withdrawals Card */}
          <Card sx={{ 
            borderRadius: 2,
            boxShadow: theme === 'dark' 
              ? '0 2px 8px rgba(0,0,0,0.3)' 
              : '0 2px 8px rgba(0,0,0,0.1)',
            backgroundColor: theme === 'dark' ? '#0f172a80' : 'white',
            borderLeft: '4px solid #f44336'
          }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box sx={{ 
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  bgcolor: theme === 'dark' ? '#f4433620' : '#f4433610',
                  mr: 2
                }}>
                  <ArrowUpward sx={{ color: '#f44336' }} />
                </Box>
                <Box>
                  <Typography variant="body2" color={theme === 'dark' ? '#a8b2d1' : '#666666'} sx={{ fontWeight: 500 }}>
                    Total Withdrawals
                  </Typography>
                  <Typography variant="h4" sx={{ 
                    fontWeight: 'bold', 
                    color: theme === 'dark' ? '#ccd6f6' : '#333333',
                    fontSize: { xs: '1.75rem', md: '2rem' }
                  }}>
                    {formatCurrency(stats?.totalWithdrawals || 0)}
                  </Typography>
                  <Typography variant="caption" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                    {stats?.pendingWithdrawals || 0} pending
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Total Transactions Card */}
          <Card sx={{ 
            borderRadius: 2,
            boxShadow: theme === 'dark' 
              ? '0 2px 8px rgba(0,0,0,0.3)' 
              : '0 2px 8px rgba(0,0,0,0.1)',
            backgroundColor: theme === 'dark' ? '#0f172a80' : 'white',
            borderLeft: '4px solid #ff9800'
          }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box sx={{ 
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  bgcolor: theme === 'dark' ? '#ff980020' : '#ff980010',
                  mr: 2
                }}>
                  <SwapHoriz sx={{ color: '#ff9800' }} />
                </Box>
                <Box>
                  <Typography variant="body2" color={theme === 'dark' ? '#a8b2d1' : '#666666'} sx={{ fontWeight: 500 }}>
                    Total Transactions
                  </Typography>
                  <Typography variant="h4" sx={{ 
                    fontWeight: 'bold', 
                    color: theme === 'dark' ? '#ccd6f6' : '#333333',
                    fontSize: { xs: '1.75rem', md: '2rem' }
                  }}>
                    {pagination.totalRecords}
                  </Typography>
                  <Typography variant="caption" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                    {transactions.length} showing
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </motion.div>

      {/* Class Distribution Bar */}
      {Object.keys(calculatedStats.byClass).length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          <Card sx={{ 
            mb: 4, 
            borderRadius: 2,
            backgroundColor: theme === 'dark' ? '#0f172a80' : 'white',
            border: theme === 'dark' ? '1px solid #334155' : '1px solid #e5e7eb'
          }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="subtitle1" sx={{ 
                fontWeight: 'bold',
                color: theme === 'dark' ? '#ccd6f6' : '#333333',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                mb: 2
              }}>
                <ClassIcon /> Transaction Distribution by Class
              </Typography>
              
              <Box sx={{ 
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr',
                  sm: 'repeat(2, 1fr)',
                  md: 'repeat(4, 1fr)'
                },
                gap: 2
              }}>
                {Object.entries(calculatedStats.byClass).map(([className, data]) => (
                  <Paper
                    key={className}
                    sx={{
                      p: 2,
                      backgroundColor: theme === 'dark' ? '#1e293b' : '#f8f9fa',
                      border: `1px solid ${theme === 'dark' ? '#334155' : '#e5e7eb'}`,
                      borderRadius: 1
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      {getClassIcon(className)}
                      <Typography variant="body2" sx={{ 
                        fontWeight: 'bold',
                        color: theme === 'dark' ? '#ccd6f6' : '#333333',
                        textTransform: 'capitalize'
                      }}>
                        {className}
                      </Typography>
                    </Box>
                    <Typography variant="h6" sx={{ 
                      fontWeight: 'bold',
                      color: theme === 'dark' ? '#00ffff' : '#007bff'
                    }}>
                      {data.count}
                    </Typography>
                    <Typography variant="caption" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                      Total: {formatCurrency(data.total)}
                    </Typography>
                  </Paper>
                ))}
              </Box>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Bulk Actions Bar */}
      {selectedTransactions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card sx={{ 
            mb: 4, 
            borderRadius: 2,
            backgroundColor: theme === 'dark' ? '#1e293b' : '#e3f2fd',
            border: theme === 'dark' ? '1px solid #00ffff' : '1px solid #2196f3'
          }}>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ 
                display: 'flex', 
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: { xs: 'stretch', sm: 'center' },
                justifyContent: 'space-between',
                gap: 2
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Chip
                    label={`${selectedTransactions.length} selected`}
                    color="primary"
                    size="medium"
                  />
                  <Button
                    size="small"
                    onClick={() => {
                      setSelectedTransactions([]);
                      setSelectAll(false);
                    }}
                    startIcon={<ClearAll />}
                    sx={{
                      color: theme === 'dark' ? '#00ffff' : '#1976d2'
                    }}
                  >
                    Clear
                  </Button>
                </Box>
                
                <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                  <FormControl size="small" sx={{ minWidth: 150 }}>
                    <Select
                      value={availabilityDialog.newAvailability || 'active'}
                      onChange={(e) => setAvailabilityDialog(prev => ({ 
                        ...prev, 
                        newAvailability: e.target.value as 'active' | 'closed' | 'hidden' | 'pending' 
                      }))}
                      sx={selectStyle}
                    >
                      {availabilityOptions.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {option.icon}
                            {option.label}
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  
                  <Button
                    variant="contained"
                    startIcon={<Update />}
                    onClick={handleBulkAvailability}
                    disabled={loading || !availabilityDialog.newAvailability}
                    sx={{
                      background: theme === 'dark'
                        ? 'linear-gradient(135deg, #00ffff, #00b3b3)'
                        : 'linear-gradient(135deg, #2196f3, #1976d2)',
                      borderRadius: 1,
                    }}
                  >
                    {loading ? 'Updating...' : 'Update Selected'}
                  </Button>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Filter Section */}
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
                <FilterList /> Transaction Filters
              </Typography>
              
              <Box sx={{ 
                display: 'flex', 
                gap: 2,
                flexDirection: { xs: 'column', sm: 'row' }
              }}>
                <Button
                  variant="outlined"
                  startIcon={<Refresh />}
                  onClick={resetFilters}
                  sx={{ 
                    borderRadius: 1,
                    borderColor: theme === 'dark' ? '#00ffff' : '#007bff',
                    color: theme === 'dark' ? '#00ffff' : '#007bff',
                    '&:hover': {
                      backgroundColor: theme === 'dark' ? '#00ffff20' : '#007bff10'
                    }
                  }}
                >
                  Reset Filters
                </Button>
              </Box>
            </Box>
            
            {/* Filter Controls */}
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
                placeholder="Reference, phone, user..."
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ color: theme === 'dark' ? '#a8b2d1' : '#666666' }} />
                    </InputAdornment>
                  ),
                }}
                sx={textFieldStyle}
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
                  <MenuItem value="deposit">Deposit</MenuItem>
                  <MenuItem value="withdrawal">Withdrawal</MenuItem>
                  <MenuItem value="game_purchase">Game Purchase</MenuItem>
                  <MenuItem value="winning">Winning</MenuItem>
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
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="approved">Approved</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="confirmed">Confirmed</MenuItem>
                  <MenuItem value="failed">Failed</MenuItem>
                </Select>
              </FormControl>
              
              <FormControl fullWidth size="small">
                <InputLabel sx={labelStyle}>Class</InputLabel>
                <Select
                  value={filters.class}
                  label="Class"
                  onChange={(e) => handleFilterChange('class', e.target.value)}
                  sx={selectStyle}
                >
                  <MenuItem value="">All Classes</MenuItem>
                  {classOptions.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {option.icon}
                        {option.label}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <FormControl fullWidth size="small">
                <InputLabel sx={labelStyle}>Availability</InputLabel>
                <Select
                  value={filters.availability}
                  label="Availability"
                  onChange={(e) => handleFilterChange('availability', e.target.value)}
                  sx={selectStyle}
                >
                  <MenuItem value="">All Availability</MenuItem>
                  {availabilityOptions.map(opt => (
                    <MenuItem key={opt.value} value={opt.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {opt.icon}
                        {opt.label}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

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
          </CardContent>
        </Card>
      </motion.div>

      {/* Transactions List */}
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
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <AnimatePresence>
                {transactions.map((t, index) => {
                  const isExpanded = expandedTransaction === t._id;
                  const isSelected = selectedTransactions.includes(t._id);
                  const user = t.userId;
                  
                  return (
                    <motion.div
                      key={t._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card sx={{ 
                        borderRadius: 2,
                        boxShadow: theme === 'dark' 
                          ? '0 2px 8px rgba(0,0,0,0.3)' 
                          : '0 2px 8px rgba(0,0,0,0.1)',
                        border: isSelected ? `2px solid ${theme === 'dark' ? '#00ffff' : '#007bff'}` : 
                                 theme === 'dark' ? '1px solid #334155' : '1px solid #e5e7eb',
                        backgroundColor: theme === 'dark' ? '#0f172a80' : 'white',
                        position: 'relative'
                      }}>
                        <CardContent sx={{ p: 3 }}>
                          {/* Selection checkbox */}
                          <Box sx={{ position: 'absolute', top: 8, left: 8 }}>
                            <Checkbox
                              checked={isSelected}
                              onChange={() => handleSelectTransaction(t._id)}
                              sx={{
                                color: theme === 'dark' ? '#00ffff' : '#007bff',
                                '&.Mui-checked': {
                                  color: theme === 'dark' ? '#00ffff' : '#007bff',
                                },
                              }}
                            />
                          </Box>
                          
                          <Box sx={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'flex-start',
                            mb: 2,
                            pl: 4
                          }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Avatar
                                sx={{ 
                                  width: 40, 
                                  height: 40,
                                  bgcolor: getTypeColor(t.type),
                                  fontSize: '1rem',
                                  fontWeight: 'bold'
                                }}
                              >
                                {getTypeIcon(t.type)}
                              </Avatar>
                              <Box>
                                <Typography variant="subtitle1" sx={{ 
                                  fontWeight: 'bold',
                                  color: theme === 'dark' ? '#ccd6f6' : '#333333',
                                  mb: 0.5,
                                  textTransform: 'capitalize'
                                }}>
                                  {t.type.replace('_', ' ')}
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                                  <Fingerprint fontSize="small" sx={{ color: theme === 'dark' ? '#a8b2d1' : '#666666' }} />
                                  <Typography variant="caption" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                                    {t.reference.substring(0, 8)}...
                                  </Typography>
                                </Box>
                              </Box>
                            </Box>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <IconButton 
                                size="small" 
                                onClick={() => openHistoryDialog(t)}
                                sx={{ 
                                  color: theme === 'dark' ? '#00ffff' : '#007bff',
                                  '&:hover': {
                                    backgroundColor: theme === 'dark' ? '#00ffff20' : '#007bff10'
                                  }
                                }}
                              >
                                <History fontSize="small" />
                              </IconButton>
                              <IconButton 
                                size="small" 
                                onClick={() => toggleExpandTransaction(t._id)}
                                sx={{ color: theme === 'dark' ? '#a8b2d1' : '#666666' }}
                              >
                                {isExpanded ? <ExpandLess /> : <ExpandMore />}
                              </IconButton>
                            </Box>
                          </Box>
                          
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, pl: 4 }}>
                            <Typography variant="body2" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                              Amount:
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: 'bold',
                                color: t.type === 'withdrawal' || t.type === 'game_purchase' ? '#f44336' : '#4caf50'
                              }}
                            >
                              {t.type === 'withdrawal' || t.type === 'game_purchase' 
                                ? `-${formatCurrency(t.amount)}` 
                                : `+${formatCurrency(t.amount)}`}
                            </Typography>
                          </Box>

                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, pl: 4 }}>
                            <Typography variant="body2" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                              Class:
                            </Typography>
                            <Chip
                              icon={getClassIcon(t.class)}
                              label={t.class || 'Unknown'}
                              color={getClassColor(t.class)}
                              size="small"
                              sx={{ height: 24 }}
                            />
                          </Box>

                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, pl: 4 }}>
                            <Typography variant="body2" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                              Status:
                            </Typography>
                            <Chip
                              label={t.status}
                              icon={getStatusIcon(t.status)}
                              color={getStatusColor(t.status)}
                              size="small"
                              sx={{ height: 24 }}
                            />
                          </Box>

                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, pl: 4 }}>
                            <Typography variant="body2" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                              Availability:
                            </Typography>
                            <Chip
                              icon={getAvailabilityIcon(t.availability)}
                              label={availabilityOptions.find(opt => opt.value === t.availability)?.label || 'Active'}
                              color={getAvailabilityColor(t.availability)}
                              size="small"
                              onClick={() => openAvailabilityDialog(t)}
                              sx={{ height: 24, cursor: 'pointer' }}
                            />
                          </Box>

                          {isExpanded && (
                            <>
                              <Divider sx={{ my: 2 }} />
                              
                              <Box sx={{ mb: 2 }}>
                                <Typography variant="body2" color={theme === 'dark' ? '#a8b2d1' : '#666666'} sx={{ fontWeight: 500, mb: 1 }}>
                                  Transaction Details
                                </Typography>
                                
                                <Stack spacing={1.5}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                    <Person fontSize="small" sx={{ color: theme === 'dark' ? '#a8b2d1' : '#666666' }} />
                                    <Typography variant="body2" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                                      {user?.name || user?.phone || 'N/A'}
                                    </Typography>
                                  </Box>
                                  
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                    <DateRange fontSize="small" sx={{ color: theme === 'dark' ? '#a8b2d1' : '#666666' }} />
                                    <Typography variant="body2" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                                      {formatDate(t.createdAt)}
                                    </Typography>
                                  </Box>
                                  
                                  {t.method && (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                      {getMethodIcon(t.method)}
                                      <Typography variant="body2" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                                        Method: {t.method}
                                      </Typography>
                                    </Box>
                                  )}
                                  
                                  {t.description && (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                      <DescriptionIcon fontSize="small" sx={{ color: theme === 'dark' ? '#a8b2d1' : '#666666' }} />
                                      <Typography variant="body2" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                                        {t.description}
                                      </Typography>
                                    </Box>
                                  )}
                                  
                                  {t.reason && (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                      <Info fontSize="small" sx={{ color: '#ff9800' }} />
                                      <Typography variant="body2" sx={{ color: '#ff9800' }}>
                                        Reason: {t.reason}
                                      </Typography>
                                    </Box>
                                  )}
                                </Stack>
                              </Box>
                            </>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </Box>
          ) : (
            /* Desktop/Tablet View - Table */
            <Card sx={{ 
              borderRadius: 2,
              boxShadow: theme === 'dark' 
                ? '0 4px 12px rgba(0,0,0,0.3)' 
                : '0 4px 12px rgba(0,0,0,0.08)',
              backgroundColor: theme === 'dark' ? '#0f172a80' : 'white',
              overflow: 'hidden'
            }}>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ 
                      background: theme === 'dark'
                        ? 'linear-gradient(135deg, #00ffff, #00b3b3)'
                        : 'linear-gradient(135deg, #007bff, #0056b3)'
                    }}>
                      <TableCell padding="checkbox" sx={{ color: 'white' }}>
                        <Checkbox
                          checked={selectAll}
                          onChange={handleSelectAll}
                          sx={{ 
                            color: 'white',
                            '&.Mui-checked': { color: 'white' }
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Type</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Amount</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Class</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Status</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Availability</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Reference</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>User</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Date</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <AnimatePresence>
                      {transactions.map((t, index) => {
                        const isSelected = selectedTransactions.includes(t._id);
                        const user = t.userId;
                        
                        return (
                          <motion.tr
                            key={t._id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ delay: index * 0.02 }}
                            style={{ 
                              backgroundColor: isSelected 
                                ? (theme === 'dark' ? '#00ffff20' : '#007bff10') 
                                : 'inherit',
                              cursor: 'pointer'
                            }}
                            onClick={() => handleSelectTransaction(t._id)}
                          >
                            <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
                              <Checkbox
                                checked={isSelected}
                                onChange={() => handleSelectTransaction(t._id)}
                                sx={{
                                  color: theme === 'dark' ? '#00ffff' : '#007bff',
                                  '&.Mui-checked': {
                                    color: theme === 'dark' ? '#00ffff' : '#007bff',
                                  },
                                }}
                              />
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Avatar
                                  sx={{ 
                                    width: 32, 
                                    height: 32,
                                    bgcolor: getTypeColor(t.type),
                                    fontSize: '0.875rem'
                                  }}
                                >
                                  {getTypeIcon(t.type)}
                                </Avatar>
                                <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                                  {t.type.replace('_', ' ')}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Typography
                                variant="body2"
                                sx={{
                                  fontWeight: 'bold',
                                  color: t.type === 'withdrawal' || t.type === 'game_purchase' ? '#f44336' : '#4caf50'
                                }}
                              >
                                {t.type === 'withdrawal' || t.type === 'game_purchase' 
                                  ? `-${formatCurrency(t.amount)}` 
                                  : `+${formatCurrency(t.amount)}`}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip
                                icon={getClassIcon(t.class)}
                                label={t.class || 'Unknown'}
                                color={getClassColor(t.class)}
                                size="small"
                                sx={{ height: 24 }}
                              />
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={t.status}
                                icon={getStatusIcon(t.status)}
                                color={getStatusColor(t.status)}
                                size="small"
                                sx={{ height: 24 }}
                              />
                            </TableCell>
                            <TableCell>
                              <Tooltip title="Click to change availability">
                                <Chip
                                  icon={getAvailabilityIcon(t.availability)}
                                  label={availabilityOptions.find(opt => opt.value === t.availability)?.label || 'Active'}
                                  color={getAvailabilityColor(t.availability)}
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openAvailabilityDialog(t);
                                  }}
                                  sx={{ cursor: 'pointer' }}
                                />
                              </Tooltip>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                                {t.reference.substring(0, 12)}...
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                                {user?.name || user?.phone || 'N/A'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                                {formatDate(t.createdAt)}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Tooltip title="View History">
                                <IconButton
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openHistoryDialog(t);
                                  }}
                                  sx={{ 
                                    color: theme === 'dark' ? '#00ffff' : '#007bff',
                                    '&:hover': {
                                      backgroundColor: theme === 'dark' ? '#00ffff20' : '#007bff10'
                                    }
                                  }}
                                >
                                  <History fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                          </motion.tr>
                        );
                      })}
                    </AnimatePresence>
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
                    {filters.type || filters.status || filters.availability || filters.class
                      ? 'Try adjusting your filters' 
                      : 'No transactions recorded yet'}
                  </Typography>
                </Box>
              )}
            </Card>
          )}

          {/* Pagination */}
          {pagination.total > 1 && (
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center',
              mt: 4,
              flexDirection: { xs: 'column', sm: 'row' },
              gap: 2
            }}>
              <Pagination
                count={pagination.total}
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
                Showing {((filters.page - 1) * filters.limit) + 1} to {Math.min(filters.page * filters.limit, pagination.totalRecords)} of {pagination.totalRecords} transactions
              </Typography>
            </Box>
          )}
        </motion.div>
      )}

      {/* Availability Change Dialog */}
      <Dialog 
        open={availabilityDialog.open} 
        onClose={() => !loading && setAvailabilityDialog(prev => ({ ...prev, open: false }))}
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: { 
            borderRadius: 2,
            backgroundColor: theme === 'dark' ? '#0f172a' : 'white',
            color: theme === 'dark' ? '#ccd6f6' : '#333333'
          }
        }}
      >
        <DialogTitle sx={{ 
          background: theme === 'dark'
            ? 'linear-gradient(135deg, #00ffff, #00b3b3)'
            : 'linear-gradient(135deg, #007bff, #0056b3)',
          color: 'white',
          py: 3
        }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            {availabilityDialog.isBulk 
              ? 'Change Availability for Selected Transactions' 
              : 'Change Transaction Availability'}
          </Typography>
        </DialogTitle>
        
        <DialogContent sx={{ p: 3 }}>
          <DialogContentText sx={{ mb: 2, color: theme === 'dark' ? '#a8b2d1' : '#666666' }}>
            {availabilityDialog.isBulk 
              ? `You are about to change the availability of ${selectedTransactions.length} transactions.` 
              : `Current availability: ${availabilityDialog.currentAvailability}`}
          </DialogContentText>
          
          <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'medium' }}>
            Select New Availability
          </Typography>
          
          <RadioGroup
            value={availabilityDialog.newAvailability}
            onChange={(e) => setAvailabilityDialog(prev => ({ 
              ...prev, 
              newAvailability: e.target.value as 'active' | 'closed' | 'hidden' | 'pending' 
            }))}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {getAvailabilityTransitionOptions(availabilityDialog.currentAvailability).map(option => (
                <FormControlLabel
                  key={option.value}
                  value={option.value}
                  control={<Radio />}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip
                        icon={option.icon}
                        label={option.label}
                        color={option.color}
                        size="small"
                      />
                    </Box>
                  }
                />
              ))}
            </Box>
          </RadioGroup>

          <TextField
            fullWidth
            multiline
            rows={3}
            label="Reason for change (optional)"
            value={availabilityDialog.reason}
            onChange={(e) => setAvailabilityDialog(prev => ({ ...prev, reason: e.target.value }))}
            sx={{ mt: 3, ...textFieldStyle }}
          />
        </DialogContent>
        
        <DialogActions sx={{ 
          p: 3,
          borderTop: theme === 'dark' ? '1px solid #334155' : '1px solid #e5e7eb'
        }}>
          <Button 
            onClick={() => setAvailabilityDialog(prev => ({ ...prev, open: false }))}
            disabled={loading}
            sx={{
              color: theme === 'dark' ? '#00ffff' : '#007bff',
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleAvailabilityChange}
            variant="contained"
            disabled={loading || !availabilityDialog.newAvailability}
            startIcon={loading ? <CircularProgress size={20} /> : <Update />}
            sx={{
              background: theme === 'dark'
                ? 'linear-gradient(135deg, #00ffff, #00b3b3)'
                : 'linear-gradient(135deg, #007bff, #0056b3)',
              borderRadius: 1,
              '&:disabled': {
                background: theme === 'dark' ? '#334155' : '#e5e7eb'
              }
            }}
          >
            {loading ? 'Updating...' : 'Confirm Change'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* History Dialog */}
      <Dialog
        open={historyDialog.open}
        onClose={() => setHistoryDialog({ open: false, transaction: null })}
        maxWidth="md"
        fullWidth
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
          background: theme === 'dark'
            ? 'linear-gradient(135deg, #00ffff, #00b3b3)'
            : 'linear-gradient(135deg, #007bff, #0056b3)',
          color: 'white',
          py: 3
        }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Transaction History
          </Typography>
          {historyDialog.transaction && (
            <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.8)', mt: 0.5 }}>
              Reference: {historyDialog.transaction.reference}
            </Typography>
          )}
        </DialogTitle>
        
        <DialogContent sx={{ p: 3, overflowY: 'auto' }}>
          {(() => {
            const transaction = historyDialog.transaction;
            if (!transaction) {
              return (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body1" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                    No transaction data available
                  </Typography>
                </Box>
              );
            }
            
            return (
              <Box sx={{ mt: 2 }}>
                {/* Current Status */}
                <Card variant="outlined" sx={{ 
                  mb: 3, 
                  p: 2, 
                  bgcolor: theme === 'dark' ? '#1e293b' : '#f5f5f5',
                  border: theme === 'dark' ? '1px solid #334155' : '1px solid #e5e7eb'
                }}>
                  <Typography variant="subtitle2" gutterBottom sx={{ color: theme === 'dark' ? '#ccd6f6' : '#333333' }}>
                    Current Status
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <Chip 
                      label={`Status: ${transaction.status}`}
                      icon={getStatusIcon(transaction.status)}
                      color={getStatusColor(transaction.status)}
                    />
                    <Chip
                      icon={getClassIcon(transaction.class)}
                      label={`Class: ${transaction.class || 'Unknown'}`}
                      color={getClassColor(transaction.class)}
                    />
                    <Chip
                      icon={getAvailabilityIcon(transaction.availability)}
                      label={`Availability: ${availabilityOptions.find(opt => opt.value === transaction.availability)?.label || 'Active'}`}
                      color={getAvailabilityColor(transaction.availability)}
                    />
                  </Box>
                </Card>

                {/* Availability History */}
                {transaction.metadata?.availabilityHistory && 
                 transaction.metadata.availabilityHistory.length > 0 && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" gutterBottom sx={{ color: theme === 'dark' ? '#ccd6f6' : '#333333' }}>
                      Availability Change History
                    </Typography>
                    <List sx={{ 
                      bgcolor: theme === 'dark' ? '#0f172a' : 'white',
                      border: theme === 'dark' ? '1px solid #334155' : '1px solid #e5e7eb',
                      borderRadius: 1
                    }}>
                      {transaction.metadata.availabilityHistory.map((entry, index) => (
                        <ListItem key={index} divider={index < transaction.metadata!.availabilityHistory!.length - 1}>
                          <ListItemIcon>
                            <History sx={{ color: theme === 'dark' ? '#00ffff' : '#007bff' }} />
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                <Chip
                                  label={entry.from}
                                  size="small"
                                  color={getAvailabilityColor(entry.from)}
                                />
                                <span>→</span>
                                <Chip
                                  label={entry.to}
                                  size="small"
                                  color={getAvailabilityColor(entry.to)}
                                />
                                <Typography variant="caption" sx={{ color: theme === 'dark' ? '#a8b2d1' : '#666666' }}>
                                  by {entry.changedBy}
                                </Typography>
                              </Box>
                            }
                            secondary={
                              <Box sx={{ mt: 1 }}>
                                <Typography variant="caption" display="block" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                                  Date: {formatDate(entry.changedAt)}
                                </Typography>
                                {entry.reason && (
                                  <Typography variant="caption" display="block" sx={{ color: '#ff9800' }}>
                                    Reason: {entry.reason}
                                  </Typography>
                                )}
                              </Box>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}

                {/* Transaction Details */}
                <Box>
                  <Typography variant="subtitle2" gutterBottom sx={{ color: theme === 'dark' ? '#ccd6f6' : '#333333' }}>
                    Transaction Details
                  </Typography>
                  <Card variant="outlined" sx={{ 
                    p: 2, 
                    bgcolor: theme === 'dark' ? '#1e293b' : '#f5f5f5',
                    border: theme === 'dark' ? '1px solid #334155' : '1px solid #e5e7eb'
                  }}>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                      <Box sx={{ flex: '1 1 200px' }}>
                        <Typography variant="caption" color={theme === 'dark' ? '#a8b2d1' : '#666666'} display="block">
                          Amount
                        </Typography>
                        <Typography variant="body1" sx={{ 
                          fontWeight: 'bold',
                          color: transaction.type === 'withdrawal' || transaction.type === 'game_purchase' ? '#f44336' : '#4caf50'
                        }}>
                          {transaction.type === 'withdrawal' || transaction.type === 'game_purchase' 
                            ? `-${formatCurrency(transaction.amount)}` 
                            : `+${formatCurrency(transaction.amount)}`}
                        </Typography>
                      </Box>
                      <Box sx={{ flex: '1 1 200px' }}>
                        <Typography variant="caption" color={theme === 'dark' ? '#a8b2d1' : '#666666'} display="block">
                          Type
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ width: 24, height: 24, bgcolor: getTypeColor(transaction.type) }}>
                            {getTypeIcon(transaction.type)}
                          </Avatar>
                          <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                            {transaction.type.replace('_', ' ')}
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ flex: '1 1 200px' }}>
                        <Typography variant="caption" color={theme === 'dark' ? '#a8b2d1' : '#666666'} display="block">
                          Class
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {getClassIcon(transaction.class)}
                          <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                            {transaction.class || 'Unknown'}
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ flex: '1 1 200px' }}>
                        <Typography variant="caption" color={theme === 'dark' ? '#a8b2d1' : '#666666'} display="block">
                          Reference
                        </Typography>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                          {transaction.reference}
                        </Typography>
                      </Box>
                      <Box sx={{ flex: '1 1 200px' }}>
                        <Typography variant="caption" color={theme === 'dark' ? '#a8b2d1' : '#666666'} display="block">
                          User
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Person fontSize="small" sx={{ color: theme === 'dark' ? '#a8b2d1' : '#666666' }} />
                          <Typography variant="body2">
                            {transaction.userId?.name || transaction.userId?.phone || 'N/A'}
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ flex: '1 1 200px' }}>
                        <Typography variant="caption" color={theme === 'dark' ? '#a8b2d1' : '#666666'} display="block">
                          Created At
                        </Typography>
                        <Typography variant="body2">
                          {formatDate(transaction.createdAt)}
                        </Typography>
                      </Box>
                      <Box sx={{ flex: '1 1 200px' }}>
                        <Typography variant="caption" color={theme === 'dark' ? '#a8b2d1' : '#666666'} display="block">
                          Last Updated
                        </Typography>
                        <Typography variant="body2">
                          {formatDate(transaction.updatedAt)}
                        </Typography>
                      </Box>
                      {transaction.method && (
                        <Box sx={{ flex: '1 1 200px' }}>
                          <Typography variant="caption" color={theme === 'dark' ? '#a8b2d1' : '#666666'} display="block">
                            Method
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {getMethodIcon(transaction.method)}
                            <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                              {transaction.method}
                            </Typography>
                          </Box>
                        </Box>
                      )}
                      {transaction.description && (
                        <Box sx={{ flex: '1 1 100%' }}>
                          <Typography variant="caption" color={theme === 'dark' ? '#a8b2d1' : '#666666'} display="block">
                            Description
                          </Typography>
                          <Typography variant="body2">
                            {transaction.description}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Card>
                </Box>
              </Box>
            );
          })()}
        </DialogContent>
        
        <DialogActions sx={{ 
          p: 3,
          borderTop: theme === 'dark' ? '1px solid #334155' : '1px solid #e5e7eb'
        }}>
          <Button 
            onClick={() => setHistoryDialog({ open: false, transaction: null })}
            sx={{
              color: theme === 'dark' ? '#00ffff' : '#007bff',
            }}
          >
            Close
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

      <Snackbar 
        open={!!warning} 
        autoHideDuration={6000} 
        onClose={() => setWarning('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          severity="warning" 
          onClose={() => setWarning('')}
          sx={{ 
            borderRadius: 1,
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            backgroundColor: theme === 'dark' ? '#0f172a' : 'white',
            color: theme === 'dark' ? '#ff9800' : '#ff9800'
          }}
        >
          {warning}
        </Alert>
      </Snackbar>
    </Box>
  );
}