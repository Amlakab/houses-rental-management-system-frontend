'use client';

import { FiPlusCircle } from "react-icons/fi";
import { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Button,
  TextField, Dialog, DialogTitle, DialogContent, DialogActions,
  Chip, Alert, Snackbar, CircularProgress,
  useMediaQuery, IconButton
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AccountBalance, Phone, Person, Block, CheckCircle, Edit, Delete,
  MoreVert
} from '@mui/icons-material';
import api from '@/app/utils/api';
import { Accountant } from '@/types';
import { formatDate } from '@/lib/date';
import { useAuth } from '@/lib/auth';
import { useTheme } from '@/lib/theme-context';
import { useLanguage } from '@/lib/language-context';

export default function AccountantsPage() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const { t, isAmharic } = useLanguage();
  const isDark = theme === 'dark';
  const isMobile = useMediaQuery('(max-width: 600px)');

  const [accountants, setAccountants] = useState<Accountant[]>([]);
  const [filteredAccountants, setFilteredAccountants] = useState<Accountant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'blocked'>('all');

  const [openDialog, setOpenDialog] = useState(false);
  const [editingAccountant, setEditingAccountant] = useState<Accountant | null>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    accountNumber: '',
    bankName: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [expandedAccountant, setExpandedAccountant] = useState<string | null>(null);

  // Fetch accountants
  const fetchAccountants = async () => {
    try {
      setLoading(true);
      let url = '/accountants';
      if (filter !== 'all') url += `?blocked=${filter === 'blocked'}`;
      const response = await api.get(url);
      setAccountants(response.data.data || []);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch accountants');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'admin') fetchAccountants();
  }, [user, filter]);

  useEffect(() => {
    const filtered = accountants.filter(acc => {
      if (filter === 'all') return true;
      if (filter === 'active') return !acc.isBlocked;
      if (filter === 'blocked') return acc.isBlocked;
      return true;
    });
    setFilteredAccountants(filtered);
  }, [filter, accountants]);

  // Form handlers
  const handleOpenDialog = (accountant: Accountant | null = null) => {
    if (accountant) {
      setEditingAccountant(accountant);
      setFormData({
        fullName: accountant.fullName,
        phoneNumber: accountant.phoneNumber,
        accountNumber: accountant.accountNumber,
        bankName: accountant.bankName
      });
    } else {
      setEditingAccountant(null);
      setFormData({ fullName: '', phoneNumber: '', accountNumber: '', bankName: '' });
    }
    setErrors({});
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingAccountant(null);
    setFormData({ fullName: '', phoneNumber: '', accountNumber: '', bankName: '' });
    setErrors({});
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => { const newErrors = { ...prev }; delete newErrors[name]; return newErrors; });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.fullName.trim()) {
      newErrors.fullName = isAmharic ? 'ሙሉ ስም ማስገባት ግዴታ ነው' : 'Full name is required';
    }
    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = isAmharic ? 'ስልክ ቁጥር ማስገባት ግዴታ ነው' : 'Phone number is required';
    } else if (!/^\d{10,15}$/.test(formData.phoneNumber.replace(/[\s+-]/g, ''))) {
      newErrors.phoneNumber = isAmharic ? 'ትክክለኛ ስልክ ቁጥር ያስገቡ' : 'Phone number must be 10-15 digits';
    }
    if (!formData.accountNumber.trim()) {
      newErrors.accountNumber = isAmharic ? 'የሂሳብ ቁጥር ማስገባት ግዴታ ነው' : 'Account number is required';
    }
    if (!formData.bankName.trim()) {
      newErrors.bankName = isAmharic ? 'የባንክ ስም ማስገባት ግዴታ ነው' : 'Bank name is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    try {
      if (editingAccountant) {
        await api.put(`/accountants/${editingAccountant._id}`, formData);
        setSuccess(isAmharic ? 'የሂሳብ ሹም መረጃ በተሳካ ሁኔታ ተሻሽሏል' : 'Accountant updated successfully');
      } else {
        await api.post('/accountants', formData);
        setSuccess(isAmharic ? 'የሂሳብ ሹም በተሳካ ሁኔታ ተፈጥሯል' : 'Accountant created successfully');
      }
      handleCloseDialog();
      fetchAccountants();
    } catch (err: any) {
      setError(err.response?.data?.message || (isAmharic ? 'ክንውኑ አልተሳካም' : 'Operation failed'));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('accountants.delete_confirm') || 'Are you sure you want to delete this accountant?')) return;
    try {
      await api.delete(`/accountants/${id}`);
      setSuccess(isAmharic ? 'የሂሳብ ሹም በተሳካ ሁኔታ ተሰርዟል' : 'Accountant deleted successfully');
      fetchAccountants();
    } catch (err: any) {
      setError(err.response?.data?.message || (isAmharic ? 'መሰረዝ አልተሳካም' : 'Failed to delete accountant'));
    }
  };

  const handleBlock = async (accountant: Accountant) => {
    const confirmMsg = accountant.isBlocked 
      ? (isAmharic ? 'እገዳውን ማንሳት ይፈልጋሉ?' : 'Are you sure you want to unblock this accountant?')
      : (isAmharic ? 'ይህን የሂሳብ ሹም ማገድ ይፈልጋሉ?' : 'Are you sure you want to block this accountant?');
    if (!confirm(confirmMsg)) return;

    try {
      await api.patch(`/accountants/${accountant._id}/block`, { isBlocked: !accountant.isBlocked });
      setSuccess(accountant.isBlocked 
        ? (isAmharic ? 'እገዳው ተነስቷል' : 'Accountant unblocked successfully')
        : (isAmharic ? 'የሂሳብ ሹሙ ታግዷል' : 'Accountant blocked successfully'));
      fetchAccountants();
    } catch (err: any) {
      setError(err.response?.data?.message || (isAmharic ? 'ሁኔታውን ማስተካከል አልተሳካም' : 'Failed to update status'));
    }
  };

  const toggleExpandAccountant = (accountantId: string) => {
    setExpandedAccountant(expandedAccountant === accountantId ? null : accountantId);
  };

  if (user?.role !== 'admin') {
    return (
      <div className="text-center py-12 text-red-500 font-semibold text-lg">
        {isAmharic ? 'ፈቃድ የለዎትም። ለአድሚን ብቻ የተፈቀደ።' : 'Access denied. Admin only.'}
      </div>
    );
  }

  return (
    <Box 
      sx={{ 
        p: { xs: 2, sm: 3, md: 4 }, 
        minHeight: '100vh',
        bgcolor: isDark ? '#0a192f' : '#f8fafc',
        color: isDark ? '#f1f5f9' : '#0f172a',
        transition: 'background-color 0.2s ease, color 0.2s ease'
      }}
    >
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <Box sx={{ mb: 3 }}>
          <Typography 
            variant={isMobile ? "h6" : "h5"} 
            sx={{ 
              fontWeight: 700, 
              color: isDark ? '#f8fafc' : '#0f172a', 
              mb: 0.75 
            }}
          >
            {t('accountants.title')}
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Typography variant={isMobile ? "body2" : "body1"} sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>
              {t('accountants.subtitle')}
            </Typography>
            <Button
              variant="contained"
              onClick={() => handleOpenDialog()}
              startIcon={<FiPlusCircle size={18} />}
              sx={{
                bgcolor: '#2563eb',
                '&:hover': { bgcolor: '#1d4ed8' },
                borderRadius: 2,
                px: 2.5,
                py: 1,
                textTransform: 'none',
                fontWeight: 600,
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
                whiteSpace: 'nowrap'
              }}
            >
              {isMobile ? (isAmharic ? 'ጨምር' : 'Add') : t('accountants.add')}
            </Button>
          </Box>
        </Box>
      </motion.div>

      {/* Filter Cards */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, 
          gap: 2, 
          mb: 4 
        }}>
          {/* All */}
          <Card 
            onClick={() => setFilter('all')} 
            sx={{ 
              cursor: 'pointer', 
              bgcolor: filter === 'all' 
                ? '#2563eb' 
                : (isDark ? '#112240' : '#ffffff'), 
              color: filter === 'all' ? '#ffffff' : (isDark ? '#f1f5f9' : '#0f172a'),
              border: filter === 'all' ? '1px solid #2563eb' : (isDark ? '1px solid #233554' : '1px solid #e2e8f0'),
              borderRadius: 2, 
              p: 2, 
              textAlign: 'center',
              minHeight: '80px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              boxShadow: filter === 'all' ? '0 4px 14px rgba(37, 99, 235, 0.3)' : 'none',
              '&:hover': {
                transform: 'translateY(-2px)'
              }
            }}
          >
            <Typography variant={isMobile ? "body2" : "body1"} sx={{ fontWeight: 500, opacity: 0.9 }}>
              {t('accountants.all')}
            </Typography>
            <Typography variant={isMobile ? "h6" : "h5"} sx={{ fontWeight: 700, mt: 0.5 }}>
              {accountants.length}
            </Typography>
          </Card>

          {/* Active */}
          <Card 
            onClick={() => setFilter('active')} 
            sx={{ 
              cursor: 'pointer', 
              bgcolor: filter === 'active' 
                ? '#059669' 
                : (isDark ? '#112240' : '#ffffff'), 
              color: filter === 'active' ? '#ffffff' : (isDark ? '#f1f5f9' : '#0f172a'),
              border: filter === 'active' ? '1px solid #059669' : (isDark ? '1px solid #233554' : '1px solid #e2e8f0'),
              borderRadius: 2, 
              p: 2, 
              textAlign: 'center',
              minHeight: '80px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              boxShadow: filter === 'active' ? '0 4px 14px rgba(5, 150, 105, 0.3)' : 'none',
              '&:hover': {
                transform: 'translateY(-2px)'
              }
            }}
          >
            <Typography variant={isMobile ? "body2" : "body1"} sx={{ fontWeight: 500, opacity: 0.9 }}>
              {t('accountants.active')}
            </Typography>
            <Typography variant={isMobile ? "h6" : "h5"} sx={{ fontWeight: 700, mt: 0.5 }}>
              {accountants.filter(a => !a.isBlocked).length}
            </Typography>
          </Card>

          {/* Blocked */}
          <Card 
            onClick={() => setFilter('blocked')} 
            sx={{ 
              cursor: 'pointer', 
              bgcolor: filter === 'blocked' 
                ? '#dc2626' 
                : (isDark ? '#112240' : '#ffffff'), 
              color: filter === 'blocked' ? '#ffffff' : (isDark ? '#f1f5f9' : '#0f172a'),
              border: filter === 'blocked' ? '1px solid #dc2626' : (isDark ? '1px solid #233554' : '1px solid #e2e8f0'),
              borderRadius: 2, 
              p: 2, 
              textAlign: 'center',
              minHeight: '80px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              boxShadow: filter === 'blocked' ? '0 4px 14px rgba(220, 38, 38, 0.3)' : 'none',
              '&:hover': {
                transform: 'translateY(-2px)'
              }
            }}
          >
            <Typography variant={isMobile ? "body2" : "body1"} sx={{ fontWeight: 500, opacity: 0.9 }}>
              {t('accountants.blocked')}
            </Typography>
            <Typography variant={isMobile ? "h6" : "h5"} sx={{ fontWeight: 700, mt: 0.5 }}>
              {accountants.filter(a => a.isBlocked).length}
            </Typography>
          </Card>
        </Box>
      </motion.div>

      {/* Accountant Cards */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
          <CircularProgress size={isMobile ? 36 : 48} sx={{ color: '#2563eb' }} />
        </Box>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
          {/* Mobile View - Cards */}
          {isMobile && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {filteredAccountants.map((acc) => {
                const isExpanded = expandedAccountant === acc._id;
                
                return (
                  <Card 
                    key={acc._id} 
                    sx={{ 
                      borderRadius: 2.5, 
                      bgcolor: isDark ? '#112240' : '#ffffff',
                      color: isDark ? '#f1f5f9' : '#0f172a',
                      border: isDark ? '1px solid #233554' : '1px solid #e2e8f0',
                      boxShadow: isDark ? '0 4px 12px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.04)'
                    }}
                  >
                    <CardContent sx={{ p: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                            <Person sx={{ fontSize: 18, mr: 1, color: isDark ? '#60a5fa' : '#2563eb' }} />
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.95rem' }}>
                              {acc.fullName}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                            <Phone sx={{ fontSize: 16, mr: 1, color: isDark ? '#94a3b8' : '#64748b' }} />
                            <Typography variant="body2" sx={{ color: isDark ? '#cbd5e1' : '#334155' }}>
                              {acc.phoneNumber}
                            </Typography>
                          </Box>
                        </Box>
                        <IconButton 
                          size="small" 
                          onClick={() => toggleExpandAccountant(acc._id)}
                          sx={{ color: isDark ? '#94a3b8' : '#64748b' }}
                        >
                          <MoreVert />
                        </IconButton>
                      </Box>

                      {isExpanded && (
                        <Box sx={{ pt: 1.5, borderTop: isDark ? '1px solid #1e293b' : '1px solid #f1f5f9' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                            <AccountBalance sx={{ fontSize: 16, mr: 1, color: isDark ? '#94a3b8' : '#64748b' }} />
                            <Typography variant="body2" sx={{ color: isDark ? '#cbd5e1' : '#334155' }}>
                              {acc.bankName} ({acc.accountNumber})
                            </Typography>
                          </Box>
                          
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                            <Typography variant="body2" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>
                              {isAmharic ? 'ሁኔታ:' : 'Status:'}
                            </Typography>
                            <Chip 
                              icon={acc.isBlocked ? <Block sx={{ fontSize: 14 }} /> : <CheckCircle sx={{ fontSize: 14 }} />} 
                              label={acc.isBlocked ? t('accountants.blocked') : t('accountants.active')} 
                              size="small"
                              sx={{ 
                                height: 24, 
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                bgcolor: acc.isBlocked ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                                color: acc.isBlocked ? '#ef4444' : '#10b981',
                                border: acc.isBlocked ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)'
                              }}
                            />
                          </Box>
                          
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                            <Typography variant="body2" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>
                              {isAmharic ? 'የተመዘገበበት:' : 'Created:'}
                            </Typography>
                            <Typography variant="body2" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>
                              {formatDate(acc.createdAt)}
                            </Typography>
                          </Box>

                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={() => handleOpenDialog(acc)}
                              sx={{ 
                                flex: 1, 
                                fontSize: '0.75rem',
                                textTransform: 'none',
                                borderColor: isDark ? '#3b82f6' : '#2563eb',
                                color: isDark ? '#60a5fa' : '#2563eb'
                              }}
                            >
                              <Edit sx={{ fontSize: 15, mr: 0.5 }} />
                              {t('common.edit') || 'Edit'}
                            </Button>
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={() => handleDelete(acc._id)}
                              sx={{ 
                                flex: 1, 
                                fontSize: '0.75rem',
                                textTransform: 'none',
                                borderColor: '#ef4444', 
                                color: '#ef4444' 
                              }}
                            >
                              <Delete sx={{ fontSize: 15, mr: 0.5 }} />
                              {t('common.delete') || 'Delete'}
                            </Button>
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={() => handleBlock(acc)}
                              sx={{ 
                                flex: 1, 
                                fontSize: '0.75rem',
                                textTransform: 'none',
                                borderColor: acc.isBlocked ? '#10b981' : '#f59e0b', 
                                color: acc.isBlocked ? '#10b981' : '#f59e0b' 
                              }}
                            >
                              {acc.isBlocked ? t('accountants.unblock') : t('accountants.block')}
                            </Button>
                          </Box>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </Box>
          )}

          {/* Desktop/Tablet View - Grid */}
          {!isMobile && (
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: { 
                xs: '1fr', 
                sm: '1fr', 
                md: 'repeat(2, 1fr)', 
                lg: 'repeat(3, 1fr)' 
              }, 
              gap: 3 
            }}>
              <AnimatePresence>
                {filteredAccountants.map((acc, index) => (
                  <motion.div 
                    key={acc._id} 
                    initial={{ opacity: 0, scale: 0.95 }} 
                    animate={{ opacity: 1, scale: 1 }} 
                    exit={{ opacity: 0, scale: 0.95 }} 
                    transition={{ duration: 0.25, delay: index * 0.05 }} 
                    whileHover={{ scale: 1.01 }}
                  >
                    <Card sx={{ 
                      borderRadius: 2.5, 
                      bgcolor: isDark ? '#112240' : '#ffffff',
                      color: isDark ? '#f1f5f9' : '#0f172a',
                      border: isDark ? '1px solid #233554' : '1px solid #e2e8f0',
                      boxShadow: isDark ? '0 4px 14px rgba(0,0,0,0.25)' : '0 2px 8px rgba(0,0,0,0.04)',
                      display: 'flex', 
                      flexDirection: 'column', 
                      height: '100%',
                      transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                      '&:hover': {
                        borderColor: isDark ? '#3b82f6' : '#93c5fd',
                        boxShadow: isDark ? '0 8px 20px rgba(0,0,0,0.35)' : '0 6px 16px rgba(0,0,0,0.08)'
                      }
                    }}>
                      <CardContent sx={{ flexGrow: 1, p: 2.5 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                          <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Person sx={{ fontSize: 20, color: isDark ? '#60a5fa' : '#2563eb' }} /> 
                            {acc.fullName}
                          </Typography>
                          <Chip 
                            icon={acc.isBlocked ? <Block sx={{ fontSize: 13 }} /> : <CheckCircle sx={{ fontSize: 13 }} />} 
                            label={acc.isBlocked ? t('accountants.blocked') : t('accountants.active')} 
                            size="small"
                            sx={{ 
                              height: 22, 
                              fontSize: '0.7rem',
                              fontWeight: 600,
                              bgcolor: acc.isBlocked ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                              color: acc.isBlocked ? '#ef4444' : '#10b981',
                              border: acc.isBlocked ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)'
                            }}
                          />
                        </Box>
                        
                        <Typography sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, fontSize: '0.875rem', color: isDark ? '#cbd5e1' : '#475569' }}>
                          <Phone fontSize="small" sx={{ color: isDark ? '#94a3b8' : '#64748b' }} /> {acc.phoneNumber}
                        </Typography>
                        
                        <Typography sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5, fontSize: '0.875rem', color: isDark ? '#cbd5e1' : '#475569' }}>
                          <AccountBalance fontSize="small" sx={{ color: isDark ? '#94a3b8' : '#64748b' }} /> {acc.bankName} ({acc.accountNumber})
                        </Typography>

                        <Typography variant="body2" sx={{ fontSize: '0.78rem', color: isDark ? '#64748b' : '#94a3b8', pt: 1, borderTop: isDark ? '1px solid #1e293b' : '1px solid #f1f5f9' }}>
                          {isAmharic ? 'የተመዘገበበት:' : 'Created:'} {formatDate(acc.createdAt)}
                        </Typography>
                      </CardContent>

                      <Box sx={{ p: 2, pt: 0, display: 'flex', gap: 1 }}>
                        <Button 
                          variant="outlined" 
                          startIcon={<Edit sx={{ fontSize: 16 }} />} 
                          onClick={() => handleOpenDialog(acc)} 
                          fullWidth 
                          size="small"
                          sx={{ 
                            borderRadius: 1.5, 
                            borderColor: isDark ? '#3b82f6' : '#2563eb', 
                            color: isDark ? '#60a5fa' : '#2563eb', 
                            fontSize: '0.78rem',
                            textTransform: 'none',
                            fontWeight: 600,
                            '&:hover': { 
                              borderColor: '#1d4ed8', 
                              bgcolor: isDark ? 'rgba(59,130,246,0.1)' : 'rgba(37,99,235,0.08)' 
                            } 
                          }}
                        >
                          {t('common.edit') || 'Edit'}
                        </Button>
                        <Button 
                          variant="outlined" 
                          startIcon={<Delete sx={{ fontSize: 16 }} />} 
                          onClick={() => handleDelete(acc._id)} 
                          fullWidth 
                          size="small"
                          sx={{ 
                            borderRadius: 1.5, 
                            borderColor: '#ef4444', 
                            color: '#ef4444', 
                            fontSize: '0.78rem',
                            textTransform: 'none',
                            fontWeight: 600,
                            '&:hover': { 
                              borderColor: '#dc2626', 
                              bgcolor: 'rgba(239,68,68,0.08)' 
                            } 
                          }}
                        >
                          {t('common.delete') || 'Delete'}
                        </Button>
                        <Button 
                          variant="outlined" 
                          onClick={() => handleBlock(acc)} 
                          fullWidth 
                          size="small"
                          sx={{ 
                            borderRadius: 1.5, 
                            borderColor: acc.isBlocked ? '#10b981' : '#f59e0b', 
                            color: acc.isBlocked ? '#10b981' : '#f59e0b', 
                            fontSize: '0.78rem',
                            textTransform: 'none',
                            fontWeight: 600,
                            '&:hover': { 
                              bgcolor: acc.isBlocked ? 'rgba(16,185,129,0.08)' : 'rgba(245,158,11,0.08)' 
                            } 
                          }}
                        >
                          {acc.isBlocked ? t('accountants.unblock') : t('accountants.block')}
                        </Button>
                      </Box>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </Box>
          )}

          {filteredAccountants.length === 0 && !loading && (
            <Box sx={{ 
              textAlign: 'center', 
              mt: 4, 
              p: 4, 
              bgcolor: isDark ? '#112240' : '#ffffff', 
              borderRadius: 3, 
              border: isDark ? '1px dashed #233554' : '1px dashed #cbd5e1' 
            }}>
              <Typography variant="body1" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>
                {isAmharic ? 'ምንም የሂሳብ ሹም አልተገኘም።' : 'No accountants found.'}
              </Typography>
            </Box>
          )}
        </motion.div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog} 
        maxWidth="sm" 
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            bgcolor: isDark ? '#112240' : '#ffffff',
            color: isDark ? '#f1f5f9' : '#0f172a',
            border: isDark ? '1px solid #233554' : '1px solid #e2e8f0',
            borderRadius: isMobile ? 0 : 2.5
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, pb: 1, borderBottom: isDark ? '1px solid #1e293b' : '1px solid #e2e8f0' }}>
          {editingAccountant ? t('accountants.edit') : t('accountants.add')}
        </DialogTitle>
        <DialogContent sx={{ pt: 2.5 }}>
          <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <TextField 
              fullWidth 
              label={t('accountants.full_name')} 
              name="fullName" 
              value={formData.fullName} 
              onChange={handleInputChange} 
              error={!!errors.fullName} 
              helperText={errors.fullName} 
              size="small"
            />
            <TextField 
              fullWidth 
              label={t('accountants.phone_number')} 
              name="phoneNumber" 
              value={formData.phoneNumber} 
              onChange={handleInputChange} 
              error={!!errors.phoneNumber} 
              helperText={errors.phoneNumber} 
              size="small"
              placeholder="+251..."
            />
            <TextField 
              fullWidth 
              label={t('accountants.account_number')} 
              name="accountNumber" 
              value={formData.accountNumber} 
              onChange={handleInputChange} 
              error={!!errors.accountNumber} 
              helperText={errors.accountNumber} 
              size="small"
            />
            <TextField 
              fullWidth 
              label={t('accountants.bank_name')} 
              name="bankName" 
              value={formData.bankName} 
              onChange={handleInputChange} 
              error={!!errors.bankName} 
              helperText={errors.bankName} 
              size="small"
              placeholder={isAmharic ? 'ምሳሌ፡ ንግድ ባንክ (CBE)' : 'e.g., Commercial Bank of Ethiopia (CBE)'}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, borderTop: isDark ? '1px solid #1e293b' : '1px solid #e2e8f0' }}>
          <Button 
            onClick={handleCloseDialog} 
            sx={{ 
              borderRadius: 2, 
              color: isDark ? '#94a3b8' : '#64748b',
              textTransform: 'none' 
            }}
          >
            {t('common.cancel') || 'Cancel'}
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            sx={{ 
              borderRadius: 2, 
              px: 3, 
              bgcolor: '#2563eb', 
              '&:hover': { bgcolor: '#1d4ed8' },
              textTransform: 'none',
              fontWeight: 600
            }}
          >
            {editingAccountant ? (t('common.update') || 'Update') : (t('common.create') || 'Create')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notifications */}
      <Snackbar open={!!error} autoHideDuration={5000} onClose={() => setError('')}>
        <Alert severity="error" onClose={() => setError('')} sx={{ fontSize: '0.875rem' }}>
          {error}
        </Alert>
      </Snackbar>
      <Snackbar open={!!success} autoHideDuration={5000} onClose={() => setSuccess('')}>
        <Alert severity="success" onClose={() => setSuccess('')} sx={{ fontSize: '0.875rem' }}>
          {success}
        </Alert>
      </Snackbar>
    </Box>
  );
}