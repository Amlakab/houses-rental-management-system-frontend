'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Card, CardContent, Tabs, Tab, Button,
  Chip, Avatar, Paper, Divider, IconButton, Alert, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  FormControl, InputLabel, Select, MenuItem, Tooltip, Snackbar,
  Grid, Stack
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/lib/theme-context';
import {
  Favorite, Bookmark, CalendarMonth, Article, LocalOffer,
  Build, Receipt, CheckCircle, Warning, HourglassEmpty,
  Add, Close, Print, Visibility, LocationOn, Person, Phone, Email,
  ShoppingCart, Payment as PaymentIcon, Refresh, ArrowForward,
  Home, CheckCircleOutline, AccessTime, InfoOutlined, Description
} from '@mui/icons-material';
import api from '@/app/utils/api';
import { Appointment, LeaseAgreement, PurchaseOffer, MaintenanceRequest, SavedSearch, House, RentalApplication } from '@/types/houses';
import LeaseAgreementModal from '@/components/LeaseAgreementModal';
import Link from 'next/link';

export default function AdminCustomerPage() {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Data states
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [applications, setApplications] = useState<RentalApplication[]>([]);
  const [leases, setLeases] = useState<LeaseAgreement[]>([]);
  const [offers, setOffers] = useState<PurchaseOffer[]>([]);
  const [maintenanceTickets, setMaintenanceTickets] = useState<MaintenanceRequest[]>([]);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [savedProperties, setSavedProperties] = useState<House[]>([]);

  // Selected Lease for full Agreement & Receipt Modal
  const [selectedLease, setSelectedLease] = useState<LeaseAgreement | null>(null);

  // New Maintenance Ticket Modal
  const [maintenanceModalOpen, setMaintenanceModalOpen] = useState(false);
  const [newTicket, setNewTicket] = useState({
    houseId: '',
    category: 'PLUMBING',
    priority: 'MEDIUM',
    title: '',
    description: ''
  });
  const [ticketLoading, setTicketLoading] = useState(false);
  const [snackbar, setSnackbar] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info'>('info');

  const fetchDashboardData = useCallback(async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) setRefreshing(true);
      else setLoading(true);

      const [appRes, leaseRes, offerRes, maintRes, searchRes, appListRes] = await Promise.allSettled([
        api.get('/workflows/appointments'),
        api.get('/workflows/leases'),
        api.get('/workflows/offers'),
        api.get('/workflows/maintenance'),
        api.get('/properties/saved-searches'),
        api.get('/houses/applications')
      ]);

      if (appRes.status === 'fulfilled') setAppointments(appRes.value.data?.data || []);
      if (leaseRes.status === 'fulfilled') setLeases(leaseRes.value.data?.data || []);
      if (offerRes.status === 'fulfilled') setOffers(offerRes.value.data?.data || []);
      if (maintRes.status === 'fulfilled') setMaintenanceTickets(maintRes.value.data?.data || []);
      if (searchRes.status === 'fulfilled') setSavedSearches(searchRes.value.data?.data || []);
      if (appListRes.status === 'fulfilled') setApplications(appListRes.value.data?.data?.applications || []);

      // Fetch sample favorited properties
      try {
        const propRes = await api.get('/public/houses?limit=6');
        if (propRes.data?.success) {
          setSavedProperties(propRes.data.data?.houses || []);
        }
      } catch {
        // Optional property fallback
      }

      if (isManualRefresh) {
        setSnackbar('Customer portal data refreshed successfully!');
        setSnackbarSeverity('success');
      }
    } catch (err: any) {
      console.error('Failed to load customer portal data:', err);
      setSnackbar(err?.response?.data?.message || 'Error fetching customer data');
      setSnackbarSeverity('error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleCreateMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setTicketLoading(true);
      const targetHouseId = newTicket.houseId || leases[0]?.houseId?._id || leases[0]?.houseId;
      await api.post('/workflows/maintenance', {
        ...newTicket,
        houseId: targetHouseId
      });
      setSnackbar('Maintenance ticket submitted to Property Manager!');
      setSnackbarSeverity('success');
      setMaintenanceModalOpen(false);
      setNewTicket({ houseId: '', category: 'PLUMBING', priority: 'MEDIUM', title: '', description: '' });
      fetchDashboardData();
    } catch (err: any) {
      setSnackbar(err.response?.data?.message || 'Failed to submit maintenance ticket');
      setSnackbarSeverity('error');
    } finally {
      setTicketLoading(false);
    }
  };

  const handleDeleteSavedSearch = async (id: string) => {
    try {
      await api.delete(`/properties/saved-searches/${id}`);
      setSavedSearches(prev => prev.filter(s => s._id !== id));
      setSnackbar('Search alert removed');
      setSnackbarSeverity('info');
    } catch (err: any) {
      setSnackbar('Could not remove saved alert');
      setSnackbarSeverity('error');
    }
  };

  const isDark = theme === 'dark';

  const statCards = [
    { title: 'My Viewings', count: appointments.length, icon: <CalendarMonth />, color: '#06b6d4', tabIndex: 0 },
    { title: 'Rental Apps', count: applications.length, icon: <Description />, color: '#8b5cf6', tabIndex: 1 },
    { title: 'Active Leases', count: leases.length, icon: <Article />, color: '#10b981', tabIndex: 2 },
    { title: 'Purchase Offers', count: offers.length, icon: <LocalOffer />, color: '#f59e0b', tabIndex: 3 },
    { title: 'Repair Tickets', count: maintenanceTickets.length, icon: <Build />, color: '#ef4444', tabIndex: 4 },
  ];

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
      {/* ─── Top Header Section ─── */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, gap: 2, mb: 4 }}>
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
            <Typography variant="h4" sx={{ fontWeight: 800, color: isDark ? '#ccd6f6' : '#0f172a' }}>
              Customer Portal
            </Typography>
            <Chip
              size="small"
              label="Real Estate Hub"
              sx={{
                bgcolor: isDark ? 'rgba(0, 255, 255, 0.15)' : 'rgba(6, 182, 212, 0.1)',
                color: isDark ? '#00ffff' : '#0891b2',
                fontWeight: 700,
                border: isDark ? '1px solid rgba(0, 255, 255, 0.3)' : '1px solid rgba(6, 182, 212, 0.3)'
              }}
            />
          </Box>
          <Typography variant="body2" sx={{ color: isDark ? '#8892b0' : '#64748b' }}>
            Manage your property viewings, active lease contracts, rent receipts, purchase bids, and maintenance repairs.
          </Typography>
        </motion.div>

        {/* Action Shortcuts */}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ width: { xs: '100%', sm: 'auto' } }}>
          <Button
            component={Link}
            href="/admin/customer/orders"
            variant="outlined"
            startIcon={<ShoppingCart />}
            sx={{
              borderColor: isDark ? 'rgba(0, 255, 255, 0.3)' : '#cbd5e1',
              color: isDark ? '#00ffff' : '#0f172a',
              textTransform: 'none',
              fontWeight: 600,
              borderRadius: 2,
              '&:hover': {
                borderColor: isDark ? '#00ffff' : '#0284c7',
                bgcolor: isDark ? 'rgba(0, 255, 255, 0.08)' : 'rgba(2, 132, 199, 0.05)'
              }
            }}
          >
            My Orders
          </Button>
          <Button
            component={Link}
            href="/admin/customer/payments"
            variant="outlined"
            startIcon={<PaymentIcon />}
            sx={{
              borderColor: isDark ? 'rgba(16, 185, 129, 0.3)' : '#cbd5e1',
              color: isDark ? '#34d399' : '#059669',
              textTransform: 'none',
              fontWeight: 600,
              borderRadius: 2,
              '&:hover': {
                borderColor: '#10b981',
                bgcolor: isDark ? 'rgba(16, 185, 129, 0.08)' : 'rgba(16, 185, 129, 0.05)'
              }
            }}
          >
            My Payments
          </Button>
          <Tooltip title="Refresh customer data">
            <IconButton
              onClick={() => fetchDashboardData(true)}
              disabled={refreshing || loading}
              sx={{
                bgcolor: isDark ? '#0f172a' : '#f1f5f9',
                color: isDark ? '#00ffff' : '#0284c7',
                border: isDark ? '1px solid rgba(0, 255, 255, 0.2)' : '1px solid #e2e8f0',
                '&:hover': { bgcolor: isDark ? 'rgba(0, 255, 255, 0.15)' : '#e2e8f0' }
              }}
            >
              <Refresh sx={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
            </IconButton>
          </Tooltip>
        </Stack>
      </Box>

      {/* ─── Metric Highlight Cards ─── */}
      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        {statCards.map((stat, idx) => (
          <Grid item xs={12} sm={6} md={3} key={idx}>
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.08 }}
            >
              <Card
                onClick={() => setActiveTab(stat.tabIndex)}
                sx={{
                  cursor: 'pointer',
                  borderRadius: 3,
                  p: 0.5,
                  transition: 'all 0.25s ease-in-out',
                  bgcolor: isDark ? '#0f172a80' : '#ffffff',
                  backdropFilter: isDark ? 'blur(10px)' : 'none',
                  border: isDark ? '1px solid rgba(0, 255, 255, 0.15)' : '1px solid #e2e8f0',
                  borderLeft: `5px solid ${stat.color}`,
                  boxShadow: activeTab === stat.tabIndex
                    ? (isDark ? '0 0 15px rgba(0, 255, 255, 0.25)' : '0 4px 12px rgba(6, 182, 212, 0.2)')
                    : 'none',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    borderColor: stat.color
                  }
                }}
              >
                <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 2 }}>
                  <Box>
                    <Typography variant="caption" sx={{ color: isDark ? '#8892b0' : '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      {stat.title}
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: isDark ? '#ccd6f6' : '#0f172a', mt: 0.5 }}>
                      {stat.count}
                    </Typography>
                  </Box>
                  <Avatar
                    sx={{
                      bgcolor: isDark ? `${stat.color}20` : `${stat.color}15`,
                      color: stat.color,
                      width: 48,
                      height: 48,
                      border: `1px solid ${stat.color}40`
                    }}
                  >
                    {stat.icon}
                  </Avatar>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        ))}
      </Grid>

      {/* ─── Navigation Tabs ─── */}
      <Card
        sx={{
          borderRadius: 3,
          mb: 4,
          bgcolor: isDark ? '#0f172a80' : '#ffffff',
          border: isDark ? '1px solid rgba(0, 255, 255, 0.15)' : '1px solid #e2e8f0',
          backdropFilter: isDark ? 'blur(10px)' : 'none'
        }}
      >
        <Tabs
          value={activeTab}
          onChange={(_, val) => setActiveTab(val)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            px: 2,
            '& .MuiTab-root': {
              color: isDark ? '#8892b0' : '#64748b',
              fontWeight: 600,
              textTransform: 'none',
              fontSize: '0.95rem',
              py: 2
            },
            '& .Mui-selected': {
              color: isDark ? '#00ffff' : '#0284c7'
            },
            '& .MuiTabs-indicator': {
              bgcolor: isDark ? '#00ffff' : '#0284c7',
              height: 3,
              borderRadius: '3px 3px 0 0'
            }
          }}
        >
          <Tab icon={<CalendarMonth />} iconPosition="start" label={`My Viewings (${appointments.length})`} />
          <Tab icon={<Description />} iconPosition="start" label={`Rental Applications (${applications.length})`} />
          <Tab icon={<Article />} iconPosition="start" label={`Active Leases (${leases.length})`} />
          <Tab icon={<LocalOffer />} iconPosition="start" label={`Purchase Offers (${offers.length})`} />
          <Tab icon={<Build />} iconPosition="start" label={`Maintenance (${maintenanceTickets.length})`} />
          <Tab icon={<Bookmark />} iconPosition="start" label={`Saved Searches (${savedSearches.length})`} />
          <Tab icon={<Favorite />} iconPosition="start" label={`Favorites (${savedProperties.length})`} />
        </Tabs>
      </Card>

      {/* ─── Main Content Tabs ─── */}
      {loading ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 12 }}>
          <CircularProgress sx={{ color: isDark ? '#00ffff' : '#0284c7', mb: 2 }} />
          <Typography variant="body2" sx={{ color: isDark ? '#8892b0' : '#64748b' }}>
            Loading your portal data...
          </Typography>
        </Box>
      ) : (
        <AnimatePresence mode="wait">
          {/* ════ TAB 0: APPOINTMENTS & VIEWINGS ════ */}
          {activeTab === 0 && (
            <motion.div key="tab-0" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: isDark ? '#ccd6f6' : '#0f172a' }}>
                  Scheduled Property Viewings
                </Typography>
                <Button
                  component={Link}
                  href="/public/houses"
                  variant="contained"
                  size="small"
                  sx={{
                    bgcolor: isDark ? '#00ffff' : '#0284c7',
                    color: isDark ? '#0a192f' : '#ffffff',
                    fontWeight: 700,
                    textTransform: 'none',
                    borderRadius: 2,
                    '&:hover': { bgcolor: isDark ? '#38bdf8' : '#0369a1' }
                  }}
                >
                  Explore More Properties
                </Button>
              </Box>

              {appointments.length === 0 ? (
                <Paper
                  elevation={0}
                  sx={{
                    p: 6,
                    textAlign: 'center',
                    borderRadius: 3,
                    border: '1px dashed',
                    borderColor: isDark ? 'rgba(0, 255, 255, 0.2)' : '#cbd5e1',
                    bgcolor: isDark ? '#0f172a40' : '#f8fafc'
                  }}
                >
                  <CalendarMonth sx={{ fontSize: 52, color: isDark ? '#00ffff' : '#0284c7', mb: 1.5, opacity: 0.8 }} />
                  <Typography variant="h6" sx={{ fontWeight: 700, color: isDark ? '#ccd6f6' : '#0f172a' }}>
                    No viewings scheduled yet
                  </Typography>
                  <Typography variant="body2" sx={{ color: isDark ? '#8892b0' : '#64748b', mb: 3, maxWidth: 450, mx: 'auto' }}>
                    Browse available residential and commercial properties to schedule private on-site or live video viewings.
                  </Typography>
                  <Button
                    component={Link}
                    href="/public/houses"
                    variant="contained"
                    sx={{
                      bgcolor: isDark ? '#00ffff' : '#0284c7',
                      color: isDark ? '#0a192f' : '#ffffff',
                      fontWeight: 700,
                      textTransform: 'none',
                      borderRadius: 2
                    }}
                  >
                    Find Properties Now
                  </Button>
                </Paper>
              ) : (
                <Grid container spacing={3}>
                  {appointments.map((app) => (
                    <Grid item xs={12} md={6} key={app._id}>
                      <Card
                        sx={{
                          borderRadius: 3,
                          bgcolor: isDark ? '#0f172a80' : '#ffffff',
                          border: isDark ? '1px solid rgba(0, 255, 255, 0.15)' : '1px solid #e2e8f0',
                          backdropFilter: isDark ? 'blur(10px)' : 'none',
                          transition: 'all 0.2s',
                          '&:hover': {
                            borderColor: isDark ? '#00ffff' : '#0284c7',
                            transform: 'translateY(-2px)'
                          }
                        }}
                      >
                        <CardContent sx={{ p: 3 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                            <Chip
                              size="small"
                              label={app.status}
                              color={app.status === 'CONFIRMED' ? 'success' : app.status === 'REQUESTED' ? 'warning' : 'default'}
                              sx={{ fontWeight: 700 }}
                            />
                            <Chip
                              size="small"
                              label={app.visitType === 'IN_PERSON' ? 'In-Person Visit' : 'Virtual Live Tour'}
                              sx={{
                                bgcolor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                                color: isDark ? '#ccd6f6' : '#334155',
                                fontWeight: 600
                              }}
                            />
                          </Box>

                          <Typography variant="h6" sx={{ fontWeight: 700, color: isDark ? '#ccd6f6' : '#0f172a', mb: 1 }}>
                            {typeof app.houseId === 'object' ? app.houseId.title : 'Property Viewing'}
                          </Typography>

                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, my: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <CalendarMonth fontSize="small" sx={{ color: isDark ? '#00ffff' : '#0284c7' }} />
                              <Typography variant="body2" sx={{ fontWeight: 600, color: isDark ? '#e2e8f0' : '#1e293b' }}>
                                Date: {new Date(app.visitDate).toLocaleDateString()} ({app.timeSlot})
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Person fontSize="small" sx={{ color: isDark ? '#8892b0' : '#64748b' }} />
                              <Typography variant="body2" sx={{ color: isDark ? '#8892b0' : '#64748b' }}>
                                Host: {app.hostId?.name || 'Assigned Real Estate Agent'}
                              </Typography>
                            </Box>
                          </Box>

                          {app.notes && (
                            <Box sx={{ bgcolor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#f8fafc', p: 1.5, borderRadius: 2, mb: 2 }}>
                              <Typography variant="body2" sx={{ color: isDark ? '#8892b0' : '#64748b', fontSize: 13 }}>
                                Note: {app.notes}
                              </Typography>
                            </Box>
                          )}

                          {typeof app.houseId === 'object' && (
                            <Button
                              component={Link}
                              href={`/public/houses/${app.houseId._id}`}
                              size="small"
                              variant="outlined"
                              fullWidth
                              sx={{
                                borderRadius: 2,
                                textTransform: 'none',
                                fontWeight: 600,
                                borderColor: isDark ? 'rgba(0, 255, 255, 0.3)' : '#cbd5e1',
                                color: isDark ? '#00ffff' : '#0284c7'
                              }}
                            >
                              View Property Specifications
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </motion.div>
          )}

          {/* ════ TAB 1: RENTAL LEASE APPLICATIONS ════ */}
          {activeTab === 1 && (
            <motion.div key="tab-apps" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: isDark ? '#ccd6f6' : '#0f172a', mb: 3 }}>
                My Rental Lease Applications
              </Typography>

              {applications.length === 0 ? (
                <Paper
                  elevation={0}
                  sx={{
                    p: 6,
                    textAlign: 'center',
                    borderRadius: 3,
                    border: '1px dashed',
                    borderColor: isDark ? 'rgba(0, 255, 255, 0.2)' : '#cbd5e1',
                    bgcolor: isDark ? '#0f172a40' : '#f8fafc'
                  }}
                >
                  <Description sx={{ fontSize: 56, color: '#8b5cf6', mb: 1.5, opacity: 0.8 }} />
                  <Typography variant="h6" sx={{ fontWeight: 700, color: isDark ? '#ccd6f6' : '#0f172a' }}>
                    No rental applications submitted
                  </Typography>
                  <Typography variant="body2" sx={{ color: isDark ? '#8892b0' : '#64748b', mb: 3, maxWidth: 450, mx: 'auto' }}>
                    Browse our rental properties and click &quot;Apply for Rental Lease&quot; on any house to submit your tenancy application.
                  </Typography>
                  <Button
                    component={Link}
                    href="/public/houses"
                    variant="contained"
                    sx={{
                      bgcolor: isDark ? '#00ffff' : '#0284c7',
                      color: isDark ? '#0a192f' : '#ffffff',
                      borderRadius: 2,
                      fontWeight: 700,
                      textTransform: 'none',
                      '&:hover': { bgcolor: isDark ? '#38bdf8' : '#0369a1' }
                    }}
                  >
                    Browse Rental Houses
                  </Button>
                </Paper>
              ) : (
                <Grid container spacing={3}>
                  {applications.map((app) => (
                    <Grid item xs={12} md={6} key={app._id}>
                      <Card
                        sx={{
                          borderRadius: 3,
                          bgcolor: isDark ? '#0f172a80' : '#ffffff',
                          border: isDark ? '1px solid rgba(0, 255, 255, 0.15)' : '1px solid #e2e8f0',
                          transition: 'all 0.2s',
                          '&:hover': { borderColor: isDark ? '#00ffff' : '#0284c7' }
                        }}
                      >
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                            <Box>
                              <Typography variant="h6" sx={{ fontWeight: 700, color: isDark ? '#ccd6f6' : '#0f172a' }}>
                                {typeof app.houseId === 'object' ? app.houseId.title : 'Rental Property'}
                              </Typography>
                              <Typography variant="caption" sx={{ color: isDark ? '#8892b0' : '#64748b' }}>
                                Applied on: {new Date(app.created_at).toLocaleDateString()}
                              </Typography>
                            </Box>
                            <Chip
                              size="small"
                              label={
                                app.status === 'APPROVED' ? 'Approved! Lease Ready' :
                                app.status === 'PENDING' ? 'Under Review' :
                                app.status === 'REJECTED' ? 'Declined' : app.status
                              }
                              color={
                                app.status === 'APPROVED' ? 'success' :
                                app.status === 'PENDING' ? 'warning' : 'error'
                              }
                              sx={{ fontWeight: 700 }}
                            />
                          </Box>

                          <Divider sx={{ my: 1.5, borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0' }} />

                          <Grid container spacing={1.5} sx={{ mb: 2 }}>
                            <Grid item xs={6}>
                              <Typography variant="caption" sx={{ color: isDark ? '#8892b0' : '#64748b' }}>Move-In Date</Typography>
                              <Typography variant="body2" sx={{ fontWeight: 600, color: isDark ? '#ccd6f6' : '#0f172a' }}>
                                {new Date(app.preferredMoveInDate).toLocaleDateString()}
                              </Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="caption" sx={{ color: isDark ? '#8892b0' : '#64748b' }}>Stated Monthly Income</Typography>
                              <Typography variant="body2" sx={{ fontWeight: 600, color: '#8b5cf6' }}>
                                ETB {app.monthlyIncome?.toLocaleString()}
                              </Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="caption" sx={{ color: isDark ? '#8892b0' : '#64748b' }}>Occupants</Typography>
                              <Typography variant="body2" sx={{ fontWeight: 600, color: isDark ? '#ccd6f6' : '#0f172a' }}>
                                {app.numberOfOccupants} Person(s)
                              </Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="caption" sx={{ color: isDark ? '#8892b0' : '#64748b' }}>Occupation</Typography>
                              <Typography variant="body2" sx={{ fontWeight: 600, color: isDark ? '#ccd6f6' : '#0f172a' }}>
                                {app.occupation}
                              </Typography>
                            </Grid>
                          </Grid>

                          {app.adminNotes && (
                            <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: isDark ? 'rgba(16, 185, 129, 0.1)' : '#f0fdf4', mb: 2, borderLeft: '3px solid #10b981' }}>
                              <Typography variant="caption" sx={{ fontWeight: 700, color: '#10b981' }}>Manager Feedback:</Typography>
                              <Typography variant="body2" sx={{ color: isDark ? '#ccd6f6' : '#334155' }}>{app.adminNotes}</Typography>
                            </Box>
                          )}

                          {app.status === 'APPROVED' ? (
                            <Button
                              variant="contained"
                              color="success"
                              fullWidth
                              onClick={() => setActiveTab(2)}
                              startIcon={<Article />}
                              sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}
                            >
                              Review & Sign Lease Contract
                            </Button>
                          ) : typeof app.houseId === 'object' ? (
                            <Button
                              component={Link}
                              href={`/public/houses/${app.houseId._id}`}
                              variant="outlined"
                              size="small"
                              fullWidth
                              sx={{ textTransform: 'none', borderRadius: 2 }}
                            >
                              View Property Details
                            </Button>
                          ) : null}
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </motion.div>
          )}

          {/* ════ TAB 2: ACTIVE LEASES & RECEIPTS ════ */}
          {activeTab === 2 && (
            <motion.div key="tab-1" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: isDark ? '#ccd6f6' : '#0f172a', mb: 3 }}>
                My Active Tenancy Agreements & Rent Payment Records
              </Typography>

              {leases.length === 0 ? (
                <Paper
                  elevation={0}
                  sx={{
                    p: 6,
                    textAlign: 'center',
                    borderRadius: 3,
                    border: '1px dashed',
                    borderColor: isDark ? 'rgba(0, 255, 255, 0.2)' : '#cbd5e1',
                    bgcolor: isDark ? '#0f172a40' : '#f8fafc'
                  }}
                >
                  <Article sx={{ fontSize: 52, color: '#10b981', mb: 1.5, opacity: 0.8 }} />
                  <Typography variant="h6" sx={{ fontWeight: 700, color: isDark ? '#ccd6f6' : '#0f172a' }}>
                    No active rental lease agreements
                  </Typography>
                  <Typography variant="body2" sx={{ color: isDark ? '#8892b0' : '#64748b', mb: 2, maxWidth: 450, mx: 'auto' }}>
                    Once your tenancy application is approved by the property owner, your digital contract, rent schedules, and official receipts will be archived here.
                  </Typography>
                </Paper>
              ) : (
                <Stack spacing={3}>
                  {leases.map((lease) => (
                    <Card
                      key={lease._id}
                      sx={{
                        borderRadius: 3,
                        bgcolor: isDark ? '#0f172a80' : '#ffffff',
                        border: isDark ? '1px solid rgba(0, 255, 255, 0.15)' : '1px solid #e2e8f0',
                        backdropFilter: isDark ? 'blur(10px)' : 'none'
                      }}
                    >
                      <CardContent sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2, mb: 2 }}>
                          <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                              <Typography variant="h6" sx={{ fontWeight: 800, color: isDark ? '#ccd6f6' : '#0f172a' }}>
                                Agreement #{lease.agreementNumber}
                              </Typography>
                              <Chip
                                size="small"
                                label={lease.status}
                                color={lease.status === 'ACTIVE' ? 'success' : 'warning'}
                                sx={{ fontWeight: 700 }}
                              />
                            </Box>
                            <Typography variant="body2" sx={{ color: isDark ? '#8892b0' : '#64748b' }}>
                              Property: {typeof lease.houseId === 'object' ? lease.houseId.title : 'Rental Unit'}
                            </Typography>
                          </Box>

                          <Box sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
                            <Typography variant="caption" sx={{ color: isDark ? '#8892b0' : '#64748b' }}>Monthly Rent</Typography>
                            <Typography variant="h5" sx={{ fontWeight: 800, color: '#10b981' }}>
                              ETB {lease.rentAmount.toLocaleString()}
                            </Typography>
                          </Box>
                        </Box>

                        <Divider sx={{ my: 2, borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0' }} />

                        {/* Dates & Deposit details */}
                        <Grid container spacing={2} sx={{ mb: 3 }}>
                          <Grid item xs={12} sm={4}>
                            <Typography variant="caption" sx={{ color: isDark ? '#8892b0' : '#64748b' }}>Lease Duration</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: isDark ? '#ccd6f6' : '#0f172a' }}>
                              {new Date(lease.startDate).toLocaleDateString()} - {new Date(lease.endDate).toLocaleDateString()}
                            </Typography>
                          </Grid>
                          <Grid item xs={12} sm={4}>
                            <Typography variant="caption" sx={{ color: isDark ? '#8892b0' : '#64748b' }}>Security Deposit</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: isDark ? '#ccd6f6' : '#0f172a' }}>
                              ETB {lease.securityDeposit.toLocaleString()}
                            </Typography>
                          </Grid>
                          <Grid item xs={12} sm={4}>
                            <Typography variant="caption" sx={{ color: isDark ? '#8892b0' : '#64748b' }}>Tenant Signature</Typography>
                            <Typography variant="body2" sx={{ color: lease.signedByTenant ? '#10b981' : '#f59e0b', fontWeight: 700 }}>
                              {lease.signedByTenant ? 'Digitally Signed ✓' : 'Signature Pending'}
                            </Typography>
                          </Grid>
                        </Grid>

                        <Button
                          variant="contained"
                          onClick={() => setSelectedLease(lease)}
                          startIcon={<Receipt />}
                          sx={{
                            bgcolor: isDark ? '#00ffff' : '#0284c7',
                            color: isDark ? '#0a192f' : '#ffffff',
                            fontWeight: 700,
                            borderRadius: 2,
                            textTransform: 'none',
                            '&:hover': { bgcolor: isDark ? '#38bdf8' : '#0369a1' }
                          }}
                        >
                          View Contract, Rent Schedule & Official Receipts
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              )}
            </motion.div>
          )}

          {/* ════ TAB 3: PURCHASE OFFERS & NEGOTIATIONS ════ */}
          {activeTab === 3 && (
            <motion.div key="tab-2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: isDark ? '#ccd6f6' : '#0f172a', mb: 3 }}>
                My Outright Purchase Offers & Negotiations
              </Typography>

              {offers.length === 0 ? (
                <Paper
                  elevation={0}
                  sx={{
                    p: 6,
                    textAlign: 'center',
                    borderRadius: 3,
                    border: '1px dashed',
                    borderColor: isDark ? 'rgba(0, 255, 255, 0.2)' : '#cbd5e1',
                    bgcolor: isDark ? '#0f172a40' : '#f8fafc'
                  }}
                >
                  <LocalOffer sx={{ fontSize: 52, color: '#f59e0b', mb: 1.5, opacity: 0.8 }} />
                  <Typography variant="h6" sx={{ fontWeight: 700, color: isDark ? '#ccd6f6' : '#0f172a' }}>
                    No purchase offers submitted
                  </Typography>
                  <Typography variant="body2" sx={{ color: isDark ? '#8892b0' : '#64748b', mb: 2, maxWidth: 450, mx: 'auto' }}>
                    When you submit purchase bids on for-sale listings, negotiation threads, counter-proposals, and escrow deposit records appear here.
                  </Typography>
                </Paper>
              ) : (
                <Stack spacing={3}>
                  {offers.map((offer) => (
                    <Card
                      key={offer._id}
                      sx={{
                        borderRadius: 3,
                        bgcolor: isDark ? '#0f172a80' : '#ffffff',
                        border: isDark ? '1px solid rgba(0, 255, 255, 0.15)' : '1px solid #e2e8f0',
                        backdropFilter: isDark ? 'blur(10px)' : 'none'
                      }}
                    >
                      <CardContent sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2, flexWrap: 'wrap', gap: 2 }}>
                          <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                              <Typography variant="h6" sx={{ fontWeight: 700, color: isDark ? '#ccd6f6' : '#0f172a' }}>
                                {typeof offer.houseId === 'object' ? offer.houseId.title : 'Purchase Bid'}
                              </Typography>
                              <Chip
                                size="small"
                                label={offer.status.replace(/_/g, ' ')}
                                color={offer.status === 'OFFER_ACCEPTED' ? 'success' : offer.status === 'UNDER_NEGOTIATION' ? 'primary' : 'warning'}
                                sx={{ fontWeight: 700 }}
                              />
                            </Box>
                            <Typography variant="body2" sx={{ color: isDark ? '#8892b0' : '#64748b' }}>
                              Financing: {offer.financingType} • Earnest Deposit: ETB {offer.earnestDepositAmount.toLocaleString()}
                            </Typography>
                          </Box>

                          <Box sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
                            <Typography variant="caption" sx={{ color: isDark ? '#8892b0' : '#64748b' }}>Current Proposed Price</Typography>
                            <Typography variant="h5" sx={{ fontWeight: 800, color: '#10b981' }}>
                              ETB {offer.currentOfferAmount.toLocaleString()}
                            </Typography>
                          </Box>
                        </Box>

                        <Divider sx={{ my: 2, borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0' }} />

                        {/* Negotiation Chat Timeline */}
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: isDark ? '#ccd6f6' : '#0f172a', mb: 1.5 }}>
                          Negotiation Timeline
                        </Typography>
                        <Stack spacing={1} sx={{ mb: 3 }}>
                          {offer.negotiationTimeline?.map((step, idx) => (
                            <Box
                              key={idx}
                              sx={{
                                p: 1.5,
                                borderRadius: 2,
                                bgcolor: step.senderRole === 'buyer'
                                  ? (isDark ? 'rgba(6, 182, 212, 0.12)' : 'rgba(6, 182, 212, 0.08)')
                                  : (isDark ? 'rgba(16, 185, 129, 0.12)' : 'rgba(16, 185, 129, 0.08)'),
                                borderLeft: '4px solid',
                                borderColor: step.senderRole === 'buyer' ? '#06b6d4' : '#10b981'
                              }}
                            >
                              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'capitalize', color: isDark ? '#ccd6f6' : '#0f172a' }}>
                                  {step.senderRole}: ETB {step.proposedAmount.toLocaleString()}
                                </Typography>
                                <Typography variant="caption" sx={{ color: isDark ? '#8892b0' : '#64748b' }}>
                                  {new Date(step.timestamp).toLocaleDateString()}
                                </Typography>
                              </Box>
                              <Typography variant="body2" sx={{ mt: 0.5, color: isDark ? '#e2e8f0' : '#334155' }}>
                                {step.message}
                              </Typography>
                            </Box>
                          ))}
                        </Stack>

                        {/* Milestones Preview */}
                        {offer.milestones && offer.milestones.length > 0 && (
                          <>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: isDark ? '#ccd6f6' : '#0f172a', mb: 1 }}>
                              Payment Milestones & Deposit Escrow
                            </Typography>
                            <Grid container spacing={1.5}>
                              {offer.milestones.map((m, idx) => (
                                <Grid item xs={12} sm={4} key={idx}>
                                  <Paper
                                    elevation={0}
                                    sx={{
                                      p: 1.5,
                                      bgcolor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#f8fafc',
                                      borderRadius: 2,
                                      border: isDark ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid #e2e8f0'
                                    }}
                                  >
                                    <Typography variant="caption" sx={{ color: isDark ? '#8892b0' : '#64748b' }}>{m.title}</Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 700, color: '#10b981' }}>
                                      ETB {m.amount.toLocaleString()}
                                    </Typography>
                                    <Chip size="small" label={m.status} sx={{ mt: 0.5, fontSize: 10 }} />
                                  </Paper>
                                </Grid>
                              ))}
                            </Grid>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              )}
            </motion.div>
          )}

          {/* ════ TAB 4: MAINTENANCE TICKETS ════ */}
          {activeTab === 4 && (
            <motion.div key="tab-3" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: isDark ? '#ccd6f6' : '#0f172a' }}>
                  Maintenance & Repair Tickets
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => setMaintenanceModalOpen(true)}
                  sx={{
                    bgcolor: isDark ? '#00ffff' : '#0284c7',
                    color: isDark ? '#0a192f' : '#ffffff',
                    fontWeight: 700,
                    textTransform: 'none',
                    borderRadius: 2,
                    '&:hover': { bgcolor: isDark ? '#38bdf8' : '#0369a1' }
                  }}
                >
                  New Repair Ticket
                </Button>
              </Box>

              {maintenanceTickets.length === 0 ? (
                <Paper
                  elevation={0}
                  sx={{
                    p: 6,
                    textAlign: 'center',
                    borderRadius: 3,
                    border: '1px dashed',
                    borderColor: isDark ? 'rgba(0, 255, 255, 0.2)' : '#cbd5e1',
                    bgcolor: isDark ? '#0f172a40' : '#f8fafc'
                  }}
                >
                  <Build sx={{ fontSize: 52, color: '#ef4444', mb: 1.5, opacity: 0.8 }} />
                  <Typography variant="h6" sx={{ fontWeight: 700, color: isDark ? '#ccd6f6' : '#0f172a' }}>
                    No maintenance tickets reported
                  </Typography>
                  <Typography variant="body2" sx={{ color: isDark ? '#8892b0' : '#64748b', mb: 3, maxWidth: 450, mx: 'auto' }}>
                    Encounter plumbing, electrical, HVAC, or security issues? Create a ticket to dispatch property maintenance professionals.
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => setMaintenanceModalOpen(true)}
                    sx={{
                      bgcolor: isDark ? '#00ffff' : '#0284c7',
                      color: isDark ? '#0a192f' : '#ffffff',
                      fontWeight: 700,
                      textTransform: 'none',
                      borderRadius: 2
                    }}
                  >
                    Submit Repair Ticket
                  </Button>
                </Paper>
              ) : (
                <Stack spacing={2}>
                  {maintenanceTickets.map((ticket) => (
                    <Paper
                      key={ticket._id}
                      elevation={0}
                      sx={{
                        p: 2.5,
                        borderRadius: 3,
                        bgcolor: isDark ? '#0f172a80' : '#ffffff',
                        border: isDark ? '1px solid rgba(0, 255, 255, 0.15)' : '1px solid #e2e8f0',
                        backdropFilter: isDark ? 'blur(10px)' : 'none'
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip size="small" label={ticket.category} sx={{ fontWeight: 600 }} />
                          <Chip
                            size="small"
                            label={`${ticket.priority} Priority`}
                            color={ticket.priority === 'HIGH' || ticket.priority === 'EMERGENCY' ? 'error' : 'default'}
                          />
                        </Box>
                        <Chip
                          size="small"
                          label={ticket.status}
                          color={ticket.status === 'COMPLETED' ? 'success' : ticket.status === 'IN_PROGRESS' ? 'primary' : 'warning'}
                          sx={{ fontWeight: 700 }}
                        />
                      </Box>

                      <Typography variant="subtitle1" sx={{ fontWeight: 700, color: isDark ? '#ccd6f6' : '#0f172a' }}>
                        {ticket.title}
                      </Typography>
                      <Typography variant="body2" sx={{ color: isDark ? '#8892b0' : '#64748b', mt: 0.5 }}>
                        {ticket.description}
                      </Typography>

                      {ticket.assignedTechnician && (
                        <Box sx={{ mt: 2, p: 1.5, bgcolor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#f8fafc', borderRadius: 2 }}>
                          <Typography variant="caption" sx={{ color: isDark ? '#8892b0' : '#64748b' }}>Assigned Technician:</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: isDark ? '#ccd6f6' : '#0f172a' }}>
                            {ticket.assignedTechnician} ({ticket.technicianContact || 'Contact Landlord'})
                          </Typography>
                        </Box>
                      )}
                    </Paper>
                  ))}
                </Stack>
              )}
            </motion.div>
          )}

          {/* ════ TAB 5: SAVED SEARCHES ════ */}
          {activeTab === 5 && (
            <motion.div key="tab-4" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: isDark ? '#ccd6f6' : '#0f172a', mb: 3 }}>
                My Saved Searches & Property Alerts
              </Typography>

              {savedSearches.length === 0 ? (
                <Paper
                  elevation={0}
                  sx={{
                    p: 6,
                    textAlign: 'center',
                    borderRadius: 3,
                    border: '1px dashed',
                    borderColor: isDark ? 'rgba(0, 255, 255, 0.2)' : '#cbd5e1',
                    bgcolor: isDark ? '#0f172a40' : '#f8fafc'
                  }}
                >
                  <Bookmark sx={{ fontSize: 52, color: '#38bdf8', mb: 1.5, opacity: 0.8 }} />
                  <Typography variant="h6" sx={{ fontWeight: 700, color: isDark ? '#ccd6f6' : '#0f172a' }}>
                    No saved searches yet
                  </Typography>
                  <Typography variant="body2" sx={{ color: isDark ? '#8892b0' : '#64748b', mb: 2, maxWidth: 450, mx: 'auto' }}>
                    When filtering houses, save your search preferences to get notified as soon as new properties hitting your criteria are listed.
                  </Typography>
                  <Button
                    component={Link}
                    href="/public/houses"
                    variant="contained"
                    sx={{
                      bgcolor: isDark ? '#00ffff' : '#0284c7',
                      color: isDark ? '#0a192f' : '#ffffff',
                      fontWeight: 700,
                      textTransform: 'none',
                      borderRadius: 2
                    }}
                  >
                    Browse Available Listings
                  </Button>
                </Paper>
              ) : (
                <Grid container spacing={3}>
                  {savedSearches.map((search) => (
                    <Grid item xs={12} sm={6} key={search._id}>
                      <Paper
                        elevation={0}
                        sx={{
                          p: 2.5,
                          borderRadius: 3,
                          bgcolor: isDark ? '#0f172a80' : '#ffffff',
                          border: isDark ? '1px solid rgba(0, 255, 255, 0.15)' : '1px solid #e2e8f0',
                          backdropFilter: isDark ? 'blur(10px)' : 'none'
                        }}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: isDark ? '#ccd6f6' : '#0f172a' }}>
                            {search.name}
                          </Typography>
                          <IconButton size="small" onClick={() => handleDeleteSavedSearch(search._id)} sx={{ color: isDark ? '#8892b0' : '#64748b' }}>
                            <Close fontSize="small" />
                          </IconButton>
                        </Box>
                        <Typography variant="caption" sx={{ color: isDark ? '#8892b0' : '#64748b' }}>
                          Frequency: {search.frequency} • Alerts: {search.notificationsEnabled ? 'Active' : 'Muted'}
                        </Typography>
                        <Button
                          component={Link}
                          href="/public/houses"
                          size="small"
                          variant="outlined"
                          fullWidth
                          sx={{
                            mt: 2,
                            borderRadius: 2,
                            textTransform: 'none',
                            fontWeight: 600,
                            borderColor: isDark ? 'rgba(0, 255, 255, 0.3)' : '#cbd5e1',
                            color: isDark ? '#00ffff' : '#0284c7'
                          }}
                        >
                          Execute Search
                        </Button>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              )}
            </motion.div>
          )}

          {/* ════ TAB 6: FAVORITES / WISHLIST ════ */}
          {activeTab === 6 && (
            <motion.div key="tab-5" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: isDark ? '#ccd6f6' : '#0f172a', mb: 3 }}>
                Saved & Favorited Properties
              </Typography>

              <Grid container spacing={3}>
                {savedProperties.map((house) => (
                  <Grid item xs={12} sm={6} md={4} key={house._id}>
                    <Card
                      sx={{
                        borderRadius: 3,
                        bgcolor: isDark ? '#0f172a80' : '#ffffff',
                        border: isDark ? '1px solid rgba(0, 255, 255, 0.15)' : '1px solid #e2e8f0',
                        backdropFilter: isDark ? 'blur(10px)' : 'none',
                        transition: 'all 0.2s',
                        '&:hover': {
                          borderColor: isDark ? '#00ffff' : '#0284c7',
                          transform: 'translateY(-2px)'
                        }
                      }}
                    >
                      <CardContent sx={{ p: 2.5 }}>
                        <Typography sx={{ fontWeight: 700, fontSize: 16, color: isDark ? '#ccd6f6' : '#0f172a', mb: 1 }}>
                          {house.title}
                        </Typography>
                        <Typography sx={{ color: isDark ? '#00ffff' : '#0891b2', fontWeight: 800, fontSize: 18, mb: 2 }}>
                          ETB {house.pricing.price.toLocaleString()}
                        </Typography>
                        <Button
                          component={Link}
                          href={`/public/houses/${house._id}`}
                          variant="contained"
                          size="small"
                          fullWidth
                          sx={{
                            bgcolor: isDark ? '#00ffff' : '#0284c7',
                            color: isDark ? '#0a192f' : '#ffffff',
                            fontWeight: 700,
                            borderRadius: 2,
                            textTransform: 'none',
                            '&:hover': { bgcolor: isDark ? '#38bdf8' : '#0369a1' }
                          }}
                        >
                          View Listing
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* ─── Lease Agreement & Receipts Modal ─── */}
      {selectedLease && (
        <LeaseAgreementModal
          open={Boolean(selectedLease)}
          onClose={() => setSelectedLease(null)}
          lease={selectedLease}
          isTenant={true}
          onSuccess={() => fetchDashboardData(false)}
        />
      )}

      {/* ─── Submit Maintenance Ticket Dialog ─── */}
      <Dialog
        open={maintenanceModalOpen}
        onClose={() => setMaintenanceModalOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            bgcolor: isDark ? '#0f172a' : '#ffffff',
            color: isDark ? '#ccd6f6' : '#0f172a',
            border: isDark ? '1px solid rgba(0, 255, 255, 0.2)' : 'none'
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0' }}>
          Submit Maintenance Repair Ticket
        </DialogTitle>
        <form onSubmit={handleCreateMaintenance}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, py: 3 }}>
            <FormControl fullWidth required>
              <InputLabel sx={{ color: isDark ? '#8892b0' : undefined }}>Repair Category</InputLabel>
              <Select
                value={newTicket.category}
                label="Repair Category"
                onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value })}
                sx={{
                  color: isDark ? '#ccd6f6' : undefined,
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: isDark ? 'rgba(255, 255, 255, 0.2)' : undefined }
                }}
              >
                <MenuItem value="PLUMBING">Plumbing (Leaks, Pipes, Faucets)</MenuItem>
                <MenuItem value="ELECTRICAL">Electrical & Lighting</MenuItem>
                <MenuItem value="HVAC_HEATING">Water Heater & HVAC</MenuItem>
                <MenuItem value="APPLIANCE">Kitchen Appliances</MenuItem>
                <MenuItem value="SECURITY_LOCKS">Doors, Windows & Key Locks</MenuItem>
                <MenuItem value="OTHER">Other Maintenance</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth required>
              <InputLabel sx={{ color: isDark ? '#8892b0' : undefined }}>Urgency Priority</InputLabel>
              <Select
                value={newTicket.priority}
                label="Urgency Priority"
                onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value })}
                sx={{
                  color: isDark ? '#ccd6f6' : undefined,
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: isDark ? 'rgba(255, 255, 255, 0.2)' : undefined }
                }}
              >
                <MenuItem value="LOW">Low (Cosmetic / Flexible)</MenuItem>
                <MenuItem value="MEDIUM">Medium (Normal priority)</MenuItem>
                <MenuItem value="HIGH">High (Urgent attention)</MenuItem>
                <MenuItem value="EMERGENCY">Emergency (Burst pipe / power outage)</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Brief Issue Title"
              required
              fullWidth
              placeholder="e.g. Master bathroom sink drain clogged"
              value={newTicket.title}
              onChange={(e) => setNewTicket({ ...newTicket, title: e.target.value })}
              InputLabelProps={{ sx: { color: isDark ? '#8892b0' : undefined } }}
              InputProps={{
                sx: {
                  color: isDark ? '#ccd6f6' : undefined,
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: isDark ? 'rgba(255, 255, 255, 0.2)' : undefined }
                }
              }}
            />

            <TextField
              label="Detailed Description"
              multiline
              rows={4}
              required
              fullWidth
              placeholder="Describe what happened, where the issue is located, and convenient times for a technician to inspect..."
              value={newTicket.description}
              onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
              InputLabelProps={{ sx: { color: isDark ? '#8892b0' : undefined } }}
              InputProps={{
                sx: {
                  color: isDark ? '#ccd6f6' : undefined,
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: isDark ? 'rgba(255, 255, 255, 0.2)' : undefined }
                }
              }}
            />
          </DialogContent>
          <DialogActions sx={{ p: 2.5, borderTop: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0', gap: 1 }}>
            <Button
              onClick={() => setMaintenanceModalOpen(false)}
              sx={{ color: isDark ? '#8892b0' : '#64748b', textTransform: 'none' }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={ticketLoading}
              sx={{
                bgcolor: isDark ? '#00ffff' : '#0284c7',
                color: isDark ? '#0a192f' : '#ffffff',
                fontWeight: 700,
                textTransform: 'none',
                borderRadius: 2,
                '&:hover': { bgcolor: isDark ? '#38bdf8' : '#0369a1' }
              }}
            >
              {ticketLoading ? <CircularProgress size={22} color="inherit" /> : 'Submit Repair Ticket'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* ─── Feedback Notification Snackbar ─── */}
      <Snackbar
        open={Boolean(snackbar)}
        autoHideDuration={5000}
        onClose={() => setSnackbar('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={snackbarSeverity} onClose={() => setSnackbar('')} sx={{ borderRadius: 2 }}>
          {snackbar}
        </Alert>
      </Snackbar>
    </Box>
  );
}
