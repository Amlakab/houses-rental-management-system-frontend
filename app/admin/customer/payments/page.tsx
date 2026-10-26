'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Card, CardContent, Chip, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  CircularProgress, useMediaQuery, Snackbar, Alert,
  Avatar, LinearProgress,
  Tabs, Tab, TextField, InputAdornment
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/lib/theme-context';
import { useLanguage } from '@/lib/language-context';
import {
  Payment as PaymentIcon, CheckCircle, Cancel,
  HourglassEmpty, Receipt, AttachMoney,
  Home, Refresh,
  Phone, Close, Search,
  ArrowUpward, ArrowDownward, AccountBalance
} from '@mui/icons-material';
import api from '@/app/utils/api';
import { format } from 'date-fns';

interface Transaction {
  _id: string;
  reference: string;
  amount: number;
  amountInString?: string;
  type: string;
  class?: string;
  status: 'pending' | 'approved' | 'completed' | 'confirmed' | 'failed';
  method: string;
  description: string;
  metadata?: any;
  houseId?: {
    _id: string;
    title: string;
    isDeleted?: boolean;
  };
  orderId?: {
    _id: string;
  };
  transactionId?: string;
  senderPhone?: string;
  senderName?: string;
  receiverPhone?: string;
  receiverName?: string;
  createdAt: string;
  updatedAt: string;
  approvedAt?: string;
  completedAt?: string;
  confirmedAt?: string;
  approvedBy?: string;
  completedBy?: string;
  confirmedBy?: string;
}

interface TransactionStats {
  totalTransactions: number;
  totalDeposits: number;
  totalWithdrawals: number;
  totalPropertyPurchases: number;
  pendingDeposits: number;
  pendingPropertyPayments: number;
  netBalance: number;
}

const statusColors: Record<string, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
  pending: 'warning',
  approved: 'info',
  completed: 'success',
  confirmed: 'success',
  failed: 'error'
};

const statusIcons: Record<string, React.ReactElement> = {
  pending: <HourglassEmpty fontSize="small" />,
  approved: <CheckCircle fontSize="small" />,
  completed: <CheckCircle fontSize="small" />,
  confirmed: <CheckCircle fontSize="small" />,
  failed: <Cancel fontSize="small" />
};

const methodIcons: Record<string, React.ReactElement> = {
  telebirr: <Phone fontSize="small" />,
  cbe: <AccountBalance fontSize="small" />,
  cash: <AttachMoney fontSize="small" />
};

/* Reusable responsive detail row */
interface DetailRowProps {
  label: string;
  value: React.ReactNode;
  isDark: boolean;
  mono?: boolean;
  valueColor?: string;
}

function DetailRow({ label, value, isDark, mono, valueColor }: DetailRowProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 2,
        pb: 1,
        borderBottom: `1px solid ${isDark ? '#1e293b' : '#f1f5f9'}`,
        flexWrap: 'wrap'
      }}
    >
      <Typography
        variant="body2"
        sx={{ color: isDark ? '#94a3b8' : '#64748b', flexShrink: 0 }}
      >
        {label}
      </Typography>
      <Typography
        variant="body2"
        sx={{
          fontWeight: 600,
          textAlign: 'right',
          flex: '1 1 auto',
          minWidth: 0,
          wordBreak: 'break-word',
          overflowWrap: 'anywhere',
          fontFamily: mono ? 'monospace' : undefined,
          color: valueColor || undefined
        }}
      >
        {value}
      </Typography>
    </Box>
  );
}

