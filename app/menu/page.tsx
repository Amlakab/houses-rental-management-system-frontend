'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Box, Typography, Card, CardContent, Chip,
  IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, Button, Divider,
  Stack, CircularProgress, useMediaQuery,
  Snackbar, Alert, Tooltip,
  TextField, Select, MenuItem, FormControl, InputLabel,
  Slider
} from '@mui/material';
import { motion } from 'framer-motion';
import { useTheme } from '@/lib/theme-context';
import Navbar from '@/components/ui/Navbar';
import {
  Restaurant, Visibility, CalendarToday,
  Search, Close, ShoppingCart,
  AttachMoney, Category,
  RemoveRedEye, AccessTime,
  LocalShipping, CheckCircle,
  NavigateNext, NavigateBefore,
  Cancel
} from '@mui/icons-material';
import api from '@/app/utils/api';

// Define types for image data structure
type ImageDataStructure = {
  $binary?: {
    base64: string;
    subType: string;
  };
  type?: string;
  data?: number[];
};

interface Food {
  _id: string;
  name: string;
  description: string;
  image?: string;
  imageData?: {
    data: string | ImageDataStructure;
    contentType: string;
    fileName: string;
  };
  category: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'DRINK' | 'SNACK';
  price: number;
  view: number;
  quantity_available: boolean;
  status: 'AVAILABLE' | 'UNAVAILABLE';
  created_at: string;
  updated_at: string;
}

interface PaginationData {
  currentPage: number;
  totalPages: number;
  totalFoods: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface OrderFormData {
  quantity: number;
  specialInstructions: string;
  deliveryAddress: string;
  phoneNumber: string;
  email: string;
}

const categories = [
  { value: 'BREAKFAST', label: 'Breakfast' },
  { value: 'LUNCH', label: 'Lunch' },
  { value: 'DINNER', label: 'Dinner' },
  { value: 'DRINK', label: 'Drink' },
  { value: 'SNACK', label: 'Snack' }
];

const PublicFoodPage = () => {
  const { theme } = useTheme();
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  const [foods, setFoods] = useState<Food[]>([]);
  const [allFoods, setAllFoods] = useState<Food[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [pagination, setPagination] = useState<PaginationData>({
    currentPage: 1,
    totalPages: 1,
    totalFoods: 0,
    hasNext: false,
    hasPrev: false
  });
  
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    minPrice: 0,
    maxPrice: 1000,
    sortBy: 'created_at',
    sortOrder: 'desc',
    page: 1,
    limit: 12
  });
  
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [openOrderDialog, setOpenOrderDialog] = useState(false);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  
  const [orderForm, setOrderForm] = useState<OrderFormData>({
    quantity: 1,
    specialInstructions: '',
    deliveryAddress: '',
    phoneNumber: '',
    email: ''
  });

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Fixed getImageUrl function - handles all image formats
  const getImageUrl = (food: Food): string | null => {
    try {
      // Debug: Log what we're receiving
      console.log('Food image data:', {
        hasImageData: !!food.imageData,
        imageData: food.imageData,
        hasImage: !!food.image
      });

      // Check if imageData exists and has the expected structure
      if (food.imageData && food.imageData.data) {
        let base64String: string;
        
        // Extract base64 string based on the structure
        if (typeof food.imageData.data === 'string') {
          // Already a string
          base64String = food.imageData.data;
        } else if (food.imageData.data.$binary && food.imageData.data.$binary.base64) {
          // MongoDB BSON format
          base64String = food.imageData.data.$binary.base64;
        } else if (food.imageData.data.data && Array.isArray(food.imageData.data.data)) {
          // Buffer format - needs Buffer polyfill for browser
          try {
            if (typeof Buffer !== 'undefined') {
              base64String = Buffer.from(food.imageData.data.data).toString('base64');
            } else {
              // Fallback for browser without Buffer
              const bytes = new Uint8Array(food.imageData.data.data);
              let binary = '';
              bytes.forEach((byte) => binary += String.fromCharCode(byte));
              base64String = btoa(binary);
            }
          } catch (bufferError) {
            console.error('Buffer conversion error:', bufferError);
            return null;
          }
        } else {
          console.error('Unknown image data structure:', food.imageData.data);
          return null;
        }
        
        // Clean and construct the data URL
        const cleanBase64 = base64String.replace(/\s/g, '');
        const contentType = food.imageData.contentType || 'image/jpeg';
        return `data:${contentType};base64,${cleanBase64}`;
      }
      
      // Fallback to image field if it's a data URL
      if (food.image && food.image.startsWith('data:image')) {
        return food.image;
      }
      
      // Fallback to image path if it exists
      if (food.image) {
        if (food.image.startsWith('http')) return food.image;
        
        if (food.image.startsWith('/uploads')) {
          const serverUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
          return `${serverUrl}${food.image}`;
        }
        
        const serverUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        return `${serverUrl}/uploads/foods/${food.image}`;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting image URL:', error);
      return null;
    }
  };

  const fetchAvailableFoods = async (forList: boolean = false) => {
    try {
      if (!forList) setLoading(true);
      const params = new URLSearchParams();
      
      if (forList) {
        params.append('limit', '50');
        params.append('page', '1');
      } else {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== '' && value !== null && value !== undefined) {
            params.append(key, value.toString());
          }
        });
      }

      const response = await api.get(`/foods/public/available?${params}`);
      console.log('API Response:', response.data);
      
