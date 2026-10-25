'use client';

import { FiPlusCircle } from 'react-icons/fi';
import { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Button, TextField, Dialog, DialogTitle,
  DialogContent, DialogActions, Chip, Alert, Snackbar, CircularProgress,
  useMediaQuery, IconButton, Tabs, Tab, Stack, Divider, Paper, Tooltip
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AccountBalance, Block, CheckCircle, Edit, Delete, Add, Person,
  Refresh, AccountBalanceWallet
} from '@mui/icons-material';
import api from '@/app/utils/api';
import { Accountant, Bank } from '@/types/banks';
import { formatDate } from '@/lib/date';
import { useAuth } from '@/lib/auth';
import { useTheme } from '@/lib/theme-context';
import { useLanguage } from '@/lib/language-context';

type DraftAccount = {
  tempId: string;
  _id?: string;              // present when editing an existing account
  bankId: string;
  bankName: string;
  bankCode: string;
  type: 'bank' | 'wallet';
  accountHolderName: string;
  accountNumber: string;
  isBlocked: boolean;
};

export default function AccountantsPage() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const { t, isAmharic } = useLanguage();
  const isDark = theme === 'dark';
  const isMobile = useMediaQuery('(max-width: 600px)');

  const [accountants, setAccountants] = useState<Accountant[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'blocked'>('all');

  const [banks, setBanks] = useState<Bank[]>([]);

  const [openDialog, setOpenDialog] = useState(false);
  const [editingAccountant, setEditingAccountant] = useState<Accountant | null>(null);
  const [draftAccounts, setDraftAccounts] = useState<DraftAccount[]>([]);
  const [activeTab, setActiveTab] = useState<'bank' | 'wallet'>('bank');
  const [editingBankId, setEditingBankId] = useState<string | null>(null);
  const [editingDraftTempId, setEditingDraftTempId] = useState<string | null>(null);
  const [inlineForm, setInlineForm] = useState({ accountHolderName: '', accountNumber: '' });
  const [inlineError, setInlineError] = useState('');
  const [expandedAccountant, setExpandedAccountant] = useState<string | null>(null);

  // ── fetch ───────────────────────────────────────────────────────────────
  const fetchAccountants = async (manual = false) => {
    try {
      manual ? setRefreshing(true) : setLoading(true);
      let url = '/accountants';
      if (filter !== 'all') url += `?blocked=${filter === 'blocked'}`;
      const r = await api.get(url);
      setAccountants(r.data.data || []);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch accountants');
    } finally {
      setLoading(false); setRefreshing(false);
    }
  };

  const fetchBanks = async () => {
    try {
      const r = await api.get('/banks');
      setBanks(r.data.data || []);
    } catch {/* silent */}
  };

  useEffect(() => { if (user?.role === 'admin' || user?.role === 'owner' || user?.role === 'agent') { fetchAccountants(); fetchBanks(); } }, [user, filter]);

  // ── dialog ──────────────────────────────────────────────────────────────
  const handleOpenDialog = (acc: Accountant | null = null) => {
    if (acc) {
      setEditingAccountant(acc);
      setDraftAccounts((acc.accounts || []).map(a => {
        const bank = typeof a.bankId === 'object' ? a.bankId : banks.find(b => b._id === a.bankId);
        return {
          tempId: crypto.randomUUID(),
          _id: a._id,
          bankId: typeof a.bankId === 'object' ? a.bankId._id : a.bankId,
          bankName: a.bankName,
          bankCode: a.bankCode,
          type: (bank as any)?.type || 'bank',
          accountHolderName: a.accountHolderName,
          accountNumber: a.accountNumber,
          isBlocked: a.isBlocked
        };
      }));
    } else {
      setEditingAccountant(null);
      setDraftAccounts([]);
    }
    setActiveTab('bank');
    setEditingBankId(null);
    setEditingDraftTempId(null);
    setInlineForm({ accountHolderName: '', accountNumber: '' });
    setInlineError('');
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingAccountant(null);
    setDraftAccounts([]);
    setEditingBankId(null);
    setEditingDraftTempId(null);
    setInlineForm({ accountHolderName: '', accountNumber: '' });
    setInlineError('');
  };

  const handleStartAdd = (bank: Bank) => {
    setEditingBankId(bank._id);
    setEditingDraftTempId(null);
    setInlineForm({ accountHolderName: '', accountNumber: '' });
    setInlineError('');
  };

  const handleStartEdit = (draft: DraftAccount) => {
    setActiveTab(draft.type);
    setEditingBankId(draft.bankId);
    setEditingDraftTempId(draft.tempId);
    setInlineForm({ accountHolderName: draft.accountHolderName, accountNumber: draft.accountNumber });
    setInlineError('');
  };

  const handleCancelInline = () => {
    setEditingBankId(null);
    setEditingDraftTempId(null);
    setInlineForm({ accountHolderName: '', accountNumber: '' });
    setInlineError('');
  };

  const handleConfirmInline = () => {
    const holder = inlineForm.accountHolderName.trim();
    const num = inlineForm.accountNumber.trim();
    if (!holder) { setInlineError(isAmharic ? 'የሂሳብ ባለቤት ስም ያስገቡ' : 'Account holder name is required'); return; }
    if (!/^[A-Za-z0-9]{6,25}$/.test(num)) { setInlineError(isAmharic ? 'ትክክለኛ የሂሳብ ቁጥር ያስገቡ (6-25)' : 'Account number must be 6-25 alphanumeric'); return; }

    if (editingDraftTempId) {
      setDraftAccounts(prev => prev.map(d => d.tempId === editingDraftTempId ? { ...d, accountHolderName: holder, accountNumber: num } : d));
    } else {
      const bank = banks.find(b => b._id === editingBankId);
      if (!bank) return;
      setDraftAccounts(prev => [...prev, {
        tempId: crypto.randomUUID(),
        bankId: bank._id,
        bankName: bank.name,
        bankCode: bank.code,
        type: bank.type,
        accountHolderName: holder,
        accountNumber: num,
        isBlocked: false
      }]);
    }
    handleCancelInline();
  };

  const handleRemoveDraft = (tempId: string) => {
    setDraftAccounts(prev => prev.filter(d => d.tempId !== tempId));
  };

  const handleSave = async () => {
    if (draftAccounts.length === 0) {
      setError(isAmharic ? 'ቢያንስ አንድ ሂሳብ ያስፈልጋል' : 'At least one account is required');
      return;
    }
    try {
      const payload = {
        accounts: draftAccounts.map(d => ({
          ...(d._id ? { _id: d._id } : {}),
          bankId: d.bankId,
          accountHolderName: d.accountHolderName,
          accountNumber: d.accountNumber
        }))
      };

      if (editingAccountant) {
        await api.put(`/accountants/${editingAccountant._id}`, payload);
        setSuccess(isAmharic ? 'በተሳካ ሁኔታ ተሻሽሏል' : 'Accountant updated successfully');
      } else {
        await api.post('/accountants', payload);
        setSuccess(isAmharic ? 'በተሳካ ሁኔታ ተፈጥሯል' : 'Accountant created successfully');
      }
      handleCloseDialog();
      fetchAccountants();
    } catch (err: any) {
      setError(err.response?.data?.message || (isAmharic ? 'ክንውኑ አልተሳካም' : 'Operation failed'));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(isAmharic ? 'ይህን የሂሳብ ሹም ማጥፋት ይፈልጋሉ?' : 'Delete this accountant?')) return;
    try {
      await api.delete(`/accountants/${id}`);
      setSuccess(isAmharic ? 'ተሰርዟል' : 'Deleted successfully');
      fetchAccountants();
    } catch (err: any) { setError(err.response?.data?.message || 'Failed to delete'); }
  };

  const handleToggleBlock = async (acc: Accountant) => {
    const msg = acc.isBlocked
      ? (isAmharic ? 'እገዳ ማንሳት?' : 'Unblock this accountant?')
      : (isAmharic ? 'ማገድ?' : 'Block this accountant?');
    if (!confirm(msg)) return;
    try {
      await api.patch(`/accountants/${acc._id}/block`, { isBlocked: !acc.isBlocked });
      setSuccess(isAmharic ? 'ተዘምኗል' : 'Status updated');
      fetchAccountants();
    } catch (err: any) { setError(err.response?.data?.message || 'Failed'); }
  };

  const toggleExpand = (id: string) => setExpandedAccountant(expandedAccountant === id ? null : id);

  if (!['admin', 'owner', 'agent'].includes(user?.role || '')) {
    return <Box sx={{ p: 4, textAlign: 'center', color: '#ef4444', fontWeight: 700 }}>
      {isAmharic ? 'ፈቃድ የለዎትም' : 'Access denied'}
    </Box>;
  }

  const banksFiltered = banks.filter(b => b.type === activeTab && b.isActive);
  const draftForBank = (bankId: string) => draftAccounts.find(d => d.bankId === bankId);

  // ── render ──────────────────────────────────────────────────────────────
  return (
    <Box sx={{
      p: { xs: 1.5, sm: 2.5, md: 3 },
      minHeight: '100vh',
      bgcolor: isDark ? '#0a192f' : '#f8fafc',
      color: isDark ? '#f1f5f9' : '#0f172a',
      transition: 'background-color 0.2s ease'
    }}>
      {/* Header */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, gap: 2, mb: 3 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5, flexWrap: 'wrap' }}>
            <Typography variant="h4" sx={{ fontWeight: 800, color: isDark ? '#f1f5f9' : '#0f172a', fontSize: { xs: '1.5rem', sm: '2rem' } }}>
              {isAmharic ? 'የሂሳብ ሹሞች' : 'Accountants'}
            </Typography>
            <Chip size="small" label={isAmharic ? 'የፋይናንስ ማዕከል' : 'Finance Hub'} sx={{
              bgcolor: isDark ? 'rgba(56,189,248,0.15)' : 'rgba(37,99,235,0.1)',
              color: isDark ? '#38bdf8' : '#2563eb', fontWeight: 700,
              border: `1px solid ${isDark ? 'rgba(56,189,248,0.3)' : 'rgba(37,99,235,0.3)'}`
            }} />
          </Box>
          <Typography variant="body2" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>
            {isAmharic ? 'የባንክ እና የዋሌት ሂሳቦችን ያስተዳድሩ' : 'Manage bank & wallet accounts'}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.5}>
          <Button variant="contained" startIcon={<FiPlusCircle size={18} />} onClick={() => handleOpenDialog()}
            sx={{ bgcolor: isDark ? '#38bdf8' : '#2563eb', color: isDark ? '#0a192f' : '#fff', fontWeight: 700, borderRadius: 2.5, textTransform: 'none', '&:hover': { bgcolor: isDark ? '#7dd3fc' : '#1d4ed8' } }}>
            {isMobile ? (isAmharic ? 'ጨምር' : 'Add') : (isAmharic ? 'አዲስ የሂሳብ ሹም' : 'New Accountant')}
          </Button>
          <Tooltip title={isAmharic ? 'አድስ' : 'Refresh'}>
            <IconButton onClick={() => fetchAccountants(true)} disabled={refreshing || loading}
              sx={{ bgcolor: isDark ? '#112240' : '#fff', color: isDark ? '#38bdf8' : '#2563eb', border: `1px solid ${isDark ? '#233554' : '#e2e8f0'}` }}>
              <Refresh sx={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
            </IconButton>
          </Tooltip>
        </Stack>
      </Box>

      {/* Filter cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3,1fr)' }, gap: 2, mb: 3 }}>
        {[
          { key: 'all', label: isAmharic ? 'ሁሉም' : 'All', count: accountants.length, color: '#2563eb' },
          { key: 'active', label: isAmharic ? 'ንቁ' : 'Active', count: accountants.filter(a => !a.isBlocked).length, color: '#059669' },
          { key: 'blocked', label: isAmharic ? 'የታገዱ' : 'Blocked', count: accountants.filter(a => a.isBlocked).length, color: '#dc2626' },
        ].map(f => (
          <Card key={f.key} onClick={() => setFilter(f.key as any)} sx={{
            cursor: 'pointer', borderRadius: 3, p: 2, textAlign: 'center',
            bgcolor: filter === f.key ? f.color : (isDark ? '#112240' : '#fff'),
            color: filter === f.key ? '#fff' : (isDark ? '#f1f5f9' : '#0f172a'),
            border: `1px solid ${filter === f.key ? f.color : (isDark ? '#233554' : '#e2e8f0')}`,
            borderLeft: `5px solid ${f.color}`,
            transition: 'all 0.2s ease', '&:hover': { transform: 'translateY(-2px)' }
          }}>
            <Typography variant="body2" sx={{ fontWeight: 500, opacity: 0.9 }}>{f.label}</Typography>
            <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5 }}>{f.count}</Typography>
          </Card>
        ))}
      </Box>

      {/* List */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress sx={{ color: isDark ? '#38bdf8' : '#2563eb' }} />
        </Box>
      ) : accountants.length === 0 ? (
        <Paper elevation={0} sx={{
          p: 6, textAlign: 'center', borderRadius: 3,
          border: '1px dashed', borderColor: isDark ? 'rgba(56,189,248,0.2)' : '#cbd5e1',
          bgcolor: isDark ? 'rgba(15,23,42,0.3)' : '#f8fafc'
        }}>
          <AccountBalance sx={{ fontSize: 48, color: isDark ? '#38bdf8' : '#2563eb', opacity: 0.8, mb: 1 }} />
          <Typography variant="h6" sx={{ fontWeight: 700, color: isDark ? '#f1f5f9' : '#0f172a' }}>
            {isAmharic ? 'ምንም የሂሳብ ሹም አልተገኘም' : 'No accountants yet'}
          </Typography>
          <Typography variant="body2" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>
            {isAmharic ? 'ለመጀመር አዲስ የሂሳብ ሹም ይፍጠሩ' : 'Create your first accountant to get started'}
          </Typography>
        </Paper>
      ) : (
        <Stack spacing={2.5}>
          <AnimatePresence>
            {accountants.map((acc, idx) => {
              const expanded = expandedAccountant === acc._id;
              return (
                <motion.div key={acc._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2, delay: idx * 0.03 }}>
                  <Paper elevation={0} sx={{
                    p: 2.5, borderRadius: 3,
                    bgcolor: isDark ? '#112240' : '#fff',
                    border: `1px solid ${isDark ? '#233554' : '#e2e8f0'}`,
                    transition: 'border-color 0.2s',
                    '&:hover': { borderColor: isDark ? '#3b82f6' : '#93c5fd' }
                  }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: isDark ? '#f1f5f9' : '#0f172a' }}>
                            {acc.accountsCount ?? acc.accounts?.length ?? 0} {(acc.accountsCount ?? acc.accounts?.length) === 1
                              ? (isAmharic ? 'ሂሳብ' : 'account')
                              : (isAmharic ? 'ሂሳቦች' : 'accounts')}
                          </Typography>
                          <Chip size="small"
                            icon={acc.isBlocked ? <Block sx={{ fontSize: 13 }} /> : <CheckCircle sx={{ fontSize: 13 }} />}
                            label={acc.isBlocked ? (isAmharic ? 'ታግዷል' : 'Blocked') : (isAmharic ? 'ንቁ' : 'Active')}
                            sx={{
                              height: 22, fontSize: '0.7rem', fontWeight: 700,
                              bgcolor: acc.isBlocked ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)',
                              color: acc.isBlocked ? '#ef4444' : '#10b981'
                            }} />
                        </Box>
                        <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>
                          {isAmharic ? 'የተፈጠረ:' : 'Created:'} {formatDate(acc.createdAt)}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button size="small" variant="outlined" startIcon={<Edit sx={{ fontSize: 15 }} />} onClick={() => handleOpenDialog(acc)}
                          sx={{ textTransform: 'none', borderRadius: 2, borderColor: isDark ? '#3b82f6' : '#2563eb', color: isDark ? '#60a5fa' : '#2563eb' }}>
                          {isAmharic ? 'አርትዕ' : 'Edit'}
                        </Button>
                        <Button size="small" variant="outlined" onClick={() => handleToggleBlock(acc)}
                          sx={{ textTransform: 'none', borderRadius: 2, borderColor: acc.isBlocked ? '#10b981' : '#f59e0b', color: acc.isBlocked ? '#10b981' : '#f59e0b' }}>
                          {acc.isBlocked ? (isAmharic ? 'ክፈት' : 'Unblock') : (isAmharic ? 'አግድ' : 'Block')}
                        </Button>
                        <Button size="small" variant="outlined" startIcon={<Delete sx={{ fontSize: 15 }} />} onClick={() => handleDelete(acc._id)}
                          sx={{ textTransform: 'none', borderRadius: 2, borderColor: '#ef4444', color: '#ef4444' }}>
                          {isAmharic ? 'አጥፋ' : 'Delete'}
                        </Button>
                      </Box>
                    </Box>

                    <Divider sx={{ my: 1.5, borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0' }} />

                    <Stack spacing={1}>
                      {acc.accounts?.slice(0, expanded ? undefined : 3).map(a => (
                        <Box key={a._id} sx={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1,
                          p: 1.2, borderRadius: 2,
                          bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc'
                        }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, minWidth: 0 }}>
                            {(typeof a.bankId === 'object' ? a.bankId.type : 'bank') === 'wallet'
                              ? <AccountBalanceWallet sx={{ fontSize: 18, color: '#8b5cf6' }} />
                              : <AccountBalance sx={{ fontSize: 18, color: '#2563eb' }} />}
                            <Box sx={{ minWidth: 0 }}>
                              <Typography variant="body2" sx={{ fontWeight: 700, color: isDark ? '#f1f5f9' : '#0f172a' }}>
                                {a.bankName}
                              </Typography>
                              <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Person sx={{ fontSize: 12 }} /> {a.accountHolderName} · {a.accountNumber}
                              </Typography>
                            </Box>
                          </Box>
                          {a.isBlocked && (
                            <Chip size="small" label={isAmharic ? 'ታግዷል' : 'Blocked'} sx={{ height: 20, fontSize: '0.65rem', bgcolor: 'rgba(239,68,68,0.15)', color: '#ef4444' }} />
                          )}
                        </Box>
                      ))}
                      {(acc.accounts?.length || 0) > 3 && (
                        <Button size="small" onClick={() => toggleExpand(acc._id)} sx={{ textTransform: 'none', alignSelf: 'center', color: isDark ? '#38bdf8' : '#2563eb' }}>
                          {expanded ? (isAmharic ? 'ያሳንሱ' : 'Show less') : (isAmharic ? `ሁሉንም ${acc.accounts.length} አሳይ` : `Show all ${acc.accounts.length}`)}
                        </Button>
                      )}
                    </Stack>
                  </Paper>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </Stack>
      )}

      {/* ── Add / Edit Dialog ────────────────────────────────────────────── */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth fullScreen={isMobile}
        PaperProps={{ sx: { bgcolor: isDark ? '#112240' : '#fff', color: isDark ? '#f1f5f9' : '#0f172a', borderRadius: isMobile ? 0 : 2.5, border: `1px solid ${isDark ? '#233554' : '#e2e8f0'}` } }}>
        <DialogTitle sx={{ fontWeight: 800, pb: 1, borderBottom: `1px solid ${isDark ? '#1e293b' : '#e2e8f0'}` }}>
          {editingAccountant ? (isAmharic ? 'የሂሳብ ሹም አርትዕ' : 'Edit Accountant') : (isAmharic ? 'አዲስ የሂሳብ ሹም' : 'New Accountant')}
        </DialogTitle>
        <DialogContent sx={{ pt: 2.5 }}>
          {/* Tabs */}
          <Tabs value={activeTab} onChange={(_, v) => { setActiveTab(v); handleCancelInline(); }}
            sx={{
              mb: 2,
              '& .MuiTab-root': { textTransform: 'none', fontWeight: 700, color: isDark ? '#94a3b8' : '#64748b' },
              '& .Mui-selected': { color: isDark ? '#38bdf8 !important' : '#2563eb !important' },
              '& .MuiTabs-indicator': { bgcolor: isDark ? '#38bdf8' : '#2563eb', height: 3, borderRadius: 2 }
            }}>
            <Tab icon={<AccountBalance />} iconPosition="start" value="bank" label={isAmharic ? 'ባንኮች' : 'Banks'} />
            <Tab icon={<AccountBalanceWallet />} iconPosition="start" value="wallet" label={isAmharic ? 'ዋሌቶች' : 'Wallets'} />
          </Tabs>

          {/* Bank/Wallet list */}
          <Stack spacing={1} sx={{ mb: 3 }}>
            {banksFiltered.map(bank => {
              const draft = draftForBank(bank._id);
              const isEditingThis = editingBankId === bank._id;
              const isEditingExisting = isEditingThis && editingDraftTempId && draft?.tempId === editingDraftTempId;
              return (
                <Box key={bank._id} sx={{
                  p: 1.5, borderRadius: 2,
                  border: `1px solid ${isDark ? '#233554' : '#e2e8f0'}`,
                  bgcolor: isDark ? '#0f172a40' : '#f8fafc'
                }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: isDark ? '#f1f5f9' : '#0f172a' }}>
                      {bank.name} <Typography component="span" variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>({bank.code})</Typography>
                    </Typography>
                    {draft && !isEditingThis ? (
                      <Chip size="small" icon={<CheckCircle sx={{ fontSize: 14 }} />} label={isAmharic ? 'ተጨምሯል' : 'Added'}
                        sx={{ bgcolor: 'rgba(16,185,129,0.15)', color: '#10b981', fontWeight: 700 }} />
                    ) : !isEditingThis ? (
                      <Button size="small" startIcon={<Add sx={{ fontSize: 16 }} />} onClick={() => handleStartAdd(bank)}
                        sx={{ textTransform: 'none', color: isDark ? '#38bdf8' : '#2563eb', fontWeight: 700 }}>
                        {isAmharic ? 'ጨምር' : 'Add'}
                      </Button>
                    ) : null}
                  </Box>

                  {isEditingThis && (
                    <Stack spacing={1.5} sx={{ mt: 1.5 }}>
                      <TextField size="small" fullWidth label={isAmharic ? 'የሂሳብ ባለቤት ስም' : 'Account Holder Name'}
                        value={inlineForm.accountHolderName}
                        onChange={(e) => setInlineForm(f => ({ ...f, accountHolderName: e.target.value }))} />
                      <TextField size="small" fullWidth label={isAmharic ? 'የሂሳብ ቁጥር' : 'Account Number'}
                        value={inlineForm.accountNumber}
                        onChange={(e) => setInlineForm(f => ({ ...f, accountNumber: e.target.value }))}
                        error={!!inlineError} helperText={inlineError} />
                      <Stack direction="row" spacing={1}>
                        <Button size="small" variant="contained" onClick={handleConfirmInline}
                          sx={{ bgcolor: '#10b981', textTransform: 'none', fontWeight: 700, '&:hover': { bgcolor: '#059669' } }}>
                          {isEditingExisting ? (isAmharic ? 'አዘምን' : 'Update') : (isAmharic ? 'ጨምር' : 'Add')}
                        </Button>
                        <Button size="small" variant="outlined" onClick={handleCancelInline}
                          sx={{ textTransform: 'none', borderColor: isDark ? '#64748b' : '#cbd5e1', color: isDark ? '#94a3b8' : '#64748b' }}>
                          {isAmharic ? 'ሰርዝ' : 'Cancel'}
                        </Button>
                      </Stack>
                    </Stack>
                  )}
                </Box>
              );
            })}
          </Stack>

          {/* Selected Accounts */}
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: isDark ? '#f1f5f9' : '#0f172a', mb: 1 }}>
              {isAmharic ? `የተመረጡ ሂሳቦች (${draftAccounts.length})` : `Selected Accounts (${draftAccounts.length})`}
            </Typography>
            {draftAccounts.length === 0 ? (
              <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>
                {isAmharic ? 'ከላይ ካለው ዝርዝር ሂሳብ ይጨምሩ' : 'Add an account from the list above'}
              </Typography>
            ) : (
              <Stack spacing={1}>
                {draftAccounts.map(d => (
                  <Box key={d.tempId} sx={{
                    p: 1.2, borderRadius: 2,
                    bgcolor: isDark ? 'rgba(16,185,129,0.08)' : 'rgba(16,185,129,0.06)',
                    border: '1px solid rgba(16,185,129,0.3)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1
                  }}>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: isDark ? '#f1f5f9' : '#0f172a' }}>
                        {d.bankName}
                      </Typography>
                      <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>
                        {d.accountHolderName} · {d.accountNumber}
                      </Typography>
                    </Box>
                    <Stack direction="row" spacing={0.5}>
                      <IconButton size="small" onClick={() => handleStartEdit(d)} sx={{ color: isDark ? '#60a5fa' : '#2563eb' }}>
                        <Edit sx={{ fontSize: 16 }} />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleRemoveDraft(d.tempId)} sx={{ color: '#ef4444' }}>
                        <Delete sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Stack>
                  </Box>
                ))}
              </Stack>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, borderTop: `1px solid ${isDark ? '#1e293b' : '#e2e8f0'}` }}>
          <Button onClick={handleCloseDialog} sx={{ textTransform: 'none', color: isDark ? '#94a3b8' : '#64748b' }}>
            {isAmharic ? 'ሰርዝ' : 'Cancel'}
          </Button>
          <Button variant="contained" onClick={handleSave} disabled={draftAccounts.length === 0}
            sx={{ bgcolor: isDark ? '#38bdf8' : '#2563eb', color: isDark ? '#0a192f' : '#fff', fontWeight: 700, textTransform: 'none', px: 3, '&:hover': { bgcolor: isDark ? '#7dd3fc' : '#1d4ed8' } }}>
            {editingAccountant ? (isAmharic ? 'አዘምን' : 'Update') : (isAmharic ? 'አስቀምጥ' : 'Save')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbars */}
      <Snackbar open={!!error} autoHideDuration={5000} onClose={() => setError('')} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity="error" onClose={() => setError('')} sx={{ borderRadius: 2 }}>{error}</Alert>
      </Snackbar>
      <Snackbar open={!!success} autoHideDuration={5000} onClose={() => setSuccess('')} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity="success" onClose={() => setSuccess('')} sx={{ borderRadius: 2 }}>{success}</Alert>
      </Snackbar>
    </Box>
  );
}