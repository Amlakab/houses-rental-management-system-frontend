// app/admin/houses/components/PublicHouseDetailPage.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Box, Typography, Card, CardContent, Chip, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Divider, CircularProgress, useMediaQuery, Snackbar, Alert,
  Tooltip, TextField, FormControl, InputLabel, Select, MenuItem,
  Stepper, Step, StepLabel, Paper, Avatar
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/lib/theme-context';
import {
  Home, LocationOn, AttachMoney, Bed, Bathtub,
  SquareFoot, ArrowBack, Visibility, ShoppingCart,
  CheckCircle, Cancel, Apartment, Villa, Landscape,
  Pool, FitnessCenter, Security, LocalParking, Wifi,
  ThreeDRotation, CalendarToday, AccessTime, LocalOffer,
  Description, PhotoCamera, Share, Favorite, FavoriteBorder,
  Email, Phone, WhatsApp, Send,
  Close, Image as ImageIcon, Chat, Person,
  ArrowForwardIos, ArrowBackIos
} from '@mui/icons-material';
import api from '@/app/utils/api';
import { House, PropertyType, OrderType, OrderStatus } from '@/types/houses';
import MessageModal from '@/components/MessageModal';
import ThreeViewer from '@/components/ThreeViewer';

const propertyTypeIcons: Record<PropertyType, React.ReactElement> = {
  [PropertyType.APARTMENT]: <Apartment />,
  [PropertyType.VILLA]: <Villa />,
  [PropertyType.CONDO]: <Villa />,
  [PropertyType.HOUSE]: <Home />,
  [PropertyType.LAND]: <Landscape />
};

const propertyTypeLabels: Record<PropertyType, string> = {
  [PropertyType.APARTMENT]: 'Apartment',
  [PropertyType.VILLA]: 'Villa',
  [PropertyType.CONDO]: 'Condo',
  [PropertyType.HOUSE]: 'House',
  [PropertyType.LAND]: 'Land'
};

const amenityIcons: Record<string, React.ReactElement> = {
  pool: <Pool />,
  gym: <FitnessCenter />,
  security: <Security />,
  parking: <LocalParking />,
  wifi: <Wifi />
};

interface PublicHouseDetailPageProps {
  houseId: string;
  onBack: () => void;
}

