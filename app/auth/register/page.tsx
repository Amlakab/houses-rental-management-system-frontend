'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box, Typography, Card, CardContent,
  TextField, Alert, Snackbar, CircularProgress,
  useMediaQuery, Button, Avatar,
  FormControl, InputLabel, Select, MenuItem,
  Stepper, Step, StepLabel,
  IconButton, Divider, Checkbox, FormControlLabel,
  Chip, Autocomplete
} from '@mui/material';
import { motion } from 'framer-motion';
import { useTheme } from '@/lib/theme-context';
import {
  PersonAdd, CheckCircle, Edit,
  Upload, Person, Phone, Email,
  Cake, Work, School, Home,
  Church, Business, Translate,
  ArrowBack, ArrowForward,
  AssignmentTurnedIn,
  CalendarToday, Female, Male,
  PersonPin, Call, LocationOn,
  AccountBalance, Language, Badge,
  AccessTime, SupervisorAccount, Description,
  AdminPanelSettings
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format } from 'date-fns';
import api from '@/app/utils/api';
import Navbar from '@/components/ui/Navbar';

// Form data interface - MATCHING STUDENT PAGE
interface FormData {
  // Personal Information
  firstName: string;
  middleName: string;
  lastName: string;
  motherName: string;
  phone: string;
  email: string;
  gender: 'male' | 'female';
  dateOfBirth: Date | null;
  emergencyContact: string;
  
  // Academic Information
  university: string;
  college: string;
  department: string;
  batch: string;
  block: string;
  dorm: string;
  
  // Address Information
  region: string;
  zone: string;
  wereda: string;
  kebele: string;
  
  // Religious Information
  church: string;
  authority: string;
  
  // Language Information
  motherTongue: string;
  additionalLanguages: string[];
  
  // Course Information
  attendsCourse: boolean;
  courseName: string;
  courseChurch: string;
  
  // Other Information
  job: string;
}

// Form errors interface
type FormErrors = Partial<Record<keyof FormData, string>>;

// Options for dropdowns
const universities = [
  'Addis Ababa University',
  'Addis Ababa Science and Technology University',
  'Bahir Dar University',
  'Hawassa University',
  'Mekelle University',
  'Jimma University',
  'University of Gondar',
  'Arba Minch University',
  'Haramaya University',
  'Wollega University',
  'Debre Markos University',
  'Dire Dawa University',
  'Wollo University',
  'Dilla University',
  'Mizan-Tepi University',
  'Wolaita Sodo University'
];

const colleges = [
  'College of Engineering and Technology',
  'College of Natural and Computational Sciences',
  'College of Social Sciences and Humanities',
  'College of Business and Economics',
  'College of Agriculture and Environmental Sciences',
  'College of Health Sciences',
  'College of Law and Governance',
  'College of Education and Behavioral Sciences'
];

const departments = [
  'Computer Science',
  'Software Engineering',
  'Information Technology',
  'Electrical Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Chemical Engineering',
  'Biomedical Engineering',
  'Biology',
  'Chemistry',
  'Physics',
  'Mathematics',
  'Statistics',
  'Economics',
  'Business Administration',
  'Accounting',
  'Finance',
  'Marketing',
  'Psychology',
  'Sociology',
  'Law',
  'Medicine',
  'Nursing',
  'Pharmacy',
  'Public Health'
];

const batches = [
  '2019/2020',
  '2020/2021',
  '2021/2022',
  '2022/2023',
  '2023/2024',
  '2024/2025'
];

const regions = [
  'Addis Ababa',
  'Oromia',
  'Amhara',
  'Tigray',
  'SNNPR',
  'Somali',
  'Afar',
  'Benishangul-Gumuz',
  'Gambela',
  'Harari',
  'Dire Dawa'
];

const motherTongues = [
  'Amharic',
  'Oromiffa',
  'Tigrinya',
  'Somali',
  'Afar',
  'Sidamo',
  'Wolaytta',
  'Gurage',
  'Hadiyya',
  'English',
  'Other'
];

const languages = [
  'English',
  'Amharic',
  'Oromiffa',
  'Tigrinya',
  'French',
  'Arabic',
  'Spanish',
  'German',
  'Italian',
  'Chinese',
  'Japanese',
  'Korean'
];

const jobs = [
  'Student',
  'Teacher',
  'Engineer',
  'Doctor',
  'Nurse',
  'Accountant',
  'Manager',
  'Administrator',
  'Technician',
  'Researcher',
  'Entrepreneur',
  'Other'
];

// Helper component for responsive layout
const FormRow = ({ children, columns = 1, spacing = 2 }: { 
  children: React.ReactNode; 
  columns?: 1 | 2 | 3 | 4;
  spacing?: number;
}) => {
  return (
    <Box sx={{ 
      display: 'grid',
      gridTemplateColumns: { 
        xs: '1fr',
        sm: columns === 1 ? '1fr' : `repeat(${Math.min(columns, 2)}, 1fr)`,
        md: columns === 1 ? '1fr' : `repeat(${Math.min(columns, 3)}, 1fr)`,
        lg: columns === 1 ? '1fr' : `repeat(${columns}, 1fr)`
      },
      gap: spacing,
      mb: 3
    }}>
      {children}
    </Box>
  );
};

// Helper component for review fields
const ReviewField = ({ label, value, icon, theme, chip }: { 
  label: string; 
  value: string | string[]; 
  icon: React.ReactNode; 
  theme: string;
  chip?: boolean;
}) => {
  const displayValue = Array.isArray(value) ? value.join(', ') : value;
  
  return (
    <Box>
      <Typography variant="caption" color={theme === 'dark' ? '#a8b2d1' : '#666666'} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
        {icon} {label}
      </Typography>
      {chip && Array.isArray(value) ? (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {value.map((lang, index) => (
            <Chip
              key={index}
              label={lang}
              size="small"
              sx={{ 
                height: 22,
                fontSize: '0.7rem',
                backgroundColor: theme === 'dark' ? '#334155' : '#e5e7eb'
              }}
            />
          ))}
        </Box>
      ) : (
        <Typography variant="body1" sx={{ 
          fontWeight: 'medium', 
          color: theme === 'dark' ? '#ccd6f6' : '#333333',
          minHeight: '24px'
        }}>
          {displayValue || <span style={{ color: theme === 'dark' ? '#94a3b8' : '#999999', fontStyle: 'italic' }}>Not provided</span>}
        </Typography>
      )}
    </Box>
  );
};

