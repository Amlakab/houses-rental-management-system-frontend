'use client';

import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Button, TextField,
  Select, MenuItem, FormControl, InputLabel, Chip, Dialog,
  DialogTitle, DialogContent, DialogActions, IconButton,
  Paper, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Pagination, Alert, Snackbar, CircularProgress,
  useMediaQuery, Stack, Tooltip, TextareaAutosize
} from '@mui/material';
import { useTheme } from '@/lib/theme-context';
import { useAuth } from '@/lib/auth';
import {
  Check as CheckIcon,
  Close as CloseIcon,
  Visibility as ViewIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  AccountBalanceWallet as WalletIcon,
  ArrowUpward as WithdrawIcon,
  ArrowDownward as DepositIcon,
  HourglassEmpty as PendingIcon,
  CheckCircle as CompletedIcon,
  Cancel as FailedIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  AccountBalance as BankIcon,
  AttachMoney as CashIcon,
  ContentCopy as CopyIcon,
  OpenInNew as OpenInNewIcon
} from '@mui/icons-material';
import api from '@/app/utils/api';
import { formatCurrency } from '@/lib/utils';
import { motion } from 'framer-motion';

type TransactionType = {
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
};

export default function ApproveTransactionsPage() {
  const { theme } = useTheme();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const { user } = useAuth();
  
  const [transactions, setTransactions] = useState<TransactionType[]>([]);
  const [loading, setLoading] = useState(true);
  const [openViewModal, setOpenViewModal] = useState(false);
  const [openActionModal, setOpenActionModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionType | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [pagination, setPagination] = useState({
    current: 1,
    total: 1,
    count: 0,
    totalRecords: 0
  });

  const [filters, setFilters] = useState({
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
    },
    '& .MuiInputLabel-root.Mui-focused': {
      color: theme === 'dark' ? '#00ffff' : '#007bff',
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [filters]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value.toString());
      });
      
      const res = await api.get(`/transactions?${params}`);
      setTransactions(res.data.data);
      setPagination(res.data.pagination);
    } catch (error: any) {
      console.error('Failed to fetch transactions:', error);
      showMessage('Failed to load transactions', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleViewTransaction = (transaction: TransactionType) => {
    setSelectedTransaction(transaction);
    setOpenViewModal(true);
  };

  const handleActionClick = (transaction: TransactionType, action: 'approve' | 'reject') => {
    setSelectedTransaction(transaction);
    setActionType(action);
    setReason('');
    setOpenActionModal(true);
  };

  const handleActionSubmit = async () => {
    if (!selectedTransaction || !actionType) return;

    try {
      // Get user from localStorage
      const userData = localStorage.getItem('user');
      const user = userData ? JSON.parse(userData) : null;
      
      if (actionType === 'approve') {
        await api.put(`/transactions/approve/${selectedTransaction._id}`, { 
          reason 
        });
        showMessage('Transaction approved successfully!', 'success');
      } else if (actionType === 'reject') {
        if (!reason.trim()) {
          showMessage('Please provide a reason for rejection', 'error');
          return;
        }
        await api.put(`/transactions/reject/${selectedTransaction._id}`, { reason });
        showMessage('Transaction rejected successfully!', 'success');
      }

      setOpenActionModal(false);
      setSelectedTransaction(null);
      setActionType(null);
      setReason('');
      fetchTransactions();
    } catch (error: any) {
      showMessage(error.response?.data?.message || 'Action failed', 'error');
    }
  };

  const getTransactionLink = (transactionId?: string, method?: string) => {
    if (!transactionId) return null;
    
    if (transactionId.startsWith('http')) {
      return transactionId;
    }
    
    if (method === 'cbe') {
      return `https://apps.cbe.com.et:100/?id=${transactionId}`;
    } else if (method === 'telebirr') {
      return `https://telebirr.ethiotelecom.et/txn/${transactionId}`;
    }
    return null;
  };

  const openTransactionInPopup = (transactionId?: string, method?: string) => {
    const link = getTransactionLink(transactionId, method);
    if (link) {
      window.open(link, '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showMessage('Copied to clipboard!', 'success');
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CompletedIcon fontSize="small" />;
      case 'approved': return <CheckIcon fontSize="small" />;
      case 'pending': return <PendingIcon fontSize="small" />;
      case 'confirmed': return <CheckIcon fontSize="small" />;
      case 'failed': return <FailedIcon fontSize="small" />;
      default: return <PendingIcon fontSize="small" />;
    }
  };

  const getMethodIcon = (method?: string) => {
    switch (method) {
      case 'telebirr': return <PhoneIcon fontSize="small" />;
      case 'cbe': return <BankIcon fontSize="small" />;
      case 'cash': return <CashIcon fontSize="small" />;
      default: return <BankIcon fontSize="small" />;
    }
  };

  const resetFilters = () => {
    setFilters({
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
          <Box sx={{ mb: 4 }}>
            <Typography variant={isMobile ? "h5" : "h4"} sx={{ 
              fontWeight: 'bold', 
              color: themeStyles.textColor,
              mb: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              <CheckIcon /> Transactions Management
            </Typography>
            <Typography variant={isMobile ? "body2" : "body1"} color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
              View all transactions and manage pending transactions
            </Typography>
          </Box>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
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
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, mb: 2 }}>
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
                  sx={{ flex: 1, ...textFieldStyle }}
                />
                
                <Box sx={{ display: 'flex', gap: 2, width: { xs: '100%', md: 'auto' } }}>
                  <Button
                    variant="outlined"
                    startIcon={<RefreshIcon />}
                    onClick={resetFilters}
                    sx={{
                      borderColor: themeStyles.primaryColor,
                      color: themeStyles.primaryColor,
                      '&:hover': {
                        borderColor: themeStyles.primaryColor,
                        backgroundColor: theme === 'dark' ? '#00ffff20' : '#007bff10'
                      }
                    }}
                  >
                    Reset
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
              
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
                <FormControl size="small" sx={{ flex: 1 }}>
                  <InputLabel sx={{ color: theme === 'dark' ? '#a8b2d1' : '#666666' }}>Type</InputLabel>
                  <Select
                    value={filters.type}
                    label="Type"
                    onChange={(e) => setFilters({...filters, type: e.target.value, page: 1})}
                    sx={{
                      backgroundColor: theme === 'dark' ? '#1e293b' : 'white',
                      color: theme === 'dark' ? '#ccd6f6' : '#333333',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: theme === 'dark' ? '#334155' : '#e5e7eb',
                      },
                    }}
                  >
                    <MenuItem value="">All Types</MenuItem>
                    <MenuItem value="deposit">Deposit</MenuItem>
                    <MenuItem value="withdrawal">Withdrawal</MenuItem>
                    <MenuItem value="game_purchase">Game Purchase</MenuItem>
                    <MenuItem value="winning">Winning</MenuItem>
                  </Select>
                </FormControl>
                
                <FormControl size="small" sx={{ flex: 1 }}>
                  <InputLabel sx={{ color: theme === 'dark' ? '#a8b2d1' : '#666666' }}>Status</InputLabel>
                  <Select
                    value={filters.status}
                    label="Status"
                    onChange={(e) => setFilters({...filters, status: e.target.value, page: 1})}
                    sx={{
                      backgroundColor: theme === 'dark' ? '#1e293b' : 'white',
                      color: theme === 'dark' ? '#ccd6f6' : '#333333',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: theme === 'dark' ? '#334155' : '#e5e7eb',
                      },
                    }}
                  >
                    <MenuItem value="">All Status</MenuItem>
                    <MenuItem value="pending">Pending</MenuItem>
                    <MenuItem value="approved">Approved</MenuItem>
                    <MenuItem value="completed">Completed</MenuItem>
                    <MenuItem value="confirmed">Confirmed</MenuItem>
                    <MenuItem value="failed">Failed</MenuItem>
                  </Select>
                </FormControl>
                
                <FormControl size="small" sx={{ flex: 1 }}>
                  <InputLabel sx={{ color: theme === 'dark' ? '#a8b2d1' : '#666666' }}>Method</InputLabel>
                  <Select
                    value={filters.method}
                    label="Method"
                    onChange={(e) => setFilters({...filters, method: e.target.value, page: 1})}
                    sx={{
                      backgroundColor: theme === 'dark' ? '#1e293b' : 'white',
                      color: theme === 'dark' ? '#ccd6f6' : '#333333',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: theme === 'dark' ? '#334155' : '#e5e7eb',
                      },
                    }}
                  >
                    <MenuItem value="">All Methods</MenuItem>
                    <MenuItem value="cash">Cash</MenuItem>
                    <MenuItem value="telebirr">Telebirr</MenuItem>
                    <MenuItem value="cbe">CBE</MenuItem>
                  </Select>
                </FormControl>
                
                <FormControl size="small" sx={{ flex: 1 }}>
                  <InputLabel sx={{ color: theme === 'dark' ? '#a8b2d1' : '#666666' }}>Class</InputLabel>
                  <Select
                    value={filters.class}
                    label="Class"
                    onChange={(e) => setFilters({...filters, class: e.target.value, page: 1})}
                    sx={{
                      backgroundColor: theme === 'dark' ? '#1e293b' : 'white',
                      color: theme === 'dark' ? '#ccd6f6' : '#333333',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: theme === 'dark' ? '#334155' : '#e5e7eb',
                      },
                    }}
                  >
                    <MenuItem value="">All Classes</MenuItem>
                    <MenuItem value="user">User</MenuItem>
                    <MenuItem value="agent">Agent</MenuItem>
                    <MenuItem value="admin">Admin</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              
              <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                <TextField
                  size="small"
                  label="Start Date"
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters({...filters, startDate: e.target.value, page: 1})}
                  InputLabelProps={{ shrink: true }}
                  sx={{ flex: 1, ...textFieldStyle }}
                />
                
                <TextField
                  size="small"
                  label="End Date"
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters({...filters, endDate: e.target.value, page: 1})}
                  InputLabelProps={{ shrink: true }}
                  sx={{ flex: 1, ...textFieldStyle }}
                />
              </Box>
            </CardContent>
          </Card>
        </motion.div>

        {/* Transactions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card sx={{ 
            borderRadius: 2,
            backgroundColor: themeStyles.cardBg,
            border: `1px solid ${themeStyles.cardBorder}`,
            boxShadow: theme === 'dark' 
              ? '0 4px 12px rgba(0,0,0,0.3)' 
              : '0 4px 12px rgba(0,0,0,0.08)'
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
                  <PendingIcon sx={{ fontSize: 48, color: theme === 'dark' ? '#334155' : '#cbd5e1', mb: 2 }} />
                  <Typography variant="body1" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                    No transactions found
                  </Typography>
                </Box>
              ) : isMobile ? (
                /* Mobile View - Cards */
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {transactions.map((transaction) => (
                    <Paper 
                      key={transaction._id}
                      sx={{ 
                        p: 2,
                        backgroundColor: theme === 'dark' ? '#1e293b' : '#f8f9fa',
                        border: `1px solid ${themeStyles.cardBorder}`,
                        borderRadius: 1
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Box>
                          <Typography variant="subtitle2" sx={{ 
                            fontWeight: 'bold',
                            color: themeStyles.textColor,
                            mb: 0.5
                          }}>
                            {transaction.userId?.name || 'Unknown'}
                          </Typography>
                          <Typography variant="caption" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                            {transaction.userId?.phone}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5 }}>
                          <Chip
                            label={transaction.type.toUpperCase()}
                            size="small"
                            sx={{
                              backgroundColor: transaction.type === 'deposit' 
                                ? (theme === 'dark' ? '#00ffff20' : '#007bff20')
                                : (theme === 'dark' ? '#ff000020' : '#dc354520'),
                              color: transaction.type === 'deposit' 
                                ? (theme === 'dark' ? '#00ffff' : '#007bff')
                                : (theme === 'dark' ? '#ff0000' : '#dc3545'),
                              fontWeight: 'medium'
                            }}
                          />
                          <Chip
                            label={transaction.status.toUpperCase()}
                            size="small"
                            icon={getStatusIcon(transaction.status)}
                            sx={{
                              backgroundColor: `${getStatusColor(transaction.status)}20`,
                              color: getStatusColor(transaction.status),
                              fontWeight: 'medium'
                            }}
                          />
                        </Box>
                      </Box>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="body2" sx={{ 
                          fontWeight: 'bold',
                          color: transaction.type === 'deposit' 
                            ? (theme === 'dark' ? '#00ff00' : '#28a745')
                            : (theme === 'dark' ? '#ff0000' : '#dc3545')
                        }}>
                          {formatCurrency(transaction.amount)}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          {getMethodIcon(transaction.method)}
                          <Typography variant="caption" sx={{ textTransform: 'capitalize' }}>
                            {transaction.method || 'N/A'}
                          </Typography>
                        </Box>
                      </Box>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Chip
                          label={transaction.class}
                          size="small"
                          sx={{
                            backgroundColor: theme === 'dark' ? '#334155' : '#e5e7eb',
                            color: theme === 'dark' ? '#a8b2d1' : '#666666'
                          }}
                        />
                        <Typography variant="caption" color={theme === 'dark' ? '#94a3b8' : '#999999'}>
                          {new Date(transaction.createdAt).toLocaleDateString()}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<ViewIcon />}
                          onClick={() => handleViewTransaction(transaction)}
                          sx={{
                            flex: 1,
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
                        
                        {transaction.status === 'pending' && (
                          <>
                            <Button
                              size="small"
                              variant="contained"
                              startIcon={<CheckIcon />}
                              onClick={() => handleActionClick(transaction, 'approve')}
                              sx={{
                                flex: 1,
                                background: theme === 'dark'
                                  ? 'linear-gradient(135deg, #00ff00, #00b300)'
                                  : 'linear-gradient(135deg, #28a745, #218838)',
                                borderRadius: 1,
                                '&:hover': {
                                  background: theme === 'dark'
                                    ? 'linear-gradient(135deg, #00b300, #008000)'
                                    : 'linear-gradient(135deg, #218838, #1e7e34)'
                                }
                              }}
                            >
                              Approve
                            </Button>
                            
                            <Button
                              size="small"
                              variant="contained"
                              startIcon={<CloseIcon />}
                              onClick={() => handleActionClick(transaction, 'reject')}
                              sx={{
                                flex: 1,
                                background: theme === 'dark'
                                  ? 'linear-gradient(135deg, #ff0000, #cc0000)'
                                  : 'linear-gradient(135deg, #dc3545, #c82333)',
                                borderRadius: 1,
                                '&:hover': {
                                  background: theme === 'dark'
                                    ? 'linear-gradient(135deg, #cc0000, #990000)'
                                    : 'linear-gradient(135deg, #c82333, #bd2130)'
                                }
                              }}
                            >
                              Reject
                            </Button>
                          </>
                        )}
                      </Box>
                    </Paper>
                  ))}
                </Box>
              ) : (
                /* Desktop View - Table */
                <>
                  <TableContainer sx={{ maxWidth: '100%', overflowX: 'auto' }}>
                    <Table>
                      <TableHead>
                        <TableRow sx={{ 
                          background: theme === 'dark'
                            ? 'linear-gradient(135deg, #00ffff, #00b3b3)'
                            : 'linear-gradient(135deg, #007bff, #0056b3)'
                        }}>
                          <TableCell sx={{ color: 'white', fontWeight: 'bold', py: 2 }}>User</TableCell>
                          <TableCell sx={{ color: 'white', fontWeight: 'bold', py: 2 }}>Type</TableCell>
                          <TableCell sx={{ color: 'white', fontWeight: 'bold', py: 2 }}>Amount</TableCell>
                          <TableCell sx={{ color: 'white', fontWeight: 'bold', py: 2 }}>Status</TableCell>
                          <TableCell sx={{ color: 'white', fontWeight: 'bold', py: 2 }}>Method</TableCell>
                          <TableCell sx={{ color: 'white', fontWeight: 'bold', py: 2 }}>Class</TableCell>
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
                                    : (theme === 'dark' ? '#ff000020' : '#dc354520'),
                                  color: transaction.type === 'deposit' 
                                    ? (theme === 'dark' ? '#00ffff' : '#007bff')
                                    : (theme === 'dark' ? '#ff0000' : '#dc3545'),
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
                                icon={getStatusIcon(transaction.status)}
                                sx={{
                                  backgroundColor: `${getStatusColor(transaction.status)}20`,
                                  color: getStatusColor(transaction.status),
                                  fontWeight: 'medium'
                                }}
                              />
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                {getMethodIcon(transaction.method)}
                                <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                                  {transaction.method || 'N/A'}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={transaction.class}
                                size="small"
                                sx={{
                                  backgroundColor: theme === 'dark' ? '#334155' : '#e5e7eb',
                                  color: theme === 'dark' ? '#a8b2d1' : '#666666'
                                }}
                              />
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {new Date(transaction.createdAt).toLocaleDateString()}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', gap: 1 }}>
                                <Tooltip title="View">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleViewTransaction(transaction)}
                                    sx={{ 
                                      color: themeStyles.primaryColor,
                                      '&:hover': {
                                        backgroundColor: theme === 'dark' ? '#00ffff20' : '#007bff10'
                                      }
                                    }}
                                  >
                                    <ViewIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                
                                {transaction.status === 'pending' && (
                                  <>
                                    <Tooltip title="Approve">
                                      <IconButton
                                        size="small"
                                        onClick={() => handleActionClick(transaction, 'approve')}
                                        sx={{ 
                                          color: theme === 'dark' ? '#00ff00' : '#28a745',
                                          '&:hover': {
                                            backgroundColor: theme === 'dark' ? '#00ff0020' : '#28a74510'
                                          }
                                        }}
                                      >
                                        <CheckIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                    
                                    <Tooltip title="Reject">
                                      <IconButton
                                        size="small"
                                        onClick={() => handleActionClick(transaction, 'reject')}
                                        sx={{ 
                                          color: theme === 'dark' ? '#ff0000' : '#dc3545',
                                          '&:hover': {
                                            backgroundColor: theme === 'dark' ? '#ff000020' : '#dc354510'
                                          }
                                        }}
                                      >
                                        <CloseIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                  </>
                                )}
                              </Box>
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
        </motion.div>

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
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {/* Basic Information */}
                  <Paper sx={{ p: 2, backgroundColor: theme === 'dark' ? '#1e293b' : '#f8f9fa', borderRadius: 1 }}>
                    <Typography variant="subtitle1" sx={{ 
                      mb: 2,
                      color: themeStyles.textColor,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}>
                      📋 Basic Information
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="caption" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                          Transaction ID
                        </Typography>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                          {selectedTransaction._id}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="caption" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                          Reference
                        </Typography>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                          {selectedTransaction.reference}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="caption" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                          Type
                        </Typography>
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
                            fontWeight: 'medium'
                          }}
                        />
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="caption" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                          Class
                        </Typography>
                        <Typography variant="body2">
                          {selectedTransaction.class}
                        </Typography>
                      </Box>
                    </Box>
                  </Paper>

                  {/* Amount Details */}
                  <Paper sx={{ p: 2, backgroundColor: theme === 'dark' ? '#1e293b' : '#f8f9fa', borderRadius: 1 }}>
                    <Typography variant="subtitle1" sx={{ 
                      mb: 2,
                      color: themeStyles.textColor,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}>
                      💰 Amount Details
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="caption" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                          Amount
                        </Typography>
                        <Typography variant="h6" sx={{ 
                          color: selectedTransaction.type === 'deposit' 
                            ? (theme === 'dark' ? '#00ff00' : '#28a745')
                            : (theme === 'dark' ? '#ff0000' : '#dc3545')
                        }}>
                          {formatCurrency(selectedTransaction.amount)}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="caption" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                          Amount in Words
                        </Typography>
                        <Typography variant="body2">
                          {selectedTransaction.amountInString}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="caption" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                          Method
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          {getMethodIcon(selectedTransaction.method)}
                          <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                            {selectedTransaction.method}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </Paper>

                  {/* Status & Dates */}
                  <Paper sx={{ p: 2, backgroundColor: theme === 'dark' ? '#1e293b' : '#f8f9fa', borderRadius: 1 }}>
                    <Typography variant="subtitle1" sx={{ 
                      mb: 2,
                      color: themeStyles.textColor,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}>
                      📅 Status & Timeline
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="caption" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                          Status
                        </Typography>
                        <Chip
                          label={selectedTransaction.status.toUpperCase()}
                          size="small"
                          icon={getStatusIcon(selectedTransaction.status)}
                          sx={{
                            backgroundColor: `${getStatusColor(selectedTransaction.status)}20`,
                            color: getStatusColor(selectedTransaction.status),
                            fontWeight: 'medium'
                          }}
                        />
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="caption" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                          Created
                        </Typography>
                        <Typography variant="body2">
                          {new Date(selectedTransaction.createdAt).toLocaleString()}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="caption" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                          Updated
                        </Typography>
                        <Typography variant="body2">
                          {new Date(selectedTransaction.updatedAt).toLocaleString()}
                        </Typography>
                      </Box>
                    </Box>
                  </Paper>

                  {/* User Information */}
                  <Paper sx={{ p: 2, backgroundColor: theme === 'dark' ? '#1e293b' : '#f8f9fa', borderRadius: 1 }}>
                    <Typography variant="subtitle1" sx={{ 
                      mb: 2,
                      color: themeStyles.textColor,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}>
                      👤 User Information
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="caption" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                          Name
                        </Typography>
                        <Typography variant="body2">
                          {selectedTransaction.userId?.name || 'Unknown'}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="caption" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                          Phone
                        </Typography>
                        <Typography variant="body2">
                          {selectedTransaction.userId?.phone}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="caption" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                          User ID
                        </Typography>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                          {selectedTransaction.userId?._id}
                        </Typography>
                      </Box>
                    </Box>
                  </Paper>

                  {/* Parties Involved */}
                  {(selectedTransaction.senderPhone || selectedTransaction.receiverPhone || 
                    selectedTransaction.senderName || selectedTransaction.receiverName) && (
                    <Paper sx={{ p: 2, backgroundColor: theme === 'dark' ? '#1e293b' : '#f8f9fa', borderRadius: 1 }}>
                      <Typography variant="subtitle1" sx={{ 
                        mb: 2,
                        color: themeStyles.textColor,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1
                      }}>
                        🤝 Parties Involved
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {selectedTransaction.senderPhone && (
                          <Box>
                            <Typography variant="caption" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                              Sender {selectedTransaction.method === 'telebirr' ? 'Phone' : 'Account'}
                            </Typography>
                            <Typography variant="body2">
                              {selectedTransaction.senderPhone}
                            </Typography>
                            {selectedTransaction.senderName && (
                              <Typography variant="caption" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                                ({selectedTransaction.senderName})
                              </Typography>
                            )}
                          </Box>
                        )}
                        {selectedTransaction.receiverPhone && (
                          <Box>
                            <Typography variant="caption" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                              Receiver {selectedTransaction.method === 'telebirr' ? 'Phone' : 'Account'}
                            </Typography>
                            <Typography variant="body2">
                              {selectedTransaction.receiverPhone}
                            </Typography>
                            {selectedTransaction.receiverName && (
                              <Typography variant="caption" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                                ({selectedTransaction.receiverName})
                              </Typography>
                            )}
                          </Box>
                        )}
                      </Box>
                    </Paper>
                  )}

                  {/* Additional Information */}
                  <Paper sx={{ p: 2, backgroundColor: theme === 'dark' ? '#1e293b' : '#f8f9fa', borderRadius: 1 }}>
                    <Typography variant="subtitle1" sx={{ 
                      mb: 2,
                      color: themeStyles.textColor,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}>
                      📝 Additional Information
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Box>
                        <Typography variant="caption" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                          Description
                        </Typography>
                        <Typography variant="body2">
                          {selectedTransaction.description}
                        </Typography>
                      </Box>
                      {selectedTransaction.transactionId && (
                        <Box>
                          <Typography variant="caption" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                            Transaction ID
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                            {(() => {
                              const link = getTransactionLink(selectedTransaction.transactionId, selectedTransaction.method);
                              if (link) {
                                return (
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Button
                                      onClick={() => openTransactionInPopup(selectedTransaction.transactionId, selectedTransaction.method)}
                                      startIcon={<OpenInNewIcon />}
                                      sx={{
                                        textTransform: 'none',
                                        fontSize: '0.75rem',
                                        p: 0,
                                        color: themeStyles.primaryColor
                                      }}
                                    >
                                      {selectedTransaction.transactionId}
                                    </Button>
                                    <IconButton
                                      size="small"
                                      onClick={() => copyToClipboard(selectedTransaction.transactionId!)}
                                    >
                                      <CopyIcon fontSize="small" />
                                    </IconButton>
                                  </Box>
                                );
                              } else {
                                return (
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                                      {selectedTransaction.transactionId}
                                    </Typography>
                                    <IconButton
                                      size="small"
                                      onClick={() => copyToClipboard(selectedTransaction.transactionId!)}
                                    >
                                      <CopyIcon fontSize="small" />
                                    </IconButton>
                                  </Box>
                                );
                              }
                            })()}
                          </Box>
                        </Box>
                      )}
                      {selectedTransaction.reason && (
                        <Box>
                          <Typography variant="caption" color={theme === 'dark' ? '#ff0000' : '#dc3545'}>
                            Reason
                          </Typography>
                          <Typography variant="body2" color={theme === 'dark' ? '#ff0000' : '#dc3545'}>
                            {selectedTransaction.reason}
                          </Typography>
                        </Box>
                      )}
                      {selectedTransaction.metadata && (
                        <Box>
                          <Typography variant="caption" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                            Metadata
                          </Typography>
                          <Paper sx={{ 
                            p: 2, 
                            backgroundColor: theme === 'dark' ? '#0f172a' : '#f1f5f9',
                            overflow: 'auto',
                            maxHeight: 200
                          }}>
                            <Typography variant="body2" sx={{ 
                              fontFamily: 'monospace', 
                              fontSize: '0.75rem',
                              whiteSpace: 'pre-wrap',
                              wordBreak: 'break-all'
                            }}>
                              {JSON.stringify(selectedTransaction.metadata, null, 2)}
                            </Typography>
                          </Paper>
                        </Box>
                      )}
                    </Box>
                  </Paper>

                  {/* Approval Information */}
                  {(selectedTransaction.approvedBy || selectedTransaction.approvedAt) && (
                    <Paper sx={{ p: 2, backgroundColor: theme === 'dark' ? '#1e293b' : '#f8f9fa', borderRadius: 1 }}>
                      <Typography variant="subtitle1" sx={{ 
                        mb: 2,
                        color: themeStyles.textColor,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1
                      }}>
                        ✅ Approval Information
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {selectedTransaction.approvedBy && (
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="caption" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                              Approved By
                            </Typography>
                            <Typography variant="body2">
                              {selectedTransaction.approvedBy}
                            </Typography>
                          </Box>
                        )}
                        {selectedTransaction.approvedAt && (
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="caption" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                              Approved At
                            </Typography>
                            <Typography variant="body2">
                              {new Date(selectedTransaction.approvedAt).toLocaleString()}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </Paper>
                  )}

                  {/* Completion Information */}
                  {(selectedTransaction.completedBy || selectedTransaction.completedAt) && (
                    <Paper sx={{ p: 2, backgroundColor: theme === 'dark' ? '#1e293b' : '#f8f9fa', borderRadius: 1 }}>
                      <Typography variant="subtitle1" sx={{ 
                        mb: 2,
                        color: themeStyles.textColor,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1
                      }}>
                        ✅ Completion Information
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {selectedTransaction.completedBy && (
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="caption" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                              Completed By
                            </Typography>
                            <Typography variant="body2">
                              {selectedTransaction.completedBy}
                            </Typography>
                          </Box>
                        )}
                        {selectedTransaction.completedAt && (
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="caption" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                              Completed At
                            </Typography>
                            <Typography variant="body2">
                              {new Date(selectedTransaction.completedAt).toLocaleString()}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </Paper>
                  )}

                  {/* Confirmation Information */}
                  {(selectedTransaction.confirmedBy || selectedTransaction.confirmedAt) && (
                    <Paper sx={{ p: 2, backgroundColor: theme === 'dark' ? '#1e293b' : '#f8f9fa', borderRadius: 1 }}>
                      <Typography variant="subtitle1" sx={{ 
                        mb: 2,
                        color: themeStyles.textColor,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1
                      }}>
                        ✅ Confirmation Information
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {selectedTransaction.confirmedBy && (
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="caption" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                              Confirmed By
                            </Typography>
                            <Typography variant="body2">
                              {selectedTransaction.confirmedBy}
                            </Typography>
                          </Box>
                        )}
                        {selectedTransaction.confirmedAt && (
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="caption" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                              Confirmed At
                            </Typography>
                            <Typography variant="body2">
                              {new Date(selectedTransaction.confirmedAt).toLocaleString()}
                            </Typography>
                          </Box>
                        )}
                      </Box>
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
                
                {selectedTransaction.status === 'pending' && (
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button 
                      variant="contained"
                      onClick={() => {
                        setOpenViewModal(false);
                        handleActionClick(selectedTransaction, 'reject');
                      }}
                      sx={{
                        background: theme === 'dark'
                          ? 'linear-gradient(135deg, #ff0000, #cc0000)'
                          : 'linear-gradient(135deg, #dc3545, #c82333)',
                        borderRadius: 1,
                        '&:hover': {
                          background: theme === 'dark'
                            ? 'linear-gradient(135deg, #cc0000, #990000)'
                            : 'linear-gradient(135deg, #c82333, #bd2130)'
                        }
                      }}
                    >
                      Reject
                    </Button>
                    
                    <Button 
                      variant="contained"
                      onClick={() => {
                        setOpenViewModal(false);
                        handleActionClick(selectedTransaction, 'approve');
                      }}
                      sx={{
                        background: theme === 'dark'
                          ? 'linear-gradient(135deg, #00ff00, #00b300)'
                          : 'linear-gradient(135deg, #28a745, #218838)',
                        borderRadius: 1,
                        '&:hover': {
                          background: theme === 'dark'
                            ? 'linear-gradient(135deg, #00b300, #008000)'
                            : 'linear-gradient(135deg, #218838, #1e7e34)'
                        }
                      }}
                    >
                      Approve
                    </Button>
                  </Box>
                )}
              </DialogActions>
            </>
          )}
        </Dialog>

        {/* Action Modal */}
        <Dialog 
          open={openActionModal} 
          onClose={() => setOpenActionModal(false)} 
          maxWidth="sm" 
          fullWidth
          PaperProps={{
            sx: { 
              borderRadius: 2,
              backgroundColor: themeStyles.cardBg,
              color: themeStyles.textColor
            }
          }}
        >
          <DialogTitle sx={{ 
            borderBottom: `1px solid ${themeStyles.cardBorder}`,
            py: 3
          }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              {actionType === 'approve' ? 'Approve Transaction' : 'Reject Transaction'}
            </Typography>
          </DialogTitle>
          
          <DialogContent sx={{ p: 3 }}>
            {selectedTransaction && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color={theme === 'dark' ? '#a8b2d1' : '#666666'} gutterBottom>
                  Transaction Details:
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                  {selectedTransaction.type.toUpperCase()} - {formatCurrency(selectedTransaction.amount)}
                </Typography>
                <Typography variant="body2" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                  User: {selectedTransaction.userId?.name} ({selectedTransaction.userId?.phone})
                </Typography>
                <Typography variant="body2" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                  Method: {selectedTransaction.method?.toUpperCase()}
                </Typography>
              </Box>
            )}
            
            {actionType === 'reject' && (
              <TextField
                fullWidth
                label="Reason for Rejection"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                multiline
                rows={3}
                required
                sx={textFieldStyle}
              />
            )}
            
            {actionType === 'approve' && (
              <Alert 
                severity="info" 
                sx={{ 
                  backgroundColor: theme === 'dark' ? '#00ffff20' : '#007bff10',
                  color: themeStyles.primaryColor,
                  border: `1px solid ${themeStyles.primaryColor}40`
                }}
              >
                Are you sure you want to approve this transaction?
              </Alert>
            )}
          </DialogContent>
          
          <DialogActions sx={{ p: 3, borderTop: `1px solid ${themeStyles.cardBorder}` }}>
            <Button 
              onClick={() => setOpenActionModal(false)}
              sx={{
                color: themeStyles.primaryColor,
                '&:hover': {
                  backgroundColor: theme === 'dark' ? '#00ffff20' : '#007bff10'
                }
              }}
            >
              Cancel
            </Button>
            
            <Button 
              variant="contained"
              onClick={handleActionSubmit}
              disabled={actionType === 'reject' && !reason.trim()}
              sx={{
                background: actionType === 'approve'
                  ? (theme === 'dark'
                      ? 'linear-gradient(135deg, #00ff00, #00b300)'
                      : 'linear-gradient(135deg, #28a745, #218838)')
                  : (theme === 'dark'
                      ? 'linear-gradient(135deg, #ff0000, #cc0000)'
                      : 'linear-gradient(135deg, #dc3545, #c82333)'),
                borderRadius: 1,
                '&:hover': {
                  background: actionType === 'approve'
                    ? (theme === 'dark'
                        ? 'linear-gradient(135deg, #00b300, #008000)'
                        : 'linear-gradient(135deg, #218838, #1e7e34)')
                    : (theme === 'dark'
                        ? 'linear-gradient(135deg, #cc0000, #990000)'
                        : 'linear-gradient(135deg, #c82333, #bd2130)')
                },
                '&.Mui-disabled': {
                  background: theme === 'dark' ? '#334155' : '#e5e7eb',
                  color: theme === 'dark' ? '#94a3b8' : '#94a3b8'
                }
              }}
            >
              {actionType === 'approve' ? 'Approve' : 'Reject'}
            </Button>
          </DialogActions>
        </Dialog>

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
      </Box>
    </div>
  );
}