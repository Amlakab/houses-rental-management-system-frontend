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

  // ── theme helpers (mirror UsersPage) ─────────────────────────────
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
          label="Menu Name"
          value={data.name}
          onChange={(e) => setData((p) => ({ ...p, name: e.target.value }))}
          placeholder="e.g. Home"
          required
          size="small"
          sx={textFieldStyle}
        />
        <TextField
          label="Route (href)"
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
          <InputLabel sx={labelStyle}>Icon</InputLabel>
          <Select
            value={data.icon}
            label="Icon"
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
          label="Order"
          type="number"
          value={data.order}
          onChange={(e) => setData((p) => ({ ...p, order: Number(e.target.value) }))}
          size="small"
          sx={textFieldStyle}
        />
      </Box>

      <FormControl fullWidth size="small">
        <InputLabel sx={labelStyle}>Allowed Roles</InputLabel>
        <Select
          multiple
          value={data.allowedRoles}
          label="Allowed Roles"
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
                <Chip key={r} label={r} size="small" />
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
          />
        }
        label="Active"
      />
    </Box>
  );

  // ── render ───────────────────────────────────────────────────────
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
          transition={{ duration: 0.4 }}
        >
          <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Typography variant={isMobile ? 'h5' : 'h4'} sx={{ fontWeight: 'bold', mb: 1 }}>
                Menu Management
              </Typography>
              <Typography variant="body2" color={theme === 'dark' ? '#a8b2d1' : '#666666'}>
                Create, edit, and control sidebar menus and role access
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={fetchMenus}
                sx={{
                  borderColor: theme === 'dark' ? '#00ffff' : '#007bff',
                  color: theme === 'dark' ? '#00ffff' : '#007bff',
                }}
              >
                Refresh
              </Button>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={openAdd}
                sx={{
                  background:
                    theme === 'dark'
                      ? 'linear-gradient(135deg, #00ffff, #00b3b3)'
                      : 'linear-gradient(135deg, #007bff, #0056b3)',
                  color: theme === 'dark' ? '#0a192f' : 'white',
                  fontWeight: 'bold',
                }}
              >
                Add Menu
              </Button>
            </Box>
          </Box>
        </motion.div>

        {/* Table / Cards */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
            <CircularProgress sx={{ color: theme === 'dark' ? '#00ffff' : '#007bff' }} />
          </Box>
        ) : isMobile ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {menus.map((menu) => {
              const Icon = resolveIcon(menu.icon);
              return (
                <Card
                  key={menu._id}
                  sx={{
                    borderRadius: 2,
                    backgroundColor: theme === 'dark' ? '#0f172a80' : 'white',
                    border: `1px solid ${theme === 'dark' ? '#334155' : '#e5e7eb'}`,
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Icon className="h-5 w-5" />
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                        {menu.name}
                      </Typography>
                      <Chip
                        label={menu.isActive ? 'Active' : 'Inactive'}
                        color={menu.isActive ? 'success' : 'default'}
                        size="small"
                        sx={{ ml: 'auto' }}
                      />
                    </Box>
                    <Typography variant="body2" color={theme === 'dark' ? '#a8b2d1' : '#666666'} sx={{ mb: 1 }}>
                      {menu.href} · order {menu.order}
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                      {menu.allowedRoles.map((r) => (
                        <Chip key={r} label={r} size="small" variant="outlined" />
                      ))}
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button size="small" startIcon={<Edit />} onClick={() => openEdit(menu)}>
                        Edit
                      </Button>
                      <Button
                        size="small"
                        startIcon={menu.isActive ? <VisibilityOff /> : <Visibility />}
                        onClick={() => handleToggleActive(menu)}
                      >
                        {menu.isActive ? 'Deactivate' : 'Activate'}
                      </Button>
                      <Button size="small" color="error" startIcon={<Delete />} onClick={() => openDelete(menu)}>
                        Delete
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
              borderRadius: 2,
              backgroundColor: theme === 'dark' ? '#0f172a80' : 'white',
              border: `1px solid ${theme === 'dark' ? '#334155' : '#e5e7eb'}`,
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
                    {['Order', 'Menu', 'Route', 'Icon', 'Allowed Roles', 'Status', 'Actions'].map((h) => (
                      <TableCell key={h} sx={{ color: 'white', fontWeight: 'bold' }}>
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
                          '&:hover': { backgroundColor: theme === 'dark' ? '#1e293b' : '#f8fafc' },
                        }}
                      >
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <DragIndicator fontSize="small" sx={{ opacity: 0.4 }} />
                            {menu.order}
                          </Box>
                        </TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>{menu.name}</TableCell>
                        <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{menu.href}</TableCell>
                        <TableCell>
                          <Tooltip title={menu.icon}>
                            <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                              <Icon className="h-4 w-4" />
                              <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>{menu.icon}</span>
                            </Box>
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, maxWidth: 260 }}>
                            {menu.allowedRoles.map((r) => (
                              <Chip key={r} label={r} size="small" variant="outlined" />
                            ))}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={menu.isActive ? 'Active' : 'Inactive'}
                            color={menu.isActive ? 'success' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Tooltip title="Edit">
                              <IconButton size="small" onClick={() => openEdit(menu)}>
                                <Edit fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title={menu.isActive ? 'Deactivate' : 'Activate'}>
                              <IconButton size="small" onClick={() => handleToggleActive(menu)}>
                                {menu.isActive ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton size="small" color="error" onClick={() => openDelete(menu)}>
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
                <Layers sx={{ fontSize: 64, opacity: 0.3, mb: 2 }} />
                <Typography variant="h6" sx={{ mb: 1 }}>
                  No menus yet
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.7, mb: 2 }}>
                  Run the seed script or add your first menu
                </Typography>
                <Button variant="contained" startIcon={<Add />} onClick={openAdd}>
                  Add Menu
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
              backgroundColor: theme === 'dark' ? '#0f172a' : 'white',
              color: theme === 'dark' ? '#ccd6f6' : '#333333',
            },
          }}
        >
          <DialogTitle sx={{ fontWeight: 'bold', py: 2 }}>Add New Menu</DialogTitle>
          <Divider />
          <DialogContent>{renderForm(formData, setFormData)}</DialogContent>
          <Divider />
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setOpenAddDialog(false)}>Cancel</Button>
            <Button
              variant="contained"
              onClick={handleCreate}
              disabled={!formData.name || !formData.href || formData.allowedRoles.length === 0}
            >
              Create Menu
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
              backgroundColor: theme === 'dark' ? '#0f172a' : 'white',
              color: theme === 'dark' ? '#ccd6f6' : '#333333',
            },
          }}
        >
          <DialogTitle sx={{ fontWeight: 'bold', py: 2 }}>Edit Menu — {selectedMenu?.name}</DialogTitle>
          <Divider />
          <DialogContent>{renderForm(editFormData, setEditFormData)}</DialogContent>
          <Divider />
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setOpenEditDialog(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleUpdate}>
              Save Changes
            </Button>
          </DialogActions>
        </Dialog>

        {/* ── Delete Dialog ──────────────────────────────────── */}
        <Dialog
          open={openDeleteDialog}
          onClose={() => setOpenDeleteDialog(false)}
          PaperProps={{
            sx: {
              backgroundColor: theme === 'dark' ? '#0f172a' : 'white',
              color: theme === 'dark' ? '#ccd6f6' : '#333333',
            },
          }}
        >
          <DialogTitle sx={{ fontWeight: 'bold' }}>Delete Menu</DialogTitle>
          <DialogContent>
            <Typography>
              Delete <strong>{selectedMenu?.name}</strong>? This will also remove it from
              every user's permissions. This action cannot be undone.
            </Typography>
            <Typography variant="caption" sx={{ mt: 1, display: 'block', opacity: 0.7 }}>
              Tip: if you only want to hide it from the sidebar, use <strong>Deactivate</strong> instead.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDeleteDialog(false)}>Cancel</Button>
            <Button color="error" variant="contained" onClick={handleDelete}>
              Delete
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
          <Alert severity="error" onClose={() => setError('')} variant="filled">
            {error}
          </Alert>
        </Snackbar>
        <Snackbar
          open={!!success}
          autoHideDuration={4000}
          onClose={() => setSuccess('')}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert severity="success" onClose={() => setSuccess('')} variant="filled">
            {success}
          </Alert>
        </Snackbar>
      </Box>
    </div>
  );
}