const RegistrationPage = () => {
  const { theme } = useTheme();
  const router = useRouter();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const isTablet = useMediaQuery('(max-width: 1024px)');
  
  // Stepper state
  const [activeStep, setActiveStep] = useState(0);
  const steps = ['Personal Information', 'Academic Details', 'Address & Language', 'Course & Review'];
  
  // Form states - ALL FIELDS FROM STUDENT PAGE
  const [formData, setFormData] = useState<FormData>({
    // Personal Information
    firstName: '',
    middleName: '',
    lastName: '',
    motherName: '',
    phone: '',
    email: '',
    gender: 'male',
    dateOfBirth: null,
    emergencyContact: '',
    
    // Academic Information
    university: '',
    college: '',
    department: '',
    batch: '',
    block: '',
    dorm: '',
    
    // Address Information
    region: '',
    zone: '',
    wereda: '',
    kebele: '',
    
    // Religious Information
    church: '',
    authority: '',
    
    // Language Information
    motherTongue: '',
    additionalLanguages: [],
    
    // Course Information
    attendsCourse: false,
    courseName: '',
    courseChurch: '',
    
    // Other Information
    job: '',
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [submittedData, setSubmittedData] = useState<FormData | null>(null);
  const [isReviewMode, setIsReviewMode] = useState(false);

  // Theme styles - MATCHING STUDENT PAGE
  const themeStyles = {
    background: theme === 'dark' 
      ? 'linear-gradient(135deg, #0a192f, #112240)' 
      : 'linear-gradient(135deg, #f0f0f0, #ffffff)',
    textColor: theme === 'dark' ? '#ccd6f6' : '#333333',
    primaryColor: theme === 'dark' ? '#00ffff' : '#007bff',
    borderColor: theme === 'dark' ? '#00ffff' : '#007bff',
    surface: theme === 'dark' ? '#1e293b' : '#ffffff',
    cardBg: theme === 'dark' ? '#0f172a80' : '#ffffff',
    cardBorder: theme === 'dark' ? '#334155' : '#e5e7eb',
    headerBg: theme === 'dark' 
      ? 'linear-gradient(135deg, #00ffff, #00b3b3)' 
      : 'linear-gradient(135deg, #007bff, #0056b3)',
    hoverBg: theme === 'dark' ? '#1e293b' : '#f8fafc',
    disabledBg: theme === 'dark' ? '#334155' : '#e5e7eb',
    disabledText: theme === 'dark' ? '#94a3b8' : '#94a3b8',
    buttonBg: theme === 'dark' 
      ? 'border-[#00ffff] text-[#00ffff] hover:bg-[#00ffff] hover:text-black' 
      : 'border-[#007bff] text-[#007bff] hover:bg-[#007bff] hover:text-white'
  };

  // Validation rules - UPDATED FOR ALL FIELDS
  const validateField = (name: keyof FormData, value: any): string => {
    switch (name) {
      case 'firstName':
        if (!value || !value.trim()) return 'First name is required';
        if (value.trim().length < 2) return 'First name must be at least 2 characters';
        return '';
      
      case 'lastName':
        if (!value || !value.trim()) return 'Last name is required';
        if (value.trim().length < 2) return 'Last name must be at least 2 characters';
        return '';
      
      case 'motherName':
        if (!value || !value.trim()) return 'Mother\'s name is required';
        if (value.trim().length < 2) return 'Mother\'s name must be at least 2 characters';
        return '';
      
      case 'phone':
        if (!value || !value.trim()) return 'Phone number is required';
        const phoneDigits = value.replace(/\D/g, '');
        if (phoneDigits.length < 9 || phoneDigits.length > 10) return 'Phone number must be 9-10 digits';
        return '';
      
      case 'email':
        if (!value || !value.trim()) return 'Email is required';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) return 'Invalid email address';
        return '';
      
      case 'emergencyContact':
        if (!value || !value.trim()) return 'Emergency contact is required';
        const emergencyDigits = value.replace(/\D/g, '');
        if (emergencyDigits.length < 9 || emergencyDigits.length > 10) return 'Emergency contact must be 9-10 digits';
        return '';
      
      case 'university':
        if (!value || !value.trim()) return 'University is required';
        return '';
      
      case 'college':
        if (!value || !value.trim()) return 'College is required';
        return '';
      
      case 'department':
        if (!value || !value.trim()) return 'Department is required';
        return '';
      
      case 'batch':
        if (!value || !value.trim()) return 'Batch is required';
        return '';
      
      case 'block':
        if (!value || !value.trim()) return 'Block is required';
        return '';
      
      case 'dorm':
        if (!value || !value.trim()) return 'Dorm is required';
        return '';
      
      case 'region':
        if (!value || !value.trim()) return 'Region is required';
        return '';
      
      case 'zone':
        if (!value || !value.trim()) return 'Zone is required';
        return '';
      
      case 'wereda':
        if (!value || !value.trim()) return 'Wereda is required';
        return '';
      
      case 'kebele':
        if (!value || !value.trim()) return 'Kebele is required';
        return '';
      
      case 'church':
        if (!value || !value.trim()) return 'Church is required';
        return '';
      
      case 'authority':
        if (!value || !value.trim()) return 'Authority is required';
        return '';
      
      case 'job':
        if (!value || !value.trim()) return 'Job is required';
        return '';
      
      case 'motherTongue':
        if (!value || !value.trim()) return 'Mother tongue is required';
        return '';
      
      case 'dateOfBirth':
        if (!value) return 'Date of birth is required';
        try {
          const birthDate = new Date(value);
          const today = new Date();
          let age = today.getFullYear() - birthDate.getFullYear();
          const monthDiff = today.getMonth() - birthDate.getMonth();
          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
          }
          if (age < 16) return 'Must be at least 16 years old';
          if (age > 100) return 'Invalid date of birth';
        } catch (err) {
          return 'Invalid date format';
        }
        return '';
      
      case 'additionalLanguages':
      case 'attendsCourse':
      case 'courseName':
      case 'courseChurch':
      case 'gender':
      case 'middleName':
        // These are optional or have default values
        return '';
      
      default:
        return '';
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: FormErrors = {};
    let stepFields: (keyof FormData)[] = [];
    
    switch (step) {
      case 0: // Personal Information
        stepFields = ['firstName', 'lastName', 'motherName', 'phone', 'email', 'gender', 'dateOfBirth', 'emergencyContact', 'job'];
        break;
      
      case 1: // Academic Details
        stepFields = ['university', 'college', 'department', 'batch', 'block', 'dorm'];
        break;
      
      case 2: // Address & Language
        stepFields = ['region', 'zone', 'wereda', 'kebele', 'church', 'authority', 'motherTongue'];
        break;
      
      case 3: // Course & Review
        if (formData.attendsCourse) {
          stepFields = ['courseName', 'courseChurch'];
        } else {
          stepFields = [];
        }
        break;
    }
    
    stepFields.forEach(field => {
      const error = validateField(field, formData[field]);
      if (error) {
        newErrors[field] = error;
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Photo size must be less than 5MB');
        return;
      }
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please upload an image file');
        return;
      }
      
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      if (activeStep === steps.length - 2) {
        // On the last step before review, submit for review
        setSubmittedData({ ...formData });
        setIsReviewMode(true);
      }
      setActiveStep(prev => prev + 1);
    } else {
      setError('Please fix the errors in the form before proceeding.');
    }
  };

  const handleBack = () => {
    if (isReviewMode) {
      setIsReviewMode(false);
      setActiveStep(steps.length - 2);
    } else {
      setActiveStep(prev => prev - 1);
    }
  };

  const handleEdit = () => {
    setIsReviewMode(false);
    setActiveStep(0);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Prepare form data for submission
      const formDataToSend = new FormData();
      
      Object.entries(formData).forEach(([key, value]) => {
        if (key === 'dateOfBirth' && value instanceof Date) {
          formDataToSend.append(key, value.toISOString());
        } else if (key === 'additionalLanguages' && Array.isArray(value)) {
          if (value.length > 0) {
            formDataToSend.append(key, value.join(','));
          }
        } else if (key === 'attendsCourse') {
          formDataToSend.append(key, value.toString());
        } else if (value !== null && value !== undefined && value !== '') {
          formDataToSend.append(key, value.toString());
        }
      });
      
      if (photoFile) {
        formDataToSend.append('photo', photoFile);
      }
      
      // Submit to API
      await api.post('/students', formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      setSuccess('Registration submitted successfully! Your application is under review.');
      
      // Reset form and redirect after 3 seconds
      setTimeout(() => {
        router.push('/');
      }, 3000);
      
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStepContent = (step: number) => {
    // Styled components
    const textFieldStyle = {
      '& .MuiOutlinedInput-root': {
        backgroundColor: theme === 'dark' ? '#1e293b' : 'white',
        color: theme === 'dark' ? '#ccd6f6' : '#333333',
        '& fieldset': {
          borderColor: theme === 'dark' ? '#334155' : '#e5e7eb',
        },
        '&:hover fieldset': {
          borderColor: theme === 'dark' ? '#00ffff' : '#007bff',
        },
        '&.Mui-focused fieldset': {
          borderColor: theme === 'dark' ? '#00ffff' : '#007bff',
        },
      },
      '& .MuiInputLabel-root': {
        color: theme === 'dark' ? '#a8b2d1' : '#666666',
      },
      '& .MuiInputLabel-root.Mui-focused': {
        color: theme === 'dark' ? '#00ffff' : '#007bff',
      },
      '& .MuiFormHelperText-root': {
        color: theme === 'dark' ? '#ff6b6b' : '#dc3545',
      }
    };

    const selectStyle = {
      borderRadius: 1,
      backgroundColor: theme === 'dark' ? '#1e293b' : 'white',
      color: theme === 'dark' ? '#ccd6f6' : '#333333',
      '& .MuiOutlinedInput-notchedOutline': {
        borderColor: theme === 'dark' ? '#334155' : '#e5e7eb',
      },
      '&:hover .MuiOutlinedInput-notchedOutline': {
        borderColor: theme === 'dark' ? '#00ffff' : '#007bff',
      },
      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
        borderColor: theme === 'dark' ? '#00ffff' : '#007bff',
      }
    };

    const labelStyle = {
      color: theme === 'dark' ? '#a8b2d1' : '#666666',
      '&.Mui-focused': {
        color: theme === 'dark' ? '#00ffff' : '#007bff',
      }
    };

    const datePickerStyle = {
      '& .MuiOutlinedInput-root': {
        backgroundColor: theme === 'dark' ? '#1e293b' : 'white',
        color: theme === 'dark' ? '#ccd6f6' : '#333333',
        '& fieldset': {
          borderColor: theme === 'dark' ? '#334155' : '#e5e7eb',
        },
        '&:hover fieldset': {
          borderColor: theme === 'dark' ? '#00ffff' : '#007bff',
        },
        '&.Mui-focused fieldset': {
          borderColor: theme === 'dark' ? '#00ffff' : '#007bff',
        },
      },
      '& .MuiInputLabel-root': {
        color: theme === 'dark' ? '#a8b2d1' : '#666666',
      },
      '& .MuiInputLabel-root.Mui-focused': {
        color: theme === 'dark' ? '#00ffff' : '#007bff',
      }
    };

    const reviewCardStyle = {
      borderRadius: 2,
      boxShadow: theme === 'dark' 
        ? '0 2px 8px rgba(0,0,0,0.3)' 
        : '0 2px 8px rgba(0,0,0,0.1)',
      backgroundColor: theme === 'dark' ? '#0f172a80' : 'white',
      backdropFilter: theme === 'dark' ? 'blur(10px)' : 'none'
    };

    switch (step) {
      case 0:
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Photo Upload (Optional) */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
              <Box sx={{ position: 'relative' }}>
                <Avatar
                  src={photoPreview || undefined}
                  sx={{ 
                    width: 120, 
                    height: 120,
                    fontSize: '2.5rem',
                    fontWeight: 'bold',
                    backgroundColor: theme === 'dark' ? '#334155' : '#e5e7eb',
                    border: `3px solid ${theme === 'dark' ? '#00ffff' : '#007bff'}`
                  }}
                >
                  {photoPreview ? '' : 'UP'}
                </Avatar>
                <Button
                  component="label"
                  variant="contained"
                  size="small"
                  startIcon={<Upload />}
                  sx={{ 
                    position: 'absolute', 
                    bottom: -10, 
                    right: -10,
                    background: theme === 'dark'
                      ? 'linear-gradient(135deg, #00ffff, #00b3b3)'
                      : 'linear-gradient(135deg, #007bff, #0056b3)',
                    '&:hover': {
                      background: theme === 'dark'
                        ? 'linear-gradient(135deg, #00b3b3, #008080)'
                        : 'linear-gradient(135deg, #0056b3, #004080)'
                    }
                  }}
                >
                  Upload
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={handlePhotoChange}
                  />
                </Button>
              </Box>
            </Box>
            <Typography variant="caption" color={theme === 'dark' ? '#a8b2d1' : '#666666'} sx={{ textAlign: 'center', mb: 2 }}>
              Upload a clear photo (Max 5MB, JPG/PNG) - Optional
            </Typography>

            {/* Personal Information */}
            <Typography variant="h6" sx={{ color: theme === 'dark' ? '#00ffff' : '#007bff', mb: 1 }}>
              Personal Information
            </Typography>

            <FormRow columns={3}>
              <TextField
                fullWidth
                label="First Name *"
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                error={!!errors.firstName}
                helperText={errors.firstName}
                size="small"
                required
                InputProps={{
                  startAdornment: <Person fontSize="small" sx={{ mr: 1, color: theme === 'dark' ? '#a8b2d1' : '#666666' }} />,
                }}
                sx={textFieldStyle}
              />
              <TextField
                fullWidth
                label="Middle Name"
                value={formData.middleName}
                onChange={(e) => handleInputChange('middleName', e.target.value)}
                size="small"
                sx={textFieldStyle}
              />
              <TextField
                fullWidth
                label="Last Name *"
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                error={!!errors.lastName}
                helperText={errors.lastName}
                size="small"
                required
                sx={textFieldStyle}
              />
            </FormRow>

            <FormRow columns={2}>
              <TextField
                fullWidth
                label="Mother's Name *"
                value={formData.motherName}
                onChange={(e) => handleInputChange('motherName', e.target.value)}
                error={!!errors.motherName}
                helperText={errors.motherName}
                size="small"
                required
                InputProps={{
                  startAdornment: <Person fontSize="small" sx={{ mr: 1, color: theme === 'dark' ? '#a8b2d1' : '#666666' }} />,
                }}
                sx={textFieldStyle}
              />
              <FormControl fullWidth size="small" error={!!errors.gender}>
                <InputLabel sx={labelStyle}>Gender *</InputLabel>
                <Select
                  value={formData.gender}
                  label="Gender *"
                  onChange={(e) => handleInputChange('gender', e.target.value)}
                  sx={selectStyle}
                >
                  <MenuItem value="male">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Male fontSize="small" /> Male
                    </Box>
                  </MenuItem>
                  <MenuItem value="female">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Female fontSize="small" /> Female
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>
            </FormRow>

            <FormRow columns={2}>
              <DatePicker
                label="Date of Birth *"
                value={formData.dateOfBirth}
                onChange={(date) => handleInputChange('dateOfBirth', date)}
                slotProps={{ 
                  textField: { 
                    fullWidth: true, 
                    size: 'small',
                    error: !!errors.dateOfBirth,
                    helperText: errors.dateOfBirth,
                    required: true,
                    InputProps: {
                      startAdornment: <Cake fontSize="small" sx={{ mr: 1, color: theme === 'dark' ? '#a8b2d1' : '#666666' }} />,
                    },
                    sx: datePickerStyle
                  } 
                }}
              />
              <TextField
                fullWidth
                label="Job/Profession *"
                value={formData.job}
                onChange={(e) => handleInputChange('job', e.target.value)}
                error={!!errors.job}
                helperText={errors.job}
                size="small"
                required
                select
                SelectProps={{
                  MenuProps: {
                    PaperProps: {
                      sx: {
                        backgroundColor: theme === 'dark' ? '#1e293b' : 'white',
                        color: theme === 'dark' ? '#ccd6f6' : '#333333',
                      }
                    }
                  }
                }}
                InputProps={{
                  startAdornment: <Work fontSize="small" sx={{ mr: 1, color: theme === 'dark' ? '#a8b2d1' : '#666666' }} />,
                }}
                sx={textFieldStyle}
              >
                <MenuItem value="">
                  <Typography variant="body2" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                    Select Job
                  </Typography>
                </MenuItem>
                {jobs.map((job) => (
                  <MenuItem key={job} value={job}>
                    {job}
                  </MenuItem>
                ))}
              </TextField>
            </FormRow>

            <FormRow columns={2}>
              <TextField
                fullWidth
                label="Phone Number *"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                error={!!errors.phone}
                helperText={errors.phone}
                size="small"
                required
                placeholder="0912345678"
                InputProps={{
                  startAdornment: <Phone fontSize="small" sx={{ mr: 1, color: theme === 'dark' ? '#a8b2d1' : '#666666' }} />,
                }}
                sx={textFieldStyle}
              />
              
              <TextField
                fullWidth
                label="Emergency Contact *"
                value={formData.emergencyContact}
                onChange={(e) => handleInputChange('emergencyContact', e.target.value)}
                error={!!errors.emergencyContact}
                helperText={errors.emergencyContact}
                size="small"
                required
                placeholder="0912345678"
                InputProps={{
                  startAdornment: <Phone fontSize="small" sx={{ mr: 1, color: theme === 'dark' ? '#a8b2d1' : '#666666' }} />,
                }}
                sx={textFieldStyle}
              />
            </FormRow>

            <FormRow columns={1}>
              <TextField
                fullWidth
                label="Email Address *"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                error={!!errors.email}
                helperText={errors.email}
                size="small"
                required
                placeholder="example@domain.com"
                InputProps={{
                  startAdornment: <Email fontSize="small" sx={{ mr: 1, color: theme === 'dark' ? '#a8b2d1' : '#666666' }} />,
                }}
                sx={textFieldStyle}
              />
            </FormRow>
          </Box>
        );
      
      case 1:
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Typography variant="h6" sx={{ color: theme === 'dark' ? '#00ffff' : '#007bff', mb: 1 }}>
              <School sx={{ verticalAlign: 'middle', mr: 1 }} /> Academic Information
            </Typography>
            
            <FormRow columns={isMobile ? 1 : 2}>
              <FormControl fullWidth size="small" error={!!errors.university}>
                <InputLabel sx={labelStyle}>University *</InputLabel>
                <Select
                  value={formData.university}
                  label="University *"
                  onChange={(e) => handleInputChange('university', e.target.value)}
                  sx={selectStyle}
                  required
                >
                  <MenuItem value="">
                    <Typography variant="body2" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                      Select University
                    </Typography>
                  </MenuItem>
                  {universities.map((university) => (
                    <MenuItem key={university} value={university}>
                      <Typography variant="body2" color={theme === 'dark' ? '#ccd6f6' : '#333333'}>
                        {university}
                      </Typography>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <FormControl fullWidth size="small" error={!!errors.college}>
                <InputLabel sx={labelStyle}>College *</InputLabel>
                <Select
                  value={formData.college}
                  label="College *"
                  onChange={(e) => handleInputChange('college', e.target.value)}
                  sx={selectStyle}
                  required
                >
                  <MenuItem value="">
                    <Typography variant="body2" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                      Select College
                    </Typography>
                  </MenuItem>
                  {colleges.map((college) => (
                    <MenuItem key={college} value={college}>
                      <Typography variant="body2" color={theme === 'dark' ? '#ccd6f6' : '#333333'}>
                        {college}
                      </Typography>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </FormRow>

            <FormRow columns={isMobile ? 1 : 2}>
              <FormControl fullWidth size="small" error={!!errors.department}>
                <InputLabel sx={labelStyle}>Department *</InputLabel>
                <Select
                  value={formData.department}
                  label="Department *"
                  onChange={(e) => handleInputChange('department', e.target.value)}
                  sx={selectStyle}
                  required
                >
                  <MenuItem value="">
                    <Typography variant="body2" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                      Select Department
                    </Typography>
                  </MenuItem>
                  {departments.map((dept) => (
                    <MenuItem key={dept} value={dept}>
                      <Typography variant="body2" color={theme === 'dark' ? '#ccd6f6' : '#333333'}>
                        {dept}
                      </Typography>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <FormControl fullWidth size="small" error={!!errors.batch}>
                <InputLabel sx={labelStyle}>Batch *</InputLabel>
                <Select
                  value={formData.batch}
                  label="Batch *"
                  onChange={(e) => handleInputChange('batch', e.target.value)}
                  sx={selectStyle}
                  required
                >
                  <MenuItem value="">
                    <Typography variant="body2" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                      Select Batch
                    </Typography>
                  </MenuItem>
                  {batches.map((batch) => (
                    <MenuItem key={batch} value={batch}>
                      <Typography variant="body2" color={theme === 'dark' ? '#ccd6f6' : '#333333'}>
                        {batch}
                      </Typography>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </FormRow>

            <FormRow columns={isMobile ? 1 : 2}>
              <TextField
                fullWidth
                label="Block *"
                value={formData.block}
                onChange={(e) => handleInputChange('block', e.target.value)}
                error={!!errors.block}
                helperText={errors.block}
                size="small"
                required
                placeholder="Block A"
                sx={textFieldStyle}
              />
              
              <TextField
                fullWidth
                label="Dorm *"
                value={formData.dorm}
                onChange={(e) => handleInputChange('dorm', e.target.value)}
                error={!!errors.dorm}
                helperText={errors.dorm}
                size="small"
                required
                placeholder="Dorm 101"
                sx={textFieldStyle}
              />
            </FormRow>
          </Box>
        );
      
      case 2:
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Address Information */}
            <Typography variant="h6" sx={{ color: theme === 'dark' ? '#00ffff' : '#007bff', mb: 1 }}>
              <LocationOn sx={{ verticalAlign: 'middle', mr: 1 }} /> Address Information
            </Typography>
            
            <FormRow columns={isMobile ? 1 : 4}>
              <FormControl fullWidth size="small" error={!!errors.region}>
                <InputLabel sx={labelStyle}>Region *</InputLabel>
                <Select
                  value={formData.region}
                  label="Region *"
                  onChange={(e) => handleInputChange('region', e.target.value)}
                  sx={selectStyle}
                  required
                >
                  <MenuItem value="">
                    <Typography variant="body2" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                      Select Region
                    </Typography>
                  </MenuItem>
                  {regions.map((region) => (
                    <MenuItem key={region} value={region}>
                      <Typography variant="body2" color={theme === 'dark' ? '#ccd6f6' : '#333333'}>
                        {region}
                      </Typography>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <TextField
                fullWidth
                label="Zone *"
                value={formData.zone}
                onChange={(e) => handleInputChange('zone', e.target.value)}
                error={!!errors.zone}
                helperText={errors.zone}
                size="small"
                required
                placeholder="Central Zone"
                sx={textFieldStyle}
              />
              
              <TextField
                fullWidth
                label="Wereda *"
                value={formData.wereda}
                onChange={(e) => handleInputChange('wereda', e.target.value)}
                error={!!errors.wereda}
                helperText={errors.wereda}
                size="small"
                required
                placeholder="Wereda 01"
                sx={textFieldStyle}
              />
              
              <TextField
                fullWidth
                label="Kebele *"
                value={formData.kebele}
                onChange={(e) => handleInputChange('kebele', e.target.value)}
                error={!!errors.kebele}
                helperText={errors.kebele}
                size="small"
                required
                placeholder="Kebele 02"
                sx={textFieldStyle}
              />
            </FormRow>
            
            <Divider sx={{ my: 2 }} />
            
            {/* Religious Information */}
            <Typography variant="h6" sx={{ color: theme === 'dark' ? '#00ffff' : '#007bff', mb: 1 }}>
              <Church sx={{ verticalAlign: 'middle', mr: 1 }} /> Religious Information
            </Typography>
            
            <FormRow columns={isMobile ? 1 : 2}>
              <TextField
                fullWidth
                label="Church *"
                value={formData.church}
                onChange={(e) => handleInputChange('church', e.target.value)}
                error={!!errors.church}
                helperText={errors.church}
                size="small"
                required
                placeholder="St. Mary Church"
                InputProps={{
                  startAdornment: <Church fontSize="small" sx={{ mr: 1, color: theme === 'dark' ? '#a8b2d1' : '#666666' }} />,
                }}
                sx={textFieldStyle}
              />
              
              <TextField
                fullWidth
                label="Authority *"
                value={formData.authority}
                onChange={(e) => handleInputChange('authority', e.target.value)}
                error={!!errors.authority}
                helperText={errors.authority}
                size="small"
                required
                placeholder="Local Authority"
                InputProps={{
                  startAdornment: <Business fontSize="small" sx={{ mr: 1, color: theme === 'dark' ? '#a8b2d1' : '#666666' }} />,
                }}
                sx={textFieldStyle}
              />
            </FormRow>
            
            <Divider sx={{ my: 2 }} />
            
            {/* Language Information */}
            <Typography variant="h6" sx={{ color: theme === 'dark' ? '#00ffff' : '#007bff', mb: 1 }}>
              <Translate sx={{ verticalAlign: 'middle', mr: 1 }} /> Language Information
            </Typography>
            
            <FormRow columns={isMobile ? 1 : 2}>
              <FormControl fullWidth size="small" error={!!errors.motherTongue}>
                <InputLabel sx={labelStyle}>Mother Tongue *</InputLabel>
                <Select
                  value={formData.motherTongue}
                  label="Mother Tongue *"
                  onChange={(e) => handleInputChange('motherTongue', e.target.value)}
                  sx={selectStyle}
                  required
                >
                  <MenuItem value="">
                    <Typography variant="body2" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                      Select Mother Tongue
                    </Typography>
                  </MenuItem>
                  {motherTongues.map((language) => (
                    <MenuItem key={language} value={language}>
                      <Typography variant="body2" color={theme === 'dark' ? '#ccd6f6' : '#333333'}>
                        {language}
                      </Typography>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <Autocomplete
                multiple
                options={languages}
                value={formData.additionalLanguages}
                onChange={(event, newValue) => {
                  handleInputChange('additionalLanguages', newValue);
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Additional Languages"
                    size="small"
                    placeholder="Select languages you speak"
                    sx={textFieldStyle}
                  />
                )}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      label={option}
                      size="small"
                      {...getTagProps({ index })}
                      sx={{
                        height: 22,
                        fontSize: '0.75rem',
                        backgroundColor: theme === 'dark' ? '#334155' : '#e5e7eb'
                      }}
                    />
                  ))
                }
              />
            </FormRow>
          </Box>
        );
      
      case 3:
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Course Information */}
            <Typography variant="h6" sx={{ color: theme === 'dark' ? '#00ffff' : '#007bff', mb: 1 }}>
              <School sx={{ verticalAlign: 'middle', mr: 1 }} /> Course Information
            </Typography>
            
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.attendsCourse}
                  onChange={(e) => handleInputChange('attendsCourse', e.target.checked)}
                  sx={{
                    color: theme === 'dark' ? '#00ffff' : '#007bff',
                    '&.Mui-checked': {
                      color: theme === 'dark' ? '#00ffff' : '#007bff',
                    },
                  }}
                />
              }
              label="Do you attend any religious or spiritual courses?"
              sx={{
                color: theme === 'dark' ? '#ccd6f6' : '#333333',
                mb: 2
              }}
            />
            
            {formData.attendsCourse && (
              <FormRow columns={isMobile ? 1 : 2}>
                <TextField
                  fullWidth
                  label="Course Name"
                  value={formData.courseName}
                  onChange={(e) => handleInputChange('courseName', e.target.value)}
                  error={!!errors.courseName}
                  helperText={errors.courseName}
                  size="small"
                  placeholder="Bible Study, Religious Education, etc."
                  sx={textFieldStyle}
                />
                
                <TextField
                  fullWidth
                  label="Course Church"
                  value={formData.courseChurch}
                  onChange={(e) => handleInputChange('courseChurch', e.target.value)}
                  error={!!errors.courseChurch}
                  helperText={errors.courseChurch}
                  size="small"
                  placeholder="Church where course is held"
                  sx={textFieldStyle}
                />
              </FormRow>
            )}
            
            <Divider sx={{ my: 3 }} />
            
            {/* Review Section */}
            <Typography variant="h5" sx={{ 
              color: theme === 'dark' ? '#00ffff' : '#007bff', 
              mb: 3,
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              <AssignmentTurnedIn /> Review Your Information
            </Typography>
            
            <Typography variant="body1" color={theme === 'dark' ? '#a8b2d1' : '#666666'} sx={{ mb: 3 }}>
              Please review all your information carefully before submission. You can edit any section by clicking the Edit button.
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {/* Personal Info Review */}
              <Card sx={reviewCardStyle}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" sx={{ color: theme === 'dark' ? '#00ffff' : '#007bff' }}>
                      Personal Information
                    </Typography>
                    <Button
                      size="small"
                      startIcon={<Edit />}
                      onClick={() => {
                        setIsReviewMode(false);
                        setActiveStep(0);
                      }}
                      sx={{
                        color: theme === 'dark' ? '#00ffff' : '#007bff',
                        borderColor: theme === 'dark' ? '#00ffff' : '#007bff',
                        '&:hover': {
                          backgroundColor: theme === 'dark' ? '#00ffff20' : '#007bff10'
                        }
                      }}
                    >
                      Edit
                    </Button>
                  </Box>
                  
                  <FormRow columns={3}>
                    <ReviewField 
                      label="First Name" 
                      value={formData.firstName} 
                      icon={<Person fontSize="small" />}
                      theme={theme}
                    />
                    <ReviewField 
                      label="Middle Name" 
                      value={formData.middleName} 
                      icon={<Person fontSize="small" />}
                      theme={theme}
                    />
                    <ReviewField 
                      label="Last Name" 
                      value={formData.lastName} 
                      icon={<Person fontSize="small" />}
                      theme={theme}
                    />
                  </FormRow>

                  <FormRow columns={2}>
                    <ReviewField 
                      label="Mother's Name" 
                      value={formData.motherName} 
                      icon={<PersonPin fontSize="small" />}
                      theme={theme}
                    />
                    <ReviewField 
                      label="Gender" 
                      value={formData.gender === 'male' ? 'Male' : 'Female'} 
                      icon={formData.gender === 'male' ? <Male fontSize="small" /> : <Female fontSize="small" />}
                      theme={theme}
                    />
                  </FormRow>

                  <FormRow columns={2}>
                    <ReviewField 
                      label="Date of Birth" 
                      value={formData.dateOfBirth ? format(formData.dateOfBirth, 'MMMM dd, yyyy') : 'Not provided'} 
                      icon={<Cake fontSize="small" />}
                      theme={theme}
                    />
                    <ReviewField 
                      label="Job" 
                      value={formData.job} 
                      icon={<Work fontSize="small" />}
                      theme={theme}
                    />
                  </FormRow>

                  <FormRow columns={2}>
                    <ReviewField 
                      label="Phone Number" 
                      value={formData.phone} 
                      icon={<Phone fontSize="small" />}
                      theme={theme}
                    />
                    <ReviewField 
                      label="Emergency Contact" 
                      value={formData.emergencyContact} 
                      icon={<Phone fontSize="small" />}
                      theme={theme}
                    />
                  </FormRow>

                  <FormRow columns={1}>
                    <ReviewField 
                      label="Email Address" 
                      value={formData.email} 
                      icon={<Email fontSize="small" />}
                      theme={theme}
                    />
                  </FormRow>
                </CardContent>
              </Card>
              
              {/* Academic Info Review */}
              <Card sx={reviewCardStyle}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" sx={{ color: theme === 'dark' ? '#00ffff' : '#007bff' }}>
                      Academic Information
                    </Typography>
                    <Button
                      size="small"
                      startIcon={<Edit />}
                      onClick={() => {
                        setIsReviewMode(false);
                        setActiveStep(1);
                      }}
                      sx={{
                        color: theme === 'dark' ? '#00ffff' : '#007bff',
                        borderColor: theme === 'dark' ? '#00ffff' : '#007bff',
                        '&:hover': {
                          backgroundColor: theme === 'dark' ? '#00ffff20' : '#007bff10'
                        }
                      }}
                    >
                      Edit
                    </Button>
                  </Box>
                  
                  <FormRow columns={2}>
                    <ReviewField 
                      label="University" 
                      value={formData.university} 
                      icon={<AccountBalance fontSize="small" />}
                      theme={theme}
                    />
                    <ReviewField 
                      label="College" 
                      value={formData.college} 
                      icon={<School fontSize="small" />}
                      theme={theme}
                    />
                  </FormRow>

                  <FormRow columns={2}>
                    <ReviewField 
                      label="Department" 
                      value={formData.department} 
                      icon={<School fontSize="small" />}
                      theme={theme}
                    />
                    <ReviewField 
                      label="Batch" 
                      value={formData.batch} 
                      icon={<AccessTime fontSize="small" />}
                      theme={theme}
                    />
                  </FormRow>

                  <FormRow columns={2}>
                    <ReviewField 
                      label="Block" 
                      value={formData.block} 
                      icon={<Home fontSize="small" />}
                      theme={theme}
                    />
                    <ReviewField 
                      label="Dorm" 
                      value={formData.dorm} 
                      icon={<Home fontSize="small" />}
                      theme={theme}
                    />
                  </FormRow>
                </CardContent>
              </Card>
              
              {/* Address & Religious Review */}
              <Card sx={reviewCardStyle}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" sx={{ color: theme === 'dark' ? '#00ffff' : '#007bff' }}>
                      Address & Religious Information
                    </Typography>
                    <Button
                      size="small"
                      startIcon={<Edit />}
                      onClick={() => {
                        setIsReviewMode(false);
                        setActiveStep(2);
                      }}
                      sx={{
                        color: theme === 'dark' ? '#00ffff' : '#007bff',
                        borderColor: theme === 'dark' ? '#00ffff' : '#007bff',
                        '&:hover': {
                          backgroundColor: theme === 'dark' ? '#00ffff20' : '#007bff10'
                        }
                      }}
                    >
                      Edit
                    </Button>
                  </Box>
                  
                  <FormRow columns={4}>
                    <ReviewField 
                      label="Region" 
                      value={formData.region} 
                      icon={<LocationOn fontSize="small" />}
                      theme={theme}
                    />
                    <ReviewField 
                      label="Zone" 
                      value={formData.zone} 
                      icon={<LocationOn fontSize="small" />}
                      theme={theme}
                    />
                    <ReviewField 
                      label="Wereda" 
                      value={formData.wereda} 
                      icon={<LocationOn fontSize="small" />}
                      theme={theme}
                    />
                    <ReviewField 
                      label="Kebele" 
                      value={formData.kebele} 
                      icon={<LocationOn fontSize="small" />}
                      theme={theme}
                    />
                  </FormRow>

                  <FormRow columns={2}>
                    <ReviewField 
                      label="Church" 
                      value={formData.church} 
                      icon={<Church fontSize="small" />}
                      theme={theme}
                    />
                    <ReviewField 
                      label="Authority" 
                      value={formData.authority} 
                      icon={<Business fontSize="small" />}
                      theme={theme}
                    />
                  </FormRow>

                  <FormRow columns={2}>
                    <ReviewField 
                      label="Mother Tongue" 
                      value={formData.motherTongue} 
                      icon={<Translate fontSize="small" />}
                      theme={theme}
                    />
                    <ReviewField 
                      label="Additional Languages" 
                      value={formData.additionalLanguages} 
                      icon={<Language fontSize="small" />}
                      theme={theme}
                      chip
                    />
                  </FormRow>
                </CardContent>
              </Card>
              
              {/* Course Info Review */}
              {formData.attendsCourse && (
                <Card sx={reviewCardStyle}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6" sx={{ color: theme === 'dark' ? '#00ffff' : '#007bff' }}>
                        Course Information
                      </Typography>
                      <Button
                        size="small"
                        startIcon={<Edit />}
                        onClick={() => {
                          setIsReviewMode(false);
                          setActiveStep(3);
                        }}
                        sx={{
                          color: theme === 'dark' ? '#00ffff' : '#007bff',
                          borderColor: theme === 'dark' ? '#00ffff' : '#007bff',
                          '&:hover': {
                            backgroundColor: theme === 'dark' ? '#00ffff20' : '#007bff10'
                          }
                        }}
                      >
                        Edit
                      </Button>
                    </Box>
                    
                    <FormRow columns={2}>
                      <ReviewField 
                        label="Course Name" 
                        value={formData.courseName} 
                        icon={<School fontSize="small" />}
                        theme={theme}
                      />
                      <ReviewField 
                        label="Course Church" 
                        value={formData.courseChurch} 
                        icon={<Church fontSize="small" />}
                        theme={theme}
                      />
                    </FormRow>
                  </CardContent>
                </Card>
              )}
              
              {/* Photo Preview */}
              {photoPreview && (
                <Card sx={reviewCardStyle}>
                  <CardContent>
                    <Typography variant="h6" sx={{ color: theme === 'dark' ? '#00ffff' : '#007bff', mb: 2 }}>
                      Uploaded Photo
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                      <Avatar
                        src={photoPreview}
                        sx={{ 
                          width: 150, 
                          height: 150,
                          border: `3px solid ${theme === 'dark' ? '#00ffff' : '#007bff'}`,
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                        }}
                      />
                    </Box>
                  </CardContent>
                </Card>
              )}
            </Box>
          </Box>
        );
      
      default:
        return null;
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <div className={`min-h-screen transition-colors duration-300 ${themeStyles.background} ${theme === 'dark' ? 'text-white' : 'text-[#333333]'}`}>
        {/* Add Navbar here */}
        <Navbar />
        
        <Box sx={{ 
          py: 4,
          px: { xs: 2, sm: 3, md: 4 },
          maxWidth: '1400px',
          margin: '0 auto',
          pt: 12 // Add padding top to account for fixed navbar
        }}>
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Box sx={{ mb: 4, textAlign: 'center' }}>
              <Typography variant={isMobile ? "h5" : "h4"} sx={{ 
                fontWeight: 'bold', 
                color: theme === 'dark' ? '#00ffff' : '#007bff',
                mb: 1 
              }}>
                Student Registration
              </Typography>
              <Typography variant={isMobile ? "body2" : "body1"} color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                Complete all steps to register as a new student
              </Typography>
            </Box>
          </motion.div>

          {/* Stepper */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            style={{ display: isMobile && activeStep === 3 ? 'none' : 'block' }}
          >
            <Card sx={{ 
              mb: 4, 
              borderRadius: 2, 
              boxShadow: theme === 'dark' 
                ? '0 4px 12px rgba(0,0,0,0.3)' 
                : '0 4px 12px rgba(0,0,0,0.08)',
              backgroundColor: theme === 'dark' ? '#0f172a80' : 'white',
              backdropFilter: theme === 'dark' ? 'blur(10px)' : 'none'
            }}>
              <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                <Stepper activeStep={activeStep} alternativeLabel={isMobile}>
                  {steps.map((label, index) => (
                    <Step key={label}>
                      <StepLabel 
                        sx={{
                          '& .MuiStepLabel-label': {
                            color: theme === 'dark' ? '#ccd6f6' : '#333333',
                            fontSize: { xs: '0.75rem', sm: '0.875rem' }
                          },
                          '& .MuiStepIcon-root': {
                            color: theme === 'dark' ? '#334155' : '#e5e7eb',
                            '&.Mui-active': {
                              color: theme === 'dark' ? '#00ffff' : '#007bff',
                            },
                            '&.Mui-completed': {
                              color: theme === 'dark' ? '#00b3b3' : '#0056b3',
                            }
                          }
                        }}
                      >
                        {isMobile ? label.split(' ')[0] : label}
                      </StepLabel>
                    </Step>
                  ))}
                </Stepper>
              </CardContent>
            </Card>
          </motion.div>

          {/* Form Content */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card sx={{ 
              borderRadius: 2, 
              boxShadow: theme === 'dark' 
                ? '0 4px 12px rgba(0,0,0,0.3)' 
                : '0 4px 12px rgba(0,0,0,0.08)',
              backgroundColor: theme === 'dark' ? '#0f172a80' : 'white',
              backdropFilter: theme === 'dark' ? 'blur(10px)' : 'none',
              mb: 4
            }}>
              <CardContent sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
                {getStepContent(activeStep)}
              </CardContent>
            </Card>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Box sx={{ 
              display: 'flex', 
              justifyContent: activeStep === 0 ? 'flex-end' : 'space-between',
              gap: 2,
              flexDirection: isMobile ? 'column' : 'row'
            }}>
              {activeStep > 0 && (
                <Button
                  variant="outlined"
                  startIcon={<ArrowBack />}
                  onClick={handleBack}
                  sx={{
                    borderRadius: 1,
                    borderColor: theme === 'dark' ? '#00ffff' : '#007bff',
                    color: theme === 'dark' ? '#00ffff' : '#007bff',
                    '&:hover': {
                      backgroundColor: theme === 'dark' ? '#00ffff20' : '#007bff10'
                    }
                  }}
                >
                  Back
                </Button>
              )}
              
              {activeStep < steps.length - 1 ? (
                <Button
                  variant="contained"
                  endIcon={<ArrowForward />}
                  onClick={handleNext}
                  sx={{
                    background: theme === 'dark'
                      ? 'linear-gradient(135deg, #00ffff, #00b3b3)'
                      : 'linear-gradient(135deg, #007bff, #0056b3)',
                    borderRadius: 1,
                    ml: activeStep === 0 ? 'auto' : 0,
                    '&:hover': {
                      background: theme === 'dark'
                        ? 'linear-gradient(135deg, #00b3b3, #008080)'
                        : 'linear-gradient(135deg, #0056b3, #004080)'
                    }
                  }}
                >
                  {activeStep === steps.length - 2 ? 'Submit for Review' : 'Next Step'}
                </Button>
              ) : (
                <Button
                  variant="contained"
                  startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <CheckCircle />}
                  onClick={handleSubmit}
                  disabled={loading}
                  sx={{
                    background: theme === 'dark'
                      ? 'linear-gradient(135deg, #00ff00, #00b300)'
                      : 'linear-gradient(135deg, #28a745, #1e7e34)',
                    borderRadius: 1,
                    ml: 'auto',
                    '&:hover': {
                      background: theme === 'dark'
                        ? 'linear-gradient(135deg, #00b300, #008000)'
                        : 'linear-gradient(135deg, #1e7e34, #155724)'
                    },
                    '&.Mui-disabled': {
                      background: theme === 'dark' ? '#334155' : '#e5e7eb',
                      color: theme === 'dark' ? '#94a3b8' : '#94a3b8'
                    }
                  }}
                >
                  {loading ? 'Submitting...' : 'Submit Registration'}
                </Button>
              )}
            </Box>
          </motion.div>

          {/* Notifications */}
          <Snackbar 
            open={!!error} 
            autoHideDuration={6000} 
            onClose={() => setError('')}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          >
            <Alert 
              severity="error" 
              onClose={() => setError('')}
              sx={{ 
                borderRadius: 1,
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                backgroundColor: theme === 'dark' ? '#0f172a' : 'white',
                color: theme === 'dark' ? '#ff0000' : '#dc3545'
              }}
            >
              {error}
            </Alert>
          </Snackbar>
          
          <Snackbar 
            open={!!success} 
            autoHideDuration={6000} 
            onClose={() => setSuccess('')}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          >
            <Alert 
              severity="success" 
              onClose={() => setSuccess('')}
              sx={{ 
                borderRadius: 1,
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                backgroundColor: theme === 'dark' ? '#0f172a' : 'white',
                color: theme === 'dark' ? '#00ff00' : '#28a745'
              }}
            >
              {success}
            </Alert>
          </Snackbar>
        </Box>
      </div>
    </LocalizationProvider>
  );
};

export default RegistrationPage;