'use client';

import { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent,
  TextField, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow,
  Chip, Alert, Snackbar, CircularProgress,
  useMediaQuery, Pagination,
  MenuItem, Select, FormControl, InputLabel,
  IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, Button, Avatar, Divider
} from '@mui/material';
import { motion } from 'framer-motion';
import { useTheme } from '@/lib/theme-context';
import {
  People, Block, CheckCircle,
  PersonAdd, Refresh, Delete, Lock,
  FilterList, ExpandMore, ExpandLess, Edit,
  Email, Phone, AccountCircle,
  Category, Group, Visibility, Person,
  AdminPanelSettings, Assignment, BusinessCenter,
  School as SchoolIcon, Engineering, MusicNote,
  TrendingUp, Handshake, Build,
  CalendarToday, LocationOn,
  Church, AccessTime, Business,
  Call, PersonPin, Description,
  SupervisorAccount, Search
} from '@mui/icons-material';
import api from '@/app/utils/api';

// Types
interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  background?: string;
  role:
    | 'user'
    | 'customer'
    | 'manager'
    | 'accountant'
    | 'admin'
    | 'Abalat-Guday'
    | 'Mezmur'
    | 'Timhrt'
    | 'Muyana-Terado'
    | 'Priesedant'
    | 'Vice-Priesedant'
    | 'Secretary'
    | 'Bachna-Department'
    | 'Audite'
    | 'Limat';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface UserStats {
  totalUsers: number;
  activeUsers: number;
  blockedUsers: number;
  roles: { _id: string; count: number }[];
}

