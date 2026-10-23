'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box, Typography, Card, CardContent, TextField, Button,
  FormControl, InputLabel, Select, MenuItem, Divider,
  Alert, Snackbar, CircularProgress, useMediaQuery,
  IconButton, Chip, Autocomplete
} from '@mui/material';
import { motion } from 'framer-motion';
import { useTheme } from '@/lib/theme-context';
import {
  ArrowBack, Save, AddPhotoAlternate, ThreeDRotation,
  Home, LocationOn, AttachMoney, Bed, Bathtub,
  SquareFoot, LocalParking, CheckCircle, Close,
  Business, Store, Warehouse, Apartment, Villa, Landscape
} from '@mui/icons-material';
import api from '@/app/utils/api';
import { PropertyType, TransactionType } from '@/types/houses';

// Pre-defined tag suggestions for autocomplete
const TAG_SUGGESTIONS = ['Bole', 'CMC', 'Summit', 'Furnished', 'FamilyHome', 'Commercial', 'OfficeSpace', 'Parking', 'Luxury', 'Affordable'];

const propertyTypeLabels: Record<PropertyType, string> = {
  [PropertyType.APARTMENT]: 'Apartment',
  [PropertyType.VILLA]: 'Villa',
  [PropertyType.CONDO]: 'Condo',
  [PropertyType.HOUSE]: 'House',
  [PropertyType.LAND]: 'Land',
  [PropertyType.OFFICE]: 'Office',
  [PropertyType.SHOP]: 'Shop',
  [PropertyType.WAREHOUSE]: 'Warehouse'
};

