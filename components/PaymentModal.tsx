'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  Stepper,
  Step,
  StepLabel,
  Chip,
  Paper,
  useMediaQuery
} from '@mui/material';
import {
  Close,
  ArrowForward,
  Phone,
  AccountBalance,
  AttachMoney,
  ContentCopy,
  Check,
  Receipt,
  ShoppingCart
} from '@mui/icons-material';
import { useTheme } from '@/lib/theme-context';
import api from '@/app/utils/api';

interface PaymentConfig {
  telebirr: {
    phone: string;
    name: string;
  };
  cbe: {
    account: string;
    name: string;
  };
}

interface FormData {
  method: 'telebirr' | 'cbe' | 'cash';
  transactionId: string;
  senderPhone: string;
  description: string;
}

interface Transaction {
  _id: string;
  reference: string;
  amount: number;
  status: string;
  class: string;
  type: string;
  method: string;
  description: string;
  createdAt: string;
  houseId?: {
    _id: string;
    title: string;
  };
}

interface PaymentModalProps {
  open: boolean;
  onClose: () => void;
  houseId: string;
  houseTitle: string;
  amount: number;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  open,
  onClose,
  houseId,
  houseTitle,
  amount
}) => {
  const { theme } = useTheme();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [activeStep, setActiveStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig>({
    telebirr: { phone: '', name: '' },
    cbe: { account: '', name: '' }
  });
  const [formData, setFormData] = useState<FormData>({
    method: 'telebirr',
    transactionId: '',
    senderPhone: '',
    description: ''
  });
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [amountInWords, setAmountInWords] = useState('');

  const steps = ['Payment Method', 'Payment Details', 'Confirmation'];

  useEffect(() => {
    if (open && amount > 0) {
      fetchPaymentConfig();
      convertAmountToWords();
      // Reset step when modal opens
      setActiveStep(0);
      setErrorMessage('');
      setSuccessMessage('');
    }
  }, [open, amount]);

  const convertAmountToWords = async () => {
    const words = await convertNumberToWords(amount);
    setAmountInWords(words);
  };

  const convertNumberToWords = async (num: number): Promise<string> => {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    
    if (num === 0) return 'Zero';
    
    const convertBelowThousand = (n: number): string => {
      if (n === 0) return '';
      
      let result = '';
      
      if (n >= 100) {
        result += ones[Math.floor(n / 100)] + ' Hundred ';
        n %= 100;
      }
      
      if (n >= 20) {
        result += tens[Math.floor(n / 10)] + ' ';
        n %= 10;
      } else if (n >= 10) {
        result += teens[n - 10] + ' ';
        return result.trim();
      }
      
      if (n > 0) {
        result += ones[n] + ' ';
      }
      
      return result.trim();
    };
    
    let words = '';
    let number = Math.floor(num);
    
    if (number >= 1000) {
      words += convertBelowThousand(Math.floor(number / 1000)) + ' Thousand ';
      number %= 1000;
    }
    
    if (number > 0) {
      words += convertBelowThousand(number) + ' ';
    }
    
    return words.trim() + ' Birr';
  };

  const fetchPaymentConfig = async () => {
    try {
      const res = await api.get('/accountants?blocked=false');
      const accountants = res.data.data;
      
      if (accountants && accountants.length > 0) {
        const latestAccountant = accountants[0];
        setPaymentConfig({
          telebirr: {
            phone: latestAccountant.phoneNumber || '0912345678',
            name: latestAccountant.fullName || 'Tepi Giby Gubaye'
          },
          cbe: {
            account: latestAccountant.accountNumber || '1000123456789',
            name: latestAccountant.fullName || 'Tepi Giby Gubaye'
          }
        });
      } else {
        setPaymentConfig({
          telebirr: { phone: '0912345678', name: 'Tepi Giby Gubaye' },
          cbe: { account: '1000123456789', name: 'Tepi Giby Gubaye' }
        });
      }
    } catch (error) {
      console.error('Failed to fetch payment config:', error);
      setPaymentConfig({
        telebirr: { phone: '0912345678', name: 'Tepi Giby Gubaye' },
        cbe: { account: '1000123456789', name: 'Tepi Giby Gubaye' }
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSuccessMessage('Copied to clipboard!');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errorMessage) setErrorMessage('');
  };

  const validateStep = (): boolean => {
    if (activeStep === 0) {
      if (!formData.method) {
        setErrorMessage('Please select a payment method');
        return false;
      }
      return true;
    }
    
    if (activeStep === 1) {
      if (formData.method === 'telebirr' || formData.method === 'cbe') {
        if (!formData.senderPhone) {
          setErrorMessage(`Please enter your ${formData.method === 'telebirr' ? 'phone number' : 'account number'}`);
          return false;
        }
        if (!formData.transactionId) {
          setErrorMessage('Please enter the transaction ID');
          return false;
        }
      }
      return true;
    }
    
    return true;
  };

  const handleNext = () => {
    if (validateStep()) {
      setErrorMessage('');
      setActiveStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
    setErrorMessage('');
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setErrorMessage('');
    
    try {
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      
      if (!user || !user._id) {
        throw new Error('Please login to continue');
      }
      
      const payload = {
        userId: user._id,
        houseId: houseId,
        amount: amount,
        type: 'deposit',
        method: formData.method,
        transactionId: (formData.method === 'telebirr' || formData.method === 'cbe') ? formData.transactionId : undefined,
        senderPhone: (formData.method === 'telebirr' || formData.method === 'cbe') ? formData.senderPhone : undefined,
        senderName: user.name,
        receiverPhone: formData.method === 'telebirr' ? paymentConfig.telebirr.phone : 
                      formData.method === 'cbe' ? paymentConfig.cbe.account : undefined,
        receiverName: formData.method === 'telebirr' ? paymentConfig.telebirr.name : 
                      formData.method === 'cbe' ? paymentConfig.cbe.name : undefined,
        description: formData.description || `Payment for ${houseTitle}`,
        amountInString: amountInWords
      };

      console.log('Sending payment payload:', payload);
      
      const res = await api.post('/transactions', payload);
      
      console.log('Payment response:', res.data);
      
      if (res.data.success) {
        setTransaction(res.data.data);
        setActiveStep(2);
        setSuccessMessage('Payment request submitted successfully!');
      } else {
        throw new Error(res.data.message || 'Payment submission failed');
      }
    } catch (err: any) {
      console.error('Payment error:', err);
      console.error('Error response:', err.response?.data);
      setErrorMessage(err.response?.data?.message || err.message || 'Failed to submit payment request');
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const handleClose = () => {
    setActiveStep(0);
    setFormData({
      method: 'telebirr',
      transactionId: '',
      senderPhone: '',
      description: ''
    });
    setTransaction(null);
    setErrorMessage('');
    setSuccessMessage('');
    onClose();
  };

  const renderStep0 = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Typography variant="body1" sx={{ mb: 2 }}>
        Select your preferred payment method for <strong>{formatCurrency(amount)}</strong>
      </Typography>
      
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
        {[
          { value: 'telebirr' as const, label: 'TeleBirr', icon: <Phone />, color: '#10b981' },
          { value: 'cbe' as const, label: 'CBE Birr', icon: <AccountBalance />, color: '#3b82f6' },
          { value: 'cash' as const, label: 'Cash', icon: <AttachMoney />, color: '#f59e0b' }
        ].map((option) => (
          <Box
            key={option.value}
            onClick={() => handleChange('method', option.value)}
            sx={{
              flex: 1,
              p: 3,
              borderRadius: 2,
              border: `2px solid ${formData.method === option.value ? option.color : theme === 'dark' ? '#334155' : '#e5e7eb'}`,
              backgroundColor: formData.method === option.value 
                ? `${option.color}20` 
                : (theme === 'dark' ? '#1e293b' : '#f9fafb'),
              cursor: 'pointer',
              textAlign: 'center',
              transition: 'all 0.2s',
              '&:hover': {
                borderColor: option.color,
                transform: 'translateY(-2px)'
              }
            }}
          >
            <Box sx={{ color: option.color, fontSize: 32, mb: 1 }}>
              {option.icon}
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              {option.label}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );

  const renderStep1 = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box sx={{ p: 2, bgcolor: theme === 'dark' ? '#1e293b' : '#f8fafc', borderRadius: 2 }}>
        <Typography variant="subtitle2" sx={{ mb: 1, color: theme === 'dark' ? '#00ffff' : '#007bff' }}>
          Payment Details
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2">Amount:</Typography>
          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{formatCurrency(amount)}</Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="body2">Amount in Words:</Typography>
          <Typography variant="caption" sx={{ textAlign: 'right' }}>{amountInWords}</Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
          <Typography variant="body2">Property:</Typography>
          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{houseTitle}</Typography>
        </Box>
      </Box>
      
      {(formData.method === 'telebirr' || formData.method === 'cbe') && (
        <>
          <Box sx={{ p: 2, bgcolor: theme === 'dark' ? '#1e293b' : '#f8fafc', borderRadius: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, color: theme === 'dark' ? '#00ffff' : '#007bff' }}>
              Send payment to:
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="body2">
                {formData.method === 'telebirr' ? 'Phone Number:' : 'Account Number:'}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                  {formData.method === 'telebirr' ? paymentConfig.telebirr.phone : paymentConfig.cbe.account}
                </Typography>
                <Tooltip title="Copy">
                  <IconButton size="small" onClick={() => copyToClipboard(formData.method === 'telebirr' ? paymentConfig.telebirr.phone : paymentConfig.cbe.account)}>
                    <ContentCopy sx={{ fontSize: 16 }} />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2">Account Name:</Typography>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                {formData.method === 'telebirr' ? paymentConfig.telebirr.name : paymentConfig.cbe.name}
              </Typography>
            </Box>
          </Box>
          
          <TextField
            fullWidth
            label={`Your ${formData.method === 'telebirr' ? 'Phone Number' : 'Account Number'}`}
            value={formData.senderPhone}
            onChange={(e) => handleChange('senderPhone', e.target.value)}
            required
            placeholder={formData.method === 'telebirr' ? '09xxxxxxxx' : 'Enter account number'}
            InputProps={{ startAdornment: <Phone sx={{ mr: 1, fontSize: 20 }} /> }}
          />
          
          <TextField
            fullWidth
            label="Transaction ID / Reference"
            value={formData.transactionId}
            onChange={(e) => handleChange('transactionId', e.target.value)}
            required
            placeholder="Enter the transaction ID from your payment"
            helperText="You can find this in your payment confirmation"
          />
        </>
      )}
      
      <TextField
        fullWidth
        label="Description (Optional)"
        value={formData.description}
        onChange={(e) => handleChange('description', e.target.value)}
        multiline
        rows={2}
        placeholder="Any additional notes for the agent..."
      />
    </Box>
  );

  const renderStep2 = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {successMessage}
        </Alert>
      )}
      
      <Box sx={{ textAlign: 'center', p: 3 }}>
        <Box sx={{ width: 80, height: 80, borderRadius: '50%', bgcolor: '#10b98120', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2 }}>
          <Receipt sx={{ fontSize: 40, color: '#10b981' }} />
        </Box>
        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
          Payment Request Submitted!
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Your payment request has been submitted successfully. Our team will verify your payment and update the status shortly.
        </Typography>
      </Box>
      
      {transaction && (
        <Paper sx={{ p: 2, bgcolor: theme === 'dark' ? '#1e293b' : '#f8fafc' }}>
          <Typography variant="subtitle2" sx={{ mb: 1, color: theme === 'dark' ? '#00ffff' : '#007bff' }}>
            Transaction Summary
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2">Reference:</Typography>
            <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>{transaction.reference}</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2">Amount:</Typography>
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{formatCurrency(transaction.amount)}</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2">Property:</Typography>
            <Typography variant="body2">{houseTitle}</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2">Status:</Typography>
            <Chip 
              label={transaction.status} 
              size="small" 
              color={transaction.status === 'pending' ? 'warning' : 'success'}
              sx={{ height: 20 }}
            />
          </Box>
        </Paper>
      )}
    </Box>
  );

  // Determine if we're on the last step
  const isLastStep = activeStep === steps.length - 1;
  // Determine if we're on the confirmation step (after submission)
  const isConfirmationStep = activeStep === 2 && transaction !== null;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          borderRadius: 3,
          backgroundColor: theme === 'dark' ? '#0f172a' : 'white',
          color: theme === 'dark' ? '#ccd6f6' : '#333333'
        }
      }}
    >
      <DialogTitle sx={{ 
        borderBottom: 1, 
        borderColor: 'divider',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        py: 2
      }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Payment for {houseTitle}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Amount: {formatCurrency(amount)}
          </Typography>
        </Box>
        <IconButton onClick={handleClose}>
          <Close />
        </IconButton>
      </DialogTitle>
      
      {/* Only show stepper if not on confirmation step */}
      {!isConfirmationStep && (
        <Stepper activeStep={activeStep} sx={{ px: 3, pt: 3 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      )}
      
      <DialogContent sx={{ p: 3, minHeight: 400 }}>
        {errorMessage && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errorMessage}
          </Alert>
        )}
        
        {activeStep === 0 && renderStep0()}
        {activeStep === 1 && renderStep1()}
        {activeStep === 2 && renderStep2()}
      </DialogContent>
      
      <DialogActions sx={{ p: 3, borderTop: 1, borderColor: 'divider' }}>
        {isConfirmationStep ? (
          <Button
            variant="contained"
            onClick={handleClose}
            sx={{
              background: theme === 'dark' ? 'linear-gradient(135deg, #00ffff, #00b3b3)' : 'linear-gradient(135deg, #007bff, #0056b3)'
            }}
          >
            Close
          </Button>
        ) : (
          <Box sx={{ display: 'flex', gap: 2, width: '100%' }}>
            {activeStep > 0 && (
              <Button
                variant="outlined"
                onClick={handleBack}
                disabled={submitting}
                sx={{ flex: 1 }}
              >
                Back
              </Button>
            )}
            {activeStep === 1 ? (
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={submitting}
                startIcon={submitting ? <CircularProgress size={20} /> : <ShoppingCart />}
                sx={{
                  flex: 1,
                  background: theme === 'dark' ? 'linear-gradient(135deg, #00ff00, #00b300)' : 'linear-gradient(135deg, #28a745, #218838)',
                  '&:hover': {
                    background: theme === 'dark' ? 'linear-gradient(135deg, #00b300, #008000)' : 'linear-gradient(135deg, #218838, #1e7e34)'
                  }
                }}
              >
                {submitting ? 'Processing...' : 'Submit Payment'}
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleNext}
                disabled={submitting}
                startIcon={<ArrowForward />}
                sx={{
                  flex: 1,
                  background: theme === 'dark' ? 'linear-gradient(135deg, #00ffff, #00b3b3)' : 'linear-gradient(135deg, #007bff, #0056b3)',
                  '&:hover': {
                    background: theme === 'dark' ? 'linear-gradient(135deg, #00b3b3, #008080)' : 'linear-gradient(135deg, #0056b3, #004080)'
                  }
                }}
              >
                Next
              </Button>
            )}
          </Box>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default PaymentModal;