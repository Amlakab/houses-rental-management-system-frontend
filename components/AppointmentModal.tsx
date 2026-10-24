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
  RadioGroup,
  FormControlLabel,
  Radio,
  CircularProgress,
  Alert,
  IconButton
} from '@mui/material';
import { CalendarMonth, AccessTime, Person, Close, VideoCameraFront, LocationOn } from '@mui/icons-material';
import api from '@/app/utils/api';
import { House } from '@/types/houses';

interface AppointmentModalProps {
  open: boolean;
  onClose: () => void;
  house: House;
  onSuccess?: () => void;
}

export default function AppointmentModal({
  open,
  onClose,
  house,
  onSuccess
}: AppointmentModalProps) {
  const [visitDate, setVisitDate] = useState('');
  const [timeSlot, setTimeSlot] = useState('10:00 AM - 11:00 AM');
  const [visitType, setVisitType] = useState<'IN_PERSON' | 'VIRTUAL_TOUR'>('IN_PERSON');
  const [numberOfVisitors, setNumberOfVisitors] = useState(1);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const timeSlots = [
    '09:00 AM - 10:00 AM',
    '10:00 AM - 11:00 AM',
    '11:30 AM - 12:30 PM',
    '02:00 PM - 03:00 PM',
    '03:30 PM - 04:30 PM',
    '05:00 PM - 06:00 PM'
  ];

  // Set min date to tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDateString = tomorrow.toISOString().split('T')[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitDate) {
      setError('Please select a visit date');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await api.post('/workflows/appointments', {
        houseId: house._id,
        visitDate,
        timeSlot,
        visitType,
        numberOfVisitors,
        notes
      });

      setSuccess('Viewing appointment request submitted successfully!');
      setTimeout(() => {
        onSuccess?.();
        onClose();
        setSuccess('');
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to schedule appointment. Please try again.');
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
          <CalendarMonth sx={{ color: '#06b6d4', fontSize: 28 }} />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Schedule a Property Viewing
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

          {/* Visit Type */}
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              Viewing Mode
            </Typography>
            <RadioGroup
              row
              value={visitType}
              onChange={(e) => setVisitType(e.target.value as any)}
            >
              <FormControlLabel
                value="IN_PERSON"
                control={<Radio sx={{ color: '#06b6d4', '&.Mui-checked': { color: '#06b6d4' } }} />}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <LocationOn fontSize="small" sx={{ color: '#06b6d4' }} />
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>In-Person Physical Visit</Typography>
                  </Box>
                }
              />
              <FormControlLabel
                value="VIRTUAL_TOUR"
                control={<Radio sx={{ color: '#06b6d4', '&.Mui-checked': { color: '#06b6d4' } }} />}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <VideoCameraFront fontSize="small" sx={{ color: '#a855f7' }} />
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>Live Video Tour (Virtual)</Typography>
                  </Box>
                }
              />
            </RadioGroup>
          </Box>

          {/* Date & Time */}
          <Box sx={{ display: 'flex', gap: 2, flexWrap: { xs: 'wrap', sm: 'nowrap' } }}>
            <TextField
              label="Select Date"
              type="date"
              fullWidth
              value={visitDate}
              onChange={(e) => setVisitDate(e.target.value)}
              inputProps={{ min: minDateString }}
              InputLabelProps={{ shrink: true }}
              required
            />

            <FormControl fullWidth required>
              <InputLabel>Available Time Slot</InputLabel>
              <Select
                value={timeSlot}
                label="Available Time Slot"
                onChange={(e) => setTimeSlot(e.target.value)}
              >
                {timeSlots.map((slot) => (
                  <MenuItem key={slot} value={slot}>
                    {slot}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {/* Number of Visitors */}
          <TextField
            label="Number of Attendees"
            type="number"
            fullWidth
            value={numberOfVisitors}
            onChange={(e) => setNumberOfVisitors(Math.max(1, parseInt(e.target.value) || 1))}
            inputProps={{ min: 1, max: 10 }}
          />

          {/* Additional Notes */}
          <TextField
            label="Special Inquiries or Questions for Agent"
            multiline
            rows={3}
            fullWidth
            placeholder="e.g. Inquiring about lease start date, parking spaces, or neighborhood schools."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
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
              bgcolor: '#06b6d4',
              '&:hover': { bgcolor: '#0891b2' },
              borderRadius: 2,
              px: 3
            }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Confirm Appointment Request'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
