'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box, Typography, Card, CardContent, TextField,
  Button, Chip, Alert, Snackbar, CircularProgress,
  useMediaQuery, MenuItem, Select, FormControl,
  InputLabel, IconButton, Divider, Stepper, Step,
  StepLabel, Switch, FormControlLabel,
  Autocomplete
} from '@mui/material';
import { useTheme } from '@/lib/theme-context';
import { useLanguage } from '@/lib/language-context';
import {
  AttachMoney, Bed, Bathtub,
  SquareFoot, ThreeDRotation,
  Add, Delete, ArrowBack, Save, CloudUpload,
  CheckCircle, LocalParking, AcUnit,
  Pool, FitnessCenter, Security, Wifi,
  Yard, Elevator, Balcony, SmartToy, Map,
  Verified, Tag as TagIcon, VideoLibrary,
  Panorama, Architecture, Shield, Handshake
} from '@mui/icons-material';
import api from '@/app/utils/api';
import { PropertyType } from '@/types/houses';

// ─── Option lists — MUST match the backend enums ───────────────────
const transactionTypeOptions = [
  { value: 'RENT', label: 'For Rent (Monthly/Yearly)' },
  { value: 'BUY', label: 'For Sale (Purchase)' },
  { value: 'SHORT_STAY', label: 'Short Stay / Vacation' },
];

const intendedPurposeOptions = [
  { value: 'LIVING', label: 'Residential / Living' },
  { value: 'FAMILY', label: 'Family Home' },
  { value: 'STUDENT', label: 'Student Housing' },
  { value: 'TEMPORARY', label: 'Temporary Stay' },
  { value: 'BUSINESS', label: 'Business / Commercial' },
  { value: 'STORAGE_INDUSTRIAL', label: 'Storage / Industrial' },
  { value: 'RESIDENTIAL_OWNERSHIP', label: 'Residential Ownership' },
  { value: 'COMMERCIAL_INVESTMENT', label: 'Commercial Investment' },
  { value: 'DEVELOPMENT', label: 'Development' },
  { value: 'AGRICULTURE', label: 'Agriculture' },
  { value: 'OTHER', label: 'Other' },
];

const amenitiesOptions = [
  { value: 'pool', label: 'Swimming Pool', icon: <Pool /> },
  { value: 'gym', label: 'Gym', icon: <FitnessCenter /> },
  { value: 'garden', label: 'Garden', icon: <Yard /> },
  { value: 'security', label: '24/7 Security', icon: <Security /> },
  { value: 'parking', label: 'Parking', icon: <LocalParking /> },
  { value: 'wifi', label: 'High-speed WiFi', icon: <Wifi /> },
  { value: 'ac', label: 'Air Conditioning', icon: <AcUnit /> },
  { value: 'heating', label: 'Heating', icon: <AcUnit /> },
  { value: 'elevator', label: 'Elevator', icon: <Elevator /> },
  { value: 'balcony', label: 'Balcony', icon: <Balcony /> },
  { value: 'terrace', label: 'Terrace', icon: <Balcony /> },
  { value: 'smart-home', label: 'Smart Home', icon: <SmartToy /> },
];

const featuresOptions = [
  'Central AC', 'Hardwood Floors', 'Granite Countertops',
  'Stainless Steel Appliances', 'Walk-in Closet', 'Fireplace',
  'Private Yard', 'Covered Patio', 'Laundry Room', 'Storage Space',
];

