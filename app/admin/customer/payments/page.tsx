'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Card, CardContent, Chip, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Divider, CircularProgress, useMediaQuery, Snackbar, Alert,
  Tooltip, Avatar, LinearProgress,
  Tabs, Tab, Paper, Stack, TextField, InputAdornment
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/lib/theme-context';
import Navbar from '@/components/ui/Navbar';
import {
  Payment as PaymentIcon, CheckCircle, Cancel,
  HourglassEmpty, Receipt, AttachMoney,
  Home, CalendarToday, Refresh, TrendingUp,
  Phone, Email, Person, Close, Search,
  ArrowUpward, ArrowDownward, CreditCard, AccountBalance
} from '@mui/icons-material';
import api from '@/app/utils/api';
import { format } from 'date-fns';

interface Transaction {
  _id: string;
  reference: string;
  amount: number;
  amountInString: string;
  type: 'deposit' | 'withdrawal' | 'property_purchase' | 'winning';
  status: 'pending' | 'approved' | 'completed' | 'confirmed' | 'failed';
  method: 'telebirr' | 'cbe' | 'cash';
  description: string;
  houseId?: {
    _id: string;
    title: string;
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

const CustomerPaymentsPage = () => {
  const { theme } = useTheme();
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState<TransactionStats | null>(null);
  const [pagination, setPagination] = useState({
    current: 1,
    total: 1,
    count: 0,
    totalRecords: 0
  });

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
      setPagination(response.data.pagination);
    } catch (error: any) {
      console.error('Error fetching transactions:', error);
      setError(error.response?.data?.message || 'Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const response = await api.get('/transactions/stats/overview');
      setStats(response.data.data);
    } catch (error: any) {
      console.error('Failed to fetch stats:', error);
    }
  }, []);

