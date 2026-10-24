'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box, Typography, Card, CardContent, TextField,
  Button, Chip, Alert, Snackbar, CircularProgress,
  useMediaQuery, MenuItem, Select, FormControl,
  InputLabel, IconButton, Divider, Stepper, Step,
  StepLabel, Switch, FormControlLabel,
  Autocomplete, Tooltip
} from '@mui/material';
import { motion } from 'framer-motion';
import { useTheme } from '@/lib/theme-context';
import {
  Home, LocationOn, AttachMoney, Bed, Bathtub,
  SquareFoot, ThreeDRotation,
  Add, Delete, ArrowBack, Save, CloudUpload,
  CheckCircle, Cancel, LocalParking, AcUnit,
  Pool, FitnessCenter, Security, Wifi,
  Yard, Garage, Elevator,
  Balcony, SmartToy, Map,
  Verified, Tag as TagIcon, VideoLibrary,
  Panorama, Architecture, Shield, Handshake
} from '@mui/icons-material';
import api from '@/app/utils/api';
import { PropertyType } from '@/types/houses';

const propertyTypes = [
  { value: PropertyType.APARTMENT, label: 'Apartment' },
  { value: PropertyType.VILLA, label: 'Villa' },
  { value: PropertyType.CONDO, label: 'Condo' },
  { value: PropertyType.HOUSE, label: 'House' },
  { value: PropertyType.LAND, label: 'Land' }
];

const transactionTypeOptions = [
  { value: 'RENT', label: 'For Rent (Monthly/Yearly)' },
  { value: 'BUY', label: 'For Sale (Purchase)' },
  { value: 'SHORT_STAY', label: 'Short Stay / Vacation' }
];

const intendedPurposeOptions = [
  { value: 'LIVING', label: 'Residential / Living' },
  { value: 'COMMERCIAL', label: 'Commercial Retail / Shop' },
  { value: 'OFFICE', label: 'Corporate Office' },
  { value: 'INDUSTRIAL', label: 'Industrial / Warehouse' },
  { value: 'EVENT_SHORT_STAY', label: 'Event Venue / Vacation' },
  { value: 'MIXED_USE', label: 'Mixed Use' }
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
  { value: 'smart-home', label: 'Smart Home', icon: <SmartToy /> }
];

const featuresOptions = [
  'Central AC', 'Hardwood Floors', 'Granite Countertops',
  'Stainless Steel Appliances', 'Walk-in Closet', 'Fireplace',
  'Private Yard', 'Covered Patio', 'Laundry Room', 'Storage Space'
];

const steps = ['Basic Information', 'Location & Details', 'Pricing & Media'];

