'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Box, Typography, Card, CardContent, TextField,
  Button, Chip, Alert, Snackbar, CircularProgress,
  useMediaQuery, MenuItem, Select, FormControl,
  InputLabel, IconButton, Divider, Stepper, Step,
  StepLabel, Switch, FormControlLabel,
  Autocomplete
} from '@mui/material';
import { motion } from 'framer-motion';
import { useTheme } from '@/lib/theme-context';
import { useLanguage } from '@/lib/language-context';
import {
  Home, LocationOn, AttachMoney, Bed, Bathtub,
  SquareFoot, ThreeDRotation,
  Delete, ArrowBack, Save, CloudUpload,
  LocalParking, AcUnit,
  Pool, FitnessCenter, Security, Wifi,
  Yard, Elevator, Balcony, SmartToy, Map
} from '@mui/icons-material';
import api from '@/app/utils/api';
import { PropertyType } from '@/types/houses';

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

const EditHousePage = () => {
  const { theme } = useTheme();
  const { t, isAmharic } = useLanguage();
  const isDark = theme === 'dark';
  const isMobile = useMediaQuery('(max-width: 768px)');
  const router = useRouter();
  const params = useParams();
  const houseId = params.id as string;

  const propertyTypes = [
    { value: PropertyType.APARTMENT, label: t('property.apartment', 'Apartment') },
    { value: PropertyType.VILLA, label: t('property.villa', 'Villa') },
    { value: PropertyType.CONDO, label: t('property.condo', 'Condo') },
    { value: PropertyType.HOUSE, label: t('property.house', 'House') },
    { value: PropertyType.LAND, label: t('property.land', 'Land') }
  ];

  const steps = [
    t('house_form.step_basic', 'Basic Information'),
    t('house_form.step_location', 'Location & Details'),
    t('house_form.step_pricing', 'Pricing & Media')
  ];
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeStep, setActiveStep] = useState(0);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    propertyType: '',
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
    
    virtualTour: {
      enabled: false,
      url: '',
      embedCode: ''
    }
  });
  
  // Image management - like approve page
  const [existingImages, setExistingImages] = useState<any[]>([]);
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([]);
  
  // 3D Model management
  const [existingModels, setExistingModels] = useState<any[]>([]);
  const [newModels, setNewModels] = useState<File[]>([]);
  const [modelPreviews, setModelPreviews] = useState<string[]>([]);
  const [modelsToDelete, setModelsToDelete] = useState<string[]>([]);
  
  const imageInputRef = useRef<HTMLInputElement>(null);
  const modelInputRef = useRef<HTMLInputElement>(null);

  // Get image URL from admin image endpoint
  const getImageUrl = (index: number): string => {
    const serverUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    return `${serverUrl}/api/houses/${houseId}/image?index=${index}`;
  };

  const handleImageError = (index: number) => {
    setImageErrors(prev => ({ ...prev, [index.toString()]: true }));
  };

  const fetchHouse = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/houses/${houseId}`);
      const house = response.data.data;
      
      // Populate form data
      setFormData({
        title: house.title || '',
        description: house.description || '',
        propertyType: house.propertyType || '',
        quantity: house.pricing?.quantity || 1,
        location: house.location || {
          address: '',
          city: '',
          state: '',
          country: 'Ethiopia',
          zipCode: '',
          coordinates: { lat: 9.03, lng: 38.74 }
        },
        details: house.details || {
          bedrooms: 0,
          bathrooms: 0,
          area: 0,
          lotSize: 0,
          yearBuilt: new Date().getFullYear(),
          floors: 1,
          parkingSpaces: 0,
          furnished: false,
          amenities: [],
          features: []
        },
        pricing: {
          price: house.pricing?.price || 0,
          maintenanceFee: house.pricing?.maintenanceFee || 0,
          taxAmount: house.pricing?.taxAmount || 0,
          securityDeposit: house.pricing?.securityDeposit || 0
        },
        virtualTour: house.virtualTour || { enabled: false, url: '', embedCode: '' }
      });
      
      // Store existing images with URLs (like approve page)
      if (house.images && house.images.length > 0) {
        setExistingImages(house.images);
        // Generate URLs for each image
        const urls = house.images.map((_: any, idx: number) => getImageUrl(idx));
        setExistingImageUrls(urls);
      }
      
      setExistingModels(house.threeDModels || []);
      
    } catch (error: any) {
      console.error('Error fetching house:', error);
      setError(error.response?.data?.message || 'Failed to fetch house details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (houseId) {
      fetchHouse();
    }
  }, [houseId]);

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
    const newImagesList = [...newImages, ...files];
    setNewImages(newImagesList);
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewImagePreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleModelUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const newModelsList = [...newModels, ...files];
    setNewModels(newModelsList);
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setModelPreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDeleteExistingImage = (index: number) => {
    const imageId = existingImages[index]?._id;
    if (imageId) {
      setImagesToDelete(prev => [...prev, imageId]);
    }
    setExistingImages(prev => prev.filter((_, i) => i !== index));
    setExistingImageUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleDeleteNewImage = (index: number) => {
    setNewImages(prev => prev.filter((_, i) => i !== index));
    setNewImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleDeleteExistingModel = (index: number) => {
    const modelId = existingModels[index]?._id;
    if (modelId) {
      setModelsToDelete(prev => [...prev, modelId]);
    }
    setExistingModels(prev => prev.filter((_, i) => i !== index));
  };

  const handleDeleteNewModel = (index: number) => {
    setNewModels(prev => prev.filter((_, i) => i !== index));
    setModelPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    try {
      setSaving(true);
      const formDataToSend = new FormData();
      
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('propertyType', formData.propertyType);
      formDataToSend.append('quantity', formData.quantity.toString());
      formDataToSend.append('location', JSON.stringify(formData.location));
      formDataToSend.append('details', JSON.stringify(formData.details));
      formDataToSend.append('pricing', JSON.stringify(formData.pricing));
      formDataToSend.append('virtualTour', JSON.stringify(formData.virtualTour));
      
      // Send images to keep (existing images not marked for deletion)
      const keepImageIds = existingImages.map(img => img._id).filter(id => !imagesToDelete.includes(id));
      formDataToSend.append('keepImages', JSON.stringify(keepImageIds));
      
      // Send new images
      newImages.forEach((image) => {
        formDataToSend.append('images', image);
      });
      
      // Send models to keep
      const keepModelIds = existingModels.map(model => model._id).filter(id => !modelsToDelete.includes(id));
      formDataToSend.append('keepModels', JSON.stringify(keepModelIds));
      
      // Send new 3D models
      newModels.forEach((model) => {
        formDataToSend.append('threeDModels', model);
      });

      await api.put(`/houses/${houseId}`, formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setSuccess('House updated successfully!');
      setTimeout(() => router.push('/admin/houses'), 2000);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to update house');
    } finally {
      setSaving(false);
    }
  };

  const textFieldStyle = {
    '& .MuiOutlinedInput-root': {
      backgroundColor: isDark ? '#1e293b' : 'white',
      color: isDark ? '#f1f5f9' : '#0f172a',
      borderRadius: '10px',
      '& fieldset': { borderColor: isDark ? '#334155' : '#cbd5e1' },
      '&:hover fieldset': { borderColor: isDark ? '#38bdf8' : '#2563eb' },
      '&.Mui-focused fieldset': { borderColor: isDark ? '#38bdf8' : '#2563eb' }
    },
    '& .MuiInputLabel-root': { color: isDark ? '#94a3b8' : '#64748b' },
    '& .MuiInputLabel-root.Mui-focused': { color: isDark ? '#38bdf8' : '#2563eb' },
    '& .MuiFormHelperText-root': { color: isDark ? '#94a3b8' : '#64748b' }
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-[#0a192f] text-slate-100' : 'bg-slate-50 text-slate-800'}`}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
          <CircularProgress size={60} sx={{ color: isDark ? '#38bdf8' : '#2563eb' }} />
        </Box>
      </div>
    );
  }

  const renderBasicInfo = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <TextField
        fullWidth
        label={t('house_form.prop_title', 'Property Title')}
        value={formData.title}
        onChange={(e) => handleInputChange('title', e.target.value)}
        required
        placeholder={t('house_form.prop_title_ph', 'e.g. Modern Villa in Bole')}
        helperText={isAmharic ? 'የቤቱን መጠሪያ ወይም አጭር ማብራሪያ ያስገቡ' : 'A descriptive title for your property'}
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
      
      <FormControl fullWidth>
        <InputLabel sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>{t('house_form.category', 'Property Category')}</InputLabel>
        <Select
          value={formData.propertyType}
          label={t('house_form.category', 'Property Category')}
          onChange={(e) => handleInputChange('propertyType', e.target.value)}
          required
          sx={{
            backgroundColor: isDark ? '#1e293b' : 'white',
            color: isDark ? '#f1f5f9' : '#0f172a',
            borderRadius: '10px'
          }}
        >
          {propertyTypes.map(type => (
            <MenuItem key={type.value} value={type.value}>{type.label}</MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );

  const renderLocationDetails = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <TextField
        fullWidth
        label={t('house_form.address', 'Street Address')}
        value={formData.location.address}
        onChange={(e) => handleNestedChange('location', 'address', e.target.value)}
        required
        placeholder={isAmharic ? 'ለምሳሌ፡ ቦሌ መንገድ፣ የቤት ቁጥር 123' : '123 Main Street'}
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
            onChange={(e) =>
              handleCoordinatesChange('lat', parseFloat(e.target.value))
            }
            required
            InputProps={{
              startAdornment: <Map sx={{ mr: 1, fontSize: 16, color: isDark ? '#38bdf8' : '#2563eb' }} />
            }}
            inputProps={{
              step: 0.000001
            }}
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
            onChange={(e) =>
              handleCoordinatesChange('lng', parseFloat(e.target.value))
            }
            required
            InputProps={{
              startAdornment: <Map sx={{ mr: 1, fontSize: 16, color: isDark ? '#38bdf8' : '#2563eb' }} />
            }}
            inputProps={{
              step: 0.000001
            }}
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
            onChange={(e) => handleNestedChange('details', 'furnished', e.target.checked)}
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
        {amenitiesOptions.map(amenity => {
          const isSelected = formData.details.amenities.includes(amenity.value);
          return (
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
              sx={{
                borderRadius: '8px',
                fontWeight: 600,
                backgroundColor: isSelected
                  ? (isDark ? 'rgba(56, 189, 248, 0.2)' : 'rgba(37, 99, 235, 0.15)')
                  : (isDark ? '#1e293b' : '#f1f5f9'),
                border: isSelected
                  ? `1px solid ${isDark ? '#38bdf8' : '#2563eb'}`
                  : `1px solid ${isDark ? '#334155' : '#cbd5e1'}`,
                color: isSelected
                  ? (isDark ? '#38bdf8' : '#2563eb')
                  : (isDark ? '#94a3b8' : '#64748b'),
                '& .MuiChip-icon': {
                  color: isSelected ? (isDark ? '#38bdf8' : '#2563eb') : 'inherit'
                }
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
        options={featuresOptions}
        value={formData.details.features}
        onChange={(e, newValue) => handleNestedChange('details', 'features', newValue)}
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
                  borderRadius: '6px'
                }}
              />
            );
          })
        }
      />
    </Box>
  );

  const renderPricingMedia = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Typography variant="h6" sx={{ color: isDark ? '#38bdf8' : '#2563eb', fontWeight: 700, mb: 1 }}>
        {isAmharic ? 'የዋጋ እና የክፍያ ሁኔታ' : 'Pricing & Availability'}
      </Typography>
      
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ flex: 1, minWidth: '200px' }}>
          <TextField
            fullWidth
            label={t('house_form.price', 'Price ($)')}
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
            label={t('house_form.quantity', 'Quantity Available')}
            type="number"
            value={formData.quantity}
            onChange={(e) => handleInputChange('quantity', Math.max(1, parseInt(e.target.value) || 1))}
            required
            InputProps={{ inputProps: { min: 1 } }}
            helperText={isAmharic ? 'የሚገኙ ተመሳሳይ ቤቶች ብዛት' : 'Number of units available'}
            sx={textFieldStyle}
          />
        </Box>
      </Box>
      
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ flex: 1, minWidth: '200px' }}>
          <TextField
            fullWidth
            label={isAmharic ? 'የጥገና / አስተዳደር ክፍያ ($)' : 'Maintenance Fee ($)'}
            type="number"
            value={formData.pricing.maintenanceFee}
            onChange={(e) => handleNestedChange('pricing', 'maintenanceFee', parseFloat(e.target.value) || 0)}
            InputProps={{ startAdornment: <AttachMoney sx={{ mr: 1, color: isDark ? '#94a3b8' : '#64748b' }} /> }}
            sx={textFieldStyle}
          />
        </Box>
        <Box sx={{ flex: 1, minWidth: '200px' }}>
          <TextField
            fullWidth
            label={isAmharic ? 'የግብር መጠን ($)' : 'Tax Amount ($)'}
            type="number"
            value={formData.pricing.taxAmount}
            onChange={(e) => handleNestedChange('pricing', 'taxAmount', parseFloat(e.target.value) || 0)}
            InputProps={{ startAdornment: <AttachMoney sx={{ mr: 1, color: isDark ? '#94a3b8' : '#64748b' }} /> }}
            sx={textFieldStyle}
          />
        </Box>
      </Box>
      
      <Divider sx={{ my: 2, borderColor: isDark ? '#233554' : '#e2e8f0' }} />
      
      <Typography variant="h6" sx={{ color: isDark ? '#38bdf8' : '#2563eb', fontWeight: 700, mb: 2 }}>
        {t('house_form.upload_images', 'Property Images')}
      </Typography>
      
      {/* Existing Images - Like Approve Page */}
      {existingImageUrls.length > 0 && (
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1, color: isDark ? '#94a3b8' : '#64748b', fontWeight: 600 }}>
            {isAmharic ? 'ነባር ፎቶዎች' : 'Existing Images'} ({existingImageUrls.length})
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            {existingImageUrls.map((url, index) => (
              <Box key={`existing-${index}`} sx={{ position: 'relative', width: 120, height: 120 }}>
                <img 
                  src={url} 
                  alt={`Existing ${index}`} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }}
                  onError={() => handleImageError(index)}
                />
                <IconButton
                  size="small"
                  onClick={() => handleDeleteExistingImage(index)}
                  sx={{ position: 'absolute', top: -8, right: -8, backgroundColor: '#ef4444', color: 'white', '&:hover': { backgroundColor: '#dc2626' } }}
                >
                  <Delete fontSize="small" />
                </IconButton>
              </Box>
            ))}
          </Box>
        </Box>
      )}
      
      {/* New Images */}
      {newImagePreviews.length > 0 && (
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1, color: isDark ? '#94a3b8' : '#64748b', fontWeight: 600 }}>
            {isAmharic ? 'አዳዲስ ፎቶዎች' : 'New Images'} ({newImagePreviews.length})
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            {newImagePreviews.map((preview, index) => (
              <Box key={`new-${index}`} sx={{ position: 'relative', width: 120, height: 120 }}>
                <img src={preview} alt={`New ${index}`} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }} />
                <IconButton
                  size="small"
                  onClick={() => handleDeleteNewImage(index)}
                  sx={{ position: 'absolute', top: -8, right: -8, backgroundColor: '#ef4444', color: 'white', '&:hover': { backgroundColor: '#dc2626' } }}
                >
                  <Delete fontSize="small" />
                </IconButton>
              </Box>
            ))}
          </Box>
        </Box>
      )}
      
      {/* Upload Button */}
      <Box
        onClick={() => imageInputRef.current?.click()}
        sx={{
          width: 120, height: 120, borderRadius: 2,
          border: `2px dashed ${isDark ? '#334155' : '#cbd5e1'}`,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
          bgcolor: isDark ? 'rgba(30, 41, 59, 0.5)' : '#f8fafc',
          '&:hover': { borderColor: isDark ? '#38bdf8' : '#2563eb', bgcolor: isDark ? 'rgba(56, 189, 248, 0.05)' : 'rgba(37, 99, 235, 0.05)' }
        }}
      >
        <CloudUpload sx={{ fontSize: 32, color: isDark ? '#38bdf8' : '#2563eb' }} />
        <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b', mt: 0.5, fontWeight: 600 }}>
          {isAmharic ? 'ፎቶ ጨምር' : 'Add Image'}
        </Typography>
      </Box>
      <input ref={imageInputRef} type="file" accept="image/*" multiple hidden onChange={handleImageUpload} />
      
      <Divider sx={{ my: 2, borderColor: isDark ? '#233554' : '#e2e8f0' }} />
      
      <Typography variant="h6" sx={{ color: isDark ? '#38bdf8' : '#2563eb', fontWeight: 700, mb: 2 }}>
        {t('house_form.upload_3d', '3D Models (Optional)')}
      </Typography>
      
      {/* Existing 3D Models */}
      {existingModels.length > 0 && (
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1, color: isDark ? '#94a3b8' : '#64748b', fontWeight: 600 }}>
            {isAmharic ? 'ነባር 3D ሞዴሎች' : 'Existing 3D Models'} ({existingModels.length})
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            {existingModels.map((model, index) => (
              <Box key={`existing-model-${index}`} sx={{ position: 'relative', width: 120, height: 120 }}>
                <Box sx={{ width: '100%', height: '100%', backgroundColor: isDark ? '#1e293b' : '#e2e8f0', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ThreeDRotation sx={{ fontSize: 48, color: isDark ? '#38bdf8' : '#2563eb' }} />
                </Box>
                <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', mt: 0.5, color: isDark ? '#94a3b8' : '#64748b' }}>{model.fileName || '3D Model'}</Typography>
                <IconButton
                  size="small"
                  onClick={() => handleDeleteExistingModel(index)}
                  sx={{ position: 'absolute', top: -8, right: -8, backgroundColor: '#ef4444', color: 'white' }}
                >
                  <Delete fontSize="small" />
                </IconButton>
              </Box>
            ))}
          </Box>
        </Box>
      )}
      
      {/* New 3D Models */}
      {modelPreviews.length > 0 && (
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1, color: isDark ? '#94a3b8' : '#64748b', fontWeight: 600 }}>
            {isAmharic ? 'አዳዲስ 3D ሞዴሎች' : 'New 3D Models'} ({modelPreviews.length})
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            {modelPreviews.map((preview, index) => (
              <Box key={`new-model-${index}`} sx={{ position: 'relative', width: 120, height: 120 }}>
                <Box sx={{ width: '100%', height: '100%', backgroundColor: isDark ? '#1e293b' : '#e2e8f0', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ThreeDRotation sx={{ fontSize: 48, color: isDark ? '#38bdf8' : '#2563eb' }} />
                </Box>
                <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', mt: 0.5, color: isDark ? '#94a3b8' : '#64748b' }}>New Model</Typography>
                <IconButton
                  size="small"
                  onClick={() => handleDeleteNewModel(index)}
                  sx={{ position: 'absolute', top: -8, right: -8, backgroundColor: '#ef4444', color: 'white' }}
                >
                  <Delete fontSize="small" />
                </IconButton>
              </Box>
            ))}
          </Box>
        </Box>
      )}
      
      {/* Upload 3D Model Button */}
      <Box
        onClick={() => modelInputRef.current?.click()}
        sx={{
          width: 120, height: 120, borderRadius: 2,
          border: `2px dashed ${isDark ? '#334155' : '#cbd5e1'}`,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
          bgcolor: isDark ? 'rgba(30, 41, 59, 0.5)' : '#f8fafc',
          '&:hover': { borderColor: isDark ? '#38bdf8' : '#2563eb', bgcolor: isDark ? 'rgba(56, 189, 248, 0.05)' : 'rgba(37, 99, 235, 0.05)' }
        }}
      >
        <ThreeDRotation sx={{ fontSize: 32, color: isDark ? '#38bdf8' : '#2563eb' }} />
        <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b', mt: 0.5, fontWeight: 600 }}>
          {isAmharic ? '3D ሞዴል ጨምር' : 'Add 3D Model'}
        </Typography>
        <Typography variant="caption" color={isDark ? '#64748b' : '#94a3b8'} fontSize="10px">.glb, .gltf, .obj</Typography>
      </Box>
      <input ref={modelInputRef} type="file" accept=".glb,.gltf,.obj" multiple hidden onChange={handleModelUpload} />
      
      <Divider sx={{ my: 2, borderColor: isDark ? '#233554' : '#e2e8f0' }} />
      
      <Typography variant="h6" sx={{ color: isDark ? '#38bdf8' : '#2563eb', fontWeight: 700, mb: 2 }}>
        {isAmharic ? 'ቨርቹዋል ጉብኝት' : 'Virtual Tour (Optional)'}
      </Typography>
      
      <FormControlLabel
        control={
          <Switch
            checked={formData.virtualTour.enabled}
            onChange={(e) => handleNestedChange('virtualTour', 'enabled', e.target.checked)}
            color="primary"
          />
        }
        label={isAmharic ? 'ቨርቹዋል ጉብኝት አንቃ' : 'Enable Virtual Tour'}
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
            label={isAmharic ? 'የመክተቻ ኮድ (Matterport / Kuula)' : 'Embed Code'}
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
      isDark 
        ? 'bg-[#0a192f] text-slate-100' 
        : 'bg-slate-50 text-slate-800'
    }`}>
      <Box sx={{ py: { xs: 2, sm: 3 }, px: { xs: 2, sm: 3, md: 4 } }}>
        <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton 
            onClick={() => router.back()} 
            sx={{ 
              color: isDark ? '#38bdf8' : '#2563eb',
              bgcolor: isDark ? '#112240' : '#ffffff',
              border: `1px solid ${isDark ? '#233554' : '#e2e8f0'}`,
              '&:hover': { bgcolor: isDark ? '#1e293b' : '#f1f5f9' }
            }}
          >
            <ArrowBack />
          </IconButton>
          <Box>
            <Typography variant={isMobile ? "h6" : "h4"} sx={{ fontWeight: 800, color: isDark ? '#f1f5f9' : '#0f172a' }}>
              {t('house_form.edit_title', 'Edit Property')}
            </Typography>
            <Typography variant="body2" sx={{ color: isDark ? '#94a3b8' : '#64748b', mt: 0.5 }}>
              {t('house_form.edit_subtitle', 'Update property details, pricing, media, and location')}
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
              '&.Mui-active': {
                color: isDark ? '#38bdf8' : '#2563eb',
                fontWeight: 700
              },
              '&.Mui-completed': {
                color: '#22c55e'
              }
            },
            '& .MuiStepIcon-root': {
              color: isDark ? '#233554' : '#cbd5e1',
              '&.Mui-active': {
                color: isDark ? '#38bdf8' : '#2563eb'
              },
              '&.Mui-completed': {
                color: '#22c55e'
              }
            }
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
            backdropFilter: 'none'
          }}
        >
          <CardContent sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
            {activeStep === 0 && renderBasicInfo()}
            {activeStep === 1 && renderLocationDetails()}
            {activeStep === 2 && renderPricingMedia()}
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 4, pt: 3, borderTop: `1px solid ${isDark ? '#233554' : '#e2e8f0'}` }}>
              <Button
                variant="outlined"
                onClick={() => setActiveStep(prev => prev - 1)}
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
                    bgcolor: isDark ? 'rgba(56, 189, 248, 0.05)' : 'rgba(37, 99, 235, 0.05)'
                  }
                }}
              >
                {t('common.back', 'Back')}
              </Button>
              
              {activeStep === steps.length - 1 ? (
                <Button
                  variant="contained"
                  onClick={handleSubmit}
                  disabled={saving || !formData.title || !formData.description || !formData.propertyType || formData.pricing.price <= 0}
                  startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <Save />}
                  sx={{
                    borderRadius: '10px',
                    fontWeight: 700,
                    textTransform: 'none',
                    px: 3,
                    py: 1,
                    backgroundColor: isDark ? '#38bdf8' : '#2563eb',
                    color: isDark ? '#0f172a' : '#ffffff',
                    '&:hover': { 
                      backgroundColor: isDark ? '#0284c7' : '#1d4ed8' 
                    }
                  }}
                >
                  {saving ? t('common.loading', 'Saving...') : t('house_form.update', 'Save Changes')}
                </Button>
              ) : (
                <Button
                  variant="contained"
                  onClick={() => setActiveStep(prev => prev + 1)}
                  sx={{
                    borderRadius: '10px',
                    fontWeight: 700,
                    textTransform: 'none',
                    px: 3,
                    py: 1,
                    backgroundColor: isDark ? '#38bdf8' : '#2563eb',
                    color: isDark ? '#0f172a' : '#ffffff',
                    '&:hover': { 
                      backgroundColor: isDark ? '#0284c7' : '#1d4ed8' 
                    }
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

export default EditHousePage;