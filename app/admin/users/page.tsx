'use client';

import { useState, useEffect } from 'react';
import type { ReactElement } from 'react';
import {
  Box, Typography, Card, CardContent,
  TextField, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow,
  Chip, Alert, Snackbar, CircularProgress,
  useMediaQuery, Pagination,
  MenuItem, Select, FormControl, InputLabel,
  IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, Button, Avatar, Divider,
  Checkbox, FormGroup, FormControlLabel, Tooltip
} from '@mui/material';
import { motion } from 'framer-motion';
import { useTheme } from '@/lib/theme-context';
import { useLanguage } from '@/lib/language-context';
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
  SupervisorAccount, Search,
  Security as SecurityIcon,
} from '@mui/icons-material';
import api from '@/app/utils/api';
import { resolveIcon } from '@/lib/icon-map';
import type { MenuDoc, Role } from '@/lib/menu-types';

// ─── Types ───────────────────────────────────────────────────────────
interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  background?: string;
  role: Role;
  isActive: boolean;
  permissions?: MenuDoc[];
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

// ─── Role options ────────────────────────────────────────────────────
const ROLE_OPTIONS: { value: Role; label: string; icon: React.ReactNode }[] = [
  { value: 'user',       label: 'User',       icon: <Person /> },
  { value: 'customer',   label: 'Customer',   icon: <PersonPin /> },
  { value: 'manager',    label: 'Manager',    icon: <SupervisorAccount /> },
  { value: 'accountant', label: 'Accountant', icon: <AccountCircle /> },
  { value: 'admin',      label: 'Admin',      icon: <AdminPanelSettings /> },
  { value: 'owner',      label: 'Owner',      icon: <Business /> },
  { value: 'agent',      label: 'Agent',      icon: <Handshake /> },
];