interface PaginationData {
  currentPage: number;
  totalPages: number;
  totalUsers: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Role options with icons
const ROLE_OPTIONS = [
  { value: 'user', label: 'User', icon: <Person /> },
  { value: 'disk-user', label: 'Disk User', icon: <Visibility /> },
  { value: 'spinner-user', label: 'Spinner User', icon: <Visibility /> },
  { value: 'accountant', label: 'Accountant', icon: <AccountCircle /> },
  { value: 'admin', label: 'Admin', icon: <AdminPanelSettings /> },
  { value: 'Abalat-Guday', label: 'Abalat Guday', icon: <Group /> },
  { value: 'Mezmur', label: 'Mezmur', icon: <MusicNote /> },
  { value: 'Timhrt', label: 'Timhrt', icon: <SchoolIcon /> },
  { value: 'Muyana-Terado', label: 'Muyana Terado', icon: <Engineering /> },
  { value: 'Priesedant', label: 'Priesedant', icon: <BusinessCenter /> },
  { value: 'Vice-Priesedant', label: 'Vice Priesedant', icon: <BusinessCenter /> },
  { value: 'Secretary', label: 'Secretary', icon: <Assignment /> },
  { value: 'Bachna-Department', label: 'Bachna Department', icon: <Handshake /> },
  { value: 'Audite', label: 'Audite', icon: <AccountCircle /> },
  { value: 'Limat', label: 'Limat', icon: <TrendingUp /> }
];

const UsersPage = () => {
  const { theme } = useTheme();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const isTablet = useMediaQuery('(max-width: 1024px)');
  
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [pagination, setPagination] = useState<PaginationData>({
    currentPage: 1,
    totalPages: 1,
    totalUsers: 0,
    hasNext: false,
    hasPrev: false
  });

  // Filter states
  const [filters, setFilters] = useState({
    role: '',
    status: '',
    search: '',
    page: 1,
    limit: 10
  });

  // Dialog states
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openPasswordDialog, setOpenPasswordDialog] = useState(false);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    background: '',
    password: '',
    role: 'user' as User['role']
  });

  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    phone: '',
    background: '',
    role: 'user' as User['role']
  });

  const [passwordFormData, setPasswordFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  });

  // Theme styles
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

  // Form field styles
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

  useEffect(() => {
    fetchUsers();
    fetchStats();
  }, [filters.page, filters.limit, filters.role, filters.status, filters.search]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (filters.role) params.append('role', filters.role);
      if (filters.status) params.append('status', filters.status);
      if (filters.search) params.append('search', filters.search);
      params.append('page', filters.page.toString());
      params.append('limit', filters.limit.toString());

      const response = await api.get(`/user?${params}`);
      
      setUsers(response.data.data.users || []);
      setPagination(response.data.data.pagination || {
        currentPage: 1,
        totalPages: 1,
        totalUsers: 0,
        hasNext: false,
        hasPrev: false
      });
      setError('');
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to fetch users');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/user/stats');
      setStats(response.data.data);
    } catch (error: any) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleCreateUser = async () => {
    try {
      await api.post('/user/register', formData);
      setSuccess('User created successfully');
      setOpenAddDialog(false);
      // Reset form data
      setFormData({
        name: '',
        email: '',
        phone: '',
        background: '',
        password: '',
        role: 'user'
      });
      fetchUsers();
      fetchStats();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to create user');
    }
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    try {
      await api.put(`/user/${selectedUser._id}`, editFormData);
      setSuccess('User updated successfully');
      setOpenEditDialog(false);
      fetchUsers();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to update user');
    }
  };

  const handleStatusUpdate = async (userId: string, isActive: boolean) => {
    try {
      await api.patch(`/user/${userId}/status`, { isActive });
      setSuccess(`User ${isActive ? 'activated' : 'blocked'} successfully`);
      fetchUsers();
      fetchStats();
    } catch (error: any) {
      setError('Failed to update user status');
    }
  };

  const handleChangePassword = async () => {
    if (!selectedUser) return;

    if (passwordFormData.newPassword !== passwordFormData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      await api.put('/user/change-password', {
        userId: selectedUser._id,
        newPassword: passwordFormData.newPassword
      });
      setSuccess('Password changed successfully');
      setOpenPasswordDialog(false);
      setPasswordFormData({ newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to change password');
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      await api.delete(`/user/${selectedUser._id}`);
      setSuccess('User deleted successfully');
      setOpenDeleteDialog(false);
      setSelectedUser(null);
      fetchUsers();
      fetchStats();
    } catch (error: any) {
      setError('Failed to delete user');
    }
  };

  const handleOpenAddDialog = () => {
    setOpenAddDialog(true);
  };

  const handleOpenEditDialog = (user: User) => {
    setSelectedUser(user);
    setEditFormData({
      name: user.name,
      email: user.email,
      phone: user.phone,
      background: user.background || '',
      role: user.role
    });
    setOpenEditDialog(true);
  };

  const handleOpenPasswordDialog = (user: User) => {
    setSelectedUser(user);
    setPasswordFormData({ newPassword: '', confirmPassword: '' });
    setOpenPasswordDialog(true);
  };

  const handleOpenViewDialog = (user: User) => {
    setSelectedUser(user);
    setOpenViewDialog(true);
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

  const handleFormChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleEditFormChange = (field: string, value: string) => {
    setEditFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePasswordFormChange = (field: string, value: string) => {
    setPasswordFormData(prev => ({ ...prev, [field]: value }));
  };

  const resetFilters = () => {
    setFilters({
      role: '',
      status: '',
      search: '',
      page: 1,
      limit: 10
    });
  };

  const toggleExpandUser = (userId: string) => {
    setExpandedUser(expandedUser === userId ? null : userId);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRoleColor = (role: string) => {
    const roleColors: { [key: string]: 'primary' | 'secondary' | 'success' | 'warning' | 'info' | 'error' | 'default' } = {
      'admin': 'error',
      'accountant': 'warning',
      'Abalat-Guday': 'primary',
      'Mezmur': 'secondary',
      'Timhrt': 'info',
      'Muyana-Terado': 'success',
      'Priesedant': 'error',
      'Vice-Priesedant': 'warning',
      'Secretary': 'info',
      'Bachna-Department': 'success',
      'Audite': 'primary',
      'Limat': 'secondary',
      'disk-user': 'default',
      'spinner-user': 'default',
      'user': 'default'
    };
    return roleColors[role] || 'default';
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'success' : 'error';
  };

  // Get role icon
  const getRoleIcon = (role: string) => {
    const roleOption = ROLE_OPTIONS.find(r => r.value === role);
    return roleOption?.icon || <Person />;
  };

  // Get avatar color
  const getAvatarColor = (userId: string) => {
    const colors = ['#1976d2', '#2e7d32', '#ed6c02', '#d32f2f', '#7b1fa2', '#00796b', '#388e3c', '#f57c00', '#0288d1', '#c2185b'];
    const index = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    return colors[index];
  };

  // Get user initials
  const getUserInitials = (user: User) => {
    const nameParts = user.name.split(' ');
    if (nameParts.length >= 2) {
      return `${nameParts[0].charAt(0)}${nameParts[1].charAt(0)}`.toUpperCase();
    }
    return user.name.charAt(0).toUpperCase();
  };

  // Render form section
  const renderFormSection = (title: string, icon: React.ReactNode, content: React.ReactNode) => (
    <Box sx={{ mb: 3 }}>
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
      <Divider sx={{ mt: 2 }} />
    </Box>
  );

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      theme === 'dark' 
        ? 'bg-gradient-to-br from-[#0a192f] to-[#112240] text-white' 
        : 'bg-gradient-to-br from-[#f0f0f0] to-[#ffffff] text-[#333333]'
    }`}>
      <Box sx={{ 
        py: 3,
        px: { xs: 2, sm: 3, md: 4 }
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
              User Management
            </Typography>
            <Typography variant={isMobile ? "body2" : "body1"} color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
              Manage system users, roles, and permissions
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
            gap: 3,
            mb: 4
          }}>
            {[
              {
                title: 'Total Users',
                value: stats?.totalUsers || 0,
                icon: <People sx={{ fontSize: 28 }} />,
                color: theme === 'dark' ? '#00ffff' : '#007bff'
              },
              {
                title: 'Active Users',
                value: stats?.activeUsers || 0,
                icon: <CheckCircle sx={{ fontSize: 28 }} />,
                color: theme === 'dark' ? '#00ff00' : '#28a745'
              },
              {
                title: 'Blocked Users',
                value: stats?.blockedUsers || 0,
                icon: <Block sx={{ fontSize: 28 }} />,
                color: theme === 'dark' ? '#ff0000' : '#dc3545'
              },
              {
                title: 'Role Types',
                value: stats?.roles?.length || 0,
                icon: <Category sx={{ fontSize: 28 }} />,
                color: theme === 'dark' ? '#ff00ff' : '#9333ea'
              }
            ].map((stat, index) => (
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
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Box sx={{ 
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      bgcolor: theme === 'dark' ? `${stat.color}20` : `${stat.color}10`,
                      mr: 2
                    }}>
                      <Box sx={{ color: stat.color }}>
                        {stat.icon}
                      </Box>
                    </Box>
                    <Box>
                      <Typography variant="body2" color={theme === 'dark' ? '#a8b2d1' : '#666666'} sx={{ fontWeight: 500 }}>
                        {stat.title}
                      </Typography>
                      <Typography variant="h4" sx={{ 
                        fontWeight: 'bold', 
                        color: theme === 'dark' ? '#ccd6f6' : '#333333',
                        fontSize: { xs: '1.75rem', md: '2rem' }
                      }}>
                        {stat.value}
                      </Typography>
                    </Box>
                  </Box>
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
                  <FilterList /> User Filters
                </Typography>
                
                <Box sx={{ 
                  display: 'flex', 
                  gap: 2,
                  flexDirection: { xs: 'column', sm: 'row' }
                }}>
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
                    Reset
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<PersonAdd />}
                    onClick={handleOpenAddDialog}
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
                    Add User
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
                gap: 3
              }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Search Users"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  placeholder="Name, email, or phone..."
                  InputProps={{
                    startAdornment: (
                      <Search sx={{ 
                        color: theme === 'dark' ? '#a8b2d1' : '#666666',
                        mr: 1 
                      }} />
                    ),
                  }}
                  sx={textFieldStyle}
                />
                
                <FormControl fullWidth size="small">
                  <InputLabel sx={labelStyle}>Role</InputLabel>
                  <Select
                    value={filters.role}
                    label="Role"
                    onChange={(e) => handleFilterChange('role', e.target.value)}
                    sx={selectStyle}
                  >
                    <MenuItem value="">
                      <Typography variant="body2" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                        All Roles
                      </Typography>
                    </MenuItem>
                    {ROLE_OPTIONS.map((role) => (
                      <MenuItem key={role.value} value={role.value}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ color: theme === 'dark' ? '#00ffff' : '#007bff' }}>
                            {role.icon}
                          </Box>
                          <Typography variant="body2" color={theme === 'dark' ? '#ccd6f6' : '#333333'}>
                            {role.label}
                          </Typography>
                        </Box>
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
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="inactive">Blocked</MenuItem>
                  </Select>
                </FormControl>
                
                <FormControl fullWidth size="small">
                  <InputLabel sx={labelStyle}>Per Page</InputLabel>
                  <Select
                    value={filters.limit}
                    label="Per Page"
                    onChange={(e) => handleFilterChange('limit', Number(e.target.value))}
                    sx={selectStyle}
                  >
                    <MenuItem value={10}>10</MenuItem>
                    <MenuItem value={25}>25</MenuItem>
                    <MenuItem value={50}>50</MenuItem>
                    <MenuItem value={100}>100</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </CardContent>
          </Card>
        </motion.div>

        {/* Users List */}
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
            {/* Mobile View - Cards */}
            {isMobile ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {users.map((user) => {
                  const isExpanded = expandedUser === user._id;
                  
                  return (
                    <Card 
                      key={user._id} 
                      sx={{ 
                        borderRadius: 2,
                        boxShadow: theme === 'dark' 
                          ? '0 2px 8px rgba(0,0,0,0.3)' 
                          : '0 2px 8px rgba(0,0,0,0.1)',
                        border: theme === 'dark' 
                          ? '1px solid #334155' 
                          : '1px solid #e5e7eb',
                        backgroundColor: theme === 'dark' ? '#0f172a80' : 'white',
                        backdropFilter: theme === 'dark' ? 'blur(10px)' : 'none'
                      }}
                    >
                      <CardContent sx={{ p: 3 }}>
                        <Box sx={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'flex-start',
                          mb: 2
                        }}>
                          <Box>
                            <Typography variant="subtitle1" sx={{ 
                              fontWeight: 'bold',
                              color: theme === 'dark' ? '#ccd6f6' : '#333333',
                              mb: 0.5
                            }}>
                              {user.name}
                            </Typography>
                            <Chip
                              label={user.role}
                              color={getRoleColor(user.role)}
                              size="small"
                              icon={getRoleIcon(user.role)}
                              sx={{ height: 24 }}
                            />
                          </Box>
                          <IconButton 
                            size="small" 
                            onClick={() => toggleExpandUser(user._id)}
                            sx={{ color: theme === 'dark' ? '#a8b2d1' : '#666666' }}
                          >
                            {isExpanded ? <ExpandLess /> : <ExpandMore />}
                          </IconButton>
                        </Box>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                          <Email fontSize="small" sx={{ color: theme === 'dark' ? '#a8b2d1' : '#666666' }} />
                          <Typography variant="body2" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                            {user.email}
                          </Typography>
                        </Box>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                          <Phone fontSize="small" sx={{ color: theme === 'dark' ? '#a8b2d1' : '#666666' }} />
                          <Typography variant="body2" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                            {user.phone}
                          </Typography>
                        </Box>

                        <Box sx={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          mb: 2
                        }}>
                          <Typography variant="body2" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                            Status:
                          </Typography>
                          <Chip
                            label={user.isActive ? 'Active' : 'Blocked'}
                            color={getStatusColor(user.isActive)}
                            size="small"
                            sx={{ height: 24, fontSize: '0.75rem' }}
                          />
                        </Box>

                        {isExpanded && (
                          <Box sx={{ 
                            pt: 2,
                            borderTop: theme === 'dark' ? '1px solid #334155' : '1px solid #e5e7eb',
                            mt: 2
                          }}>
                            {user.background && (
                              <Box sx={{ mb: 2 }}>
                                <Typography variant="body2" color={theme === 'dark' ? '#a8b2d1' : '#666666'} sx={{ fontWeight: 500, mb: 0.5 }}>
                                  Background:
                                </Typography>
                                <Typography variant="body2" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                                  {user.background}
                                </Typography>
                              </Box>
                            )}
                            
                            <Box sx={{ 
                              display: 'flex', 
                              justifyContent: 'space-between',
                              mb: 2
                            }}>
                              <Typography variant="body2" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                                Created:
                              </Typography>
                              <Typography variant="body2" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                                {formatDate(user.createdAt)}
                              </Typography>
                            </Box>
                            
                            <Box sx={{ 
                              display: 'grid',
                              gridTemplateColumns: 'repeat(2, 1fr)',
                              gap: 1,
                              mt: 2
                            }}>
                              <Button
                                variant="outlined"
                                startIcon={<Visibility />}
                                onClick={() => handleOpenViewDialog(user)}
                                size="small"
                                sx={{
                                  borderRadius: 1,
                                  borderColor: theme === 'dark' ? '#00ffff' : '#007bff',
                                  color: theme === 'dark' ? '#00ffff' : '#007bff',
                                  '&:hover': {
                                    backgroundColor: theme === 'dark' ? '#00ffff20' : '#007bff10'
                                  }
                                }}
                              >
                                View
                              </Button>
                              <Button
                                variant="outlined"
                                startIcon={<Edit />}
                                onClick={() => handleOpenEditDialog(user)}
                                size="small"
                                sx={{
                                  borderRadius: 1,
                                  borderColor: theme === 'dark' ? '#00ffff' : '#007bff',
                                  color: theme === 'dark' ? '#00ffff' : '#007bff',
                                  '&:hover': {
                                    backgroundColor: theme === 'dark' ? '#00ffff20' : '#007bff10'
                                  }
                                }}
                              >
                                Edit
                              </Button>
                              <Button
                                variant="outlined"
                                startIcon={<Lock />}
                                onClick={() => handleOpenPasswordDialog(user)}
                                size="small"
                                sx={{
                                  borderRadius: 1,
                                  borderColor: theme === 'dark' ? '#00ffff' : '#007bff',
                                  color: theme === 'dark' ? '#00ffff' : '#007bff',
                                  '&:hover': {
                                    backgroundColor: theme === 'dark' ? '#00ffff20' : '#007bff10'
                                  }
                                }}
                              >
                                Password
                              </Button>
                              <Button
                                variant="outlined"
                                startIcon={user.isActive ? <Block /> : <CheckCircle />}
                                onClick={() => handleStatusUpdate(user._id, !user.isActive)}
                                size="small"
                                color={user.isActive ? 'error' : 'success'}
                                sx={{ 
                                  borderRadius: 1,
                                  borderColor: user.isActive ? 
                                    (theme === 'dark' ? '#ff0000' : '#dc3545') : 
                                    (theme === 'dark' ? '#00ff00' : '#28a745'),
                                  color: user.isActive ? 
                                    (theme === 'dark' ? '#ff0000' : '#dc3545') : 
                                    (theme === 'dark' ? '#00ff00' : '#28a745'),
                                  '&:hover': {
                                    backgroundColor: user.isActive ? 
                                      (theme === 'dark' ? '#ff000020' : '#dc354510') : 
                                      (theme === 'dark' ? '#00ff0020' : '#28a74510')
                                  }
                                }}
                              >
                                {user.isActive ? 'Block' : 'Activate'}
                              </Button>
                              <Button
                                variant="outlined"
                                startIcon={<Delete />}
                                onClick={() => {
                                  setSelectedUser(user);
                                  setOpenDeleteDialog(true);
                                }}
                                size="small"
                                color="error"
                                sx={{ 
                                  borderRadius: 1,
                                  borderColor: theme === 'dark' ? '#ff0000' : '#dc3545',
                                  color: theme === 'dark' ? '#ff0000' : '#dc3545',
                                  '&:hover': {
                                    backgroundColor: theme === 'dark' ? '#ff000020' : '#dc354510'
                                  }
                                }}
                              >
                                Delete
                              </Button>
                            </Box>
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </Box>
            ) : (
              /* Desktop/Tablet View - Table */
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
                          py: 2
                        }}>
                          Name
                        </TableCell>
                        <TableCell sx={{ 
                          color: 'white', 
                          fontWeight: 'bold',
                          fontSize: '0.875rem',
                          py: 2
                        }}>
                          Contact
                        </TableCell>
                        <TableCell sx={{ 
                          color: 'white', 
                          fontWeight: 'bold',
                          fontSize: '0.875rem',
                          py: 2
                        }}>
                          Role
                        </TableCell>
                        <TableCell sx={{ 
                          color: 'white', 
                          fontWeight: 'bold',
                          fontSize: '0.875rem',
                          py: 2
                        }}>
                          Status
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
                      {users.map((user) => (
                        <TableRow 
                          key={user._id} 
                          hover
                          sx={{ 
                            '&:hover': {
                              backgroundColor: theme === 'dark' ? '#1e293b' : '#f8fafc'
                            }
                          }}
                        >
                          <TableCell sx={{ py: 2.5 }}>
                            <Typography variant="body2" sx={{ 
                              fontWeight: 500,
                              color: theme === 'dark' ? '#ccd6f6' : '#333333'
                            }}>
                              {user.name}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ py: 2.5 }}>
                            <Box>
                              <Typography variant="body2" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                                {user.email}
                              </Typography>
                              <Typography variant="body2" color={theme === 'dark' ? '#94a3b8' : '#999999'} sx={{ fontSize: '0.75rem' }}>
                                {user.phone}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell sx={{ py: 2.5 }}>
                            <Chip
                              label={user.role}
                              color={getRoleColor(user.role)}
                              size="small"
                              icon={getRoleIcon(user.role)}
                              sx={{ 
                                height: 24,
                                fontSize: '0.75rem'
                              }}
                            />
                          </TableCell>
                          <TableCell sx={{ py: 2.5 }}>
                            <Chip
                              label={user.isActive ? 'Active' : 'Blocked'}
                              color={getStatusColor(user.isActive)}
                              size="small"
                              sx={{ 
                                height: 24,
                                fontSize: '0.75rem'
                              }}
                            />
                          </TableCell>
                          <TableCell sx={{ py: 2.5 }}>
                            <Typography variant="body2" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                              {formatDate(user.createdAt)}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ py: 2.5 }}>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <IconButton
                                size="small"
                                onClick={() => handleOpenViewDialog(user)}
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
                                onClick={() => handleOpenEditDialog(user)}
                                sx={{ 
                                  color: theme === 'dark' ? '#00ffff' : '#007bff',
                                  '&:hover': {
                                    backgroundColor: theme === 'dark' ? '#00ffff20' : '#007bff10'
                                  }
                                }}
                              >
                                <Edit fontSize="small" />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() => handleOpenPasswordDialog(user)}
                                sx={{ 
                                  color: theme === 'dark' ? '#00ffff' : '#007bff',
                                  '&:hover': {
                                    backgroundColor: theme === 'dark' ? '#00ffff20' : '#007bff10'
                                  }
                                }}
                              >
                                <Lock fontSize="small" />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() => handleStatusUpdate(user._id, !user.isActive)}
                                sx={{ 
                                  color: user.isActive ? 
                                    (theme === 'dark' ? '#ff0000' : '#dc3545') : 
                                    (theme === 'dark' ? '#00ff00' : '#28a745'),
                                  '&:hover': {
                                    backgroundColor: user.isActive ? 
                                      (theme === 'dark' ? '#ff000020' : '#dc354510') : 
                                      (theme === 'dark' ? '#00ff0020' : '#28a74510')
                                  }
                                }}
                              >
                                {user.isActive ? <Block fontSize="small" /> : <CheckCircle fontSize="small" />}
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setOpenDeleteDialog(true);
                                }}
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
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                {users.length === 0 && !loading && (
                  <Box sx={{ 
                    textAlign: 'center', 
                    py: 8,
                    px: 2
                  }}>
                    <People sx={{ 
                      fontSize: 64, 
                      color: theme === 'dark' ? '#334155' : '#cbd5e1',
                      mb: 2
                    }} />
                    <Typography variant="h6" color={theme === 'dark' ? '#a8b2d1' : '#666666'} sx={{ mb: 1 }}>
                      No users found
                    </Typography>
                    <Typography variant="body2" color={theme === 'dark' ? '#94a3b8' : '#999999'}>
                      Try adjusting your filters or add a new user
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
                  Showing {((filters.page - 1) * filters.limit) + 1} to {Math.min(filters.page * filters.limit, pagination.totalUsers)} of {pagination.totalUsers} users
                </Typography>
              </Box>
            )}
          </motion.div>
        )}

        {/* Add User Dialog */}
        <Dialog 
          open={openAddDialog} 
          onClose={() => setOpenAddDialog(false)} 
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
          <DialogTitle sx={{ 
            backgroundColor: theme === 'dark' ? '#0f172a' : 'white',
            borderBottom: theme === 'dark' ? '1px solid #334155' : '1px solid #e5e7eb',
            py: 3
          }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: theme === 'dark' ? '#ccd6f6' : '#333333' }}>
              Add New User
            </Typography>
          </DialogTitle>
          <DialogContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* User Information */}
              {renderFormSection(
                "User Information",
                <Person />,
                <>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box sx={{ 
                      display: 'grid',
                      gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                      gap: 2
                    }}>
                      <TextField
                        fullWidth
                        label="Full Name"
                        value={formData.name}
                        onChange={(e) => handleFormChange('name', e.target.value)}
                        placeholder="Enter user's full name"
                        required
                        size="small"
                        sx={textFieldStyle}
                      />
                      <TextField
                        fullWidth
                        label="Email Address"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleFormChange('email', e.target.value)}
                        placeholder="Enter email address"
                        required
                        size="small"
                        sx={textFieldStyle}
                      />
                    </Box>
                    
                    <Box sx={{ 
                      display: 'grid',
                      gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                      gap: 2
                    }}>
                      <TextField
                        fullWidth
                        label="Phone Number"
                        value={formData.phone}
                        onChange={(e) => handleFormChange('phone', e.target.value)}
                        placeholder="Enter phone number"
                        required
                        size="small"
                        sx={textFieldStyle}
                      />
                      <TextField
                        fullWidth
                        label="Password"
                        type="password"
                        value={formData.password}
                        onChange={(e) => handleFormChange('password', e.target.value)}
                        placeholder="Enter password"
                        required
                        size="small"
                        sx={textFieldStyle}
                      />
                    </Box>
                  </Box>
                </>
              )}

              {/* Background Information */}
              {renderFormSection(
                "Background Information",
                <Description />,
                <TextField
                  fullWidth
                  label="Background (Optional)"
                  multiline
                  rows={3}
                  value={formData.background}
                  onChange={(e) => handleFormChange('background', e.target.value)}
                  placeholder="Enter background information"
                  size="small"
                  sx={textFieldStyle}
                />
              )}

              {/* Role Selection */}
              {renderFormSection(
                "Role Information",
                <AdminPanelSettings />,
                <FormControl fullWidth size="small">
                  <InputLabel sx={labelStyle}>Role</InputLabel>
                  <Select
                    value={formData.role}
                    label="Role"
                    onChange={(e) => handleFormChange('role', e.target.value as User['role'])}
                    required
                    sx={selectStyle}
                  >
                    {ROLE_OPTIONS.map((role) => (
                      <MenuItem key={role.value} value={role.value}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ color: theme === 'dark' ? '#00ffff' : '#007bff' }}>
                            {role.icon}
                          </Box>
                          <Typography variant="body2" color={theme === 'dark' ? '#ccd6f6' : '#333333'}>
                            {role.label}
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            </Box>
          </DialogContent>
          <DialogActions sx={{ 
            p: 3,
            borderTop: theme === 'dark' ? '1px solid #334155' : '1px solid #e5e7eb',
            backgroundColor: theme === 'dark' ? '#0f172a' : 'white'
          }}>
            <Button 
              onClick={() => setOpenAddDialog(false)}
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
              onClick={handleCreateUser} 
              variant="contained"
              disabled={!formData.name || !formData.email || !formData.phone || !formData.password}
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
              Create User
            </Button>
          </DialogActions>
        </Dialog>

        {/* Edit User Dialog */}
        <Dialog 
          open={openEditDialog} 
          onClose={() => setOpenEditDialog(false)} 
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
          <DialogTitle sx={{ 
            backgroundColor: theme === 'dark' ? '#0f172a' : 'white',
            borderBottom: theme === 'dark' ? '1px solid #334155' : '1px solid #e5e7eb',
            py: 3
          }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: theme === 'dark' ? '#ccd6f6' : '#333333' }}>
              Edit User - {selectedUser?.name}
            </Typography>
          </DialogTitle>
          <DialogContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* User Information */}
              {renderFormSection(
                "User Information",
                <Person />,
                <>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box sx={{ 
                      display: 'grid',
                      gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                      gap: 2
                    }}>
                      <TextField
                        fullWidth
                        label="Full Name"
                        value={editFormData.name}
                        onChange={(e) => handleEditFormChange('name', e.target.value)}
                        placeholder="Enter user's full name"
                        required
                        size="small"
                        sx={textFieldStyle}
                      />
                      <TextField
                        fullWidth
                        label="Email Address"
                        type="email"
                        value={editFormData.email}
                        onChange={(e) => handleEditFormChange('email', e.target.value)}
                        placeholder="Enter email address"
                        required
                        size="small"
                        sx={textFieldStyle}
                      />
                    </Box>
                    
                    <Box sx={{ 
                      display: 'grid',
                      gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                      gap: 2
                    }}>
                      <TextField
                        fullWidth
                        label="Phone Number"
                        value={editFormData.phone}
                        onChange={(e) => handleEditFormChange('phone', e.target.value)}
                        placeholder="Enter phone number"
                        required
                        size="small"
                        sx={textFieldStyle}
                      />
                    </Box>
                  </Box>
                </>
              )}

              {/* Background Information */}
              {renderFormSection(
                "Background Information",
                <Description />,
                <TextField
                  fullWidth
                  label="Background (Optional)"
                  multiline
                  rows={3}
                  value={editFormData.background}
                  onChange={(e) => handleEditFormChange('background', e.target.value)}
                  placeholder="Enter background information"
                  size="small"
                  sx={textFieldStyle}
                />
              )}

              {/* Role Selection */}
              {renderFormSection(
                "Role Information",
                <AdminPanelSettings />,
                <FormControl fullWidth size="small">
                  <InputLabel sx={labelStyle}>Role</InputLabel>
                  <Select
                    value={editFormData.role}
                    label="Role"
                    onChange={(e) => handleEditFormChange('role', e.target.value as User['role'])}
                    required
                    sx={selectStyle}
                  >
                    {ROLE_OPTIONS.map((role) => (
                      <MenuItem key={role.value} value={role.value}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ color: theme === 'dark' ? '#00ffff' : '#007bff' }}>
                            {role.icon}
                          </Box>
                          <Typography variant="body2" color={theme === 'dark' ? '#ccd6f6' : '#333333'}>
                            {role.label}
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            </Box>
          </DialogContent>
          <DialogActions sx={{ 
            p: 3,
            borderTop: theme === 'dark' ? '1px solid #334155' : '1px solid #e5e7eb',
            backgroundColor: theme === 'dark' ? '#0f172a' : 'white'
          }}>
            <Button 
              onClick={() => setOpenEditDialog(false)}
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
              onClick={handleUpdateUser}
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
              Update User
            </Button>
          </DialogActions>
        </Dialog>

        {/* Change Password Dialog */}
        <Dialog 
          open={openPasswordDialog} 
          onClose={() => setOpenPasswordDialog(false)} 
          maxWidth="sm" 
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
          <DialogTitle sx={{ 
            backgroundColor: theme === 'dark' ? '#0f172a' : 'white',
            borderBottom: theme === 'dark' ? '1px solid #334155' : '1px solid #e5e7eb',
            py: 3
          }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: theme === 'dark' ? '#ccd6f6' : '#333333' }}>
              Change Password - {selectedUser?.name}
            </Typography>
          </DialogTitle>
          <DialogContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <TextField
                fullWidth
                label="New Password"
                type="password"
                value={passwordFormData.newPassword}
                onChange={(e) => handlePasswordFormChange('newPassword', e.target.value)}
                required
                size="small"
                sx={textFieldStyle}
              />
              <TextField
                fullWidth
                label="Confirm Password"
                type="password"
                value={passwordFormData.confirmPassword}
                onChange={(e) => handlePasswordFormChange('confirmPassword', e.target.value)}
                required
                size="small"
                sx={textFieldStyle}
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ 
            p: 3,
            borderTop: theme === 'dark' ? '1px solid #334155' : '1px solid #e5e7eb',
            backgroundColor: theme === 'dark' ? '#0f172a' : 'white'
          }}>
            <Button 
              onClick={() => setOpenPasswordDialog(false)}
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
              onClick={handleChangePassword}
              variant="contained"
              disabled={!passwordFormData.newPassword || !passwordFormData.confirmPassword}
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
              Change Password
            </Button>
          </DialogActions>
        </Dialog>

        {/* View User Dialog */}
        <Dialog 
          open={openViewDialog} 
          onClose={() => setOpenViewDialog(false)} 
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
          {selectedUser && (
            <>
              <DialogTitle sx={{ 
                background: theme === 'dark'
                  ? 'linear-gradient(135deg, #00ffff, #00b3b3)'
                  : 'linear-gradient(135deg, #007bff, #0056b3)',
                color: 'white',
                py: 3
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar
                    sx={{ 
                      width: 50, 
                      height: 50,
                      bgcolor: getAvatarColor(selectedUser._id),
                      fontSize: '1.2rem',
                      fontWeight: 'bold'
                    }}
                  >
                    {getUserInitials(selectedUser)}
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      {selectedUser.name}
                    </Typography>
                  </Box>
                </Box>
              </DialogTitle>
              <DialogContent sx={{ p: 3, overflowY: 'auto' }}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <Box sx={{ pt: 3, pb: 2 }}>
                    {/* Profile Header */}
                    <Card sx={{ 
                      mb: 3, 
                      borderRadius: 2,
                      backgroundColor: theme === 'dark' ? '#1e293b' : '#f8f9fa',
                    }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 3 }}>
                          <Box sx={{ 
                            display: 'flex', 
                            flexDirection: 'column', 
                            alignItems: 'center',
                            flex: 1 
                          }}>
                            <Avatar
                              sx={{ 
                                width: 100, 
                                height: 100,
                                mb: 2,
                                border: '4px solid white',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                bgcolor: getAvatarColor(selectedUser._id),
                                fontSize: '2.5rem',
                                fontWeight: 'bold'
                              }}
                            >
                              {getUserInitials(selectedUser)}
                            </Avatar>
                            <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
                              <Chip
                                label={selectedUser.isActive ? 'Active' : 'Blocked'}
                                color={getStatusColor(selectedUser.isActive)}
                                size="small"
                              />
                              <Chip
                                label={selectedUser.role}
                                icon={getRoleIcon(selectedUser.role)}
                                color={getRoleColor(selectedUser.role)}
                                size="small"
                              />
                            </Box>
                          </Box>

                          <Box sx={{ flex: 2 }}>
                            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', color: theme === 'dark' ? '#ccd6f6' : '#2c3e50' }}>
                              {selectedUser.name}
                            </Typography>
                            
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                              <Box>
                                <Typography variant="caption" color={theme === 'dark' ? '#a8b2d1' : '#666666'} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                                  <Email fontSize="small" /> Email
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 'medium', color: theme === 'dark' ? '#ccd6f6' : '#333333' }}>
                                  {selectedUser.email}
                                </Typography>
                              </Box>
                              <Box>
                                <Typography variant="caption" color={theme === 'dark' ? '#a8b2d1' : '#666666'} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                                  <Phone fontSize="small" /> Phone
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 'medium', color: theme === 'dark' ? '#ccd6f6' : '#333333' }}>
                                  {selectedUser.phone}
                                </Typography>
                              </Box>
                            </Box>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>

                    {/* User Information */}
                    <Card sx={{ 
                      mb: 3, 
                      borderRadius: 2, 
                      boxShadow: theme === 'dark' 
                        ? '0 2px 8px rgba(0,0,0,0.3)' 
                        : '0 2px 8px rgba(0,0,0,0.1)',
                      backgroundColor: theme === 'dark' ? '#0f172a80' : 'white'
                    }}>
                      <CardContent>
                        <Typography variant="h6" sx={{ 
                          mb: 2, 
                          fontWeight: 'bold',
                          color: theme === 'dark' ? '#ccd6f6' : '#333333',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1
                        }}>
                          <Person /> User Information
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                          <Box sx={{ minWidth: isMobile ? '100%' : '200px', flex: 1 }}>
                            <Typography variant="caption" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                              Role
                            </Typography>
                            <Box sx={{ mt: 0.5 }}>
                              <Chip
                                icon={getRoleIcon(selectedUser.role)}
                                label={selectedUser.role}
                                color={getRoleColor(selectedUser.role)}
                                size="medium"
                              />
                            </Box>
                          </Box>
                          <Box sx={{ minWidth: isMobile ? '100%' : '200px', flex: 1 }}>
                            <Typography variant="caption" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                              Status
                            </Typography>
                            <Box sx={{ mt: 0.5 }}>
                              <Chip
                                label={selectedUser.isActive ? 'Active' : 'Blocked'}
                                color={getStatusColor(selectedUser.isActive)}
                                size="medium"
                              />
                            </Box>
                          </Box>
                          {selectedUser.background && (
                            <Box sx={{ width: '100%', mt: 2 }}>
                              <Typography variant="caption" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                                Background
                              </Typography>
                              <Typography variant="body2" sx={{ mt: 0.5, color: theme === 'dark' ? '#a8b2d1' : '#666666' }}>
                                {selectedUser.background}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      </CardContent>
                    </Card>

                    {/* System Information */}
                    <Card sx={{ 
                      borderRadius: 2, 
                      boxShadow: theme === 'dark' 
                        ? '0 2px 8px rgba(0,0,0,0.3)' 
                        : '0 2px 8px rgba(0,0,0,0.1)',
                      backgroundColor: theme === 'dark' ? '#0f172a80' : 'white'
                    }}>
                      <CardContent>
                        <Typography variant="h6" sx={{ 
                          mb: 2, 
                          fontWeight: 'bold',
                          color: theme === 'dark' ? '#ccd6f6' : '#333333',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1
                        }}>
                          <AccessTime /> System Information
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                          <Box sx={{ minWidth: isMobile ? '100%' : '200px', flex: 1 }}>
                            <Typography variant="caption" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                              Created Date
                            </Typography>
                            <Typography variant="body1" sx={{ fontWeight: 'medium', color: theme === 'dark' ? '#ccd6f6' : '#333333' }}>
                              {formatDate(selectedUser.createdAt)}
                            </Typography>
                          </Box>
                          <Box sx={{ minWidth: isMobile ? '100%' : '200px', flex: 1 }}>
                            <Typography variant="caption" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                              Last Updated
                            </Typography>
                            <Typography variant="body1" sx={{ fontWeight: 'medium', color: theme === 'dark' ? '#ccd6f6' : '#333333' }}>
                              {formatDate(selectedUser.updatedAt)}
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
                    handleOpenEditDialog(selectedUser);
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
                  Edit User
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
              Are you sure you want to delete user <strong style={{color: theme === 'dark' ? '#ff0000' : '#dc3545'}}>{selectedUser?.name}</strong>? 
              This action cannot be undone.
            </Typography>
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
              onClick={handleDeleteUser} 
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
              Delete
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

export default UsersPage;