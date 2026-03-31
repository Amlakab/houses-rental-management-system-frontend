'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Box, Typography, Card, CardContent, Chip,
  IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, Button, Divider, TextField,
  Select, MenuItem, FormControl, InputLabel,
  Slider, Snackbar, Alert, Tooltip, CircularProgress,
  Tabs, Tab, Avatar, Badge, LinearProgress,
  Paper, Rating, useMediaQuery
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/lib/theme-context';
import Navbar from '@/components/ui/Navbar';
import {
  Home, LocationOn, AttachMoney, Bed, Bathtub, SquareFoot,
  Search, Close, Visibility, CalendarToday, CheckCircle,
  Cancel, Pending, Phone, Email, Person, Message,
  Send, ZoomIn, ZoomOut, ViewInAr, ThreeDRotation,
  Image as ImageIcon, NavigateNext, NavigateBefore,
  Map, Room, AccessTime, LocalShipping, Description,
  CloudUpload
} from '@mui/icons-material';
import api from '@/app/utils/api';
import { format } from 'date-fns';

// Types
interface HouseImage {
  data: any;
  contentType: string;
  fileName: string;
  isPrimary?: boolean;
}

interface House3DModel {
  data: any;
  contentType: string;
  fileName: string;
  format: string;
}

interface House {
  _id: string;
  title: string;
  description: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  price: number;
  securityDeposit: number;
  bedrooms: number;
  bathrooms: number;
  area: number;
  type: string;
  furnishingStatus: string;
  amenities: string[];
  images: HouseImage[];
  threeDModels: House3DModel[];
  availableFrom: string;
  availableUntil?: string;
  view: number;
  isAvailable: boolean;
  status: 'AVAILABLE' | 'RENTED' | 'MAINTENANCE';
  created_at: string;
  updated_at: string;
  latitude?: number;
  longitude?: number;
}

interface ApplicationFormData {
  fullName: string;
  email: string;
  phone: string;
  occupation: string;
  monthlyIncome: number;
  numberOfOccupants: number;
  preferredMoveInDate: string;
  message: string;
  documents: File[];
}

interface MessageFormData {
  name: string;
  email: string;
  phone: string;
  message: string;
}

interface FilterOptions {
  types: string[];
  furnishingStatuses: string[];
  cities: string[];
  bedrooms: number[];
}

const houseTypes = [
  { value: 'APARTMENT', label: 'Apartment' },
  { value: 'VILLA', label: 'Villa' },
  { value: 'CONDO', label: 'Condo' },
  { value: 'STUDIO', label: 'Studio' },
  { value: 'HOUSE', label: 'House' },
  { value: 'TOWNHOUSE', label: 'Townhouse' }
];

const furnishingOptions = [
  { value: 'FURNISHED', label: 'Furnished' },
  { value: 'SEMI_FURNISHED', label: 'Semi-Furnished' },
  { value: 'UNFURNISHED', label: 'Unfurnished' }
];

