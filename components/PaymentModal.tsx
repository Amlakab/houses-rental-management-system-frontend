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
import { useLanguage } from '@/lib/language-context';
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
  const { t, language } = useLanguage();
  const isDark = theme === 'dark';
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

  const steps = [
    language === 'am' ? 'የክፍያ ዘዴ' : 'Payment Method',
    language === 'am' ? 'የክፍያ ዝርዝር' : 'Payment Details',
    language === 'am' ? 'ማረጋገጫ' : 'Confirmation'
  ];

  const textFieldStyle = {
    '& .MuiOutlinedInput-root': {
      backgroundColor: isDark ? '#0a192f' : '#ffffff',
      color: isDark ? '#f1f5f9' : '#0f172a',
      borderRadius: '10px',
      '& fieldset': { borderColor: isDark ? '#233554' : '#cbd5e1' },
      '&:hover fieldset': { borderColor: isDark ? '#38bdf8' : '#2563eb' },
      '&.Mui-focused fieldset': { borderColor: isDark ? '#38bdf8' : '#2563eb' }
    },
    '& .MuiInputLabel-root': { color: isDark ? '#94a3b8' : '#64748b' },
    '& .MuiFormHelperText-root': { color: isDark ? '#94a3b8' : '#64748b' }
  };

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
      <Typography variant="body1" sx={{ color: isDark ? '#f1f5f9' : '#0f172a' }}>
        {language === 'am' ? 'እባክዎ ለ' : 'Select your preferred payment method for'}{' '}
        <strong style={{ color: isDark ? '#38bdf8' : '#2563eb' }}>{formatCurrency(amount)}</strong>{' '}
        {language === 'am' ? 'የሚመርጡትን የክፍያ ዘዴ ይምረጡ' : ''}
      </Typography>
      
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
        {[
          { value: 'telebirr' as const, label: 'TeleBirr (ቴሌብር)', icon: <Phone />, color: '#10b981' },
          { value: 'cbe' as const, label: 'CBE Birr (ንግድ ባንክ)', icon: <AccountBalance />, color: '#38bdf8' },
          { value: 'cash' as const, label: language === 'am' ? 'ጥሬ ገንዘብ' : 'Cash', icon: <AttachMoney />, color: '#f59e0b' }
        ].map((option) => (
          <Box
            key={option.value}
            onClick={() => handleChange('method', option.value)}
            sx={{
              flex: 1,
              p: 3,
              borderRadius: 3,
              border: `2px solid ${formData.method === option.value ? option.color : isDark ? '#233554' : '#e2e8f0'}`,
              backgroundColor: formData.method === option.value 
                ? `${option.color}15` 
                : (isDark ? '#0a192f' : '#f8fafc'),
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
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: isDark ? '#f1f5f9' : '#0f172a', fontSize: '1rem' }}>
              {option.label}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );

  const renderStep1 = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box sx={{ p: 2.5, bgcolor: isDark ? '#0a192f' : '#f8fafc', border: `1px solid ${isDark ? '#233554' : '#e2e8f0'}`, borderRadius: 2.5 }}>
        <Typography variant="subtitle2" sx={{ mb: 1.5, color: isDark ? '#38bdf8' : '#2563eb', fontWeight: 700 }}>
          {language === 'am' ? 'የክፍያ ዝርዝር መረጃ' : 'Payment Details'}
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>
            {language === 'am' ? 'የክፍያ መጠን፡' : 'Amount:'}
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: isDark ? '#f1f5f9' : '#0f172a' }}>
            {formatCurrency(amount)}
          </Typography>
        </Box>
        {amountInWords && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>
              {language === 'am' ? 'በፊደል፡' : 'Amount in Words:'}
            </Typography>
            <Typography variant="caption" sx={{ textAlign: 'right', color: isDark ? '#f1f5f9' : '#0f172a', fontWeight: 500 }}>
              {amountInWords}
            </Typography>
          </Box>
        )}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
          <Typography variant="body2" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>
            {language === 'am' ? 'ንብረት፡' : 'Property:'}
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: isDark ? '#f1f5f9' : '#0f172a' }}>
            {houseTitle}
          </Typography>
        </Box>
      </Box>
      
      {(formData.method === 'telebirr' || formData.method === 'cbe') && (
        <>
          <Box sx={{ p: 2.5, bgcolor: isDark ? '#0a192f' : '#f8fafc', border: `1px solid ${isDark ? '#233554' : '#e2e8f0'}`, borderRadius: 2.5 }}>
            <Typography variant="subtitle2" sx={{ mb: 1.5, color: isDark ? '#38bdf8' : '#2563eb', fontWeight: 700 }}>
              {language === 'am' ? 'ክፍያውን ወደዚህ አካውንት ያስገቡ፡' : 'Send payment to:'}
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="body2" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>
                {formData.method === 'telebirr' ? (language === 'am' ? 'የስልክ ቁጥር፡' : 'Phone Number:') : (language === 'am' ? 'የሂሳብ ቁጥር፡' : 'Account Number:')}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold', fontFamily: 'monospace', color: isDark ? '#f1f5f9' : '#0f172a' }}>
                  {formData.method === 'telebirr' ? paymentConfig.telebirr.phone : paymentConfig.cbe.account}
                </Typography>
                <Tooltip title={language === 'am' ? 'ቅዳ' : 'Copy'}>
                  <IconButton size="small" onClick={() => copyToClipboard(formData.method === 'telebirr' ? paymentConfig.telebirr.phone : paymentConfig.cbe.account)} sx={{ color: isDark ? '#38bdf8' : '#2563eb' }}>
                    <ContentCopy sx={{ fontSize: 16 }} />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>
                {language === 'am' ? 'የአካውንቱ ስም፡' : 'Account Name:'}
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 'bold', color: isDark ? '#f1f5f9' : '#0f172a' }}>
                {formData.method === 'telebirr' ? paymentConfig.telebirr.name : paymentConfig.cbe.name}
              </Typography>
            </Box>
          </Box>
          
          <TextField
            fullWidth
            label={formData.method === 'telebirr' ? (language === 'am' ? 'የእርስዎ ስልክ ቁጥር' : 'Your Phone Number') : (language === 'am' ? 'የእርስዎ ሂሳብ ቁጥር' : 'Your Account Number')}
            value={formData.senderPhone}
            onChange={(e) => handleChange('senderPhone', e.target.value)}
            required
            placeholder={formData.method === 'telebirr' ? '09xxxxxxxx' : '1000...'}
            InputProps={{ startAdornment: <Phone sx={{ mr: 1, fontSize: 20, color: isDark ? '#94a3b8' : '#64748b' }} /> }}
            sx={textFieldStyle}
          />
          
          <TextField
            fullWidth
            label={language === 'am' ? 'የዝውውር ማረጋገጫ ቁጥር (Transaction ID / Ref)' : 'Transaction ID / Reference'}
            value={formData.transactionId}
            onChange={(e) => handleChange('transactionId', e.target.value)}
            required
            placeholder={language === 'am' ? 'የክፍያውን ማረጋገጫ ቁጥር እዚህ ያስገቡ' : 'Enter the transaction ID from your payment'}
            helperText={language === 'am' ? 'ይህንን ቁጥር በክፍያ መልእክትዎ ላይ ማግኘት ይችላሉ' : 'You can find this in your payment confirmation'}
            sx={textFieldStyle}
          />
        </>
      )}
      
      <TextField
        fullWidth
        label={language === 'am' ? 'ተጨማሪ ማስታወሻ (አስፈላጊ ከሆነ)' : 'Description (Optional)'}
        value={formData.description}
        onChange={(e) => handleChange('description', e.target.value)}
        multiline
        rows={2}
        placeholder={language === 'am' ? 'ለክፍያው ተጨማሪ ማስታወሻ ካለ...' : 'Any additional notes for the agent...'}
        sx={textFieldStyle}
      />
    </Box>
  );

  const renderStep2 = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {successMessage && (
        <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>
          {successMessage}
        </Alert>
      )}
      
      <Box sx={{ textAlign: 'center', p: 3 }}>
        <Box sx={{ width: 80, height: 80, borderRadius: '50%', bgcolor: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2 }}>
          <Receipt sx={{ fontSize: 40, color: '#10b981' }} />
        </Box>
        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1, color: isDark ? '#f1f5f9' : '#0f172a' }}>
          {language === 'am' ? 'የክፍያ ጥያቄው በተሳካ ሁኔታ ገብቷል!' : 'Payment Request Submitted!'}
        </Typography>
        <Typography variant="body2" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>
          {language === 'am' 
            ? 'የክፍያ ጥያቄዎ በተሳካ ሁኔታ ተልኳል። ቡድናችን ክፍያውን አረጋግጦ ሁኔታውን በቅርቡ ያሳውቃል።'
            : 'Your payment request has been submitted successfully. Our team will verify your payment and update the status shortly.'}
        </Typography>
      </Box>
      
      {transaction && (
        <Paper sx={{ p: 2.5, bgcolor: isDark ? '#0a192f' : '#f8fafc', border: `1px solid ${isDark ? '#233554' : '#e2e8f0'}`, borderRadius: 2.5 }}>
          <Typography variant="subtitle2" sx={{ mb: 1.5, color: isDark ? '#38bdf8' : '#2563eb', fontWeight: 700 }}>
            {language === 'am' ? 'የዝውውር ማጠቃለያ' : 'Transaction Summary'}
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>
              {language === 'am' ? 'ማጣቀሻ ቁጥር፡' : 'Reference:'}
            </Typography>
            <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 600, color: isDark ? '#f1f5f9' : '#0f172a' }}>
              {transaction.reference}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>
              {language === 'am' ? 'መጠን፡' : 'Amount:'}
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 'bold', color: isDark ? '#f1f5f9' : '#0f172a' }}>
              {formatCurrency(transaction.amount)}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>
              {language === 'am' ? 'ንብረት፡' : 'Property:'}
            </Typography>
            <Typography variant="body2" sx={{ color: isDark ? '#f1f5f9' : '#0f172a' }}>
              {houseTitle}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>
              {language === 'am' ? 'ሁኔታ፡' : 'Status:'}
            </Typography>
            <Chip 
              label={transaction.status} 
              size="small" 
              color={transaction.status === 'pending' ? 'warning' : 'success'}
              sx={{ height: 22, fontWeight: 600 }}
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
          borderRadius: isMobile ? 0 : 3,
          backgroundColor: isDark ? '#112240' : '#ffffff',
          border: isDark ? '1px solid #233554' : '1px solid #e2e8f0',
          color: isDark ? '#f1f5f9' : '#0f172a'
        }
      }}
    >
      <DialogTitle sx={{ 
        borderBottom: `1px solid ${isDark ? '#233554' : '#e2e8f0'}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        py: 2
      }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 'bold', color: isDark ? '#f1f5f9' : '#0f172a' }}>
            {language === 'am' ? 'ለቤት ክፍያ ፈጽም' : `Payment for ${houseTitle}`}
          </Typography>
          <Typography variant="body2" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>
            {language === 'am' ? 'የክፍያ መጠን፡' : 'Amount:'} <strong style={{ color: isDark ? '#38bdf8' : '#2563eb' }}>{formatCurrency(amount)}</strong>
          </Typography>
        </Box>
        <IconButton onClick={handleClose} sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>
          <Close />
        </IconButton>
      </DialogTitle>
      
      {/* Only show stepper if not on confirmation step */}
      {!isConfirmationStep && (
        <Stepper
          activeStep={activeStep}
          sx={{
            px: 3,
            pt: 3,
            '& .MuiStepLabel-label': { color: isDark ? '#94a3b8' : '#64748b' },
            '& .MuiStepLabel-label.Mui-active': { color: isDark ? '#38bdf8' : '#2563eb', fontWeight: 700 },
            '& .MuiStepLabel-label.Mui-completed': { color: '#10b981' }
          }}
        >
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      )}
      
      <DialogContent sx={{ p: 3, minHeight: 350 }}>
        {errorMessage && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
            {errorMessage}
          </Alert>
        )}
        
        {activeStep === 0 && renderStep0()}
        {activeStep === 1 && renderStep1()}
        {activeStep === 2 && renderStep2()}
      </DialogContent>
      
      <DialogActions sx={{ p: 2.5, borderTop: `1px solid ${isDark ? '#233554' : '#e2e8f0'}` }}>
        {isConfirmationStep ? (
          <Button
            variant="contained"
            onClick={handleClose}
            sx={{
              bgcolor: isDark ? '#38bdf8' : '#2563eb',
              borderRadius: '8px',
              textTransform: 'none',
              px: 3
            }}
          >
            {t('action.close', 'Close')}
          </Button>
        ) : (
          <Box sx={{ display: 'flex', gap: 2, width: '100%', flexDirection: { xs: 'column-reverse', sm: 'row' } }}>
            {activeStep > 0 && (
              <Button
                variant="outlined"
                onClick={handleBack}
                disabled={submitting}
                sx={{
                  flex: 1,
                  borderRadius: '10px',
                  borderColor: isDark ? '#233554' : '#cbd5e1',
                  color: isDark ? '#f1f5f9' : '#0f172a',
                  textTransform: 'none'
                }}
              >
                {t('action.previous', 'Back')}
              </Button>
            )}
            {activeStep === 1 ? (
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={submitting}
                startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <ShoppingCart />}
                sx={{
                  flex: 1,
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  borderRadius: '10px',
                  py: 1,
                  fontWeight: 600,
                  textTransform: 'none'
                }}
              >
                {submitting ? (language === 'am' ? 'በማስገባት ላይ...' : 'Processing...') : (language === 'am' ? 'ክፍያውን አስገባ' : 'Submit Payment')}
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleNext}
                disabled={submitting}
                startIcon={<ArrowForward />}
                sx={{
                  flex: 1,
                  bgcolor: isDark ? '#38bdf8' : '#2563eb',
                  borderRadius: '10px',
                  py: 1,
                  fontWeight: 600,
                  textTransform: 'none'
                }}
              >
                {t('action.next', 'Next')}
              </Button>
            )}
          </Box>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default PaymentModal;