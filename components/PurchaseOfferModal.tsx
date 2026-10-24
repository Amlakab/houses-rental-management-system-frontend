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
  const percentageDiff = ((diffFromAsking / askingPrice) * 100).toFixed(1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (offerAmount <= 0) {
      setError('Offer amount must be greater than zero');
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

      setSuccess('Formal Purchase Offer submitted to Seller & Agent!');
      setTimeout(() => {
        onSuccess?.();
        onClose();
        setSuccess('');
      }, 1800);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit offer. Please ensure you are logged in.');
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
          bgcolor: 'background.paper',
          backgroundImage: 'none'
        }
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <LocalOffer sx={{ color: '#10b981', fontSize: 28 }} />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Submit Formal Purchase Offer
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Asking Price: ETB {askingPrice.toLocaleString()}
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, py: 3 }}>
          {error && <Alert severity="error">{error}</Alert>}
          {success && <Alert severity="success">{success}</Alert>}

          {/* Offer Amount Input */}
          <Box>
            <TextField
              label="Your Proposed Offer Amount (ETB)"
              type="number"
              fullWidth
              value={offerAmount}
              onChange={(e) => setOfferAmount(Number(e.target.value))}
              required
              helperText={
                diffFromAsking === 0
                  ? 'Offering full asking price'
                  : diffFromAsking > 0
                  ? `+${percentageDiff}% above asking price`
                  : `${percentageDiff}% below asking price`
              }
            />
          </Box>

          {/* Financing Type */}
          <FormControl fullWidth required>
            <InputLabel>Financing Method</InputLabel>
            <Select
              value={financingType}
              label="Financing Method"
              onChange={(e) => setFinancingType(e.target.value as any)}
            >
              <MenuItem value="CASH">Full Cash / Direct Bank Transfer</MenuItem>
              <MenuItem value="BANK_MORTGAGE">Bank Mortgage Loan (CBE / Commercial Bank)</MenuItem>
              <MenuItem value="INSTALLMENT_PLAN">Developer Milestone Installment Plan</MenuItem>
              <MenuItem value="OTHER">Other Structured Financing</MenuItem>
            </Select>
          </FormControl>

          {/* Closing Date */}
          <TextField
            label="Proposed Target Closing / Deed Transfer Date"
            type="date"
            fullWidth
            value={proposedClosingDate}
            onChange={(e) => setProposedClosingDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />

          {/* Milestone Breakdown Summary Box */}
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: 2,
              bgcolor: 'action.hover',
              border: '1px solid',
              borderColor: 'divider'
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
              <ReceiptLong sx={{ color: '#10b981', fontSize: 18 }} />
              Proposed Payment Milestone Structure
            </Typography>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>10% Earnest Deposit Upon Offer Acceptance:</Typography>
              <Typography variant="body2" sx={{ fontWeight: 700, color: '#10b981' }}>ETB {earnestDeposit.toLocaleString()}</Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>40% Upon Sale Agreement Signing:</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>ETB {Math.round(offerAmount * 0.4).toLocaleString()}</Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>50% Final Settlement & Title Deed Transfer:</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>ETB {Math.round(offerAmount * 0.5).toLocaleString()}</Typography>
            </Box>
          </Paper>

          {/* Negotiation Message to Seller */}
          <TextField
            label="Message or Conditions to Seller"
            multiline
            rows={3}
            fullWidth
            placeholder="e.g. We have pre-approved mortgage financing and can close within 30 days."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Shield sx={{ color: '#06b6d4', fontSize: 18 }} />
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              All formal offers are legally binding upon mutual signing & protected by standard escrow conditions.
            </Typography>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={onClose} sx={{ color: 'text.secondary' }}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            sx={{
              bgcolor: '#10b981',
              '&:hover': { bgcolor: '#059669' },
              borderRadius: 2,
              px: 3
            }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Submit Formal Offer'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
