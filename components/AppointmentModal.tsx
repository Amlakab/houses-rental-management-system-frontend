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
import { useTheme } from '@/lib/theme-context';
import { useLanguage } from '@/lib/language-context';
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
  const { theme } = useTheme();
  const { t, language } = useLanguage();
  const isDark = theme === 'dark';

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

  const textFieldStyle = {
    '& .MuiOutlinedInput-root': {
      backgroundColor: isDark ? '#0a192f' : '#ffffff',
      color: isDark ? '#f1f5f9' : '#0f172a',
      borderRadius: '10px',
      '& fieldset': { borderColor: isDark ? '#233554' : '#cbd5e1' },
      '&:hover fieldset': { borderColor: isDark ? '#38bdf8' : '#2563eb' },
      '&.Mui-focused fieldset': { borderColor: isDark ? '#38bdf8' : '#2563eb' }
    },
    '& .MuiInputLabel-root': { color: isDark ? '#94a3b8' : '#64748b' }
  };

  const selectStyle = {
    backgroundColor: isDark ? '#0a192f' : '#ffffff',
    color: isDark ? '#f1f5f9' : '#0f172a',
    borderRadius: '10px',
    '& .MuiOutlinedInput-notchedOutline': { borderColor: isDark ? '#233554' : '#cbd5e1' },
    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: isDark ? '#38bdf8' : '#2563eb' },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: isDark ? '#38bdf8' : '#2563eb' },
    '& .MuiSvgIcon-root': { color: isDark ? '#94a3b8' : '#64748b' }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitDate) {
      setError(language === 'am' ? 'እባክዎ የጉብኝት ቀን ይምረጡ' : 'Please select a visit date');
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

      setSuccess(language === 'am' ? 'የጉብኝት ቀጠሮ ጥያቄ በተሳካ ሁኔታ ተልኳል!' : 'Viewing appointment request submitted successfully!');
      setTimeout(() => {
        onSuccess?.();
        onClose();
        setSuccess('');
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || (language === 'am' ? 'ቀጠሮ ማስያዝ አልተቻለም። እባክዎ እንደገና ይሞክሩ።' : 'Failed to schedule appointment. Please try again.'));
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
          <CalendarMonth sx={{ color: isDark ? '#38bdf8' : '#2563eb', fontSize: 28 }} />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: isDark ? '#f1f5f9' : '#0f172a' }}>
              {t('appointment.title', 'Schedule a Property Viewing')}
            </Typography>
            <Typography variant="body2" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>
              {house.title}
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

          {/* Visit Type */}
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: isDark ? '#f1f5f9' : '#0f172a' }}>
              {t('appointment.type', 'Viewing Mode')}
            </Typography>
            <RadioGroup
              row
              value={visitType}
              onChange={(e) => setVisitType(e.target.value as any)}
              sx={{ gap: { xs: 1, sm: 2 } }}
            >
              <FormControlLabel
                value="IN_PERSON"
                control={<Radio sx={{ color: isDark ? '#38bdf8' : '#2563eb', '&.Mui-checked': { color: isDark ? '#38bdf8' : '#2563eb' } }} />}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <LocationOn fontSize="small" sx={{ color: isDark ? '#38bdf8' : '#2563eb' }} />
                    <Typography variant="body2" sx={{ fontWeight: 600, color: isDark ? '#f1f5f9' : '#0f172a' }}>
                      {t('appointment.in_person', 'In-Person Physical Visit')}
                    </Typography>
                  </Box>
                }
              />
              <FormControlLabel
                value="VIRTUAL_TOUR"
                control={<Radio sx={{ color: isDark ? '#38bdf8' : '#2563eb', '&.Mui-checked': { color: isDark ? '#38bdf8' : '#2563eb' } }} />}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <VideoCameraFront fontSize="small" sx={{ color: '#a855f7' }} />
                    <Typography variant="body2" sx={{ fontWeight: 600, color: isDark ? '#f1f5f9' : '#0f172a' }}>
                      {t('appointment.virtual', 'Live Video Tour (Virtual)')}
                    </Typography>
                  </Box>
                }
              />
            </RadioGroup>
          </Box>

          {/* Date & Time */}
          <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
            <TextField
              label={t('appointment.date', 'Select Date')}
              type="date"
              fullWidth
              value={visitDate}
              onChange={(e) => setVisitDate(e.target.value)}
              inputProps={{ min: minDateString }}
              InputLabelProps={{ shrink: true }}
              required
              sx={textFieldStyle}
            />

            <FormControl fullWidth required sx={selectStyle}>
              <InputLabel sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>
                {t('appointment.time', 'Available Time Slot')}
              </InputLabel>
              <Select
                value={timeSlot}
                label={t('appointment.time', 'Available Time Slot')}
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
            label={t('appointment.visitors', 'Number of Attendees')}
            type="number"
            fullWidth
            value={numberOfVisitors}
            onChange={(e) => setNumberOfVisitors(Math.max(1, parseInt(e.target.value) || 1))}
            inputProps={{ min: 1, max: 10 }}
            sx={textFieldStyle}
          />

          {/* Additional Notes */}
          <TextField
            label={t('appointment.notes', 'Special Inquiries or Questions for Agent')}
            multiline
            rows={3}
            fullWidth
            placeholder={language === 'am' ? 'ለምሳሌ፡ ስለ ውል ጅምር፣ የመኪና ማቆሚያ፣ ወይም የአካባቢ ትምህርት ቤቶች መጠየቅ።' : 'e.g. Inquiring about lease start date, parking spaces, or neighborhood schools.'}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            sx={textFieldStyle}
          />
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
              bgcolor: isDark ? '#38bdf8' : '#2563eb',
              color: '#ffffff',
              '&:hover': { bgcolor: isDark ? '#0284c7' : '#1d4ed8' },
              borderRadius: '10px',
              px: 3,
              py: 1,
              fontWeight: 600,
              textTransform: 'none',
              width: { xs: '100%', sm: 'auto' }
            }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : t('appointment.submit', 'Confirm Appointment Request')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