const PublicHouseDetailPage = ({ houseId, onBack }: PublicHouseDetailPageProps) => {
  const { theme } = useTheme();
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  const [house, setHouse] = useState<House | null>(null);
  const [messageModalOpen, setMessageModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedImage, setSelectedImage] = useState(0);
  const [activeTab, setActiveTab] = useState<'images' | '3d' | 'virtual'>('images');
  const [open3DDialog, setOpen3DDialog] = useState(false);
  const [openOrderDialog, setOpenOrderDialog] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [orderLoading, setOrderLoading] = useState(false);
  const [quantity, setQuantity] = useState(1);
  
  const [orderForm, setOrderForm] = useState({
    orderType: OrderType.INQUIRY,
    details: {
      visitDate: '',
      visitTime: '',
      numberOfPeople: 1,
      specialRequests: '',
      preferredContactMethod: ['EMAIL'] as string[]
    }
  });

  const threeDViewerRef = useRef<HTMLDivElement>(null);

  const getImageUrl = (image: any, index: number): string | null => {
    if (house?.images && house.images[index] && house.images[index].data) {
      return `data:${house.images[index].contentType};base64,${house.images[index].data}`;
    }
    return null;
  };

  const fetchHouse = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/public/houses/${houseId}`);
      setHouse(response.data.data);
      
      await api.get(`/houses/${houseId}/view`);
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

  const handleOrderSubmit = async () => {
    if (!house) return;
    
    try {
      setOrderLoading(true);
      const orderData = {
        houseId: house._id,
        orderType: orderForm.orderType,
        details: JSON.stringify({
          ...orderForm.details,
          quantity
        }),
        totalAmount: (orderForm.orderType === OrderType.PURCHASE ? house.pricing.price : 
                     orderForm.orderType === OrderType.RENT ? house.pricing.price / 12 : 0) * quantity,
        quantity
      };
      
      const response = await api.post('/orders', orderData);
      setSuccess('Application submitted successfully! The agent will contact you soon.');
      setOpenOrderDialog(false);
      setQuantity(1);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to submit application');
    } finally {
      setOrderLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const hasImages = house?.images && house.images.length > 0;
  const has3DModels = house?.threeDModels && house.threeDModels.length > 0;
  const hasVirtualTour = house?.virtualTour?.enabled && house.virtualTour.url;

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <CircularProgress size={60} sx={{ color: theme === 'dark' ? '#00ffff' : '#007bff' }} />
      </Box>
    );
  }

  if (!house) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Home sx={{ fontSize: 64, color: theme === 'dark' ? '#334155' : '#cbd5e1', mb: 2 }} />
        <Typography variant="h6">Property not found</Typography>
        <Button onClick={onBack} sx={{ mt: 2 }}>Go Back</Button>
      </Box>
    );
  }

  return (
    <Box sx={{ py: 3, px: { xs: 2, md: 4 } }}>
      {/* Back Button */}
      <IconButton onClick={onBack} sx={{ mb: 2, color: theme === 'dark' ? '#00ffff' : '#007bff' }}>
        <ArrowBack />
      </IconButton>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Media Tabs */}
        <Card sx={{ mb: 4, borderRadius: 3, overflow: 'hidden', backgroundColor: theme === 'dark' ? '#0f172a80' : 'white' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2, pt: 2 }}>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {hasImages && (
                <Button
                  variant={activeTab === 'images' ? 'contained' : 'text'}
                  startIcon={<ImageIcon />}
                  onClick={() => setActiveTab('images')}
                  sx={{
                    borderRadius: 2,
                    background: activeTab === 'images'
                      ? (theme === 'dark' ? 'linear-gradient(135deg, #00ffff, #00b3b3)' : 'linear-gradient(135deg, #007bff, #0056b3)')
                      : undefined
                  }}
                >
                  Images ({house.images.length})
                </Button>
              )}
              {has3DModels && (
                <Button
                  variant={activeTab === '3d' ? 'contained' : 'text'}
                  startIcon={<ThreeDRotation />}
                  onClick={() => setActiveTab('3d')}
                  sx={{
                    borderRadius: 2,
                    background: activeTab === '3d'
                      ? (theme === 'dark' ? 'linear-gradient(135deg, #00ffff, #00b3b3)' : 'linear-gradient(135deg, #007bff, #0056b3)')
                      : undefined
                  }}
                >
                  3D Tour ({house.threeDModels.length})
                </Button>
              )}
              {hasVirtualTour && (
                <Button
                  variant={activeTab === 'virtual' ? 'contained' : 'text'}
                  startIcon={<Visibility />}
                  onClick={() => setActiveTab('virtual')}
                  sx={{
                    borderRadius: 2,
                    background: activeTab === 'virtual'
                      ? (theme === 'dark' ? 'linear-gradient(135deg, #00ffff, #00b3b3)' : 'linear-gradient(135deg, #007bff, #0056b3)')
                      : undefined
                  }}
                >
                  Virtual Tour
                </Button>
              )}
            </Box>
          </Box>
          
          {/* Image Gallery View */}
          {activeTab === 'images' && hasImages && (
            <Box sx={{ position: 'relative' }}>
              <Box sx={{ 
                position: 'relative', 
                height: { xs: 300, md: 500 }, 
                overflow: 'hidden',
                backgroundColor: theme === 'dark' ? '#1e293b' : '#f5f5f5'
              }}>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={selectedImage}
                    initial={{ opacity: 0, x: 100 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    style={{ width: '100%', height: '100%' }}
                  >
                    {getImageUrl(house, selectedImage) ? (
                      <img 
                        src={getImageUrl(house, selectedImage)!} 
                        alt={`${house.title} - Image ${selectedImage + 1}`}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Home sx={{ fontSize: 80, color: theme === 'dark' ? '#a8b2d1' : '#94a3b8' }} />
                      </Box>
                    )}
                  </motion.div>
                </AnimatePresence>
                
                {house.images.length > 1 && (
                  <>
                    <IconButton
                      onClick={() => {
                        const newIndex = selectedImage === 0 ? house.images.length - 1 : selectedImage - 1;
                        setSelectedImage(newIndex);
                      }}
                      sx={{
                        position: 'absolute',
                        left: 16,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        color: 'white',
                        '&:hover': { backgroundColor: 'rgba(0,0,0,0.7)' },
                        zIndex: 2
                      }}
                    >
                      <ArrowBackIos sx={{ fontSize: 20 }} />
                    </IconButton>
                    <IconButton
                      onClick={() => {
                        const newIndex = selectedImage === house.images.length - 1 ? 0 : selectedImage + 1;
                        setSelectedImage(newIndex);
                      }}
                      sx={{
                        position: 'absolute',
                        right: 16,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        color: 'white',
                        '&:hover': { backgroundColor: 'rgba(0,0,0,0.7)' },
                        zIndex: 2
                      }}
                    >
                      <ArrowForwardIos sx={{ fontSize: 20 }} />
                    </IconButton>
                    <Chip
                      label={`${selectedImage + 1} / ${house.images.length}`}
                      size="small"
                      sx={{
                        position: 'absolute',
                        bottom: 16,
                        right: 16,
                        backgroundColor: 'rgba(0,0,0,0.6)',
                        color: 'white',
                        fontWeight: 'bold',
                        zIndex: 2
                      }}
                    />
                  </>
                )}
              </Box>
              
              {house.images.length > 1 && (
                <Box sx={{ 
                  display: 'flex', 
                  gap: 1, 
                  p: 2, 
                  overflowX: 'auto',
                  scrollBehavior: 'smooth',
                  '&::-webkit-scrollbar': { height: 8 },
                  '&::-webkit-scrollbar-track': { backgroundColor: theme === 'dark' ? '#334155' : '#e5e7eb', borderRadius: 4 },
                  '&::-webkit-scrollbar-thumb': { backgroundColor: theme === 'dark' ? '#00ffff' : '#007bff', borderRadius: 4 }
                }}>
                  {house.images.map((_, index) => (
                    <motion.div key={index} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Box
                        onClick={() => setSelectedImage(index)}
                        sx={{
                          width: 80, height: 60, borderRadius: 1, overflow: 'hidden',
                          cursor: 'pointer', 
                          border: selectedImage === index ? `2px solid ${theme === 'dark' ? '#00ffff' : '#007bff'}` : '2px solid transparent',
                          opacity: selectedImage === index ? 1 : 0.6,
                          transition: 'all 0.2s ease',
                          '&:hover': { opacity: 1, transform: 'translateY(-2px)' }
                        }}
                      >
                        {getImageUrl(house, index) ? (
                          <img src={getImageUrl(house, index)!} alt={`Thumbnail ${index + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <Box sx={{ width: '100%', height: '100%', backgroundColor: theme === 'dark' ? '#334155' : '#e5e7eb' }} />
                        )}
                      </Box>
                    </motion.div>
                  ))}
                </Box>
              )}
            </Box>
          )}
          
          {/* 3D Model View */}
          {activeTab === '3d' && has3DModels && (
            <Box sx={{ width: '100%', height: 500, position: 'relative', overflow: 'hidden', backgroundColor: '#111827', borderRadius: 2 }}>
              {house?.threeDModels && house.threeDModels.length > 0 && house.threeDModels[0].data ? (
                (() => {
                  try {
                    const modelData = house.threeDModels[0].data;
                    const contentType = house.threeDModels[0].contentType || 'model/gltf-binary';
                    
                    let base64String: string;
                    if (typeof modelData === 'string') {
                      base64String = modelData;
                    } else if (modelData && typeof modelData === 'object') {
                      const dataObj = modelData as any;
                      if (dataObj.$binary && dataObj.$binary.base64) {
                        base64String = dataObj.$binary.base64;
                      } else if (dataObj.data && Array.isArray(dataObj.data)) {
                        base64String = btoa(String.fromCharCode(...dataObj.data));
                      } else {
                        base64String = '';
                      }
                    } else {
                      base64String = '';
                    }
                    
                    if (base64String) {
                      const modelUrl = `data:${contentType};base64,${base64String}`;
                      return (
                        <ThreeViewer
                          key={modelUrl}
                          modelUrl={modelUrl}
                          modelFormat={contentType}
                          width="100%"
                          height={500}
                          autoRotate={true}
                        />
                      );
                    } else {
                      throw new Error('No valid model data');
                    }
                  } catch (err) {
                    console.error('Error creating model URL:', err);
                    return (
                      <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 2 }}>
                        <ThreeDRotation sx={{ fontSize: 64, color: theme === 'dark' ? '#ff6666' : '#dc3545' }} />
                        <Typography variant="body2" color="error">Unable to load 3D model</Typography>
                      </Box>
                    );
                  }
                })()
              ) : (
                <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ThreeDRotation sx={{ fontSize: 64, color: theme === 'dark' ? '#a8b2d1' : '#666666' }} />
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>No 3D model available</Typography>
                </Box>
              )}
            </Box>
          )}
          
          {/* Virtual Tour View */}
          {activeTab === 'virtual' && hasVirtualTour && (
            <Box sx={{ height: { xs: 300, md: 500 }, width: '100%', position: 'relative', backgroundColor: theme === 'dark' ? '#1e293b' : '#f5f5f5' }}>
              <Box sx={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', borderRadius: 2 }}>
                <iframe
                  src={house.virtualTour.url}
                  title="Virtual Tour"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%'
                  }}
                />
              </Box>
            </Box>
          )}
        </Card>
        
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 4 }}>
          {/* Main Content */}
          <Box sx={{ flex: 2 }}>
            {/* Title & Price */}
            <Card sx={{ mb: 3, borderRadius: 3, p: 3, backgroundColor: theme === 'dark' ? '#0f172a80' : 'white' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: theme === 'dark' ? '#ccd6f6' : '#333333', mb: 1 }}>
                    {house.title}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <LocationOn sx={{ fontSize: 16, color: theme === 'dark' ? '#a8b2d1' : '#666666' }} />
                    <Typography variant="body2" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                      {house.location.address}, {house.location.city}, {house.location.state} {house.location.zipCode}
                    </Typography>
                  </Box>
                  <Chip
                    label={propertyTypeLabels[house.propertyType]}
                    icon={propertyTypeIcons[house.propertyType]}
                    size="small"
                    sx={{ backgroundColor: theme === 'dark' ? '#334155' : '#e5e7eb' }}
                  />
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="h3" sx={{ fontWeight: 'bold', color: theme === 'dark' ? '#00ffff' : '#007bff' }}>
                    {formatPrice(house.pricing.price)}
                  </Typography>
                  {house.details.area > 0 && (
                    <Typography variant="caption" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                      {formatPrice(house.pricing.price / house.details.area)}/sqft
                    </Typography>
                  )}
                </Box>
              </Box>
            </Card>
            
            {/* Key Features */}
            <Card sx={{ mb: 3, borderRadius: 3, p: 3, backgroundColor: theme === 'dark' ? '#0f172a80' : 'white' }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: theme === 'dark' ? '#00ffff' : '#007bff', mb: 2 }}>
                Key Features
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Bed sx={{ color: theme === 'dark' ? '#00ffff' : '#007bff' }} />
                  <Box>
                    <Typography variant="h6">{house.details.bedrooms}</Typography>
                    <Typography variant="caption">Bedrooms</Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Bathtub sx={{ color: theme === 'dark' ? '#00ffff' : '#007bff' }} />
                  <Box>
                    <Typography variant="h6">{house.details.bathrooms}</Typography>
                    <Typography variant="caption">Bathrooms</Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SquareFoot sx={{ color: theme === 'dark' ? '#00ffff' : '#007bff' }} />
                  <Box>
                    <Typography variant="h6">{house.details.area.toLocaleString()}</Typography>
                    <Typography variant="caption">Sq Ft</Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LocalParking sx={{ color: theme === 'dark' ? '#00ffff' : '#007bff' }} />
                  <Box>
                    <Typography variant="h6">{house.details.parkingSpaces}</Typography>
                    <Typography variant="caption">Parking</Typography>
                  </Box>
                </Box>
              </Box>
            </Card>
            
            {/* Description */}
            <Card sx={{ mb: 3, borderRadius: 3, p: 3, backgroundColor: theme === 'dark' ? '#0f172a80' : 'white' }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: theme === 'dark' ? '#00ffff' : '#007bff', mb: 2 }}>
                Description
              </Typography>
              <Typography variant="body1" color={theme === 'dark' ? '#a8b2d1' : '#666666'} sx={{ lineHeight: 1.8 }}>
                {house.description}
              </Typography>
            </Card>
            
            {/* Amenities */}
            {house.details.amenities.length > 0 && (
              <Card sx={{ mb: 3, borderRadius: 3, p: 3, backgroundColor: theme === 'dark' ? '#0f172a80' : 'white' }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: theme === 'dark' ? '#00ffff' : '#007bff', mb: 2 }}>
                  Amenities
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {house.details.amenities.map(amenity => (
                    <Chip
                      key={amenity}
                      label={amenity}
                      icon={amenityIcons[amenity] || <CheckCircle />}
                      sx={{ backgroundColor: theme === 'dark' ? '#334155' : '#e5e7eb' }}
                    />
                  ))}
                </Box>
              </Card>
            )}
            
            {/* Features */}
            {house.details.features.length > 0 && (
              <Card sx={{ mb: 3, borderRadius: 3, p: 3, backgroundColor: theme === 'dark' ? '#0f172a80' : 'white' }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: theme === 'dark' ? '#00ffff' : '#007bff', mb: 2 }}>
                  Features
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {house.details.features.map(feature => (
                    <Chip key={feature} label={feature} sx={{ backgroundColor: theme === 'dark' ? '#334155' : '#e5e7eb' }} />
                  ))}
                </Box>
              </Card>
            )}
          </Box>
          
          {/* Sidebar */}
          <Box sx={{ flex: 1 }}>
            <Card sx={{ position: 'sticky', top: 100, borderRadius: 3, p: 3, backgroundColor: theme === 'dark' ? '#0f172a80' : 'white' }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: theme === 'dark' ? '#00ffff' : '#007bff', mb: 2 }}>
                Contact Agent
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>Agent Name</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>{house.agentName || house.agentId?.name || 'Property Manager'}</Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>Contact</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                  <Phone sx={{ fontSize: 16 }} />
                  <Typography variant="body2">{house.agentContact || house.agentId?.profile?.phone || 'Contact for details'}</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                  <Email sx={{ fontSize: 16 }} />
                  <Typography variant="body2">{house.agentId?.email || 'agent@example.com'}</Typography>
                </Box>
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: theme === 'dark' ? '#00ffff' : '#007bff', mb: 2 }}>
                Interested?
              </Typography>
              
              <Button
                fullWidth
                variant="contained"
                startIcon={<ShoppingCart />}
                onClick={() => setOpenOrderDialog(true)}
                sx={{
                  mb: 2,
                  background: theme === 'dark' ? 'linear-gradient(135deg, #00ff00, #00b300)' : 'linear-gradient(135deg, #28a745, #218838)',
                  borderRadius: 2,
                  py: 1.5
                }}
              >
                Make Inquiry / Apply
              </Button>
              
              <Button
                fullWidth
                variant="outlined"
                startIcon={<Chat />}
                onClick={() => setMessageModalOpen(true)}
                sx={{
                  mb: 2,
                  borderRadius: 2,
                  py: 1.5,
                  borderColor: theme === 'dark' ? '#00ffff' : '#007bff',
                  color: theme === 'dark' ? '#00ffff' : '#007bff'
                }}
              >
                Send Message
              </Button>
              
              <Divider sx={{ my: 2 }} />
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Visibility sx={{ fontSize: 16, color: theme === 'dark' ? '#a8b2d1' : '#666666' }} />
                  <Typography variant="caption">{house.views} views</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <CalendarToday sx={{ fontSize: 16, color: theme === 'dark' ? '#a8b2d1' : '#666666' }} />
                  <Typography variant="caption">Listed {formatDate(house.created_at)}</Typography>
                </Box>
              </Box>
            </Card>
          </Box>
        </Box>
      </motion.div>
      
      {/* Order/Inquiry Dialog */}
      <Dialog
        open={openOrderDialog}
        onClose={() => setOpenOrderDialog(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, backgroundColor: theme === 'dark' ? '#0f172a' : 'white' } }}
      >
        <DialogTitle>
          <Box>
            <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
              {orderForm.orderType === OrderType.PURCHASE ? 'Purchase Inquiry' : 
               orderForm.orderType === OrderType.RENT ? 'Rental Application' : 'Property Inquiry'}
            </Typography>
            <Typography variant="body2" color="text.secondary" component="div">
              for {house.title}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
            <Step><StepLabel>Type</StepLabel></Step>
            <Step><StepLabel>Details</StepLabel></Step>
            <Step><StepLabel>Contact</StepLabel></Step>
          </Stepper>
          
          {activeStep === 0 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Inquiry Type</InputLabel>
                <Select
                  value={orderForm.orderType}
                  label="Inquiry Type"
                  onChange={(e) => setOrderForm(prev => ({ ...prev, orderType: e.target.value as OrderType }))}
                >
                  <MenuItem value={OrderType.INQUIRY}>General Inquiry</MenuItem>
                  <MenuItem value={OrderType.APPLICATION}>Application</MenuItem>
                  <MenuItem value={OrderType.PURCHASE}>Purchase Interest</MenuItem>
                  <MenuItem value={OrderType.RENT}>Rental Interest</MenuItem>
                </Select>
              </FormControl>
              
              <TextField
                fullWidth
                label="Quantity (Number of units/houses)"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                InputProps={{ inputProps: { min: 1 } }}
                helperText="How many units are you interested in?"
              />
              
              <TextField
                fullWidth
                label="Number of People"
                type="number"
                value={orderForm.details.numberOfPeople}
                onChange={(e) => setOrderForm(prev => ({ ...prev, details: { ...prev.details, numberOfPeople: parseInt(e.target.value) } }))}
              />
              
              <Box sx={{ p: 2, bgcolor: theme === 'dark' ? '#1e293b' : '#f8f9fa', borderRadius: 2 }}>
                <Typography variant="body2" sx={{ mb: 1 }}>Estimated Total:</Typography>
                <Typography variant="h6" sx={{ color: theme === 'dark' ? '#00ffff' : '#007bff' }}>
                  {formatPrice((orderForm.orderType === OrderType.PURCHASE ? house.pricing.price : 
                                orderForm.orderType === OrderType.RENT ? house.pricing.price / 12 : 0) * quantity)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {orderForm.orderType === OrderType.PURCHASE ? 'Purchase price' : 
                   orderForm.orderType === OrderType.RENT ? 'Monthly rent' : 'Estimated amount'} × {quantity} {quantity > 1 ? 'units' : 'unit'}
                </Typography>
              </Box>
            </Box>
          )}
          
          {activeStep === 1 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                fullWidth
                label="Preferred Visit Date"
                type="date"
                value={orderForm.details.visitDate}
                onChange={(e) => setOrderForm(prev => ({ ...prev, details: { ...prev.details, visitDate: e.target.value } }))}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                fullWidth
                label="Preferred Visit Time"
                type="time"
                value={orderForm.details.visitTime}
                onChange={(e) => setOrderForm(prev => ({ ...prev, details: { ...prev.details, visitTime: e.target.value } }))}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                fullWidth
                label="Special Requests"
                multiline
                rows={3}
                value={orderForm.details.specialRequests}
                onChange={(e) => setOrderForm(prev => ({ ...prev, details: { ...prev.details, specialRequests: e.target.value } }))}
                placeholder="Any specific requirements or questions..."
              />
            </Box>
          )}
          
          {activeStep === 2 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="body2" color="text.secondary">
                We'll contact you using the information from your profile. Make sure your contact details are up to date.
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                Preferred Contact Method:
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                {['EMAIL', 'PHONE', 'WHATSAPP'].map(method => (
                  <Chip
                    key={method}
                    label={method}
                    onClick={() => setOrderForm(prev => ({
                      ...prev,
                      details: {
                        ...prev.details,
                        preferredContactMethod: prev.details.preferredContactMethod.includes(method)
                          ? prev.details.preferredContactMethod.filter(m => m !== method)
                          : [...prev.details.preferredContactMethod, method]
                      }
                    }))}
                    color={orderForm.details.preferredContactMethod.includes(method) ? 'primary' : 'default'}
                  />
                ))}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenOrderDialog(false)}>Cancel</Button>
          {activeStep > 0 && (
            <Button onClick={() => setActiveStep(prev => prev - 1)}>Back</Button>
          )}
          {activeStep < 2 ? (
            <Button variant="contained" onClick={() => setActiveStep(prev => prev + 1)}>
              Next
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={handleOrderSubmit}
              disabled={orderLoading}
              startIcon={orderLoading ? <CircularProgress size={20} /> : <Send />}
              sx={{ background: theme === 'dark' ? 'linear-gradient(135deg, #00ff00, #00b300)' : 'linear-gradient(135deg, #28a745, #218838)' }}
            >
              Submit Application
            </Button>
          )}
        </DialogActions>
      </Dialog>
      
      <MessageModal
        open={messageModalOpen}
        onClose={() => setMessageModalOpen(false)}
        houseId={houseId}
        houseTitle={house?.title || ''}
      />
      
      <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError('')} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity="error" onClose={() => setError('')}>{error}</Alert>
      </Snackbar>
      <Snackbar open={!!success} autoHideDuration={6000} onClose={() => setSuccess('')} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity="success" onClose={() => setSuccess('')}>{success}</Alert>
      </Snackbar>
    </Box>
  );
};

export default PublicHouseDetailPage;