const PublicHousePage = () => {
  const { theme } = useTheme();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const isTablet = useMediaQuery('(max-width: 1024px)');
  
  const [houses, setHouses] = useState<House[]>([]);
  const [allHouses, setAllHouses] = useState<House[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalHouses: 0,
    hasNext: false,
    hasPrev: false
  });
  
  const [filters, setFilters] = useState({
    search: '',
    type: '',
    city: '',
    furnishingStatus: '',
    bedrooms: '',
    minPrice: 0,
    maxPrice: 10000,
    sortBy: 'created_at',
    sortOrder: 'desc',
    page: 1,
    limit: 12
  });
  
  const [selectedHouse, setSelectedHouse] = useState<House | null>(null);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [openApplyDialog, setOpenApplyDialog] = useState(false);
  const [openMessageDialog, setOpenMessageDialog] = useState(false);
  const [viewTab, setViewTab] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    types: [],
    furnishingStatuses: [],
    cities: [],
    bedrooms: []
  });
  
  const [applicationForm, setApplicationForm] = useState<ApplicationFormData>({
    fullName: '',
    email: '',
    phone: '',
    occupation: '',
    monthlyIncome: 0,
    numberOfOccupants: 1,
    preferredMoveInDate: '',
    message: '',
    documents: []
  });
  
  const [messageForm, setMessageForm] = useState<MessageFormData>({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  
  const [showMap, setShowMap] = useState(false);
  const [mapCenter, setMapCenter] = useState({ lat: 9.03, lng: 38.74 });
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Get Image URL
  const getImageUrl = (house: House, index: number = 0): string | null => {
    try {
      if (house.images && house.images[index] && house.images[index].data) {
        const image = house.images[index];
        let base64String: string;
        
        if (typeof image.data === 'string') {
          base64String = image.data;
        } else if (image.data.$binary && image.data.$binary.base64) {
          base64String = image.data.$binary.base64;
        } else if (image.data.data && Array.isArray(image.data.data)) {
          if (typeof Buffer !== 'undefined') {
            base64String = Buffer.from(image.data.data).toString('base64');
          } else {
            const bytes = new Uint8Array(image.data.data);
            let binary = '';
            bytes.forEach((byte) => binary += String.fromCharCode(byte));
            base64String = btoa(binary);
          }
        } else {
          return null;
        }
        
        const cleanBase64 = base64String.replace(/\s/g, '');
        const contentType = image.contentType || 'image/jpeg';
        return `data:${contentType};base64,${cleanBase64}`;
      }
      return null;
    } catch (error) {
      console.error('Error getting image URL:', error);
      return null;
    }
  };

  // Get Placeholder Image
  const getPlaceholderImage = (width: number = 400, height: number = 300) => {
    const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="${theme === 'dark' ? '#334155' : '#e5e7eb'}"/>
      <text x="50%" y="50%" text-anchor="middle" dy=".3em" font-family="Arial" font-size="20" 
            fill="${theme === 'dark' ? '#a8b2d1' : '#666666'}">No Image</text>
    </svg>`;
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  };

  // Fetch available houses
  const fetchAvailableHouses = async (forList: boolean = false) => {
    try {
      if (!forList) setLoading(true);
      const params = new URLSearchParams();
      
      if (forList) {
        params.append('limit', '100');
        params.append('page', '1');
      } else {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== '' && value !== null && value !== undefined && value !== 0) {
            params.append(key, value.toString());
          }
        });
      }

      const response = await api.get(`/houses/public/available?${params}`);
      
      if (forList) {
        setAllHouses(response.data.data.houses || []);
      } else {
        setHouses(response.data.data.houses || []);
        setPagination(response.data.data.pagination || {
          currentPage: 1,
          totalPages: 1,
          totalHouses: 0,
          hasNext: false,
          hasPrev: false
        });
      }
      setError('');
    } catch (error: any) {
      console.error('Error fetching houses:', error);
      setError(error.response?.data?.message || 'Failed to fetch houses');
    } finally {
      if (!forList) setLoading(false);
    }
  };

  // Fetch filter options
  const fetchFilterOptions = async () => {
    try {
      const response = await api.get('/houses/public/filter-options');
      setFilterOptions(response.data.data);
    } catch (error: any) {
      console.error('Failed to fetch filter options:', error);
    }
  };

  useEffect(() => {
    fetchAvailableHouses();
    fetchAvailableHouses(true);
    fetchFilterOptions();
  }, []);

  useEffect(() => {
    fetchAvailableHouses();
  }, [filters.page, filters.type, filters.city, filters.search, filters.bedrooms, filters.furnishingStatus, filters.minPrice, filters.maxPrice]);

  // Handle view house
  const handleViewHouse = async (house: House) => {
    try {
      await api.get(`/houses/${house._id}/view`);
      setSelectedHouse(house);
      setViewTab(0);
      setCurrentImageIndex(0);
      setOpenViewDialog(true);
      fetchAvailableHouses();
      fetchAvailableHouses(true);
    } catch (error: any) {
      console.error('Failed to increment view count:', error);
    }
  };

  // Handle apply
  const handleApply = async (house: House) => {
    setSelectedHouse(house);
    setOpenApplyDialog(true);
  };

  // Handle message
  const handleMessage = (house: House) => {
    setSelectedHouse(house);
    setOpenMessageDialog(true);
  };

  // Submit application
  const handleSubmitApplication = async () => {
    if (!selectedHouse) return;

    try {
      const formData = new FormData();
      formData.append('fullName', applicationForm.fullName);
      formData.append('email', applicationForm.email);
      formData.append('phone', applicationForm.phone);
      formData.append('occupation', applicationForm.occupation);
      formData.append('monthlyIncome', applicationForm.monthlyIncome.toString());
      formData.append('numberOfOccupants', applicationForm.numberOfOccupants.toString());
      formData.append('preferredMoveInDate', applicationForm.preferredMoveInDate);
      formData.append('message', applicationForm.message);
      
      applicationForm.documents.forEach(doc => {
        formData.append('documents', doc);
      });

      await api.post(`/houses/${selectedHouse._id}/apply`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setSuccess(`Application submitted for ${selectedHouse.title}! We'll contact you soon.`);
      setOpenApplyDialog(false);
      resetApplicationForm();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to submit application');
    }
  };

  // Submit message
  const handleSubmitMessage = async () => {
    if (!selectedHouse) return;

    try {
      // Here you would send the message to your backend
      console.log('Message sent:', { houseId: selectedHouse._id, ...messageForm });
      setSuccess(`Message sent to property owner! They'll get back to you soon.`);
      setOpenMessageDialog(false);
      resetMessageForm();
    } catch (error: any) {
      setError('Failed to send message');
    }
  };

  // Reset forms
  const resetApplicationForm = () => {
    setApplicationForm({
      fullName: '',
      email: '',
      phone: '',
      occupation: '',
      monthlyIncome: 0,
      numberOfOccupants: 1,
      preferredMoveInDate: '',
      message: '',
      documents: []
    });
  };

  const resetMessageForm = () => {
    setMessageForm({
      name: '',
      email: '',
      phone: '',
      message: ''
    });
  };

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setApplicationForm(prev => ({
      ...prev,
      documents: [...prev.documents, ...files]
    }));
  };

  const removeDocument = (index: number) => {
    setApplicationForm(prev => ({
      ...prev,
      documents: prev.documents.filter((_, i) => i !== index)
    }));
  };

  // Handle filter change
  const handleFilterChange = (field: string, value: string | number) => {
    setFilters(prev => ({
      ...prev,
      [field]: value,
      page: 1
    }));
  };

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({
      ...prev,
      page: newPage
    }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Format helpers
  const formatPrice = (price: number): string => {
    return `ETB ${price.toLocaleString('am-ET')}`;
  };

  const getStatusColor = (status: string): 'success' | 'warning' | 'error' | 'info' => {
    switch (status) {
      case 'AVAILABLE': return 'success';
      case 'RENTED': return 'warning';
      case 'MAINTENANCE': return 'error';
      default: return 'info';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return 'Available';
      case 'RENTED': return 'Rented';
      case 'MAINTENANCE': return 'Maintenance';
      default: return status;
    }
  };

  const getHouseTypeLabel = (type: string) => {
    const found = houseTypes.find(t => t.value === type);
    return found ? found.label : type;
  };

  const getFurnishingLabel = (status: string) => {
    const found = furnishingOptions.find(f => f.value === status);
    return found ? found.label : status;
  };

  // Scroll horizontal list
  const scrollHorizontalList = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 300;
      if (direction === 'left') {
        scrollContainerRef.current.scrollLeft -= scrollAmount;
      } else {
        scrollContainerRef.current.scrollLeft += scrollAmount;
      }
    }
  };

  // Handle house name click
  const handleHouseNameClick = (house: House) => {
    const element = document.getElementById(`house-${house._id}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.classList.add('highlight-pulse');
      setTimeout(() => {
        element.classList.remove('highlight-pulse');
      }, 2000);
    }
  };

  // Google Maps integration (simplified - you'll need to add actual map library)
  const renderMap = () => {
    if (!showMap) return null;
    
    return (
      <Box sx={{ 
        height: 400, 
        width: '100%',
        borderRadius: 2,
        overflow: 'hidden',
        position: 'relative',
        backgroundColor: theme === 'dark' ? '#1e293b' : '#f5f5f5',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Box sx={{ textAlign: 'center' }}>
          <Map sx={{ fontSize: 64, color: theme === 'dark' ? '#a8b2d1' : '#94a3b8', mb: 2 }} />
          <Typography variant="body2" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
            Map integration would go here
          </Typography>
          <Typography variant="caption" color={theme === 'dark' ? '#94a3b8' : '#999999'}>
            Showing properties in {filters.city || 'selected area'}
          </Typography>
        </Box>
      </Box>
    );
  };

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: theme === 'dark' 
        ? 'linear-gradient(135deg, #0a192f, #112240)' 
        : 'linear-gradient(135deg, #f0f0f0, #ffffff)'
    }}>
      <Navbar />
      
      <Box sx={{ pt: 8 }}>
        {/* Hero Section */}
        <Box sx={{ py: 6, px: { xs: 2, md: 4 } }}>
          <Box sx={{ maxWidth: '1200px', mx: 'auto' }}>
            <Box sx={{ 
              display: 'flex',
              flexDirection: { xs: 'column', lg: 'row' },
              gap: 6,
              alignItems: 'center'
            }}>
              <Box sx={{ flex: 1 }}>
                <motion.div
                  initial={{ x: -50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.8 }}
                >
                  <Typography variant="h2" sx={{ 
                    fontSize: { xs: '2rem', md: '2.5rem', lg: '3rem' },
                    fontWeight: 'bold',
                    mb: 2,
                    color: theme === 'dark' ? '#00ffff' : '#007bff'
                  }}>
                    Find Your Dream Home
                  </Typography>
                  <Typography variant="body1" sx={{ 
                    color: theme === 'dark' ? '#a8b2d1' : '#666666',
                    mb: 4,
                    fontSize: '1.1rem',
                    lineHeight: 1.6
                  }}>
                    Discover the perfect rental property that suits your lifestyle and budget. 
                    Browse through our curated collection of houses, apartments, and villas in prime locations.
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <Chip icon={<LocationOn />} label="Prime Locations" />
                    <Chip icon={<AttachMoney />} label="Best Prices" />
                    <Chip icon={<Home />} label="Verified Properties" />
                  </Box>
                </motion.div>
              </Box>
              
              <Box sx={{ flex: 1 }}>
                <motion.div
                  initial={{ x: 50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.8 }}
                >
                  <Card sx={{ 
                    p: 3,
                    borderRadius: 2,
                    backgroundColor: theme === 'dark' ? '#1e293b' : 'white',
                    boxShadow: theme === 'dark' 
                      ? '0 4px 12px rgba(0,0,0,0.3)' 
                      : '0 4px 12px rgba(0,0,0,0.08)'
                  }}>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                      Why Choose Us?
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <CheckCircle sx={{ color: theme === 'dark' ? '#00ff00' : '#28a745' }} />
                        <Typography variant="body2">100% Verified Properties</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <CheckCircle sx={{ color: theme === 'dark' ? '#00ff00' : '#28a745' }} />
                        <Typography variant="body2">No Hidden Fees</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <CheckCircle sx={{ color: theme === 'dark' ? '#00ff00' : '#28a745' }} />
                        <Typography variant="body2">24/7 Customer Support</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <CheckCircle sx={{ color: theme === 'dark' ? '#00ff00' : '#28a745' }} />
                        <Typography variant="body2">Easy Application Process</Typography>
                      </Box>
                    </Box>
                  </Card>
                </motion.div>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Search and Filter Section */}
        <Box sx={{ py: 4, px: { xs: 2, md: 4 }, borderTop: 1, borderBottom: 1, borderColor: theme === 'dark' ? '#334155' : '#e5e7eb' }}>
          <Box sx={{ maxWidth: '1200px', mx: 'auto' }}>
            <Box sx={{ 
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              gap: 3,
              mb: 3
            }}>
              {/* Search Input */}
              <Box sx={{ flex: 2 }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Search by title, address, or city..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  InputProps={{
                    startAdornment: <Search sx={{ mr: 1, color: theme === 'dark' ? '#a8b2d1' : '#666666' }} />,
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: theme === 'dark' ? '#1e293b' : 'white',
                      '& fieldset': {
                        borderColor: theme === 'dark' ? '#334155' : '#e5e7eb',
                      },
                      '&:hover fieldset': {
                        borderColor: theme === 'dark' ? '#00ffff' : '#007bff',
                      },
                    }
                  }}
                />
              </Box>
              
              {/* Filter Row */}
              <Box sx={{ 
                display: 'flex',
                flexWrap: 'wrap',
                gap: 2,
                flex: 3
              }}>
                <FormControl size="small" sx={{ flex: 1, minWidth: '120px' }}>
                  <InputLabel>Type</InputLabel>
                  <Select
                    value={filters.type}
                    label="Type"
                    onChange={(e) => handleFilterChange('type', e.target.value)}
                    sx={{
                      backgroundColor: theme === 'dark' ? '#1e293b' : 'white',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: theme === 'dark' ? '#334155' : '#e5e7eb',
                      }
                    }}
                  >
                    <MenuItem value="">All Types</MenuItem>
                    {filterOptions.types.map(type => (
                      <MenuItem key={type} value={type}>{getHouseTypeLabel(type)}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                <FormControl size="small" sx={{ flex: 1, minWidth: '120px' }}>
                  <InputLabel>City</InputLabel>
                  <Select
                    value={filters.city}
                    label="City"
                    onChange={(e) => handleFilterChange('city', e.target.value)}
                    sx={{
                      backgroundColor: theme === 'dark' ? '#1e293b' : 'white',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: theme === 'dark' ? '#334155' : '#e5e7eb',
                      }
                    }}
                  >
                    <MenuItem value="">All Cities</MenuItem>
                    {filterOptions.cities.map(city => (
                      <MenuItem key={city} value={city}>{city}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                <FormControl size="small" sx={{ flex: 1, minWidth: '120px' }}>
                  <InputLabel>Bedrooms</InputLabel>
                  <Select
                    value={filters.bedrooms}
                    label="Bedrooms"
                    onChange={(e) => handleFilterChange('bedrooms', e.target.value)}
                    sx={{
                      backgroundColor: theme === 'dark' ? '#1e293b' : 'white',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: theme === 'dark' ? '#334155' : '#e5e7eb',
                      }
                    }}
                  >
                    <MenuItem value="">Any</MenuItem>
                    {filterOptions.bedrooms.map(bed => (
                      <MenuItem key={bed} value={bed}>{bed}+ Bedroom{bed !== 1 ? 's' : ''}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                <Button
                  variant="outlined"
                  startIcon={<Map />}
                  onClick={() => setShowMap(!showMap)}
                  sx={{
                    borderColor: theme === 'dark' ? '#00ffff' : '#007bff',
                    color: theme === 'dark' ? '#00ffff' : '#007bff',
                    '&:hover': {
                      backgroundColor: theme === 'dark' ? '#00ffff20' : '#007bff10'
                    }
                  }}
                >
                  {showMap ? 'Hide Map' : 'Show Map'}
                </Button>
              </Box>
            </Box>
            
            {/* Price Range Slider */}
            <Box sx={{ mt: 3 }}>
              <Typography variant="body2" sx={{ mb: 1, color: theme === 'dark' ? '#a8b2d1' : '#666666' }}>
                Price Range: {formatPrice(filters.minPrice)} - {formatPrice(filters.maxPrice)}
              </Typography>
              <Slider
                value={[filters.minPrice, filters.maxPrice]}
                onChange={(_, newValue) => {
                  if (Array.isArray(newValue)) {
                    handleFilterChange('minPrice', newValue[0]);
                    handleFilterChange('maxPrice', newValue[1]);
                  }
                }}
                min={0}
                max={10000}
                step={100}
                valueLabelDisplay="auto"
                valueLabelFormat={(value) => formatPrice(value)}
                sx={{
                  color: theme === 'dark' ? '#00ffff' : '#007bff',
                  '& .MuiSlider-thumb': {
                    backgroundColor: theme === 'dark' ? '#00ffff' : '#007bff',
                  }
                }}
              />
            </Box>
          </Box>
        </Box>

        {/* Map Section */}
        {showMap && renderMap()}

        {/* Horizontal House Name List */}
        {allHouses.length > 0 && (
          <Box sx={{ py: 4, px: { xs: 2, md: 4 }, backgroundColor: theme === 'dark' ? '#0f172a80' : '#f8f9fa' }}>
            <Box sx={{ maxWidth: '1200px', mx: 'auto' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 'bold', color: theme === 'dark' ? '#00ffff' : '#007bff' }}>
                  All Properties
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <IconButton onClick={() => scrollHorizontalList('left')} size="small">
                    <NavigateBefore />
                  </IconButton>
                  <IconButton onClick={() => scrollHorizontalList('right')} size="small">
                    <NavigateNext />
                  </IconButton>
                </Box>
              </Box>
              
              <Box sx={{ position: 'relative' }}>
                <Box
                  ref={scrollContainerRef}
                  sx={{
                    display: 'flex',
                    overflowX: 'auto',
                    gap: 2,
                    pb: 2,
                    scrollBehavior: 'smooth',
                    '&::-webkit-scrollbar': { display: 'none' },
                    scrollbarWidth: 'none'
                  }}
                >
                  {allHouses.map((house) => (
                    <motion.div
                      key={house._id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button
                        onClick={() => handleHouseNameClick(house)}
                        sx={{
                          flexShrink: 0,
                          px: 3,
                          py: 2,
                          borderRadius: 2,
                          backgroundColor: theme === 'dark' ? '#1e293b' : 'white',
                          border: 1,
                          borderColor: theme === 'dark' ? '#334155' : '#e5e7eb',
                          whiteSpace: 'nowrap',
                          '&:hover': {
                            borderColor: theme === 'dark' ? '#00ffff' : '#007bff',
                            backgroundColor: theme === 'dark' ? '#334155' : '#f8f9fa'
                          }
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Home sx={{ color: theme === 'dark' ? '#00ffff' : '#007bff' }} />
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>
                            {house.title}
                          </Typography>
                          <Chip
                            label={formatPrice(house.price)}
                            size="small"
                            sx={{ 
                              height: 24,
                              backgroundColor: theme === 'dark' ? '#334155' : '#e5e7eb'
                            }}
                          />
                        </Box>
                      </Button>
                    </motion.div>
                  ))}
                </Box>
                
                {/* Gradient fades */}
                <Box sx={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: 40,
                  background: `linear-gradient(to right, ${theme === 'dark' ? '#0f172a80' : '#f8f9fa'}, transparent)`,
                  pointerEvents: 'none'
                }} />
                <Box sx={{
                  position: 'absolute',
                  right: 0,
                  top: 0,
                  bottom: 0,
                  width: 40,
                  background: `linear-gradient(to left, ${theme === 'dark' ? '#0f172a80' : '#f8f9fa'}, transparent)`,
                  pointerEvents: 'none'
                }} />
              </Box>
            </Box>
          </Box>
        )}

        {/* Houses Grid */}
        <Box sx={{ py: 6, px: { xs: 2, md: 4 } }}>
          <Box sx={{ maxWidth: '1200px', mx: 'auto' }}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
                <CircularProgress sx={{ color: theme === 'dark' ? '#00ffff' : '#007bff' }} />
              </Box>
            ) : houses.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Home sx={{ fontSize: 64, color: theme === 'dark' ? '#334155' : '#cbd5e1', mb: 2 }} />
                <Typography variant="h6">No properties found</Typography>
                <Typography variant="body2">Try adjusting your filters</Typography>
              </Box>
            ) : (
              <>
                <Box sx={{ 
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 3
                }}>
                  {houses.map((house, index) => {
                    const primaryImage = getImageUrl(house, 0);
                    
                    return (
                      <Box
                        key={house._id}
                        id={`house-${house._id}`}
                        sx={{ 
                          flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 24px)', md: '1 1 calc(33.33% - 24px)' },
                          minWidth: { xs: '100%', sm: '280px' }
                        }}
                      >
                        <motion.div
                          initial={{ y: 50, opacity: 0 }}
                          whileInView={{ y: 0, opacity: 1 }}
                          transition={{ duration: 0.5, delay: index * 0.1 }}
                          viewport={{ once: true }}
                          whileHover={{ y: -5 }}
                        >
                          <Card sx={{ 
                            height: '100%',
                            borderRadius: 2,
                            boxShadow: theme === 'dark' ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.1)',
                            border: 1,
                            borderColor: theme === 'dark' ? '#334155' : '#e5e7eb',
                            backgroundColor: theme === 'dark' ? '#0f172a80' : 'white',
                            backdropFilter: theme === 'dark' ? 'blur(10px)' : 'none',
                            overflow: 'hidden',
                            transition: 'transform 0.2s, box-shadow 0.2s',
                            '&:hover': {
                              transform: 'translateY(-4px)',
                              boxShadow: theme === 'dark' 
                                ? '0 8px 24px rgba(0, 255, 255, 0.2)' 
                                : '0 8px 24px rgba(37, 99, 235, 0.2)'
                            }
                          }}>
                            {/* Image Section */}
                            <Box sx={{ position: 'relative', height: 200, overflow: 'hidden' }}>
                              {primaryImage ? (
                                <img 
                                  src={primaryImage} 
                                  alt={house.title}
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.onerror = null;
                                    target.src = getPlaceholderImage(400, 250);
                                  }}
                                />
                              ) : (
                                <Box sx={{ 
                                  width: '100%', height: '100%', 
                                  backgroundColor: theme === 'dark' ? '#334155' : '#e5e7eb',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                  <Home sx={{ fontSize: 48, color: theme === 'dark' ? '#a8b2d1' : '#94a3b8' }} />
                                </Box>
                              )}
                              
                              <Chip
                                label={getStatusText(house.status)}
                                size="small"
                                color={getStatusColor(house.status)}
                                sx={{ position: 'absolute', top: 8, right: 8, height: 24 }}
                              />
                              
                              {house.threeDModels && house.threeDModels.length > 0 && (
                                <Chip
                                  label="3D Tour"
                                  size="small"
                                  icon={<ThreeDRotation sx={{ fontSize: 14 }} />}
                                  sx={{ 
                                    position: 'absolute', 
                                    bottom: 8, 
                                    left: 8, 
                                    height: 24,
                                    backgroundColor: theme === 'dark' ? '#00ffff' : '#007bff',
                                    color: '#fff'
                                  }}
                                />
                              )}
                            </Box>
                            
                            <CardContent sx={{ p: 2 }}>
                              <Typography variant="h6" sx={{ 
                                fontWeight: 'bold',
                                mb: 1,
                                fontSize: '1rem',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}>
                                {house.title}
                              </Typography>
                              
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                                <LocationOn sx={{ fontSize: 14, color: theme === 'dark' ? '#a8b2d1' : '#666666' }} />
                                <Typography variant="caption" sx={{ color: theme === 'dark' ? '#a8b2d1' : '#666666' }}>
                                  {house.city}, {house.state}
                                </Typography>
                              </Box>
                              
                              <Typography variant="h6" sx={{ 
                                fontWeight: 'bold',
                                color: theme === 'dark' ? '#00ffff' : '#007bff',
                                mb: 1
                              }}>
                                {formatPrice(house.price)}/month
                              </Typography>
                              
                              <Box sx={{ 
                                display: 'flex', 
                                flexWrap: 'wrap',
                                gap: 2,
                                mb: 2,
                                pb: 1,
                                borderBottom: 1,
                                borderColor: theme === 'dark' ? '#334155' : '#e5e7eb'
                              }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <Bed sx={{ fontSize: 16 }} />
                                  <Typography variant="caption">{house.bedrooms} Bed</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <Bathtub sx={{ fontSize: 16 }} />
                                  <Typography variant="caption">{house.bathrooms} Bath</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <SquareFoot sx={{ fontSize: 16 }} />
                                  <Typography variant="caption">{house.area} sqft</Typography>
                                </Box>
                              </Box>
                              
                              <Box sx={{ display: 'flex', gap: 1, pt: 1 }}>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  startIcon={<Visibility />}
                                  onClick={() => handleViewHouse(house)}
                                  sx={{
                                    flex: 1,
                                    borderRadius: 1,
                                    borderColor: theme === 'dark' ? '#00ffff' : '#007bff',
                                    color: theme === 'dark' ? '#00ffff' : '#007bff',
                                    fontSize: '0.75rem',
                                    '&:hover': {
                                      backgroundColor: theme === 'dark' ? '#00ffff20' : '#007bff10'
                                    }
                                  }}
                                >
                                  View
                                </Button>
                                <Button
                                  size="small"
                                  variant="contained"
                                  startIcon={<Description />}
                                  onClick={() => handleApply(house)}
                                  disabled={house.status !== 'AVAILABLE'}
                                  sx={{
                                    flex: 1,
                                    borderRadius: 1,
                                    background: 'linear-gradient(135deg, #28a745, #218838)',
                                    fontSize: '0.75rem',
                                    '&:hover': {
                                      background: 'linear-gradient(135deg, #218838, #1e7e34)'
                                    }
                                  }}
                                >
                                  Apply
                                </Button>
                              </Box>
                            </CardContent>
                          </Card>
                        </motion.div>
                      </Box>
                    );
                  })}
                </Box>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center',
                    mt: 6,
                    gap: 2
                  }}>
                    <Button
                      onClick={() => handlePageChange(filters.page - 1)}
                      disabled={filters.page === 1}
                      variant="outlined"
                      sx={{
                        borderRadius: 1,
                        borderColor: theme === 'dark' ? '#00ffff' : '#007bff',
                        color: theme === 'dark' ? '#00ffff' : '#007bff',
                        '&:hover': {
                          backgroundColor: theme === 'dark' ? '#00ffff20' : '#007bff10'
                        }
                      }}
                    >
                      Previous
                    </Button>
                    
                    <Typography variant="body2">
                      Page {filters.page} of {pagination.totalPages}
                    </Typography>
                    
                    <Button
                      onClick={() => handlePageChange(filters.page + 1)}
                      disabled={filters.page === pagination.totalPages}
                      variant="outlined"
                      sx={{
                        borderRadius: 1,
                        borderColor: theme === 'dark' ? '#00ffff' : '#007bff',
                        color: theme === 'dark' ? '#00ffff' : '#007bff',
                        '&:hover': {
                          backgroundColor: theme === 'dark' ? '#00ffff20' : '#007bff10'
                        }
                      }}
                    >
                      Next
                    </Button>
                  </Box>
                )}
              </>
            )}
          </Box>
        </Box>
      </Box>

      {/* View House Dialog */}
      <Dialog 
        open={openViewDialog} 
        onClose={() => setOpenViewDialog(false)} 
        maxWidth="lg" 
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: { 
            borderRadius: 2,
            backgroundColor: theme === 'dark' ? '#0f172a' : 'white',
            maxHeight: '90vh',
            overflow: 'hidden'
          }
        }}
      >
        {selectedHouse && (
          <>
            <DialogTitle sx={{ 
              borderBottom: 1,
              borderColor: theme === 'dark' ? '#334155' : '#e5e7eb',
              py: 2,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <Typography variant="h6">Property Details</Typography>
              <IconButton onClick={() => setOpenViewDialog(false)} size="small">
                <Close />
              </IconButton>
            </DialogTitle>
            
            <DialogContent sx={{ p: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '100%' }}>
              {/* Tabs Navigation */}
              <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
                <Tabs value={viewTab} onChange={(e, v) => setViewTab(v)}>
                  <Tab label="Overview" />
                  <Tab 
                    icon={<Badge badgeContent={selectedHouse.images?.length || 0} color="primary"><ImageIcon /></Badge>} 
                    iconPosition="start" 
                    label="Images" 
                  />
                  {selectedHouse.threeDModels && selectedHouse.threeDModels.length > 0 && (
                    <Tab 
                      icon={<Badge badgeContent={selectedHouse.threeDModels.length} color="secondary"><ThreeDRotation /></Badge>}
                      iconPosition="start" 
                      label="3D Models" 
                    />
                  )}
                </Tabs>
              </Box>

              <Box sx={{ p: 3, overflowY: 'auto', flex: 1 }}>
                {/* Overview Tab */}
                {viewTab === 0 && (
                  <Box>
                    {/* Title and Status */}
                    <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
                      <Box>
                        <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>
                          {selectedHouse.title}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                          <LocationOn sx={{ fontSize: 16, color: theme === 'dark' ? '#a8b2d1' : '#666666' }} />
                          <Typography variant="body2" sx={{ color: theme === 'dark' ? '#a8b2d1' : '#666666' }}>
                            {selectedHouse.address}, {selectedHouse.city}, {selectedHouse.state} {selectedHouse.zipCode}
                          </Typography>
                        </Box>
                      </Box>
                      <Chip
                        label={getStatusText(selectedHouse.status)}
                        color={getStatusColor(selectedHouse.status)}
                        sx={{ height: 32, fontWeight: 'bold' }}
                      />
                    </Box>

                    {/* Price and Deposit */}
                    <Box sx={{ 
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 3,
                      mb: 4,
                      p: 2,
                      backgroundColor: theme === 'dark' ? '#1e293b' : '#f8f9fa',
                      borderRadius: 2
                    }}>
                      <Box>
                        <Typography variant="caption" sx={{ color: theme === 'dark' ? '#94a3b8' : '#666666' }}>
                          Monthly Rent
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 'bold', color: theme === 'dark' ? '#00ffff' : '#007bff' }}>
                          {formatPrice(selectedHouse.price)}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" sx={{ color: theme === 'dark' ? '#94a3b8' : '#666666' }}>
                          Security Deposit
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                          {formatPrice(selectedHouse.securityDeposit)}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Specifications */}
                    <Box sx={{ mb: 4 }}>
                      <Typography variant="h6" sx={{ mb: 2, color: theme === 'dark' ? '#00ffff' : '#007bff' }}>
                        Specifications
                      </Typography>
                      <Divider sx={{ mb: 2 }} />
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Bed sx={{ color: theme === 'dark' ? '#00ffff' : '#007bff' }} />
                          <Box>
                            <Typography variant="caption">Bedrooms</Typography>
                            <Typography variant="body1">{selectedHouse.bedrooms}</Typography>
                          </Box>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Bathtub sx={{ color: theme === 'dark' ? '#00ffff' : '#007bff' }} />
                          <Box>
                            <Typography variant="caption">Bathrooms</Typography>
                            <Typography variant="body1">{selectedHouse.bathrooms}</Typography>
                          </Box>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <SquareFoot sx={{ color: theme === 'dark' ? '#00ffff' : '#007bff' }} />
                          <Box>
                            <Typography variant="caption">Area</Typography>
                            <Typography variant="body1">{selectedHouse.area} sqft</Typography>
                          </Box>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Home sx={{ color: theme === 'dark' ? '#00ffff' : '#007bff' }} />
                          <Box>
                            <Typography variant="caption">Property Type</Typography>
                            <Typography variant="body1">{getHouseTypeLabel(selectedHouse.type)}</Typography>
                          </Box>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Home sx={{ color: theme === 'dark' ? '#00ffff' : '#007bff' }} />
                          <Box>
                            <Typography variant="caption">Furnishing</Typography>
                            <Typography variant="body1">{getFurnishingLabel(selectedHouse.furnishingStatus)}</Typography>
                          </Box>
                        </Box>
                      </Box>
                    </Box>

                    {/* Description */}
                    <Box sx={{ mb: 4 }}>
                      <Typography variant="h6" sx={{ mb: 2, color: theme === 'dark' ? '#00ffff' : '#007bff' }}>
                        Description
                      </Typography>
                      <Divider sx={{ mb: 2 }} />
                      <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                        {selectedHouse.description}
                      </Typography>
                    </Box>

                    {/* Amenities */}
                    {selectedHouse.amenities && selectedHouse.amenities.length > 0 && (
                      <Box sx={{ mb: 4 }}>
                        <Typography variant="h6" sx={{ mb: 2, color: theme === 'dark' ? '#00ffff' : '#007bff' }}>
                          Amenities
                        </Typography>
                        <Divider sx={{ mb: 2 }} />
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                          {selectedHouse.amenities.map((amenity, idx) => (
                            <Chip key={idx} label={amenity} size="small" />
                          ))}
                        </Box>
                      </Box>
                    )}

                    {/* Availability */}
                    <Box sx={{ mb: 4 }}>
                      <Typography variant="h6" sx={{ mb: 2, color: theme === 'dark' ? '#00ffff' : '#007bff' }}>
                        Availability
                      </Typography>
                      <Divider sx={{ mb: 2 }} />
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Typography variant="body2">
                          <strong>Available From:</strong> {format(new Date(selectedHouse.availableFrom), 'MMMM dd, yyyy')}
                        </Typography>
                        {selectedHouse.availableUntil && (
                          <Typography variant="body2">
                            <strong>Available Until:</strong> {format(new Date(selectedHouse.availableUntil), 'MMMM dd, yyyy')}
                          </Typography>
                        )}
                        <Typography variant="body2">
                          <strong>Views:</strong> {selectedHouse.view}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Listed:</strong> {format(new Date(selectedHouse.created_at), 'MMMM dd, yyyy')}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Action Buttons */}
                    <Box sx={{ 
                      display: 'flex', 
                      gap: 2,
                      pt: 2,
                      borderTop: 1,
                      borderColor: theme === 'dark' ? '#334155' : '#e5e7eb'
                    }}>
                      <Button
                        fullWidth
                        variant="contained"
                        startIcon={<Description />}
                        onClick={() => {
                          setOpenViewDialog(false);
                          handleApply(selectedHouse);
                        }}
                        disabled={selectedHouse.status !== 'AVAILABLE'}
                        sx={{
                          background: 'linear-gradient(135deg, #28a745, #218838)',
                          '&:hover': {
                            background: 'linear-gradient(135deg, #218838, #1e7e34)'
                          }
                        }}
                      >
                        Apply Now
                      </Button>
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<Message />}
                        onClick={() => {
                          setOpenViewDialog(false);
                          handleMessage(selectedHouse);
                        }}
                        sx={{
                          borderColor: theme === 'dark' ? '#00ffff' : '#007bff',
                          color: theme === 'dark' ? '#00ffff' : '#007bff'
                        }}
                      >
                        Send Message
                      </Button>
                    </Box>
                  </Box>
                )}

                {/* Images Tab */}
                {viewTab === 1 && selectedHouse.images && selectedHouse.images.length > 0 && (
                  <Box sx={{ display: 'flex', gap: 2, height: '100%' }}>
                    {/* Vertical Thumbnail List */}
                    <Box sx={{
                      width: 100,
                      overflowY: 'auto',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 1,
                      '&::-webkit-scrollbar': { width: 6 },
                      '&::-webkit-scrollbar-track': { backgroundColor: theme === 'dark' ? '#334155' : '#e5e7eb', borderRadius: 3 },
                      '&::-webkit-scrollbar-thumb': { backgroundColor: theme === 'dark' ? '#00ffff' : '#007bff', borderRadius: 3 }
                    }}>
                      {selectedHouse.images.map((_, idx) => {
                        const imgUrl = getImageUrl(selectedHouse, idx);
                        return imgUrl ? (
                          <Box
                            key={idx}
                            onClick={() => setCurrentImageIndex(idx)}
                            sx={{
                              width: '100%',
                              height: 80,
                              borderRadius: 1,
                              overflow: 'hidden',
                              cursor: 'pointer',
                              border: currentImageIndex === idx ? `2px solid ${theme === 'dark' ? '#00ffff' : '#007bff'}` : '2px solid transparent',
                              transition: 'all 0.2s',
                              '&:hover': {
                                opacity: 0.8
                              }
                            }}
                          >
                            <img
                              src={imgUrl}
                              alt={`Thumbnail ${idx + 1}`}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          </Box>
                        ) : null;
                      })}
                    </Box>

                    {/* Main Image */}
                    <Box sx={{ flex: 1, position: 'relative' }}>
                      <Box sx={{
                        width: '100%',
                        height: '100%',
                        minHeight: 400,
                        backgroundColor: theme === 'dark' ? '#1e293b' : '#f5f5f5',
                        borderRadius: 2,
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative'
                      }}>
                        <img
                          src={getImageUrl(selectedHouse, currentImageIndex) || getPlaceholderImage(800, 600)}
                          alt={`Image ${currentImageIndex + 1}`}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                            maxWidth: '100%',
                            maxHeight: '100%'
                          }}
                        />
                      </Box>
                      
                      <Typography variant="caption" sx={{ mt: 1, display: 'block', textAlign: 'center' }}>
                        {currentImageIndex + 1} / {selectedHouse.images.length}
                      </Typography>
                    </Box>
                  </Box>
                )}

                {/* 3D Models Tab */}
                {viewTab === 2 && selectedHouse.threeDModels && selectedHouse.threeDModels.length > 0 && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {selectedHouse.threeDModels.map((model, idx) => (
                      <Card key={idx} sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
                          <Avatar sx={{ width: 64, height: 64, bgcolor: theme === 'dark' ? '#00ffff' : '#007bff' }}>
                            <ThreeDRotation sx={{ fontSize: 32 }} />
                          </Avatar>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                              {model.fileName}
                            </Typography>
                            <Typography variant="caption" sx={{ color: theme === 'dark' ? '#a8b2d1' : '#666666' }}>
                              Format: {model.format.toUpperCase()} • Size: {(model.data?.length / 1024 / 1024).toFixed(2)} MB
                            </Typography>
                          </Box>
                          <Button
                            variant="contained"
                            startIcon={<ViewInAr />}
                            sx={{
                              background: theme === 'dark'
                                ? 'linear-gradient(135deg, #00ffff, #00b3b3)'
                                : 'linear-gradient(135deg, #007bff, #0056b3)'
                            }}
                          >
                            View in 3D
                          </Button>
                        </Box>
                      </Card>
                    ))}
                  </Box>
                )}
              </Box>
            </DialogContent>
            
            <DialogActions sx={{ 
              p: 2,
              borderTop: 1,
              borderColor: theme === 'dark' ? '#334155' : '#e5e7eb'
            }}>
              <Button onClick={() => setOpenViewDialog(false)}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Apply Dialog */}
      <Dialog 
        open={openApplyDialog} 
        onClose={() => setOpenApplyDialog(false)} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: { 
            borderRadius: 2,
            backgroundColor: theme === 'dark' ? '#0f172a' : 'white',
            maxHeight: '90vh'
          }
        }}
      >
        {selectedHouse && (
          <>
            <DialogTitle sx={{ 
              borderBottom: 1,
              borderColor: theme === 'dark' ? '#334155' : '#e5e7eb',
              py: 2
            }}>
              <Typography variant="h6">Apply for {selectedHouse.title}</Typography>
              <Typography variant="caption" sx={{ color: theme === 'dark' ? '#a8b2d1' : '#666666' }}>
                {formatPrice(selectedHouse.price)}/month • {selectedHouse.bedrooms} Bed • {selectedHouse.bathrooms} Bath
              </Typography>
            </DialogTitle>
            
            <DialogContent sx={{ p: 3, overflowY: 'auto' }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {/* Personal Information */}
                <Box>
                  <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold', color: theme === 'dark' ? '#00ffff' : '#007bff' }}>
                    Personal Information
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField
                      fullWidth
                      label="Full Name"
                      value={applicationForm.fullName}
                      onChange={(e) => setApplicationForm(prev => ({ ...prev, fullName: e.target.value }))}
                      required
                      InputProps={{ startAdornment: <Person sx={{ mr: 1, fontSize: 20 }} /> }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: theme === 'dark' ? '#1e293b' : 'white',
                          '& fieldset': {
                            borderColor: theme === 'dark' ? '#334155' : '#e5e7eb',
                          }
                        }
                      }}
                    />
                    <TextField
                      fullWidth
                      label="Email Address"
                      type="email"
                      value={applicationForm.email}
                      onChange={(e) => setApplicationForm(prev => ({ ...prev, email: e.target.value }))}
                      required
                      InputProps={{ startAdornment: <Email sx={{ mr: 1, fontSize: 20 }} /> }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: theme === 'dark' ? '#1e293b' : 'white',
                          '& fieldset': {
                            borderColor: theme === 'dark' ? '#334155' : '#e5e7eb',
                          }
                        }
                      }}
                    />
                    <TextField
                      fullWidth
                      label="Phone Number"
                      value={applicationForm.phone}
                      onChange={(e) => setApplicationForm(prev => ({ ...prev, phone: e.target.value }))}
                      required
                      InputProps={{ startAdornment: <Phone sx={{ mr: 1, fontSize: 20 }} /> }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: theme === 'dark' ? '#1e293b' : 'white',
                          '& fieldset': {
                            borderColor: theme === 'dark' ? '#334155' : '#e5e7eb',
                          }
                        }
                      }}
                    />
                  </Box>
                </Box>

                {/* Employment Information */}
                <Box>
                  <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold', color: theme === 'dark' ? '#00ffff' : '#007bff' }}>
                    Employment Information
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField
                      fullWidth
                      label="Occupation"
                      value={applicationForm.occupation}
                      onChange={(e) => setApplicationForm(prev => ({ ...prev, occupation: e.target.value }))}
                      required
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: theme === 'dark' ? '#1e293b' : 'white',
                          '& fieldset': {
                            borderColor: theme === 'dark' ? '#334155' : '#e5e7eb',
                          }
                        }
                      }}
                    />
                    <TextField
                      fullWidth
                      label="Monthly Income"
                      type="number"
                      value={applicationForm.monthlyIncome}
                      onChange={(e) => setApplicationForm(prev => ({ ...prev, monthlyIncome: parseFloat(e.target.value) || 0 }))}
                      required
                      InputProps={{ startAdornment: <AttachMoney sx={{ mr: 1, fontSize: 20 }} /> }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: theme === 'dark' ? '#1e293b' : 'white',
                          '& fieldset': {
                            borderColor: theme === 'dark' ? '#334155' : '#e5e7eb',
                          }
                        }
                      }}
                    />
                  </Box>
                </Box>

                {/* Rental Details */}
                <Box>
                  <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold', color: theme === 'dark' ? '#00ffff' : '#007bff' }}>
                    Rental Details
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField
                      fullWidth
                      label="Number of Occupants"
                      type="number"
                      value={applicationForm.numberOfOccupants}
                      onChange={(e) => setApplicationForm(prev => ({ ...prev, numberOfOccupants: parseInt(e.target.value) || 1 }))}
                      required
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: theme === 'dark' ? '#1e293b' : 'white',
                          '& fieldset': {
                            borderColor: theme === 'dark' ? '#334155' : '#e5e7eb',
                          }
                        }
                      }}
                    />
                    <TextField
                      fullWidth
                      label="Preferred Move-in Date"
                      type="date"
                      value={applicationForm.preferredMoveInDate}
                      onChange={(e) => setApplicationForm(prev => ({ ...prev, preferredMoveInDate: e.target.value }))}
                      required
                      InputLabelProps={{ shrink: true }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: theme === 'dark' ? '#1e293b' : 'white',
                          '& fieldset': {
                            borderColor: theme === 'dark' ? '#334155' : '#e5e7eb',
                          }
                        }
                      }}
                    />
                    <TextField
                      fullWidth
                      label="Additional Message"
                      multiline
                      rows={3}
                      value={applicationForm.message}
                      onChange={(e) => setApplicationForm(prev => ({ ...prev, message: e.target.value }))}
                      placeholder="Any additional information you'd like to share..."
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: theme === 'dark' ? '#1e293b' : 'white',
                          '& fieldset': {
                            borderColor: theme === 'dark' ? '#334155' : '#e5e7eb',
                          }
                        }
                      }}
                    />
                  </Box>
                </Box>

                {/* Documents */}
                <Box>
                  <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold', color: theme === 'dark' ? '#00ffff' : '#007bff' }}>
                    Supporting Documents
                  </Typography>
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<CloudUpload />}
                    sx={{
                      mb: 2,
                      borderColor: theme === 'dark' ? '#00ffff' : '#007bff',
                      color: theme === 'dark' ? '#00ffff' : '#007bff'
                    }}
                  >
                    Upload Documents
                    <input
                      type="file"
                      hidden
                      multiple
                      onChange={handleFileUpload}
                    />
                  </Button>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {applicationForm.documents.map((doc, idx) => (
                      <Box key={idx} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1, border: 1, borderColor: theme === 'dark' ? '#334155' : '#e5e7eb', borderRadius: 1 }}>
                        <Typography variant="caption">{doc.name}</Typography>
                        <IconButton size="small" onClick={() => removeDocument(idx)}>
                          <Close fontSize="small" />
                        </IconButton>
                      </Box>
                    ))}
                  </Box>
                  <Typography variant="caption" sx={{ mt: 1, display: 'block', color: theme === 'dark' ? '#94a3b8' : '#999999' }}>
                    Accepted formats: PDF, DOC, DOCX, JPG, PNG (Max 5MB each)
                  </Typography>
                </Box>
              </Box>
            </DialogContent>
            
            <DialogActions sx={{ 
              p: 3,
              borderTop: 1,
              borderColor: theme === 'dark' ? '#334155' : '#e5e7eb'
            }}>
              <Button onClick={() => setOpenApplyDialog(false)}>Cancel</Button>
              <Button 
                onClick={handleSubmitApplication}
                variant="contained"
                disabled={!applicationForm.fullName || !applicationForm.email || !applicationForm.phone}
                sx={{
                  background: 'linear-gradient(135deg, #28a745, #218838)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #218838, #1e7e34)'
                  }
                }}
              >
                Submit Application
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Message Dialog */}
      <Dialog 
        open={openMessageDialog} 
        onClose={() => setOpenMessageDialog(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: { 
            borderRadius: 2,
            backgroundColor: theme === 'dark' ? '#0f172a' : 'white'
          }
        }}
      >
        {selectedHouse && (
          <>
            <DialogTitle sx={{ 
              borderBottom: 1,
              borderColor: theme === 'dark' ? '#334155' : '#e5e7eb',
              py: 2
            }}>
              <Typography variant="h6">Send Message to Owner</Typography>
              <Typography variant="caption" sx={{ color: theme === 'dark' ? '#a8b2d1' : '#666666' }}>
                Regarding: {selectedHouse.title}
              </Typography>
            </DialogTitle>
            
            <DialogContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  fullWidth
                  label="Your Name"
                  value={messageForm.name}
                  onChange={(e) => setMessageForm(prev => ({ ...prev, name: e.target.value }))}
                  required
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: theme === 'dark' ? '#1e293b' : 'white',
                      '& fieldset': {
                        borderColor: theme === 'dark' ? '#334155' : '#e5e7eb',
                      }
                    }
                  }}
                />
                <TextField
                  fullWidth
                  label="Email Address"
                  type="email"
                  value={messageForm.email}
                  onChange={(e) => setMessageForm(prev => ({ ...prev, email: e.target.value }))}
                  required
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: theme === 'dark' ? '#1e293b' : 'white',
                      '& fieldset': {
                        borderColor: theme === 'dark' ? '#334155' : '#e5e7eb',
                      }
                    }
                  }}
                />
                <TextField
                  fullWidth
                  label="Phone Number"
                  value={messageForm.phone}
                  onChange={(e) => setMessageForm(prev => ({ ...prev, phone: e.target.value }))}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: theme === 'dark' ? '#1e293b' : 'white',
                      '& fieldset': {
                        borderColor: theme === 'dark' ? '#334155' : '#e5e7eb',
                      }
                    }
                  }}
                />
                <TextField
                  fullWidth
                  label="Message"
                  multiline
                  rows={4}
                  value={messageForm.message}
                  onChange={(e) => setMessageForm(prev => ({ ...prev, message: e.target.value }))}
                  required
                  placeholder="Ask about availability, viewing schedule, or any other questions..."
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: theme === 'dark' ? '#1e293b' : 'white',
                      '& fieldset': {
                        borderColor: theme === 'dark' ? '#334155' : '#e5e7eb',
                      }
                    }
                  }}
                />
              </Box>
            </DialogContent>
            
            <DialogActions sx={{ 
              p: 3,
              borderTop: 1,
              borderColor: theme === 'dark' ? '#334155' : '#e5e7eb'
            }}>
              <Button onClick={() => setOpenMessageDialog(false)}>Cancel</Button>
              <Button 
                onClick={handleSubmitMessage}
                variant="contained"
                startIcon={<Send />}
                disabled={!messageForm.name || !messageForm.email || !messageForm.message}
                sx={{
                  background: theme === 'dark'
                    ? 'linear-gradient(135deg, #00ffff, #00b3b3)'
                    : 'linear-gradient(135deg, #007bff, #0056b3)'
                }}
              >
                Send Message
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* CSS Styles */}
      <style jsx global>{`
        @keyframes highlightPulse {
          0% { box-shadow: 0 0 0 0 rgba(0, 255, 255, 0.7); }
          70% { box-shadow: 0 0 0 20px rgba(0, 255, 255, 0); }
          100% { box-shadow: 0 0 0 0 rgba(0, 255, 255, 0); }
        }
        
        .highlight-pulse {
          animation: highlightPulse 2s;
        }
        
        @media (prefers-color-scheme: light) {
          @keyframes highlightPulse {
            0% { box-shadow: 0 0 0 0 rgba(0, 123, 255, 0.7); }
            70% { box-shadow: 0 0 0 20px rgba(0, 123, 255, 0); }
            100% { box-shadow: 0 0 0 0 rgba(0, 123, 255, 0); }
          }
        }
      `}</style>

      {/* Notifications */}
      <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError('')} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity="error" onClose={() => setError('')}>{error}</Alert>
      </Snackbar>
      <Snackbar open={!!success} autoHideDuration={6000} onClose={() => setSuccess('')} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity="success" onClose={() => setSuccess('')}>{success}</Alert>
      </Snackbar>
    </Box>
  );
};

export default PublicHousePage;