const UsersPage = () => {
  const { theme } = useTheme();
  const { t, isAmharic } = useLanguage();
  const isMobile = useMediaQuery('(max-width: 768px)');

  // ─── List state ────────────────────────────────────────────────
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
    hasPrev: false,
  });

  // ─── Filters ───────────────────────────────────────────────────
  const [filters, setFilters] = useState({
    role: '',
    status: '',
    search: '',
    page: 1,
    limit: 10,
  });

  // ─── Dialog state ─────────────────────────────────────────────
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openPasswordDialog, setOpenPasswordDialog] = useState(false);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [openPermissionsDialog, setOpenPermissionsDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  // ─── Forms ────────────────────────────────────────────────────
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    background: '',
    password: '',
    role: 'user' as Role,
  });

  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    phone: '',
    background: '',
    role: 'user' as Role,
  });

  const [passwordFormData, setPasswordFormData] = useState({
    newPassword: '',
    confirmPassword: '',
  });

  // ─── Permissions dialog state ─────────────────────────────────
  const [permissionsUser, setPermissionsUser] = useState<User | null>(null);
  const [allMenus, setAllMenus] = useState<MenuDoc[]>([]);
  const [permissionsChecked, setPermissionsChecked] = useState<Record<string, boolean>>({});
  const [savingPermissions, setSavingPermissions] = useState(false);
  const [permissionsLoading, setPermissionsLoading] = useState(false);

  // ─── Theme styles ─────────────────────────────────────────────
  const textFieldStyle = {
    '& .MuiOutlinedInput-root': {
      backgroundColor: theme === 'dark' ? '#1e293b' : 'white',
      color: theme === 'dark' ? '#ccd6f6' : '#333333',
      '& fieldset': { borderColor: theme === 'dark' ? '#334155' : '#e5e7eb' },
      '&:hover fieldset': { borderColor: theme === 'dark' ? '#00ffff' : '#007bff' },
      '&.Mui-focused fieldset': { borderColor: theme === 'dark' ? '#00ffff' : '#007bff' },
    },
    '& .MuiInputLabel-root': { color: theme === 'dark' ? '#a8b2d1' : '#666666' },
    '& .MuiInputLabel-root.Mui-focused': { color: theme === 'dark' ? '#00ffff' : '#007bff' },
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
    },
  };

  const labelStyle = {
    color: theme === 'dark' ? '#a8b2d1' : '#666666',
    '&.Mui-focused': { color: theme === 'dark' ? '#00ffff' : '#007bff' },
  };

  // ─── Effects ──────────────────────────────────────────────────
  useEffect(() => {
    fetchUsers();
    fetchStats();
  }, [filters.page, filters.limit, filters.role, filters.status, filters.search]);

  // ─── API ──────────────────────────────────────────────────────
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
      setPagination(
        response.data.data.pagination || {
          currentPage: 1,
          totalPages: 1,
          totalUsers: 0,
          hasNext: false,
          hasPrev: false,
        }
      );
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch users');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/user/stats');
      setStats(response.data.data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  // ─── CRUD handlers ────────────────────────────────────────────
  const handleCreateUser = async () => {
    try {
      await api.post('/user/register', formData);
      setSuccess('User created successfully');
      setOpenAddDialog(false);
      setFormData({ name: '', email: '', phone: '', background: '', password: '', role: 'user' });
      fetchUsers();
      fetchStats();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create user');
    }
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;
    try {
      await api.put(`/user/${selectedUser._id}`, editFormData);
      setSuccess('User updated successfully');
      setOpenEditDialog(false);
      fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update user');
    }
  };

  const handleStatusUpdate = async (userId: string, isActive: boolean) => {
    try {
      await api.patch(`/user/${userId}/status`, { isActive });
      setSuccess(`User ${isActive ? 'activated' : 'blocked'} successfully`);
      fetchUsers();
      fetchStats();
    } catch {
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
        newPassword: passwordFormData.newPassword,
      });
      setSuccess('Password changed successfully');
      setOpenPasswordDialog(false);
      setPasswordFormData({ newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to change password');
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
    } catch {
      setError('Failed to delete user');
    }
  };

  // ─── Dialog openers ───────────────────────────────────────────
  const handleOpenAddDialog = () => {
    setFormData({ name: '', email: '', phone: '', background: '', password: '', role: 'user' });
    setOpenAddDialog(true);
  };

  const handleOpenEditDialog = (user: User) => {
    setSelectedUser(user);
    setEditFormData({
      name: user.name,
      email: user.email,
      phone: user.phone,
      background: user.background || '',
      role: user.role,
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

  // ─── Permissions dialog handlers ──────────────────────────────
  const handleOpenPermissionsDialog = async (user: User) => {
    setPermissionsUser(user);
    setPermissionsLoading(true);
    setOpenPermissionsDialog(true);
    setPermissionsChecked({});
    try {
      const res = await api.get('/menu');
      const menus: MenuDoc[] = res.data.data || [];
      setAllMenus(menus);

      const candidateIds = new Set(
        menus.filter((m) => m.allowedRoles.includes(user.role)).map((m) => m._id)
      );

      const initial: Record<string, boolean> = {};
      for (const m of menus) {
        if (!candidateIds.has(m._id)) continue;
        initial[m._id] = !!(user.permissions ?? []).some((p) => p._id === m._id);
      }
      setPermissionsChecked(initial);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load menus');
      setOpenPermissionsDialog(false);
    } finally {
      setPermissionsLoading(false);
    }
  };

  const togglePermission = (menuId: string) => {
    setPermissionsChecked((prev) => ({ ...prev, [menuId]: !prev[menuId] }));
  };

  const handleSelectAllPermissions = () => {
    const all: Record<string, boolean> = {};
    for (const id of Object.keys(permissionsChecked)) all[id] = true;
    setPermissionsChecked(all);
  };

  const handleClearAllPermissions = () => {
    const cleared: Record<string, boolean> = {};
    for (const id of Object.keys(permissionsChecked)) cleared[id] = false;
    setPermissionsChecked(cleared);
  };

  const handleSavePermissions = async () => {
    if (!permissionsUser) return;
    setSavingPermissions(true);
    try {
      const selectedIds = Object.entries(permissionsChecked)
        .filter(([, checked]) => checked)
        .map(([id]) => id);

      await api.put(`/user/${permissionsUser._id}/permissions`, {
        permissions: selectedIds,
      });

      setSuccess('Permissions updated successfully');
      setOpenPermissionsDialog(false);
      fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update permissions');
    } finally {
      setSavingPermissions(false);
    }
  };

  // ─── Filters/helpers ──────────────────────────────────────────
  const handleFilterChange = (field: string, value: string | number) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
      ...(field !== 'page' && { page: 1 }),
    }));
  };

  const handlePageChange = (_: React.ChangeEvent<unknown>, value: number) => {
    handleFilterChange('page', value);
  };

  const handleFormChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleEditFormChange = (field: string, value: string) => {
    setEditFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handlePasswordFormChange = (field: string, value: string) => {
    setPasswordFormData((prev) => ({ ...prev, [field]: value }));
  };

  const resetFilters = () => {
    setFilters({ role: '', status: '', search: '', page: 1, limit: 10 });
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
      minute: '2-digit',
    });
  };

  const getRoleColor = (
    role: string
  ): 'primary' | 'secondary' | 'success' | 'warning' | 'info' | 'error' | 'default' => {
    const roleColors: Record<string, any> = {
      admin: 'error',
      accountant: 'warning',
      manager: 'info',
      customer: 'primary',
      owner: 'secondary',
      agent: 'success',
      user: 'default',
    };
    return roleColors[role] || 'default';
  };

  const getStatusColor = (isActive: boolean) => (isActive ? 'success' : 'error');

  const getRoleIcon = (role: string): ReactElement => {
    const opt = ROLE_OPTIONS.find((r) => r.value === role);
    return (opt?.icon as ReactElement) ?? <Person />;
  };

  const getAvatarColor = (userId: string) => {
    const colors = [
      '#1976d2', '#2e7d32', '#ed6c02', '#d32f2f', '#7b1fa2',
      '#00796b', '#388e3c', '#f57c00', '#0288d1', '#c2185b',
    ];
    const index =
      userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    return colors[index];
  };

  const getUserInitials = (user: User) => {
    const parts = user.name.split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return user.name.charAt(0).toUpperCase();
  };

  const renderFormSection = (
    title: string,
    icon: React.ReactNode,
    content: React.ReactNode
  ) => (
    <Box sx={{ mb: 3 }}>
      <Typography
        variant="h6"
        sx={{
          color: theme === 'dark' ? '#00ffff' : '#007bff',
          mb: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        {icon} {title}
      </Typography>
      {content}
      <Divider sx={{ mt: 2 }} />
    </Box>
  );

  // ─── Render ───────────────────────────────────────────────────
  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        theme === 'dark'
          ? 'bg-gradient-to-br from-[#0a192f] to-[#112240] text-white'
          : 'bg-gradient-to-br from-[#f0f0f0] to-[#ffffff] text-[#333333]'
      }`}
    >
      <Box sx={{ py: 3, px: { xs: 2, sm: 3, md: 4 } }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Box sx={{ mb: 4 }}>
            <Typography
              variant={isMobile ? 'h5' : 'h4'}
              sx={{
                fontWeight: 'bold',
                color: theme === 'dark' ? '#ccd6f6' : '#333333',
                mb: 1,
              }}
            >
              {t('dashboard.user_management', 'User Management')}
            </Typography>
            <Typography
              variant={isMobile ? 'body2' : 'body1'}
              color={theme === 'dark' ? '#a8b2d1' : '#666666'}
            >
              {isAmharic ? 'የስርዓት ተጠቃሚዎችን፣ ሚናዎችን እና ፈቃዶችን ያስተዳድሩ' : 'Manage system users, roles, and permissions'}
            </Typography>
          </Box>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
              gap: 3,
              mb: 4,
            }}
          >
            {[
              {
                title: t('dashboard.total_users', 'Total Users'),
                value: stats?.totalUsers || 0,
                icon: <People sx={{ fontSize: 28 }} />,
                color: '#3b82f6',
              },
              {
                title: t('dashboard.active_users', 'Active Users'),
                value: stats?.activeUsers || 0,
                icon: <CheckCircle sx={{ fontSize: 28 }} />,
                color: '#10b981',
              },
              {
                title: t('dashboard.blocked_users', 'Blocked Users'),
                value: stats?.blockedUsers || 0,
                icon: <Block sx={{ fontSize: 28 }} />,
                color: '#ef4444',
              },
              {
                title: t('dashboard.role_types', 'Role Types'),
                value: stats?.roles?.length || 0,
                icon: <Category sx={{ fontSize: 28 }} />,
                color: '#8b5cf6',
              },
            ].map((stat, index) => (
              <Card
                key={index}
                sx={{
                  borderRadius: 2,
                  boxShadow:
                    theme === 'dark'
                      ? '0 2px 8px rgba(0,0,0,0.3)'
                      : '0 2px 8px rgba(0,0,0,0.1)',
                  borderLeft: `4px solid ${stat.color}`,
                  backgroundColor: theme === 'dark' ? '#0f172a80' : 'white',
                  height: '100%',
                  backdropFilter: theme === 'dark' ? 'blur(10px)' : 'none',
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 48,
                        height: 48,
                        borderRadius: '50%',
                        bgcolor:
                          theme === 'dark' ? `${stat.color}20` : `${stat.color}10`,
                        mr: 2,
                      }}
                    >
                      <Box sx={{ color: stat.color }}>{stat.icon}</Box>
                    </Box>
                    <Box>
                      <Typography
                        variant="body2"
                        color={theme === 'dark' ? '#a8b2d1' : '#666666'}
                        sx={{ fontWeight: 500 }}
                      >
                        {stat.title}
                      </Typography>
                      <Typography
                        variant="h4"
                        sx={{
                          fontWeight: 'bold',
                          color: theme === 'dark' ? '#ccd6f6' : '#333333',
                          fontSize: { xs: '1.75rem', md: '2rem' },
                        }}
                      >
                        {stat.value}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card
            sx={{
              mb: 4,
              borderRadius: 2,
              boxShadow:
                theme === 'dark'
                  ? '0 4px 12px rgba(0,0,0,0.3)'
                  : '0 4px 12px rgba(0,0,0,0.08)',
              backgroundColor: theme === 'dark' ? '#0f172a80' : 'white',
              backdropFilter: theme === 'dark' ? 'blur(10px)' : 'none',
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: { xs: 'column', md: 'row' },
                  justifyContent: 'space-between',
                  alignItems: { xs: 'stretch', md: 'center' },
                  gap: 3,
                  mb: 3,
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 'bold',
                    color: theme === 'dark' ? '#ccd6f6' : '#333333',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  <FilterList /> User Filters
                </Typography>

                <Box
                  sx={{
                    display: 'flex',
                    gap: 2,
                    flexDirection: { xs: 'column', sm: 'row' },
                  }}
                >
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
                        backgroundColor: theme === 'dark' ? '#00ffff20' : '#007bff10',
                      },
                    }}
                  >
                    Reset
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<PersonAdd />}
                    onClick={handleOpenAddDialog}
                    sx={{
                      background:
                        theme === 'dark'
                          ? 'linear-gradient(135deg, #00ffff, #00b3b3)'
                          : 'linear-gradient(135deg, #007bff, #0056b3)',
                      borderRadius: 1,
                      '&:hover': {
                        background:
                          theme === 'dark'
                            ? 'linear-gradient(135deg, #00b3b3, #008080)'
                            : 'linear-gradient(135deg, #0056b3, #004080)',
                      },
                    }}
                  >
                    Add User
                  </Button>
                </Box>
              </Box>

              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: '1fr',
                    sm: 'repeat(2, 1fr)',
                    md: 'repeat(4, 1fr)',
                  },
                  gap: 3,
                }}
              >
                <TextField
                  fullWidth
                  size="small"
                  label="Search Users"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  placeholder="Name, email, or phone..."
                  InputProps={{
                    startAdornment: (
                      <Search
                        sx={{
                          color: theme === 'dark' ? '#a8b2d1' : '#666666',
                          mr: 1,
                        }}
                      />
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
                      <Typography
                        variant="body2"
                        color={theme === 'dark' ? '#a8b2d1' : '#666666'}
                      >
                        All Roles
                      </Typography>
                    </MenuItem>
                    {ROLE_OPTIONS.map((role) => (
                      <MenuItem key={role.value} value={role.value}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ color: theme === 'dark' ? '#00ffff' : '#007bff' }}>
                            {role.icon}
                          </Box>
                          <Typography
                            variant="body2"
                            color={theme === 'dark' ? '#ccd6f6' : '#333333'}
                          >
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

        {/* Users list */}
        {loading ? (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: '400px',
            }}
          >
            <CircularProgress
              size={60}
              sx={{ color: theme === 'dark' ? '#00ffff' : '#007bff' }}
            />
          </Box>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            {/* Mobile cards */}
            {isMobile ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {users.map((user) => {
                  const isExpanded = expandedUser === user._id;
                  return (
                    <Card
                      key={user._id}
                      sx={{
                        borderRadius: 2,
                        boxShadow:
                          theme === 'dark'
                            ? '0 2px 8px rgba(0,0,0,0.3)'
                            : '0 2px 8px rgba(0,0,0,0.1)',
                        border: `1px solid ${
                          theme === 'dark' ? '#334155' : '#e5e7eb'
                        }`,
                        backgroundColor: theme === 'dark' ? '#0f172a80' : 'white',
                        backdropFilter: theme === 'dark' ? 'blur(10px)' : 'none',
                      }}
                    >
                      <CardContent sx={{ p: 3 }}>
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            mb: 2,
                          }}
                        >
                          <Box>
                            <Typography
                              variant="subtitle1"
                              sx={{
                                fontWeight: 'bold',
                                color: theme === 'dark' ? '#ccd6f6' : '#333333',
                                mb: 0.5,
                              }}
                            >
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
                          <Email
                            fontSize="small"
                            sx={{ color: theme === 'dark' ? '#a8b2d1' : '#666666' }}
                          />
                          <Typography
                            variant="body2"
                            color={theme === 'dark' ? '#a8b2d1' : '#666666'}
                          >
                            {user.email}
                          </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                          <Phone
                            fontSize="small"
                            sx={{ color: theme === 'dark' ? '#a8b2d1' : '#666666' }}
                          />
                          <Typography
                            variant="body2"
                            color={theme === 'dark' ? '#a8b2d1' : '#666666'}
                          >
                            {user.phone}
                          </Typography>
                        </Box>

                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            mb: 2,
                          }}
                        >
                          <Typography
                            variant="body2"
                            color={theme === 'dark' ? '#a8b2d1' : '#666666'}
                          >
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
                          <Box
                            sx={{
                              pt: 2,
                              borderTop: `1px solid ${
                                theme === 'dark' ? '#334155' : '#e5e7eb'
                              }`,
                              mt: 2,
                            }}
                          >
                            {user.background && (
                              <Box sx={{ mb: 2 }}>
                                <Typography
                                  variant="body2"
                                  color={theme === 'dark' ? '#a8b2d1' : '#666666'}
                                  sx={{ fontWeight: 500, mb: 0.5 }}
                                >
                                  Background:
                                </Typography>
                                <Typography
                                  variant="body2"
                                  color={theme === 'dark' ? '#a8b2d1' : '#666666'}
                                >
                                  {user.background}
                                </Typography>
                              </Box>
                            )}

                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                              <Typography
                                variant="body2"
                                color={theme === 'dark' ? '#a8b2d1' : '#666666'}
                              >
                                Created:
                              </Typography>
                              <Typography
                                variant="body2"
                                color={theme === 'dark' ? '#a8b2d1' : '#666666'}
                              >
                                {formatDate(user.createdAt)}
                              </Typography>
                            </Box>

                            <Box
                              sx={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(2, 1fr)',
                                gap: 1,
                                mt: 2,
                              }}
                            >
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
                                    backgroundColor:
                                      theme === 'dark' ? '#00ffff20' : '#007bff10',
                                  },
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
                                    backgroundColor:
                                      theme === 'dark' ? '#00ffff20' : '#007bff10',
                                  },
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
                                    backgroundColor:
                                      theme === 'dark' ? '#00ffff20' : '#007bff10',
                                  },
                                }}
                              >
                                Password
                              </Button>
                              <Button
                                variant="outlined"
                                startIcon={<SecurityIcon />}
                                onClick={() => handleOpenPermissionsDialog(user)}
                                disabled={user.role === 'admin'}
                                size="small"
                                sx={{
                                  borderRadius: 1,
                                  borderColor:
                                    theme === 'dark' ? '#00ffff' : '#007bff',
                                  color: theme === 'dark' ? '#00ffff' : '#007bff',
                                  '&:hover': {
                                    backgroundColor:
                                      theme === 'dark' ? '#00ffff20' : '#007bff10',
                                  },
                                  '&.Mui-disabled': {
                                    borderColor:
                                      theme === 'dark' ? '#334155' : '#e5e7eb',
                                    color: theme === 'dark' ? '#475569' : '#cbd5e1',
                                  },
                                }}
                              >
                                Permissions
                              </Button>
                              <Button
                                variant="outlined"
                                startIcon={user.isActive ? <Block /> : <CheckCircle />}
                                onClick={() => handleStatusUpdate(user._id, !user.isActive)}
                                size="small"
                                color={user.isActive ? 'error' : 'success'}
                                sx={{
                                  borderRadius: 1,
                                  borderColor: user.isActive
                                    ? theme === 'dark'
                                      ? '#ff0000'
                                      : '#dc3545'
                                    : theme === 'dark'
                                    ? '#00ff00'
                                    : '#28a745',
                                  color: user.isActive
                                    ? theme === 'dark'
                                      ? '#ff0000'
                                      : '#dc3545'
                                    : theme === 'dark'
                                    ? '#00ff00'
                                    : '#28a745',
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
                                  borderColor:
                                    theme === 'dark' ? '#ff0000' : '#dc3545',
                                  color: theme === 'dark' ? '#ff0000' : '#dc3545',
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
              /* Desktop table */
              <Card
                sx={{
                  borderRadius: 2,
                  boxShadow:
                    theme === 'dark'
                      ? '0 4px 12px rgba(0,0,0,0.3)'
                      : '0 4px 12px rgba(0,0,0,0.08)',
                  border: `1px solid ${theme === 'dark' ? '#334155' : '#e5e7eb'}`,
                  backgroundColor: theme === 'dark' ? '#0f172a80' : 'white',
                  backdropFilter: theme === 'dark' ? 'blur(10px)' : 'none',
                }}
              >
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow
                        sx={{
                          background:
                            theme === 'dark'
                              ? 'linear-gradient(135deg, #00ffff, #00b3b3)'
                              : 'linear-gradient(135deg, #007bff, #0056b3)',
                        }}
                      >
                        {['Name', 'Contact', 'Role', 'Status', 'Created', 'Actions'].map(
                          (h) => (
                            <TableCell
                              key={h}
                              sx={{ color: 'white', fontWeight: 'bold', fontSize: '0.875rem', py: 2 }}
                            >
                              {h}
                            </TableCell>
                          )
                        )}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow
                          key={user._id}
                          hover
                          sx={{
                            '&:hover': {
                              backgroundColor:
                                theme === 'dark' ? '#1e293b' : '#f8fafc',
                            },
                          }}
                        >
                          <TableCell sx={{ py: 2.5 }}>
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: 500,
                                color: theme === 'dark' ? '#ccd6f6' : '#333333',
                              }}
                            >
                              {user.name}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ py: 2.5 }}>
                            <Box>
                              <Typography
                                variant="body2"
                                color={theme === 'dark' ? '#a8b2d1' : '#666666'}
                              >
                                {user.email}
                              </Typography>
                              <Typography
                                variant="body2"
                                color={theme === 'dark' ? '#94a3b8' : '#999999'}
                                sx={{ fontSize: '0.75rem' }}
                              >
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
                              sx={{ height: 24, fontSize: '0.75rem' }}
                            />
                          </TableCell>
                          <TableCell sx={{ py: 2.5 }}>
                            <Chip
                              label={user.isActive ? 'Active' : 'Blocked'}
                              color={getStatusColor(user.isActive)}
                              size="small"
                              sx={{ height: 24, fontSize: '0.75rem' }}
                            />
                          </TableCell>
                          <TableCell sx={{ py: 2.5 }}>
                            <Typography
                              variant="body2"
                              color={theme === 'dark' ? '#a8b2d1' : '#666666'}
                            >
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
                                    backgroundColor:
                                      theme === 'dark' ? '#00ffff20' : '#007bff10',
                                  },
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
                                    backgroundColor:
                                      theme === 'dark' ? '#00ffff20' : '#007bff10',
                                  },
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
                                    backgroundColor:
                                      theme === 'dark' ? '#00ffff20' : '#007bff10',
                                  },
                                }}
                              >
                                <Lock fontSize="small" />
                              </IconButton>
                              <Tooltip
                                title={
                                  user.role === 'admin'
                                    ? 'Admins bypass permissions'
                                    : 'Manage Permissions'
                                }
                              >
                                <span>
                                  <IconButton
                                    size="small"
                                    disabled={user.role === 'admin'}
                                    onClick={() => handleOpenPermissionsDialog(user)}
                                    sx={{
                                      color: theme === 'dark' ? '#00ffff' : '#007bff',
                                      '&:hover': {
                                        backgroundColor:
                                          theme === 'dark' ? '#00ffff20' : '#007bff10',
                                      },
                                      '&.Mui-disabled': {
                                        color:
                                          theme === 'dark' ? '#475569' : '#cbd5e1',
                                      },
                                    }}
                                  >
                                    <SecurityIcon fontSize="small" />
                                  </IconButton>
                                </span>
                              </Tooltip>
                              <IconButton
                                size="small"
                                onClick={() => handleStatusUpdate(user._id, !user.isActive)}
                                sx={{
                                  color: user.isActive
                                    ? theme === 'dark'
                                      ? '#ff0000'
                                      : '#dc3545'
                                    : theme === 'dark'
                                    ? '#00ff00'
                                    : '#28a745',
                                  '&:hover': {
                                    backgroundColor: user.isActive
                                      ? theme === 'dark'
                                        ? '#ff000020'
                                        : '#dc354510'
                                      : theme === 'dark'
                                      ? '#00ff0020'
                                      : '#28a74510',
                                  },
                                }}
                              >
                                {user.isActive ? (
                                  <Block fontSize="small" />
                                ) : (
                                  <CheckCircle fontSize="small" />
                                )}
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
                                    backgroundColor:
                                      theme === 'dark' ? '#ff000020' : '#dc354510',
                                  },
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
                  <Box sx={{ textAlign: 'center', py: 8, px: 2 }}>
                    <People
                      sx={{
                        fontSize: 64,
                        color: theme === 'dark' ? '#334155' : '#cbd5e1',
                        mb: 2,
                      }}
                    />
                    <Typography
                      variant="h6"
                      color={theme === 'dark' ? '#a8b2d1' : '#666666'}
                      sx={{ mb: 1 }}
                    >
                      No users found
                    </Typography>
                    <Typography
                      variant="body2"
                      color={theme === 'dark' ? '#94a3b8' : '#999999'}
                    >
                      Try adjusting your filters or add a new user
                    </Typography>
                  </Box>
                )}
              </Card>
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  mt: 4,
                  flexDirection: { xs: 'column', sm: 'row' },
                  gap: 2,
                }}
              >
                <Pagination
                  count={pagination.totalPages}
                  page={filters.page}
                  onChange={handlePageChange}
                  color="primary"
                  size={isMobile ? 'small' : 'medium'}
                  showFirstButton
                  showLastButton
                  sx={{
                    '& .MuiPaginationItem-root': {
                      borderRadius: 1,
                      color: theme === 'dark' ? '#ccd6f6' : '#333333',
                      '&.Mui-selected': {
                        backgroundColor:
                          theme === 'dark' ? '#00ffff' : '#007bff',
                        color: theme === 'dark' ? '#0a192f' : 'white',
                      },
                      '&:hover': {
                        backgroundColor:
                          theme === 'dark' ? '#00ffff20' : '#007bff10',
                      },
                    },
                  }}
                />
                <Typography
                  variant="body2"
                  color={theme === 'dark' ? '#a8b2d1' : '#666666'}
                >
                  Showing {(filters.page - 1) * filters.limit + 1} to{' '}
                  {Math.min(filters.page * filters.limit, pagination.totalUsers)} of{' '}
                  {pagination.totalUsers} users
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
              color: theme === 'dark' ? '#ccd6f6' : '#333333',
            },
          }}
        >
          <DialogTitle
            sx={{
              backgroundColor: theme === 'dark' ? '#0f172a' : 'white',
              borderBottom: `1px solid ${theme === 'dark' ? '#334155' : '#e5e7eb'}`,
              py: 3,
            }}
          >
            <Typography
              variant="h6"
              sx={{ fontWeight: 'bold', color: theme === 'dark' ? '#ccd6f6' : '#333333' }}
            >
              Add New User
            </Typography>
          </DialogTitle>
          <DialogContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {renderFormSection(
                'User Information',
                <Person />,
                <>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                        gap: 2,
                      }}
                    >
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
                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                        gap: 2,
                      }}
                    >
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

              {renderFormSection(
                'Background Information',
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

              {renderFormSection(
                'Role Information',
                <AdminPanelSettings />,
                <FormControl fullWidth size="small">
                  <InputLabel sx={labelStyle}>Role</InputLabel>
                  <Select
                    value={formData.role}
                    label="Role"
                    onChange={(e) => handleFormChange('role', e.target.value as Role)}
                    required
                    sx={selectStyle}
                  >
                    {ROLE_OPTIONS.map((role) => (
                      <MenuItem key={role.value} value={role.value}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ color: theme === 'dark' ? '#00ffff' : '#007bff' }}>
                            {role.icon}
                          </Box>
                          <Typography
                            variant="body2"
                            color={theme === 'dark' ? '#ccd6f6' : '#333333'}
                          >
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
          <DialogActions
            sx={{
              p: 3,
              borderTop: `1px solid ${theme === 'dark' ? '#334155' : '#e5e7eb'}`,
              backgroundColor: theme === 'dark' ? '#0f172a' : 'white',
            }}
          >
            <Button
              onClick={() => setOpenAddDialog(false)}
              sx={{
                color: theme === 'dark' ? '#00ffff' : '#007bff',
                '&:hover': {
                  backgroundColor: theme === 'dark' ? '#00ffff20' : '#007bff10',
                },
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateUser}
              variant="contained"
              disabled={
                !formData.name || !formData.email || !formData.phone || !formData.password
              }
              sx={{
                background:
                  theme === 'dark'
                    ? 'linear-gradient(135deg, #00ffff, #00b3b3)'
                    : 'linear-gradient(135deg, #007bff, #0056b3)',
                borderRadius: 1,
                '&.Mui-disabled': {
                  background: theme === 'dark' ? '#334155' : '#e5e7eb',
                  color: theme === 'dark' ? '#94a3b8' : '#94a3b8',
                },
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
              color: theme === 'dark' ? '#ccd6f6' : '#333333',
            },
          }}
        >
          <DialogTitle
            sx={{
              backgroundColor: theme === 'dark' ? '#0f172a' : 'white',
              borderBottom: `1px solid ${theme === 'dark' ? '#334155' : '#e5e7eb'}`,
              py: 3,
            }}
          >
            <Typography
              variant="h6"
              sx={{ fontWeight: 'bold', color: theme === 'dark' ? '#ccd6f6' : '#333333' }}
            >
              Edit User - {selectedUser?.name}
            </Typography>
          </DialogTitle>
          <DialogContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {renderFormSection(
                'User Information',
                <Person />,
                <>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                        gap: 2,
                      }}
                    >
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
                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                        gap: 2,
                      }}
                    >
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

              {renderFormSection(
                'Background Information',
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

              {renderFormSection(
                'Role Information',
                <AdminPanelSettings />,
                <FormControl fullWidth size="small">
                  <InputLabel sx={labelStyle}>Role</InputLabel>
                  <Select
                    value={editFormData.role}
                    label="Role"
                    onChange={(e) => handleEditFormChange('role', e.target.value as Role)}
                    required
                    sx={selectStyle}
                  >
                    {ROLE_OPTIONS.map((role) => (
                      <MenuItem key={role.value} value={role.value}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ color: theme === 'dark' ? '#00ffff' : '#007bff' }}>
                            {role.icon}
                          </Box>
                          <Typography
                            variant="body2"
                            color={theme === 'dark' ? '#ccd6f6' : '#333333'}
                          >
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
          <DialogActions
            sx={{
              p: 3,
              borderTop: `1px solid ${theme === 'dark' ? '#334155' : '#e5e7eb'}`,
              backgroundColor: theme === 'dark' ? '#0f172a' : 'white',
            }}
          >
            <Button
              onClick={() => setOpenEditDialog(false)}
              sx={{
                color: theme === 'dark' ? '#00ffff' : '#007bff',
                '&:hover': {
                  backgroundColor: theme === 'dark' ? '#00ffff20' : '#007bff10',
                },
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateUser}
              variant="contained"
              sx={{
                background:
                  theme === 'dark'
                    ? 'linear-gradient(135deg, #00ffff, #00b3b3)'
                    : 'linear-gradient(135deg, #007bff, #0056b3)',
                borderRadius: 1,
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
              color: theme === 'dark' ? '#ccd6f6' : '#333333',
            },
          }}
        >
          <DialogTitle
            sx={{
              backgroundColor: theme === 'dark' ? '#0f172a' : 'white',
              borderBottom: `1px solid ${theme === 'dark' ? '#334155' : '#e5e7eb'}`,
              py: 3,
            }}
          >
            <Typography
              variant="h6"
              sx={{ fontWeight: 'bold', color: theme === 'dark' ? '#ccd6f6' : '#333333' }}
            >
              Change Password - {selectedUser?.name}
            </Typography>
          </DialogTitle>
          <DialogContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
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
          <DialogActions
            sx={{
              p: 3,
              borderTop: `1px solid ${theme === 'dark' ? '#334155' : '#e5e7eb'}`,
              backgroundColor: theme === 'dark' ? '#0f172a' : 'white',
            }}
          >
            <Button
              onClick={() => setOpenPasswordDialog(false)}
              sx={{
                color: theme === 'dark' ? '#00ffff' : '#007bff',
                '&:hover': {
                  backgroundColor: theme === 'dark' ? '#00ffff20' : '#007bff10',
                },
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleChangePassword}
              variant="contained"
              disabled={!passwordFormData.newPassword || !passwordFormData.confirmPassword}
              sx={{
                background:
                  theme === 'dark'
                    ? 'linear-gradient(135deg, #00ffff, #00b3b3)'
                    : 'linear-gradient(135deg, #007bff, #0056b3)',
                borderRadius: 1,
                '&.Mui-disabled': {
                  background: theme === 'dark' ? '#334155' : '#e5e7eb',
                  color: theme === 'dark' ? '#94a3b8' : '#94a3b8',
                },
              }}
            >
              Change Password
            </Button>
          </DialogActions>
        </Dialog>

        {/* ─── Manage Permissions Dialog ─── */}
        <Dialog
          open={openPermissionsDialog}
          onClose={() => !savingPermissions && setOpenPermissionsDialog(false)}
          maxWidth="md"
          fullWidth
          fullScreen={isMobile}
          PaperProps={{
            sx: {
              borderRadius: 2,
              backgroundColor: theme === 'dark' ? '#0f172a' : 'white',
              color: theme === 'dark' ? '#ccd6f6' : '#333333',
              maxHeight: '90vh',
            },
          }}
        >
          <DialogTitle
            sx={{
              borderBottom: `1px solid ${theme === 'dark' ? '#334155' : '#e5e7eb'}`,
              py: 2,
              backgroundColor: theme === 'dark' ? '#0f172a' : 'white',
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              Manage Permissions — {permissionsUser?.name}
            </Typography>
            <Typography
              variant="caption"
              color={theme === 'dark' ? '#a8b2d1' : '#666666'}
            >
              Role: <strong>{permissionsUser?.role}</strong>. Only menus this role can access
              are shown.
            </Typography>
          </DialogTitle>

          <DialogContent sx={{ p: 3, overflowY: 'auto' }}>
            {permissionsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                <CircularProgress
                  sx={{ color: theme === 'dark' ? '#00ffff' : '#007bff' }}
                />
              </Box>
            ) : (
              <>
                <Box sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'center' }}>
                  <Button size="small" onClick={handleSelectAllPermissions}>
                    Select all
                  </Button>
                  <Button size="small" onClick={handleClearAllPermissions}>
                    Clear all
                  </Button>
                  <Box sx={{ flex: 1 }} />
                  <Typography variant="caption" sx={{ opacity: 0.7 }}>
                    {Object.values(permissionsChecked).filter(Boolean).length} /{' '}
                    {Object.keys(permissionsChecked).length} selected
                  </Typography>
                </Box>

                {(() => {
                  const eligible = allMenus
                    .filter(
                      (m) =>
                        permissionsUser &&
                        m.allowedRoles.includes(permissionsUser.role)
                    )
                    .sort((a, b) => a.order - b.order);

                  if (eligible.length === 0) {
                    return (
                      <Typography
                        sx={{ textAlign: 'center', py: 4, opacity: 0.7 }}
                      >
                        No menus are available for the{' '}
                        <strong>{permissionsUser?.role}</strong> role.
                      </Typography>
                    );
                  }

                  return (
                    <FormGroup>
                      {eligible.map((menu) => {
                        const Icon = resolveIcon(menu.icon);
                        return (
                          <FormControlLabel
                            key={menu._id}
                            sx={{
                              mb: 0.5,
                              borderRadius: 1,
                              px: 1,
                              '&:hover': {
                                backgroundColor:
                                  theme === 'dark' ? '#1e293b' : '#f8fafc',
                              },
                            }}
                            control={
                              <Checkbox
                                checked={!!permissionsChecked[menu._id]}
                                onChange={() => togglePermission(menu._id)}
                              />
                            }
                            label={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <Icon
                                  className="h-4 w-4"
                                  style={{ opacity: 0.8 }}
                                />
                                <Box>
                                  <Typography
                                    variant="body2"
                                    sx={{ fontWeight: 500 }}
                                  >
                                    {menu.name}
                                  </Typography>
                                  <Typography
                                    variant="caption"
                                    sx={{ opacity: 0.6, fontFamily: 'monospace' }}
                                  >
                                    {menu.href}
                                  </Typography>
                                </Box>
                              </Box>
                            }
                          />
                        );
                      })}
                    </FormGroup>
                  );
                })()}
              </>
            )}
          </DialogContent>

          <DialogActions
            sx={{
              p: 2,
              borderTop: `1px solid ${theme === 'dark' ? '#334155' : '#e5e7eb'}`,
              backgroundColor: theme === 'dark' ? '#0f172a' : 'white',
            }}
          >
            <Button
              onClick={() => setOpenPermissionsDialog(false)}
              disabled={savingPermissions}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleSavePermissions}
              disabled={savingPermissions || permissionsLoading}
              sx={{
                background:
                  theme === 'dark'
                    ? 'linear-gradient(135deg, #00ffff, #00b3b3)'
                    : 'linear-gradient(135deg, #007bff, #0056b3)',
                color: theme === 'dark' ? '#0a192f' : 'white',
                fontWeight: 'bold',
              }}
            >
              {savingPermissions ? 'Saving…' : 'Save Permissions'}
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
              overflow: 'hidden',
            },
          }}
        >
          {selectedUser && (
            <>
              <DialogTitle
                sx={{
                  background:
                    theme === 'dark'
                      ? 'linear-gradient(135deg, #00ffff, #00b3b3)'
                      : 'linear-gradient(135deg, #007bff, #0056b3)',
                  color: 'white',
                  py: 3,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar
                    sx={{
                      width: 50,
                      height: 50,
                      bgcolor: getAvatarColor(selectedUser._id),
                      fontSize: '1.2rem',
                      fontWeight: 'bold',
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
                    {/* Profile card */}
                    <Card
                      sx={{
                        mb: 3,
                        borderRadius: 2,
                        backgroundColor:
                          theme === 'dark' ? '#1e293b' : '#f8f9fa',
                      }}
                    >
                      <CardContent>
                        <Box
                          sx={{
                            display: 'flex',
                            flexDirection: isMobile ? 'column' : 'row',
                            gap: 3,
                          }}
                        >
                          <Box
                            sx={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              flex: 1,
                            }}
                          >
                            <Avatar
                              sx={{
                                width: 100,
                                height: 100,
                                mb: 2,
                                border: '4px solid white',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                bgcolor: getAvatarColor(selectedUser._id),
                                fontSize: '2.5rem',
                                fontWeight: 'bold',
                              }}
                            >
                              {getUserInitials(selectedUser)}
                            </Avatar>
                            <Box
                              sx={{
                                display: 'flex',
                                gap: 1,
                                mb: 1,
                                flexWrap: 'wrap',
                                justifyContent: 'center',
                              }}
                            >
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
                            <Typography
                              variant="h6"
                              sx={{
                                mb: 2,
                                fontWeight: 'bold',
                                color: theme === 'dark' ? '#ccd6f6' : '#2c3e50',
                              }}
                            >
                              {selectedUser.name}
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                              <Box>
                                <Typography
                                  variant="caption"
                                  color={theme === 'dark' ? '#a8b2d1' : '#666666'}
                                  sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 0.5,
                                    mb: 0.5,
                                  }}
                                >
                                  <Email fontSize="small" /> Email
                                </Typography>
                                <Typography
                                  variant="body2"
                                  sx={{
                                    fontWeight: 'medium',
                                    color:
                                      theme === 'dark' ? '#ccd6f6' : '#333333',
                                  }}
                                >
                                  {selectedUser.email}
                                </Typography>
                              </Box>
                              <Box>
                                <Typography
                                  variant="caption"
                                  color={theme === 'dark' ? '#a8b2d1' : '#666666'}
                                  sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 0.5,
                                    mb: 0.5,
                                  }}
                                >
                                  <Phone fontSize="small" /> Phone
                                </Typography>
                                <Typography
                                  variant="body2"
                                  sx={{
                                    fontWeight: 'medium',
                                    color:
                                      theme === 'dark' ? '#ccd6f6' : '#333333',
                                  }}
                                >
                                  {selectedUser.phone}
                                </Typography>
                              </Box>
                            </Box>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>

                    {/* User info */}
                    <Card
                      sx={{
                        mb: 3,
                        borderRadius: 2,
                        boxShadow:
                          theme === 'dark'
                            ? '0 2px 8px rgba(0,0,0,0.3)'
                            : '0 2px 8px rgba(0,0,0,0.1)',
                        backgroundColor: theme === 'dark' ? '#0f172a80' : 'white',
                      }}
                    >
                      <CardContent>
                        <Typography
                          variant="h6"
                          sx={{
                            mb: 2,
                            fontWeight: 'bold',
                            color: theme === 'dark' ? '#ccd6f6' : '#333333',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                          }}
                        >
                          <Person /> User Information
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                          <Box
                            sx={{
                              minWidth: isMobile ? '100%' : '200px',
                              flex: 1,
                            }}
                          >
                            <Typography
                              variant="caption"
                              color={theme === 'dark' ? '#a8b2d1' : '#666666'}
                            >
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
                          <Box
                            sx={{
                              minWidth: isMobile ? '100%' : '200px',
                              flex: 1,
                            }}
                          >
                            <Typography
                              variant="caption"
                              color={theme === 'dark' ? '#a8b2d1' : '#666666'}
                            >
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
                              <Typography
                                variant="caption"
                                color={theme === 'dark' ? '#a8b2d1' : '#666666'}
                              >
                                Background
                              </Typography>
                              <Typography
                                variant="body2"
                                sx={{
                                  mt: 0.5,
                                  color:
                                    theme === 'dark' ? '#a8b2d1' : '#666666',
                                }}
                              >
                                {selectedUser.background}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      </CardContent>
                    </Card>

                    {/* Permissions */}
                    {selectedUser.role !== 'admin' && (
                      <Card
                        sx={{
                          mb: 3,
                          borderRadius: 2,
                          boxShadow:
                            theme === 'dark'
                              ? '0 2px 8px rgba(0,0,0,0.3)'
                              : '0 2px 8px rgba(0,0,0,0.1)',
                          backgroundColor:
                            theme === 'dark' ? '#0f172a80' : 'white',
                        }}
                      >
                        <CardContent>
                          <Typography
                            variant="h6"
                            sx={{
                              mb: 2,
                              fontWeight: 'bold',
                              color: theme === 'dark' ? '#ccd6f6' : '#333333',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                            }}
                          >
                            <SecurityIcon /> Permissions
                          </Typography>
                          {(selectedUser.permissions ?? []).length === 0 ? (
                            <Typography
                              variant="body2"
                              sx={{ opacity: 0.7 }}
                            >
                              No permissions granted yet.
                            </Typography>
                          ) : (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                              {(selectedUser.permissions ?? [])
                                .slice()
                                .sort((a, b) => a.order - b.order)
                                .map((m) => {
                                  const Icon = resolveIcon(m.icon);
                                  return (
                                    <Chip
                                      key={m._id}
                                      icon={<Icon className="h-4 w-4" />}
                                      label={m.name}
                                      size="small"
                                    />
                                  );
                                })}
                            </Box>
                          )}
                        </CardContent>
                      </Card>
                    )}

                    {/* System info */}
                    <Card
                      sx={{
                        borderRadius: 2,
                        boxShadow:
                          theme === 'dark'
                            ? '0 2px 8px rgba(0,0,0,0.3)'
                            : '0 2px 8px rgba(0,0,0,0.1)',
                        backgroundColor: theme === 'dark' ? '#0f172a80' : 'white',
                      }}
                    >
                      <CardContent>
                        <Typography
                          variant="h6"
                          sx={{
                            mb: 2,
                            fontWeight: 'bold',
                            color: theme === 'dark' ? '#ccd6f6' : '#333333',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                          }}
                        >
                          <AccessTime /> System Information
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                          <Box
                            sx={{
                              minWidth: isMobile ? '100%' : '200px',
                              flex: 1,
                            }}
                          >
                            <Typography
                              variant="caption"
                              color={theme === 'dark' ? '#a8b2d1' : '#666666'}
                            >
                              Created Date
                            </Typography>
                            <Typography
                              variant="body1"
                              sx={{
                                fontWeight: 'medium',
                                color: theme === 'dark' ? '#ccd6f6' : '#333333',
                              }}
                            >
                              {formatDate(selectedUser.createdAt)}
                            </Typography>
                          </Box>
                          <Box
                            sx={{
                              minWidth: isMobile ? '100%' : '200px',
                              flex: 1,
                            }}
                          >
                            <Typography
                              variant="caption"
                              color={theme === 'dark' ? '#a8b2d1' : '#666666'}
                            >
                              Last Updated
                            </Typography>
                            <Typography
                              variant="body1"
                              sx={{
                                fontWeight: 'medium',
                                color: theme === 'dark' ? '#ccd6f6' : '#333333',
                              }}
                            >
                              {formatDate(selectedUser.updatedAt)}
                            </Typography>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Box>
                </motion.div>
              </DialogContent>
              <DialogActions
                sx={{
                  p: 3,
                  borderTop: `1px solid ${theme === 'dark' ? '#334155' : '#e5e7eb'}`,
                  backgroundColor: theme === 'dark' ? '#0f172a' : 'white',
                }}
              >
                <Button
                  onClick={() => setOpenViewDialog(false)}
                  sx={{
                    color: theme === 'dark' ? '#00ffff' : '#007bff',
                    '&:hover': {
                      backgroundColor:
                        theme === 'dark' ? '#00ffff20' : '#007bff10',
                    },
                  }}
                >
                  Close
                </Button>
                {selectedUser.role !== 'admin' && (
                  <Button
                    onClick={() => {
                      setOpenViewDialog(false);
                      handleOpenPermissionsDialog(selectedUser);
                    }}
                    variant="outlined"
                    startIcon={<SecurityIcon />}
                    sx={{
                      borderColor: theme === 'dark' ? '#00ffff' : '#007bff',
                      color: theme === 'dark' ? '#00ffff' : '#007bff',
                    }}
                  >
                    Permissions
                  </Button>
                )}
                <Button
                  onClick={() => {
                    setOpenViewDialog(false);
                    handleOpenEditDialog(selectedUser);
                  }}
                  variant="contained"
                  sx={{
                    background:
                      theme === 'dark'
                        ? 'linear-gradient(135deg, #00ffff, #00b3b3)'
                        : 'linear-gradient(135deg, #007bff, #0056b3)',
                    borderRadius: 1,
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
              color: theme === 'dark' ? '#ccd6f6' : '#333333',
            },
          }}
        >
          <DialogTitle
            sx={{
              backgroundColor: theme === 'dark' ? '#0f172a' : 'white',
              borderBottom: `1px solid ${theme === 'dark' ? '#334155' : '#e5e7eb'}`,
              py: 3,
            }}
          >
            <Typography
              variant="h6"
              sx={{ fontWeight: 'bold', color: theme === 'dark' ? '#ccd6f6' : '#333333' }}
            >
              Confirm Delete
            </Typography>
          </DialogTitle>
          <DialogContent sx={{ p: 3 }}>
            <Typography
              variant="body1"
              color={theme === 'dark' ? '#a8b2d1' : '#666666'}
            >
              Are you sure you want to delete user{' '}
              <strong
                style={{ color: theme === 'dark' ? '#ff0000' : '#dc3545' }}
              >
                {selectedUser?.name}
              </strong>
              ? This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions
            sx={{
              p: 3,
              borderTop: `1px solid ${theme === 'dark' ? '#334155' : '#e5e7eb'}`,
              backgroundColor: theme === 'dark' ? '#0f172a' : 'white',
            }}
          >
            <Button
              onClick={() => setOpenDeleteDialog(false)}
              sx={{
                color: theme === 'dark' ? '#00ffff' : '#007bff',
                '&:hover': {
                  backgroundColor: theme === 'dark' ? '#00ffff20' : '#007bff10',
                },
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
                background:
                  theme === 'dark'
                    ? 'linear-gradient(135deg, #ff0000, #cc0000)'
                    : 'linear-gradient(135deg, #dc3545, #c82333)',
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
              color: theme === 'dark' ? '#ff0000' : '#dc3545',
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
              color: theme === 'dark' ? '#00ff00' : '#28a745',
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