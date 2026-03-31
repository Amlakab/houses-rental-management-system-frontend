'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Box, Typography, Card, CardContent, TextField, Button,
  Dialog, DialogTitle, DialogContent, DialogActions,
  CircularProgress, Divider, Chip, IconButton, Alert,
  Avatar, Paper, Snackbar
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/lib/theme-context';
import { 
  Close, Send, Person, Message as MessageIcon,
  CheckCircle, DoneAll
} from '@mui/icons-material';
import api from '@/app/utils/api';
import { useAuth } from '@/lib/auth';

interface Message {
  _id: string;
  orderId?: string;
  houseId?: string;
  phone?: string;
  email?: string;
  name?: string;
  subject: string;
  message: string;
  response?: string;
  status: 'pending' | 'responded';
  createdAt: string;
  respondedAt?: string;
  isRead?: boolean;
}

interface MessageConversationProps {
  open: boolean;
  onClose: () => void;
  orderId: string;
  houseId: string;
  houseTitle?: string;
  orderType?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  userRole: 'customer' | 'user' | 'manager' | 'admin';
}

const MessageConversation: React.FC<MessageConversationProps> = ({ 
  open, 
  onClose, 
  orderId,
  houseId,
  houseTitle,
  orderType,
  customerName,
  customerEmail,
  customerPhone,
  userRole
}) => {
  const { theme } = useTheme();
  const { user: authUser } = useAuth();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [newMessage, setNewMessage] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const themeStyles = {
    primaryColor: theme === 'dark' ? '#00ffff' : '#8B5CF6',
    headerBg: theme === 'dark' 
      ? 'linear-gradient(135deg, #00ffff, #00b3b3)' 
      : 'linear-gradient(135deg, #8B5CF6, #EC4899)',
  };

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/messages/order/${orderId}`);
      const messagesData = response.data || [];
      
      setMessages(messagesData);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (error: any) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && orderId) {
      fetchMessages();
      
      // Poll for new messages every 10 seconds
      const interval = setInterval(() => {
        if (open) fetchMessages();
      }, 10000);
      
      return () => clearInterval(interval);
    }
  }, [open, orderId]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) {
      setError('Please enter a message');
      return;
    }
    
    if (!houseId) {
      setError('Property information not found');
      return;
    }
    
    try {
      setSending(true);
      setError('');
      
      const messageData: any = {
        orderId,
        houseId,
        message: newMessage.trim(),
        subject: 'order-message',
      };
      
      // Set name based on user role
      if (userRole === 'customer') {
        messageData.name = authUser?.name || customerName || 'Customer';
        if (authUser?.email) messageData.email = authUser.email;
        if (authUser?.phone) messageData.phone = authUser.phone;
      } else {
        messageData.name = customerName || 'Customer';
        if (customerEmail) messageData.email = customerEmail;
        if (customerPhone) messageData.phone = customerPhone;
      }
      
      const response = await api.post('/messages', messageData);
      
      if (response.data) {
        setSuccess('Message sent successfully');
        setNewMessage('');
        await fetchMessages();
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to send message');
      console.error('Send message error:', error);
      
      // Clear error message after 3 seconds
      setTimeout(() => setError(''), 3000);
    } finally {
      setSending(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isOwnMessage = (message: Message) => {
    if (userRole === 'user') {
      // Customer's messages are ones they sent (no response yet)
      return !message.response || message.response?.length === 0;
    } else {
      // Manager/Admin messages are responses
      return message.response && message.response.length > 0;
    }
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
          height: { xs: '90vh', sm: '80vh' },
          display: 'flex',
          flexDirection: 'column'
        }
      }}
    >
      {/* Header */}
      <DialogTitle sx={{ 
        borderBottom: 1, 
        borderColor: 'divider',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        py: 2
      }}>
        <Box>
          <Typography variant="h6" sx={{ 
            fontWeight: 'bold',
            background: themeStyles.headerBg,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Conversation
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {houseTitle && `Property: ${houseTitle}`}
            {orderType && ` • ${orderType}`}
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>
      
      {/* Messages Area */}
      <DialogContent sx={{ 
        flex: 1, 
        overflowY: 'auto', 
        p: 2,
        display: 'flex',
        flexDirection: 'column'
      }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={32} sx={{ color: themeStyles.primaryColor }} />
          </Box>
        ) : messages.length === 0 ? (
          <Box sx={{ 
            textAlign: 'center', 
            py: 8,
            backgroundColor: theme === 'dark' ? '#1e293b' : '#f8f9fa',
            borderRadius: 2
          }}>
            <MessageIcon sx={{ fontSize: 48, color: theme === 'dark' ? '#334155' : '#d1d5db', mb: 2 }} />
            <Typography variant="body1" color="text.secondary">
              No messages yet
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Start the conversation by sending a message
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <AnimatePresence>
              {messages.map((message, index) => {
                const isOwn = isOwnMessage(message);
                const hasResponse = message.response && message.response.length > 0;
                
                return (
                  <React.Fragment key={message._id}>
                    {/* Customer/User Message */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      style={{ display: 'flex', justifyContent: isOwn ? 'flex-end' : 'flex-start' }}
                    >
                      <Box sx={{ maxWidth: '80%' }}>
                        {!isOwn && (
                          <Typography variant="caption" sx={{ display: 'block', mb: 0.5, ml: 1, color: themeStyles.primaryColor }}>
                            {userRole === 'customer' ? 'Support Team' : (message.name || 'Customer')}
                          </Typography>
                        )}
                        <Paper
                          elevation={0}
                          sx={{
                            p: 2,
                            borderRadius: 2,
                            backgroundColor: isOwn 
                              ? (theme === 'dark' ? '#00ffff20' : '#8B5CF610')
                              : (theme === 'dark' ? '#1e293b' : '#f0f0f0'),
                            color: isOwn 
                              ? (theme === 'dark' ? '#00ffff' : '#8B5CF6')
                              : (theme === 'dark' ? '#ccd6f6' : '#333333')
                          }}
                        >
                          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                            {message.message}
                          </Typography>
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 0.5, mt: 1 }}>
                            <Typography variant="caption" color="text.secondary">
                              {formatDate(message.createdAt)}
                            </Typography>
                            {isOwn && hasResponse && (
                              <DoneAll sx={{ fontSize: 12, color: '#10B981' }} />
                            )}
                          </Box>
                        </Paper>
                      </Box>
                    </motion.div>
                    
                    {/* Response from Admin/Manager */}
                    {hasResponse && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.1 }}
                        style={{ display: 'flex', justifyContent: 'flex-start' }}
                      >
                        <Box sx={{ maxWidth: '80%' }}>
                          <Typography variant="caption" sx={{ display: 'block', mb: 0.5, ml: 1, color: '#10B981' }}>
                            {userRole === 'customer' ? 'Support Team Response' : 'Your Response'}
                          </Typography>
                          <Paper
                            elevation={0}
                            sx={{
                              p: 2,
                              borderRadius: 2,
                              backgroundColor: theme === 'dark' ? '#1e293b' : '#f0f0f0',
                              borderLeft: `3px solid #10B981`
                            }}
                          >
                            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                              {message.response}
                            </Typography>
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 0.5, mt: 1 }}>
                              <Typography variant="caption" color="text.secondary">
                                {message.respondedAt && formatDate(message.respondedAt)}
                              </Typography>
                              <CheckCircle sx={{ fontSize: 12, color: '#10B981' }} />
                            </Box>
                          </Paper>
                        </Box>
                      </motion.div>
                    )}
                  </React.Fragment>
                );
              })}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </Box>
        )}
      </DialogContent>
      
      {/* Message Input */}
      <Box sx={{ 
        p: 2, 
        borderTop: 1, 
        borderColor: 'divider',
        display: 'flex',
        gap: 1,
        alignItems: 'center'
      }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Type your message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && !sending && handleSendMessage()}
          multiline
          maxRows={3}
          disabled={sending}
          sx={{
            '& .MuiOutlinedInput-root': {
              backgroundColor: theme === 'dark' ? '#1e293b' : 'white',
              borderRadius: 3
            }
          }}
        />
        <IconButton
          onClick={handleSendMessage}
          disabled={sending || !newMessage.trim()}
          sx={{ color: themeStyles.primaryColor }}
        >
          {sending ? <CircularProgress size={24} /> : <Send />}
        </IconButton>
      </Box>
      
      {/* Notifications */}
      <Snackbar 
        open={!!error} 
        autoHideDuration={3000} 
        onClose={() => setError('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity="error" onClose={() => setError('')} sx={{ borderRadius: 2 }}>
          {error}
        </Alert>
      </Snackbar>
      
      <Snackbar 
        open={!!success} 
        autoHideDuration={3000} 
        onClose={() => setSuccess('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity="success" onClose={() => setSuccess('')} sx={{ borderRadius: 2 }}>
          {success}
        </Alert>
      </Snackbar>
    </Dialog>
  );
};

export default MessageConversation;