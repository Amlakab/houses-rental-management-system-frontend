'use client';

import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, TextField, Button,
  Dialog, DialogTitle, DialogContent, DialogActions,
  CircularProgress, Divider, Chip, IconButton, Alert,
  FormControl, InputLabel, Select, MenuItem, Avatar,
  Paper, Fade, Grow,
  Snackbar
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/lib/theme-context';
import { useLanguage } from '@/lib/language-context';
import { 
  Close, Send, Person, Email, Phone, Message as MessageIcon,
  Home, CheckCircle, Error as ErrorIcon, Subject,
  ThumbUp, Help, Info
} from '@mui/icons-material';
import api from '@/app/utils/api';
import { useAuth } from '@/lib/auth';

interface Message {
  _id: string;
  phone?: string;
  email?: string;
  name?: string;
  subject: string;
  message: string;
  response?: string;
  status: string;
  respondedAt?: string;
  createdAt: string;
  orderId?: string;
  houseId: string;
}

interface MessageModalProps {
  open: boolean;
  onClose: () => void;
  houseId: string;
  houseTitle: string;
  orderId?: string;
}

const MessageModal: React.FC<MessageModalProps> = ({ 
  open, 
  onClose, 
  houseId, 
  houseTitle, 
  orderId 
}) => {
  const { theme } = useTheme();
  const { t, language } = useLanguage();
  const isDark = theme === 'dark';
  const { user: authUser } = useAuth();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [messageForm, setMessageForm] = useState({
    name: '',
    email: '',
    phone: '',
    subject: 'general',
    message: ''
  });

  const themeStyles = {
    background: isDark ? '#0a192f' : '#f8fafc',
    textColor: isDark ? '#f1f5f9' : '#0f172a',
    mutedColor: isDark ? '#94a3b8' : '#64748b',
    primaryColor: isDark ? '#38bdf8' : '#2563eb',
    cardBg: isDark ? '#112240' : '#ffffff',
    cardBorder: isDark ? '#233554' : '#e2e8f0',
  };

  const textFieldStyle = {
    '& .MuiOutlinedInput-root': {
      backgroundColor: isDark ? '#0a192f' : '#ffffff',
      color: isDark ? '#f1f5f9' : '#0f172a',
      borderRadius: '10px',
      '& fieldset': {
        borderColor: isDark ? '#233554' : '#cbd5e1',
      },
      '&:hover fieldset': {
        borderColor: themeStyles.primaryColor,
      },
      '&.Mui-focused fieldset': {
        borderColor: themeStyles.primaryColor,
      },
    },
    '& .MuiInputLabel-root': {
      color: themeStyles.mutedColor,
    },
    '& .MuiInputLabel-root.Mui-focused': {
      color: themeStyles.primaryColor,
    },
    '& .MuiFormHelperText-root': {
      color: themeStyles.mutedColor
    }
  };

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/messages/house/${houseId}`);
      setMessages(response.data || []);
    } catch (error: any) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && houseId) {
      fetchMessages();
    }
  }, [open, houseId]);

  useEffect(() => {
    if (authUser) {
      setMessageForm(prev => ({
        ...prev,
        name: authUser.name || '',
        email: authUser.email || '',
        phone: authUser.phone || ''
      }));
    }
  }, [authUser]);

  const handleFormChange = (field: string, value: any) => {
    setMessageForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmitMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!messageForm.message.trim()) {
      setError('Please enter your message');
      return;
    }

    const hasPhone = messageForm.phone && messageForm.phone.trim() !== '';
    const hasEmail = messageForm.email && messageForm.email.trim() !== '';
    
    if (!hasPhone && !hasEmail && !orderId) {
      setError('Please provide either phone number, email address, or login to use your order');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      const messageData: any = {
        houseId,
        name: messageForm.name || 'Anonymous',
        subject: messageForm.subject,
        message: messageForm.message
      };

      if (orderId) {
        messageData.orderId = orderId;
      }
      
      if (hasPhone) {
        messageData.phone = messageForm.phone;
      }
      
      if (hasEmail) {
        messageData.email = messageForm.email;
      }

      const response = await api.post('/messages', messageData);
      
      if (response.data) {
        setSuccess('Your message has been sent! The agent will respond shortly.');
        setMessageForm(prev => ({
          ...prev,
          message: '',
          subject: 'general'
        }));
        fetchMessages();
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to send message. Please try again.';
      setError(errorMessage);
      console.error('Message submission error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSubjectIcon = (subject: string) => {
    switch (subject?.toLowerCase()) {
      case 'property-inquiry':
        return <Home fontSize="small" />;
      case 'booking-request':
        return <CheckCircle fontSize="small" />;
      case 'payment-issue':
        return <ErrorIcon fontSize="small" />;
      case 'support':
        return <Help fontSize="small" />;
      default:
        return <Subject fontSize="small" />;
    }
  };

  const getSubjectLabel = (subject: string) => {
    const labels: Record<string, { en: string; am: string }> = {
      'general': { en: 'General', am: 'አጠቃላይ' },
      'property-inquiry': { en: 'Property Inquiry', am: 'ስለ ንብረቱ' },
      'booking-request': { en: 'Booking Request', am: 'የቀጠሮ ጥያቄ' },
      'payment-issue': { en: 'Payment Issue', am: 'የክፍያ ጉዳይ' },
      'support': { en: 'Support', am: 'ድጋፍ' },
      'other': { en: 'Other', am: 'ሌላ' }
    };
    if (labels[subject]) {
      return language === 'am' ? labels[subject].am : labels[subject].en;
    }
    return subject;
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
          backgroundColor: themeStyles.cardBg,
          border: `1px solid ${themeStyles.cardBorder}`,
          color: themeStyles.textColor,
          maxHeight: '90vh'
        }
      }}
    >
      <DialogTitle sx={{ 
        borderBottom: `1px solid ${themeStyles.cardBorder}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        pb: 2
      }}>
        <Box>
          <Typography variant="h6" sx={{ 
            fontWeight: 'bold',
            color: themeStyles.textColor
          }}>
            {t('message.title', 'Messages & Inquiries')}
          </Typography>
          <Typography variant="body2" sx={{ color: themeStyles.mutedColor }}>
            {houseTitle}
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small" sx={{ color: themeStyles.mutedColor }}>
          <Close />
        </IconButton>
      </DialogTitle>
      
      <DialogContent sx={{ p: 0, overflowY: 'auto' }}>
        {/* Message History */}
        <Box sx={{ p: 2.5, borderBottom: `1px solid ${themeStyles.cardBorder}` }}>
          <Typography variant="subtitle2" sx={{ 
            mb: 2,
            color: themeStyles.primaryColor,
            fontWeight: 'bold'
          }}>
            {language === 'am' ? 'የመልእክት ታሪክ' : 'Conversation History'}
          </Typography>
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={32} sx={{ color: themeStyles.primaryColor }} />
            </Box>
          ) : messages.length === 0 ? (
            <Box sx={{ 
              textAlign: 'center', 
              py: 4,
              backgroundColor: isDark ? '#0a192f' : '#f8fafc',
              border: `1px solid ${themeStyles.cardBorder}`,
              borderRadius: 2
            }}>
              <MessageIcon sx={{ fontSize: 40, color: themeStyles.mutedColor, mb: 1 }} />
              <Typography variant="body2" sx={{ color: themeStyles.mutedColor }}>
                {language === 'am' ? 'ምንም መልእክት የለም። ውይይት ይጀምሩ!' : 'No messages yet. Start the conversation!'}
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {messages.map((msg, index) => (
                <Grow in={true} timeout={index * 100} key={msg._id}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      backgroundColor: isDark ? '#0a192f' : '#f8fafc',
                      borderLeft: `3px solid ${themeStyles.primaryColor}`,
                      border: `1px solid ${themeStyles.cardBorder}`,
                      borderRadius: 2
                    }}
                  >
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'flex-start',
                      mb: 1,
                      flexWrap: 'wrap',
                      gap: 1
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        <Chip
                          icon={getSubjectIcon(msg.subject)}
                          label={getSubjectLabel(msg.subject)}
                          size="small"
                          sx={{
                            height: 24,
                            backgroundColor: `${themeStyles.primaryColor}20`,
                            color: themeStyles.primaryColor,
                            fontWeight: 600
                          }}
                        />
                        <Typography variant="caption" sx={{ color: themeStyles.mutedColor, fontWeight: 500 }}>
                          {msg.name}
                        </Typography>
                      </Box>
                      <Typography variant="caption" sx={{ color: themeStyles.mutedColor }}>
                        {formatDate(msg.createdAt)}
                      </Typography>
                    </Box>
                    
                    <Typography variant="body2" sx={{ 
                      color: themeStyles.textColor,
                      mb: msg.response ? 2 : 0,
                      whiteSpace: 'pre-wrap'
                    }}>
                      {msg.message}
                    </Typography>
                    
                    {msg.response && (
                      <Fade in={true}>
                        <Box sx={{ 
                          mt: 1.5,
                          pt: 1.5,
                          borderTop: `1px solid ${themeStyles.cardBorder}`
                        }}>
                          <Typography variant="subtitle2" sx={{ 
                            color: '#10b981',
                            mb: 0.5,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                            fontWeight: 700
                          }}>
                            <CheckCircle fontSize="small" /> {language === 'am' ? 'ምላሽ፡' : 'Response:'}
                          </Typography>
                          <Typography variant="body2" sx={{ 
                            color: themeStyles.textColor,
                            backgroundColor: isDark ? '#112240' : '#f1f5f9',
                            p: 1.5,
                            borderRadius: 1.5,
                            whiteSpace: 'pre-wrap'
                          }}>
                            {msg.response}
                          </Typography>
                          {msg.respondedAt && (
                            <Typography variant="caption" sx={{ color: themeStyles.mutedColor, mt: 0.5, display: 'block' }}>
                              {language === 'am' ? 'ምላሽ የተሰጠበት ቀን፡' : 'Responded:'} {formatDate(msg.respondedAt)}
                            </Typography>
                          )}
                        </Box>
                      </Fade>
                    )}
                  </Paper>
                </Grow>
              ))}
            </Box>
          )}
        </Box>
        
        {/* Message Form */}
        <Box sx={{ p: 2.5 }}>
          <Typography variant="subtitle2" sx={{ 
            mb: 2,
            color: themeStyles.primaryColor,
            fontWeight: 'bold'
          }}>
            {language === 'am' ? 'አዲስ መልእክት ይላኩ' : 'Send New Message'}
          </Typography>
          
          <form onSubmit={handleSubmitMessage}>
            {/* User Info */}
            <Box sx={{ 
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              mb: 2
            }}>
              <TextField
                fullWidth
                label={language === 'am' ? 'የእርስዎ ስም' : 'Your Name'}
                value={messageForm.name}
                onChange={(e) => handleFormChange('name', e.target.value)}
                size="small"
                InputProps={{
                  startAdornment: <Person fontSize="small" sx={{ mr: 1, color: themeStyles.mutedColor }} />,
                }}
                sx={textFieldStyle}
              />
              
              <TextField
                fullWidth
                label={language === 'am' ? 'ስልክ ቁጥር' : 'Phone Number'}
                value={messageForm.phone}
                onChange={(e) => handleFormChange('phone', e.target.value)}
                size="small"
                helperText={!orderId && !messageForm.email ? (language === 'am' ? 'ኢሜይል ወይም ትዕዛዝ ከሌለ ስልክ ቁጥር ያስፈልጋል' : 'Required if no email or order') : ''}
                InputProps={{
                  startAdornment: <Phone fontSize="small" sx={{ mr: 1, color: themeStyles.mutedColor }} />,
                }}
                sx={textFieldStyle}
              />
              
              <TextField
                fullWidth
                label={language === 'am' ? 'ኢሜይል አድራሻ' : 'Email Address'}
                type="email"
                value={messageForm.email}
                onChange={(e) => handleFormChange('email', e.target.value)}
                size="small"
                helperText={!orderId && !messageForm.phone ? (language === 'am' ? 'ስልክ ወይም ትዕዛዝ ከሌለ ኢሜይል ያስፈልጋል' : 'Required if no phone or order') : ''}
                InputProps={{
                  startAdornment: <Email fontSize="small" sx={{ mr: 1, color: themeStyles.mutedColor }} />,
                }}
                sx={textFieldStyle}
              />
            </Box>
            
            {/* Subject */}
            <FormControl fullWidth size="small" sx={{ mb: 2 }}>
              <InputLabel sx={{ 
                color: themeStyles.mutedColor,
                '&.Mui-focused': { color: themeStyles.primaryColor }
              }}>
                {t('message.subject', 'Subject')}
              </InputLabel>
              <Select
                value={messageForm.subject}
                label={t('message.subject', 'Subject')}
                onChange={(e) => handleFormChange('subject', e.target.value)}
                sx={textFieldStyle}
              >
                <MenuItem value="general">{language === 'am' ? 'አጠቃላይ ጥያቄ' : 'General Inquiry'}</MenuItem>
                <MenuItem value="property-inquiry">{language === 'am' ? 'ስለ ንብረቱ መጠየቅ' : 'Property Inquiry'}</MenuItem>
                <MenuItem value="booking-request">{language === 'am' ? 'የቀጠሮ ጥያቄ' : 'Booking Request'}</MenuItem>
                <MenuItem value="payment-issue">{language === 'am' ? 'የክፍያ ጉዳይ' : 'Payment Issue'}</MenuItem>
                <MenuItem value="support">{language === 'am' ? 'ድጋፍ' : 'Support'}</MenuItem>
                <MenuItem value="other">{language === 'am' ? 'ሌላ' : 'Other'}</MenuItem>
              </Select>
            </FormControl>
            
            {/* Message */}
            <TextField
              fullWidth
              label={t('message.content', 'Your Message *')}
              value={messageForm.message}
              onChange={(e) => handleFormChange('message', e.target.value)}
              multiline
              rows={4}
              required
              placeholder={language === 'am' ? 'እባክዎ ጥያቄዎን፣ አስተያየትዎን ወይም ፍላጎትዎን ያካፍሉ...' : 'Please share your questions, concerns, or requests...'}
              helperText={language === 'am' ? 'ይህ መስክ የግድ መሞላት አለበት' : 'This field is required'}
              sx={{ ...textFieldStyle, mb: 2 }}
            />
            
            {/* Submit Button */}
            <Button
              type="submit"
              variant="contained"
              fullWidth
              startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <Send />}
              disabled={submitting || !messageForm.message.trim()}
              sx={{
                bgcolor: themeStyles.primaryColor,
                color: '#ffffff',
                borderRadius: '10px',
                py: 1.2,
                fontWeight: 'bold',
                textTransform: 'none',
                '&:hover': {
                  bgcolor: isDark ? '#0284c7' : '#1d4ed8'
                },
                '&.Mui-disabled': {
                  bgcolor: isDark ? '#233554' : '#e2e8f0',
                  color: isDark ? '#64748b' : '#94a3b8'
                }
              }}
            >
              {submitting ? t('action.sending', 'Sending...') : t('message.send', 'Send Message')}
            </Button>
          </form>
        </Box>
      </DialogContent>
      
      {/* Notifications */}
      <Snackbar 
        open={!!error} 
        autoHideDuration={6000} 
        onClose={() => setError('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity="error" onClose={() => setError('')}>
          {error}
        </Alert>
      </Snackbar>
      
      <Snackbar 
        open={!!success} 
        autoHideDuration={6000} 
        onClose={() => setSuccess('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity="success" onClose={() => setSuccess('')}>
          {success}
        </Alert>
      </Snackbar>
    </Dialog>
  );
};

export default MessageModal;