const CreateHousePage = () => {
  const { theme } = useTheme();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const router = useRouter();
  
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    propertyType: '',
    transactionType: 'RENT' as 'RENT' | 'BUY' | 'SHORT_STAY',
    intendedPurpose: 'LIVING' as 'LIVING' | 'COMMERCIAL' | 'OFFICE' | 'INDUSTRIAL' | 'EVENT_SHORT_STAY' | 'MIXED_USE',
    tags: '',
    isVerified: false,
    quantity: 1,
    
    location: {
      address: '',
      city: '',
      state: '',
      country: 'Ethiopia',
      zipCode: '',
      coordinates: { lat: 9.03, lng: 38.74 }
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
      amenities: [] as string[],
      features: [] as string[]
    },
    
    pricing: {
      price: 0,
      maintenanceFee: 0,
      taxAmount: 0,
      securityDeposit: 0
    },

    rentalPricing: {
      frequency: 'monthly' as 'daily' | 'weekly' | 'monthly',
      securityDeposit: 0,
      advancePayments: 1,
      minLeaseDuration: 6
    },

    saleTerms: {
      askingPrice: 0,
      ownershipDocType: 'Freehold Title Deed',
      isNegotiable: true,
      escrowSupported: true,
      downPaymentMin: 20
    },

    videoUrl: '',
    panoramic360Url: '',
    panoramic360Caption: '360° Virtual Tour View',
    floorPlanUrl: '',
    
    virtualTour: {
      enabled: false,
      url: '',
      embedCode: ''
    }
  });
  
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [threeDModels, setThreeDModels] = useState<File[]>([]);
  const [modelPreviews, setModelPreviews] = useState<string[]>([]);
  
  const imageInputRef = useRef<HTMLInputElement>(null);
  const modelInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNestedChange = (section: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...(prev[section as keyof typeof prev] as object),
        [field]: value
      }
    }));
  };

  const handleCoordinatesChange = (field: 'lat' | 'lng', value: number) => {
    setFormData(prev => ({
      ...prev,
      location: {
        ...prev.location,
        coordinates: {
          ...prev.location.coordinates,
          [field]: value
        }
      }
    }));
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const newImages = [...images, ...files];
    setImages(newImages);
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleModelUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const newModels = [...threeDModels, ...files];
    setThreeDModels(newModels);
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setModelPreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const removeModel = (index: number) => {
    setThreeDModels(prev => prev.filter((_, i) => i !== index));
    setModelPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const formDataToSend = new FormData();
      
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('propertyType', formData.propertyType);
      formDataToSend.append('transactionType', formData.transactionType);
      formDataToSend.append('intendedPurpose', formData.intendedPurpose);
      formDataToSend.append('isVerified', formData.isVerified ? 'true' : 'false');
      formDataToSend.append('tags', formData.tags);
      formDataToSend.append('quantity', formData.quantity.toString());
      formDataToSend.append('location', JSON.stringify(formData.location));
      formDataToSend.append('details', JSON.stringify(formData.details));
      formDataToSend.append('pricing', JSON.stringify(formData.pricing));
      formDataToSend.append('virtualTour', JSON.stringify(formData.virtualTour));
      
      if (formData.videoUrl) formDataToSend.append('videoUrl', formData.videoUrl);
      if (formData.panoramic360Url) {
        formDataToSend.append('panoramic360', JSON.stringify({
          enabled: true,
          imageUrl: formData.panoramic360Url,
          caption: formData.panoramic360Caption || '360° Virtual Tour View'
        }));
      }
      if (formData.transactionType === 'RENT' || formData.transactionType === 'SHORT_STAY') {
        formDataToSend.append('rentalPricing', JSON.stringify(formData.rentalPricing));
      }
      if (formData.transactionType === 'BUY') {
        formDataToSend.append('saleTerms', JSON.stringify({
          ...formData.saleTerms,
          askingPrice: formData.saleTerms.askingPrice || formData.pricing.price
        }));
      }
      if (formData.floorPlanUrl) {
        formDataToSend.append('floorPlan', JSON.stringify({
          url: formData.floorPlanUrl,
          rooms: [
            { name: 'Living Room', dimensions: '6.0m x 4.5m', areaSqM: 27 },
            { name: 'Master Bedroom', dimensions: '4.5m x 4.0m', areaSqM: 18 }
          ]
        }));
      }

      images.forEach((image) => {
        formDataToSend.append('images', image);
      });
      
      threeDModels.forEach((model) => {
        formDataToSend.append('threeDModels', model);
      });

      await api.post('/houses', formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setSuccess('House created successfully!');
      setTimeout(() => router.push('/admin/houses'), 2000);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to create house');
    } finally {
      setLoading(false);
    }
  };

  const textFieldStyle = {
    '& .MuiOutlinedInput-root': {
      backgroundColor: theme === 'dark' ? '#1e293b' : 'white',
      color: theme === 'dark' ? '#ccd6f6' : '#333333',
      '& fieldset': { borderColor: theme === 'dark' ? '#334155' : '#e5e7eb' },
      '&:hover fieldset': { borderColor: theme === 'dark' ? '#00ffff' : '#007bff' },
      '&.Mui-focused fieldset': { borderColor: theme === 'dark' ? '#00ffff' : '#007bff' }
    },
    '& .MuiInputLabel-root': { color: theme === 'dark' ? '#a8b2d1' : '#666666' },
    '& .MuiInputLabel-root.Mui-focused': { color: theme === 'dark' ? '#00ffff' : '#007bff' }
  };

  const renderBasicInfo = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <TextField
        fullWidth
        label="Property Title"
        value={formData.title}
        onChange={(e) => handleInputChange('title', e.target.value)}
        required
        placeholder="e.g., Luxury Villa with Ocean View"
        helperText="A descriptive title for your property"
        sx={textFieldStyle}
      />
      
      <TextField
        fullWidth
        label="Description"
        value={formData.description}
        onChange={(e) => handleInputChange('description', e.target.value)}
        required
        multiline
        rows={4}
        placeholder="Describe the property in detail..."
        helperText="Include key features, condition, and selling points"
        sx={textFieldStyle}
      />

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ flex: 1, minWidth: '220px' }}>
          <FormControl fullWidth>
            <InputLabel sx={{ color: theme === 'dark' ? '#a8b2d1' : '#666666' }}>Transaction Type</InputLabel>
            <Select
              value={formData.transactionType}
              label="Transaction Type"
              onChange={(e) => handleInputChange('transactionType', e.target.value)}
              required
              sx={{
                backgroundColor: theme === 'dark' ? '#1e293b' : 'white',
                color: theme === 'dark' ? '#ccd6f6' : '#333333'
              }}
            >
              {transactionTypeOptions.map(t => (
                <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <Box sx={{ flex: 1, minWidth: '220px' }}>
          <FormControl fullWidth>
            <InputLabel sx={{ color: theme === 'dark' ? '#a8b2d1' : '#666666' }}>Intended Purpose</InputLabel>
            <Select
              value={formData.intendedPurpose}
              label="Intended Purpose"
              onChange={(e) => handleInputChange('intendedPurpose', e.target.value)}
              required
              sx={{
                backgroundColor: theme === 'dark' ? '#1e293b' : 'white',
                color: theme === 'dark' ? '#ccd6f6' : '#333333'
              }}
            >
              {intendedPurposeOptions.map(p => (
                <MenuItem key={p.value} value={p.value}>{p.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <Box sx={{ flex: 1, minWidth: '220px' }}>
          <FormControl fullWidth>
            <InputLabel sx={{ color: theme === 'dark' ? '#a8b2d1' : '#666666' }}>Property Category</InputLabel>
            <Select
              value={formData.propertyType}
              label="Property Category"
              onChange={(e) => handleInputChange('propertyType', e.target.value)}
              required
              sx={{
                backgroundColor: theme === 'dark' ? '#1e293b' : 'white',
                color: theme === 'dark' ? '#ccd6f6' : '#333333'
              }}
            >
              {propertyTypes.map(type => (
                <MenuItem key={type.value} value={type.value}>{type.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Box>

      {/* YouTube Style Tags */}
      <TextField
        fullWidth
        label="Tags (YouTube-Style Search Tags)"
        value={formData.tags}
        onChange={(e) => handleInputChange('tags', e.target.value)}
        placeholder="e.g. Bole, Luxury, Furnished, DiplomatArea, NewBuild"
        helperText="Comma-separated tags for instant hashtag discovery (e.g. #Bole, #Furnished)"
        InputProps={{ startAdornment: <TagIcon sx={{ mr: 1, color: theme === 'dark' ? '#00ffff' : '#007bff' }} /> }}
        sx={textFieldStyle}
      />

      {/* Verified Certification */}
      <Box sx={{ p: 2, borderRadius: 2, border: `1px solid ${formData.isVerified ? (theme === 'dark' ? '#00ff0040' : '#28a74540') : (theme === 'dark' ? '#334155' : '#e5e7eb')}`, bgcolor: formData.isVerified ? (theme === 'dark' ? '#00ff0010' : '#28a74510') : 'transparent' }}>
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
              <Shield sx={{ color: formData.isVerified ? '#00ff00' : 'text.secondary' }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Verified Property Listing
              </Typography>
            </Box>
          }
        />
        <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: theme === 'dark' ? '#94a3b8' : '#666666' }}>
          Mark this listing as officially verified with confirmed ownership title deeds, physical inspection, and verified agent credentials.
        </Typography>
      </Box>
    </Box>
  );

  const renderLocationDetails = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <TextField
        fullWidth
        label="Street Address"
        value={formData.location.address}
        onChange={(e) => handleNestedChange('location', 'address', e.target.value)}
        required
        placeholder="123 Main Street"
        sx={textFieldStyle}
      />
      
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ flex: 1, minWidth: '150px' }}>
          <TextField
            fullWidth
            label="City"
            value={formData.location.city}
            onChange={(e) => handleNestedChange('location', 'city', e.target.value)}
            required
            sx={textFieldStyle}
          />
        </Box>
        <Box sx={{ flex: 1, minWidth: '150px' }}>
          <TextField
            fullWidth
            label="State/Province"
            value={formData.location.state}
            onChange={(e) => handleNestedChange('location', 'state', e.target.value)}
            required
            sx={textFieldStyle}
          />
        </Box>
        <Box sx={{ flex: 1, minWidth: '150px' }}>
          <TextField
            fullWidth
            label="ZIP Code"
            value={formData.location.zipCode}
            onChange={(e) => handleNestedChange('location', 'zipCode', e.target.value)}
            sx={textFieldStyle}
          />
        </Box>
      </Box>
      
      <Divider sx={{ my: 2 }} />
      
      <Typography variant="h6" sx={{ color: theme === 'dark' ? '#00ffff' : '#007bff', mb: 2 }}>
        Map Location
      </Typography>
      
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ flex: 1, minWidth: '150px' }}>
        <TextField
          fullWidth
          label="Latitude"
          type="number"
          value={formData.location.coordinates.lat}
          onChange={(e) =>
            handleCoordinatesChange('lat', parseFloat(e.target.value))
          }
          required
          inputProps={{ step: 0.000001 }}   // ✅ FIXED (lowercase i)
          InputProps={{
            startAdornment: <Map sx={{ mr: 1, fontSize: 16 }} />
          }}
          helperText="e.g., 9.03"
          sx={textFieldStyle}
        />
      </Box>

        <Box sx={{ flex: 1, minWidth: '150px' }}>
          <TextField
            onChange={(e) =>
              handleCoordinatesChange('lng', parseFloat(e.target.value))
            }
            required
            inputProps={{ step: 0.000001 }}   // ✅ correct place
            InputProps={{
              startAdornment: <Map sx={{ mr: 1, fontSize: 16 }} />
            }}
            helperText="e.g., 38.74"
            sx={textFieldStyle}
          />
        </Box>

      </Box>
      
      <Divider sx={{ my: 2 }} />
      
      <Typography variant="h6" sx={{ color: theme === 'dark' ? '#00ffff' : '#007bff', mb: 2 }}>
        Property Details
      </Typography>
      
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ flex: 1, minWidth: '120px' }}>
          <TextField
            fullWidth
            label="Bedrooms"
            type="number"
            value={formData.details.bedrooms}
            onChange={(e) => handleNestedChange('details', 'bedrooms', parseInt(e.target.value))}
            InputProps={{ startAdornment: <Bed sx={{ mr: 1 }} /> }}
            sx={textFieldStyle}
          />
        </Box>
        <Box sx={{ flex: 1, minWidth: '120px' }}>
          <TextField
            fullWidth
            label="Bathrooms"
            type="number"
            value={formData.details.bathrooms}
            onChange={(e) => handleNestedChange('details', 'bathrooms', parseInt(e.target.value))}
            InputProps={{ startAdornment: <Bathtub sx={{ mr: 1 }} /> }}
            sx={textFieldStyle}
          />
        </Box>
        <Box sx={{ flex: 1, minWidth: '120px' }}>
          <TextField
            fullWidth
            label="Area (sq ft)"
            type="number"
            value={formData.details.area}
            onChange={(e) => handleNestedChange('details', 'area', parseInt(e.target.value))}
            InputProps={{ startAdornment: <SquareFoot sx={{ mr: 1 }} /> }}
            sx={textFieldStyle}
          />
        </Box>
      </Box>
      
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ flex: 1, minWidth: '120px' }}>
          <TextField
            fullWidth
            label="Year Built"
            type="number"
            value={formData.details.yearBuilt}
            onChange={(e) => handleNestedChange('details', 'yearBuilt', parseInt(e.target.value))}
            sx={textFieldStyle}
          />
        </Box>
        <Box sx={{ flex: 1, minWidth: '120px' }}>
          <TextField
            fullWidth
            label="Floors"
            type="number"
            value={formData.details.floors}
            onChange={(e) => handleNestedChange('details', 'floors', parseInt(e.target.value))}
            sx={textFieldStyle}
          />
        </Box>
        <Box sx={{ flex: 1, minWidth: '120px' }}>
          <TextField
            fullWidth
            label="Parking Spaces"
            type="number"
            value={formData.details.parkingSpaces}
            onChange={(e) => handleNestedChange('details', 'parkingSpaces', parseInt(e.target.value))}
            sx={textFieldStyle}
          />
        </Box>
      </Box>
      
      <FormControlLabel
        control={
          <Switch
            checked={formData.details.furnished}
            onChange={(e) => handleNestedChange('details', 'furnished', e.target.checked)}
            sx={{ color: theme === 'dark' ? '#00ffff' : '#007bff' }}
          />
        }
        label="Fully Furnished"
        sx={{ color: theme === 'dark' ? '#ccd6f6' : '#333333' }}
      />
      
      <Divider sx={{ my: 2 }} />
      
      <Typography variant="h6" sx={{ color: theme === 'dark' ? '#00ffff' : '#007bff', mb: 2 }}>
        Amenities
      </Typography>
      
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {amenitiesOptions.map(amenity => (
          <Chip
            key={amenity.value}
            icon={amenity.icon}
            label={amenity.label}
            onClick={() => {
              const current = formData.details.amenities;
              const updated = current.includes(amenity.value)
                ? current.filter(a => a !== amenity.value)
                : [...current, amenity.value];
              handleNestedChange('details', 'amenities', updated);
            }}
            color={formData.details.amenities.includes(amenity.value) ? 'primary' : 'default'}
            sx={{
              backgroundColor: formData.details.amenities.includes(amenity.value)
                ? (theme === 'dark' ? '#00ffff20' : '#007bff10')
                : (theme === 'dark' ? '#334155' : '#e5e7eb'),
              color: formData.details.amenities.includes(amenity.value)
                ? (theme === 'dark' ? '#00ffff' : '#007bff')
                : (theme === 'dark' ? '#a8b2d1' : '#666666')
            }}
          />
        ))}
      </Box>
      
      <Divider sx={{ my: 2 }} />
      
      <Typography variant="h6" sx={{ color: theme === 'dark' ? '#00ffff' : '#007bff', mb: 2 }}>
        Features
      </Typography>
      
      <Autocomplete
        multiple
        options={featuresOptions}
        value={formData.details.features}
        onChange={(e, newValue) => handleNestedChange('details', 'features', newValue)}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Select Features"
            placeholder="Add features..."
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
                sx={{ backgroundColor: theme === 'dark' ? '#334155' : '#e5e7eb' }}
              />
            );
          })
        }
      />
    </Box>
  );

  const renderPricingMedia = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Typography variant="h6" sx={{ color: theme === 'dark' ? '#00ffff' : '#007bff', mb: 1 }}>
        Pricing & Terms ({formData.transactionType === 'BUY' ? 'For Sale' : formData.transactionType === 'SHORT_STAY' ? 'Short Stay' : 'Rental'})
      </Typography>
      
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ flex: 1, minWidth: '200px' }}>
          <TextField
            fullWidth
            label={formData.transactionType === 'BUY' ? 'Listing Price ($)' : 'Rent Amount ($)'}
            type="number"
            value={formData.pricing.price}
            onChange={(e) => handleNestedChange('pricing', 'price', parseFloat(e.target.value) || 0)}
            required
            InputProps={{ startAdornment: <AttachMoney sx={{ mr: 1 }} /> }}
            helperText={formData.transactionType === 'BUY' ? 'Total purchase price' : 'Base rent according to billing frequency'}
            sx={textFieldStyle}
          />
        </Box>
        <Box sx={{ flex: 1, minWidth: '200px' }}>
          <TextField
            fullWidth
            label="Quantity / Units Available"
            type="number"
            value={formData.quantity}
            onChange={(e) => handleInputChange('quantity', Math.max(1, parseInt(e.target.value) || 1))}
            required
            InputProps={{ inputProps: { min: 1 } }}
            helperText="Number of identical units available"
            sx={textFieldStyle}
          />
        </Box>
      </Box>

      {/* Transaction Type Specific Terms */}
      {formData.transactionType === 'BUY' ? (
        <Box sx={{ p: 2.5, borderRadius: 2, bgcolor: theme === 'dark' ? '#1e293b80' : '#f8fafc', border: `1px solid ${theme === 'dark' ? '#334155' : '#e2e8f0'}` }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, color: theme === 'dark' ? '#f59e0b' : '#d97706', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Handshake /> Purchase Terms & Documentation
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
            <Box sx={{ flex: 1, minWidth: '220px' }}>
              <TextField
                fullWidth
                label="Ownership Document / Title Deed Type"
                value={formData.saleTerms.ownershipDocType}
                onChange={(e) => handleNestedChange('saleTerms', 'ownershipDocType', e.target.value)}
                placeholder="e.g. Freehold Title Deed, 99-Yr Lease, Condo Cert"
                helperText="Type of official property ownership document"
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
                helperText="Minimum initial milestone deposit %"
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
              label="Price Negotiable (Accept Offers)"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={formData.saleTerms.escrowSupported}
                  onChange={(e) => handleNestedChange('saleTerms', 'escrowSupported', e.target.checked)}
                />
              }
              label="Escrow Account Supported"
            />
          </Box>
        </Box>
      ) : (
        <Box sx={{ p: 2.5, borderRadius: 2, bgcolor: theme === 'dark' ? '#1e293b80' : '#f8fafc', border: `1px solid ${theme === 'dark' ? '#334155' : '#e2e8f0'}` }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, color: theme === 'dark' ? '#00ffff' : '#007bff', mb: 2 }}>
            Rental Lease Terms & Schedule
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ flex: 1, minWidth: '180px' }}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: theme === 'dark' ? '#a8b2d1' : '#666666' }}>Billing Frequency</InputLabel>
                <Select
                  value={formData.rentalPricing.frequency}
                  label="Billing Frequency"
                  onChange={(e) => handleNestedChange('rentalPricing', 'frequency', e.target.value)}
                  sx={{
                    backgroundColor: theme === 'dark' ? '#1e293b' : 'white',
                    color: theme === 'dark' ? '#ccd6f6' : '#333333'
                  }}
                >
                  <MenuItem value="monthly">Monthly</MenuItem>
                  <MenuItem value="weekly">Weekly</MenuItem>
                  <MenuItem value="daily">Daily (Short Stay)</MenuItem>
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
                helperText="Required advance rent upfront"
                sx={textFieldStyle}
              />
            </Box>
            <Box sx={{ flex: 1, minWidth: '180px' }}>
              <TextField
                fullWidth
                label="Security Deposit ($)"
                type="number"
                value={formData.rentalPricing.securityDeposit}
                onChange={(e) => handleNestedChange('rentalPricing', 'securityDeposit', parseFloat(e.target.value) || 0)}
                helperText="Refundable damage deposit"
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
                helperText="Minimum contract duration"
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
            label="Maintenance / HOA Fee ($)"
            type="number"
            value={formData.pricing.maintenanceFee}
            onChange={(e) => handleNestedChange('pricing', 'maintenanceFee', parseFloat(e.target.value) || 0)}
            InputProps={{ startAdornment: <AttachMoney sx={{ mr: 1 }} /> }}
            sx={textFieldStyle}
          />
        </Box>
        <Box sx={{ flex: 1, minWidth: '200px' }}>
          <TextField
            fullWidth
            label="Tax Amount ($)"
            type="number"
            value={formData.pricing.taxAmount}
            onChange={(e) => handleNestedChange('pricing', 'taxAmount', parseFloat(e.target.value) || 0)}
            InputProps={{ startAdornment: <AttachMoney sx={{ mr: 1 }} /> }}
            sx={textFieldStyle}
          />
        </Box>
      </Box>
      
      <Divider sx={{ my: 2 }} />
      
      <Typography variant="h6" sx={{ color: theme === 'dark' ? '#00ffff' : '#007bff', mb: 2 }}>
        Property Photos
      </Typography>
      
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        {imagePreviews.map((preview, index) => (
          <Box key={index} sx={{ position: 'relative', width: 120, height: 120 }}>
            <img src={preview} alt={`Preview ${index}`} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }} />
            <IconButton
              size="small"
              onClick={() => removeImage(index)}
              sx={{ position: 'absolute', top: -8, right: -8, backgroundColor: '#ff0000', color: 'white', '&:hover': { backgroundColor: '#cc0000' } }}
            >
              <Delete fontSize="small" />
            </IconButton>
          </Box>
        ))}
        
        <Box
          onClick={() => imageInputRef.current?.click()}
          sx={{
            width: 120, height: 120, borderRadius: 2,
            border: `2px dashed ${theme === 'dark' ? '#334155' : '#e5e7eb'}`,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', '&:hover': { borderColor: theme === 'dark' ? '#00ffff' : '#007bff' }
          }}
        >
          <CloudUpload sx={{ fontSize: 32, color: theme === 'dark' ? '#a8b2d1' : '#666666' }} />
          <Typography variant="caption" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>Upload Photo</Typography>
        </Box>
        <input ref={imageInputRef} type="file" accept="image/*" multiple hidden onChange={handleImageUpload} />
      </Box>
      
      <Divider sx={{ my: 2 }} />
      
      {/* Rich Media Section */}
      <Typography variant="h6" sx={{ color: theme === 'dark' ? '#00ffff' : '#007bff', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Panorama /> Rich Media: 360° Virtual Tour & Walkthrough Video
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ flex: 2, minWidth: '260px' }}>
            <TextField
              fullWidth
              label="360° Panoramic Equirectangular Image URL"
              value={formData.panoramic360Url}
              onChange={(e) => handleInputChange('panoramic360Url', e.target.value)}
              placeholder="https://images.unsplash.com/... or cloud image URL"
              helperText="Enables interactive Three.js 360 virtual tour"
              InputProps={{ startAdornment: <Panorama sx={{ mr: 1, color: theme === 'dark' ? '#00ffff' : '#007bff' }} /> }}
              sx={textFieldStyle}
            />
          </Box>
          <Box sx={{ flex: 1, minWidth: '180px' }}>
            <TextField
              fullWidth
              label="360 Tour Caption"
              value={formData.panoramic360Caption}
              onChange={(e) => handleInputChange('panoramic360Caption', e.target.value)}
              placeholder="e.g. Master Suite & Living Room"
              sx={textFieldStyle}
            />
          </Box>
        </Box>

        <TextField
          fullWidth
          label="Walkthrough Video URL (YouTube, Vimeo, or MP4)"
          value={formData.videoUrl}
          onChange={(e) => handleInputChange('videoUrl', e.target.value)}
          placeholder="https://www.youtube.com/watch?v=... or direct MP4 URL"
          helperText="Embedded video walkthrough for remote buyers/tenants"
          InputProps={{ startAdornment: <VideoLibrary sx={{ mr: 1, color: theme === 'dark' ? '#00ffff' : '#007bff' }} /> }}
          sx={textFieldStyle}
        />

        <TextField
          fullWidth
          label="Architectural Floor Plan Image URL"
          value={formData.floorPlanUrl}
          onChange={(e) => handleInputChange('floorPlanUrl', e.target.value)}
          placeholder="https://images.unsplash.com/... or architectural blueprint URL"
          helperText="Display interactive room dimensions and layout"
          InputProps={{ startAdornment: <Architecture sx={{ mr: 1, color: theme === 'dark' ? '#00ffff' : '#007bff' }} /> }}
          sx={textFieldStyle}
        />
      </Box>

      <Divider sx={{ my: 2 }} />

      <Typography variant="h6" sx={{ color: theme === 'dark' ? '#00ffff' : '#007bff', mb: 2 }}>
        3D Models (.glb / .gltf)
      </Typography>
      
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        {modelPreviews.map((preview, index) => (
          <Box key={index} sx={{ position: 'relative', width: 120, height: 120 }}>
            <Box sx={{ width: '100%', height: '100%', backgroundColor: theme === 'dark' ? '#334155' : '#e5e7eb', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ThreeDRotation sx={{ fontSize: 48, color: theme === 'dark' ? '#a8b2d1' : '#666666' }} />
            </Box>
            <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', mt: 0.5 }}>3D Model</Typography>
            <IconButton
              size="small"
              onClick={() => removeModel(index)}
              sx={{ position: 'absolute', top: -8, right: -8, backgroundColor: '#ff0000', color: 'white' }}
            >
              <Delete fontSize="small" />
            </IconButton>
          </Box>
        ))}
        
        <Box
          onClick={() => modelInputRef.current?.click()}
          sx={{
            width: 120, height: 120, borderRadius: 2,
            border: `2px dashed ${theme === 'dark' ? '#334155' : '#e5e7eb'}`,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', '&:hover': { borderColor: theme === 'dark' ? '#00ffff' : '#007bff' }
          }}
        >
          <ThreeDRotation sx={{ fontSize: 32, color: theme === 'dark' ? '#a8b2d1' : '#666666' }} />
          <Typography variant="caption" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>Upload 3D Model</Typography>
          <Typography variant="caption" color={theme === 'dark' ? '#94a3b8' : '#999999'} fontSize="10px">.glb, .gltf</Typography>
        </Box>
        <input ref={modelInputRef} type="file" accept=".glb,.gltf,.obj" multiple hidden onChange={handleModelUpload} />
      </Box>
      
      <Divider sx={{ my: 2 }} />
      
      <Typography variant="h6" sx={{ color: theme === 'dark' ? '#00ffff' : '#007bff', mb: 2 }}>
        Virtual Tour Embed (Optional)
      </Typography>
      
      <FormControlLabel
        control={
          <Switch
            checked={formData.virtualTour.enabled}
            onChange={(e) => handleNestedChange('virtualTour', 'enabled', e.target.checked)}
          />
        }
        label="Enable External 3rd Party Tour Embed"
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
    <div className={`min-h-screen transition-colors duration-300 ${
      theme === 'dark' 
        ? 'bg-gradient-to-br from-[#0a192f] to-[#112240]' 
        : 'bg-gradient-to-br from-[#f0f0f0] to-[#ffffff]'
    }`}>
      <Box sx={{ py: 3, px: { xs: 2, md: 4 } }}>
        <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => router.back()} sx={{ color: theme === 'dark' ? '#00ffff' : '#007bff' }}>
            <ArrowBack />
          </IconButton>
          <Typography variant={isMobile ? "h5" : "h4"} sx={{ fontWeight: 'bold', color: theme === 'dark' ? '#ccd6f6' : '#333333' }}>
            Add New Property
          </Typography>
        </Box>
        
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        
        <Card sx={{ borderRadius: 3, backgroundColor: theme === 'dark' ? '#0f172a80' : 'white', backdropFilter: theme === 'dark' ? 'blur(10px)' : 'none' }}>
          <CardContent sx={{ p: { xs: 2, md: 4 } }}>
            {activeStep === 0 && renderBasicInfo()}
            {activeStep === 1 && renderLocationDetails()}
            {activeStep === 2 && renderPricingMedia()}
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
              <Button
                variant="outlined"
                onClick={() => setActiveStep(prev => prev - 1)}
                disabled={activeStep === 0}
                sx={{ borderColor: theme === 'dark' ? '#00ffff' : '#007bff', color: theme === 'dark' ? '#00ffff' : '#007bff' }}
              >
                Back
              </Button>
              
              {activeStep === steps.length - 1 ? (
                <Button
                  variant="contained"
                  onClick={handleSubmit}
                  disabled={loading || !formData.title || !formData.description || !formData.propertyType || formData.pricing.price <= 0}
                  startIcon={loading ? <CircularProgress size={20} /> : <Save />}
                  sx={{
                    background: theme === 'dark' ? 'linear-gradient(135deg, #00ffff, #00b3b3)' : 'linear-gradient(135deg, #007bff, #0056b3)',
                    '&:hover': { background: theme === 'dark' ? 'linear-gradient(135deg, #00b3b3, #008080)' : 'linear-gradient(135deg, #0056b3, #004080)' }
                  }}
                >
                  {loading ? 'Creating...' : 'Create Property'}
                </Button>
              ) : (
                <Button
                  variant="contained"
                  onClick={() => setActiveStep(prev => prev + 1)}
                  sx={{
                    background: theme === 'dark' ? 'linear-gradient(135deg, #00ffff, #00b3b3)' : 'linear-gradient(135deg, #007bff, #0056b3)'
                  }}
                >
                  Next
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