export default function CustomerPaymentsPage() {
  const { theme } = useTheme();
  const { t, isAmharic } = useLanguage();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const isDark = theme === 'dark';

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState<TransactionStats | null>(null);

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;

      if (!user || !user._id) {
        throw new Error('Please login to view transactions');
      }

      const response = await api.get(`/transactions/user/${user._id}?page=1&limit=50`);
      setTransactions(response.data.data || []);
    } catch (err: any) {
      console.error('Error fetching transactions:', err);
      setError(err.response?.data?.message || (isAmharic ? 'ክፍያዎችን ማምጣት አልተቻለም' : 'Failed to fetch transactions'));
    } finally {
      setLoading(false);
    }
  }, [isAmharic]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await api.get('/transactions/stats/overview');
      setStats(response.data.data);
    } catch (err: any) {
      console.error('Failed to fetch stats:', err);
    }
  }, []);

  useEffect(() => {
    fetchTransactions();
    fetchStats();
  }, [fetchTransactions, fetchStats]);

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

  const getFilteredTransactions = () => {
    let filtered = transactions;

    if (selectedTab === 1) {
      filtered = filtered.filter(t => t.class === 'rent' || t.type === 'rent' || t.metadata?.leaseId);
    } else if (selectedTab === 2) {
      filtered = filtered.filter(t => t.type === 'property_purchase' && t.class !== 'rent' && !t.metadata?.leaseId);
    } else if (selectedTab === 3) {
      filtered = filtered.filter(t => t.type === 'deposit');
    } else if (selectedTab === 4) {
      filtered = filtered.filter(t => t.status === 'pending');
    } else if (selectedTab === 5) {
      filtered = filtered.filter(t => t.status === 'completed' || t.status === 'confirmed' || t.status === 'approved');
    }

    if (searchTerm) {
      filtered = filtered.filter(t =>
        t.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.transactionId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.houseId?.title || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  };

  const tabs = [
    t('customer_payments.title', 'All Payments'),
    isAmharic ? 'የኪራይ ክፍያዎች' : 'Rent Payments',
    t('customer_payments.property_purchase', 'Property Purchases'),
    t('customer_payments.deposit', 'Deposits'),
    isAmharic ? 'በግምገማ ላይ (Pending)' : 'Under Review / Pending',
    isAmharic ? 'የተረጋገጡ (Approved)' : 'Approved & Completed'
  ];

  const statCards = [
    { title: t('customer_payments.property_purchase', 'Total Purchases'), value: formatPrice(stats?.totalPropertyPurchases || 0), icon: <Home />, color: '#38bdf8' },
    { title: t('customer_payments.deposit', 'Total Deposits'), value: formatPrice(stats?.totalDeposits || 0), icon: <AttachMoney />, color: '#22c55e' },
    { title: t('status.pending', 'Pending Payments'), value: stats?.pendingPropertyPayments || 0, icon: <HourglassEmpty />, color: '#f59e0b' },
    { title: t('dashboard.total_revenue', 'Net Balance'), value: formatPrice(stats?.netBalance || 0), icon: <AccountBalance />, color: '#818cf8' }
  ];

  const filteredTransactions = getFilteredTransactions();

  const getTransactionTypeColor = (type: string, tx?: Transaction) => {
    if (tx?.class === 'rent' || tx?.metadata?.leaseId || type === 'rent' || type === 'rent_payment') {
      return '#10b981';
    }
    switch (type) {
      case 'property_purchase': return '#38bdf8';
      case 'deposit': return '#22c55e';
      case 'withdrawal': return '#ef4444';
      default: return isDark ? '#94a3b8' : '#64748b';
    }
  };

  const getTransactionTypeLabel = (type: string, tx?: Transaction) => {
    if (tx?.class === 'rent' || tx?.metadata?.leaseId || type === 'rent' || type === 'rent_payment') {
      return isAmharic ? 'የኪራይ ክፍያ' : 'Rent Payment';
    }
    switch (type) {
      case 'property_purchase': return t('customer_payments.property_purchase', 'Property Purchase');
      case 'deposit': return t('customer_payments.deposit', 'Deposit');
      case 'withdrawal': return t('customer_payments.withdrawal', 'Withdrawal');
      default: return type;
    }
  };

  const getMethodLabel = (method: string) => {
    if (!method) return '-';
    switch (method.toLowerCase()) {
      case 'telebirr': return t('customer_payments.telebirr', 'Telebirr');
      case 'cbe': return t('customer_payments.cbe', 'CBE Bank Transfer');
      case 'cash': return t('customer_payments.cash', 'Cash / In-Person');
      default: return method.toUpperCase();
    }
  };

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
            <Typography variant={isMobile ? 'h5' : 'h4'} sx={{ fontWeight: 800, color: isDark ? '#f1f5f9' : '#0f172a', letterSpacing: '-0.02em', mb: 0.5 }}>
              {t('customer_payments.title', 'My Payments')}
            </Typography>
            <Typography variant="body2" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>
              {t('customer_payments.subtitle', 'Review transaction history, receipts, and deposit records')}
            </Typography>
          </div>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={() => { fetchTransactions(); fetchStats(); }}
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
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography
                        variant="h5"
                        sx={{
                          fontWeight: 800,
                          color: isDark ? '#f1f5f9' : '#0f172a',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {stat.value}
                      </Typography>
                      <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b', fontWeight: 600 }}>
                        {stat.title}
                      </Typography>
                    </Box>
                    <Box sx={{ color: stat.color, p: 1.2, borderRadius: 2.5, bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', flexShrink: 0 }}>
                      {stat.icon}
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        </motion.div>

        {/* Search and Tabs */}
        <Card
          sx={{
            mb: 3,
            borderRadius: 3,
            bgcolor: isDark ? '#112240' : '#ffffff',
            border: `1px solid ${isDark ? '#233554' : '#e2e8f0'}`,
            boxShadow: 'none'
          }}
        >
          <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'stretch', md: 'center' }, gap: 2, mb: 2 }}>
              <TextField
                size="small"
                placeholder={t('customer_payments.search_placeholder', 'Search by reference, amount, or phone...')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{
                  flex: 1,
                  maxWidth: { md: 450 },
                  '& .MuiOutlinedInput-root': {
                    bgcolor: isDark ? '#1e293b' : '#f8fafc',
                    borderRadius: 2,
                    color: isDark ? '#f1f5f9' : '#0f172a'
                  }
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ color: isDark ? '#94a3b8' : '#64748b' }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

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
                    fontSize: { xs: '0.8rem', sm: '0.95rem' },
                    minHeight: { xs: 42, sm: 48 },
                    px: { xs: 1.5, sm: 2 },
                    whiteSpace: 'nowrap'
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
          </CardContent>
        </Card>

        {/* Transactions List */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress size={48} sx={{ color: isDark ? '#38bdf8' : '#2563eb' }} />
          </Box>
        ) : filteredTransactions.length === 0 ? (
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
            <Receipt sx={{ fontSize: 64, color: isDark ? '#334155' : '#cbd5e1', mb: 2 }} />
            <Typography variant="h6" sx={{ color: isDark ? '#f1f5f9' : '#0f172a', fontWeight: 700 }}>
              {isAmharic ? 'ምንም የተመዘገበ የክፍያ ዝውውር አልተገኘም' : 'No payment transactions found'}
            </Typography>
            <Typography variant="body2" sx={{ color: isDark ? '#94a3b8' : '#64748b', mt: 0.5 }}>
              {isAmharic ? 'እስካሁን ምንም ክፍያ አልፈጸሙም' : 'You have not made any payments yet'}
            </Typography>
          </Card>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <AnimatePresence>
              {filteredTransactions.map((transaction, index) => (
                <motion.div
                  key={transaction._id}
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
                      },
                      cursor: 'pointer'
                    }}
                    onClick={() => { setSelectedTransaction(transaction); setOpenViewDialog(true); }}
                  >
                    <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, gap: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 2, minWidth: 0, width: { xs: '100%', md: 'auto' } }}>
                          <Avatar sx={{
                            bgcolor: `${getTransactionTypeColor(transaction.type, transaction)}20`,
                            color: getTransactionTypeColor(transaction.type, transaction),
                            width: 44,
                            height: 44,
                            flexShrink: 0
                          }}>
                            {transaction.class === 'rent' || transaction.metadata?.leaseId ? <Receipt /> :
                              transaction.type === 'property_purchase' ? <Home /> :
                                transaction.type === 'deposit' ? <ArrowDownward /> : <ArrowUpward />}
                          </Avatar>
                          <Box sx={{ minWidth: 0, flex: 1 }}>
                            <Typography
                              variant="subtitle1"
                              sx={{
                                fontWeight: 700,
                                color: isDark ? '#f1f5f9' : '#0f172a',
                                lineHeight: 1.3,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical'
                              }}
                            >
                              {transaction.class === 'rent' || transaction.metadata?.leaseId
                                ? `${transaction.houseId?.title || 'Rental Property'} • ${isAmharic ? 'የኪራይ ክፍያ' : 'Rent Payment'}${transaction.metadata?.installmentNumber ? ` (#${transaction.metadata.installmentNumber})` : ''}`
                                : transaction.type === 'property_purchase'
                                  ? transaction.houseId?.title || t('customer_payments.property_purchase', 'Property Purchase')
                                  : getTransactionTypeLabel(transaction.type, transaction)}
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{
                                color: isDark ? '#94a3b8' : '#64748b',
                                display: 'block',
                                mt: 0.3,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {t('customer_payments.ref', 'Ref')}: {transaction.reference}
                              {transaction.transactionId ? ` • TxID: ${transaction.transactionId}` : ''}
                            </Typography>
                          </Box>
                        </Box>

                        <Box
                          sx={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            alignItems: 'center',
                            gap: 1.5,
                            width: { xs: '100%', md: 'auto' },
                            justifyContent: { xs: 'space-between', md: 'flex-end' }
                          }}
                        >
                          <Typography variant="h6" sx={{ fontWeight: 800, color: getTransactionTypeColor(transaction.type, transaction) }}>
                            {formatPrice(transaction.amount)}
                          </Typography>
                          <Chip
                            label={getMethodLabel(transaction.method)}
                            size="small"
                            icon={methodIcons[transaction.method]}
                            sx={{
                              bgcolor: isDark ? '#1e293b' : '#f1f5f9',
                              color: isDark ? '#e2e8f0' : '#475569',
                              fontWeight: 600,
                              borderRadius: 1.5
                            }}
                          />
                        </Box>

                        <Box
                          sx={{
                            textAlign: { xs: 'left', md: 'right' },
                            width: { xs: '100%', md: 'auto' },
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: { xs: 'space-between', md: 'flex-end' },
                            gap: 1
                          }}
                        >
                          <Chip
                            label={t(`status.${transaction.status.toLowerCase()}`, transaction.status)}
                            size="small"
                            icon={statusIcons[transaction.status]}
                            color={statusColors[transaction.status]}
                            sx={{ fontWeight: 700, borderRadius: 1.5 }}
                          />
                          <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>
                            {formatDate(transaction.createdAt)}
                          </Typography>
                        </Box>
                      </Box>

                      {transaction.description && (
                        <Typography
                          variant="caption"
                          display="block"
                          sx={{
                            color: isDark ? '#cbd5e1' : '#64748b',
                            mt: 1.5,
                            p: 1,
                            bgcolor: isDark ? '#1e293b' : '#f8fafc',
                            borderRadius: 1.5,
                            wordBreak: 'break-word',
                            overflowWrap: 'anywhere'
                          }}
                        >
                          {transaction.description}
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </Box>
        )}

        {/* Transaction Details Dialog */}
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
          {selectedTransaction && (
            <>
              <DialogTitle
                sx={{
                  borderBottom: `1px solid ${isDark ? '#233554' : '#e2e8f0'}`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: 1,
                  py: 2,
                  px: { xs: 2, sm: 3 }
                }}
              >
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 800,
                      color: isDark ? '#f1f5f9' : '#0f172a',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {t('customer_payments.view_receipt', 'Payment Details')}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: isDark ? '#94a3b8' : '#64748b',
                      display: 'block',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {t('customer_payments.ref', 'Reference')}: {selectedTransaction.reference}
                  </Typography>
                </Box>
                <IconButton
                  onClick={() => setOpenViewDialog(false)}
                  sx={{ color: isDark ? '#94a3b8' : '#64748b', flexShrink: 0 }}
                  size="small"
                >
                  <Close />
                </IconButton>
              </DialogTitle>

              <DialogContent dividers sx={{ p: 0, borderColor: isDark ? '#233554' : '#e2e8f0' }}>
                {/* Status Header */}
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
                    gap: 2,
                    p: { xs: 2, sm: 3 },
                    bgcolor: isDark ? 'rgba(30, 41, 59, 0.5)' : '#f8fafc',
                    borderBottom: `1px solid ${isDark ? '#233554' : '#e2e8f0'}`
                  }}
                >
                  <Box>
                    <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b', fontWeight: 600 }}>
                      {t('customer_payments.status', 'Status')}
                    </Typography>
                    <Box sx={{ mt: 0.5 }}>
                      <Chip
                        label={t(`status.${selectedTransaction.status.toLowerCase()}`, selectedTransaction.status)}
                        icon={statusIcons[selectedTransaction.status]}
                        color={statusColors[selectedTransaction.status]}
                        sx={{ fontWeight: 700 }}
                      />
                    </Box>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b', fontWeight: 600 }}>
                      {t('customer_payments.date', 'Date')}
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: isDark ? '#f1f5f9' : '#0f172a', mt: 0.5 }}>
                      {formatDate(selectedTransaction.createdAt)}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b', fontWeight: 600 }}>
                      {t('customer_payments.method', 'Method')}
                    </Typography>
                    <Box sx={{ mt: 0.5 }}>
                      <Chip
                        label={getMethodLabel(selectedTransaction.method)}
                        size="small"
                        icon={methodIcons[selectedTransaction.method]}
                      />
                    </Box>
                  </Box>
                </Box>

                {selectedTransaction.status === 'pending' && (
                  <Box sx={{ px: { xs: 2, sm: 3 }, py: 1.5, borderBottom: `1px solid ${isDark ? '#233554' : '#e2e8f0'}` }}>
                    <LinearProgress sx={{ borderRadius: 1 }} />
                  </Box>
                )}

                {/* Amount Section */}
                <Box
                  sx={{
                    p: { xs: 2, sm: 3 },
                    textAlign: 'center',
                    borderBottom: `1px solid ${isDark ? '#233554' : '#e2e8f0'}`,
                    bgcolor: isDark ? 'rgba(56, 189, 248, 0.05)' : 'rgba(37, 99, 235, 0.03)'
                  }}
                >
                  <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>
                    {t('customer_orders.price', 'Amount')}
                  </Typography>
                  <Typography
                    variant="h3"
                    sx={{
                      fontWeight: 800,
                      color: getTransactionTypeColor(selectedTransaction.type),
                      my: 0.5,
                      fontSize: { xs: '1.75rem', sm: '3rem' },
                      wordBreak: 'break-word'
                    }}
                  >
                    {formatPrice(selectedTransaction.amount)}
                  </Typography>
                  {selectedTransaction.amountInString && (
                    <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b', wordBreak: 'break-word' }}>
                      {selectedTransaction.amountInString}
                    </Typography>
                  )}
                </Box>

                {/* Transaction Details */}
                <Box sx={{ p: { xs: 2, sm: 3 }, borderBottom: `1px solid ${isDark ? '#233554' : '#e2e8f0'}` }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: isDark ? '#38bdf8' : '#2563eb', mb: 2 }}>
                    {isAmharic ? 'የክፍያ መረጃ' : 'Transaction Information'}
                  </Typography>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <DetailRow
                      label={t('customer_payments.type', 'Transaction Type')}
                      value={getTransactionTypeLabel(selectedTransaction.type, selectedTransaction)}
                      isDark={isDark}
                    />
                    <DetailRow
                      label={t('customer_payments.ref', 'Reference Number')}
                      value={selectedTransaction.reference}
                      isDark={isDark}
                      mono
                    />
                    {selectedTransaction.transactionId && (
                      <DetailRow
                        label="Transaction ID"
                        value={selectedTransaction.transactionId}
                        isDark={isDark}
                        mono
                      />
                    )}
                    {selectedTransaction.metadata?.receiptNumber && (
                      <DetailRow
                        label="Official Receipt #"
                        value={selectedTransaction.metadata.receiptNumber}
                        isDark={isDark}
                        mono
                        valueColor="#10b981"
                      />
                    )}
                    {selectedTransaction.description && (
                      <DetailRow
                        label={t('house_form.desc', 'Description')}
                        value={selectedTransaction.description}
                        isDark={isDark}
                      />
                    )}
                  </Box>
                </Box>

                {/* Property Details */}
                {(selectedTransaction.type === 'property_purchase' || selectedTransaction.class === 'rent' || selectedTransaction.metadata?.leaseId) && selectedTransaction.houseId && (
                  <Box sx={{ p: { xs: 2, sm: 3 }, borderBottom: `1px solid ${isDark ? '#233554' : '#e2e8f0'}` }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: isDark ? '#38bdf8' : '#2563eb', mb: 2 }}>
                      {t('messages.property_info', 'Property Details')}
                    </Typography>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      <DetailRow
                        label={t('customer_orders.property_name', 'Property')}
                        value={typeof selectedTransaction.houseId === 'object' && selectedTransaction.houseId ? selectedTransaction.houseId.title || 'Property' : 'Property'}
                        isDark={isDark}
                      />
                      {Boolean(typeof selectedTransaction.houseId === 'object' && selectedTransaction.houseId && selectedTransaction.houseId._id && !selectedTransaction.houseId.isDeleted) && (
                        <Button
                          size="small"
                          variant="outlined"
                          href={`/public/houses/${selectedTransaction.houseId._id}`}
                          sx={{ mt: 1, alignSelf: 'flex-start', textTransform: 'none', borderRadius: 2 }}
                        >
                          {t('action.view_details', 'View Property')}
                        </Button>
                      )}
                    </Box>
                  </Box>
                )}

                {/* Sender/Receiver details */}
                {(selectedTransaction.senderName || selectedTransaction.senderPhone || selectedTransaction.receiverPhone) && (
                  <Box sx={{ p: { xs: 2, sm: 3 }, borderBottom: `1px solid ${isDark ? '#233554' : '#e2e8f0'}` }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: isDark ? '#38bdf8' : '#2563eb', mb: 2 }}>
                      {isAmharic ? 'የላኪና ተቀባይ መረጃ' : 'Party Information'}
                    </Typography>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      {selectedTransaction.senderName && (
                        <DetailRow
                          label={isAmharic ? 'የላኪ ስም' : 'Sender Name'}
                          value={selectedTransaction.senderName}
                          isDark={isDark}
                        />
                      )}
                      {selectedTransaction.senderPhone && (
                        <DetailRow
                          label={isAmharic ? 'የላኪ ስልክ / ሂሳብ' : 'Sender Phone / Account'}
                          value={selectedTransaction.senderPhone}
                          isDark={isDark}
                        />
                      )}
                      {selectedTransaction.receiverPhone && (
                        <DetailRow
                          label={isAmharic ? 'የተቀባይ ስልክ / ሂሳብ' : 'Receiver Account'}
                          value={selectedTransaction.receiverPhone}
                          isDark={isDark}
                        />
                      )}
                    </Box>
                  </Box>
                )}

                {/* Timeline */}
                {(selectedTransaction.approvedAt || selectedTransaction.completedAt) && (
                  <Box sx={{ p: { xs: 2, sm: 3 } }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: isDark ? '#38bdf8' : '#2563eb', mb: 2 }}>
                      {t('orders.timeline', 'Timeline')}
                    </Typography>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      {selectedTransaction.approvedAt && (
                        <DetailRow
                          label={t('status.approved', 'Approved')}
                          value={formatDate(selectedTransaction.approvedAt)}
                          isDark={isDark}
                        />
                      )}
                      {selectedTransaction.completedAt && (
                        <DetailRow
                          label={t('status.completed', 'Completed')}
                          value={formatDate(selectedTransaction.completedAt)}
                          isDark={isDark}
                        />
                      )}
                    </Box>
                  </Box>
                )}
              </DialogContent>

              <DialogActions
                sx={{
                  p: { xs: 2, sm: 3 },
                  gap: 1.5,
                  borderTop: `1px solid ${isDark ? '#233554' : '#e2e8f0'}`,
                  flexDirection: { xs: 'column-reverse', sm: 'row' },
                  '& > *': { width: { xs: '100%', sm: 'auto' }, m: '0 !important' }
                }}
              >
                <Button
                  onClick={() => setOpenViewDialog(false)}
                  sx={{ textTransform: 'none', color: isDark ? '#94a3b8' : '#64748b' }}
                >
                  {t('action.close', 'Close')}
                </Button>
                {selectedTransaction.type === 'property_purchase' && (
                  <Button
                    variant="contained"
                    startIcon={<PaymentIcon />}
                    href={`/admin/customer/orders`}
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
                    {isAmharic ? 'ተዛማጅ ትዕዛዝ እይ' : 'View Related Order'}
                  </Button>
                )}
              </DialogActions>
            </>
          )}
        </Dialog>

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