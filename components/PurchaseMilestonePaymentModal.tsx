'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Chip,
  Paper,
  Divider,
  IconButton,
  Alert,
  CircularProgress,
  Tooltip,
  useMediaQuery
} from '@mui/material';
import {
  Close,
  ContentCopy,
  Check,
  Receipt,
  AccountBalance,
  PhoneAndroid,
  LocalOffer,
  Shield,
  Print,
  CheckCircle,
  Payment as PaymentIcon
} from '@mui/icons-material';
import { useTheme } from '@/lib/theme-context';
import { useLanguage } from '@/lib/language-context';
import { PurchaseOffer } from '@/types/houses';
import api from '@/app/utils/api';

interface PurchaseMilestonePaymentModalProps {
  open: boolean;
  onClose: () => void;
  offer: PurchaseOffer | null;
  milestone: {
    _id?: string;
    id?: string;
    title: string;
    amount: number;
    percentage: number;
    dueDate: string;
    status: string;
    transactionReference?: string;
    receiptNumber?: string;
  } | null;
  onSuccess?: () => void;
}

export default function PurchaseMilestonePaymentModal({
  open,
  onClose,
  offer,
  milestone,
  onSuccess
}: PurchaseMilestonePaymentModalProps) {
  const { theme } = useTheme();
  const { t, language } = useLanguage();
  const isDark = theme === 'dark';
  const isMobile = useMediaQuery('(max-width: 600px)');

  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<any | null>(null);
  const [method, setMethod] = useState<'telebirr' | 'cbe' | 'cash'>('cbe');
  const [transactionId, setTransactionId] = useState('');
  const [senderPhone, setSenderPhone] = useState(offer?.buyerPhone || '');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [copied, setCopied] = useState(false);
  const [completedTx, setCompletedTx] = useState<any | null>(null);

  const houseObj: any = offer && typeof offer.houseId === 'object' && offer.houseId ? offer.houseId : null;
  const houseId = offer ? (houseObj?._id || offer.houseId) : null;
  const houseTitle = houseObj?.title || 'Property For Sale';

  useEffect(() => {
    if (open && houseId) {
      fetchPaymentAccounts();
      setTransactionId('');
      setSenderPhone(offer?.buyerPhone || '');
      setDescription('');
      setError('');
      setSuccess('');
      setCompletedTx(null);
    }
  }, [open, houseId, offer]);

  const fetchPaymentAccounts = async () => {
    try {
      setLoadingAccounts(true);
      let fetched: any[] = [];

      // 1. Try house-specific verified accountant accounts
      try {
        const res = await api.get(`/accountants/for-house/${houseId}`);
        if (res.data?.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
          fetched = res.data.data;
        }
      } catch (err) {
        console.log('Error fetching house accounts, falling back to accountant list:', err);
      }

      // 2. Fallback to all active accountants
      if (fetched.length === 0) {
        try {
          const res = await api.get('/accountants?blocked=false');
          const accs = res.data?.data || [];
          accs.forEach((acc: any) => {
            (acc.accounts || []).forEach((a: any) => {
              if (!a.isBlocked) {
                fetched.push({
                  _id: a._id,
                  bankName: a.bankName || 'Commercial Bank of Ethiopia',
                  bankCode: a.bankCode || 'cbe',
                  accountHolderName: a.accountHolderName || acc.fullName,
                  accountNumber: a.accountNumber || acc.accountNumber
                });
              }
            });
          });
        } catch (err2) {
          console.log('Error fetching fallback accountants:', err2);
        }
      }

      // Default fallback accounts if none registered yet
      if (fetched.length === 0) {
        fetched = [
          {
            _id: 'cbe-default',
            bankName: 'Commercial Bank of Ethiopia (CBE)',
            bankCode: 'cbe',
            accountHolderName: 'HRMS Real Estate Escrow',
            accountNumber: '1000192837465'
          },
          {
            _id: 'telebirr-default',
            bankName: 'TeleBirr Escrow Service',
            bankCode: 'telebirr',
            accountHolderName: 'HRMS Property Sales',
            accountNumber: '0911223344'
          }
        ];
      }

      setBankAccounts(fetched);
      setSelectedAccount(fetched[0]);
      if (fetched[0]?.bankCode === 'telebirr') setMethod('telebirr');
    } catch (err: any) {
      console.error('Account fetch error:', err);
    } finally {
      setLoadingAccounts(false);
    }
  };

  const handleCopy = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!offer || !milestone) return;
    if (!transactionId.trim()) {
      setError(language === 'am' ? 'እባክዎ የትራንዛክሽን መለያ ቁጥር (Transaction ID) ያስገቡ' : 'Please provide your payment Transaction ID');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      const milestoneId = milestone._id || milestone.id;
      const res = await api.post(`/workflows/offers/${offer._id}/submit-milestone-payment`, {
        milestoneId,
        method: selectedAccount?.bankCode?.toLowerCase() || method,
        transactionId: transactionId.trim(),
        senderPhone: senderPhone.trim(),
        bankName: selectedAccount?.bankName || 'Bank Transfer',
        accountNumber: selectedAccount?.accountNumber || '',
        accountHolderName: selectedAccount?.accountHolderName || '',
        description: description.trim() || `Milestone Payment: ${milestone.title}`
      });

      setSuccess(
        language === 'am'
          ? 'የግዢ ክፍያዎ በተሳካ ሁኔታ ተልኳል! ሁኔታው "በግምገማ ላይ" ሆኗል፤ ሻጩ/ደላላው ካረጋገጠ በኋላ ይፋዊ የሽያጭ ደረሰኝ ይሰጥዎታል።'
          : 'Purchase payment submitted successfully! Status changed to Under Review. Once verified by the seller/agent, your official sales receipt will be issued.'
      );

      setCompletedTx(res.data?.data?.transaction || { reference: `TXN-${Date.now()}` });
      onSuccess?.();
    } catch (err: any) {
      setError(err?.response?.data?.message || (language === 'am' ? 'ክፍያውን ማስገባት አልተቻለም' : 'Failed to submit payment'));
    } finally {
      setSubmitting(false);
    }
  };

  const textFieldStyle = {
    '& .MuiOutlinedInput-root': {
      backgroundColor: isDark ? '#0a192f' : '#ffffff',
      color: isDark ? '#f1f5f9' : '#0f172a',
      borderRadius: '10px',
      '& fieldset': { borderColor: isDark ? '#233554' : '#cbd5e1' },
      '&:hover fieldset': { borderColor: '#10b981' },
      '&.Mui-focused fieldset': { borderColor: '#10b981' }
    },
    '& .MuiInputLabel-root': { color: isDark ? '#94a3b8' : '#64748b' }
  };

  if (!offer || !milestone) return null;

  return (
    <Dialog
      open={open}
      onClose={() => !submitting && onClose()}
      maxWidth="sm"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : 3,
          bgcolor: isDark ? '#112240' : '#ffffff',
          border: `1px solid ${isDark ? '#233554' : '#e2e8f0'}`,
          color: isDark ? '#f1f5f9' : '#0f172a',
          backgroundImage: 'none'
        }
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pb: 1.5,
          borderBottom: `1px solid ${isDark ? '#233554' : '#e2e8f0'}`
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <LocalOffer sx={{ color: '#10b981', fontSize: 28 }} />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: isDark ? '#f1f5f9' : '#0f172a' }}>
              {language === 'am' ? 'የቤት ግዢ ክፍያ ፈጽም' : 'Property Purchase Payment'}
            </Typography>
            <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>
              {milestone.title} • {milestone.percentage}%
            </Typography>
          </Box>
        </Box>
        <IconButton size="small" onClick={onClose} disabled={submitting} sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ py: 2.5 }}>
        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>{success}</Alert>}

        {completedTx ? (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <CheckCircle sx={{ color: '#10b981', fontSize: 60, mb: 1.5 }} />
            <Typography variant="h6" sx={{ fontWeight: 800, color: isDark ? '#f1f5f9' : '#0f172a', mb: 1 }}>
              {language === 'am' ? 'ክፍያው በተሳካ ሁኔታ ተልኳል!' : 'Payment Submitted Under Review!'}
            </Typography>
            <Typography variant="body2" sx={{ color: isDark ? '#94a3b8' : '#64748b', mb: 3 }}>
              {language === 'am'
                ? `ክፍያዎ በንብረት ባለቤቱ/ደላላው ተገምግሞ ሲጸድቅ ይፋዊ የሽያጭ ደረሰኝ በዳሽቦርድዎ ላይ ይገኛል።`
                : `Your payment has been logged under review. Once verified, the official sales receipt will be issued.`}
            </Typography>

            <Paper sx={{ p: 2, bgcolor: isDark ? '#0a192f' : '#f8fafc', borderRadius: 2, textAlign: 'left', mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>Reference:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, fontFamily: 'monospace', color: isDark ? '#f1f5f9' : '#0f172a' }}>
                  {completedTx.reference}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>Amount:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 800, color: '#10b981' }}>
                  ETB {milestone.amount.toLocaleString()}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>Status:</Typography>
                <Chip size="small" label="UNDER REVIEW" color="warning" sx={{ fontWeight: 700, height: 22 }} />
              </Box>
            </Paper>

            <Button
              variant="contained"
              onClick={onClose}
              sx={{ bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' }, borderRadius: 2, px: 4, fontWeight: 700 }}
            >
              {language === 'am' ? 'እሺ፣ ጨርስ' : 'Done / View Progress'}
            </Button>
          </Box>
        ) : (
          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {/* Property and Milestone Summary */}
            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: 2.5,
                bgcolor: isDark ? '#0a192f' : '#f8fafc',
                border: `1px solid ${isDark ? '#233554' : '#e2e8f0'}`
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                <Box>
                  <Typography variant="caption" sx={{ color: '#10b981', fontWeight: 700, textTransform: 'uppercase' }}>
                    {language === 'am' ? 'የንብረት ግዢ ክፍያ' : 'Property Purchase'}
                  </Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: isDark ? '#f1f5f9' : '#0f172a' }}>
                    {houseTitle}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>
                    {language === 'am' ? 'የክፍያው መጠን' : 'Amount Due'}
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#10b981' }}>
                    ETB {milestone.amount.toLocaleString()}
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ my: 1.5, borderColor: isDark ? '#233554' : '#e2e8f0' }} />

              <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                <Typography variant="body2" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>
                  {language === 'am' ? 'ምዕራፍ፡' : 'Milestone:'} <strong>{milestone.title}</strong>
                </Typography>
                <Typography variant="body2" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>
                  {language === 'am' ? 'ድርሻ፡' : 'Share:'} <strong>{milestone.percentage}%</strong>
                </Typography>
              </Box>
            </Paper>

            {/* Escrow Accounts */}
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: isDark ? '#f1f5f9' : '#0f172a' }}>
                {language === 'am' ? 'ክፍያውን ወደዚህ አካውንት ያስገቡ (የተረጋገጠ አካውንት)፡' : 'Transfer Payment to Official Property Account:'}
              </Typography>

              {loadingAccounts ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                  <CircularProgress size={24} />
                </Box>
              ) : bankAccounts.length > 0 ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {bankAccounts.map((acc, idx) => {
                    const isSelected = selectedAccount?._id === acc._id;
                    const isTele = acc.bankCode?.toLowerCase().includes('tele');
                    return (
                      <Paper
                        key={acc._id || idx}
                        onClick={() => {
                          setSelectedAccount(acc);
                          setMethod(isTele ? 'telebirr' : 'cbe');
                        }}
                        elevation={0}
                        sx={{
                          p: 1.5,
                          borderRadius: 2,
                          cursor: 'pointer',
                          bgcolor: isSelected
                            ? (isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.08)')
                            : (isDark ? '#0a192f' : '#f8fafc'),
                          border: `2px solid ${isSelected ? '#10b981' : isDark ? '#233554' : '#e2e8f0'}`,
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          {isTele ? <PhoneAndroid sx={{ color: '#10b981' }} /> : <AccountBalance sx={{ color: '#38bdf8' }} />}
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: isDark ? '#f1f5f9' : '#0f172a' }}>
                              {acc.bankName}
                            </Typography>
                            <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>
                              {acc.accountHolderName}
                            </Typography>
                          </Box>
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 800, color: isDark ? '#38bdf8' : '#2563eb' }}>
                            {acc.accountNumber}
                          </Typography>
                          <Tooltip title={copied ? (language === 'am' ? 'ተቀድቷል!' : 'Copied!') : (language === 'am' ? 'ቅዳ' : 'Copy')}>
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopy(acc.accountNumber);
                              }}
                              sx={{ color: isDark ? '#38bdf8' : '#2563eb' }}
                            >
                              {copied ? <Check fontSize="small" sx={{ color: '#10b981' }} /> : <ContentCopy fontSize="small" />}
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Paper>
                    );
                  })}
                </Box>
              ) : null}
            </Box>

            {/* Payment Details Form */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                fullWidth
                label={language === 'am' ? 'የዝውውር ማረጋገጫ ቁጥር (Transaction ID / Reference)' : 'Payment Transaction ID / Reference Number'}
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                required
                placeholder={language === 'am' ? 'ምሳሌ፡ FT240987654 ወይም TT987654' : 'e.g., FT240987654 or TeleBirr code'}
                helperText={language === 'am' ? 'ክፍያውን በፈጸሙበት የባንክ/ቴሌብር የደረሰኝ መልእክት ላይ ይገኛል' : 'Found on your mobile banking or TeleBirr transfer receipt'}
                sx={textFieldStyle}
              />

              <TextField
                fullWidth
                label={language === 'am' ? 'የከፋዩ ስልክ ቁጥር / አካውንት' : 'Sender Phone / Account Number'}
                value={senderPhone}
                onChange={(e) => setSenderPhone(e.target.value)}
                placeholder="0911223344"
                sx={textFieldStyle}
              />

              <TextField
                fullWidth
                multiline
                rows={2}
                label={language === 'am' ? 'ተጨማሪ ማስታወሻ (አስፈላጊ ከሆነ)' : 'Notes / Payment Memo (Optional)'}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={language === 'am' ? 'ማስታወሻ...' : 'Any details for the seller or agent...'}
                sx={textFieldStyle}
              />
            </Box>

            <Alert severity="info" icon={<Shield />} sx={{ borderRadius: 2 }}>
              {language === 'am'
                ? 'ክፍያዎ በቀጥታ በሲስተሙ የተረጋገጠ የሽያጭ ደረሰኝ ያገኛል፤ የንብረት ባለቤትነቱ በይፋ እስኪተላለፍ ድረስ በህጋዊ ውል የተጠበቀ ነው።'
                : 'All property purchase installments generate certified receipts and are archived in the legal transaction ledger.'}
            </Alert>

            <DialogActions sx={{ p: 0, pt: 1, display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
              <Button onClick={onClose} disabled={submitting} sx={{ color: isDark ? '#94a3b8' : '#64748b', textTransform: 'none' }}>
                {t('action.cancel', 'Cancel')}
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={submitting || !transactionId.trim()}
                startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : <PaymentIcon />}
                sx={{
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  color: '#ffffff',
                  fontWeight: 700,
                  borderRadius: 2,
                  px: 3,
                  py: 1,
                  textTransform: 'none',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #059669, #047857)'
                  }
                }}
              >
                {submitting
                  ? (language === 'am' ? 'በማስገባት ላይ...' : 'Submitting Payment...')
                  : (language === 'am' ? 'ክፍያውን አስገባና አረጋግጥ' : 'Submit Milestone Payment')}
              </Button>
            </DialogActions>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}
