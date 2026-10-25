'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Chip,
  Alert,
  CircularProgress,
  IconButton,
  Divider,
  Paper
} from '@mui/material';
import {
  LocalOffer,
  Close,
  Shield,
  AccountBalance,
  ReceiptLong,
  CheckCircleOutline
} from '@mui/icons-material';
import { useTheme } from '@/lib/theme-context';
import { useLanguage } from '@/lib/language-context';
import api from '@/app/utils/api';
import { House } from '@/types/houses';

interface PurchaseOfferModalProps {
  open: boolean;
  onClose: () => void;
  house: House;
  onSuccess?: () => void;
}

export default function PurchaseOfferModal({
  open,
  onClose,
  house,
  onSuccess
}: PurchaseOfferModalProps) {
  const { theme } = useTheme();
  const { t, language } = useLanguage();
  const isDark = theme === 'dark';

  const askingPrice = house.saleTerms?.askingPrice || house.pricing.price;
  const [offerAmount, setOfferAmount] = useState(askingPrice);
  const [financingType, setFinancingType] = useState<'CASH' | 'BANK_MORTGAGE' | 'INSTALLMENT_PLAN' | 'OTHER'>('CASH');
  const [proposedClosingDate, setProposedClosingDate] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Auto calculate 10% earnest money deposit
  const earnestDeposit = Math.round(offerAmount * 0.1);
  const diffFromAsking = offerAmount - askingPrice;
  const percentageDiff = askingPrice > 0 ? ((diffFromAsking / askingPrice) * 100).toFixed(1) : '0';

  const textFieldStyle = {
    '& .MuiOutlinedInput-root': {
      backgroundColor: isDark ? '#0a192f' : '#ffffff',
      color: isDark ? '#f1f5f9' : '#0f172a',
      borderRadius: '10px',
      '& fieldset': { borderColor: isDark ? '#233554' : '#cbd5e1' },
      '&:hover fieldset': { borderColor: '#10b981' },
      '&.Mui-focused fieldset': { borderColor: '#10b981' }
    },
    '& .MuiInputLabel-root': { color: isDark ? '#94a3b8' : '#64748b' },
    '& .MuiFormHelperText-root': { color: isDark ? '#94a3b8' : '#64748b' }
  };

  const selectStyle = {
    backgroundColor: isDark ? '#0a192f' : '#ffffff',
    color: isDark ? '#f1f5f9' : '#0f172a',
    borderRadius: '10px',
    '& .MuiOutlinedInput-notchedOutline': { borderColor: isDark ? '#233554' : '#cbd5e1' },
    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#10b981' },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#10b981' },
    '& .MuiSvgIcon-root': { color: isDark ? '#94a3b8' : '#64748b' }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (offerAmount <= 0) {
      setError(language === 'am' ? 'የቀረበው ዋጋ ከዜሮ መብለጥ አለበት' : 'Offer amount must be greater than zero');
      return;
    }

    try {
      setLoading(true);
      setError('');

      await api.post('/workflows/offers', {
        houseId: house._id,
        offerAmount,
        earnestDepositAmount: earnestDeposit,
        proposedClosingDate: proposedClosingDate || undefined,
        financingType,
        message,
        contingencies: [
          'Clean Title Deed Verification',
          'Physical and Structural Property Inspection',
          'Standard Property Handover'
        ]
      });

      setSuccess(language === 'am' ? 'የግዢ ዋጋ ጥያቄ ለባለቤቱ እና ለደላላው ተልኳል!' : 'Formal Purchase Offer submitted to Seller & Agent!');
      setTimeout(() => {
        onSuccess?.();
        onClose();
        setSuccess('');
      }, 1800);
    } catch (err: any) {
      setError(err.response?.data?.message || (language === 'am' ? 'የግዢ ጥያቄውን መላክ አልተቻለም። እባክዎ መግባትዎን ያረጋግጡ።' : 'Failed to submit offer. Please ensure you are logged in.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          bgcolor: isDark ? '#112240' : '#ffffff',
          border: isDark ? '1px solid #233554' : '1px solid #e2e8f0',
          color: isDark ? '#f1f5f9' : '#0f172a',
          backgroundImage: 'none'
        }
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1, borderBottom: isDark ? '1px solid #233554' : '1px solid #e2e8f0' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <LocalOffer sx={{ color: '#10b981', fontSize: 28 }} />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: isDark ? '#f1f5f9' : '#0f172a' }}>
              {t('offer.title', 'Submit Formal Purchase Offer')}
            </Typography>
            <Typography variant="body2" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>
              {language === 'am' ? 'የመሸጫ ዋጋ' : 'Asking Price'}: ETB {askingPrice.toLocaleString()}
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} size="small" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>
          <Close />
        </IconButton>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, py: 3 }}>
          {error && <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ borderRadius: 2 }}>{success}</Alert>}

          {/* Offer Amount Input */}
          <Box>
            <TextField
              label={t('offer.amount', 'Your Proposed Offer Amount (ETB)')}
              type="number"
              fullWidth
              value={offerAmount}
              onChange={(e) => setOfferAmount(Number(e.target.value))}
              required
              sx={textFieldStyle}
              helperText={
                diffFromAsking === 0
                  ? (language === 'am' ? 'የተጠየቀውን ሙሉ ዋጋ ማቅረብ' : 'Offering full asking price')
                  : diffFromAsking > 0
                  ? `+${percentageDiff}% ${language === 'am' ? 'ከተጠየቀው ዋጋ በላይ' : 'above asking price'}`
                  : `${percentageDiff}% ${language === 'am' ? 'ከተጠየቀው ዋጋ በታች' : 'below asking price'}`
              }
            />
          </Box>

          {/* Financing Type */}
          <FormControl fullWidth required sx={selectStyle}>
            <InputLabel sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>
              {t('offer.financing', 'Financing Method')}
            </InputLabel>
            <Select
              value={financingType}
              label={t('offer.financing', 'Financing Method')}
              onChange={(e) => setFinancingType(e.target.value as any)}
            >
              <MenuItem value="CASH">{language === 'am' ? 'ሙሉ በጥሬ ገንዘብ / ቀጥታ የባንክ ዝውውር' : 'Full Cash / Direct Bank Transfer'}</MenuItem>
              <MenuItem value="BANK_MORTGAGE">{language === 'am' ? 'የባንክ ብድር / ሞርጌጅ (ንግድ ባንክ ወይም ሌሎች)' : 'Bank Mortgage Loan (CBE / Commercial Bank)'}</MenuItem>
              <MenuItem value="INSTALLMENT_PLAN">{language === 'am' ? 'የገንቢው የደረጃ በደረጃ ክፍያ እቅድ' : 'Developer Milestone Installment Plan'}</MenuItem>
              <MenuItem value="OTHER">{language === 'am' ? 'ሌላ የተዋቀረ የፋይናንስ ስምምነት' : 'Other Structured Financing'}</MenuItem>
            </Select>
          </FormControl>

          {/* Closing Date */}
          <TextField
            label={t('offer.closing_date', 'Proposed Target Closing / Deed Transfer Date')}
            type="date"
            fullWidth
            value={proposedClosingDate}
            onChange={(e) => setProposedClosingDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={textFieldStyle}
          />

          {/* Milestone Breakdown Summary Box */}
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: 2,
              bgcolor: isDark ? '#0a192f' : '#f8fafc',
              border: isDark ? '1px solid #233554' : '1px solid #e2e8f0'
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, display: 'flex', alignItems: 'center', gap: 1, color: isDark ? '#f1f5f9' : '#0f172a' }}>
              <ReceiptLong sx={{ color: '#10b981', fontSize: 18 }} />
              {language === 'am' ? 'የክፍያ ደረጃዎች እቅድ' : 'Proposed Payment Milestone Structure'}
            </Typography>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
              <Typography variant="body2" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>
                {language === 'am' ? '10% ቅድመ ክፍያ ጥያቄው ሲጸድቅ፡' : '10% Earnest Deposit Upon Offer Acceptance:'}
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 700, color: '#10b981' }}>
                ETB {earnestDeposit.toLocaleString()}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
              <Typography variant="body2" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>
                {language === 'am' ? '40% የሽያጭ ውል ሲፈረም፡' : '40% Upon Sale Agreement Signing:'}
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, color: isDark ? '#f1f5f9' : '#0f172a' }}>
                ETB {Math.round(offerAmount * 0.4).toLocaleString()}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
              <Typography variant="body2" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>
                {language === 'am' ? '50% የመጨረሻ ክፍያ እና የባለቤትነት ስም ዝውውር፡' : '50% Final Settlement & Title Deed Transfer:'}
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, color: isDark ? '#f1f5f9' : '#0f172a' }}>
                ETB {Math.round(offerAmount * 0.5).toLocaleString()}
              </Typography>
            </Box>
          </Paper>

          {/* Negotiation Message to Seller */}
          <TextField
            label={language === 'am' ? 'ለሻጩ የሚሰጥ ማስታወሻ ወይም ቅድመ ሁኔታ' : 'Message or Conditions to Seller'}
            multiline
            rows={3}
            fullWidth
            placeholder={language === 'am' ? 'ለምሳሌ፡ የባንክ ብድር ፈቃድ አለን እና በ30 ቀናት ውስጥ ውሉን ማጠናቀቅ እንችላለን።' : 'e.g. We have pre-approved mortgage financing and can close within 30 days.'}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            sx={textFieldStyle}
          />

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Shield sx={{ color: '#06b6d4', fontSize: 18 }} />
            <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>
              {language === 'am' ? 'ሁሉም ይፋዊ የዋጋ ጥያቄዎች በሁለቱም ወገኖች ከተፈረሙ በኋላ ህጋዊ አስገዳጅነት አላቸው።' : 'All formal offers are legally binding upon mutual signing & protected by standard escrow conditions.'}
            </Typography>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 2.5, borderTop: isDark ? '1px solid #233554' : '1px solid #e2e8f0', display: 'flex', flexDirection: { xs: 'column-reverse', sm: 'row' }, gap: 1.5 }}>
          <Button
            onClick={onClose}
            sx={{
              color: isDark ? '#94a3b8' : '#64748b',
              width: { xs: '100%', sm: 'auto' },
              textTransform: 'none'
            }}
          >
            {t('action.cancel', 'Cancel')}
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            sx={{
              bgcolor: '#10b981',
              '&:hover': { bgcolor: '#059669' },
              borderRadius: '10px',
              px: 3,
              py: 1,
              fontWeight: 600,
              textTransform: 'none',
              width: { xs: '100%', sm: 'auto' }
            }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : t('offer.submit', 'Submit Formal Offer')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
