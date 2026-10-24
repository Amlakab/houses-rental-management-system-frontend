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
  Alert,
  CircularProgress,
  IconButton
} from '@mui/material';
import { Flag, Close } from '@mui/icons-material';
import api from '@/app/utils/api';
import { House } from '@/types/houses';

interface ReportListingModalProps {
  open: boolean;
  onClose: () => void;
  house: House;
}

export default function ReportListingModal({
  open,
  onClose,
  house
}: ReportListingModalProps) {
  const [reason, setReason] = useState('MISLEADING_PRICE');
  const [description, setDescription] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [reporterEmail, setReporterEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setError('Please provide specific details explaining the issue');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await api.post('/reviews/report', {
        houseId: house._id,
        reason,
        description,
        evidenceUrl: evidenceUrl || undefined,
        reporterEmail: reporterEmail || undefined
      });

      setSuccess('Report submitted to Trust & Moderation team. Thank you for protecting the community!');
      setTimeout(() => {
        onClose();
        setSuccess('');
        setDescription('');
      }, 1800);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit report. Please try again.');
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
          <Flag sx={{ color: '#f43f5e', fontSize: 26 }} />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Report Suspicious or Inaccurate Listing
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {house.title}
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

          <FormControl fullWidth required>
            <InputLabel>Reason for Report</InputLabel>
            <Select
              value={reason}
              label="Reason for Report"
              onChange={(e) => setReason(e.target.value)}
            >
              <MenuItem value="MISLEADING_PRICE">Incorrect or Deceptive Price Listed</MenuItem>
              <MenuItem value="FAKE_PHOTOS">Fake, Copied, or Inaccurate Photos</MenuItem>
              <MenuItem value="ALREADY_SOLD_OR_RENTED">Property is Already Sold / Occupied</MenuItem>
              <MenuItem value="FRAUD_SCAM">Potential Scam / Unauthorized Seller</MenuItem>
              <MenuItem value="INCORRECT_LOCATION">Wrong Location / Fake Coordinates</MenuItem>
              <MenuItem value="OTHER">Other Community Policy Violation</MenuItem>
            </Select>
          </FormControl>

          <TextField
            label="Detailed Explanation"
            multiline
            rows={4}
            required
            fullWidth
            placeholder="Please describe why this listing is misleading or suspicious with as much detail as possible..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <TextField
            label="Supporting Evidence Link (Optional)"
            placeholder="https://..."
            fullWidth
            value={evidenceUrl}
            onChange={(e) => setEvidenceUrl(e.target.value)}
          />

          <TextField
            label="Your Contact Email (Optional for updates)"
            type="email"
            fullWidth
            value={reporterEmail}
            onChange={(e) => setReporterEmail(e.target.value)}
          />
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
              bgcolor: '#f43f5e',
              '&:hover': { bgcolor: '#e11d48' },
              borderRadius: 2,
              px: 3
            }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Submit Violation Report'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
