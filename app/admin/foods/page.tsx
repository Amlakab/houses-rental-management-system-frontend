'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Card, CardContent,
  TextField, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow,
  Chip, Alert, Snackbar, CircularProgress,
  useMediaQuery, Pagination,
  MenuItem, Select, FormControl, InputLabel,
  IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, Button, Avatar,
  FormControlLabel, Divider,
  Stack, ToggleButton, ToggleButtonGroup,
  Tooltip, Switch
} from '@mui/material';
import { motion } from 'framer-motion';
import { useTheme } from '@/lib/theme-context';
import {
  Restaurant, Edit, Delete, Visibility,
  LocalOffer, Category,
  TrendingUp, Fastfood,
  Search, Refresh,
  Image as ImageIcon,
  Description,
  RemoveRedEye,
  AttachMoney,
  CheckCircle,
  Cancel,
  HourglassEmpty,
  Add,
  Save,
  Close,
  Inventory,
  CloudUpload
} from '@mui/icons-material';
import api from '@/app/utils/api';
import { format } from 'date-fns';

interface Food {
  _id: string;
  name: string;
  description: string;
  image?: string;
  imageData?: {
    data: {
      $binary?: {
        base64: string;
        subType: string;
      };
      type?: string;
      data?: number[];
    } | string; // Allow string or object with various structures
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

interface FoodStats {
  totalFoods: number;
  availableFoods: number;
  unavailableFoods: number;
  outOfStockFoods: number;
  totalViews: number;
  categoryStats: { _id: string; count: number; avgPrice: number }[];
  statusStats: { _id: string; count: number }[];
  topViewedFoods: { _id: string; name: string; view: number; price: number; category: string }[];
  priceStats: { minPrice: number; maxPrice: number; avgPrice: number };
}

interface PaginationData {
  currentPage: number;
  totalPages: number;
  totalFoods: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface FilterOptions {
  categories: string[];
  statuses: string[];
}

interface FoodFormData {
  name: string;
  description: string;
  category: string;
  price: number;
  quantity_available: boolean;
  status: string;
}

const categories = [
  { value: 'BREAKFAST', label: 'Breakfast' },
  { value: 'LUNCH', label: 'Lunch' },
  { value: 'DINNER', label: 'Dinner' },
  { value: 'DRINK', label: 'Drink' },
  { value: 'SNACK', label: 'Snack' }
];

const statusOptions = [
  { value: 'AVAILABLE', label: 'Available' },
  { value: 'UNAVAILABLE', label: 'Unavailable' }
];

const FormRow = ({ children, columns = 1, spacing = 2 }: { 
  children: React.ReactNode; 
  columns?: number;
  spacing?: number;
}) => {
  const { theme } = useTheme();
  const isMobile = useMediaQuery('(max-width: 768px)');
  
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

const FoodManagementPage = () => {
  const { theme } = useTheme();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const isTablet = useMediaQuery('(max-width: 1024px)');
  
  const [foods, setFoods] = useState<Food[]>([]);
  const [stats, setStats] = useState<FoodStats | null>(null);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    categories: [],
    statuses: []
  });
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
    status: '',
    quantityAvailable: '',
    minPrice: '',
    maxPrice: '',
    sortBy: 'created_at',
    sortOrder: 'desc',
    page: 1,
    limit: 10
  });

  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');

