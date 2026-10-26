'use client';

import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Divider,
  IconButton,
  Chip,
  Paper
} from '@mui/material';
import {
  Close,
  Print,
  CheckCircle,
  AccountBalance,
  Shield,
  Receipt
} from '@mui/icons-material';
import { useTheme } from '@/lib/theme-context';
import { useLanguage } from '@/lib/language-context';

interface PurchaseReceiptModalProps {
  open: boolean;
  onClose: () => void;
  offer: any;
  milestone: any;
}

export default function PurchaseReceiptModal({
  open,
  onClose,
  offer,
  milestone
}: PurchaseReceiptModalProps) {
  const { theme } = useTheme();
  const { language } = useLanguage();
  const isDark = theme === 'dark';

  if (!milestone) return null;

  const houseObj = (typeof offer.houseId === 'object' && offer.houseId) ? offer.houseId : null;
  const houseTitle = houseObj?.title || 'Residential Property';
  const houseAddress = houseObj?.location?.address ? `${houseObj.location.address}, ${houseObj.location.city || ''}` : 'Addis Ababa, Ethiopia';
  const receiptNum = milestone.receiptNumber || `RCP-BUY-${Date.now().toString().slice(-7)}`;
  const paidDateStr = milestone.paidAt ? new Date(milestone.paidAt).toLocaleDateString(language === 'am' ? 'am-ET' : 'en-US') : new Date().toLocaleDateString();

  return (
    <Dialog
      open={open}
      onClose={onClose}
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
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pb: 1,
          borderBottom: `1px solid ${isDark ? '#233554' : '#e2e8f0'}`
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Receipt sx={{ color: '#10b981' }} />
          <Typography variant="h6" sx={{ fontWeight: 800, color: isDark ? '#f1f5f9' : '#0f172a' }}>
            {language === 'am' ? 'ይፋዊ የንብረት ግዢ ደረሰኝ' : 'Official Sales Receipt'}
          </Typography>
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        <Box sx={{ textAlign: 'center', mb: 2 }}>
          <CheckCircle sx={{ color: '#10b981', fontSize: 52, mb: 1 }} />
          <Typography variant="h6" sx={{ fontWeight: 800, color: isDark ? '#f1f5f9' : '#0f172a' }}>
            {language === 'am' ? 'የግዢ ክፍያ ተረጋግጧል' : 'PURCHASE PAYMENT CONFIRMED'}
          </Typography>
          <Typography variant="body2" sx={{ color: isDark ? '#38bdf8' : '#2563eb', fontWeight: 700, fontFamily: 'monospace' }}>
            {language === 'am' ? 'የደረሰኝ ቁጥር' : 'Receipt No'}: {receiptNum}
          </Typography>
        </Box>

        <Paper elevation={0} sx={{ p: 2, bgcolor: isDark ? '#0a192f' : '#f8fafc', borderRadius: 2, mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
            <Typography variant="body2" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>
              {language === 'am' ? 'የተገዛው ንብረት፡' : 'Property:'}
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 700, color: isDark ? '#f1f5f9' : '#0f172a', textAlign: 'right', maxWidth: 200 }}>
              {houseTitle}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
            <Typography variant="body2" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>
              {language === 'am' ? 'ገዢ፡' : 'Buyer:'}
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600, color: isDark ? '#f1f5f9' : '#0f172a' }}>
              {offer.buyerName}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
            <Typography variant="body2" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>
              {language === 'am' ? 'የክፍያ ምዕራፍ፡' : 'Milestone:'}
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600, color: isDark ? '#f1f5f9' : '#0f172a' }}>
              {milestone.title} ({milestone.percentage}%)
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
            <Typography variant="body2" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>
              {language === 'am' ? 'የዝውውር መለያ፡' : 'Txn Reference:'}
            </Typography>
            <Typography variant="body2" sx={{ fontFamily: 'monospace', color: isDark ? '#f1f5f9' : '#0f172a' }}>
              {milestone.transactionReference || 'N/A'}
            </Typography>
          </Box>
          <Divider sx={{ my: 1, borderColor: isDark ? '#233554' : '#e2e8f0' }} />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: isDark ? '#f1f5f9' : '#0f172a' }}>
              {language === 'am' ? 'የተከፈለ መጠን፡' : 'Amount Paid:'}
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 900, color: '#10b981' }}>
              ETB {Number(milestone.paidAmount || milestone.amount).toLocaleString()}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
            <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>
              {language === 'am' ? 'የተከፈለበት ቀን፡' : 'Payment Date:'}
            </Typography>
            <Typography variant="caption" sx={{ color: isDark ? '#f1f5f9' : '#0f172a' }}>
              {paidDateStr}
            </Typography>
          </Box>
        </Paper>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: isDark ? '#94a3b8' : '#64748b' }}>
          <Shield sx={{ fontSize: 18, color: '#10b981' }} />
          <Typography variant="caption">
            {language === 'am'
              ? 'ይህ ሰነድ በዲጂታል የተረጋገጠ ህጋዊ የንብረት ግዢ ክፍያ ደረሰኝ ነው።'
              : 'Certified digital real estate purchase receipt issued by HRMS escrow.'}
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
            fontWeight: 700,
            py: 1
          }}
        >
          {language === 'am' ? 'ደረሰኙን አትም / ፒዲኤፍ አውርድ' : 'Print / Export Receipt'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