export default function CreateHousePage() {
  const { theme } = useTheme();
  const router = useRouter();
  const isMobile = useMediaQuery('(max-width: 768px)');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form States
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    propertyType: PropertyType.APARTMENT,
    transactionType: TransactionType.SALE,
    tags: [] as string[],
    location: {
      address: '',
      city: 'Addis Ababa',
      state: 'Addis Ababa',
      country: 'Ethiopia',
      zipCode: '1000',
      coordinates: { lat: 9.03, lng: 38.74 }
    },
    details: {
      bedrooms: 1,
      bathrooms: 1,
      area: 100,
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
      pricePerSqft: 0,
      maintenanceFee: 0,
      taxAmount: 0,
      securityDeposit: 0,
      quantity: 1
    }
  });

  // File States
  const [images, setImages] = useState<File[]>([]);
  const [threeDModel, setThreeDModel] = useState<File | null>(null);

  // Helper for text fields
  const handleChange = (section: string | null, field: string, value: any) => {
    if (section) {
      setFormData(prev => ({
        ...prev,
        [section]: {
          ...(prev as any)[section],
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setImages(prev => [...prev, ...newFiles]);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const data = new FormData();
      
      // Append simple fields
      data.append('title', formData.title);
      data.append('description', formData.description);
      data.append('propertyType', formData.propertyType);
      data.append('transactionType', formData.transactionType);
      data.append('tags', JSON.stringify(formData.tags));

      // Append nested JSON objects (stringified, just like your backend expects)
      data.append('location', JSON.stringify(formData.location));
      data.append('details', JSON.stringify(formData.details));
      data.append('pricing', JSON.stringify(formData.pricing));

      // Append Images
      images.forEach((file) => {
        data.append('images', file);
      });

      // Append 3D Model (if any)
      if (threeDModel) {
        data.append('threeDModels', threeDModel);
      }

      // API Call
      await api.post('/houses', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setSuccess('Property created successfully!');
      setTimeout(() => {
        router.push('/admin/houses');
      }, 1500);

    } catch (err: any) {
      console.error('Error creating house:', err);
      setError(err.response?.data?.message || 'Failed to create property. Please check all fields.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen pb-10 transition-colors duration-300 ${
      theme === 'dark' ? 'bg-gradient-to-br from-[#0a192f] to-[#112240]' : 'bg-gradient-to-br from-[#f0f0f0] to-[#ffffff]'
    }`}>
      <Box sx={{ py: 3, px: { xs: 2, md: 4 }, maxWidth: 1200, mx: 'auto' }}>
        
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, gap: 2 }}>
            <IconButton onClick={() => router.back()} sx={{ color: theme === 'dark' ? '#00ffff' : '#007bff' }}>
              <ArrowBack />
            </IconButton>
            <Box>
              <Typography variant={isMobile ? "h5" : "h4"} sx={{ fontWeight: 'bold', color: theme === 'dark' ? '#ccd6f6' : '#333333' }}>
                Create New Property
              </Typography>
              <Typography variant="body2" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                Fill in the details below to list a new property.
              </Typography>
            </Box>
          </Box>
        </motion.div>

        <form onSubmit={handleSubmit}>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 4 }}>
            
            {/* Left Column: Main Details */}
            <Box sx={{ flex: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
              
              {/* Basic Info Card */}
              <Card sx={{ borderRadius: 3, backgroundColor: theme === 'dark' ? '#0f172a80' : 'white' }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold', color: theme === 'dark' ? '#00ffff' : '#007bff', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Home /> Basic Information
                  </Typography>
                  
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <TextField
                      fullWidth label="Property Title" required
                      value={formData.title} onChange={(e) => handleChange(null, 'title', e.target.value)}
                      placeholder="e.g. Luxury 3 Bedroom Apartment in Bole"
                    />
                    <TextField
                      fullWidth label="Description" required multiline rows={4}
                      value={formData.description} onChange={(e) => handleChange(null, 'description', e.target.value)}
                      placeholder="Describe the property, its features, and surroundings..."
                    />
                    
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 3 }}>
                      <FormControl fullWidth required>
                        <InputLabel>Property Category</InputLabel>
                        <Select value={formData.propertyType} label="Property Category" onChange={(e) => handleChange(null, 'propertyType', e.target.value)}>
                          {Object.entries(propertyTypeLabels).map(([value, label]) => (
                            <MenuItem key={value} value={value}>{label}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      
                      <FormControl fullWidth required>
                        <InputLabel>Transaction Type</InputLabel>
                        <Select value={formData.transactionType} label="Transaction Type" onChange={(e) => handleChange(null, 'transactionType', e.target.value)}>
                          <MenuItem value={TransactionType.SALE}>For Sale</MenuItem>
                          <MenuItem value={TransactionType.RENT}>For Rent</MenuItem>
                          <MenuItem value={TransactionType.SHORT_STAY}>Short Stay</MenuItem>
                        </Select>
                      </FormControl>
                    </Box>

                    {/* Tags Input */}
                    <Autocomplete
                      multiple
                      freeSolo
                      options={TAG_SUGGESTIONS}
                      value={formData.tags}
                      onChange={(_, newValue) => handleChange(null, 'tags', newValue)}
                      renderTags={(value, getTagProps) =>
                        value.map((option, index) => (
                          <Chip variant="outlined" label={`#${option}`} {...getTagProps({ index })} key={option} />
                        ))
                      }
                      renderInput={(params) => (
                        <TextField {...params} label="Tags (Press Enter to add)" placeholder="e.g. Bole, Furnished, Luxury" />
                      )}
                    />
                  </Box>
                </CardContent>
              </Card>

              {/* Location Card */}
              <Card sx={{ borderRadius: 3, backgroundColor: theme === 'dark' ? '#0f172a80' : 'white' }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold', color: theme === 'dark' ? '#00ffff' : '#007bff', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LocationOn /> Location Details
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <TextField fullWidth label="Street Address" required value={formData.location.address} onChange={(e) => handleChange('location', 'address', e.target.value)} />
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 3 }}>
                      <TextField fullWidth label="City" required value={formData.location.city} onChange={(e) => handleChange('location', 'city', e.target.value)} />
                      <TextField fullWidth label="State/Region" required value={formData.location.state} onChange={(e) => handleChange('location', 'state', e.target.value)} />
                      <TextField fullWidth label="Zip/Postal Code" value={formData.location.zipCode} onChange={(e) => handleChange('location', 'zipCode', e.target.value)} />
                    </Box>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 3 }}>
                      <TextField fullWidth label="Latitude" type="number" required value={formData.location.coordinates.lat} onChange={(e) => handleChange('location', 'coordinates', { ...formData.location.coordinates, lat: parseFloat(e.target.value) })} />
                      <TextField fullWidth label="Longitude" type="number" required value={formData.location.coordinates.lng} onChange={(e) => handleChange('location', 'coordinates', { ...formData.location.coordinates, lng: parseFloat(e.target.value) })} />
                    </Box>
                  </Box>
                </CardContent>
              </Card>

              {/* Details Card */}
              <Card sx={{ borderRadius: 3, backgroundColor: theme === 'dark' ? '#0f172a80' : 'white' }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold', color: theme === 'dark' ? '#00ffff' : '#007bff', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SquareFoot /> Property Details
                  </Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: '1fr 1fr 1fr' }, gap: 3 }}>
                    <TextField fullWidth label="Bedrooms" type="number" required value={formData.details.bedrooms} onChange={(e) => handleChange('details', 'bedrooms', parseInt(e.target.value) || 0)} InputProps={{ startAdornment: <Bed sx={{ mr: 1, color: 'text.secondary' }} /> }} />
                    <TextField fullWidth label="Bathrooms" type="number" required value={formData.details.bathrooms} onChange={(e) => handleChange('details', 'bathrooms', parseInt(e.target.value) || 0)} InputProps={{ startAdornment: <Bathtub sx={{ mr: 1, color: 'text.secondary' }} /> }} />
                    <TextField fullWidth label="Area (sqft)" type="number" required value={formData.details.area} onChange={(e) => handleChange('details', 'area', parseInt(e.target.value) || 0)} InputProps={{ startAdornment: <SquareFoot sx={{ mr: 1, color: 'text.secondary' }} /> }} />
                    <TextField fullWidth label="Parking Spaces" type="number" value={formData.details.parkingSpaces} onChange={(e) => handleChange('details', 'parkingSpaces', parseInt(e.target.value) || 0)} InputProps={{ startAdornment: <LocalParking sx={{ mr: 1, color: 'text.secondary' }} /> }} />
                    <TextField fullWidth label="Floors" type="number" value={formData.details.floors} onChange={(e) => handleChange('details', 'floors', parseInt(e.target.value) || 1)} />
                    <TextField fullWidth label="Year Built" type="number" value={formData.details.yearBuilt} onChange={(e) => handleChange('details', 'yearBuilt', parseInt(e.target.value) || 0)} />
                  </Box>
                </CardContent>
              </Card>
            </Box>

            {/* Right Column: Pricing, Media & Submit */}
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
              
              {/* Pricing Card */}
              <Card sx={{ borderRadius: 3, backgroundColor: theme === 'dark' ? '#0f172a80' : 'white' }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold', color: theme === 'dark' ? '#00ffff' : '#007bff', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AttachMoney /> Pricing
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <TextField fullWidth label="Price (ETB)" type="number" required value={formData.pricing.price} onChange={(e) => handleChange('pricing', 'price', parseFloat(e.target.value) || 0)} />
                    <TextField fullWidth label="Security Deposit" type="number" value={formData.pricing.securityDeposit} onChange={(e) => handleChange('pricing', 'securityDeposit', parseFloat(e.target.value) || 0)} />
                    <TextField fullWidth label="Maintenance Fee (Monthly)" type="number" value={formData.pricing.maintenanceFee} onChange={(e) => handleChange('pricing', 'maintenanceFee', parseFloat(e.target.value) || 0)} />
                  </Box>
                </CardContent>
              </Card>

              {/* Media Card */}
              <Card sx={{ borderRadius: 3, backgroundColor: theme === 'dark' ? '#0f172a80' : 'white' }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold', color: theme === 'dark' ? '#00ffff' : '#007bff', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AddPhotoAlternate /> Media Uploads
                  </Typography>
                  
                  {/* Images Upload */}
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>Images (JPG, PNG)</Typography>
                  <Button variant="outlined" component="label" fullWidth startIcon={<AddPhotoAlternate />} sx={{ mb: 2 }}>
                    Select Images
                    <input type="file" hidden multiple accept="image/*" onChange={handleImageUpload} />
                  </Button>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
                    {images.map((file, index) => (
                      <Chip key={index} label={file.name} onDelete={() => removeImage(index)} color="primary" variant="outlined" />
                    ))}
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  {/* 3D Model Upload */}
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>3D Model (GLB, GLTF)</Typography>
                  <Button variant="outlined" component="label" fullWidth startIcon={<ThreeDRotation />}>
                    Select 3D File
                    <input type="file" hidden accept=".glb,.gltf" onChange={(e) => setThreeDModel(e.target.files ? e.target.files[0] : null)} />
                  </Button>
                  {threeDModel && (
                    <Chip label={threeDModel.name} onDelete={() => setThreeDModel(null)} color="secondary" variant="outlined" sx={{ mt: 2 }} />
                  )}
                </CardContent>
              </Card>

              {/* Submit Card */}
              <Card sx={{ borderRadius: 3, backgroundColor: theme === 'dark' ? '#0f172a80' : 'white' }}>
                <CardContent sx={{ p: 3 }}>
                  <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Save />}
                    sx={{
                      py: 1.5,
                      background: theme === 'dark' ? 'linear-gradient(135deg, #00ff00, #00b300)' : 'linear-gradient(135deg, #28a745, #218838)',
                      fontWeight: 'bold',
                      fontSize: '1.1rem'
                    }}
                  >
                    {loading ? 'Creating Property...' : 'Publish Property'}
                  </Button>
                </CardContent>
              </Card>

            </Box>
          </Box>
        </form>
      </Box>

      {/* Notifications */}
      <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError('')} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity="error" onClose={() => setError('')} sx={{ borderRadius: 2 }}>{error}</Alert>
      </Snackbar>
      <Snackbar open={!!success} autoHideDuration={4000} onClose={() => setSuccess('')} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity="success" onClose={() => setSuccess('')} sx={{ borderRadius: 2 }}>{success}</Alert>
      </Snackbar>
    </div>
  );
}