  const [formData, setFormData] = useState<FoodFormData>({
    name: '',
    description: '',
    category: '',
    price: 0,
    quantity_available: true,
    status: 'AVAILABLE'
  });

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
    tableHeader: theme === 'dark' 
      ? 'linear-gradient(135deg, #00ffff, #00b3b3)' 
      : 'linear-gradient(135deg, #007bff, #0056b3)',
    buttonBg: theme === 'dark' 
      ? 'border-[#00ffff] text-[#00ffff] hover:bg-[#00ffff] hover:text-white' 
      : 'border-[#007bff] text-[#007bff] hover:bg-[#007bff] hover:text-white'
  };

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

  const statCards = [
    {
      title: 'Total Foods',
      value: stats?.totalFoods || 0,
      icon: <Restaurant sx={{ fontSize: 28 }} />,
      color: theme === 'dark' ? '#00ffff' : '#007bff',
      description: 'All food items'
    },
    {
      title: 'Available',
      value: stats?.availableFoods || 0,
      icon: <CheckCircle sx={{ fontSize: 28 }} />,
      color: theme === 'dark' ? '#00ff00' : '#28a745',
      description: 'Ready to serve'
    },
    {
      title: 'Out of Stock',
      value: stats?.outOfStockFoods || 0,
      icon: <Inventory sx={{ fontSize: 28 }} />,
      color: theme === 'dark' ? '#ff9900' : '#ff9900',
      description: 'Need restocking'
    },
    {
      title: 'Total Views',
      value: stats?.totalViews || 0,
      icon: <RemoveRedEye sx={{ fontSize: 28 }} />,
      color: theme === 'dark' ? '#00ffff' : '#007bff',
      description: 'Total views count'
    }
  ];

  const fetchFoods = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== '') {
          params.append(key, value.toString());
        }
      });

      const response = await api.get(`/foods?${params}`);
      setFoods(response.data.data.foods || []);
      setPagination(response.data.data.pagination || {
        currentPage: 1,
        totalPages: 1,
        totalFoods: 0,
        hasNext: false,
        hasPrev: false
      });
      setError('');
    } catch (error: any) {
      console.error('Error fetching foods:', error);
      setError(error.response?.data?.message || 'Failed to fetch foods');
      setFoods([]);
      setPagination({
        currentPage: 1,
        totalPages: 1,
        totalFoods: 0,
        hasNext: false,
        hasPrev: false
      });
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await api.get('/foods/stats');
      setStats(response.data.data);
    } catch (error: any) {
      console.error('Failed to fetch stats:', error);
    }
  }, []);

  const fetchFilterOptions = useCallback(async () => {
    try {
      const response = await api.get('/foods/filter-options');
      setFilterOptions(response.data.data);
    } catch (error: any) {
      console.error('Failed to fetch filter options:', error);
    }
  }, []);

  useEffect(() => {
    fetchFoods();
  }, [fetchFoods]);

  useEffect(() => {
    fetchStats();
    fetchFilterOptions();
  }, [fetchStats, fetchFilterOptions]);

  const handleOpenCreateDialog = () => {
    resetForm();
    setOpenCreateDialog(true);
  };

  const handleOpenEditDialog = (food: Food) => {
    setSelectedFood(food);
    setFormData({
      name: food.name,
      description: food.description,
      category: food.category,
      price: food.price,
      quantity_available: food.quantity_available,
      status: food.status
    });
    setImagePreview(getImageUrl(food));
    setImageFile(null);
    setOpenEditDialog(true);
  };

  const handleOpenViewDialog = (food: Food) => {
    setSelectedFood(food);
    setOpenViewDialog(true);
  };

  const handleOpenDeleteDialog = (food: Food) => {
    setSelectedFood(food);
    setOpenDeleteDialog(true);
  };

  const handleCreateFood = async () => {
    try {
      const formDataToSend = new FormData();
      
      formDataToSend.append('name', formData.name);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('category', formData.category);
      formDataToSend.append('price', formData.price.toString());
      formDataToSend.append('quantity_available', formData.quantity_available.toString());
      formDataToSend.append('status', formData.status);
      
      if (imageFile) {
        formDataToSend.append('image', imageFile);
      }

      await api.post('/foods', formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      setSuccess('Food created successfully');
      setOpenCreateDialog(false);
      resetForm();
      fetchFoods();
      fetchStats();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to create food');
    }
  };

  const handleUpdateFood = async () => {
    if (!selectedFood) return;

    try {
      const formDataToSend = new FormData();
      
      formDataToSend.append('name', formData.name);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('category', formData.category);
      formDataToSend.append('price', formData.price.toString());
      formDataToSend.append('quantity_available', formData.quantity_available.toString());
      formDataToSend.append('status', formData.status);
      
      if (imageFile) {
        formDataToSend.append('image', imageFile);
      }

      await api.put(`/foods/${selectedFood._id}`, formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      setSuccess('Food updated successfully');
      setOpenEditDialog(false);
      resetForm();
      fetchFoods();
      fetchStats();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to update food');
    }
  };

  const handleDeleteFood = async () => {
    if (!selectedFood) return;

    try {
      await api.delete(`/foods/${selectedFood._id}`);
      setSuccess('Food deleted successfully');
      setOpenDeleteDialog(false);
      setSelectedFood(null);
      fetchFoods();
      fetchStats();
    } catch (error: any) {
      setError('Failed to delete food');
    }
  };

  const handleFilterChange = (field: string, value: string | number) => {
    setFilters(prev => ({
      ...prev,
      [field]: value,
      ...(field !== 'page' && { page: 1 })
    }));
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    handleFilterChange('page', value);
  };

  const handleFormChange = (field: keyof FoodFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: '',
      price: 0,
      quantity_available: true,
      status: 'AVAILABLE'
    });
    setImagePreview(null);
    setImageFile(null);
  };

  const resetFilters = () => {
    setFilters({
      search: '',
      category: '',
      status: '',
      quantityAvailable: '',
      minPrice: '',
      maxPrice: '',
      sortBy: 'created_at',
      sortOrder: 'desc',
      page: 1,
      limit: 10
    });
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
    } catch {
      return 'Invalid date';
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const getStatusColor = (status: string): 'success' | 'warning' | 'error' | 'info' | 'default' => {
    switch (status) {
      case 'AVAILABLE': return 'success';
      case 'UNAVAILABLE': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return <CheckCircle fontSize="small" />;
      case 'UNAVAILABLE': return <Cancel fontSize="small" />;
      default: return <CheckCircle fontSize="small" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return 'Available';
      case 'UNAVAILABLE': return 'Unavailable';
      default: return status;
    }
  };

  const getCategoryLabel = (category: string) => {
    const cat = categories.find(c => c.value === category);
    return cat ? cat.label : category;
  };

 const getImageUrl = (food: Food): string | null => {
  try {
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
        // Buffer format
        base64String = Buffer.from(food.imageData.data.data).toString('base64');
      } else {
        throw new Error('Unknown image data structure');
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
    
    return null;
  } catch (error) {
    console.error('Error getting image URL:', error);
    return null;
  }
};

  const renderFormSection = (title: string, icon: React.ReactNode, content: React.ReactNode) => (
    <>
      <Typography variant="h6" sx={{ 
        color: theme === 'dark' ? '#00ffff' : '#007bff', 
        mb: 2,
        display: 'flex',
        alignItems: 'center',
        gap: 1
      }}>
        {icon} {title}
      </Typography>
      {content}
      <Divider sx={{ my: 3 }} />
    </>
  );

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      theme === 'dark' 
        ? 'bg-gradient-to-br from-[#0a192f] to-[#112240] text-white' 
        : 'bg-gradient-to-br from-[#f0f0f0] to-[#ffffff] text-[#333333]'
    }`}>
      <Box sx={{ 
        py: 3,
        px: 2
      }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Box sx={{ mb: 4 }}>
            <Typography variant={isMobile ? "h5" : "h4"} sx={{ 
              fontWeight: 'bold', 
              color: theme === 'dark' ? '#ccd6f6' : '#333333',
              mb: 1 
            }}>
              Food Management
            </Typography>
            <Typography variant={isMobile ? "body2" : "body1"} color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
              Create, edit, and manage food items
            </Typography>
          </Box>
        </motion.div>

        {/* Statistics Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Box sx={{ 
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(4, 1fr)'
            },
            gap: 2,
            mb: 4
          }}>
            {statCards.map((stat, index) => (
              <Card 
                key={index}
                sx={{ 
                  borderRadius: 2,
                  boxShadow: theme === 'dark' 
                    ? '0 2px 8px rgba(0,0,0,0.3)' 
                    : '0 2px 8px rgba(0,0,0,0.1)',
                  borderLeft: `4px solid ${stat.color}`,
                  backgroundColor: theme === 'dark' ? '#0f172a80' : 'white',
                  height: '100%',
                  backdropFilter: theme === 'dark' ? 'blur(10px)' : 'none'
                }}
              >
                <CardContent sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Box sx={{ 
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      bgcolor: theme === 'dark' ? `${stat.color}20` : `${stat.color}10`,
                      mr: 2
                    }}>
                      <Box sx={{ color: stat.color }}>
                        {stat.icon}
                      </Box>
                    </Box>
                    <Box>
                      <Typography variant="h4" sx={{ 
                        fontWeight: 'bold', 
                        color: theme === 'dark' ? '#ccd6f6' : '#333333',
                        fontSize: { xs: '1.5rem', md: '1.75rem' },
                        mb: 0.5
                      }}>
                        {stat.value.toLocaleString()}
                      </Typography>
                      <Typography variant="caption" color={theme === 'dark' ? '#a8b2d1' : '#666666'} sx={{ fontWeight: 500 }}>
                        {stat.title}
                      </Typography>
                    </Box>
                  </Box>
                  <Typography variant="caption" color={theme === 'dark' ? '#94a3b8' : '#999999'}>
                    {stat.description}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Box>
        </motion.div>

        {/* Filter and Action Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
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
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ 
                display: 'flex', 
                flexDirection: { xs: 'column', md: 'row' },
                justifyContent: 'space-between',
                alignItems: { xs: 'stretch', md: 'center' },
                gap: 3,
                mb: 3
              }}>
                <Typography variant="h6" sx={{ 
                  fontWeight: 'bold',
                  color: theme === 'dark' ? '#ccd6f6' : '#333333',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}>
                  <Restaurant /> All Foods
                </Typography>
                
                <Box sx={{ 
                  display: 'flex', 
                  gap: 2,
                  flexDirection: { xs: 'column', sm: 'row' }
                }}>
                  <ToggleButtonGroup
                    value={viewMode}
                    exclusive
                    onChange={(e, newMode) => newMode && setViewMode(newMode)}
                    size="small"
                    sx={{
                      '& .MuiToggleButton-root': {
                        borderColor: theme === 'dark' ? '#334155' : '#e5e7eb',
                        color: theme === 'dark' ? '#a8b2d1' : '#666666',
                        '&.Mui-selected': {
                          backgroundColor: theme === 'dark' ? '#00ffff20' : '#007bff10',
                          color: theme === 'dark' ? '#00ffff' : '#007bff',
                          borderColor: theme === 'dark' ? '#00ffff' : '#007bff',
                        }
                      }
                    }}
                  >
                    <ToggleButton value="list">
                      List
                    </ToggleButton>
                    <ToggleButton value="grid">
                      Grid
                    </ToggleButton>
                  </ToggleButtonGroup>
                  
                  <Button
                    variant="outlined"
                    startIcon={<Refresh />}
                    onClick={resetFilters}
                    sx={{ 
                      borderRadius: 1,
                      borderColor: theme === 'dark' ? '#00ffff' : '#007bff',
                      color: theme === 'dark' ? '#00ffff' : '#007bff',
                      '&:hover': {
                        borderColor: theme === 'dark' ? '#00b3b3' : '#0056b3',
                        backgroundColor: theme === 'dark' ? '#00ffff20' : '#007bff10'
                      }
                    }}
                  >
                    Reset Filters
                  </Button>
                  
                  <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={handleOpenCreateDialog}
                    sx={{
                      background: theme === 'dark'
                        ? 'linear-gradient(135deg, #00ffff, #00b3b3)'
                        : 'linear-gradient(135deg, #007bff, #0056b3)',
                      borderRadius: 1,
                      boxShadow: theme === 'dark'
                        ? '0 2px 4px rgba(0, 255, 255, 0.2)'
                        : '0 2px 4px rgba(37, 99, 235, 0.2)',
                      '&:hover': {
                        background: theme === 'dark'
                          ? 'linear-gradient(135deg, #00b3b3, #008080)'
                          : 'linear-gradient(135deg, #0056b3, #004080)',
                        boxShadow: theme === 'dark'
                          ? '0 4px 8px rgba(0, 255, 255, 0.3)'
                          : '0 4px 8px rgba(37, 99, 235, 0.3)'
                      }
                    }}
                  >
                    New Food
                  </Button>
                </Box>
              </Box>
              
              {/* Filter Controls */}
              <Box sx={{ 
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr',
                  sm: 'repeat(2, 1fr)',
                  md: 'repeat(4, 1fr)'
                },
                gap: 2
              }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Search Foods"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  placeholder="Name or description..."
                  InputProps={{
                    startAdornment: (
                      <Search sx={{ 
                        color: theme === 'dark' ? '#a8b2d1' : '#666666',
                        mr: 1 
                      }} />
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 1,
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
                  }}
                />
                
                <FormControl fullWidth size="small">
                  <InputLabel sx={labelStyle}>Category</InputLabel>
                  <Select
                    value={filters.category}
                    label="Category"
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                    sx={selectStyle}
                  >
                    <MenuItem value="">
                      <Typography variant="body2" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                        All Categories
                      </Typography>
                    </MenuItem>
                    {categories.map((category) => (
                      <MenuItem key={category.value} value={category.value}>
                        <Typography variant="body2" color={theme === 'dark' ? '#ccd6f6' : '#333333'}>
                          {category.label}
                        </Typography>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                <FormControl fullWidth size="small">
                  <InputLabel sx={labelStyle}>Status</InputLabel>
                  <Select
                    value={filters.status}
                    label="Status"
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    sx={selectStyle}
                  >
                    <MenuItem value="">All Status</MenuItem>
                    <MenuItem value="AVAILABLE">Available</MenuItem>
                    <MenuItem value="UNAVAILABLE">Unavailable</MenuItem>
                  </Select>
                </FormControl>
                
                <FormControl fullWidth size="small">
                  <InputLabel sx={labelStyle}>Quantity</InputLabel>
                  <Select
                    value={filters.quantityAvailable}
                    label="Quantity"
                    onChange={(e) => handleFilterChange('quantityAvailable', e.target.value)}
                    sx={selectStyle}
                  >
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="true">Available</MenuItem>
                    <MenuItem value="false">Out of Stock</MenuItem>
                  </Select>
                </FormControl>

                <TextField
                  fullWidth
                  size="small"
                  label="Min Price"
                  type="number"
                  value={filters.minPrice}
                  onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                  placeholder="0"
                  InputProps={{
                    startAdornment: (
                      <AttachMoney sx={{ 
                        color: theme === 'dark' ? '#a8b2d1' : '#666666',
                        mr: 1 
                      }} />
                    ),
                  }}
                  sx={textFieldStyle}
                />

                <TextField
                  fullWidth
                  size="small"
                  label="Max Price"
                  type="number"
                  value={filters.maxPrice}
                  onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                  placeholder="1000"
                  InputProps={{
                    startAdornment: (
                      <AttachMoney sx={{ 
                        color: theme === 'dark' ? '#a8b2d1' : '#666666',
                        mr: 1 
                      }} />
                    ),
                  }}
                  sx={textFieldStyle}
                />

                <FormControl fullWidth size="small">
                  <InputLabel sx={labelStyle}>Sort By</InputLabel>
                  <Select
                    value={filters.sortBy}
                    label="Sort By"
                    onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                    sx={selectStyle}
                  >
                    <MenuItem value="created_at">Created Date</MenuItem>
                    <MenuItem value="price">Price</MenuItem>
                    <MenuItem value="name">Name</MenuItem>
                    <MenuItem value="view">Views</MenuItem>
                  </Select>
                </FormControl>

                <FormControl fullWidth size="small">
                  <InputLabel sx={labelStyle}>Order</InputLabel>
                  <Select
                    value={filters.sortOrder}
                    label="Order"
                    onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
                    sx={selectStyle}
                  >
                    <MenuItem value="desc">Descending</MenuItem>
                    <MenuItem value="asc">Ascending</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </CardContent>
          </Card>
        </motion.div>

        {/* Foods List */}
        {loading ? (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            minHeight: '400px' 
          }}>
            <CircularProgress size={60} sx={{ color: theme === 'dark' ? '#00ffff' : '#007bff' }} />
          </Box>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            {viewMode === 'grid' ? (
              /* Grid View */
              <Box sx={{ 
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr',
                  sm: 'repeat(2, 1fr)',
                  md: 'repeat(3, 1fr)',
                  lg: 'repeat(4, 1fr)'
                },
                gap: 3
              }}>
                {foods.map((food) => {
                  const imageUrl = getImageUrl(food);
                  
                  return (
                    <Card 
                      key={food._id}
                      sx={{ 
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
                      }}
                    >
                      {/* Food Image */}
                      <Box sx={{ 
                        position: 'relative',
                        height: 160,
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
                              objectFit: 'cover' 
                            }}
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.onerror = null;
                              target.src = '/api/placeholder/400/250';
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
                        
                        {/* Status Badge */}
                        <Chip
                          label={getStatusText(food.status)}
                          size="small"
                          icon={getStatusIcon(food.status)}
                          color={getStatusColor(food.status)}
                          sx={{ 
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            height: 24,
                            fontSize: '0.7rem'
                          }}
                        />
                        
                        {/* Quantity Badge */}
                        <Chip
                          label={food.quantity_available ? 'In Stock' : 'Out of Stock'}
                          size="small"
                          icon={food.quantity_available ? <CheckCircle fontSize="small" /> : <Cancel fontSize="small" />}
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
                      
                      <CardContent sx={{ p: 2, flexGrow: 1 }}>
                        {/* Category */}
                        <Chip
                          label={getCategoryLabel(food.category)}
                          size="small"
                          sx={{ 
                            mb: 1.5,
                            height: 20,
                            fontSize: '0.65rem',
                            backgroundColor: theme === 'dark' ? '#334155' : '#e5e7eb'
                          }}
                        />
                        
                        {/* Name */}
                        <Typography 
                          variant="subtitle1" 
                          sx={{ 
                            fontWeight: 'bold',
                            color: theme === 'dark' ? '#ccd6f6' : '#333333',
                            mb: 1,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            lineHeight: 1.3
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
                            fontSize: '0.8rem'
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
                          pt: 1,
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
                        gap: 1,
                        borderTop: theme === 'dark' ? '1px solid #334155' : '1px solid #e5e7eb'
                      }}>
                        <Button
                          size="small"
                          fullWidth
                          variant="outlined"
                          startIcon={<Visibility fontSize="small" />}
                          onClick={() => handleOpenViewDialog(food)}
                          sx={{
                            borderRadius: 1,
                            borderColor: theme === 'dark' ? '#00ffff' : '#007bff',
                            color: theme === 'dark' ? '#00ffff' : '#007bff',
                            fontSize: '0.75rem',
                            py: 0.5,
                            '&:hover': {
                              backgroundColor: theme === 'dark' ? '#00ffff20' : '#007bff10'
                            }
                          }}
                        >
                          View
                        </Button>
                        <Button
                          size="small"
                          fullWidth
                          variant="outlined"
                          startIcon={<Edit fontSize="small" />}
                          onClick={() => handleOpenEditDialog(food)}
                          sx={{
                            borderRadius: 1,
                            borderColor: theme === 'dark' ? '#00ff00' : '#28a745',
                            color: theme === 'dark' ? '#00ff00' : '#28a745',
                            fontSize: '0.75rem',
                            py: 0.5,
                            '&:hover': {
                              backgroundColor: theme === 'dark' ? '#00ff0020' : '#28a74510'
                            }
                          }}
                        >
                          Edit
                        </Button>
                      </Box>
                    </Card>
                  );
                })}
              </Box>
            ) : (
              /* Table View */
              <Card sx={{ 
                borderRadius: 2,
                boxShadow: theme === 'dark' 
                  ? '0 4px 12px rgba(0,0,0,0.3)' 
                  : '0 4px 12px rgba(0,0,0,0.08)',
                border: theme === 'dark' 
                  ? '1px solid #334155' 
                  : '1px solid #e5e7eb',
                backgroundColor: theme === 'dark' ? '#0f172a80' : 'white',
                backdropFilter: theme === 'dark' ? 'blur(10px)' : 'none'
              }}>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ 
                        background: theme === 'dark'
                          ? 'linear-gradient(135deg, #00ffff, #00b3b3)'
                          : 'linear-gradient(135deg, #007bff, #0056b3)'
                      }}>
                        <TableCell sx={{ 
                          color: 'white', 
                          fontWeight: 'bold',
                          fontSize: '0.875rem',
                          py: 2,
                          width: '30%'
                        }}>
                          Food
                        </TableCell>
                        <TableCell sx={{ 
                          color: 'white', 
                          fontWeight: 'bold',
                          fontSize: '0.875rem',
                          py: 2
                        }}>
                          Category/Status
                        </TableCell>
                        <TableCell sx={{ 
                          color: 'white', 
                          fontWeight: 'bold',
                          fontSize: '0.875rem',
                          py: 2
                        }}>
                          Price
                        </TableCell>
                        <TableCell sx={{ 
                          color: 'white', 
                          fontWeight: 'bold',
                          fontSize: '0.875rem',
                          py: 2
                        }}>
                          Stats
                        </TableCell>
                        <TableCell sx={{ 
                          color: 'white', 
                          fontWeight: 'bold',
                          fontSize: '0.875rem',
                          py: 2
                        }}>
                          Created
                        </TableCell>
                        <TableCell sx={{ 
                          color: 'white', 
                          fontWeight: 'bold',
                          fontSize: '0.875rem',
                          py: 2
                        }}>
                          Actions
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {foods.map((food) => {
                        const imageUrl = getImageUrl(food);
                        
                        return (
                          <TableRow 
                            key={food._id} 
                            hover
                            sx={{ 
                              '&:hover': {
                                backgroundColor: theme === 'dark' ? '#1e293b' : '#f8fafc'
                              }
                            }}
                          >
                            <TableCell sx={{ py: 2.5 }}>
                              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                                {imageUrl ? (
                                  <Box sx={{ 
                                    width: 60, 
                                    height: 40,
                                    borderRadius: 1,
                                    overflow: 'hidden',
                                    flexShrink: 0
                                  }}>
                                    <img 
                                      src={imageUrl} 
                                      alt={food.name}
                                      style={{ 
                                        width: '100%', 
                                        height: '100%', 
                                        objectFit: 'cover' 
                                      }}
                                      onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.onerror = null;
                                        target.src = '/api/placeholder/60/40';
                                      }}
                                    />
                                  </Box>
                                ) : (
                                  <Box sx={{ 
                                    width: 60, 
                                    height: 40,
                                    borderRadius: 1,
                                    backgroundColor: theme === 'dark' ? '#334155' : '#e5e7eb',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0
                                  }}>
                                    <Restaurant sx={{ 
                                      fontSize: 20, 
                                      color: theme === 'dark' ? '#a8b2d1' : '#94a3b8' 
                                    }} />
                                  </Box>
                                )}
                                <Box>
                                  <Typography variant="body2" sx={{ 
                                    fontWeight: 500,
                                    color: theme === 'dark' ? '#ccd6f6' : '#333333',
                                    mb: 0.5,
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis'
                                  }}>
                                    {food.name}
                                  </Typography>
                                  <Typography variant="caption" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                                    {food.description.substring(0, 60)}...
                                  </Typography>
                                </Box>
                              </Box>
                            </TableCell>
                            <TableCell sx={{ py: 2.5 }}>
                              <Stack spacing={0.5}>
                                <Chip
                                  label={getCategoryLabel(food.category)}
                                  size="small"
                                  sx={{ 
                                    height: 22,
                                    fontSize: '0.7rem',
                                    backgroundColor: theme === 'dark' ? '#334155' : '#e5e7eb'
                                  }}
                                />
                                <Chip
                                  label={getStatusText(food.status)}
                                  size="small"
                                  icon={getStatusIcon(food.status)}
                                  color={getStatusColor(food.status)}
                                  sx={{ height: 22, fontSize: '0.7rem' }}
                                />
                                <Chip
                                  label={food.quantity_available ? 'In Stock' : 'Out of Stock'}
                                  size="small"
                                  icon={food.quantity_available ? <CheckCircle fontSize="small" /> : <Cancel fontSize="small" />}
                                  sx={{ 
                                    height: 22,
                                    fontSize: '0.7rem',
                                    backgroundColor: food.quantity_available 
                                      ? (theme === 'dark' ? '#00ff0020' : '#28a74520')
                                      : (theme === 'dark' ? '#ff000020' : '#dc354520'),
                                    color: food.quantity_available 
                                      ? (theme === 'dark' ? '#00ff00' : '#28a745')
                                      : (theme === 'dark' ? '#ff0000' : '#dc3545')
                                  }}
                                />
                              </Stack>
                            </TableCell>
                            <TableCell sx={{ py: 2.5 }}>
                              <Typography variant="body2" sx={{ fontWeight: 'bold', color: theme === 'dark' ? '#00ffff' : '#007bff' }}>
                                {formatPrice(food.price)}
                              </Typography>
                            </TableCell>
                            <TableCell sx={{ py: 2.5 }}>
                              <Stack spacing={0.5}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <RemoveRedEye fontSize="small" sx={{ fontSize: '0.9rem', color: theme === 'dark' ? '#a8b2d1' : '#666666' }} />
                                  <Typography variant="body2" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                                    {food.view} views
                                  </Typography>
                                </Box>
                              </Stack>
                            </TableCell>
                            <TableCell sx={{ py: 2.5 }}>
                              <Typography variant="body2" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                                {formatDate(food.created_at)}
                              </Typography>
                              <Typography variant="caption" color={theme === 'dark' ? '#94a3b8' : '#999999'}>
                                Last updated: {formatDate(food.updated_at)}
                              </Typography>
                            </TableCell>
                            <TableCell sx={{ py: 2.5 }}>
                              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                <IconButton
                                  size="small"
                                  onClick={() => handleOpenViewDialog(food)}
                                  sx={{ 
                                    color: theme === 'dark' ? '#00ffff' : '#007bff',
                                    '&:hover': {
                                      backgroundColor: theme === 'dark' ? '#00ffff20' : '#007bff10'
                                    }
                                  }}
                                >
                                  <Visibility fontSize="small" />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  onClick={() => handleOpenEditDialog(food)}
                                  sx={{ 
                                    color: theme === 'dark' ? '#00ff00' : '#28a745',
                                    '&:hover': {
                                      backgroundColor: theme === 'dark' ? '#00ff0020' : '#28a74510'
                                    }
                                  }}
                                >
                                  <Edit fontSize="small" />
                                </IconButton>
                                
                                <IconButton
                                  size="small"
                                  onClick={() => handleOpenDeleteDialog(food)}
                                  sx={{ 
                                    color: theme === 'dark' ? '#ff0000' : '#dc3545',
                                    '&:hover': {
                                      backgroundColor: theme === 'dark' ? '#ff000020' : '#dc354510'
                                    }
                                  }}
                                >
                                  <Delete fontSize="small" />
                                </IconButton>
                              </Box>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>

                {foods.length === 0 && !loading && (
                  <Box sx={{ 
                    textAlign: 'center', 
                    py: 8,
                    px: 2
                  }}>
                    <Restaurant sx={{ 
                      fontSize: 64, 
                      color: theme === 'dark' ? '#334155' : '#cbd5e1',
                      mb: 2
                    }} />
                    <Typography variant="h6" color={theme === 'dark' ? '#a8b2d1' : '#666666'} sx={{ mb: 1 }}>
                      No foods found
                    </Typography>
                    <Typography variant="body2" color={theme === 'dark' ? '#94a3b8' : '#999999'}>
                      Try adjusting your filters or create a new food item
                    </Typography>
                  </Box>
                )}
              </Card>
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center',
                mt: 4,
                flexDirection: { xs: 'column', sm: 'row' },
                gap: 2
              }}>
                <Pagination
                  count={pagination.totalPages}
                  page={filters.page}
                  onChange={handlePageChange}
                  color="primary"
                  size={isMobile ? "small" : "medium"}
                  showFirstButton
                  showLastButton
                  sx={{
                    '& .MuiPaginationItem-root': {
                      borderRadius: 1,
                      color: theme === 'dark' ? '#ccd6f6' : '#333333',
                      '&.Mui-selected': {
                        backgroundColor: theme === 'dark' ? '#00ffff' : '#007bff',
                        color: theme === 'dark' ? '#0a192f' : 'white',
                      },
                      '&:hover': {
                        backgroundColor: theme === 'dark' ? '#00ffff20' : '#007bff10'
                      }
                    }
                  }}
                />
                
                <Typography variant="body2" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                  Showing {((filters.page - 1) * filters.limit) + 1} to {Math.min(filters.page * filters.limit, pagination.totalFoods)} of {pagination.totalFoods} foods
                </Typography>
              </Box>
            )}
          </motion.div>
        )}

        {/* Create/Edit Food Dialog */}
        <Dialog 
          open={openCreateDialog || openEditDialog} 
          onClose={() => {
            setOpenCreateDialog(false);
            setOpenEditDialog(false);
            resetForm();
          }} 
          maxWidth="md" 
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
          <DialogTitle sx={{ 
            backgroundColor: theme === 'dark' ? '#0f172a' : 'white',
            borderBottom: theme === 'dark' ? '1px solid #334155' : '1px solid #e5e7eb',
            py: 3
          }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: theme === 'dark' ? '#ccd6f6' : '#333333' }}>
              {openEditDialog ? 'Edit Food' : 'Create New Food'}
            </Typography>
          </DialogTitle>
          <DialogContent sx={{ p: 3, overflowY: 'auto' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Image Upload */}
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                <Box sx={{ position: 'relative', width: '100%', maxWidth: 400 }}>
                  <Box
                    sx={{
                      width: '100%',
                      height: 200,
                      borderRadius: 2,
                      overflow: 'hidden',
                      border: `2px dashed ${theme === 'dark' ? '#334155' : '#e5e7eb'}`,
                      backgroundColor: theme === 'dark' ? '#1e293b' : '#f8fafc',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      '&:hover': {
                        borderColor: theme === 'dark' ? '#00ffff' : '#007bff',
                        backgroundColor: theme === 'dark' ? '#1e293b' : '#f0f8ff'
                      }
                    }}
                    onClick={() => document.getElementById('food-image-upload')?.click()}
                  >
                    {imagePreview ? (
                      <img 
                        src={imagePreview} 
                        alt="Food preview"
                        style={{ 
                          width: '100%', 
                          height: '100%', 
                          objectFit: 'cover' 
                        }}
                      />
                    ) : (
                      <Stack alignItems="center" spacing={1}>
                        <CloudUpload sx={{ 
                          fontSize: 48, 
                          color: theme === 'dark' ? '#a8b2d1' : '#666666' 
                        }} />
                        <Typography variant="body2" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                          Click to upload food image
                        </Typography>
                        <Typography variant="caption" color={theme === 'dark' ? '#94a3b8' : '#999999'}>
                          Recommended: 800x600px
                        </Typography>
                      </Stack>
                    )}
                  </Box>
                  <input
                    id="food-image-upload"
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                  {imagePreview && (
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      onClick={() => {
                        setImagePreview(null);
                        setImageFile(null);
                      }}
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        minWidth: 'auto',
                        padding: '4px 8px'
                      }}
                    >
                      Remove
                    </Button>
                  )}
                </Box>
              </Box>

              {/* Basic Information Section */}
              {renderFormSection(
                "Basic Information",
                <Restaurant />,
                <>
                  <FormRow columns={1}>
                    <TextField
                      fullWidth
                      label="Food Name"
                      value={formData.name}
                      onChange={(e) => handleFormChange('name', e.target.value)}
                      required
                      size="small"
                      placeholder="Enter food name..."
                      helperText="Name should be 3-100 characters"
                      sx={textFieldStyle}
                    />
                  </FormRow>

                  <FormRow columns={1}>
                    <TextField
                      fullWidth
                      label="Description"
                      value={formData.description}
                      onChange={(e) => handleFormChange('description', e.target.value)}
                      required
                      multiline
                      rows={3}
                      placeholder="Enter food description..."
                      helperText="Description should be 10-500 characters"
                      sx={textFieldStyle}
                    />
                  </FormRow>

                  <FormRow columns={isMobile ? 1 : 2}>
                    <FormControl fullWidth size="small">
                      <InputLabel sx={labelStyle}>Category *</InputLabel>
                      <Select
                        value={formData.category}
                        label="Category *"
                        onChange={(e) => handleFormChange('category', e.target.value)}
                        sx={selectStyle}
                        required
                      >
                        <MenuItem value="">
                          <Typography variant="body2" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                            Select Category
                          </Typography>
                        </MenuItem>
                        {categories.map((category) => (
                          <MenuItem key={category.value} value={category.value}>
                            <Typography variant="body2" color={theme === 'dark' ? '#ccd6f6' : '#333333'}>
                              {category.label}
                            </Typography>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    
                    <TextField
                      fullWidth
                      label="Price"
                      type="number"
                      value={formData.price}
                      onChange={(e) => handleFormChange('price', parseFloat(e.target.value))}
                      required
                      size="small"
                      placeholder="0.00"
                      InputProps={{
                        startAdornment: (
                          <AttachMoney sx={{ 
                            color: theme === 'dark' ? '#a8b2d1' : '#666666',
                            mr: 1 
                          }} />
                        ),
                      }}
                      sx={textFieldStyle}
                    />
                  </FormRow>
                </>
              )}

              {/* Settings Section */}
              {renderFormSection(
                "Settings",
                <Fastfood />,
                <>
                  <FormRow columns={isMobile ? 1 : 2}>
                    <FormControl fullWidth size="small">
                      <InputLabel sx={labelStyle}>Status</InputLabel>
                      <Select
                        value={formData.status}
                        label="Status"
                        onChange={(e) => handleFormChange('status', e.target.value)}
                        sx={selectStyle}
                      >
                        <MenuItem value="AVAILABLE">Available</MenuItem>
                        <MenuItem value="UNAVAILABLE">Unavailable</MenuItem>
                      </Select>
                    </FormControl>
                    
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData.quantity_available}
                          onChange={(e) => handleFormChange('quantity_available', e.target.checked)}
                          sx={{
                            color: theme === 'dark' ? '#00ffff' : '#007bff',
                            '&.Mui-checked': {
                              color: theme === 'dark' ? '#00ffff' : '#007bff',
                            },
                          }}
                        />
                      }
                      label="Quantity Available"
                      sx={{
                        color: theme === 'dark' ? '#ccd6f6' : '#333333',
                      }}
                    />
                  </FormRow>
                </>
              )}
            </Box>
          </DialogContent>
          <DialogActions sx={{ 
            p: 3,
            borderTop: theme === 'dark' ? '1px solid #334155' : '1px solid #e5e7eb',
            backgroundColor: theme === 'dark' ? '#0f172a' : 'white'
          }}>
            <Button 
              onClick={() => {
                setOpenCreateDialog(false);
                setOpenEditDialog(false);
                resetForm();
              }}
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
              onClick={openEditDialog ? handleUpdateFood : handleCreateFood}
              variant="contained"
              disabled={!formData.name || !formData.description || !formData.category || formData.price <= 0}
              sx={{
                background: theme === 'dark'
                  ? 'linear-gradient(135deg, #00ffff, #00b3b3)'
                  : 'linear-gradient(135deg, #007bff, #0056b3)',
                borderRadius: 1,
                '&:hover': {
                  background: theme === 'dark'
                    ? 'linear-gradient(135deg, #00b3b3, #008080)'
                    : 'linear-gradient(135deg, #0056b3, #004080)'
                },
                '&.Mui-disabled': {
                  background: theme === 'dark' ? '#334155' : '#e5e7eb',
                  color: theme === 'dark' ? '#94a3b8' : '#94a3b8'
                }
              }}
            >
              {openEditDialog ? 'Update Food' : 'Create Food'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* View Food Dialog */}
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
              color: theme === 'dark' ? '#ccd6f6' : '#333333'
            }
          }}
        >
          {selectedFood && (
            <>
              <DialogTitle sx={{ 
                backgroundColor: theme === 'dark' ? '#0f172a' : 'white',
                borderBottom: theme === 'dark' ? '1px solid #334155' : '1px solid #e5e7eb',
                py: 3
              }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: theme === 'dark' ? '#ccd6f6' : '#333333' }}>
                    Food Details
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Chip
                      label={getStatusText(selectedFood.status)}
                      color={getStatusColor(selectedFood.status)}
                      size="small"
                      icon={getStatusIcon(selectedFood.status)}
                    />
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
                </Box>
              </DialogTitle>
              <DialogContent sx={{ p: 0 }}>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  {/* Food Image */}
                  {(selectedFood.imageData || selectedFood.image) && (
                    <Box sx={{ 
                      width: '100%',
                      height: { xs: 200, md: 300 },
                      overflow: 'hidden'
                    }}>
                      <img 
                        src={getImageUrl(selectedFood) || ''} 
                        alt={selectedFood.name}
                        style={{ 
                          width: '100%', 
                          height: '100%', 
                          objectFit: 'cover' 
                        }}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.onerror = null;
                          target.src = '/api/placeholder/800/400';
                        }}
                      />
                    </Box>
                  )}
                  
                  <Box sx={{ p: 3 }}>
                    {/* Food Name */}
                    <Typography variant="h4" sx={{ 
                      fontWeight: 'bold',
                      color: theme === 'dark' ? '#ccd6f6' : '#333333',
                      mb: 2
                    }}>
                      {selectedFood.name}
                    </Typography>
                    
                    {/* Category and Price */}
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
                      
                      <Typography variant="h5" sx={{ 
                        fontWeight: 'bold',
                        color: theme === 'dark' ? '#00ffff' : '#007bff'
                      }}>
                        {formatPrice(selectedFood.price)}
                      </Typography>
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
                    
                    {/* Stats */}
                    <Card sx={{ 
                      mt: 3,
                      backgroundColor: theme === 'dark' ? '#1e293b' : '#f8f9fa',
                      border: theme === 'dark' ? '1px solid #334155' : '1px solid #e5e7eb'
                    }}>
                      <CardContent>
                        <Typography variant="h6" sx={{ 
                          mb: 2,
                          color: theme === 'dark' ? '#ccd6f6' : '#333333',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1
                        }}>
                          <TrendingUp /> Statistics
                        </Typography>
                        
                        <Box sx={{ 
                          display: 'grid',
                          gridTemplateColumns: {
                            xs: '1fr',
                            sm: '1fr 1fr'
                          },
                          gap: 2
                        }}>
                          <Box>
                            <Typography variant="caption" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                              Views
                            </Typography>
                            <Typography variant="body2" sx={{ color: theme === 'dark' ? '#ccd6f6' : '#333333' }}>
                              {selectedFood.view}
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                              Created Date
                            </Typography>
                            <Typography variant="body2" sx={{ color: theme === 'dark' ? '#ccd6f6' : '#333333' }}>
                              {formatDate(selectedFood.created_at)}
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                              Last Updated
                            </Typography>
                            <Typography variant="body2" sx={{ color: theme === 'dark' ? '#ccd6f6' : '#333333' }}>
                              {formatDate(selectedFood.updated_at)}
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                              Availability
                            </Typography>
                            <Typography variant="body2" sx={{ 
                              color: selectedFood.quantity_available 
                                ? (theme === 'dark' ? '#00ff00' : '#28a745')
                                : (theme === 'dark' ? '#ff0000' : '#dc3545')
                            }}>
                              {selectedFood.quantity_available ? 'In Stock' : 'Out of Stock'}
                            </Typography>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Box>
                </motion.div>
              </DialogContent>
              <DialogActions sx={{ 
                p: 3,
                borderTop: theme === 'dark' ? '1px solid #334155' : '1px solid #e5e7eb',
                backgroundColor: theme === 'dark' ? '#0f172a' : 'white'
              }}>
                <Button 
                  onClick={() => setOpenViewDialog(false)}
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
                    setOpenViewDialog(false);
                    handleOpenEditDialog(selectedFood);
                  }}
                  variant="contained"
                  sx={{
                    background: theme === 'dark'
                      ? 'linear-gradient(135deg, #00ffff, #00b3b3)'
                      : 'linear-gradient(135deg, #007bff, #0056b3)',
                    borderRadius: 1,
                    '&:hover': {
                      background: theme === 'dark'
                        ? 'linear-gradient(135deg, #00b3b3, #008080)'
                        : 'linear-gradient(135deg, #0056b3, #004080)'
                    }
                  }}
                >
                  Edit Food
                </Button>
              </DialogActions>
            </>
          )}
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog 
          open={openDeleteDialog} 
          onClose={() => setOpenDeleteDialog(false)}
          PaperProps={{
            sx: { 
              borderRadius: 2,
              backgroundColor: theme === 'dark' ? '#0f172a' : 'white',
              color: theme === 'dark' ? '#ccd6f6' : '#333333'
            }
          }}
        >
          <DialogTitle sx={{ 
            backgroundColor: theme === 'dark' ? '#0f172a' : 'white',
            borderBottom: theme === 'dark' ? '1px solid #334155' : '1px solid #e5e7eb',
            py: 3
          }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: theme === 'dark' ? '#ccd6f6' : '#333333' }}>
              Confirm Delete
            </Typography>
          </DialogTitle>
          <DialogContent sx={{ p: 3 }}>
            <Typography variant="body1" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
              Are you sure you want to delete food item <strong style={{color: theme === 'dark' ? '#ff0000' : '#dc3545'}}>
                "{selectedFood?.name}"
              </strong>? This action cannot be undone.
            </Typography>
            {selectedFood?.image && (
              <Typography variant="caption" color={theme === 'dark' ? '#94a3b8' : '#999999'} sx={{ display: 'block', mt: 1 }}>
                Note: The food image will also be deleted.
              </Typography>
            )}
          </DialogContent>
          <DialogActions sx={{ 
            p: 3,
            borderTop: theme === 'dark' ? '1px solid #334155' : '1px solid #e5e7eb',
            backgroundColor: theme === 'dark' ? '#0f172a' : 'white'
          }}>
            <Button 
              onClick={() => setOpenDeleteDialog(false)}
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
              onClick={handleDeleteFood} 
              variant="contained"
              color="error"
              sx={{
                borderRadius: 1,
                background: theme === 'dark'
                  ? 'linear-gradient(135deg, #ff0000, #cc0000)'
                  : 'linear-gradient(135deg, #dc3545, #c82333)',
                '&:hover': {
                  background: theme === 'dark'
                    ? 'linear-gradient(135deg, #cc0000, #990000)'
                    : 'linear-gradient(135deg, #c82333, #bd2130)'
                }
              }}
            >
              Delete Food
            </Button>
          </DialogActions>
        </Dialog>

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
  );
};

export default FoodManagementPage;