const CreateHousePage = () => {
  const { theme } = useTheme();
  const { t, isAmharic } = useLanguage();
  const isDark = theme === 'dark';
  const isMobile = useMediaQuery('(max-width: 768px)');
  const router = useRouter();

  const propertyTypes = [
    { value: PropertyType.APARTMENT, label: t('property.apartment', 'Apartment') },
    { value: PropertyType.VILLA, label: t('property.villa', 'Villa') },
    { value: PropertyType.CONDO, label: t('property.condo', 'Condo') },
    { value: PropertyType.HOUSE, label: t('property.house', 'House') },
    { value: PropertyType.LAND, label: t('property.land', 'Land') },
  ];

  const steps = [
    t('house_form.step_basic', 'Basic Information'),
    t('house_form.step_location', 'Location & Details'),
    t('house_form.step_pricing', 'Pricing & Media'),
  ];

  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    propertyType: '',
    transactionType: 'RENT' as 'RENT' | 'BUY' | 'SHORT_STAY',
    intendedPurpose: 'LIVING',
    tags: '',
    isVerified: false,
    quantity: 1,

    location: {
      address: '',
      city: '',
      state: '',
      country: 'Ethiopia',
      zipCode: '',
      coordinates: { lat: 9.03, lng: 38.74 },
    },

    details: {
      bedrooms: 0,
      bathrooms: 0,
      area: 0,
      lotSize: 0,
      yearBuilt: new Date().getFullYear(),
      floors: 1,
      parkingSpaces: 0,
      furnished: false,
      furnishingStatus: 'unfurnished' as 'furnished' | 'partially_furnished' | 'unfurnished',
      amenities: [] as string[],
      features: [] as string[],
    },

    pricing: {
      price: 0,
      maintenanceFee: 0,
      taxAmount: 0,
      securityDeposit: 0,
    },

    rentalPricing: {
      frequency: 'monthly' as 'daily' | 'weekly' | 'monthly',
      securityDeposit: 0,
      advancePayments: 1,
      minLeaseDuration: 6,
    },

    saleTerms: {
      askingPrice: 0,
      ownershipDocType: 'Freehold Title Deed',
      isNegotiable: true,
      escrowSupported: true,
      downPaymentMin: 20,
    },

    videoUrl: '',
    panoramic360Url: '',
    panoramic360Caption: '360° Virtual Tour View',
    floorPlanUrl: '',

    virtualTour: {
      enabled: false,
      url: '',
      embedCode: '',
    },
  });

  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [threeDModels, setThreeDModels] = useState<File[]>([]);
  const [modelPreviews, setModelPreviews] = useState<string[]>([]);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const modelInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNestedChange = (section: string, field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...(prev[section as keyof typeof prev] as object),
        [field]: value,
      },
    }));
  };

  const handleCoordinatesChange = (field: 'lat' | 'lng', value: number) => {
    setFormData((prev) => ({
      ...prev,
      location: {
        ...prev.location,
        coordinates: { ...prev.location.coordinates, [field]: value },
      },
    }));
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setImages((prev) => [...prev, ...files]);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
    event.target.value = '';
  };

  const handleModelUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setThreeDModels((prev) => [...prev, ...files]);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setModelPreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
    event.target.value = '';
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const removeModel = (index: number) => {
    setThreeDModels((prev) => prev.filter((_, i) => i !== index));
    setModelPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const fd = new FormData();

      // Scalars
      fd.append('title', formData.title);
      fd.append('description', formData.description);
      fd.append('propertyType', formData.propertyType);
      fd.append('transactionType', formData.transactionType);
      fd.append('intendedPurpose', formData.intendedPurpose);
      fd.append('isVerified', formData.isVerified ? 'true' : 'false');
      fd.append('tags', formData.tags);
      fd.append('quantity', formData.quantity.toString());

      // JSON blobs
      fd.append('location', JSON.stringify(formData.location));
      fd.append('details', JSON.stringify(formData.details));
      fd.append('pricing', JSON.stringify(formData.pricing));
      fd.append('virtualTour', JSON.stringify(formData.virtualTour));

      if (formData.videoUrl) fd.append('videoUrl', formData.videoUrl);

      if (formData.panoramic360Url) {
        fd.append(
          'panoramic360',
          JSON.stringify({
            enabled: true,
            imageUrl: formData.panoramic360Url,
            caption: formData.panoramic360Caption || '360° Virtual Tour View',
          })
        );
      }

      if (formData.transactionType === 'RENT' || formData.transactionType === 'SHORT_STAY') {
        fd.append('rentalPricing', JSON.stringify(formData.rentalPricing));
      }

      if (formData.transactionType === 'BUY') {
        fd.append(
          'saleTerms',
          JSON.stringify({
            ...formData.saleTerms,
            askingPrice: formData.saleTerms.askingPrice || formData.pricing.price,
          })
        );
      }

      if (formData.floorPlanUrl) {
        fd.append(
          'floorPlan',
          JSON.stringify({
            url: formData.floorPlanUrl,
            rooms: [
              { name: 'Living Room', dimensions: '6.0m x 4.5m', areaSqM: 27 },
              { name: 'Master Bedroom', dimensions: '4.5m x 4.0m', areaSqM: 18 },
            ],
          })
        );
      }

      images.forEach((img) => fd.append('images', img));
      threeDModels.forEach((model) => fd.append('threeDModels', model));

      await api.post('/houses', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setSuccess('House created successfully!');
      setTimeout(() => router.push('/admin/houses'), 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create house');
    } finally {
      setLoading(false);
    }
  };

  const textFieldStyle = {
    '& .MuiOutlinedInput-root': {
      backgroundColor: isDark ? '#1e293b' : '#ffffff',
      color: isDark ? '#f1f5f9' : '#0f172a',
      borderRadius: '10px',
      '& fieldset': { borderColor: isDark ? '#334155' : '#cbd5e1' },
      '&:hover fieldset': { borderColor: isDark ? '#38bdf8' : '#2563eb' },
      '&.Mui-focused fieldset': { borderColor: isDark ? '#38bdf8' : '#2563eb' },
    },
    '& .MuiInputLabel-root': { color: isDark ? '#94a3b8' : '#64748b' },
    '& .MuiInputLabel-root.Mui-focused': { color: isDark ? '#38bdf8' : '#2563eb' },
    '& .MuiFormHelperText-root': { color: isDark ? '#64748b' : '#94a3b8' },
  };

  // ─── Step 0 ──────────────────────────────────────────────────────
  const renderBasicInfo = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <TextField
        fullWidth
        label={t('house_form.prop_title', 'Property Title')}
        value={formData.title}
        onChange={(e) => handleInputChange('title', e.target.value)}
        required
        placeholder={t('house_form.prop_title_ph', 'e.g., Luxury Villa with Ocean View')}
        helperText={isAmharic ? 'የቤቱን ገላጭ ርዕስ ያስገቡ' : 'A descriptive title for your property'}
        sx={textFieldStyle}
      />

      <TextField
        fullWidth
        label={t('house_form.desc', 'Description')}
        value={formData.description}
        onChange={(e) => handleInputChange('description', e.target.value)}
        required
        multiline
        rows={4}
        placeholder={t('house_form.desc_ph', 'Describe the property in detail...')}
        helperText={isAmharic ? 'ዋና ዋና ገጽታዎችን እና መረጃዎችን ያካትቱ' : 'Include key features, condition, and selling points'}
        sx={textFieldStyle}
      />

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ flex: 1, minWidth: '220px' }}>
          <FormControl fullWidth>
            <InputLabel sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>
              {t('house_form.tx_type', 'Transaction Type')}
            </InputLabel>
            <Select
              value={formData.transactionType}
              label={t('house_form.tx_type', 'Transaction Type')}
              onChange={(e) => handleInputChange('transactionType', e.target.value)}
              required
              sx={{
                backgroundColor: isDark ? '#1e293b' : 'white',
                color: isDark ? '#f1f5f9' : '#0f172a',
                borderRadius: '10px',
              }}
            >
              {transactionTypeOptions.map((o) => (
                <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <Box sx={{ flex: 1, minWidth: '220px' }}>
          <FormControl fullWidth>
            <InputLabel sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>
              {t('house_form.purpose', 'Intended Purpose')}
            </InputLabel>
            <Select
              value={formData.intendedPurpose}
              label={t('house_form.purpose', 'Intended Purpose')}
              onChange={(e) => handleInputChange('intendedPurpose', e.target.value)}
              required
              sx={{
                backgroundColor: isDark ? '#1e293b' : 'white',
                color: isDark ? '#f1f5f9' : '#0f172a',
                borderRadius: '10px',
              }}
            >
              {intendedPurposeOptions.map((o) => (
                <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <Box sx={{ flex: 1, minWidth: '220px' }}>
          <FormControl fullWidth>
            <InputLabel sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>
              {t('house_form.category', 'Property Category')}
            </InputLabel>
            <Select
              value={formData.propertyType}
              label={t('house_form.category', 'Property Category')}
              onChange={(e) => handleInputChange('propertyType', e.target.value)}
              required
              sx={{
                backgroundColor: isDark ? '#1e293b' : 'white',
                color: isDark ? '#f1f5f9' : '#0f172a',
                borderRadius: '10px',
              }}
            >
              {propertyTypes.map((type) => (
                <MenuItem key={type.value} value={type.value}>{type.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Box>

      <TextField
        fullWidth
        label={t('house_form.tags', 'Tags (Search Tags)')}
        value={formData.tags}
        onChange={(e) => handleInputChange('tags', e.target.value)}
        placeholder="e.g. Bole, Luxury, Furnished, NewBuild"
        helperText={isAmharic ? 'በነጠላ ሰረዝ የተለዩ መለያዎች' : 'Comma-separated tags for discovery'}
        InputProps={{ startAdornment: <TagIcon sx={{ mr: 1, color: isDark ? '#38bdf8' : '#2563eb' }} /> }}
        sx={textFieldStyle}
      />

      <Box
        sx={{
          p: 2,
          borderRadius: 2.5,
          border: `1px solid ${
            formData.isVerified
              ? isDark ? 'rgba(34,197,94,0.4)' : 'rgba(34,197,94,0.3)'
              : isDark ? '#334155' : '#e2e8f0'
          }`,
          bgcolor: formData.isVerified
            ? isDark ? 'rgba(34,197,94,0.1)' : 'rgba(34,197,94,0.05)'
            : 'transparent',
        }}
      >
        <FormControlLabel
          control={
            <Switch
              checked={formData.isVerified}
              onChange={(e) => handleInputChange('isVerified', e.target.checked)}
              color="success"
            />
          }
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Shield sx={{ color: formData.isVerified ? '#22c55e' : 'text.secondary' }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: isDark ? '#f1f5f9' : '#0f172a' }}>
                {t('house_form.verified', 'Verified Property Listing')}
              </Typography>
            </Box>
          }
        />
        <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: isDark ? '#94a3b8' : '#64748b' }}>
          {isAmharic
            ? 'ይህ ቤት ሙሉ የባለቤትነት ማረጋገጫ ያለውና የተፈተሸ መሆኑን ያመልክቱ።'
            : 'Mark this listing as officially verified with confirmed ownership title deeds.'}
        </Typography>
      </Box>
    </Box>
  );

  // ─── Step 1 ──────────────────────────────────────────────────────
  const renderLocationDetails = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <TextField
        fullWidth
        label={t('house_form.address', 'Street Address')}
        value={formData.location.address}
        onChange={(e) => handleNestedChange('location', 'address', e.target.value)}
        required
        placeholder={isAmharic ? 'ለምሳሌ፡ ቦሌ መንገድ' : '123 Main Street'}
        sx={textFieldStyle}
      />

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ flex: 1, minWidth: '150px' }}>
          <TextField
            fullWidth
            label={t('house_form.city', 'City')}
            value={formData.location.city}
            onChange={(e) => handleNestedChange('location', 'city', e.target.value)}
            required
            sx={textFieldStyle}
          />
        </Box>
        <Box sx={{ flex: 1, minWidth: '150px' }}>
          <TextField
            fullWidth
            label={t('house_form.state', 'State / Subcity')}
            value={formData.location.state}
            onChange={(e) => handleNestedChange('location', 'state', e.target.value)}
            required
            sx={textFieldStyle}
          />
        </Box>
        <Box sx={{ flex: 1, minWidth: '150px' }}>
          <TextField
            fullWidth
            label={t('house_form.zip', 'Postal Code / ZIP')}
            value={formData.location.zipCode}
            onChange={(e) => handleNestedChange('location', 'zipCode', e.target.value)}
            sx={textFieldStyle}
          />
        </Box>
      </Box>

      <Divider sx={{ my: 2, borderColor: isDark ? '#233554' : '#e2e8f0' }} />

      <Typography variant="h6" sx={{ color: isDark ? '#38bdf8' : '#2563eb', fontWeight: 700, mb: 2 }}>
        {t('house_form.coordinates', 'Map Location')}
      </Typography>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ flex: 1, minWidth: '150px' }}>
          <TextField
            fullWidth
            label={t('house_form.lat', 'Latitude')}
            type="number"
            value={formData.location.coordinates.lat}
            onChange={(e) => handleCoordinatesChange('lat', parseFloat(e.target.value))}
            required
            inputProps={{ step: 0.000001 }}
            InputProps={{ startAdornment: <Map sx={{ mr: 1, fontSize: 16, color: isDark ? '#38bdf8' : '#2563eb' }} /> }}
            helperText="e.g., 9.03"
            sx={textFieldStyle}
          />
        </Box>
        <Box sx={{ flex: 1, minWidth: '150px' }}>
          <TextField
            fullWidth
            label={t('house_form.lng', 'Longitude')}
            type="number"
            value={formData.location.coordinates.lng}
            onChange={(e) => handleCoordinatesChange('lng', parseFloat(e.target.value))}
            required
            inputProps={{ step: 0.000001 }}
            InputProps={{ startAdornment: <Map sx={{ mr: 1, fontSize: 16, color: isDark ? '#38bdf8' : '#2563eb' }} /> }}
            helperText="e.g., 38.74"
            sx={textFieldStyle}
          />
        </Box>
      </Box>

      <Divider sx={{ my: 2, borderColor: isDark ? '#233554' : '#e2e8f0' }} />

      <Typography variant="h6" sx={{ color: isDark ? '#38bdf8' : '#2563eb', fontWeight: 700, mb: 2 }}>
        {isAmharic ? 'የቤቱ ዝርዝር መረጃዎች' : 'Property Details'}
      </Typography>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ flex: 1, minWidth: '120px' }}>
          <TextField
            fullWidth
            label={t('house_form.bedrooms', 'Bedrooms')}
            type="number"
            value={formData.details.bedrooms}
            onChange={(e) => handleNestedChange('details', 'bedrooms', parseInt(e.target.value) || 0)}
            InputProps={{ startAdornment: <Bed sx={{ mr: 1, color: isDark ? '#94a3b8' : '#64748b' }} /> }}
            sx={textFieldStyle}
          />
        </Box>
        <Box sx={{ flex: 1, minWidth: '120px' }}>
          <TextField
            fullWidth
            label={t('house_form.bathrooms', 'Bathrooms')}
            type="number"
            value={formData.details.bathrooms}
            onChange={(e) => handleNestedChange('details', 'bathrooms', parseInt(e.target.value) || 0)}
            InputProps={{ startAdornment: <Bathtub sx={{ mr: 1, color: isDark ? '#94a3b8' : '#64748b' }} /> }}
            sx={textFieldStyle}
          />
        </Box>
        <Box sx={{ flex: 1, minWidth: '120px' }}>
          <TextField
            fullWidth
            label={t('house_form.area', 'Area (sq ft / sqm)')}
            type="number"
            value={formData.details.area}
            onChange={(e) => handleNestedChange('details', 'area', parseInt(e.target.value) || 0)}
            InputProps={{ startAdornment: <SquareFoot sx={{ mr: 1, color: isDark ? '#94a3b8' : '#64748b' }} /> }}
            sx={textFieldStyle}
          />
        </Box>
      </Box>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ flex: 1, minWidth: '120px' }}>
          <TextField
            fullWidth
            label={t('house_form.year_built', 'Year Built')}
            type="number"
            value={formData.details.yearBuilt}
            onChange={(e) => handleNestedChange('details', 'yearBuilt', parseInt(e.target.value) || 0)}
            sx={textFieldStyle}
          />
        </Box>
        <Box sx={{ flex: 1, minWidth: '120px' }}>
          <TextField
            fullWidth
            label={isAmharic ? 'ፎቆች / ወለል' : 'Floors'}
            type="number"
            value={formData.details.floors}
            onChange={(e) => handleNestedChange('details', 'floors', parseInt(e.target.value) || 1)}
            sx={textFieldStyle}
          />
        </Box>
        <Box sx={{ flex: 1, minWidth: '120px' }}>
          <TextField
            fullWidth
            label={t('house_form.parking', 'Parking Spaces')}
            type="number"
            value={formData.details.parkingSpaces}
            onChange={(e) => handleNestedChange('details', 'parkingSpaces', parseInt(e.target.value) || 0)}
            sx={textFieldStyle}
          />
        </Box>
      </Box>

      <FormControlLabel
        control={
          <Switch
            checked={formData.details.furnished}
            onChange={(e) => {
              handleNestedChange('details', 'furnished', e.target.checked);
              handleNestedChange(
                'details',
                'furnishingStatus',
                e.target.checked ? 'furnished' : 'unfurnished'
              );
            }}
            color="primary"
          />
        }
        label={t('house_form.furnished', 'Fully Furnished')}
        sx={{ color: isDark ? '#f1f5f9' : '#0f172a' }}
      />

      <Divider sx={{ my: 2, borderColor: isDark ? '#233554' : '#e2e8f0' }} />

      <Typography variant="h6" sx={{ color: isDark ? '#38bdf8' : '#2563eb', fontWeight: 700, mb: 2 }}>
        {t('house_form.amenities', 'Amenities')}
      </Typography>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {amenitiesOptions.map((amenity) => {
          const isSelected = formData.details.amenities.includes(amenity.value);
          return (
            <Chip
              key={amenity.value}
              icon={amenity.icon}
              label={amenity.label}
              onClick={() => {
                const current = formData.details.amenities;
                const updated = current.includes(amenity.value)
                  ? current.filter((a) => a !== amenity.value)
                  : [...current, amenity.value];
                handleNestedChange('details', 'amenities', updated);
              }}
              sx={{
                borderRadius: '8px',
                fontWeight: 600,
                backgroundColor: isSelected
                  ? isDark ? 'rgba(56,189,248,0.2)' : 'rgba(37,99,235,0.15)'
                  : isDark ? '#1e293b' : '#f1f5f9',
                border: isSelected
                  ? `1px solid ${isDark ? '#38bdf8' : '#2563eb'}`
                  : `1px solid ${isDark ? '#334155' : '#cbd5e1'}`,
                color: isSelected
                  ? isDark ? '#38bdf8' : '#2563eb'
                  : isDark ? '#94a3b8' : '#64748b',
                '& .MuiChip-icon': {
                  color: isSelected ? (isDark ? '#38bdf8' : '#2563eb') : 'inherit',
                },
              }}
            />
          );
        })}
      </Box>

      <Divider sx={{ my: 2, borderColor: isDark ? '#233554' : '#e2e8f0' }} />

      <Typography variant="h6" sx={{ color: isDark ? '#38bdf8' : '#2563eb', fontWeight: 700, mb: 2 }}>
        {isAmharic ? 'ተጨማሪ ባህሪያት' : 'Features'}
      </Typography>

      <Autocomplete
        multiple
        freeSolo
        options={featuresOptions}
        value={formData.details.features}
        onChange={(_, newValue) => handleNestedChange('details', 'features', newValue)}
        renderInput={(params) => (
          <TextField
            {...params}
            label={isAmharic ? 'ባህሪያትን ይምረጡ' : 'Select Features'}
            placeholder={isAmharic ? 'ባህሪ ጨምር...' : 'Add features...'}
            sx={textFieldStyle}
          />
        )}
        renderTags={(value, getTagProps) =>
          value.map((option, index) => {
            const { key, ...tagProps } = getTagProps({ index });
            return (
              <Chip
                key={key}
                label={option}
                {...tagProps}
                sx={{
                  backgroundColor: isDark ? '#1e293b' : '#e2e8f0',
                  color: isDark ? '#f1f5f9' : '#0f172a',
                  borderRadius: '6px',
                }}
              />
            );
          })
        }
      />
    </Box>
  );

  // ─── Step 2 ──────────────────────────────────────────────────────
  const renderPricingMedia = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Typography variant="h6" sx={{ color: isDark ? '#38bdf8' : '#2563eb', fontWeight: 700, mb: 1 }}>
        {isAmharic ? 'የዋጋ እና የክፍያ ውሎች' : 'Pricing & Terms'} (
        {formData.transactionType === 'BUY'
          ? isAmharic ? 'ለሽያጭ' : 'For Sale'
          : formData.transactionType === 'SHORT_STAY'
          ? isAmharic ? 'ለአጭር ጊዜ' : 'Short Stay'
          : isAmharic ? 'ለኪራይ' : 'Rental'}
        )
      </Typography>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ flex: 1, minWidth: '200px' }}>
          <TextField
            fullWidth
            label={formData.transactionType === 'BUY' ? 'Listing Price' : 'Rent Amount'}
            type="number"
            value={formData.pricing.price}
            onChange={(e) => handleNestedChange('pricing', 'price', parseFloat(e.target.value) || 0)}
            required
            InputProps={{ startAdornment: <AttachMoney sx={{ mr: 1, color: isDark ? '#38bdf8' : '#2563eb' }} /> }}
            sx={textFieldStyle}
          />
        </Box>
        <Box sx={{ flex: 1, minWidth: '200px' }}>
          <TextField
            fullWidth
            label={t('house_form.quantity', 'Available Quantity / Units')}
            type="number"
            value={formData.quantity}
            onChange={(e) => handleInputChange('quantity', Math.max(1, parseInt(e.target.value) || 1))}
            required
            InputProps={{ inputProps: { min: 1 } }}
            sx={textFieldStyle}
          />
        </Box>
      </Box>

      {formData.transactionType === 'BUY' ? (
        <Box sx={{ p: 2.5, borderRadius: 2.5, bgcolor: isDark ? '#112240' : '#f8fafc', border: `1px solid ${isDark ? '#233554' : '#e2e8f0'}` }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#f59e0b', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Handshake /> {isAmharic ? 'የግዢ ውሎች እና ሰነዶች' : 'Purchase Terms & Documentation'}
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
            <Box sx={{ flex: 1, minWidth: '220px' }}>
              <TextField
                fullWidth
                label="Ownership Document / Title Deed Type"
                value={formData.saleTerms.ownershipDocType}
                onChange={(e) => handleNestedChange('saleTerms', 'ownershipDocType', e.target.value)}
                placeholder="e.g. Freehold Title Deed, 99-Yr Lease"
                sx={textFieldStyle}
              />
            </Box>
            <Box sx={{ flex: 1, minWidth: '180px' }}>
              <TextField
                fullWidth
                label="Min Down Payment (%)"
                type="number"
                value={formData.saleTerms.downPaymentMin}
                onChange={(e) => handleNestedChange('saleTerms', 'downPaymentMin', parseFloat(e.target.value) || 0)}
                sx={textFieldStyle}
              />
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.saleTerms.isNegotiable}
                  onChange={(e) => handleNestedChange('saleTerms', 'isNegotiable', e.target.checked)}
                />
              }
              label={isAmharic ? 'ዋጋ ይደራደራል' : 'Price Negotiable'}
              sx={{ color: isDark ? '#f1f5f9' : '#0f172a' }}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={formData.saleTerms.escrowSupported}
                  onChange={(e) => handleNestedChange('saleTerms', 'escrowSupported', e.target.checked)}
                />
              }
              label={isAmharic ? 'በኤስክሮው አካውንት የሚደገፍ' : 'Escrow Account Supported'}
              sx={{ color: isDark ? '#f1f5f9' : '#0f172a' }}
            />
          </Box>
        </Box>
      ) : (
        <Box sx={{ p: 2.5, borderRadius: 2.5, bgcolor: isDark ? '#112240' : '#f8fafc', border: `1px solid ${isDark ? '#233554' : '#e2e8f0'}` }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: isDark ? '#38bdf8' : '#2563eb', mb: 2 }}>
            {isAmharic ? 'የኪራይ ውል እና የክፍያ ሁኔታ' : 'Rental Lease Terms & Schedule'}
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ flex: 1, minWidth: '180px' }}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>
                  {isAmharic ? 'የክፍያ ድግግሞሽ' : 'Billing Frequency'}
                </InputLabel>
                <Select
                  value={formData.rentalPricing.frequency}
                  label={isAmharic ? 'የክፍያ ድግግሞሽ' : 'Billing Frequency'}
                  onChange={(e) => handleNestedChange('rentalPricing', 'frequency', e.target.value)}
                  sx={{
                    backgroundColor: isDark ? '#1e293b' : 'white',
                    color: isDark ? '#f1f5f9' : '#0f172a',
                    borderRadius: '10px',
                  }}
                >
                  <MenuItem value="monthly">{isAmharic ? 'በየወሩ' : 'Monthly'}</MenuItem>
                  <MenuItem value="weekly">{isAmharic ? 'በየሳምንቱ' : 'Weekly'}</MenuItem>
                  <MenuItem value="daily">{isAmharic ? 'በየቀኑ' : 'Daily'}</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ flex: 1, minWidth: '180px' }}>
              <TextField
                fullWidth
                label="Advance Rent (Months)"
                type="number"
                value={formData.rentalPricing.advancePayments}
                onChange={(e) => handleNestedChange('rentalPricing', 'advancePayments', parseInt(e.target.value) || 1)}
                sx={textFieldStyle}
              />
            </Box>
            <Box sx={{ flex: 1, minWidth: '180px' }}>
              <TextField
                fullWidth
                label={t('house_form.security_deposit', 'Security Deposit')}
                type="number"
                value={formData.rentalPricing.securityDeposit}
                onChange={(e) => handleNestedChange('rentalPricing', 'securityDeposit', parseFloat(e.target.value) || 0)}
                sx={textFieldStyle}
              />
            </Box>
            <Box sx={{ flex: 1, minWidth: '180px' }}>
              <TextField
                fullWidth
                label="Min Lease Duration (Months)"
                type="number"
                value={formData.rentalPricing.minLeaseDuration}
                onChange={(e) => handleNestedChange('rentalPricing', 'minLeaseDuration', parseInt(e.target.value) || 1)}
                sx={textFieldStyle}
              />
            </Box>
          </Box>
        </Box>
      )}

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ flex: 1, minWidth: '200px' }}>
          <TextField
            fullWidth
            label="Maintenance / HOA Fee"
            type="number"
            value={formData.pricing.maintenanceFee}
            onChange={(e) => handleNestedChange('pricing', 'maintenanceFee', parseFloat(e.target.value) || 0)}
            InputProps={{ startAdornment: <AttachMoney sx={{ mr: 1, color: isDark ? '#38bdf8' : '#2563eb' }} /> }}
            sx={textFieldStyle}
          />
        </Box>
        <Box sx={{ flex: 1, minWidth: '200px' }}>
          <TextField
            fullWidth
            label="Tax Amount"
            type="number"
            value={formData.pricing.taxAmount}
            onChange={(e) => handleNestedChange('pricing', 'taxAmount', parseFloat(e.target.value) || 0)}
            InputProps={{ startAdornment: <AttachMoney sx={{ mr: 1, color: isDark ? '#38bdf8' : '#2563eb' }} /> }}
            sx={textFieldStyle}
          />
        </Box>
      </Box>

      <Divider sx={{ my: 2, borderColor: isDark ? '#233554' : '#e2e8f0' }} />

      <Typography variant="h6" sx={{ color: isDark ? '#38bdf8' : '#2563eb', fontWeight: 700, mb: 2 }}>
        {t('house_form.upload_images', 'Property Photos')}
      </Typography>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        {imagePreviews.map((preview, index) => (
          <Box key={index} sx={{ position: 'relative', width: 120, height: 120 }}>
            <img
              src={preview}
              alt={`Preview ${index}`}
              style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }}
            />
            <IconButton
              size="small"
              onClick={() => removeImage(index)}
              sx={{
                position: 'absolute',
                top: -8,
                right: -8,
                backgroundColor: '#ef4444',
                color: 'white',
                '&:hover': { backgroundColor: '#dc2626' },
              }}
            >
              <Delete fontSize="small" />
            </IconButton>
          </Box>
        ))}

        <Box
          onClick={() => imageInputRef.current?.click()}
          sx={{
            width: 120,
            height: 120,
            borderRadius: 2,
            border: `2px dashed ${isDark ? '#334155' : '#cbd5e1'}`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            bgcolor: isDark ? 'rgba(30,41,59,0.5)' : '#f8fafc',
            '&:hover': {
              borderColor: isDark ? '#38bdf8' : '#2563eb',
              bgcolor: isDark ? 'rgba(56,189,248,0.05)' : 'rgba(37,99,235,0.05)',
            },
          }}
        >
          <CloudUpload sx={{ fontSize: 32, color: isDark ? '#38bdf8' : '#2563eb' }} />
          <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b', mt: 0.5, fontWeight: 600 }}>
            {isAmharic ? 'ፎቶ ጫን' : 'Upload Photo'}
          </Typography>
        </Box>
        <input ref={imageInputRef} type="file" accept="image/*" multiple hidden onChange={handleImageUpload} />
      </Box>

      <Divider sx={{ my: 2, borderColor: isDark ? '#233554' : '#e2e8f0' }} />

      <Typography variant="h6" sx={{ color: isDark ? '#38bdf8' : '#2563eb', fontWeight: 700, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Panorama /> {isAmharic ? '360° ቨርቹዋል ቱር እና ቪዲዮ' : 'Rich Media: 360° Virtual Tour & Video'}
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ flex: 2, minWidth: '260px' }}>
            <TextField
              fullWidth
              label="360° Panoramic Image URL"
              value={formData.panoramic360Url}
              onChange={(e) => handleInputChange('panoramic360Url', e.target.value)}
              placeholder="https://..."
              InputProps={{ startAdornment: <Panorama sx={{ mr: 1, color: isDark ? '#38bdf8' : '#2563eb' }} /> }}
              sx={textFieldStyle}
            />
          </Box>
          <Box sx={{ flex: 1, minWidth: '180px' }}>
            <TextField
              fullWidth
              label="360 Tour Caption"
              value={formData.panoramic360Caption}
              onChange={(e) => handleInputChange('panoramic360Caption', e.target.value)}
              sx={textFieldStyle}
            />
          </Box>
        </Box>

        <TextField
          fullWidth
          label="Walkthrough Video URL"
          value={formData.videoUrl}
          onChange={(e) => handleInputChange('videoUrl', e.target.value)}
          placeholder="https://www.youtube.com/watch?v=..."
          InputProps={{ startAdornment: <VideoLibrary sx={{ mr: 1, color: isDark ? '#38bdf8' : '#2563eb' }} /> }}
          sx={textFieldStyle}
        />

        <TextField
          fullWidth
          label="Floor Plan Image URL"
          value={formData.floorPlanUrl}
          onChange={(e) => handleInputChange('floorPlanUrl', e.target.value)}
          placeholder="https://..."
          InputProps={{ startAdornment: <Architecture sx={{ mr: 1, color: isDark ? '#38bdf8' : '#2563eb' }} /> }}
          sx={textFieldStyle}
        />
      </Box>

      <Divider sx={{ my: 2, borderColor: isDark ? '#233554' : '#e2e8f0' }} />

      <Typography variant="h6" sx={{ color: isDark ? '#38bdf8' : '#2563eb', fontWeight: 700, mb: 2 }}>
        {t('house_form.upload_3d', '3D Models (.glb / .gltf)')}
      </Typography>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        {modelPreviews.map((_, index) => (
          <Box key={index} sx={{ position: 'relative', width: 120, height: 120 }}>
            <Box
              sx={{
                width: '100%',
                height: '100%',
                backgroundColor: isDark ? '#1e293b' : '#e2e8f0',
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ThreeDRotation sx={{ fontSize: 48, color: isDark ? '#38bdf8' : '#2563eb' }} />
            </Box>
            <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', mt: 0.5, color: isDark ? '#94a3b8' : '#64748b' }}>
              3D Model
            </Typography>
            <IconButton
              size="small"
              onClick={() => removeModel(index)}
              sx={{ position: 'absolute', top: -8, right: -8, backgroundColor: '#ef4444', color: 'white' }}
            >
              <Delete fontSize="small" />
            </IconButton>
          </Box>
        ))}

        <Box
          onClick={() => modelInputRef.current?.click()}
          sx={{
            width: 120,
            height: 120,
            borderRadius: 2,
            border: `2px dashed ${isDark ? '#334155' : '#cbd5e1'}`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            bgcolor: isDark ? 'rgba(30,41,59,0.5)' : '#f8fafc',
            '&:hover': {
              borderColor: isDark ? '#38bdf8' : '#2563eb',
              bgcolor: isDark ? 'rgba(56,189,248,0.05)' : 'rgba(37,99,235,0.05)',
            },
          }}
        >
          <ThreeDRotation sx={{ fontSize: 32, color: isDark ? '#38bdf8' : '#2563eb' }} />
          <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b', mt: 0.5, fontWeight: 600 }}>
            {isAmharic ? '3D ሞዴል ጫን' : 'Upload 3D Model'}
          </Typography>
        </Box>
        <input ref={modelInputRef} type="file" accept=".glb,.gltf,.obj" multiple hidden onChange={handleModelUpload} />
      </Box>

      <Divider sx={{ my: 2, borderColor: isDark ? '#233554' : '#e2e8f0' }} />

      <Typography variant="h6" sx={{ color: isDark ? '#38bdf8' : '#2563eb', fontWeight: 700, mb: 2 }}>
        {isAmharic ? 'የውጭ ቨርቹዋል ቱር ማካተት' : 'Virtual Tour Embed (Optional)'}
      </Typography>

      <FormControlLabel
        control={
          <Switch
            checked={formData.virtualTour.enabled}
            onChange={(e) => handleNestedChange('virtualTour', 'enabled', e.target.checked)}
            color="primary"
          />
        }
        label={isAmharic ? 'የሶስተኛ ወገን ቨርቹዋል ቱር አንቃ' : 'Enable External 3rd Party Tour Embed'}
        sx={{ color: isDark ? '#f1f5f9' : '#0f172a' }}
      />

      {formData.virtualTour.enabled && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            fullWidth
            label="Virtual Tour URL"
            value={formData.virtualTour.url}
            onChange={(e) => handleNestedChange('virtualTour', 'url', e.target.value)}
            placeholder="https://..."
            sx={textFieldStyle}
          />
          <TextField
            fullWidth
            label="Embed Code (Matterport / Kuula)"
            value={formData.virtualTour.embedCode}
            onChange={(e) => handleNestedChange('virtualTour', 'embedCode', e.target.value)}
            multiline
            rows={2}
            placeholder="<iframe>..."
            sx={textFieldStyle}
          />
        </Box>
      )}
    </Box>
  );

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDark ? 'bg-[#0a192f] text-slate-100' : 'bg-slate-50 text-slate-800'}`}>
      <Box sx={{ py: { xs: 2, sm: 3 }, px: { xs: 2, sm: 3, md: 4 } }}>
        <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton
            onClick={() => router.back()}
            sx={{
              color: isDark ? '#38bdf8' : '#2563eb',
              bgcolor: isDark ? '#112240' : '#ffffff',
              border: `1px solid ${isDark ? '#233554' : '#e2e8f0'}`,
              '&:hover': { bgcolor: isDark ? '#1e293b' : '#f1f5f9' },
            }}
          >
            <ArrowBack />
          </IconButton>
          <Box>
            <Typography variant={isMobile ? 'h6' : 'h4'} sx={{ fontWeight: 800, color: isDark ? '#f1f5f9' : '#0f172a' }}>
              {t('house_form.create_title', 'Add New Property')}
            </Typography>
            <Typography variant="body2" sx={{ color: isDark ? '#94a3b8' : '#64748b', mt: 0.5 }}>
              {t('house_form.create_subtitle', 'Fill in the information below to publish a new property listing')}
            </Typography>
          </Box>
        </Box>

        <Stepper
          activeStep={activeStep}
          sx={{
            mb: 4,
            overflowX: 'auto',
            pb: 1,
            '& .MuiStepLabel-label': {
              color: isDark ? '#94a3b8' : '#64748b',
              fontWeight: 500,
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
              '&.Mui-active': { color: isDark ? '#38bdf8' : '#2563eb', fontWeight: 700 },
              '&.Mui-completed': { color: '#22c55e' },
            },
            '& .MuiStepIcon-root': {
              color: isDark ? '#233554' : '#cbd5e1',
              '&.Mui-active': { color: isDark ? '#38bdf8' : '#2563eb' },
              '&.Mui-completed': { color: '#22c55e' },
            },
          }}
        >
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Card
          sx={{
            borderRadius: 3,
            backgroundColor: isDark ? '#112240' : '#ffffff',
            border: `1px solid ${isDark ? '#233554' : '#e2e8f0'}`,
            boxShadow: isDark ? '0 10px 30px rgba(0,0,0,0.4)' : '0 10px 30px rgba(0,0,0,0.05)',
          }}
        >
          <CardContent sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
            {activeStep === 0 && renderBasicInfo()}
            {activeStep === 1 && renderLocationDetails()}
            {activeStep === 2 && renderPricingMedia()}

            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mt: 4,
                pt: 3,
                borderTop: `1px solid ${isDark ? '#233554' : '#e2e8f0'}`,
              }}
            >
              <Button
                variant="outlined"
                onClick={() => setActiveStep((prev) => prev - 1)}
                disabled={activeStep === 0}
                sx={{
                  borderRadius: '10px',
                  fontWeight: 600,
                  textTransform: 'none',
                  borderColor: isDark ? '#233554' : '#cbd5e1',
                  color: isDark ? '#94a3b8' : '#64748b',
                  '&:hover': {
                    borderColor: isDark ? '#38bdf8' : '#2563eb',
                    color: isDark ? '#38bdf8' : '#2563eb',
                    bgcolor: isDark ? 'rgba(56,189,248,0.05)' : 'rgba(37,99,235,0.05)',
                  },
                }}
              >
                {t('common.back', 'Back')}
              </Button>

              {activeStep === steps.length - 1 ? (
                <Button
                  variant="contained"
                  onClick={handleSubmit}
                  disabled={
                    loading ||
                    !formData.title ||
                    !formData.description ||
                    !formData.propertyType ||
                    formData.pricing.price <= 0
                  }
                  startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Save />}
                  sx={{
                    borderRadius: '10px',
                    fontWeight: 700,
                    textTransform: 'none',
                    px: 3,
                    py: 1,
                    backgroundColor: isDark ? '#38bdf8' : '#2563eb',
                    color: isDark ? '#0f172a' : '#ffffff',
                    '&:hover': { backgroundColor: isDark ? '#0284c7' : '#1d4ed8' },
                  }}
                >
                  {loading ? t('common.loading', 'Creating...') : t('house_form.save', 'Create Property')}
                </Button>
              ) : (
                <Button
                  variant="contained"
                  onClick={() => setActiveStep((prev) => prev + 1)}
                  sx={{
                    borderRadius: '10px',
                    fontWeight: 700,
                    textTransform: 'none',
                    px: 3,
                    py: 1,
                    backgroundColor: isDark ? '#38bdf8' : '#2563eb',
                    color: isDark ? '#0f172a' : '#ffffff',
                    '&:hover': { backgroundColor: isDark ? '#0284c7' : '#1d4ed8' },
                  }}
                >
                  {t('common.next', 'Next')}
                </Button>
              )}
            </Box>
          </CardContent>
        </Card>

        <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError('')} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
          <Alert severity="error" onClose={() => setError('')} sx={{ borderRadius: 2 }}>{error}</Alert>
        </Snackbar>
        <Snackbar open={!!success} autoHideDuration={6000} onClose={() => setSuccess('')} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
          <Alert severity="success" onClose={() => setSuccess('')} sx={{ borderRadius: 2 }}>{success}</Alert>
        </Snackbar>
      </Box>
    </div>
  );
};

export default CreateHousePage;