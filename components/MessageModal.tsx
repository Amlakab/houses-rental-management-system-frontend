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
    background: theme === 'dark' 
      ? 'linear-gradient(135deg, #0a192f, #112240)' 
      : 'linear-gradient(135deg, #f8f5ff, #ffffff)',
    textColor: theme === 'dark' ? '#ccd6f6' : '#333333',
    primaryColor: theme === 'dark' ? '#00ffff' : '#8B5CF6',
    cardBg: theme === 'dark' ? '#0f172a80' : '#ffffff',
    cardBorder: theme === 'dark' ? '#334155' : '#e5e7eb',
    headerBg: theme === 'dark' 
      ? 'linear-gradient(135deg, #00ffff, #00b3b3)' 
      : 'linear-gradient(135deg, #8B5CF6, #EC4899)',
  };

  const textFieldStyle = {
    '& .MuiOutlinedInput-root': {
      backgroundColor: theme === 'dark' ? '#1e293b' : 'white',
      color: theme === 'dark' ? '#ccd6f6' : '#333333',
      '& fieldset': {
        borderColor: theme === 'dark' ? '#334155' : '#e5e7eb',
      },
      '&:hover fieldset': {
        borderColor: theme === 'dark' ? '#00ffff' : '#8B5CF6',
      },
      '&.Mui-focused fieldset': {
        borderColor: theme === 'dark' ? '#00ffff' : '#8B5CF6',
      },
    },
    '& .MuiInputLabel-root': {
      color: theme === 'dark' ? '#a8b2d1' : '#666666',
    },
    '& .MuiInputLabel-root.Mui-focused': {
      color: theme === 'dark' ? '#00ffff' : '#8B5CF6',
    },
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
    const labels: Record<string, string> = {
      'general': 'General',
      'property-inquiry': 'Property Inquiry',
      'booking-request': 'Booking Request',
      'payment-issue': 'Payment Issue',
      'support': 'Support',
      'other': 'Other'
    };
    return labels[subject] || subject;
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
          backgroundColor: theme === 'dark' ? '#0f172a' : 'white',
          maxHeight: '90vh'
        }
      }}
    >
      <DialogTitle sx={{ 
        borderBottom: 1, 
        borderColor: 'divider',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        pb: 2
      }}>
        <Box>
          <Typography variant="h6" sx={{ 
            fontWeight: 'bold',
            background: themeStyles.headerBg,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Messages & Inquiries
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {houseTitle}
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>
      
      <DialogContent sx={{ p: 0, overflowY: 'auto' }}>
        {/* Message History */}
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="subtitle2" sx={{ 
            mb: 2,
            color: theme === 'dark' ? '#00ffff' : '#8B5CF6',
            fontWeight: 'bold'
          }}>
            Conversation History
          </Typography>
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={32} sx={{ color: theme === 'dark' ? '#00ffff' : '#8B5CF6' }} />
            </Box>
          ) : messages.length === 0 ? (
            <Box sx={{ 
              textAlign: 'center', 
              py: 4,
              backgroundColor: theme === 'dark' ? '#1e293b' : '#f8f9fa',
              borderRadius: 2
            }}>
              <MessageIcon sx={{ fontSize: 40, color: theme === 'dark' ? '#334155' : '#d1d5db', mb: 1 }} />
              <Typography variant="body2" color="text.secondary">
                No messages yet. Start the conversation!
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
                      backgroundColor: theme === 'dark' ? '#1e293b' : '#f8fafc',
                      borderLeft: `3px solid ${theme === 'dark' ? '#00ffff' : '#8B5CF6'}`,
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
                            backgroundColor: theme === 'dark' 
                              ? 'rgba(0, 255, 255, 0.1)' 
                              : 'rgba(139, 92, 246, 0.1)',
                            color: theme === 'dark' ? '#00ffff' : '#8B5CF6'
                          }}
                        />
                        <Typography variant="caption" color="text.secondary">
                          {msg.name}
                        </Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        {formatDate(msg.createdAt)}
                      </Typography>
                    </Box>
                    
                    <Typography variant="body2" sx={{ 
                      color: theme === 'dark' ? '#ccd6f6' : '#333333',
                      mb: msg.response ? 2 : 0,
                      whiteSpace: 'pre-wrap'
                    }}>
                      {msg.message}
                    </Typography>
                    
                    {msg.response && (
                      <Fade in={true}>
                        <Box sx={{ 
                          mt: 1,
                          pt: 1,
                          borderTop: 1,
                          borderColor: 'divider'
                        }}>
                          <Typography variant="subtitle2" sx={{ 
                            color: '#10B981',
                            mb: 0.5,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5
                          }}>
                            <CheckCircle fontSize="small" /> Response:
                          </Typography>
                          <Typography variant="body2" sx={{ 
                            color: theme === 'dark' ? '#a8b2d1' : '#666666',
                            backgroundColor: theme === 'dark' ? '#0f172a' : '#f0f0f0',
                            p: 1.5,
                            borderRadius: 1,
                            whiteSpace: 'pre-wrap'
                          }}>
                            {msg.response}
                          </Typography>
                          {msg.respondedAt && (
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                              Responded: {formatDate(msg.respondedAt)}
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
        <Box sx={{ p: 2 }}>
          <Typography variant="subtitle2" sx={{ 
            mb: 2,
            color: theme === 'dark' ? '#00ffff' : '#8B5CF6',
            fontWeight: 'bold'
          }}>
            Send New Message
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
                label="Your Name"
                value={messageForm.name}
                onChange={(e) => handleFormChange('name', e.target.value)}
                size="small"
                InputProps={{
                  startAdornment: <Person fontSize="small" sx={{ mr: 1, color: theme === 'dark' ? '#a8b2d1' : '#666666' }} />,
                }}
                sx={textFieldStyle}
              />
              
              <TextField
                fullWidth
                label="Phone Number"
                value={messageForm.phone}
                onChange={(e) => handleFormChange('phone', e.target.value)}
                size="small"
                helperText={!orderId && !messageForm.email ? "Required if no email or order" : ""}
                InputProps={{
                  startAdornment: <Phone fontSize="small" sx={{ mr: 1, color: theme === 'dark' ? '#a8b2d1' : '#666666' }} />,
                }}
                sx={textFieldStyle}
              />
              
              <TextField
                fullWidth
                label="Email Address"
                type="email"
                value={messageForm.email}
                onChange={(e) => handleFormChange('email', e.target.value)}
                size="small"
                helperText={!orderId && !messageForm.phone ? "Required if no phone or order" : ""}
                InputProps={{
                  startAdornment: <Email fontSize="small" sx={{ mr: 1, color: theme === 'dark' ? '#a8b2d1' : '#666666' }} />,
                }}
                sx={textFieldStyle}
              />
            </Box>
            
            {/* Subject */}
            <FormControl fullWidth size="small" sx={{ mb: 2 }}>
              <InputLabel sx={{ 
                color: theme === 'dark' ? '#a8b2d1' : '#666666',
                '&.Mui-focused': { color: theme === 'dark' ? '#00ffff' : '#8B5CF6' }
              }}>
                Subject
              </InputLabel>
              <Select
                value={messageForm.subject}
                label="Subject"
                onChange={(e) => handleFormChange('subject', e.target.value)}
                sx={textFieldStyle}
              >
                <MenuItem value="general">General Inquiry</MenuItem>
                <MenuItem value="property-inquiry">Property Inquiry</MenuItem>
                <MenuItem value="booking-request">Booking Request</MenuItem>
                <MenuItem value="payment-issue">Payment Issue</MenuItem>
                <MenuItem value="support">Support</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
            </FormControl>
            
            {/* Message */}
            <TextField
              fullWidth
              label="Your Message *"
              value={messageForm.message}
              onChange={(e) => handleFormChange('message', e.target.value)}
              multiline
              rows={4}
              required
              placeholder="Please share your questions, concerns, or requests..."
              helperText="This field is required"
              sx={{ ...textFieldStyle, mb: 2 }}
            />
            
            {/* Submit Button */}
            <Button
              type="submit"
              variant="contained"
              fullWidth
              startIcon={submitting ? <CircularProgress size={20} /> : <Send />}
              disabled={submitting || !messageForm.message.trim()}
              sx={{
                background: themeStyles.headerBg,
                borderRadius: 2,
                py: 1.2,
                fontWeight: 'bold',
                '&:hover': {
                  background: theme === 'dark'
                    ? 'linear-gradient(135deg, #00b3b3, #008080)'
                    : 'linear-gradient(135deg, #7C3AED, #DB2777)'
                },
                '&.Mui-disabled': {
                  background: theme === 'dark' ? '#334155' : '#e5e7eb'
                }
              }}
            >
              {submitting ? 'Sending...' : 'Send Message'}
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