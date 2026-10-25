'use client';

import { useState } from 'react';
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
  CircularProgress
} from '@mui/material';
import {
  Article,
  Close,
  Print,
  CheckCircle,
  HourglassEmpty,
  Warning,
  Security,
  Draw
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
                  {lease.paymentSchedule.map((p, idx) => (
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
                          label={p.status}
                          color={p.status === 'PAID' ? 'success' : p.status === 'OVERDUE' ? 'error' : 'warning'}
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
