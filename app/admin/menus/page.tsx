'use client';

import { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent,
  TextField, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow,
  Chip, Alert, Snackbar, CircularProgress,
  useMediaQuery, MenuItem, Select, FormControl, InputLabel,
  IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, Button, Divider, Switch, FormControlLabel,
  Tooltip,
} from '@mui/material';
import {
  Add, Refresh, Edit, Delete, Layers,
  FilterList, Visibility, VisibilityOff, DragIndicator,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useTheme } from '@/lib/theme-context';
import { useLanguage } from '@/lib/language-context';
import { ICON_MAP, ICON_NAMES, resolveIcon, type IconName } from '@/lib/icon-map';
import { ALL_ROLES, type Role, type MenuDoc } from '@/lib/menu-types';
import api from '@/app/utils/api';

interface MenuFormData {
  name: string;
  href: string;
  icon: IconName;
  allowedRoles: Role[];
  order: number;
  isActive: boolean;
}

const emptyForm: MenuFormData = {
  name: '',
  href: '',
  icon: 'Home',
  allowedRoles: [],
  order: 0,
  isActive: true,
};

export default function MenuManagementPage() {
  const { theme } = useTheme();
  const { t, isAmharic } = useLanguage();
  const isDark = theme === 'dark';
  const isMobile = useMediaQuery('(max-width: 768px)');

  const [menus, setMenus] = useState<MenuDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // dialogs
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState<MenuDoc | null>(null);

  // forms
  const [formData, setFormData] = useState<MenuFormData>(emptyForm);
  const [editFormData, setEditFormData] = useState<MenuFormData>(emptyForm);

  // ── theme helpers ────────────────────────────────────────────────
  const textFieldStyle = {
    '& .MuiOutlinedInput-root': {
      backgroundColor: isDark ? '#1e293b' : 'white',
      color: isDark ? '#f1f5f9' : '#0f172a',
      borderRadius: '10px',
      '& fieldset': { borderColor: isDark ? '#334155' : '#cbd5e1' },
      '&:hover fieldset': { borderColor: isDark ? '#38bdf8' : '#2563eb' },
      '&.Mui-focused fieldset': { borderColor: isDark ? '#38bdf8' : '#2563eb' },
    },
    '& .MuiInputLabel-root': { color: isDark ? '#94a3b8' : '#64748b' },
    '& .MuiInputLabel-root.Mui-focused': { color: isDark ? '#38bdf8' : '#2563eb' },
  };
  const selectStyle = {
    borderRadius: '10px',
    backgroundColor: isDark ? '#1e293b' : 'white',
    color: isDark ? '#f1f5f9' : '#0f172a',
    '& .MuiOutlinedInput-notchedOutline': {
      borderColor: isDark ? '#334155' : '#cbd5e1',
    },
    '&:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: isDark ? '#38bdf8' : '#2563eb',
    },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: isDark ? '#38bdf8' : '#2563eb',
    },
  };
  const labelStyle = {
    color: isDark ? '#94a3b8' : '#64748b',
    '&.Mui-focused': { color: isDark ? '#38bdf8' : '#2563eb' },
  };

  // ── data ─────────────────────────────────────────────────────────
  useEffect(() => {
    fetchMenus();
  }, []);

  const fetchMenus = async () => {
    try {
      setLoading(true);
      // all=true → include inactive menus for management
      const res = await api.get('/menu?all=true');
      setMenus(res.data.data || []);
      setError('');
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to fetch menus');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      await api.post('/menu', formData);
      setSuccess('Menu created successfully');
      setOpenAddDialog(false);
      setFormData(emptyForm);
      fetchMenus();
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to create menu');
    }
  };

  const handleUpdate = async () => {
    if (!selectedMenu) return;
    try {
      await api.put(`/menu/${selectedMenu._id}`, editFormData);
      setSuccess('Menu updated successfully');
      setOpenEditDialog(false);
      fetchMenus();
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to update menu');
    }
  };

  const handleDelete = async () => {
    if (!selectedMenu) return;
    try {
      await api.delete(`/menu/${selectedMenu._id}`);
      setSuccess('Menu deleted successfully');
      setOpenDeleteDialog(false);
      setSelectedMenu(null);
      fetchMenus();
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to delete menu');
    }
  };

  const handleToggleActive = async (menu: MenuDoc) => {
    try {
      await api.put(`/menu/${menu._id}`, { isActive: !menu.isActive });
      setSuccess(`Menu ${!menu.isActive ? 'activated' : 'deactivated'}`);
      fetchMenus();
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to update status');
    }
  };

  const openAdd = () => {
    setFormData(emptyForm);
    setOpenAddDialog(true);
  };

  const openEdit = (menu: MenuDoc) => {
    setSelectedMenu(menu);
    setEditFormData({
      name: menu.name,
      href: menu.href,
      icon: menu.icon as IconName,
      allowedRoles: menu.allowedRoles,
      order: menu.order,
      isActive: menu.isActive,
    });
    setOpenEditDialog(true);
  };

  const openDelete = (menu: MenuDoc) => {
    setSelectedMenu(menu);
    setOpenDeleteDialog(true);
  };

  // ── shared form field renderer ───────────────────────────────────
  const renderForm = (
    data: MenuFormData,
    setData: React.Dispatch<React.SetStateAction<MenuFormData>>
  ) => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
      <Box sx={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 2 }}>
        <TextField
          label={t('menus.name', 'Menu Name')}
          value={data.name}
          onChange={(e) => setData((p) => ({ ...p, name: e.target.value }))}
          placeholder={isAmharic ? 'ለምሳሌ፡ ዳሽቦርድ ወይም ቤቶች' : 'e.g. Dashboard'}
          required
          size="small"
          sx={textFieldStyle}
        />
        <TextField
          label={t('menus.href', 'Route Path (URL)')}
          value={data.href}
          onChange={(e) => setData((p) => ({ ...p, href: e.target.value }))}
          placeholder="/admin/dashboard"
          required
          size="small"
          sx={textFieldStyle}
        />
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 2 }}>
        <FormControl fullWidth size="small">
          <InputLabel sx={labelStyle}>{t('menus.icon', 'Icon')}</InputLabel>
          <Select
            value={data.icon}
            label={t('menus.icon', 'Icon')}
            onChange={(e) => setData((p) => ({ ...p, icon: e.target.value as IconName }))}
            sx={selectStyle}
            renderValue={(val) => {
              const Icon = ICON_MAP[val as IconName];
              return (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {Icon ? <Icon className="h-4 w-4" /> : null}
                  <span>{val}</span>
                </Box>
              );
            }}
          >
            {ICON_NAMES.map((name) => {
              const Icon = ICON_MAP[name];
              return (
                <MenuItem key={name} value={name}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Icon className="h-4 w-4" />
                    <span>{name}</span>
                  </Box>
                </MenuItem>
              );
            })}
          </Select>
        </FormControl>

        <TextField
          label={t('menus.order', 'Display Order')}
          type="number"
          value={data.order}
          onChange={(e) => setData((p) => ({ ...p, order: Number(e.target.value) }))}
          size="small"
          sx={textFieldStyle}
        />
      </Box>

      <FormControl fullWidth size="small">
        <InputLabel sx={labelStyle}>{t('menus.allowed_roles', 'Allowed Roles')}</InputLabel>
        <Select
          multiple
          value={data.allowedRoles}
          label={t('menus.allowed_roles', 'Allowed Roles')}
          onChange={(e) =>
            setData((p) => ({
              ...p,
              allowedRoles:
                typeof e.target.value === 'string'
                  ? (e.target.value.split(',') as Role[])
                  : (e.target.value as Role[]),
            }))
          }
          sx={selectStyle}
          renderValue={(selected) => (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {(selected as Role[]).map((r) => (
                <Chip key={r} label={r} size="small" sx={{ borderRadius: '6px' }} />
              ))}
            </Box>
          )}
        >
          {ALL_ROLES.map((r) => (
            <MenuItem key={r} value={r}>
              {r}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControlLabel
        control={
          <Switch
            checked={data.isActive}
            onChange={(e) => setData((p) => ({ ...p, isActive: e.target.checked }))}
            color="primary"
          />
        }
        label={t('menus.is_active', 'Active')}
        sx={{ color: isDark ? '#f1f5f9' : '#0f172a' }}
      />
    </Box>
  );

  // ── render ───────────────────────────────────────────────────────
  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        isDark ? 'bg-[#0a192f] text-slate-100' : 'bg-slate-50 text-slate-800'
      }`}
    >
      <Box sx={{ py: { xs: 2, sm: 3 }, px: { xs: 2, sm: 3, md: 4 } }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Typography variant={isMobile ? 'h5' : 'h4'} sx={{ fontWeight: 800, color: isDark ? '#f1f5f9' : '#0f172a', mb: 0.5 }}>
                {t('menus.title', 'Menu Management')}
              </Typography>
              <Typography variant="body2" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>
                {t('menus.subtitle', 'Configure sidebar navigation and role-based access permissions')}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={fetchMenus}
                sx={{
                  borderRadius: '10px',
                  borderColor: isDark ? '#233554' : '#cbd5e1',
                  color: isDark ? '#38bdf8' : '#2563eb',
                  bgcolor: isDark ? '#112240' : '#ffffff',
                  textTransform: 'none',
                  fontWeight: 600,
                  '&:hover': {
                    borderColor: isDark ? '#38bdf8' : '#2563eb',
                    bgcolor: isDark ? 'rgba(56, 189, 248, 0.05)' : 'rgba(37, 99, 235, 0.05)',
                  }
                }}
              >
                {t('common.refresh', 'Refresh')}
              </Button>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={openAdd}
                sx={{
                  borderRadius: '10px',
                  backgroundColor: isDark ? '#38bdf8' : '#2563eb',
                  color: isDark ? '#0f172a' : '#ffffff',
                  fontWeight: 700,
                  textTransform: 'none',
                  '&:hover': {
                    backgroundColor: isDark ? '#0284c7' : '#1d4ed8'
                  }
                }}
              >
                {t('menus.add_menu', 'Add Menu Item')}
              </Button>
            </Box>
          </Box>
        </motion.div>

        {/* Table / Cards */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
            <CircularProgress sx={{ color: isDark ? '#38bdf8' : '#2563eb' }} />
          </Box>
        ) : isMobile ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {menus.map((menu) => {
              const Icon = resolveIcon(menu.icon);
              return (
                <Card
                  key={menu._id}
                  sx={{
                    borderRadius: 3,
                    backgroundColor: isDark ? '#112240' : '#ffffff',
                    border: `1px solid ${isDark ? '#233554' : '#e2e8f0'}`,
                    boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.05)',
                  }}
                >
                  <CardContent sx={{ p: 2.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                      <Box sx={{ p: 1, borderRadius: 2, bgcolor: isDark ? 'rgba(56, 189, 248, 0.1)' : 'rgba(37, 99, 235, 0.08)', color: isDark ? '#38bdf8' : '#2563eb' }}>
                        <Icon className="h-5 w-5" />
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: isDark ? '#f1f5f9' : '#0f172a' }}>
                          {menu.name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>
                          {menu.href} · {t('menus.order', 'Order')}: {menu.order}
                        </Typography>
                      </Box>
                      <Chip
                        label={menu.isActive ? (isAmharic ? 'ንቁ' : 'Active') : (isAmharic ? 'ቦዝኗል' : 'Inactive')}
                        color={menu.isActive ? 'success' : 'default'}
                        size="small"
                        sx={{ fontWeight: 600, borderRadius: '6px' }}
                      />
                    </Box>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                      {menu.allowedRoles.map((r) => (
                        <Chip 
                          key={r} 
                          label={r} 
                          size="small" 
                          variant="outlined" 
                          sx={{ 
                            borderRadius: '6px', 
                            fontSize: '0.75rem', 
                            borderColor: isDark ? '#334155' : '#cbd5e1', 
                            color: isDark ? '#94a3b8' : '#64748b' 
                          }} 
                        />
                      ))}
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1, pt: 1, borderTop: `1px solid ${isDark ? '#233554' : '#f1f5f9'}` }}>
                      <Button 
                        size="small" 
                        startIcon={<Edit />} 
                        onClick={() => openEdit(menu)}
                        sx={{ color: isDark ? '#38bdf8' : '#2563eb', textTransform: 'none', fontWeight: 600 }}
                      >
                        {t('common.edit', 'Edit')}
                      </Button>
                      <Button
                        size="small"
                        startIcon={menu.isActive ? <VisibilityOff /> : <Visibility />}
                        onClick={() => handleToggleActive(menu)}
                        sx={{ color: isDark ? '#94a3b8' : '#64748b', textTransform: 'none' }}
                      >
                        {menu.isActive ? (isAmharic ? 'አቦዝን' : 'Deactivate') : (isAmharic ? 'አንቃ' : 'Activate')}
                      </Button>
                      <Button 
                        size="small" 
                        color="error" 
                        startIcon={<Delete />} 
                        onClick={() => openDelete(menu)}
                        sx={{ ml: 'auto', textTransform: 'none' }}
                      >
                        {t('common.delete', 'Delete')}
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              );
            })}
          </Box>
        ) : (
          <Card
            sx={{
              borderRadius: 3,
              backgroundColor: isDark ? '#112240' : '#ffffff',
              border: `1px solid ${isDark ? '#233554' : '#e2e8f0'}`,
              overflow: 'hidden',
              boxShadow: isDark ? '0 10px 30px rgba(0,0,0,0.4)' : '0 10px 30px rgba(0,0,0,0.05)',
            }}
          >
            <TableContainer sx={{ overflowX: 'auto', maxWidth: '100%' }}>
              <Table>
                <TableHead>
                  <TableRow
                    sx={{
                      backgroundColor: isDark ? '#1e293b' : '#f8fafc',
                      borderBottom: `2px solid ${isDark ? '#233554' : '#e2e8f0'}`
                    }}
                  >
                    {[
                      t('menus.order', 'Order'),
                      t('menus.name', 'Menu'),
                      t('menus.href', 'Route Path'),
                      t('menus.icon', 'Icon'),
                      t('menus.allowed_roles', 'Allowed Roles'),
                      t('common.status', 'Status'),
                      t('common.actions', 'Actions')
                    ].map((h) => (
                      <TableCell 
                        key={h} 
                        sx={{ 
                          color: isDark ? '#f1f5f9' : '#0f172a', 
                          fontWeight: 700,
                          py: 2
                        }}
                      >
                        {h}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {menus.map((menu) => {
                    const Icon = resolveIcon(menu.icon);
                    return (
                      <TableRow
                        key={menu._id}
                        hover
                        sx={{
                          borderBottom: `1px solid ${isDark ? '#233554' : '#f1f5f9'}`,
                          '&:hover': { backgroundColor: isDark ? 'rgba(56, 189, 248, 0.05)' : 'rgba(37, 99, 235, 0.03)' },
                        }}
                      >
                        <TableCell sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <DragIndicator fontSize="small" sx={{ opacity: 0.4 }} />
                            {menu.order}
                          </Box>
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700, color: isDark ? '#f1f5f9' : '#0f172a' }}>{menu.name}</TableCell>
                        <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.85rem', color: isDark ? '#38bdf8' : '#2563eb' }}>{menu.href}</TableCell>
                        <TableCell>
                          <Tooltip title={menu.icon}>
                            <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, color: isDark ? '#94a3b8' : '#64748b' }}>
                              <Icon className="h-4 w-4" />
                              <span style={{ fontSize: '0.8rem', opacity: 0.9 }}>{menu.icon}</span>
                            </Box>
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, maxWidth: 260 }}>
                            {menu.allowedRoles.map((r) => (
                              <Chip 
                                key={r} 
                                label={r} 
                                size="small" 
                                variant="outlined" 
                                sx={{ 
                                  borderRadius: '6px', 
                                  fontSize: '0.75rem', 
                                  borderColor: isDark ? '#334155' : '#cbd5e1', 
                                  color: isDark ? '#94a3b8' : '#64748b' 
                                }} 
                              />
                            ))}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={menu.isActive ? (isAmharic ? 'ንቁ' : 'Active') : (isAmharic ? 'ቦዝኗል' : 'Inactive')}
                            color={menu.isActive ? 'success' : 'default'}
                            size="small"
                            sx={{ fontWeight: 600, borderRadius: '6px' }}
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Tooltip title={t('common.edit', 'Edit')}>
                              <IconButton 
                                size="small" 
                                onClick={() => openEdit(menu)}
                                sx={{ 
                                  color: isDark ? '#38bdf8' : '#2563eb',
                                  bgcolor: isDark ? 'rgba(56, 189, 248, 0.1)' : 'rgba(37, 99, 235, 0.08)',
                                  '&:hover': { bgcolor: isDark ? 'rgba(56, 189, 248, 0.2)' : 'rgba(37, 99, 235, 0.15)' }
                                }}
                              >
                                <Edit fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title={menu.isActive ? (isAmharic ? 'አቦዝን' : 'Deactivate') : (isAmharic ? 'አንቃ' : 'Activate')}>
                              <IconButton 
                                size="small" 
                                onClick={() => handleToggleActive(menu)}
                                sx={{ 
                                  color: isDark ? '#94a3b8' : '#64748b',
                                  bgcolor: isDark ? 'rgba(148, 163, 184, 0.1)' : 'rgba(100, 116, 139, 0.08)',
                                  '&:hover': { bgcolor: isDark ? 'rgba(148, 163, 184, 0.2)' : 'rgba(100, 116, 139, 0.15)' }
                                }}
                              >
                                {menu.isActive ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                              </IconButton>
                            </Tooltip>
                            <Tooltip title={t('common.delete', 'Delete')}>
                              <IconButton 
                                size="small" 
                                color="error" 
                                onClick={() => openDelete(menu)}
                                sx={{ 
                                  color: '#ef4444',
                                  bgcolor: 'rgba(239, 68, 68, 0.1)',
                                  '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.2)' }
                                }}
                              >
                                <Delete fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>

            {menus.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Layers sx={{ fontSize: 64, opacity: 0.3, mb: 2, color: isDark ? '#38bdf8' : '#2563eb' }} />
                <Typography variant="h6" sx={{ mb: 1, fontWeight: 700, color: isDark ? '#f1f5f9' : '#0f172a' }}>
                  {isAmharic ? 'ምንም ምናሌ አልተገኘም' : 'No menus yet'}
                </Typography>
                <Typography variant="body2" sx={{ color: isDark ? '#94a3b8' : '#64748b', mb: 2 }}>
                  {isAmharic ? 'የመጀመሪያ ምናሌዎን ለመፍጠር ከታች ያለውን ይጫኑ' : 'Run the seed script or add your first menu'}
                </Typography>
                <Button 
                  variant="contained" 
                  startIcon={<Add />} 
                  onClick={openAdd}
                  sx={{
                    borderRadius: '10px',
                    backgroundColor: isDark ? '#38bdf8' : '#2563eb',
                    color: isDark ? '#0f172a' : '#ffffff',
                    fontWeight: 700,
                    textTransform: 'none'
                  }}
                >
                  {t('menus.add_menu', 'Add Menu Item')}
                </Button>
              </Box>
            )}
          </Card>
        )}

        {/* ── Add Dialog ─────────────────────────────────────── */}
        <Dialog
          open={openAddDialog}
          onClose={() => setOpenAddDialog(false)}
          maxWidth="md"
          fullWidth
          fullScreen={isMobile}
          PaperProps={{
            sx: {
              borderRadius: isMobile ? 0 : 3,
              backgroundColor: isDark ? '#112240' : '#ffffff',
              border: `1px solid ${isDark ? '#233554' : '#e2e8f0'}`,
              color: isDark ? '#f1f5f9' : '#0f172a',
            },
          }}
        >
          <DialogTitle sx={{ fontWeight: 800, py: 2.5, px: 3, color: isDark ? '#f1f5f9' : '#0f172a' }}>
            {t('menus.add_menu', 'Add Menu Item')}
          </DialogTitle>
          <Divider sx={{ borderColor: isDark ? '#233554' : '#e2e8f0' }} />
          <DialogContent sx={{ p: { xs: 2, sm: 3 } }}>{renderForm(formData, setFormData)}</DialogContent>
          <Divider sx={{ borderColor: isDark ? '#233554' : '#e2e8f0' }} />
          <DialogActions sx={{ p: 2.5, gap: 1 }}>
            <Button 
              onClick={() => setOpenAddDialog(false)}
              sx={{ color: isDark ? '#94a3b8' : '#64748b', textTransform: 'none', fontWeight: 600 }}
            >
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button
              variant="contained"
              onClick={handleCreate}
              disabled={!formData.name || !formData.href || formData.allowedRoles.length === 0}
              sx={{
                borderRadius: '8px',
                px: 2.5,
                backgroundColor: isDark ? '#38bdf8' : '#2563eb',
                color: isDark ? '#0f172a' : '#ffffff',
                fontWeight: 700,
                textTransform: 'none'
              }}
            >
              {t('menus.add_menu', 'Create Menu')}
            </Button>
          </DialogActions>
        </Dialog>

        {/* ── Edit Dialog ────────────────────────────────────── */}
        <Dialog
          open={openEditDialog}
          onClose={() => setOpenEditDialog(false)}
          maxWidth="md"
          fullWidth
          fullScreen={isMobile}
          PaperProps={{
            sx: {
              borderRadius: isMobile ? 0 : 3,
              backgroundColor: isDark ? '#112240' : '#ffffff',
              border: `1px solid ${isDark ? '#233554' : '#e2e8f0'}`,
              color: isDark ? '#f1f5f9' : '#0f172a',
            },
          }}
        >
          <DialogTitle sx={{ fontWeight: 800, py: 2.5, px: 3, color: isDark ? '#f1f5f9' : '#0f172a' }}>
            {t('menus.edit_menu', 'Edit Menu Item')} — {selectedMenu?.name}
          </DialogTitle>
          <Divider sx={{ borderColor: isDark ? '#233554' : '#e2e8f0' }} />
          <DialogContent sx={{ p: { xs: 2, sm: 3 } }}>{renderForm(editFormData, setEditFormData)}</DialogContent>
          <Divider sx={{ borderColor: isDark ? '#233554' : '#e2e8f0' }} />
          <DialogActions sx={{ p: 2.5, gap: 1 }}>
            <Button 
              onClick={() => setOpenEditDialog(false)}
              sx={{ color: isDark ? '#94a3b8' : '#64748b', textTransform: 'none', fontWeight: 600 }}
            >
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button 
              variant="contained" 
              onClick={handleUpdate}
              sx={{
                borderRadius: '8px',
                px: 2.5,
                backgroundColor: isDark ? '#38bdf8' : '#2563eb',
                color: isDark ? '#0f172a' : '#ffffff',
                fontWeight: 700,
                textTransform: 'none'
              }}
            >
              {t('common.save', 'Save Changes')}
            </Button>
          </DialogActions>
        </Dialog>

        {/* ── Delete Dialog ──────────────────────────────────── */}
        <Dialog
          open={openDeleteDialog}
          onClose={() => setOpenDeleteDialog(false)}
          PaperProps={{
            sx: {
              borderRadius: 3,
              backgroundColor: isDark ? '#112240' : '#ffffff',
              border: `1px solid ${isDark ? '#233554' : '#e2e8f0'}`,
              color: isDark ? '#f1f5f9' : '#0f172a',
            },
          }}
        >
          <DialogTitle sx={{ fontWeight: 800, color: isDark ? '#f1f5f9' : '#0f172a' }}>
            {isAmharic ? 'ምናሌውን ሰርዝ' : 'Delete Menu'}
          </DialogTitle>
          <DialogContent>
            <Typography sx={{ color: isDark ? '#cbd5e1' : '#334155' }}>
              {isAmharic ? (
                <><strong>{selectedMenu?.name}</strong> የተባለውን ምናሌ ማጥፋት ይፈልጋሉ? ይህ ከተጠቃሚዎች ፈቃድ ላይም ይወገዳል።</>
              ) : (
                <>Delete <strong>{selectedMenu?.name}</strong>? This will also remove it from every user's permissions. This action cannot be undone.</>
              )}
            </Typography>
            <Typography variant="caption" sx={{ mt: 1.5, display: 'block', color: isDark ? '#94a3b8' : '#64748b' }}>
              {isAmharic ? 'ምክር፡ ከጎን አሞሌው መደበቅ ብቻ ከፈለጉ አቦዝን የሚለውን ይጠቀሙ።' : 'Tip: if you only want to hide it from the sidebar, use Deactivate instead.'}
            </Typography>
          </DialogContent>
          <DialogActions sx={{ p: 2, gap: 1 }}>
            <Button 
              onClick={() => setOpenDeleteDialog(false)}
              sx={{ color: isDark ? '#94a3b8' : '#64748b', textTransform: 'none', fontWeight: 600 }}
            >
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button 
              color="error" 
              variant="contained" 
              onClick={handleDelete}
              sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 700 }}
            >
              {t('common.delete', 'Delete')}
            </Button>
          </DialogActions>
        </Dialog>

        {/* ── Notifications ──────────────────────────────────── */}
        <Snackbar
          open={!!error}
          autoHideDuration={6000}
          onClose={() => setError('')}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert severity="error" onClose={() => setError('')} variant="filled" sx={{ borderRadius: 2 }}>
            {error}
          </Alert>
        </Snackbar>
        <Snackbar
          open={!!success}
          autoHideDuration={4000}
          onClose={() => setSuccess('')}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert severity="success" onClose={() => setSuccess('')} variant="filled" sx={{ borderRadius: 2 }}>
            {success}
          </Alert>
        </Snackbar>
      </Box>
    </div>
  );
}