  useEffect(() => {
    fetchTransactions();
    fetchStats();
  }, [fetchTransactions, fetchStats]);

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
      return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
    } catch {
      return 'Invalid date';
    }
  };

  const getFilteredTransactions = () => {
    let filtered = transactions;
    
    // Filter by tab
    if (selectedTab === 1) {
      filtered = filtered.filter(t => t.type === 'property_purchase');
    } else if (selectedTab === 2) {
      filtered = filtered.filter(t => t.type === 'deposit');
    } else if (selectedTab === 3) {
      filtered = filtered.filter(t => t.status === 'pending');
    } else if (selectedTab === 4) {
      filtered = filtered.filter(t => t.status === 'completed');
    }
    
    // Filter by search
    if (searchTerm) {
      filtered = filtered.filter(t => 
        t.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.houseId?.title || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return filtered;
  };

  const tabs = [
    'All Payments',
    'Property Purchases',
    'Deposits',
    'Pending',
    'Completed'
  ];

  const statCards = [
    { title: 'Total Spent', value: formatPrice(stats?.totalPropertyPurchases || 0), icon: <Home />, color: '#00ffff' },
    { title: 'Total Deposits', value: formatPrice(stats?.totalDeposits || 0), icon: <AttachMoney />, color: '#00ff00' },
    { title: 'Pending Payments', value: stats?.pendingPropertyPayments || 0, icon: <HourglassEmpty />, color: '#ff9900' },
    { title: 'Net Balance', value: formatPrice(stats?.netBalance || 0), icon: <AccountBalance />, color: '#8B5CF6' }
  ];

  const filteredTransactions = getFilteredTransactions();

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'property_purchase': return '#00ffff';
      case 'deposit': return '#00ff00';
      case 'withdrawal': return '#ff0000';
      default: return '#ffffff';
    }
  };

  const getTransactionTypeLabel = (type: string) => {
    switch (type) {
      case 'property_purchase': return 'Property Purchase';
      case 'deposit': return 'Deposit';
      case 'withdrawal': return 'Withdrawal';
      default: return type;
    }
  };

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
            My Payments
          </Typography>
          <Typography variant="body2" color={theme === 'dark' ? '#a8b2d1' : '#666666'} sx={{ mb: 3 }}>
            Track and manage all your payment transactions
          </Typography>
        </motion.div>
        
        {/* Statistics Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 4 }}>
            {statCards.map((stat, index) => (
              <Box key={index} sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(25% - 16px)' }, minWidth: '180px' }}>
                <Card sx={{ 
                  borderRadius: 3,
                  borderLeft: `4px solid ${stat.color}`,
                  backgroundColor: theme === 'dark' ? '#0f172a80' : 'white',
                  backdropFilter: theme === 'dark' ? 'blur(10px)' : 'none'
                }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="h5" sx={{ fontWeight: 'bold', color: theme === 'dark' ? '#ccd6f6' : '#333333' }}>
                          {stat.value}
                        </Typography>
                        <Typography variant="caption" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                          {stat.title}
                        </Typography>
                      </Box>
                      <Box sx={{ color: stat.color }}>{stat.icon}</Box>
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            ))}
          </Box>
        </motion.div>
        
        {/* Search and Tabs */}
        <Card sx={{ mb: 3, borderRadius: 3, backgroundColor: theme === 'dark' ? '#0f172a80' : 'white' }}>
          <CardContent>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'stretch', md: 'center' }, gap: 2, mb: 2 }}>
              <TextField
                size="small"
                placeholder="Search by reference, description, or property..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{ minWidth: { xs: '100%', md: 250 } }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
              />
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={() => {
                  fetchTransactions();
                  fetchStats();
                }}
                size="small"
              >
                Refresh
              </Button>
            </Box>
            
            <Box sx={{ borderBottom: 1, borderColor: 'divider', overflowX: 'auto' }}>
              <Tabs
                value={selectedTab}
                onChange={(e, newValue) => setSelectedTab(newValue)}
                variant="scrollable"
                scrollButtons="auto"
                sx={{
                  '& .MuiTab-root': { color: theme === 'dark' ? '#a8b2d1' : '#666666' },
                  '& .Mui-selected': { color: theme === 'dark' ? '#00ffff' : '#007bff' }
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
            <CircularProgress size={60} sx={{ color: theme === 'dark' ? '#00ffff' : '#007bff' }} />
          </Box>
        ) : filteredTransactions.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Receipt sx={{ fontSize: 64, color: theme === 'dark' ? '#334155' : '#cbd5e1', mb: 2 }} />
            <Typography variant="h6" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>No payment transactions found</Typography>
            <Typography variant="body2" color="text.secondary">You haven't made any payments yet</Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <AnimatePresence>
              {filteredTransactions.map((transaction, index) => (
                <motion.div
                  key={transaction._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Card 
                    sx={{ 
                      borderRadius: 3,
                      backgroundColor: theme === 'dark' ? '#0f172a80' : 'white',
                      '&:hover': { transform: 'translateY(-2px)', transition: 'transform 0.2s' },
                      cursor: 'pointer'
                    }}
                    onClick={() => { setSelectedTransaction(transaction); setOpenViewDialog(true); }}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, gap: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 2 }}>
                          <Avatar sx={{ 
                            bgcolor: `${getTransactionTypeColor(transaction.type)}20`, 
                            color: getTransactionTypeColor(transaction.type)
                          }}>
                            {transaction.type === 'property_purchase' ? <Home /> : 
                             transaction.type === 'deposit' ? <ArrowDownward /> : <ArrowUpward />}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: theme === 'dark' ? '#ccd6f6' : '#333333' }}>
                              {transaction.type === 'property_purchase' 
                                ? transaction.houseId?.title || 'Property Purchase'
                                : getTransactionTypeLabel(transaction.type)}
                            </Typography>
                            <Typography variant="caption" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                              Ref: {transaction.reference}
                            </Typography>
                          </Box>
                        </Box>
                        
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 'bold', color: getTransactionTypeColor(transaction.type) }}>
                            {formatPrice(transaction.amount)}
                          </Typography>
                          <Chip
                            label={transaction.method}
                            size="small"
                            icon={methodIcons[transaction.method]}
                            sx={{ backgroundColor: theme === 'dark' ? '#334155' : '#e5e7eb', mt: 0.5 }}
                          />
                        </Box>
                        
                        <Box sx={{ textAlign: 'right' }}>
                          <Chip
                            label={transaction.status}
                            size="small"
                            icon={statusIcons[transaction.status]}
                            color={statusColors[transaction.status]}
                          />
                          <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
                            {formatDate(transaction.createdAt)}
                          </Typography>
                        </Box>
                      </Box>
                      
                      {transaction.description && (
                        <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 1 }}>
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
          PaperProps={{ sx: { borderRadius: 3, backgroundColor: theme === 'dark' ? '#0f172a' : 'white', maxHeight: '90vh' } }}
        >
          {selectedTransaction && (
            <>
              <DialogTitle sx={{ 
                borderBottom: 1, 
                borderColor: 'divider',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                py: 2
              }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    Payment Details
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Reference: {selectedTransaction.reference}
                  </Typography>
                </Box>
                <IconButton onClick={() => setOpenViewDialog(false)}>
                  <Close />
                </IconButton>
              </DialogTitle>
              
              <DialogContent dividers sx={{ p: 0 }}>
                {/* Status Header */}
                <Box sx={{ 
                  p: 3, 
                  background: theme === 'dark' 
                    ? 'linear-gradient(135deg, #1e293b, #0f172a)' 
                    : 'linear-gradient(135deg, #f8f9fa, #ffffff)',
                  borderBottom: 1,
                  borderColor: 'divider'
                }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                      <Chip
                        label={selectedTransaction.status}
                        icon={statusIcons[selectedTransaction.status]}
                        color={statusColors[selectedTransaction.status]}
                        sx={{ mt: 0.5, fontSize: '0.9rem', p: 1 }}
                      />
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">Date</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>{formatDate(selectedTransaction.createdAt)}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">Method</Typography>
                      <Chip 
                        label={selectedTransaction.method} 
                        size="small" 
                        icon={methodIcons[selectedTransaction.method]}
                      />
                    </Box>
                  </Box>
                  {selectedTransaction.status === 'pending' && (
                    <LinearProgress sx={{ mt: 2 }} />
                  )}
                </Box>
                
                {/* Amount Section */}
                <Box sx={{ p: 3, textAlign: 'center', borderBottom: 1, borderColor: 'divider', background: theme === 'dark' ? '#00ffff10' : '#007bff05' }}>
                  <Typography variant="caption" color="text.secondary">Amount</Typography>
                  <Typography variant="h3" sx={{ fontWeight: 'bold', color: getTransactionTypeColor(selectedTransaction.type) }}>
                    {formatPrice(selectedTransaction.amount)}
                  </Typography>
                  {selectedTransaction.amountInString && (
                    <Typography variant="caption" color="text.secondary">
                      {selectedTransaction.amountInString}
                    </Typography>
                  )}
                </Box>
                
                {/* Transaction Details */}
                <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: theme === 'dark' ? '#00ffff' : '#007bff', mb: 2 }}>
                    Transaction Information
                  </Typography>
                  
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1, borderBottom: 1, borderColor: 'divider' }}>
                      <Typography variant="body2" color="text.secondary">Transaction Type</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {getTransactionTypeLabel(selectedTransaction.type)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1, borderBottom: 1, borderColor: 'divider' }}>
                      <Typography variant="body2" color="text.secondary">Reference Number</Typography>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>{selectedTransaction.reference}</Typography>
                    </Box>
                    {selectedTransaction.transactionId && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1, borderBottom: 1, borderColor: 'divider' }}>
                        <Typography variant="body2" color="text.secondary">Transaction ID</Typography>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>{selectedTransaction.transactionId}</Typography>
                      </Box>
                    )}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1, borderBottom: 1, borderColor: 'divider' }}>
                      <Typography variant="body2" color="text.secondary">Description</Typography>
                      <Typography variant="body2" sx={{ textAlign: 'right', maxWidth: '60%' }}>{selectedTransaction.description}</Typography>
                    </Box>
                  </Box>
                </Box>
                
                {/* Property Details (if property purchase) */}
                {selectedTransaction.type === 'property_purchase' && selectedTransaction.houseId && (
                  <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: theme === 'dark' ? '#00ffff' : '#007bff', mb: 2 }}>
                      Property Details
                    </Typography>
                    
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1, borderBottom: 1, borderColor: 'divider' }}>
                        <Typography variant="body2" color="text.secondary">Property</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>{selectedTransaction.houseId.title}</Typography>
                      </Box>
                      <Button
                        size="small"
                        variant="outlined"
                        href={`/public/houses/${selectedTransaction.houseId._id}`}
                        sx={{ mt: 1 }}
                      >
                        View Property
                      </Button>
                    </Box>
                  </Box>
                )}
                
                {/* Payment Method Details */}
                <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: theme === 'dark' ? '#00ffff' : '#007bff', mb: 2 }}>
                    Payment Method Details
                  </Typography>
                  
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {selectedTransaction.senderName && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1, borderBottom: 1, borderColor: 'divider' }}>
                        <Typography variant="body2" color="text.secondary">Sender Name</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>{selectedTransaction.senderName}</Typography>
                      </Box>
                    )}
                    {selectedTransaction.senderPhone && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1, borderBottom: 1, borderColor: 'divider' }}>
                        <Typography variant="body2" color="text.secondary">Sender {selectedTransaction.method === 'telebirr' ? 'Phone' : 'Account'}</Typography>
                        <Typography variant="body2">{selectedTransaction.senderPhone}</Typography>
                      </Box>
                    )}
                    {selectedTransaction.receiverName && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1, borderBottom: 1, borderColor: 'divider' }}>
                        <Typography variant="body2" color="text.secondary">Receiver Name</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>{selectedTransaction.receiverName}</Typography>
                      </Box>
                    )}
                    {selectedTransaction.receiverPhone && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1, borderBottom: 1, borderColor: 'divider' }}>
                        <Typography variant="body2" color="text.secondary">Receiver {selectedTransaction.method === 'telebirr' ? 'Phone' : 'Account'}</Typography>
                        <Typography variant="body2">{selectedTransaction.receiverPhone}</Typography>
                      </Box>
                    )}
                  </Box>
                </Box>
                
                {/* Approval/Completion Timeline */}
                {(selectedTransaction.approvedAt || selectedTransaction.completedAt || selectedTransaction.confirmedAt) && (
                  <Box sx={{ p: 3 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: theme === 'dark' ? '#00ffff' : '#007bff', mb: 2 }}>
                      Timeline
                    </Typography>
                    
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {selectedTransaction.approvedAt && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1, borderBottom: 1, borderColor: 'divider' }}>
                          <Typography variant="body2" color="text.secondary">Approved</Typography>
                          <Box sx={{ textAlign: 'right' }}>
                            <Typography variant="body2">{formatDate(selectedTransaction.approvedAt)}</Typography>
                            {selectedTransaction.approvedBy && (
                              <Typography variant="caption" color="text.secondary">by {selectedTransaction.approvedBy}</Typography>
                            )}
                          </Box>
                        </Box>
                      )}
                      {selectedTransaction.completedAt && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1, borderBottom: 1, borderColor: 'divider' }}>
                          <Typography variant="body2" color="text.secondary">Completed</Typography>
                          <Box sx={{ textAlign: 'right' }}>
                            <Typography variant="body2">{formatDate(selectedTransaction.completedAt)}</Typography>
                            {selectedTransaction.completedBy && (
                              <Typography variant="caption" color="text.secondary">by {selectedTransaction.completedBy}</Typography>
                            )}
                          </Box>
                        </Box>
                      )}
                      {selectedTransaction.confirmedAt && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1, borderBottom: 1, borderColor: 'divider' }}>
                          <Typography variant="body2" color="text.secondary">Confirmed</Typography>
                          <Box sx={{ textAlign: 'right' }}>
                            <Typography variant="body2">{formatDate(selectedTransaction.confirmedAt)}</Typography>
                            {selectedTransaction.confirmedBy && (
                              <Typography variant="caption" color="text.secondary">by {selectedTransaction.confirmedBy}</Typography>
                            )}
                          </Box>
                        </Box>
                      )}
                    </Box>
                  </Box>
                )}
              </DialogContent>
              
              <DialogActions sx={{ p: 3, gap: 2 }}>
                <Button onClick={() => setOpenViewDialog(false)}>Close</Button>
                {selectedTransaction.type === 'property_purchase' && selectedTransaction.status === 'pending' && (
                  <Button
                    variant="contained"
                    startIcon={<PaymentIcon />}
                    href={`/customer/orders`}
                  >
                    View Related Order
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
};

export default CustomerPaymentsPage;