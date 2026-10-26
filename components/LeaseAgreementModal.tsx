'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Divider,
  IconButton,
  Alert,
  CircularProgress,
  TextField,
  Tooltip
} from '@mui/material';
import {
  Article,
  Close,
  Print,
  CheckCircle,
  HourglassEmpty,
  Warning,
  Security,
  Draw,
  Payment as PaymentIcon,
  ContentCopy,
  Check,
  AccountBalance,
  PhoneAndroid
} from '@mui/icons-material';
import { useTheme } from '@/lib/theme-context';
import { useLanguage } from '@/lib/language-context';
import { LeaseAgreement } from '@/types/houses';
import api from '@/app/utils/api';

interface LeaseAgreementModalProps {
  open: boolean;
  onClose: () => void;
  lease: LeaseAgreement;
  isTenant?: boolean;
  onSuccess?: () => void;
}

export default function LeaseAgreementModal({
  open,
  onClose,
  lease,
  isTenant = false,
  onSuccess
}: LeaseAgreementModalProps) {
  const { theme } = useTheme();
  const { t, language } = useLanguage();
  const isDark = theme === 'dark';

  const [signing, setSigning] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState<any | null>(null);

  // Local schedule state so payments update immediately on screen
  const [schedule, setSchedule] = useState(lease.paymentSchedule || []);
  useEffect(() => {
    setSchedule(lease.paymentSchedule || []);
  }, [lease]);

  // Pay Dialog State
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [selectedInstallment, setSelectedInstallment] = useState<any | null>(null);
  const [agentAccounts, setAgentAccounts] = useState<any[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<any | null>(null);
  const [transactionId, setTransactionId] = useState('');
  const [senderPhone, setSenderPhone] = useState(lease.tenantPhone || '');
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [payError, setPayError] = useState('');
  const [paySuccess, setPaySuccess] = useState('');
  const [copied, setCopied] = useState(false);

  const handleSign = async () => {
    try {
      setSigning(true);
      setError('');
      await api.patch(`/workflows/leases/${lease._id}/sign`, {});
      setSuccess(language === 'am' ? 'የኪራይ ውሉ በዲጂታል ተፈርሞ በይፋ ስራ ላይ ውሏል!' : 'Lease Agreement digitally signed and officially activated!');
      setTimeout(() => {
        onSuccess?.();
        onClose();
        setSuccess('');
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || (language === 'am' ? 'ውሉን መፈረም አልተቻለም።' : 'Failed to sign lease agreement.'));
    } finally {
      setSigning(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Open Pay Modal and fetch matching accountant accounts
  const handleOpenPay = async (installment: any) => {
    setSelectedInstallment(installment);
    setPayModalOpen(true);
    setPayError('');
    setPaySuccess('');
    setTransactionId('');
    setSenderPhone(lease.tenantPhone || '');
    setCopied(false);
    setLoadingAccounts(true);

    try {
      const houseObj: any = typeof lease.houseId === 'object' ? lease.houseId : null;
      const agentId = houseObj?.agentId?._id || houseObj?.agentId || lease.agentId;

      let fetchedAccounts: any[] = [];

      // 1. Try fetching accounts for this lease (resolves house agentId)
      try {
        const res = await api.get(`/accountants/for-lease/${lease._id}`);
        if (res.data?.success && Array.isArray(res.data?.data) && res.data.data.length > 0) {
          fetchedAccounts = res.data.data;
        }
      } catch (err) {
        console.log('Falling back to agentId lookup:', err);
      }

      // 2. Fallback to direct agentId matching
      if (fetchedAccounts.length === 0 && agentId) {
        try {
          const resAgent = await api.get(`/accountants/agent/${agentId}`);
          if (resAgent.data?.success && Array.isArray(resAgent.data?.data)) {
            fetchedAccounts = resAgent.data.data;
          }
        } catch (err2) {
          console.log('Error fetching agent accounts:', err2);
        }
      }

      setAgentAccounts(fetchedAccounts);
      if (fetchedAccounts.length > 0) {
        setSelectedAccount(fetchedAccounts[0]);
      } else {
        setSelectedAccount(null);
      }
    } catch (err: any) {
      setPayError(err?.response?.data?.message || (language === 'am' ? 'የአካውንታንት ሂሳቦችን ማምጣት አልተቻለም' : 'Failed to load accountant accounts'));
    } finally {
      setLoadingAccounts(false);
    }
  };

  const handleCopyAccount = (accountNum: string) => {
    if (!accountNum) return;
    navigator.clipboard.writeText(accountNum);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInstallment) return;

    if (!transactionId.trim()) {
      setPayError(language === 'am' ? 'እባክዎ የትራንዛክሽን መለያ ቁጥር (Transaction ID) ያስገቡ' : 'Please provide the Transaction ID');
      return;
    }

    try {
      setSubmittingPayment(true);
      setPayError('');

      await api.post(`/workflows/leases/${lease._id}/submit-payment`, {
        installmentNumber: selectedInstallment.installmentNumber,
        transactionId: transactionId.trim(),
        method: selectedAccount?.bankCode?.toLowerCase() || 'cbe',
        bankName: selectedAccount?.bankName || 'Bank',
        accountNumber: selectedAccount?.accountNumber || '',
        accountHolderName: selectedAccount?.accountHolderName || '',
        senderPhone: senderPhone.trim()
      });

      setPaySuccess(
        language === 'am'
          ? 'ክፍያዎ በተሳካ ሁኔታ ተልኳል! ሁኔታው "በግምገማ ላይ" ሆኗል፤ አከራዩ/ወኪሉ ካረጋገጠ በኋላ ይፋዊ ደረሰኝ ይሰጥዎታል።'
          : 'Payment submitted successfully! Status changed to Under Review. Once approved by the owner/agent, your official receipt will be issued.'
      );

      // Update local schedule state
      setSchedule(prev => prev.map(item =>
        item.installmentNumber === selectedInstallment.installmentNumber
          ? { ...item, status: 'UNDER_REVIEW', transactionReference: transactionId.trim() }
          : item
      ));

      onSuccess?.();

      setTimeout(() => {
        setPayModalOpen(false);
        setPaySuccess('');
        setSelectedInstallment(null);
      }, 2000);
    } catch (err: any) {
      setPayError(err?.response?.data?.message || (language === 'am' ? 'ክፍያውን ማስገባት አልተቻለም' : 'Failed to submit payment'));
    } finally {
      setSubmittingPayment(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          bgcolor: isDark ? '#112240' : '#ffffff',
          border: `1px solid ${isDark ? '#233554' : '#e2e8f0'}`,
          color: isDark ? '#f1f5f9' : '#0f172a',
          backgroundImage: 'none'
        }
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1, borderBottom: `1px solid ${isDark ? '#233554' : '#e2e8f0'}` }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Article sx={{ color: isDark ? '#38bdf8' : '#2563eb', fontSize: 28 }} />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: isDark ? '#f1f5f9' : '#0f172a' }}>
              {t('lease.title', 'Digital Residential Lease Agreement')}
            </Typography>
            <Typography variant="body2" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>
              {language === 'am' ? 'የውል ቁጥር' : 'Agreement Ref'} #{lease.agreementNumber} • {t('common.status', 'Status')}: {lease.status}
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} size="small" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ py: 3, borderColor: isDark ? '#233554' : '#e2e8f0' }}>
        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>{success}</Alert>}

        {/* Printable Document Box */}
        <Box id="printable-lease" sx={{ p: { xs: 1, sm: 2 } }}>
          {/* Header Badge */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: isDark ? '#38bdf8' : '#2563eb' }}>
                {language === 'am' ? 'የኪራይ ውል ስምምነት' : 'HRMS TENANCY CONTRACT'}
              </Typography>
              <Typography variant="body2" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>
                {language === 'am' ? 'መደበኛ የቤት ኪራይ ውል' : 'Standard Form Real Estate Lease Agreement'}
              </Typography>
            </Box>
            <Chip
              label={lease.status}
              color={lease.status === 'ACTIVE' ? 'success' : lease.status === 'PENDING_SIGNATURE' ? 'warning' : 'default'}
              sx={{ fontWeight: 700 }}
            />
          </Box>

          <Divider sx={{ mb: 3, borderColor: isDark ? '#233554' : '#e2e8f0' }} />

          {/* Parties Overview */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 3 }}>
            <Paper elevation={0} sx={{ p: 2, bgcolor: isDark ? '#0a192f' : '#f8fafc', border: `1px solid ${isDark ? '#233554' : '#e2e8f0'}`, borderRadius: 2 }}>
              <Typography variant="caption" sx={{ color: isDark ? '#38bdf8' : '#2563eb', fontWeight: 700, textTransform: 'uppercase' }}>
                {language === 'am' ? 'አከራይ / የንብረት ባለቤት' : 'Landlord / Property Owner'}
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 700, mt: 0.5, color: isDark ? '#f1f5f9' : '#0f172a' }}>
                {lease.landlordId?.name || (language === 'am' ? 'የንብረት ባለቤት' : 'Property Owner')}
              </Typography>
              <Typography variant="body2" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>
                Email: {lease.landlordId?.email || 'N/A'}
              </Typography>
              <Typography variant="body2" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>
                Phone: {lease.landlordId?.phone || 'N/A'}
              </Typography>
            </Paper>

            <Paper elevation={0} sx={{ p: 2, bgcolor: isDark ? '#0a192f' : '#f8fafc', border: `1px solid ${isDark ? '#233554' : '#e2e8f0'}`, borderRadius: 2 }}>
              <Typography variant="caption" sx={{ color: isDark ? '#38bdf8' : '#2563eb', fontWeight: 700, textTransform: 'uppercase' }}>
                {language === 'am' ? 'ተከራይ' : 'Tenant / Resident'}
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 700, mt: 0.5, color: isDark ? '#f1f5f9' : '#0f172a' }}>
                {lease.tenantName}
              </Typography>
              <Typography variant="body2" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>
                Email: {lease.tenantEmail}
              </Typography>
              <Typography variant="body2" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>
                Phone: {lease.tenantPhone}
              </Typography>
            </Paper>
          </Box>

          {/* Lease Terms Summary */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' }, gap: 2, mb: 3 }}>
            <Box>
              <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>
                {t('lease.monthly_rent', 'Monthly Rent')}
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 800, color: isDark ? '#38bdf8' : '#2563eb' }}>
                ETB {lease.rentAmount.toLocaleString()}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>
                {t('lease.security_deposit', 'Security Deposit')}
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 700, color: isDark ? '#f1f5f9' : '#0f172a' }}>
                ETB {lease.securityDeposit.toLocaleString()}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>
                {t('lease.start_date', 'Lease Commencement')}
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 600, color: isDark ? '#f1f5f9' : '#0f172a' }}>
                {new Date(lease.startDate).toLocaleDateString(language === 'am' ? 'am-ET' : 'en-US')}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>
                {t('lease.end_date', 'Lease Expiration')}
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 600, color: isDark ? '#f1f5f9' : '#0f172a' }}>
                {new Date(lease.endDate).toLocaleDateString(language === 'am' ? 'am-ET' : 'en-US')}
              </Typography>
            </Box>
          </Box>

          {/* Terms & Conditions */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: isDark ? '#f1f5f9' : '#0f172a' }}>
              {t('lease.terms', 'Tenancy Terms & Conditions')}
            </Typography>
            <Typography variant="body2" sx={{ color: isDark ? '#94a3b8' : '#64748b', lineHeight: 1.6, bgcolor: isDark ? '#0a192f' : '#f8fafc', border: `1px solid ${isDark ? '#233554' : '#e2e8f0'}`, p: 2, borderRadius: 2 }}>
              {lease.terms}
            </Typography>
          </Box>

          {/* Payment Schedule & Receipts */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: isDark ? '#f1f5f9' : '#0f172a' }}>
              {language === 'am' ? 'የክፍያ የጊዜ ሰሌዳ እና ደረሰኞች' : 'Rent Payment Schedule & Transaction Receipts'}
            </Typography>

            <TableContainer component={Paper} elevation={0} sx={{ border: `1px solid ${isDark ? '#233554' : '#e2e8f0'}`, bgcolor: isDark ? '#0a192f' : '#ffffff', borderRadius: 2, overflowX: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: isDark ? '#1e293b' : '#f1f5f9' }}>
                    <TableCell sx={{ fontWeight: 700, color: isDark ? '#f1f5f9' : '#0f172a' }}>{language === 'am' ? 'የክፍያ ደረጃ' : 'Installment'}</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: isDark ? '#f1f5f9' : '#0f172a' }}>{language === 'am' ? 'የሚከፈልበት ቀን' : 'Due Date'}</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: isDark ? '#f1f5f9' : '#0f172a' }}>{language === 'am' ? 'መጠን (ETB)' : 'Amount (ETB)'}</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: isDark ? '#f1f5f9' : '#0f172a' }}>{t('common.status', 'Payment Status')}</TableCell>
                    <TableCell sx={{ fontWeight: 700, textAlign: 'right', color: isDark ? '#f1f5f9' : '#0f172a' }}>{language === 'am' ? 'ይፋዊ ደረሰኝ' : 'Official Receipt'}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {schedule.map((p, idx) => (
                    <TableRow key={idx} sx={{ borderBottom: `1px solid ${isDark ? '#233554' : '#e2e8f0'}` }}>
                      <TableCell sx={{ color: isDark ? '#f1f5f9' : '#0f172a' }}>
                        {language === 'am' ? `ክፍያ #${p.installmentNumber}` : `Installment #${p.installmentNumber}`}
                      </TableCell>
                      <TableCell sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>
                        {new Date(p.dueDate).toLocaleDateString(language === 'am' ? 'am-ET' : 'en-US')}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, color: isDark ? '#f1f5f9' : '#0f172a' }}>
                        ETB {p.amount.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={p.status === 'UNDER_REVIEW' ? (language === 'am' ? 'በግምገማ ላይ' : 'UNDER REVIEW') : p.status}
                          color={p.status === 'PAID' ? 'success' : p.status === 'UNDER_REVIEW' ? 'info' : p.status === 'OVERDUE' ? 'error' : 'warning'}
                          sx={{ fontWeight: 600, fontSize: 11 }}
                        />
                      </TableCell>
                      <TableCell sx={{ textAlign: 'right' }}>
                        {p.status === 'PAID' && (
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => setSelectedReceipt(p)}
                            sx={{
                              textTransform: 'none',
                              py: 0.2,
                              fontSize: 12,
                              borderRadius: '6px',
                              borderColor: isDark ? '#233554' : '#cbd5e1',
                              color: isDark ? '#38bdf8' : '#2563eb'
                            }}
                          >
                            {language === 'am' ? 'ደረሰኝ' : 'Receipt'} #{p.receiptNumber || 'RCP-101'}
                          </Button>
                        )}
                        {p.status === 'UNDER_REVIEW' && (
                          <Chip
                            size="small"
                            icon={<HourglassEmpty sx={{ fontSize: '13px !important' }} />}
                            label={language === 'am' ? 'በግምገማ ላይ' : 'Under Review'}
                            color="info"
                            variant="outlined"
                            sx={{ fontWeight: 600, fontSize: 11 }}
                          />
                        )}
                        {(p.status === 'PENDING' || p.status === 'OVERDUE') && (
                          <Button
                            size="small"
                            variant="contained"
                            color="primary"
                            startIcon={<PaymentIcon sx={{ fontSize: 14 }} />}
                            onClick={() => handleOpenPay(p)}
                            sx={{
                              textTransform: 'none',
                              py: 0.3,
                              px: 1.5,
                              fontSize: 12,
                              fontWeight: 700,
                              borderRadius: '6px',
                              boxShadow: 'none',
                              bgcolor: isDark ? '#0284c7' : '#2563eb',
                              '&:hover': {
                                bgcolor: isDark ? '#0369a1' : '#1d4ed8'
                              }
                            }}
                          >
                            {language === 'am' ? 'ክፈል' : 'Pay'}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>

          {/* Digital Signatures Box */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 3, pt: 2, borderTop: `1px dashed ${isDark ? '#233554' : '#cbd5e1'}` }}>
            <Box>
              <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>
                {language === 'am' ? 'የአከራይ ፊርማ' : 'Landlord Signature'}
              </Typography>
              <Typography variant="body2" sx={{ color: lease.signedByLandlord ? '#10b981' : isDark ? '#64748b' : '#94a3b8', fontWeight: 700, mt: 0.5, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {lease.signedByLandlord ? <CheckCircle fontSize="small" /> : <HourglassEmpty fontSize="small" />}
                {lease.signedByLandlord ? (language === 'am' ? 'በዲጂታል ተፈርሟል' : 'Digitally Signed & Certified') : (language === 'am' ? 'የአከራይ ፊርማ ይጠበቃል' : 'Awaiting Landlord Signature')}
              </Typography>
            </Box>

            <Box>
              <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>
                {language === 'am' ? 'የተከራይ ፊርማ' : 'Tenant Signature'}
              </Typography>
              <Typography variant="body2" sx={{ color: lease.signedByTenant ? '#10b981' : '#f59e0b', fontWeight: 700, mt: 0.5, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {lease.signedByTenant ? <CheckCircle fontSize="small" /> : <Warning fontSize="small" />}
                {lease.signedByTenant ? `${language === 'am' ? 'የተፈረመበት ቀን' : 'Signed on'} ${new Date(lease.tenantSignedAt || Date.now()).toLocaleDateString(language === 'am' ? 'am-ET' : 'en-US')}` : (language === 'am' ? 'የተከራይ ፊርማ ይጠበቃል' : 'Awaiting Tenant Signature')}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Receipt Modal Popup */}
        {selectedReceipt && (
          <Dialog
            open={!!selectedReceipt}
            onClose={() => setSelectedReceipt(null)}
            maxWidth="xs"
            fullWidth
            PaperProps={{
              sx: {
                borderRadius: 3,
                bgcolor: isDark ? '#112240' : '#ffffff',
                border: `1px solid ${isDark ? '#233554' : '#e2e8f0'}`,
                color: isDark ? '#f1f5f9' : '#0f172a'
              }
            }}
          >
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${isDark ? '#233554' : '#e2e8f0'}` }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: isDark ? '#f1f5f9' : '#0f172a' }}>
                {language === 'am' ? 'ይፋዊ የኪራይ ደረሰኝ' : 'Official Rent Receipt'}
              </Typography>
              <IconButton size="small" onClick={() => setSelectedReceipt(null)} sx={{ color: isDark ? '#94a3b8' : '#64748b' }}><Close /></IconButton>
            </DialogTitle>
            <DialogContent sx={{ p: 3 }}>
              <Box sx={{ textAlign: 'center', mb: 2 }}>
                <CheckCircle sx={{ color: '#10b981', fontSize: 44, mb: 1 }} />
                <Typography variant="h6" sx={{ fontWeight: 800, color: isDark ? '#f1f5f9' : '#0f172a' }}>
                  {language === 'am' ? 'ክፍያው ተረጋግጧል' : 'PAYMENT CONFIRMED'}
                </Typography>
                <Typography variant="body2" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>
                  {language === 'am' ? 'የደረሰኝ ቁጥር' : 'Receipt Ref'}: {selectedReceipt.receiptNumber || 'RCP-8921'}
                </Typography>
              </Box>
              <Divider sx={{ my: 2, borderColor: isDark ? '#233554' : '#e2e8f0' }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                <Typography variant="body2" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>
                  {language === 'am' ? 'የተከፈለበት ውል፡' : 'Paid For:'}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: isDark ? '#f1f5f9' : '#0f172a' }}>
                  Lease #{lease.agreementNumber}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                <Typography variant="body2" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>
                  {language === 'am' ? 'ተከራይ፡' : 'Tenant:'}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: isDark ? '#f1f5f9' : '#0f172a' }}>
                  {lease.tenantName}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                <Typography variant="body2" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>
                  {language === 'am' ? 'የተከፈለ መጠን፡' : 'Amount Paid:'}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 800, color: '#10b981' }}>
                  ETB {selectedReceipt.amount?.toLocaleString()}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                <Typography variant="body2" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>
                  {language === 'am' ? 'የተከፈለበት ቀን፡' : 'Date Paid:'}
                </Typography>
                <Typography variant="body2" sx={{ color: isDark ? '#f1f5f9' : '#0f172a' }}>
                  {new Date(selectedReceipt.paidDate || Date.now()).toLocaleDateString(language === 'am' ? 'am-ET' : 'en-US')}
                </Typography>
              </Box>
            </DialogContent>
            <DialogActions sx={{ p: 2, borderTop: `1px solid ${isDark ? '#233554' : '#e2e8f0'}` }}>
              <Button
                onClick={() => window.print()}
                startIcon={<Print />}
                variant="contained"
                fullWidth
                sx={{
                  bgcolor: isDark ? '#38bdf8' : '#2563eb',
                  borderRadius: '10px',
                  textTransform: 'none',
                  fontWeight: 600
                }}
              >
                {language === 'am' ? 'ደረሰኙን አትም / አስቀምጥ' : 'Print / Save Receipt'}
              </Button>
            </DialogActions>
          </Dialog>
        )}

        {/* ─── Tenant Rent Payment Dialog ─── */}
        {payModalOpen && selectedInstallment && (
          <Dialog
            open={payModalOpen}
            onClose={() => !submittingPayment && setPayModalOpen(false)}
            maxWidth="sm"
            fullWidth
            PaperProps={{
              sx: {
                borderRadius: 3,
                bgcolor: isDark ? '#112240' : '#ffffff',
                border: `1px solid ${isDark ? '#233554' : '#e2e8f0'}`,
                color: isDark ? '#f1f5f9' : '#0f172a',
                p: { xs: 1, sm: 2 }
              }
            }}
          >
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PaymentIcon sx={{ color: isDark ? '#38bdf8' : '#2563eb', fontSize: 28 }} />
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: isDark ? '#f1f5f9' : '#0f172a', lineHeight: 1.2 }}>
                    {language === 'am' ? 'የኪራይ ክፍያ መክፈያ' : 'Pay Rent Installment'}
                  </Typography>
                  <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>
                    {language === 'am'
                      ? `ክፍያ #${selectedInstallment.installmentNumber} • ውል #${lease.agreementNumber}`
                      : `Installment #${selectedInstallment.installmentNumber} • Lease #${lease.agreementNumber}`}
                  </Typography>
                </Box>
              </Box>
              <IconButton size="small" onClick={() => setPayModalOpen(false)} disabled={submittingPayment} sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>
                <Close />
              </IconButton>
            </DialogTitle>

            <DialogContent sx={{ pt: 2 }}>
              {payError && (
                <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setPayError('')}>
                  {payError}
                </Alert>
              )}

              {paySuccess && (
                <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>
                  {paySuccess}
                </Alert>
              )}

              {/* Installment Summary Banner */}
              <Box
                sx={{
                  p: 2,
                  mb: 3,
                  borderRadius: 2.5,
                  bgcolor: isDark ? '#0a192f' : '#f8fafc',
                  border: `1px solid ${isDark ? '#233554' : '#e2e8f0'}`,
                  display: 'flex',
                  flexDirection: { xs: 'column', sm: 'row' },
                  justifyContent: 'space-between',
                  alignItems: { xs: 'flex-start', sm: 'center' },
                  gap: 1.5
                }}
              >
                <Box>
                  <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: 0.5 }}>
                    {language === 'am' ? 'የሚከፈል መጠን' : 'Amount Due'}
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: isDark ? '#38bdf8' : '#2563eb' }}>
                    ETB {selectedInstallment.amount.toLocaleString()}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: { sm: 'right' } }}>
                  <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>
                    {language === 'am' ? 'የሚከፈልበት ቀን' : 'Due Date'}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: isDark ? '#f1f5f9' : '#0f172a' }}>
                    {new Date(selectedInstallment.dueDate).toLocaleDateString(language === 'am' ? 'am-ET' : 'en-US')}
                  </Typography>
                </Box>
              </Box>

              {/* Loading state for accountant accounts */}
              {loadingAccounts ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4, gap: 1.5 }}>
                  <CircularProgress size={32} sx={{ color: isDark ? '#38bdf8' : '#2563eb' }} />
                  <Typography variant="body2" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>
                    {language === 'am' ? 'የአካውንታንት የክፍያ ሂሳቦችን በማምጣት ላይ...' : 'Fetching property agent payment accounts...'}
                  </Typography>
                </Box>
              ) : agentAccounts.length === 0 ? (
                <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
                  {language === 'am'
                    ? 'ለዚህ ንብረት ወኪል የተመዘገበ የባንክ/ዋሌት ሂሳብ አልተገኘም። እባክዎ አከራዩን/ወኪሉን ያነጋግሩ።'
                    : 'No active bank/wallet account found for this property agent. Please contact your property manager/agent.'}
                </Alert>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                  {/* Bank / Wallet Selection */}
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: isDark ? '#f1f5f9' : '#0f172a' }}>
                      {language === 'am' ? 'የክፍያ ባንክ / ዋሌት ይምረጡ' : 'Select Destination Bank / Wallet'}
                    </Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 1.5 }}>
                      {agentAccounts.map((acc, index) => {
                        const isSelected = selectedAccount?._id === acc._id;
                        return (
                          <Box
                            key={acc._id || index}
                            onClick={() => setSelectedAccount(acc)}
                            sx={{
                              p: 1.5,
                              borderRadius: 2,
                              cursor: 'pointer',
                              border: `2px solid ${isSelected ? (isDark ? '#38bdf8' : '#2563eb') : isDark ? '#233554' : '#e2e8f0'}`,
                              bgcolor: isSelected ? (isDark ? 'rgba(56, 189, 248, 0.12)' : 'rgba(37, 99, 235, 0.05)') : isDark ? '#0a192f' : '#ffffff',
                              transition: 'all 0.2s ease',
                              '&:hover': {
                                borderColor: isDark ? '#38bdf8' : '#2563eb',
                                transform: 'translateY(-1px)'
                              }
                            }}
                          >
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                              <Typography variant="body2" sx={{ fontWeight: 700, color: isDark ? '#f1f5f9' : '#0f172a' }}>
                                {acc.bankName}
                              </Typography>
                              <Chip
                                size="small"
                                label={acc.type === 'wallet' ? 'Wallet' : 'Bank'}
                                sx={{
                                  fontSize: 10,
                                  height: 20,
                                  fontWeight: 700,
                                  bgcolor: acc.type === 'wallet' ? '#f59e0b20' : '#10b98120',
                                  color: acc.type === 'wallet' ? '#f59e0b' : '#10b981'
                                }}
                              />
                            </Box>
                            <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>
                              {acc.bankCode}
                            </Typography>
                          </Box>
                        );
                      })}
                    </Box>
                  </Box>

                  {/* Selected Account Details with Copy Button */}
                  {selectedAccount && (
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: 2.5,
                        bgcolor: isDark ? '#1e293b' : '#f0f9ff',
                        border: `1px solid ${isDark ? '#334155' : '#bae6fd'}`
                      }}
                    >
                      <Typography variant="caption" sx={{ color: isDark ? '#38bdf8' : '#0284c7', fontWeight: 700, textTransform: 'uppercase' }}>
                        {language === 'am' ? 'የተመረጠው የባንክ ሂሳብ ዝርዝር' : 'Selected Deposit Account Details'}
                      </Typography>
                      <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 0.8 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>
                            {language === 'am' ? 'ባንክ / ተቋም፡' : 'Bank / Institution:'}
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: isDark ? '#f1f5f9' : '#0f172a' }}>
                            {selectedAccount.bankName} ({selectedAccount.bankCode})
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>
                            {language === 'am' ? 'የሂሳብ ባለቤት ስም፡' : 'Account Holder Name:'}
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: isDark ? '#f1f5f9' : '#0f172a' }}>
                            {selectedAccount.accountHolderName}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 0.5, borderTop: `1px dashed ${isDark ? '#334155' : '#cbd5e1'}` }}>
                          <Box>
                            <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>
                              {language === 'am' ? 'የሂሳብ ቁጥር፡' : 'Account / Phone Number:'}
                            </Typography>
                            <Typography variant="h6" sx={{ fontWeight: 800, color: isDark ? '#38bdf8' : '#2563eb', letterSpacing: 1 }}>
                              {selectedAccount.accountNumber}
                            </Typography>
                          </Box>
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={copied ? <Check fontSize="small" /> : <ContentCopy fontSize="small" />}
                            onClick={() => handleCopyAccount(selectedAccount.accountNumber)}
                            sx={{
                              textTransform: 'none',
                              borderRadius: 2,
                              borderColor: copied ? '#10b981' : isDark ? '#38bdf8' : '#2563eb',
                              color: copied ? '#10b981' : isDark ? '#38bdf8' : '#2563eb',
                              fontSize: 12,
                              py: 0.5
                            }}
                          >
                            {copied ? (language === 'am' ? 'ተቀድቷል!' : 'Copied!') : (language === 'am' ? 'ቅዳ' : 'Copy')}
                          </Button>
                        </Box>
                      </Box>
                      <Typography variant="caption" sx={{ display: 'block', mt: 1.5, color: isDark ? '#94a3b8' : '#64748b', fontStyle: 'italic' }}>
                        {language === 'am'
                          ? `* እባክዎ በትክክል ETB ${selectedInstallment.amount.toLocaleString()} ወደዚህ የባንክ ሂሳብ ያስተላልፉ። ከዚያም የተሰጠዎትን የትራንዛክሽን መለያ ቁጥር (Transaction ID) ከታች ያስገቡ።`
                          : `* Please transfer exactly ETB ${selectedInstallment.amount.toLocaleString()} to this account, then enter your Transaction Reference ID below.`}
                      </Typography>
                    </Box>
                  )}

                  {/* Form Inputs */}
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField
                      required
                      fullWidth
                      size="small"
                      label={language === 'am' ? 'የትራንዛክሽን መለያ ቁጥር (Transaction ID) *' : 'Transaction Reference ID *'}
                      placeholder="e.g. FT260819ABCD or TXN-984321..."
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value)}
                      helperText={language === 'am' ? 'ከባንክ ወይም ከቴሌብር ደረሰኝ ላይ የተገኘውን መለያ ቁጥር ያስገቡ' : 'Transaction reference generated by your bank / mobile banking app'}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          bgcolor: isDark ? '#0a192f' : '#ffffff',
                          color: isDark ? '#f1f5f9' : '#0f172a',
                          borderRadius: 2
                        }
                      }}
                    />

                    <TextField
                      fullWidth
                      size="small"
                      label={language === 'am' ? 'የከፋዩ ስልክ ቁጥር' : 'Sender Phone Number'}
                      placeholder="0911223344"
                      value={senderPhone}
                      onChange={(e) => setSenderPhone(e.target.value)}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          bgcolor: isDark ? '#0a192f' : '#ffffff',
                          color: isDark ? '#f1f5f9' : '#0f172a',
                          borderRadius: 2
                        }
                      }}
                    />
                  </Box>
                </Box>
              )}
            </DialogContent>

            <DialogActions sx={{ p: 2.5, borderTop: `1px solid ${isDark ? '#233554' : '#e2e8f0'}` }}>
              <Button
                onClick={() => setPayModalOpen(false)}
                disabled={submittingPayment}
                sx={{ color: isDark ? '#94a3b8' : '#64748b', textTransform: 'none' }}
              >
                {t('action.cancel', 'Cancel')}
              </Button>
              <Button
                variant="contained"
                onClick={handleSubmitPayment}
                disabled={submittingPayment || loadingAccounts || agentAccounts.length === 0}
                startIcon={submittingPayment ? <CircularProgress size={18} color="inherit" /> : <PaymentIcon />}
                sx={{
                  bgcolor: isDark ? '#38bdf8' : '#2563eb',
                  borderRadius: 2,
                  px: 3,
                  fontWeight: 700,
                  textTransform: 'none',
                  '&:hover': {
                    bgcolor: isDark ? '#0284c7' : '#1d4ed8'
                  }
                }}
              >
                {submittingPayment
                  ? (language === 'am' ? 'በማስገባት ላይ...' : 'Submitting...')
                  : (language === 'am' ? 'ክፍያውን አረጋግጥና ላክ' : 'Submit Payment')}
              </Button>
            </DialogActions>
          </Dialog>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2.5, borderTop: `1px solid ${isDark ? '#233554' : '#e2e8f0'}`, display: 'flex', flexDirection: { xs: 'column-reverse', sm: 'row' }, justifyContent: 'space-between', gap: 1.5 }}>
        <Button
          onClick={handlePrint}
          startIcon={<Print />}
          variant="outlined"
          sx={{
            borderRadius: '10px',
            borderColor: isDark ? '#233554' : '#cbd5e1',
            color: isDark ? '#f1f5f9' : '#0f172a',
            textTransform: 'none',
            width: { xs: '100%', sm: 'auto' }
          }}
        >
          {language === 'am' ? 'አትም / ፒዲኤፍ አውርድ' : 'Print / PDF Export'}
        </Button>

        <Box sx={{ display: 'flex', gap: 1.5, width: { xs: '100%', sm: 'auto' } }}>
          <Button
            onClick={onClose}
            sx={{
              color: isDark ? '#94a3b8' : '#64748b',
              textTransform: 'none',
              flex: { xs: 1, sm: 'none' }
            }}
          >
            {t('action.close', 'Close')}
          </Button>

          {isTenant && !lease.signedByTenant && (
            <Button
              onClick={handleSign}
              variant="contained"
              disabled={signing}
              startIcon={signing ? <CircularProgress size={18} color="inherit" /> : <Draw />}
              sx={{
                bgcolor: '#10b981',
                '&:hover': { bgcolor: '#059669' },
                borderRadius: '10px',
                px: 3,
                fontWeight: 600,
                textTransform: 'none',
                flex: { xs: 1, sm: 'none' }
              }}
            >
              {t('lease.sign', 'Sign & Activate Agreement')}
            </Button>
          )}
        </Box>
      </DialogActions>
    </Dialog>
  );
}
