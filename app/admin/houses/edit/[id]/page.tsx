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

const propertyTypes = [
  { value: PropertyType.APARTMENT, label: 'Apartment' },
  { value: PropertyType.VILLA, label: 'Villa' },
  { value: PropertyType.CONDO, label: 'Condo' },
  { value: PropertyType.HOUSE, label: 'House' },
  { value: PropertyType.LAND, label: 'Land' }
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

const EditHousePage = () => {
  const { theme } = useTheme();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const router = useRouter();
  const params = useParams();
  const houseId = params.id as string;
  
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
      backgroundColor: theme === 'dark' ? '#1e293b' : 'white',
      color: theme === 'dark' ? '#ccd6f6' : '#333333',
      '& fieldset': { borderColor: theme === 'dark' ? '#334155' : '#e5e7eb' },
      '&:hover fieldset': { borderColor: theme === 'dark' ? '#00ffff' : '#007bff' },
      '&.Mui-focused fieldset': { borderColor: theme === 'dark' ? '#00ffff' : '#007bff' }
    },
    '& .MuiInputLabel-root': { color: theme === 'dark' ? '#a8b2d1' : '#666666' },
    '& .MuiInputLabel-root.Mui-focused': { color: theme === 'dark' ? '#00ffff' : '#007bff' }
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${theme === 'dark' ? 'bg-gradient-to-br from-[#0a192f] to-[#112240]' : 'bg-gradient-to-br from-[#f0f0f0] to-[#ffffff]'}`}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
          <CircularProgress size={60} sx={{ color: theme === 'dark' ? '#00ffff' : '#007bff' }} />
        </Box>
      </div>
    );
  }

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
      
      <FormControl fullWidth>
        <InputLabel sx={{ color: theme === 'dark' ? '#a8b2d1' : '#666666' }}>Property Type</InputLabel>
        <Select
          value={formData.propertyType}
          label="Property Type"
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
            InputProps={{
              startAdornment: <Map sx={{ mr: 1, fontSize: 16 }} />
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
            label="Longitude"
            type="number"
            value={formData.location.coordinates.lng}
            onChange={(e) =>
              handleCoordinatesChange('lng', parseFloat(e.target.value))
            }
            required
            InputProps={{
              startAdornment: <Map sx={{ mr: 1, fontSize: 16 }} />
            }}
            inputProps={{
              step: 0.000001
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
          value.map((option, index) => (
            <Chip
              label={option}
              {...getTagProps({ index })}
              sx={{ backgroundColor: theme === 'dark' ? '#334155' : '#e5e7eb' }}
            />
          ))
        }
      />
    </Box>
  );

  const renderPricingMedia = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Typography variant="h6" sx={{ color: theme === 'dark' ? '#00ffff' : '#007bff', mb: 2 }}>
        Pricing & Availability
      </Typography>
      
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ flex: 1, minWidth: '200px' }}>
          <TextField
            fullWidth
            label="Price"
            type="number"
            value={formData.pricing.price}
            onChange={(e) => handleNestedChange('pricing', 'price', parseFloat(e.target.value))}
            required
            InputProps={{ startAdornment: <AttachMoney sx={{ mr: 1 }} /> }}
            sx={textFieldStyle}
          />
        </Box>
        <Box sx={{ flex: 1, minWidth: '200px' }}>
          <TextField
            fullWidth
            label="Quantity Available"
            type="number"
            value={formData.quantity}
            onChange={(e) => handleInputChange('quantity', Math.max(1, parseInt(e.target.value) || 1))}
            required
            InputProps={{ inputProps: { min: 1 } }}
            helperText="Number of units available"
            sx={textFieldStyle}
          />
        </Box>
      </Box>
      
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ flex: 1, minWidth: '200px' }}>
          <TextField
            fullWidth
            label="Maintenance Fee"
            type="number"
            value={formData.pricing.maintenanceFee}
            onChange={(e) => handleNestedChange('pricing', 'maintenanceFee', parseFloat(e.target.value))}
            InputProps={{ startAdornment: <AttachMoney sx={{ mr: 1 }} /> }}
            sx={textFieldStyle}
          />
        </Box>
        <Box sx={{ flex: 1, minWidth: '200px' }}>
          <TextField
            fullWidth
            label="Tax Amount"
            type="number"
            value={formData.pricing.taxAmount}
            onChange={(e) => handleNestedChange('pricing', 'taxAmount', parseFloat(e.target.value))}
            InputProps={{ startAdornment: <AttachMoney sx={{ mr: 1 }} /> }}
            sx={textFieldStyle}
          />
        </Box>
      </Box>
      
      <Divider sx={{ my: 2 }} />
      
      <Typography variant="h6" sx={{ color: theme === 'dark' ? '#00ffff' : '#007bff', mb: 2 }}>
        Property Images
      </Typography>
      
      {/* Existing Images - Like Approve Page */}
      {existingImageUrls.length > 0 && (
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1, color: theme === 'dark' ? '#a8b2d1' : '#666666' }}>
            Existing Images ({existingImageUrls.length})
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
                  sx={{ position: 'absolute', top: -8, right: -8, backgroundColor: '#ff0000', color: 'white', '&:hover': { backgroundColor: '#cc0000' } }}
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
          <Typography variant="subtitle2" sx={{ mb: 1, color: theme === 'dark' ? '#a8b2d1' : '#666666' }}>
            New Images ({newImagePreviews.length})
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            {newImagePreviews.map((preview, index) => (
              <Box key={`new-${index}`} sx={{ position: 'relative', width: 120, height: 120 }}>
                <img src={preview} alt={`New ${index}`} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }} />
                <IconButton
                  size="small"
                  onClick={() => handleDeleteNewImage(index)}
                  sx={{ position: 'absolute', top: -8, right: -8, backgroundColor: '#ff0000', color: 'white', '&:hover': { backgroundColor: '#cc0000' } }}
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
          border: `2px dashed ${theme === 'dark' ? '#334155' : '#e5e7eb'}`,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', '&:hover': { borderColor: theme === 'dark' ? '#00ffff' : '#007bff' }
        }}
      >
        <CloudUpload sx={{ fontSize: 32, color: theme === 'dark' ? '#a8b2d1' : '#666666' }} />
        <Typography variant="caption" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>Add Image</Typography>
      </Box>
      <input ref={imageInputRef} type="file" accept="image/*" multiple hidden onChange={handleImageUpload} />
      
      <Divider sx={{ my: 2 }} />
      
      <Typography variant="h6" sx={{ color: theme === 'dark' ? '#00ffff' : '#007bff', mb: 2 }}>
        3D Models (Optional)
      </Typography>
      
      {/* Existing 3D Models */}
      {existingModels.length > 0 && (
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1, color: theme === 'dark' ? '#a8b2d1' : '#666666' }}>
            Existing 3D Models ({existingModels.length})
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            {existingModels.map((model, index) => (
              <Box key={`existing-model-${index}`} sx={{ position: 'relative', width: 120, height: 120 }}>
                <Box sx={{ width: '100%', height: '100%', backgroundColor: theme === 'dark' ? '#334155' : '#e5e7eb', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ThreeDRotation sx={{ fontSize: 48, color: theme === 'dark' ? '#a8b2d1' : '#666666' }} />
                </Box>
                <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', mt: 0.5 }}>{model.fileName || '3D Model'}</Typography>
                <IconButton
                  size="small"
                  onClick={() => handleDeleteExistingModel(index)}
                  sx={{ position: 'absolute', top: -8, right: -8, backgroundColor: '#ff0000', color: 'white' }}
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
          <Typography variant="subtitle2" sx={{ mb: 1, color: theme === 'dark' ? '#a8b2d1' : '#666666' }}>
            New 3D Models ({modelPreviews.length})
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            {modelPreviews.map((preview, index) => (
              <Box key={`new-model-${index}`} sx={{ position: 'relative', width: 120, height: 120 }}>
                <Box sx={{ width: '100%', height: '100%', backgroundColor: theme === 'dark' ? '#334155' : '#e5e7eb', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ThreeDRotation sx={{ fontSize: 48, color: theme === 'dark' ? '#a8b2d1' : '#666666' }} />
                </Box>
                <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', mt: 0.5 }}>New Model</Typography>
                <IconButton
                  size="small"
                  onClick={() => handleDeleteNewModel(index)}
                  sx={{ position: 'absolute', top: -8, right: -8, backgroundColor: '#ff0000', color: 'white' }}
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
          border: `2px dashed ${theme === 'dark' ? '#334155' : '#e5e7eb'}`,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', '&:hover': { borderColor: theme === 'dark' ? '#00ffff' : '#007bff' }
        }}
      >
        <ThreeDRotation sx={{ fontSize: 32, color: theme === 'dark' ? '#a8b2d1' : '#666666' }} />
        <Typography variant="caption" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>Add 3D Model</Typography>
        <Typography variant="caption" color={theme === 'dark' ? '#94a3b8' : '#999999'} fontSize="10px">.glb, .gltf, .obj</Typography>
      </Box>
      <input ref={modelInputRef} type="file" accept=".glb,.gltf,.obj" multiple hidden onChange={handleModelUpload} />
      
      <Divider sx={{ my: 2 }} />
      
      <Typography variant="h6" sx={{ color: theme === 'dark' ? '#00ffff' : '#007bff', mb: 2 }}>
        Virtual Tour (Optional)
      </Typography>
      
      <FormControlLabel
        control={
          <Switch
            checked={formData.virtualTour.enabled}
            onChange={(e) => handleNestedChange('virtualTour', 'enabled', e.target.checked)}
          />
        }
        label="Enable Virtual Tour"
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
            label="Embed Code"
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
            Edit Property
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
                  disabled={saving || !formData.title || !formData.description || !formData.propertyType || formData.pricing.price <= 0}
                  startIcon={saving ? <CircularProgress size={20} /> : <Save />}
                  sx={{
                    background: theme === 'dark' ? 'linear-gradient(135deg, #00ffff, #00b3b3)' : 'linear-gradient(135deg, #007bff, #0056b3)',
                    '&:hover': { background: theme === 'dark' ? 'linear-gradient(135deg, #00b3b3, #008080)' : 'linear-gradient(135deg, #0056b3, #004080)' }
                  }}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
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

export default EditHousePage;