      if (forList) {
        setAllFoods(response.data.data.foods || []);
      } else {
        setFoods(response.data.data.foods || []);
        setPagination(response.data.data.pagination || {
          currentPage: 1,
          totalPages: 1,
          totalFoods: 0,
          hasNext: false,
          hasPrev: false
        });
      }
      setError('');
    } catch (error: any) {
      console.error('Error fetching foods:', error);
      setError(error.response?.data?.message || 'Failed to fetch foods');
      if (forList) {
        setAllFoods([]);
      } else {
        setFoods([]);
      }
    } finally {
      if (!forList) setLoading(false);
    }
  };

  const fetchAvailableCategories = async () => {
    try {
      const response = await api.get('/foods/public/filter-options');
      setAvailableCategories(response.data.data.categories || []);
    } catch (error: any) {
      console.error('Failed to fetch categories:', error);
    }
  };

  useEffect(() => {
    fetchAvailableFoods();
    fetchAvailableFoods(true);
    fetchAvailableCategories();
  }, []);

  useEffect(() => {
    if (Object.keys(filters).length > 0) {
      fetchAvailableFoods();
    }
  }, [filters.page, filters.category, filters.search, filters.sortBy]);

  const handleOpenViewDialog = async (food: Food) => {
    try {
      await api.get(`/foods/${food._id}/view`);
      setSelectedFood(food);
      setOpenViewDialog(true);
      fetchAvailableFoods();
      fetchAvailableFoods(true);
    } catch (error: any) {
      console.error('Failed to increment view count:', error);
    }
  };

  const handleOpenOrderDialog = async (food: Food) => {
    try {
      await api.get(`/foods/${food._id}/view`);
      setSelectedFood(food);
      setOrderForm({
        quantity: 1,
        specialInstructions: '',
        deliveryAddress: '',
        phoneNumber: '',
        email: ''
      });
      setOpenOrderDialog(true);
      fetchAvailableFoods();
      fetchAvailableFoods(true);
    } catch (error: any) {
      console.error('Failed to increment view count:', error);
    }
  };

  const handleCloseViewDialog = () => {
    setOpenViewDialog(false);
    setSelectedFood(null);
  };

  const handleCloseOrderDialog = () => {
    setOpenOrderDialog(false);
    setSelectedFood(null);
  };

  const handleFilterChange = (field: string, value: string | number) => {
    setFilters(prev => ({
      ...prev,
      [field]: value,
      page: 1
    }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({
      ...prev,
      page: newPage
    }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOrderSubmit = async () => {
    if (!selectedFood) return;

    try {
      const orderData = {
        foodId: selectedFood._id,
        foodName: selectedFood.name,
        price: selectedFood.price,
        total: selectedFood.price * orderForm.quantity,
        ...orderForm
      };

      console.log('Order submitted:', orderData);
      
      setSuccess(`Order placed successfully for ${selectedFood.name}! We'll contact you shortly.`);
      setOpenOrderDialog(false);
      setSelectedFood(null);
    } catch (error: any) {
      setError('Failed to place order. Please try again.');
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'Invalid date';
    }
  };

const formatPrice = (price: number): string => {
  return `ETB ${price.toLocaleString('am-ET')}`;
};



  const getCategoryLabel = (category: string) => {
    const cat = categories.find(c => c.value === category);
    return cat ? cat.label : category;
  };

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

  const handleFoodNameClick = (food: Food) => {
    const element = document.getElementById(`food-${food._id}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.classList.add('highlight-pulse');
      setTimeout(() => {
        element.classList.remove('highlight-pulse');
      }, 2000);
    }
  };

  // Create a simple gray placeholder image for fallback
  const getPlaceholderImage = (width: number = 400, height: number = 250) => {
    const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="${theme === 'dark' ? '#334155' : '#e5e7eb'}"/>
      <text x="50%" y="50%" text-anchor="middle" dy=".3em" font-family="Arial" font-size="20" 
            fill="${theme === 'dark' ? '#a8b2d1' : '#666666'}">No Image</text>
    </svg>`;
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  };

  const themeStyles = {
    background: theme === 'dark' 
      ? 'linear-gradient(135deg, #0a192f, #112240)' 
      : 'linear-gradient(135deg, #f0f0f0, #ffffff)',
    textColor: theme === 'dark' ? '#ccd6f6' : '#333333',
    primaryColor: theme === 'dark' ? '#00ffff' : '#007bff',
    borderColor: theme === 'dark' ? '#00ffff' : '#007bff',
    surface: theme === 'dark' ? '#1e293b' : '#ffffff',
    cardBg: theme === 'dark' ? '#0f172a80' : 'white',
    cardBorder: theme === 'dark' ? '#334155' : '#e5e7eb',
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      theme === 'dark' 
        ? 'bg-gradient-to-br from-[#0a192f] to-[#112240] text-white' 
        : 'bg-gradient-to-br from-[#f0f0f0] to-[#ffffff] text-[#333333]'
    }`}>
      <Navbar />
      
      <div className="pt-16">
        {/* Hero Section */}
        <section className={`py-8 px-4 ${
          theme === 'dark' ? 'bg-transparent' : 'bg-transparent'
        }`}>
          <div className="container mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <motion.div
                initial={{ x: -100, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                transition={{ duration: 1 }}
                viewport={{ once: true }}
              >
                <h1 className={`text-3xl md:text-4xl font-bold mb-4 ${
                  theme === 'dark' ? 'text-[#00ffff]' : 'text-[#007bff]'
                }`}>
                  Delicious Food & Beverages
                </h1>

                <p className={`text-base ${
                  theme === 'dark' ? 'text-gray-300' : 'text-[#666666]'
                } mb-4`}>
                  Explore our wide selection of freshly prepared meals, snacks, and beverages.
                  From breakfast to dinner, we have something for every taste and occasion.
                  All our food items are prepared with the finest ingredients and served with care.
                </p>

              </motion.div>

              <motion.div
                initial={{ x: 100, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                transition={{ duration: 1 }}
                viewport={{ once: true }}
              >
                <div className={`p-6 rounded-xl ${
                  theme === 'dark' ? 'bg-[#1e293b]' : 'bg-white'
                } shadow-lg`}>
                  <h2 className={`text-2xl font-bold mb-4 ${
                    theme === 'dark' ? 'text-[#00ffff]' : 'text-[#007bff]'
                  }`}>
                    Fresh & Delicious
                  </h2>

                  <p className={`text-base ${
                    theme === 'dark' ? 'text-gray-300' : 'text-[#666666]'
                  } mb-4`}>
                    We prepare all our food fresh daily using quality ingredients.
                    Whether you're looking for a quick snack or a full meal,
                    we have options to satisfy your cravings.
                  </p>

                  <div className="flex flex-wrap gap-2">
                    <Chip label="Fresh Ingredients" size="small" />
                    <Chip label="Daily Preparation" size="small" />
                    <Chip label="Quality Assured" size="small" />
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Search and Filter Section */}
        <section className={`py-6 px-4 ${
          theme === 'dark' ? 'bg-transparent' : 'bg-transparent'
        }`}>
          <div className="container mx-auto">
            <div className={`flex ${isMobile ? 'flex-col' : 'flex-row'} gap-4 items-center justify-between`}>
              <div className={`relative ${isMobile ? 'w-full' : 'w-96'}`}>
                <input
                  type="text"
                  placeholder="Search foods..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className={`w-full px-4 py-2 pl-10 rounded-lg border ${
                    theme === 'dark' 
                      ? 'bg-[#1e293b] border-[#334155] text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  } focus:outline-none focus:ring-2 ${
                    theme === 'dark' ? 'focus:ring-[#00ffff]' : 'focus:ring-[#007bff]'
                  } focus:border-transparent`}
                />
                <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                }`} />
              </div>
              
              <div className={`flex ${isMobile ? 'flex-col gap-2' : 'flex-row gap-4'} w-full ${isMobile ? '' : 'max-w-md'}`}>
                <select
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className={`px-4 py-2 rounded-lg border ${
                    theme === 'dark' 
                      ? 'bg-[#1e293b] border-[#334155] text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:outline-none focus:ring-2 ${
                    theme === 'dark' ? 'focus:ring-[#00ffff]' : 'focus:ring-[#007bff]'
                  } focus:border-transparent ${isMobile ? 'w-full' : 'flex-1'}`}
                >
                  <option value="">All Categories</option>
                  {availableCategories.map((category) => {
                    const cat = categories.find(c => c.value === category);
                    return (
                      <option key={category} value={category}>
                        {cat ? cat.label : category}
                      </option>
                    );
                  })}
                </select>

                <select
                  value={filters.sortBy}
                  onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                  className={`px-4 py-2 rounded-lg border ${
                    theme === 'dark' 
                      ? 'bg-[#1e293b] border-[#334155] text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:outline-none focus:ring-2 ${
                    theme === 'dark' ? 'focus:ring-[#00ffff]' : 'focus:ring-[#007bff]'
                  } focus:border-transparent ${isMobile ? 'w-full' : 'flex-1'}`}
                >
                  <option value="created_at">Newest First</option>
                  <option value="price">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="name">Name A-Z</option>
                  <option value="view">Most Popular</option>
                </select>
              </div>
            </div>

            {/* Price Range Filter */}
            <div className="mt-4">
              <div className="flex items-center gap-4">
                <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                  Price Range:
                </span>
                <div className="flex-1">
                  <Slider
                    value={[filters.minPrice, filters.maxPrice]}
                    onChange={(_, newValue) => {
                      if (Array.isArray(newValue)) {
                        handleFilterChange('minPrice', newValue[0]);
                        handleFilterChange('maxPrice', newValue[1]);
                      }
                    }}
                    min={0}
                    max={1000}
                    valueLabelDisplay="auto"
                    valueLabelFormat={(value) => formatPrice(value)}
                    sx={{
                      color: theme === 'dark' ? '#00ffff' : '#007bff',
                      '& .MuiSlider-thumb': {
                        backgroundColor: theme === 'dark' ? '#00ffff' : '#007bff',
                      },
                      '& .MuiSlider-track': {
                        backgroundColor: theme === 'dark' ? '#00ffff' : '#007bff',
                      }
                    }}
                  />
                </div>
                <div className="flex gap-2">
                  <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                    {formatPrice(filters.minPrice)} - {formatPrice(filters.maxPrice)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Foods Grid Section */}
        <section className={`py-8 px-4 ${
          theme === 'dark' ? 'bg-transparent' : 'bg-transparent'
        }`}>
          <div className="container mx-auto">
            {loading ? (
              <div className="flex justify-center items-center py-16">
                <CircularProgress sx={{ color: theme === 'dark' ? '#00ffff' : '#007bff' }} />
              </div>
            ) : foods.length === 0 ? (
              <div className="text-center py-16">
                <Restaurant sx={{ 
                  fontSize: 64, 
                  color: theme === 'dark' ? '#334155' : '#cbd5e1',
                  mb: 2
                }} />
                <Typography variant="h6" color={theme === 'dark' ? '#a8b2d1' : '#666666'} sx={{ mb: 1 }}>
                  No foods available
                </Typography>
                <Typography variant="body2" color={theme === 'dark' ? '#94a3b8' : '#999999'}>
                  Check back later for new menu items
                </Typography>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {foods.map((food, index) => {
                    const imageUrl = getImageUrl(food);
                    console.log(`Food ${food.name} imageUrl:`, imageUrl);
                    
                    return (
                      <motion.div
                        key={food._id}
                        id={`food-${food._id}`}
                        initial={{ y: 50, opacity: 0 }}
                        whileInView={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                        viewport={{ once: true }}
                        whileHover={{ y: -5 }}
                        className="group"
                      >
                        <Card sx={{ 
                          height: '100%',
                          borderRadius: 2,
                          boxShadow: theme === 'dark' 
                            ? '0 2px 8px rgba(0,0,0,0.3)' 
                            : '0 2px 8px rgba(0,0,0,0.1)',
                          border: theme === 'dark' 
                            ? '1px solid #334155' 
                            : '1px solid #e5e7eb',
                          backgroundColor: theme === 'dark' ? '#0f172a80' : 'white',
                          backdropFilter: theme === 'dark' ? 'blur(10px)' : 'none',
                          display: 'flex',
                          flexDirection: 'column',
                          transition: 'transform 0.2s, box-shadow 0.2s',
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: theme === 'dark' 
                              ? '0 8px 24px rgba(0, 255, 255, 0.2)' 
                              : '0 8px 24px rgba(37, 99, 235, 0.2)'
                          }
                        }}>
                          {/* Food Image */}
                          <Box sx={{ 
                            position: 'relative',
                            height: 180,
                            overflow: 'hidden',
                            borderTopLeftRadius: 8,
                            borderTopRightRadius: 8
                          }}>
                            {imageUrl ? (
                              <img
                                src={imageUrl}
                                alt={food.name}
                                style={{ 
                                  width: '100%', 
                                  height: '100%', 
                                  objectFit: 'cover',
                                  transition: 'transform 0.3s'
                                }}
                                className="group-hover:scale-105"
                                onError={(e) => {
                                  console.error('Image failed to load:', e);
                                  const target = e.target as HTMLImageElement;
                                  target.onerror = null;
                                  target.src = getPlaceholderImage(400, 250);
                                }}
                              />
                            ) : (
                              <Box sx={{ 
                                width: '100%', 
                                height: '100%', 
                                backgroundColor: theme === 'dark' ? '#334155' : '#e5e7eb',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}>
                                <Restaurant sx={{ 
                                  fontSize: 48, 
                                  color: theme === 'dark' ? '#a8b2d1' : '#94a3b8' 
                                }} />
                              </Box>
                            )}
                            
                            {/* Category Badge */}
                            <Chip
                              label={getCategoryLabel(food.category)}
                              size="small"
                              sx={{ 
                                position: 'absolute',
                                top: 8,
                                right: 8,
                                height: 24,
                                fontSize: '0.7rem',
                                backgroundColor: theme === 'dark' ? '#334155' : '#e5e7eb',
                                color: theme === 'dark' ? '#a8b2d1' : '#666666'
                              }}
                            />
                            
                            {/* Stock Status Badge */}
                            <Chip
                              label={food.quantity_available ? 'In Stock' : 'Out of Stock'}
                              size="small"
                              sx={{ 
                                position: 'absolute',
                                top: 8,
                                left: 8,
                                height: 24,
                                fontSize: '0.7rem',
                                backgroundColor: food.quantity_available 
                                  ? (theme === 'dark' ? '#00ff0020' : '#28a74520')
                                  : (theme === 'dark' ? '#ff000020' : '#dc354520'),
                                color: food.quantity_available 
                                  ? (theme === 'dark' ? '#00ff00' : '#28a745')
                                  : (theme === 'dark' ? '#ff0000' : '#dc3545')
                              }}
                            />
                          </Box>
                          
                          <CardContent sx={{ p: 3, flexGrow: 1 }}>
                            {/* Title */}
                            <Typography 
                              variant="h6" 
                              sx={{ 
                                fontWeight: 'bold',
                                color: theme === 'dark' ? '#ccd6f6' : '#333333',
                                mb: 1,
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                lineHeight: 1.3,
                                fontSize: '1.1rem'
                              }}
                            >
                              {food.name}
                            </Typography>
                            
                            {/* Description */}
                            <Typography 
                              variant="body2" 
                              color={theme === 'dark' ? '#a8b2d1' : '#666666'}
                              sx={{ 
                                mb: 2,
                                display: '-webkit-box',
                                WebkitLineClamp: 3,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                fontSize: '0.9rem'
                              }}
                            >
                              {food.description}
                            </Typography>
                            
                            {/* Price and Stats */}
                            <Box sx={{ 
                              display: 'flex', 
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              mt: 'auto',
                              pt: 2,
                              borderTop: theme === 'dark' ? '1px solid #334155' : '1px solid #e5e7eb'
                            }}>
                              <Typography variant="h6" sx={{ 
                                fontWeight: 'bold',
                                color: theme === 'dark' ? '#00ffff' : '#007bff'
                              }}>
                                {formatPrice(food.price)}
                              </Typography>
                              
                              <Box sx={{ display: 'flex', gap: 1.5 }}>
                                <Tooltip title="Views">
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <RemoveRedEye fontSize="small" sx={{ fontSize: '0.9rem', color: theme === 'dark' ? '#a8b2d1' : '#666666' }} />
                                    <Typography variant="caption" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                                      {food.view}
                                    </Typography>
                                  </Box>
                                </Tooltip>
                              </Box>
                            </Box>
                          </CardContent>
                          
                          {/* Action Buttons */}
                          <Box sx={{ 
                            p: 2, 
                            pt: 0,
                            display: 'flex', 
                            gap: 2,
                            borderTop: theme === 'dark' ? '1px solid #334155' : '1px solid #e5e7eb'
                          }}>
                            <Button
                              size="small"
                              fullWidth
                              variant="outlined"
                              startIcon={<Visibility fontSize="small" />}
                              onClick={() => handleOpenViewDialog(food)}
                              disabled={!food.quantity_available}
                              sx={{
                                borderRadius: 1,
                                borderColor: theme === 'dark' ? '#00ffff' : '#007bff',
                                color: theme === 'dark' ? '#00ffff' : '#007bff',
                                fontSize: '0.75rem',
                                py: 0.5,
                                '&:hover': {
                                  backgroundColor: theme === 'dark' ? '#00ffff20' : '#007bff10'
                                },
                                '&.Mui-disabled': {
                                  borderColor: theme === 'dark' ? '#334155' : '#e5e7eb',
                                  color: theme === 'dark' ? '#94a3b8' : '#94a3b8'
                                }
                              }}
                            >
                              View Details
                            </Button>
                            
                            <Button
                              size="small"
                              fullWidth
                              variant="contained"
                              startIcon={<ShoppingCart fontSize="small" />}
                              onClick={() => handleOpenOrderDialog(food)}
                              disabled={!food.quantity_available}
                              sx={{
                                borderRadius: 1,
                                background: theme === 'dark'
                                  ? 'linear-gradient(135deg, #00ff00, #00b300)'
                                  : 'linear-gradient(135deg, #28a745, #218838)',
                                fontSize: '0.75rem',
                                py: 0.5,
                                '&:hover': {
                                  background: theme === 'dark'
                                    ? 'linear-gradient(135deg, #00b300, #008000)'
                                    : 'linear-gradient(135deg, #218838, #1e7e34)'
                                },
                                '&.Mui-disabled': {
                                  background: theme === 'dark' ? '#334155' : '#e5e7eb',
                                  color: theme === 'dark' ? '#94a3b8' : '#94a3b8'
                                }
                              }}
                            >
                              Order Now
                            </Button>
                          </Box>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>

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
                        },
                        '&.Mui-disabled': {
                          borderColor: theme === 'dark' ? '#334155' : '#e5e7eb',
                          color: theme === 'dark' ? '#94a3b8' : '#94a3b8'
                        }
                      }}
                    >
                      Previous
                    </Button>
                    
                    <Typography variant="body2" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
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
                        },
                        '&.Mui-disabled': {
                          borderColor: theme === 'dark' ? '#334155' : '#e5e7eb',
                          color: theme === 'dark' ? '#94a3b8' : '#94a3b8'
                        }
                      }}
                    >
                      Next
                    </Button>
                  </Box>
                )}
              </>
            )}
          </div>
        </section>

        {/* Horizontal Food Name List Section */}
        {allFoods.length > 0 && (
          <section className={`py-8 px-4 ${
            theme === 'dark' ? 'bg-[#0f172a80]' : 'bg-gray-50'
          }`}>
            <div className="container mx-auto">
              <motion.div
                initial={{ y: 50, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                transition={{ duration: 1 }}
                viewport={{ once: true }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className={`text-2xl font-bold ${
                    theme === 'dark' ? 'text-[#00ffff]' : 'text-[#007bff]'
                  }`}>
                    All Available Foods
                  </h2>
                  
                  <div className="flex gap-2">
                    <IconButton
                      onClick={() => scrollHorizontalList('left')}
                      sx={{
                        color: theme === 'dark' ? '#00ffff' : '#007bff',
                        border: theme === 'dark' ? '1px solid #334155' : '1px solid #e5e7eb',
                        '&:hover': {
                          backgroundColor: theme === 'dark' ? '#00ffff20' : '#007bff10'
                        }
                      }}
                    >
                      <NavigateBefore />
                    </IconButton>
                    <IconButton
                      onClick={() => scrollHorizontalList('right')}
                      sx={{
                        color: theme === 'dark' ? '#00ffff' : '#007bff',
                        border: theme === 'dark' ? '1px solid #334155' : '1px solid #e5e7eb',
                        '&:hover': {
                          backgroundColor: theme === 'dark' ? '#00ffff20' : '#007bff10'
                        }
                      }}
                    >
                      <NavigateNext />
                    </IconButton>
                  </div>
                </div>

                <div className="relative">
                  <div
                    ref={scrollContainerRef}
                    className="flex overflow-x-auto gap-4 py-4 scroll-smooth hide-scrollbar"
                  >
                    {allFoods.map((food) => (
                      <motion.div
                        key={food._id}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <button
                          onClick={() => handleFoodNameClick(food)}
                          className={`flex-shrink-0 px-6 py-3 rounded-lg transition-all duration-300 ${
                            theme === 'dark' 
                              ? 'bg-[#1e293b] hover:bg-[#334155] text-white' 
                              : 'bg-white hover:bg-gray-100 text-gray-800'
                          } shadow-md border ${
                            theme === 'dark' 
                              ? 'border-[#334155] hover:border-[#00ffff]' 
                              : 'border-gray-200 hover:border-[#007bff]'
                          }`}
                          style={{
                            minWidth: 'fit-content',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <Restaurant sx={{ 
                              fontSize: 20,
                              color: theme === 'dark' ? '#00ffff' : '#007bff' 
                            }} />
                            <span className="font-medium text-sm md:text-base">
                              {food.name}
                            </span>
                            <Chip
                              label={formatPrice(food.price)}
                              size="small"
                              sx={{
                                height: 20,
                                fontSize: '0.7rem',
                                backgroundColor: theme === 'dark' ? '#334155' : '#e5e7eb',
                                color: theme === 'dark' ? '#a8b2d1' : '#666666'
                              }}
                            />
                          </div>
                        </button>
                      </motion.div>
                    ))}
                  </div>

                  {/* Gradient fade effects on sides */}
                  <div className={`absolute left-0 top-0 bottom-0 w-8 pointer-events-none ${
                    theme === 'dark'
                      ? 'bg-gradient-to-r from-[#0f172a80] to-transparent'
                      : 'bg-gradient-to-r from-gray-50 to-transparent'
                  }`} />
                  <div className={`absolute right-0 top-0 bottom-0 w-8 pointer-events-none ${
                    theme === 'dark'
                      ? 'bg-gradient-to-l from-[#0f172a80] to-transparent'
                      : 'bg-gradient-to-l from-gray-50 to-transparent'
                  }`} />
                </div>

                <div className="flex items-center justify-center mt-4">
                  <Typography variant="caption" color={theme === 'dark' ? '#94a3b8' : '#999999'}>
                    Scroll or use arrows to see more foods • Click on any food to jump to it in the grid
                  </Typography>
                </div>
              </motion.div>
            </div>
          </section>
        )}

        {/* Categories Section */}
        <section className={`py-12 px-4 ${
          theme === 'dark' ? 'bg-[#0f172a80]' : 'bg-gray-50'
        }`}>
          <div className="container mx-auto">
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ duration: 1 }}
              viewport={{ once: true }}
            >
              <h2 className={`text-3xl font-bold mb-8 ${
                theme === 'dark' ? 'text-[#00ffff]' : 'text-[#007bff]'
              } text-center`}>
                Food Categories
              </h2>

              <div className={`grid grid-cols-2 md:grid-cols-5 gap-4 ${
                theme === 'dark' ? 'text-gray-300' : 'text-[#666666]'
              }`}>
                {categories.map((category, index) => (
                  <div 
                    key={category.value}
                    className={`p-4 rounded-lg text-center cursor-pointer transition-all ${
                      theme === 'dark' ? 'bg-[#1e293b] hover:bg-[#334155]' : 'bg-white hover:bg-gray-100'
                    } shadow`}
                    onClick={() => handleFilterChange('category', category.value)}
                  >
                    <div className="flex flex-col items-center">
                      <Restaurant className="mb-2" sx={{ 
                        color: theme === 'dark' ? '#00ffff' : '#007bff',
                        fontSize: 32
                      }} />
                      <span className="font-medium">
                        {category.label}
                      </span>
                      <Typography variant="caption" color={theme === 'dark' ? '#94a3b8' : '#999999'}>
                        {allFoods.filter(f => f.category === category.value).length} items
                      </Typography>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>
      </div>

      {/* Food Detail Dialog */}
      <Dialog 
        open={openViewDialog} 
        onClose={handleCloseViewDialog}
        maxWidth="lg"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: { 
            borderRadius: 2,
            backgroundColor: theme === 'dark' ? '#0f172a' : 'white',
            color: theme === 'dark' ? '#ccd6f6' : '#333333',
            maxHeight: '90vh',
            overflow: 'hidden'
          }
        }}
      >
        {selectedFood && (
          <>
            <DialogTitle sx={{ 
              backgroundColor: theme === 'dark' ? '#0f172a' : 'white',
              borderBottom: theme === 'dark' ? '1px solid #334155' : '1px solid #e5e7eb',
              py: 3,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: theme === 'dark' ? '#ccd6f6' : '#333333' }}>
                {selectedFood.name}
              </Typography>
              <IconButton
                onClick={handleCloseViewDialog}
                sx={{ 
                  color: theme === 'dark' ? '#a8b2d1' : '#666666',
                  '&:hover': {
                    backgroundColor: theme === 'dark' ? '#1e293b' : '#f8fafc'
                  }
                }}
              >
                <Close />
              </IconButton>
            </DialogTitle>
            
            <DialogContent sx={{ p: 0, overflowY: 'auto' }}>
              {/* Food Image */}
              {getImageUrl(selectedFood) && (
                <Box sx={{ 
                  width: '100%',
                  minHeight: { xs: 200, md: 300 },
                  maxHeight: { xs: 300, md: 400 },
                  overflow: 'hidden',
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: theme === 'dark' ? '#0a192f' : '#f8f9fa',
                  p: { xs: 1, md: 2 }
                }}>
                  <img
                    src={getImageUrl(selectedFood) || ''}
                    alt={selectedFood.name}
                    style={{ 
                      maxWidth: '100%',
                      maxHeight: '100%',
                      objectFit: 'contain',
                      borderRadius: '8px',
                      boxShadow: theme === 'dark' 
                        ? '0 4px 12px rgba(0,0,0,0.3)' 
                        : '0 4px 12px rgba(0,0,0,0.1)'
                    }}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.onerror = null;
                      target.src = getPlaceholderImage(800, 400);
                    }}
                  />
                </Box>
              )}
              
              <Box sx={{ p: 3 }}>
                {/* Meta Information */}
                <Box sx={{ 
                  display: 'flex', 
                  flexWrap: 'wrap',
                  gap: 2,
                  mb: 3,
                  alignItems: 'center'
                }}>
                  <Chip
                    label={getCategoryLabel(selectedFood.category)}
                    sx={{ 
                      backgroundColor: theme === 'dark' ? '#334155' : '#e5e7eb'
                    }}
                  />
              
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <AttachMoney fontSize="small" sx={{ color: theme === 'dark' ? '#a8b2d1' : '#666666' }} />
                    <Typography variant="h5" sx={{ 
                      fontWeight: 'bold',
                      color: theme === 'dark' ? '#00ffff' : '#007bff'
                    }}>
                      {formatPrice(selectedFood.price)}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <RemoveRedEye fontSize="small" sx={{ color: theme === 'dark' ? '#a8b2d1' : '#666666' }} />
                    <Typography variant="body2" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                      {selectedFood.view} views
                    </Typography>
                  </Box>
                  
                  <Chip
                    label={selectedFood.quantity_available ? 'In Stock' : 'Out of Stock'}
                    size="small"
                    icon={selectedFood.quantity_available ? <CheckCircle fontSize="small" /> : <Cancel fontSize="small" />}
                    sx={{ 
                      backgroundColor: selectedFood.quantity_available 
                        ? (theme === 'dark' ? '#00ff0020' : '#28a74520')
                        : (theme === 'dark' ? '#ff000020' : '#dc354520'),
                      color: selectedFood.quantity_available 
                        ? (theme === 'dark' ? '#00ff00' : '#28a745')
                        : (theme === 'dark' ? '#ff0000' : '#dc3545')
                    }}
                  />
                </Box>
                
                {/* Description */}
                <Typography variant="body1" sx={{ 
                  color: theme === 'dark' ? '#a8b2d1' : '#666666',
                  mb: 3,
                  fontSize: '1.1rem',
                  lineHeight: 1.6
                }}>
                  {selectedFood.description}
                </Typography>
                
                <Divider sx={{ my: 3 }} />
                
                {/* Additional Information */}
                <Box sx={{ 
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: '1fr',
                    sm: '1fr 1fr'
                  },
                  gap: 3
                }}>
                  <Box>
                    <Typography variant="subtitle2" sx={{ 
                      mb: 1,
                      color: theme === 'dark' ? '#00ffff' : '#007bff',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}>
                      <CalendarToday /> Created Date
                    </Typography>
                    <Typography variant="body2" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                      {formatDate(selectedFood.created_at)}
                    </Typography>
                  </Box>
                  
                  <Box>
                    <Typography variant="subtitle2" sx={{ 
                      mb: 1,
                      color: theme === 'dark' ? '#00ffff' : '#007bff',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}>
                      <AccessTime /> Last Updated
                    </Typography>
                    <Typography variant="body2" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                      {formatDate(selectedFood.updated_at)}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </DialogContent>
            
            <DialogActions sx={{ 
              p: 3,
              borderTop: theme === 'dark' ? '1px solid #334155' : '1px solid #e5e7eb',
              backgroundColor: theme === 'dark' ? '#0f172a' : 'white',
              justifyContent: 'space-between'
            }}>
              <Button 
                onClick={handleCloseViewDialog}
                sx={{
                  color: theme === 'dark' ? '#00ffff' : '#007bff',
                  '&:hover': {
                    backgroundColor: theme === 'dark' ? '#00ffff20' : '#007bff10'
                  }
                }}
              >
                Close
              </Button>
              
              <Button 
                onClick={() => {
                  handleCloseViewDialog();
                  handleOpenOrderDialog(selectedFood);
                }}
                variant="contained"
                disabled={!selectedFood.quantity_available}
                startIcon={<ShoppingCart />}
                sx={{
                  background: theme === 'dark'
                    ? 'linear-gradient(135deg, #00ff00, #00b300)'
                    : 'linear-gradient(135deg, #28a745, #218838)',
                  borderRadius: 1,
                  '&:hover': {
                    background: theme === 'dark'
                      ? 'linear-gradient(135deg, #00b300, #008000)'
                      : 'linear-gradient(135deg, #218838, #1e7e34)'
                  },
                  '&.Mui-disabled': {
                    background: theme === 'dark' ? '#334155' : '#e5e7eb',
                    color: theme === 'dark' ? '#94a3b8' : '#94a3b8'
                  }
                }}
              >
                Order Now
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Order Dialog */}
      <Dialog 
        open={openOrderDialog} 
        onClose={handleCloseOrderDialog}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: { 
            borderRadius: 2,
            backgroundColor: theme === 'dark' ? '#0f172a' : 'white',
            color: theme === 'dark' ? '#ccd6f6' : '#333333'
          }
        }}
      >
        {selectedFood && (
          <>
            <DialogTitle sx={{ 
              backgroundColor: theme === 'dark' ? '#0f172a' : 'white',
              borderBottom: theme === 'dark' ? '1px solid #334155' : '1px solid #e5e7eb',
              py: 3,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: theme === 'dark' ? '#ccd6f6' : '#333333' }}>
                  Order {selectedFood.name}
                </Typography>
                <Typography variant="body2" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                  {formatPrice(selectedFood.price)} each
                </Typography>
              </Box>
              <IconButton
                onClick={handleCloseOrderDialog}
                sx={{ 
                  color: theme === 'dark' ? '#a8b2d1' : '#666666',
                  '&:hover': {
                    backgroundColor: theme === 'dark' ? '#1e293b' : '#f8fafc'
                  }
                }}
              >
                <Close />
              </IconButton>
            </DialogTitle>
            
            <DialogContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {/* Order Summary */}
                <Box sx={{ 
                  p: 2,
                  borderRadius: 1,
                  backgroundColor: theme === 'dark' ? '#1e293b' : '#f8f9fa',
                  border: theme === 'dark' ? '1px solid #334155' : '1px solid #e5e7eb'
                }}>
                  <Typography variant="subtitle2" sx={{ mb: 1, color: theme === 'dark' ? '#00ffff' : '#007bff' }}>
                    Order Summary
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                      {selectedFood.name} x {orderForm.quantity}
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: theme === 'dark' ? '#ccd6f6' : '#333333' }}>
                      {formatPrice(selectedFood.price * orderForm.quantity)}
                    </Typography>
                  </Box>
                </Box>

                {/* Quantity */}
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1, color: theme === 'dark' ? '#ccd6f6' : '#333333' }}>
                    Quantity
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <IconButton
                      size="small"
                      onClick={() => setOrderForm(prev => ({ ...prev, quantity: Math.max(1, prev.quantity - 1) }))}
                      sx={{ 
                        border: theme === 'dark' ? '1px solid #334155' : '1px solid #e5e7eb',
                        color: theme === 'dark' ? '#a8b2d1' : '#666666'
                      }}
                    >
                      -
                    </IconButton>
                    <Typography variant="h6" sx={{ minWidth: '40px', textAlign: 'center' }}>
                      {orderForm.quantity}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() => setOrderForm(prev => ({ ...prev, quantity: prev.quantity + 1 }))}
                      sx={{ 
                        border: theme === 'dark' ? '1px solid #334155' : '1px solid #e5e7eb',
                        color: theme === 'dark' ? '#a8b2d1' : '#666666'
                      }}
                    >
                      +
                    </IconButton>
                  </Box>
                </Box>

                {/* Special Instructions */}
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1, color: theme === 'dark' ? '#ccd6f6' : '#333333' }}>
                    Special Instructions (Optional)
                  </Typography>
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    value={orderForm.specialInstructions}
                    onChange={(e) => setOrderForm(prev => ({ ...prev, specialInstructions: e.target.value }))}
                    placeholder="Any special requests or dietary requirements..."
                    sx={{
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
                      }
                    }}
                  />
                </Box>

                {/* Contact Information */}
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 2, color: theme === 'dark' ? '#ccd6f6' : '#333333' }}>
                    Contact Information
                  </Typography>
                  
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField
                      fullWidth
                      label="Email Address"
                      type="email"
                      value={orderForm.email}
                      onChange={(e) => setOrderForm(prev => ({ ...prev, email: e.target.value }))}
                      required
                      sx={{
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
                        }
                      }}
                    />
                    
                    <TextField
                      fullWidth
                      label="Phone Number"
                      type="tel"
                      value={orderForm.phoneNumber}
                      onChange={(e) => setOrderForm(prev => ({ ...prev, phoneNumber: e.target.value }))}
                      required
                      sx={{
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
                        }
                      }}
                    />
                    
                    <TextField
                      fullWidth
                      label="Delivery Address"
                      multiline
                      rows={2}
                      value={orderForm.deliveryAddress}
                      onChange={(e) => setOrderForm(prev => ({ ...prev, deliveryAddress: e.target.value }))}
                      required
                      sx={{
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
                        }
                      }}
                    />
                  </Box>
                </Box>
              </Box>
            </DialogContent>
            
            <DialogActions sx={{ 
              p: 3,
              borderTop: theme === 'dark' ? '1px solid #334155' : '1px solid #e5e7eb',
              backgroundColor: theme === 'dark' ? '#0f172a' : 'white',
              justifyContent: 'space-between'
            }}>
              <Button 
                onClick={handleCloseOrderDialog}
                sx={{
                  color: theme === 'dark' ? '#00ffff' : '#007bff',
                  '&:hover': {
                    backgroundColor: theme === 'dark' ? '#00ffff20' : '#007bff10'
                  }
                }}
              >
                Cancel
              </Button>
              
              <Button 
                onClick={handleOrderSubmit}
                variant="contained"
                disabled={!orderForm.email || !orderForm.phoneNumber || !orderForm.deliveryAddress}
                startIcon={<LocalShipping />}
                sx={{
                  background: theme === 'dark'
                    ? 'linear-gradient(135deg, #00ff00, #00b300)'
                    : 'linear-gradient(135deg, #28a745, #218838)',
                  borderRadius: 1,
                  '&:hover': {
                    background: theme === 'dark'
                      ? 'linear-gradient(135deg, #00b300, #008000)'
                      : 'linear-gradient(135deg, #218838, #1e7e34)'
                  },
                  '&.Mui-disabled': {
                    background: theme === 'dark' ? '#334155' : '#e5e7eb',
                    color: theme === 'dark' ? '#94a3b8' : '#94a3b8'
                  }
                }}
              >
                Place Order ({formatPrice(selectedFood.price * orderForm.quantity)})
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Add CSS for highlight effect */}
      <style jsx global>{`
        @keyframes highlightPulse {
          0% {
            box-shadow: 0 0 0 0 rgba(0, 255, 255, 0.7);
          }
          70% {
            box-shadow: 0 0 0 20px rgba(0, 255, 255, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(0, 255, 255, 0);
          }
        }
        
        .highlight-pulse {
          animation: highlightPulse 2s;
        }
        
        @media (prefers-color-scheme: light) {
          .highlight-pulse {
            animation: highlightPulse 2s;
            box-shadow: 0 0 0 0 rgba(0, 123, 255, 0.7);
          }
          
          @keyframes highlightPulse {
            0% {
              box-shadow: 0 0 0 0 rgba(0, 123, 255, 0.7);
            }
            70% {
              box-shadow: 0 0 0 20px rgba(0, 123, 255, 0);
            }
            100% {
              box-shadow: 0 0 0 0 rgba(0, 123, 255, 0);
            }
          }
        }
        
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>

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
    </div>
  );
};

export default PublicFoodPage;