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
  const [signing, setSigning] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState<any | null>(null);

  const handleSign = async () => {
    try {
      setSigning(true);
      setError('');
      await api.patch(`/workflows/leases/${lease._id}/sign`, {});
      setSuccess('Lease Agreement digitally signed and officially activated!');
      setTimeout(() => {
        onSuccess?.();
        onClose();
        setSuccess('');
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to sign lease agreement.');
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
          bgcolor: 'background.paper',
          backgroundImage: 'none'
        }
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Article sx={{ color: '#06b6d4', fontSize: 28 }} />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Digital Residential Lease Agreement
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Agreement Ref #{lease.agreementNumber} • Status: {lease.status}
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ py: 3 }}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        {/* Printable Document Box */}
        <Box id="printable-lease" sx={{ p: { xs: 1, sm: 2 } }}>
          {/* Header Badge */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#06b6d4' }}>
                HRMS TENANCY CONTRACT
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Standard Form Real Estate Lease Agreement
              </Typography>
            </Box>
            <Chip
              label={lease.status}
              color={lease.status === 'ACTIVE' ? 'success' : lease.status === 'PENDING_SIGNATURE' ? 'warning' : 'default'}
              sx={{ fontWeight: 700 }}
            />
          </Box>

          <Divider sx={{ mb: 3 }} />

          {/* Parties Overview */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 3 }}>
            <Paper elevation={0} sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase' }}>
                Landlord / Property Owner
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 700, mt: 0.5 }}>
                {lease.landlordId?.name || 'Property Owner'}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Email: {lease.landlordId?.email || 'N/A'}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Phone: {lease.landlordId?.phone || 'N/A'}
              </Typography>
            </Paper>

            <Paper elevation={0} sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase' }}>
                Tenant / Resident
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 700, mt: 0.5 }}>
                {lease.tenantName}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Email: {lease.tenantEmail}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Phone: {lease.tenantPhone}
              </Typography>
            </Paper>
          </Box>

          {/* Lease Terms Summary */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' }, gap: 2, mb: 3 }}>
            <Box>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>Monthly Rent</Typography>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#06b6d4' }}>
                ETB {lease.rentAmount.toLocaleString()}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>Security Deposit</Typography>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                ETB {lease.securityDeposit.toLocaleString()}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>Lease Commencement</Typography>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {new Date(lease.startDate).toLocaleDateString()}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>Lease Expiration</Typography>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {new Date(lease.endDate).toLocaleDateString()}
              </Typography>
            </Box>
          </Box>

          {/* Terms & Conditions */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
              Tenancy Terms & Conditions
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.6, bgcolor: 'action.hover', p: 2, borderRadius: 2 }}>
              {lease.terms}
            </Typography>
          </Box>

          {/* Payment Schedule & Receipts */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
              Rent Payment Schedule & Transaction Receipts
            </Typography>

            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'action.hover' }}>
                    <TableCell sx={{ fontWeight: 700 }}>Installment</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Due Date</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Amount (ETB)</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Payment Status</TableCell>
                    <TableCell sx={{ fontWeight: 700, textAlign: 'right' }}>Official Receipt</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {lease.paymentSchedule.map((p, idx) => (
                    <TableRow key={idx}>
                      <TableCell>Installment #{p.installmentNumber}</TableCell>
                      <TableCell>{new Date(p.dueDate).toLocaleDateString()}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>ETB {p.amount.toLocaleString()}</TableCell>
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
                            sx={{ textTransform: 'none', py: 0.2, fontSize: 12 }}
                          >
                            Receipt #{p.receiptNumber || 'RCP-101'}
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
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 3, pt: 2, borderTop: '1px dashed', borderColor: 'divider' }}>
            <Box>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>Landlord Signature</Typography>
              <Typography variant="body2" sx={{ color: lease.signedByLandlord ? '#10b981' : 'text.disabled', fontWeight: 700, mt: 0.5, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {lease.signedByLandlord ? <CheckCircle fontSize="small" /> : <HourglassEmpty fontSize="small" />}
                {lease.signedByLandlord ? 'Digitally Signed & Certified' : 'Awaiting Landlord Signature'}
              </Typography>
            </Box>

            <Box>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>Tenant Signature</Typography>
              <Typography variant="body2" sx={{ color: lease.signedByTenant ? '#10b981' : 'warning.main', fontWeight: 700, mt: 0.5, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {lease.signedByTenant ? <CheckCircle fontSize="small" /> : <Warning fontSize="small" />}
                {lease.signedByTenant ? `Signed on ${new Date(lease.tenantSignedAt || Date.now()).toLocaleDateString()}` : 'Awaiting Tenant Signature'}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Receipt Modal Popup */}
        {selectedReceipt && (
          <Dialog open={!!selectedReceipt} onClose={() => setSelectedReceipt(null)} maxWidth="xs" fullWidth>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>Official Rent Receipt</Typography>
              <IconButton size="small" onClick={() => setSelectedReceipt(null)}><Close /></IconButton>
            </DialogTitle>
            <DialogContent dividers sx={{ p: 3 }}>
              <Box sx={{ textAlign: 'center', mb: 2 }}>
                <CheckCircle sx={{ color: '#10b981', fontSize: 44, mb: 1 }} />
                <Typography variant="h6" sx={{ fontWeight: 800 }}>PAYMENT CONFIRMED</Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>Receipt Ref: {selectedReceipt.receiptNumber || 'RCP-8921'}</Typography>
              </Box>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>Paid For:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>Lease #{lease.agreementNumber}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>Tenant:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{lease.tenantName}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>Amount Paid:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 800, color: '#10b981' }}>ETB {selectedReceipt.amount?.toLocaleString()}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>Date Paid:</Typography>
                <Typography variant="body2">{new Date(selectedReceipt.paidDate || Date.now()).toLocaleDateString()}</Typography>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => window.print()} startIcon={<Print />} variant="contained" fullWidth sx={{ borderRadius: 2 }}>
                Print / Save Receipt
              </Button>
            </DialogActions>
          </Dialog>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
        <Button onClick={handlePrint} startIcon={<Print />} variant="outlined" sx={{ borderRadius: 2 }}>
          Print / PDF Export
        </Button>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button onClick={onClose} sx={{ color: 'text.secondary' }}>
            Close
          </Button>

          {isTenant && !lease.signedByTenant && (
            <Button
              onClick={handleSign}
              variant="contained"
              disabled={signing}
              startIcon={signing ? <CircularProgress size={18} color="inherit" /> : <Draw />}
              sx={{
                bgcolor: '#06b6d4',
                '&:hover': { bgcolor: '#0891b2' },
                borderRadius: 2,
                px: 3
              }}
            >
              Sign & Activate Agreement
            </Button>
          )}
        </Box>
      </DialogActions>
    </Dialog>
  );
}
