'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Card, CardContent, Tabs, Tab, Button,
  Chip, Avatar, Paper, Divider, IconButton, Alert, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  FormControl, InputLabel, Select, MenuItem, Tooltip, Snackbar,
  Grid, Stack, Switch, FormControlLabel
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/lib/theme-context';
import { useAuth } from '@/lib/auth';
import {
  CalendarMonth, Article, LocalOffer, Build, ReportProblem,
  CheckCircle, Cancel, HourglassEmpty, Refresh, Person, Phone, Email,
  LocationOn, Receipt, Add, Warning, Schedule, AttachMoney, Shield,
  Description
} from '@mui/icons-material';
import api from '@/app/utils/api';
import {
  Appointment, LeaseAgreement, PurchaseOffer, MaintenanceRequest,
  ListingReport, House, RentalApplication
} from '@/types/houses';
import LeaseAgreementModal from '@/components/LeaseAgreementModal';
import PurchaseReceiptModal from '@/components/PurchaseReceiptModal';
import PurchaseMilestonePaymentModal from '@/components/PurchaseMilestonePaymentModal';
import Link from 'next/link';
import { useLanguage } from '@/lib/language-context';

export default function AdminWorkflowManagementPage() {
  const { theme } = useTheme();
  const { t, isAmharic } = useLanguage();
  const { user } = useAuth();
  const isDark = theme === 'dark';

  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [snackbar, setSnackbar] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info'>('info');

  // Data states
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [applications, setApplications] = useState<RentalApplication[]>([]);
  const [leases, setLeases] = useState<LeaseAgreement[]>([]);
  const [offers, setOffers] = useState<PurchaseOffer[]>([]);
  const [maintenanceTickets, setMaintenanceTickets] = useState<MaintenanceRequest[]>([]);
  const [reports, setReports] = useState<ListingReport[]>([]);
  const [houses, setHouses] = useState<House[]>([]);

  // Modals state
  const [selectedLease, setSelectedLease] = useState<LeaseAgreement | null>(null);

  // Purchase Receipt & Milestone Payment Modals
  const [receiptOffer, setReceiptOffer] = useState<PurchaseOffer | null>(null);
  const [receiptMilestone, setReceiptMilestone] = useState<any | null>(null);
  const [directPayOffer, setDirectPayOffer] = useState<PurchaseOffer | null>(null);
  const [directPayMilestone, setDirectPayMilestone] = useState<any | null>(null);

  // Rental Application Review Modal
  const [selectedApp, setSelectedApp] = useState<RentalApplication | null>(null);
  const [appReviewModalOpen, setAppReviewModalOpen] = useState(false);
  const [appReviewStatus, setAppReviewStatus] = useState<'APPROVED' | 'REJECTED'>('APPROVED');
  const [appAdminNotes, setAppAdminNotes] = useState('');

  // Reschedule Appointment Modal
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [rescheduleForm, setRescheduleForm] = useState({ date: '', timeSlot: '10:00 AM - 11:30 AM', reason: '' });

  // Counter-Offer Modal
  const [counterModalOpen, setCounterModalOpen] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<PurchaseOffer | null>(null);
  const [counterForm, setCounterForm] = useState({ proposedAmount: '', message: '' });

  // Maintenance Dispatch Modal
  const [maintenanceModalOpen, setMaintenanceModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<MaintenanceRequest | null>(null);
  const [maintenanceForm, setMaintenanceForm] = useState({
    status: 'IN_PROGRESS',
    assignedTechnician: '',
    technicianContact: '',
    estimatedCost: '',
    actualCost: '',
    resolutionNotes: ''
  });

  // Create Lease Agreement Modal
  const [createLeaseModalOpen, setCreateLeaseModalOpen] = useState(false);
  const [newLeaseForm, setNewLeaseForm] = useState({
    houseId: '',
    tenantId: '',
    tenantName: '',
    tenantEmail: '',
    tenantPhone: '',
    startDate: '',
    endDate: '',
    rentAmount: '',
    securityDeposit: '',
    billingFrequency: 'monthly',
    terms: 'Standard residential tenancy contract.'
  });

  // Record Rent Payment Modal
  const [recordPaymentModalOpen, setRecordPaymentModalOpen] = useState(false);
  const [paymentLease, setPaymentLease] = useState<LeaseAgreement | null>(null);
  const [paymentForm, setPaymentForm] = useState({
    installmentNumber: '1',
    amount: '',
    method: 'cbe',
    reference: ''
  });

  // Review Listing Report Modal
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ListingReport | null>(null);
  const [reportForm, setReportForm] = useState({
    status: 'RESOLVED',
    adminNotes: '',
    suspendListing: false
  });

  // Fetch all workflow data
  const fetchData = useCallback(async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      else setLoading(true);

      const [appRes, leaseRes, offerRes, maintRes, houseRes, rentalAppRes] = await Promise.allSettled([
        api.get('/workflows/appointments'),
        api.get('/workflows/leases'),
        api.get('/workflows/offers'),
        api.get('/workflows/maintenance'),
        api.get('/houses/my-houses?limit=50'),
        api.get('/houses/applications')
      ]);

      if (appRes.status === 'fulfilled') setAppointments(appRes.value.data?.data || []);
      if (leaseRes.status === 'fulfilled') setLeases(leaseRes.value.data?.data || []);
      if (offerRes.status === 'fulfilled') setOffers(offerRes.value.data?.data || []);
      if (maintRes.status === 'fulfilled') setMaintenanceTickets(maintRes.value.data?.data || []);
      if (houseRes.status === 'fulfilled') setHouses(houseRes.value.data?.data?.houses || houseRes.value.data?.data || []);
      if (rentalAppRes.status === 'fulfilled') setApplications(rentalAppRes.value.data?.data?.applications || []);

      // If admin, fetch reports
      if (user?.role === 'admin') {
        try {
          const reportRes = await api.get('/reviews/admin/reports');
          setReports(reportRes.data?.data || []);
        } catch {
          // Non-critical if reports empty
        }
      }

      if (isManual) {
        setSnackbar('Workflow hub refreshed successfully!');
        setSnackbarSeverity('success');
      }
    } catch (err: any) {
      console.error('Workflow data fetch error:', err);
      setSnackbar(err?.response?.data?.message || 'Error loading workflow data');
      setSnackbarSeverity('error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Appointment Status Handlers
  const handleUpdateAppointment = async (id: string, status: string, rescheduleData?: any) => {
    try {
      await api.patch(`/workflows/appointments/${id}/status`, {
        status,
        ...(rescheduleData || {})
      });
      setSnackbar(`Appointment marked as ${status}`);
      setSnackbarSeverity('success');
      setRescheduleModalOpen(false);
      fetchData();
    } catch (err: any) {
      setSnackbar(err?.response?.data?.message || 'Failed to update appointment');
      setSnackbarSeverity('error');
    }
  };

  // Purchase Offer Handlers
  const handleOfferStatus = async (id: string, status: string) => {
    try {
      await api.patch(`/workflows/offers/${id}/status`, { status });
      setSnackbar(`Offer updated: ${status.replace(/_/g, ' ')}`);
      setSnackbarSeverity('success');
      fetchData();
    } catch (err: any) {
      setSnackbar(err?.response?.data?.message || 'Failed to update offer');
      setSnackbarSeverity('error');
    }
  };

  const handleSendCounterOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOffer) return;
    try {
      await api.patch(`/workflows/offers/${selectedOffer._id}/negotiate`, {
        proposedAmount: Number(counterForm.proposedAmount),
        message: counterForm.message
      });
      setSnackbar('Counter-offer sent to prospective buyer!');
      setSnackbarSeverity('success');
      setCounterModalOpen(false);
      fetchData();
    } catch (err: any) {
      setSnackbar(err?.response?.data?.message || 'Failed to send counter-offer');
      setSnackbarSeverity('error');
    }
  };

  // Milestone Approval Handler
  const handleApproveMilestone = async (offerId: string, milestoneId: string, amount: number) => {
    try {
      await api.post(`/workflows/offers/${offerId}/milestone`, {
        milestoneId,
        amount
      });
      setSnackbar('Purchase milestone payment approved and official sales receipt issued!');
      setSnackbarSeverity('success');
      fetchData();
    } catch (err: any) {
      setSnackbar(err?.response?.data?.message || 'Failed to approve milestone');
      setSnackbarSeverity('error');
    }
  };

  // Maintenance Ticket Update Handler
  const handleUpdateMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;
    try {
      await api.patch(`/workflows/maintenance/${selectedTicket._id}/status`, {
        status: maintenanceForm.status,
        assignedTechnician: maintenanceForm.assignedTechnician,
        technicianContact: maintenanceForm.technicianContact,
        estimatedCost: maintenanceForm.estimatedCost ? Number(maintenanceForm.estimatedCost) : undefined,
        actualCost: maintenanceForm.actualCost ? Number(maintenanceForm.actualCost) : undefined,
        resolutionNotes: maintenanceForm.resolutionNotes
      });
      setSnackbar('Maintenance ticket updated and tenant notified!');
      setSnackbarSeverity('success');
      setMaintenanceModalOpen(false);
      fetchData();
    } catch (err: any) {
      setSnackbar(err?.response?.data?.message || 'Failed to update maintenance ticket');
      setSnackbarSeverity('error');
    }
  };

  // Create Lease Agreement Handler
  const handleCreateLease = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/workflows/leases', {
        ...newLeaseForm,
        rentAmount: Number(newLeaseForm.rentAmount),
        securityDeposit: Number(newLeaseForm.securityDeposit || 0)
      });
      setSnackbar('Digital lease agreement generated and dispatched for tenant review!');
      setSnackbarSeverity('success');
      setCreateLeaseModalOpen(false);
      fetchData();
    } catch (err: any) {
      setSnackbar(err?.response?.data?.message || 'Failed to create lease agreement');
      setSnackbarSeverity('error');
    }
  };

  // Record Rent Payment Handler
  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentLease) return;
    try {
      await api.post(`/workflows/leases/${paymentLease._id}/payments`, {
        installmentNumber: Number(paymentForm.installmentNumber),
        amount: Number(paymentForm.amount),
        method: paymentForm.method,
        reference: paymentForm.reference
      });
      setSnackbar('Rent payment recorded and official receipt created!');
      setSnackbarSeverity('success');
      setRecordPaymentModalOpen(false);
      fetchData();
    } catch (err: any) {
      setSnackbar(err?.response?.data?.message || 'Failed to record rent payment');
      setSnackbarSeverity('error');
    }
  };

  // Review Listing Report Handler
  const handleUpdateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReport) return;
    try {
      await api.patch(`/reviews/admin/reports/${selectedReport._id}`, reportForm);
      setSnackbar('Listing report resolved successfully');
      setSnackbarSeverity('success');
      setReportModalOpen(false);
      fetchData();
    } catch (err: any) {
      setSnackbar(err?.response?.data?.message || 'Failed to update report');
      setSnackbarSeverity('error');
    }
  };

  // Review Rental Application Handler
  const handleUpdateAppStatus = async (status: 'APPROVED' | 'REJECTED') => {
    if (!selectedApp) return;
    try {
      await api.patch(`/houses/applications/${selectedApp._id}`, {
        status,
        adminNotes: appAdminNotes
      });
      setSnackbar(`Rental application marked as ${status.toLowerCase()}! Draft lease prepared.`);
      setSnackbarSeverity('success');
      setAppReviewModalOpen(false);
      setSelectedApp(null);
      setAppAdminNotes('');
      fetchData();
    } catch (err: any) {
      setSnackbar(err?.response?.data?.message || 'Failed to update application');
      setSnackbarSeverity('error');
    }
  };

  const statMetrics = [
    { title: t('workflows.tab_appointments', 'Appointments'), count: appointments.filter(a => a.status === 'REQUESTED').length, total: appointments.length, icon: <CalendarMonth />, color: '#06b6d4', tab: 0 },
    { title: t('workflows.tab_applications', 'Rental Applications'), count: applications.filter(a => a.status === 'PENDING').length, total: applications.length, icon: <Description />, color: '#8b5cf6', tab: 1 },
    { title: t('workflows.tab_leases', 'Lease Agreements'), count: leases.filter(l => l.status === 'PENDING_SIGNATURE').length, total: leases.length, icon: <Article />, color: '#10b981', tab: 2 },
    { title: t('workflows.tab_offers', 'Purchase Offers'), count: offers.filter(o => o.status === 'OFFER_SUBMITTED' || o.status === 'UNDER_NEGOTIATION').length, total: offers.length, icon: <LocalOffer />, color: '#f59e0b', tab: 3 },
    { title: t('workflows.tab_maintenance', 'Maintenance Tickets'), count: maintenanceTickets.filter(m => m.status === 'PENDING' || m.status === 'IN_PROGRESS').length, total: maintenanceTickets.length, icon: <Build />, color: '#ef4444', tab: 4 },
  ];

  return (
    <Box sx={{ p: { xs: 1.5, sm: 2.5, md: 3 }, width: '100%', maxWidth: '100%', overflowX: 'hidden' }}>
      {/* ─── Header Section ─── */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, gap: 2, mb: 4 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5, flexWrap: 'wrap' }}>
            <Typography variant="h4" sx={{ fontWeight: 800, color: isDark ? '#f1f5f9' : '#0f172a', fontSize: { xs: '1.5rem', sm: '2rem' } }}>
              {t('workflows.title', 'Workflows & Property Requests')}
            </Typography>
            <Chip
              size="small"
              label={isAmharic ? 'የስራ ማዕከል' : 'Manager Hub'}
              sx={{
                bgcolor: isDark ? 'rgba(56, 189, 248, 0.15)' : 'rgba(37, 99, 235, 0.1)',
                color: isDark ? '#38bdf8' : '#2563eb',
                fontWeight: 700,
                border: `1px solid ${isDark ? 'rgba(56, 189, 248, 0.3)' : 'rgba(37, 99, 235, 0.3)'}`
              }}
            />
          </Box>
          <Typography variant="body2" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>
            {t('workflows.subtitle', 'Manage customer appointments, rental applications, leases, purchase offers, maintenance tickets, and listing reports')}
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.5} sx={{ alignSelf: { xs: 'flex-start', md: 'center' } }}>
          {['admin', 'owner', 'agent'].includes(user?.role || '') && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setCreateLeaseModalOpen(true)}
              sx={{
                bgcolor: isDark ? '#38bdf8' : '#2563eb',
                color: isDark ? '#0a192f' : '#ffffff',
                fontWeight: 700,
                borderRadius: 2.5,
                textTransform: 'none',
                '&:hover': { bgcolor: isDark ? '#7dd3fc' : '#1d4ed8' }
              }}
            >
              {isAmharic ? 'አዲስ ውል ፍጠር' : 'New Lease Contract'}
            </Button>
          )}

          <Tooltip title={isAmharic ? 'አድስ' : 'Refresh Workflow Hub'}>
            <IconButton
              onClick={() => fetchData(true)}
              disabled={refreshing || loading}
              sx={{
                bgcolor: isDark ? '#112240' : '#ffffff',
                color: isDark ? '#38bdf8' : '#2563eb',
                border: `1px solid ${isDark ? '#233554' : '#e2e8f0'}`
              }}
            >
              <Refresh sx={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
            </IconButton>
          </Tooltip>
        </Stack>
      </Box>

      {/* ─── Metric Cards ─── */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(5, 1fr)' }, gap: 2, mb: 4 }}>
        {statMetrics.map((stat, idx) => (
          <Card
            key={idx}
            onClick={() => setActiveTab(stat.tab)}
            sx={{
              cursor: 'pointer',
              borderRadius: 3,
              p: 0.5,
              bgcolor: isDark ? '#112240' : '#ffffff',
              border: `1px solid ${activeTab === stat.tab ? stat.color : (isDark ? '#233554' : '#e2e8f0')}`,
              borderLeft: `5px solid ${stat.color}`,
              boxShadow: activeTab === stat.tab ? (isDark ? `0 0 15px ${stat.color}40` : `0 4px 12px ${stat.color}30`) : 'none',
              transition: 'all 0.2s ease',
              '&:hover': { transform: 'translateY(-2px)', borderColor: stat.color }
            }}
          >
            <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.5, px: 2 }}>
              <Box sx={{ minWidth: 0 }}>
                <Typography noWrap variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b', fontWeight: 700, textTransform: 'uppercase', display: 'block' }}>
                  {stat.title}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mt: 0.5 }}>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: isDark ? '#f1f5f9' : '#0f172a' }}>
                    {stat.count}
                  </Typography>
                  <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>
                    / {stat.total}
                  </Typography>
                </Box>
              </Box>
              <Avatar sx={{ bgcolor: `${stat.color}20`, color: stat.color, width: 42, height: 42 }}>
                {stat.icon}
              </Avatar>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* ─── Navigation Tabs ─── */}
      <Card sx={{ borderRadius: 3, mb: 4, bgcolor: isDark ? '#112240' : '#ffffff', border: `1px solid ${isDark ? '#233554' : '#e2e8f0'}`, boxShadow: 'none' }}>
        <Tabs
          value={activeTab}
          onChange={(_, val) => setActiveTab(val)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            px: { xs: 1, sm: 2 },
            '& .MuiTab-root': { 
              color: isDark ? '#94a3b8' : '#64748b', 
              fontWeight: 600, 
              textTransform: 'none', 
              fontSize: { xs: '0.85rem', sm: '0.95rem' }, 
              py: 2 
            },
            '& .Mui-selected': { 
              color: isDark ? '#38bdf8 !important' : '#2563eb !important',
              fontWeight: 700
            },
            '& .MuiTabs-indicator': { 
              bgcolor: isDark ? '#38bdf8' : '#2563eb', 
              height: 3,
              borderRadius: 2
            }
          }}
        >
          <Tab icon={<CalendarMonth />} iconPosition="start" label={`${t('workflows.tab_appointments', 'Appointments')} (${appointments.length})`} />
          <Tab icon={<Description />} iconPosition="start" label={`${t('workflows.tab_applications', 'Rental Applications')} (${applications.length})`} />
          <Tab icon={<Article />} iconPosition="start" label={`${t('workflows.tab_leases', 'Lease Agreements')} (${leases.length})`} />
          <Tab icon={<LocalOffer />} iconPosition="start" label={`${t('workflows.tab_offers', 'Purchase Offers')} (${offers.length})`} />
          <Tab icon={<Build />} iconPosition="start" label={`${t('workflows.tab_maintenance', 'Maintenance Dispatch')} (${maintenanceTickets.length})`} />
          {user?.role === 'admin' && (
            <Tab icon={<ReportProblem />} iconPosition="start" label={`${t('workflows.tab_reports', 'Listing Reports')} (${reports.length})`} />
          )}
        </Tabs>
      </Card>

      {/* ─── Tabs Body ─── */}
      {loading ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 12 }}>
          <CircularProgress sx={{ color: isDark ? '#00ffff' : '#0284c7', mb: 2 }} />
          <Typography variant="body2" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>Loading customer workflows...</Typography>
        </Box>
      ) : (
        <AnimatePresence mode="wait">
          {/* ════ TAB 0: APPOINTMENTS ════ */}
          {activeTab === 0 && (
            <motion.div key="tab-app" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {appointments.length === 0 ? (
                <Paper elevation={0} sx={{ p: 6, textAlign: 'center', borderRadius: 3, border: '1px dashed', borderColor: isDark ? 'rgba(0, 255, 255, 0.2)' : '#cbd5e1', bgcolor: isDark ? '#0f172a40' : '#f8fafc' }}>
                  <CalendarMonth sx={{ fontSize: 48, color: '#06b6d4', mb: 1, opacity: 0.8 }} />
                  <Typography variant="h6" sx={{ fontWeight: 700, color: isDark ? '#f1f5f9' : '#0f172a' }}>No viewing appointments requested</Typography>
                  <Typography variant="body2" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>When prospective clients schedule on-site visits or virtual tours, they will appear here.</Typography>
                </Paper>
              ) : (
                <Grid container spacing={3}>
                  {appointments.map((app) => (
                    <Grid item xs={12} md={6} key={app._id}>
                      <Card sx={{ borderRadius: 3, bgcolor: isDark ? '#112240' : '#ffffff', border: `1px solid ${isDark ? '#233554' : '#e2e8f0'}`, p: 1 }}>
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                            <Chip
                              size="small"
                              label={app.status}
                              color={app.status === 'CONFIRMED' ? 'success' : app.status === 'REQUESTED' ? 'warning' : app.status === 'RESCHEDULED' ? 'primary' : 'default'}
                              sx={{ fontWeight: 700 }}
                            />
                            <Chip size="small" label={app.visitType === 'IN_PERSON' ? 'In-Person Visit' : 'Virtual Live Tour'} sx={{ fontWeight: 600 }} />
                          </Box>

                          <Typography variant="h6" sx={{ fontWeight: 700, color: isDark ? '#f1f5f9' : '#0f172a', mb: 1 }}>
                            {(typeof app.houseId === 'object' && app.houseId) ? (app.houseId.title || 'Property Viewing') : 'Property Viewing'}
                          </Typography>

                          <Stack spacing={0.8} sx={{ my: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Person fontSize="small" sx={{ color: isDark ? '#00ffff' : '#0284c7' }} />
                              <Typography variant="body2" sx={{ fontWeight: 600, color: isDark ? '#f1f5f9' : '#0f172a' }}>
                                Client: {app.customerName || app.customerId?.name || 'Customer'}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Phone fontSize="small" sx={{ color: isDark ? '#94a3b8' : '#64748b' }} />
                              <Typography variant="body2" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>
                                Phone: {app.customerPhone || app.customerId?.phone || 'N/A'}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <CalendarMonth fontSize="small" sx={{ color: '#10b981' }} />
                              <Typography variant="body2" sx={{ fontWeight: 600, color: isDark ? '#f1f5f9' : '#0f172a' }}>
                                Scheduled: {new Date(app.visitDate).toLocaleDateString()} ({app.timeSlot})
                              </Typography>
                            </Box>
                          </Stack>

                          {app.notes && (
                            <Box sx={{ p: 1.5, bgcolor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#f8fafc', borderRadius: 2, mb: 2 }}>
                              <Typography variant="body2" sx={{ color: isDark ? '#94a3b8' : '#64748b', fontSize: 13 }}>
                                Client Note: {app.notes}
                              </Typography>
                            </Box>
                          )}

                          <Divider sx={{ my: 1.5, borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0' }} />

                          {/* Action Buttons */}
                          <Stack direction="row" spacing={1} flexWrap="wrap">
                            {app.status === 'REQUESTED' && (
                              <Button
                                size="small"
                                variant="contained"
                                color="success"
                                startIcon={<CheckCircle />}
                                onClick={() => handleUpdateAppointment(app._id, 'CONFIRMED')}
                                sx={{ borderRadius: 2, textTransform: 'none' }}
                              >
                                Confirm
                              </Button>
                            )}

                            {app.status !== 'COMPLETED' && app.status !== 'CANCELLED' && (
                              <>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  startIcon={<Schedule />}
                                  onClick={() => {
                                    setSelectedAppointment(app);
                                    setRescheduleForm({ date: '', timeSlot: app.timeSlot || '10:00 AM - 11:30 AM', reason: '' });
                                    setRescheduleModalOpen(true);
                                  }}
                                  sx={{ borderRadius: 2, textTransform: 'none' }}
                                >
                                  Reschedule
                                </Button>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  color="success"
                                  onClick={() => handleUpdateAppointment(app._id, 'COMPLETED')}
                                  sx={{ borderRadius: 2, textTransform: 'none' }}
                                >
                                  Completed
                                </Button>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  color="error"
                                  startIcon={<Cancel />}
                                  onClick={() => handleUpdateAppointment(app._id, 'CANCELLED')}
                                  sx={{ borderRadius: 2, textTransform: 'none' }}
                                >
                                  Decline
                                </Button>
                              </>
                            )}
                          </Stack>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </motion.div>
          )}

          {/* ════ TAB 1: RENTAL APPLICATIONS ════ */}
          {activeTab === 1 && (
            <motion.div key="tab-apps" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {applications.length === 0 ? (
                <Paper elevation={0} sx={{ p: 6, textAlign: 'center', borderRadius: 3, border: '1px dashed', borderColor: isDark ? 'rgba(0, 255, 255, 0.2)' : '#cbd5e1', bgcolor: isDark ? '#0f172a40' : '#f8fafc' }}>
                  <Description sx={{ fontSize: 48, color: '#8b5cf6', mb: 1, opacity: 0.8 }} />
                  <Typography variant="h6" sx={{ fontWeight: 700, color: isDark ? '#f1f5f9' : '#0f172a' }}>No rental applications submitted</Typography>
                  <Typography variant="body2" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>When prospective tenants apply for rental properties from the marketplace, their background, income, and preferred move-in requests appear here.</Typography>
                </Paper>
              ) : (
                <Stack spacing={3}>
                  {applications.map((app) => (
                    <Card key={app._id} sx={{ borderRadius: 3, bgcolor: isDark ? '#112240' : '#ffffff', border: `1px solid ${isDark ? '#233554' : '#e2e8f0'}`, p: 1 }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2, mb: 2 }}>
                          <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                              <Typography variant="h6" sx={{ fontWeight: 800, color: isDark ? '#f1f5f9' : '#0f172a' }}>
                                {app.fullName}
                              </Typography>
                              <Chip
                                size="small"
                                label={app.status}
                                color={app.status === 'APPROVED' ? 'success' : app.status === 'PENDING' ? 'warning' : 'error'}
                                sx={{ fontWeight: 700 }}
                              />
                            </Box>
                            <Typography variant="body2" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>
                              Property: {(typeof app.houseId === 'object' && app.houseId) ? (app.houseId.title || 'Rental Listing') : 'Rental Listing'}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 0.5 }}>
                              <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: isDark ? '#ccd6f6' : '#334155' }}>
                                <Phone sx={{ fontSize: 14 }} /> {app.phone}
                              </Typography>
                              <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: isDark ? '#ccd6f6' : '#334155' }}>
                                <Email sx={{ fontSize: 14 }} /> {app.email}
                              </Typography>
                            </Box>
                          </Box>

                          <Box sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
                            <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>Monthly Income Stated</Typography>
                            <Typography variant="h5" sx={{ fontWeight: 800, color: '#8b5cf6' }}>
                              ETB {app.monthlyIncome?.toLocaleString()}
                            </Typography>
                          </Box>
                        </Box>

                        <Divider sx={{ my: 2, borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0' }} />

                        <Grid container spacing={2} sx={{ mb: 2 }}>
                          <Grid item xs={12} sm={3}>
                            <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>Occupation / Employer</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: isDark ? '#f1f5f9' : '#0f172a' }}>
                              {app.occupation}
                            </Typography>
                          </Grid>
                          <Grid item xs={12} sm={3}>
                            <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>Occupants</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: isDark ? '#f1f5f9' : '#0f172a' }}>
                              {app.numberOfOccupants} Person(s)
                            </Typography>
                          </Grid>
                          <Grid item xs={12} sm={3}>
                            <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>Preferred Move-In</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: isDark ? '#f1f5f9' : '#0f172a' }}>
                              {new Date(app.preferredMoveInDate).toLocaleDateString()}
                            </Typography>
                          </Grid>
                          <Grid item xs={12} sm={3}>
                            <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>Submitted On</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: isDark ? '#f1f5f9' : '#0f172a' }}>
                              {new Date(app.created_at).toLocaleDateString()}
                            </Typography>
                          </Grid>
                        </Grid>

                        {app.message && (
                          <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: isDark ? '#1e293b' : '#f8fafc', mb: 2, borderLeft: '4px solid #8b5cf6' }}>
                            <Typography variant="caption" sx={{ fontWeight: 700, color: '#8b5cf6' }}>Applicant Note:</Typography>
                            <Typography variant="body2" sx={{ color: isDark ? '#ccd6f6' : '#334155' }}>{app.message}</Typography>
                          </Box>
                        )}

                        {app.adminNotes && (
                          <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: isDark ? '#1e293b' : '#f8fafc', mb: 2, borderLeft: '4px solid #10b981' }}>
                            <Typography variant="caption" sx={{ fontWeight: 700, color: '#10b981' }}>Admin Notes:</Typography>
                            <Typography variant="body2" sx={{ color: isDark ? '#ccd6f6' : '#334155' }}>{app.adminNotes}</Typography>
                          </Box>
                        )}

                        {app.status === 'PENDING' && (
                          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mt: 2 }}>
                            <Button
                              variant="contained"
                              color="success"
                              startIcon={<CheckCircle />}
                              onClick={() => {
                                setSelectedApp(app);
                                setAppReviewStatus('APPROVED');
                                setAppAdminNotes('');
                                setAppReviewModalOpen(true);
                              }}
                              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
                            >
                              Approve & Draft Lease
                            </Button>
                            <Button
                              variant="outlined"
                              color="error"
                              startIcon={<Cancel />}
                              onClick={() => {
                                setSelectedApp(app);
                                setAppReviewStatus('REJECTED');
                                setAppAdminNotes('');
                                setAppReviewModalOpen(true);
                              }}
                              sx={{ borderRadius: 2, textTransform: 'none' }}
                            >
                              Decline Application
                            </Button>
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              )}
            </motion.div>
          )}

          {/* ════ TAB 2: LEASES ════ */}
          {activeTab === 2 && (
            <motion.div key="tab-leases" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {leases.length === 0 ? (
                <Paper elevation={0} sx={{ p: 6, textAlign: 'center', borderRadius: 3, border: '1px dashed', borderColor: isDark ? 'rgba(0, 255, 255, 0.2)' : '#cbd5e1', bgcolor: isDark ? '#0f172a40' : '#f8fafc' }}>
                  <Article sx={{ fontSize: 48, color: '#10b981', mb: 1, opacity: 0.8 }} />
                  <Typography variant="h6" sx={{ fontWeight: 700, color: isDark ? '#f1f5f9' : '#0f172a' }}>No active lease agreements</Typography>
                  <Typography variant="body2" sx={{ color: isDark ? '#94a3b8' : '#64748b', mb: 2 }}>Create contracts for verified tenants to manage rent schedules and payment receipts.</Typography>
                  <Button variant="contained" startIcon={<Add />} onClick={() => setCreateLeaseModalOpen(true)} sx={{ bgcolor: isDark ? '#00ffff' : '#0284c7', color: isDark ? '#0a192f' : '#ffffff', borderRadius: 2 }}>
                    Generate First Lease
                  </Button>
                </Paper>
              ) : (
                <Stack spacing={3}>
                  {leases.map((lease) => (
                    <Card key={lease._id} sx={{ borderRadius: 3, bgcolor: isDark ? '#112240' : '#ffffff', border: `1px solid ${isDark ? '#233554' : '#e2e8f0'}`, p: 1 }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2, mb: 2 }}>
                          <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                              <Typography variant="h6" sx={{ fontWeight: 800, color: isDark ? '#f1f5f9' : '#0f172a' }}>
                                Contract #{lease.agreementNumber}
                              </Typography>
                              <Chip
                                size="small"
                                label={lease.status.replace(/_/g, ' ')}
                                color={
                                  lease.status === 'ACTIVE'
                                    ? 'success'
                                    : lease.status === 'TERMINATION_REQUESTED'
                                    ? 'error'
                                    : lease.status === 'TERMINATED'
                                    ? 'default'
                                    : lease.status === 'PENDING_SIGNATURE'
                                    ? 'warning'
                                    : 'default'
                                }
                                sx={{ fontWeight: 700 }}
                              />
                            </Box>
                            <Typography variant="body2" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>
                              Property: {(typeof lease.houseId === 'object' && lease.houseId) ? (lease.houseId.title || 'Rental Apartment') : 'Rental Apartment'}
                            </Typography>
                            <Typography variant="body2" sx={{ color: isDark ? '#f1f5f9' : '#0f172a', fontWeight: 600 }}>
                              Tenant: {lease.tenantName} ({lease.tenantPhone})
                            </Typography>
                          </Box>

                          <Box sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
                            <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>Monthly Rent</Typography>
                            <Typography variant="h5" sx={{ fontWeight: 800, color: '#10b981' }}>
                              ETB {lease.rentAmount?.toLocaleString()}
                            </Typography>
                          </Box>
                        </Box>

                        {/* Lease Termination Request Alerts */}
                        {lease.status === 'TERMINATION_REQUESTED' && (
                          <Alert
                            severity="error"
                            sx={{ my: 1.5, borderRadius: 2 }}
                            action={
                              <Button
                                color="error"
                                variant="contained"
                                size="small"
                                onClick={() => setSelectedLease(lease)}
                                sx={{ fontWeight: 700, textTransform: 'none' }}
                              >
                                Review Stop Request
                              </Button>
                            }
                          >
                            <strong>Stop Lease Agreement Requested:</strong> {lease.terminationRequest?.requestedByRole === 'tenant' ? 'Tenant requested termination' : 'Stop notice initiated'}.
                            {lease.terminationRequest?.reason ? ` Reason: "${lease.terminationRequest.reason}"` : ''}
                          </Alert>
                        )}
                        {lease.status === 'TERMINATED' && (
                          <Alert severity="info" sx={{ my: 1.5, borderRadius: 2 }}>
                            <strong>Lease Terminated & Property Vacated:</strong> Contract has been terminated and this property was automatically returned to <strong>Available</strong> status for other rent.
                          </Alert>
                        )}

                        <Divider sx={{ my: 2, borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0' }} />

                        <Grid container spacing={2} sx={{ mb: 2 }}>
                          <Grid item xs={12} sm={4}>
                            <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>Lease Period</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: isDark ? '#f1f5f9' : '#0f172a' }}>
                              {new Date(lease.startDate).toLocaleDateString()} - {new Date(lease.endDate).toLocaleDateString()}
                            </Typography>
                          </Grid>
                          <Grid item xs={12} sm={4}>
                            <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>Security Deposit</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: isDark ? '#f1f5f9' : '#0f172a' }}>
                              ETB {lease.securityDeposit?.toLocaleString()}
                            </Typography>
                          </Grid>
                          <Grid item xs={12} sm={4}>
                            <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>Signatures</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: lease.signedByTenant ? '#10b981' : '#f59e0b' }}>
                              Tenant: {lease.signedByTenant ? 'Signed ✓' : 'Awaiting'} • Landlord: {lease.signedByLandlord ? 'Signed ✓' : 'Pending'}
                            </Typography>
                          </Grid>
                        </Grid>

                        <Stack direction="row" spacing={1.5} flexWrap="wrap">
                          <Button
                            variant="outlined"
                            startIcon={<Receipt />}
                            onClick={() => setSelectedLease(lease)}
                            sx={{ borderRadius: 2, textTransform: 'none' }}
                          >
                            Inspect Legal Agreement
                          </Button>
                          {lease.status === 'TERMINATION_REQUESTED' && (
                            <Button
                              variant="contained"
                              color="error"
                              onClick={() => setSelectedLease(lease)}
                              sx={{ borderRadius: 2, textTransform: 'none' }}
                            >
                              Respond to Stop Request
                            </Button>
                          )}
                        </Stack>
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              )}
            </motion.div>
          )}

          {/* ════ TAB 3: PURCHASE OFFERS ════ */}
          {activeTab === 3 && (
            <motion.div key="tab-offers" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {offers.length === 0 ? (
                <Paper elevation={0} sx={{ p: 6, textAlign: 'center', borderRadius: 3, border: '1px dashed', borderColor: isDark ? 'rgba(0, 255, 255, 0.2)' : '#cbd5e1', bgcolor: isDark ? '#0f172a40' : '#f8fafc' }}>
                  <LocalOffer sx={{ fontSize: 48, color: '#f59e0b', mb: 1, opacity: 0.8 }} />
                  <Typography variant="h6" sx={{ fontWeight: 700, color: isDark ? '#f1f5f9' : '#0f172a' }}>No purchase offers received</Typography>
                  <Typography variant="body2" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>When buyers submit purchase offers or counter-proposals on sale properties, negotiations will be handled here.</Typography>
                </Paper>
              ) : (
                <Stack spacing={3}>
                  {offers.map((offer) => (
                    <Card key={offer._id} sx={{ borderRadius: 3, bgcolor: isDark ? '#112240' : '#ffffff', border: `1px solid ${isDark ? '#233554' : '#e2e8f0'}`, p: 1 }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2, mb: 2 }}>
                          <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                              <Typography variant="h6" sx={{ fontWeight: 800, color: isDark ? '#f1f5f9' : '#0f172a' }}>
                                {(typeof offer.houseId === 'object' && offer.houseId) ? (offer.houseId.title || 'Purchase Negotiation') : 'Purchase Negotiation'}
                              </Typography>
                              <Chip
                                size="small"
                                label={offer.status.replace(/_/g, ' ')}
                                color={
                                  offer.status === 'COMPLETED_SALE'
                                    ? 'success'
                                    : offer.status === 'PAYMENT_MILESTONES_ACTIVE' || offer.status === 'RESERVATION_DEPOSIT_PAID' || offer.status === 'OFFER_ACCEPTED'
                                    ? 'primary'
                                    : offer.status === 'UNDER_NEGOTIATION'
                                    ? 'info'
                                    : 'warning'
                                }
                                sx={{ fontWeight: 700 }}
                              />
                            </Box>
                            <Typography variant="body2" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>
                              Buyer: {offer.buyerName} ({offer.buyerPhone || offer.buyerEmail}) • Financing: {offer.financingType}
                            </Typography>
                          </Box>

                          <Box sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
                            <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>Proposed Bid</Typography>
                            <Typography variant="h5" sx={{ fontWeight: 800, color: '#10b981' }}>
                              ETB {offer.currentOfferAmount?.toLocaleString()}
                            </Typography>
                            <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>
                              Asking Price: ETB {offer.askingPriceAtOffer?.toLocaleString()}
                            </Typography>
                          </Box>
                        </Box>

                        <Divider sx={{ my: 1.5, borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0' }} />

                        {/* Negotiation Chat Timeline */}
                        {offer.negotiationTimeline && offer.negotiationTimeline.length > 0 && (
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: isDark ? '#f1f5f9' : '#0f172a', mb: 1 }}>
                              Negotiation Trail
                            </Typography>
                            <Stack spacing={1} sx={{ mb: 1.5 }}>
                              {offer.negotiationTimeline.map((item, idx) => (
                                <Box
                                  key={idx}
                                  sx={{
                                    p: 1.2,
                                    borderRadius: 2,
                                    bgcolor: item.senderRole === 'buyer' ? 'rgba(6, 182, 212, 0.08)' : 'rgba(16, 185, 129, 0.08)',
                                    borderLeft: '4px solid',
                                    borderColor: item.senderRole === 'buyer' ? '#06b6d4' : '#10b981'
                                  }}
                                >
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'capitalize', color: isDark ? '#f1f5f9' : '#0f172a' }}>
                                      {item.senderRole}: ETB {item.proposedAmount?.toLocaleString()}
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>
                                      {new Date(item.timestamp).toLocaleDateString()}
                                    </Typography>
                                  </Box>
                                  <Typography variant="body2" sx={{ mt: 0.5, color: isDark ? '#e2e8f0' : '#334155' }}>
                                    {item.message}
                                  </Typography>
                                </Box>
                              ))}
                            </Stack>
                          </Box>
                        )}

                        {/* Purchase Escrow & Payment Milestones Schedule */}
                        {offer.milestones && offer.milestones.length > 0 && (
                          <Box sx={{ mb: 2.5, p: 2, borderRadius: 2.5, bgcolor: isDark ? '#0a192f' : '#f8fafc', border: `1px solid ${isDark ? '#233554' : '#e2e8f0'}` }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: isDark ? '#f1f5f9' : '#0f172a', display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Shield sx={{ fontSize: 18, color: '#10b981' }} />
                                Property Purchase Payment Schedule & Escrow Milestones
                              </Typography>
                              <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>
                                Settled: ETB {offer.milestones.filter(m => m.status === 'PAID' || m.status === 'VERIFIED').reduce((sum, m) => sum + (m.amount || 0), 0).toLocaleString()} / ETB {offer.currentOfferAmount?.toLocaleString()}
                              </Typography>
                            </Box>

                            <Grid container spacing={1.5}>
                              {offer.milestones.map((m: any, idx: number) => {
                                const isPaid = m.status === 'PAID' || m.status === 'VERIFIED';
                                const isReview = m.status === 'UNDER_REVIEW';

                                return (
                                  <Grid item xs={12} sm={4} key={m._id || m.id || idx}>
                                    <Paper
                                      elevation={0}
                                      sx={{
                                        p: 1.8,
                                        borderRadius: 2,
                                        bgcolor: isDark ? '#112240' : '#ffffff',
                                        border: `1.5px solid ${isPaid ? '#10b981' : isReview ? '#f59e0b' : isDark ? '#233554' : '#cbd5e1'}`,
                                        height: '100%',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'space-between'
                                      }}
                                    >
                                      <Box>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                          <Typography variant="caption" sx={{ fontWeight: 700, color: isDark ? '#94a3b8' : '#64748b' }}>
                                            Milestone {idx + 1} ({m.percentage}%)
                                          </Typography>
                                          <Chip
                                            size="small"
                                            label={isPaid ? 'PAID ✓' : isReview ? 'VERIFICATION REQ' : 'PENDING'}
                                            color={isPaid ? 'success' : isReview ? 'warning' : 'default'}
                                            sx={{ fontWeight: 800, fontSize: '0.65rem', height: 20 }}
                                          />
                                        </Box>
                                        <Typography variant="body2" sx={{ fontWeight: 700, color: isDark ? '#f1f5f9' : '#0f172a', mb: 0.5 }}>
                                          {m.title}
                                        </Typography>
                                        <Typography variant="h6" sx={{ fontWeight: 800, color: '#10b981', mb: 0.5 }}>
                                          ETB {m.amount?.toLocaleString()}
                                        </Typography>
                                        <Typography variant="caption" sx={{ display: 'block', color: isDark ? '#94a3b8' : '#64748b' }}>
                                          Due: {new Date(m.dueDate).toLocaleDateString()}
                                        </Typography>
                                        {m.transactionReference && (
                                          <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: '#06b6d4', fontWeight: 600 }}>
                                            Tx Ref: {m.transactionReference}
                                          </Typography>
                                        )}
                                        {m.receiptNumber && (
                                          <Typography variant="caption" sx={{ display: 'block', color: '#10b981', fontWeight: 600 }}>
                                            Receipt: {m.receiptNumber}
                                          </Typography>
                                        )}
                                      </Box>

                                      <Box sx={{ mt: 1.5 }}>
                                        {isReview && (
                                          <Button
                                            fullWidth
                                            size="small"
                                            variant="contained"
                                            color="success"
                                            onClick={() => handleApproveMilestone(offer._id, m._id || m.id, m.amount)}
                                            sx={{ borderRadius: 1.5, fontWeight: 700, textTransform: 'none', py: 0.5 }}
                                          >
                                            Verify & Approve
                                          </Button>
                                        )}
                                        {isPaid && (
                                          <Button
                                            fullWidth
                                            size="small"
                                            variant="outlined"
                                            color="success"
                                            startIcon={<Receipt sx={{ fontSize: 16 }} />}
                                            onClick={() => {
                                              setReceiptOffer(offer);
                                              setReceiptMilestone(m);
                                            }}
                                            sx={{ borderRadius: 1.5, fontWeight: 700, textTransform: 'none', py: 0.5 }}
                                          >
                                            View Sales Receipt
                                          </Button>
                                        )}
                                        {!isPaid && !isReview && (
                                          <Button
                                            fullWidth
                                            size="small"
                                            variant="outlined"
                                            onClick={() => {
                                              setDirectPayOffer(offer);
                                              setDirectPayMilestone(m);
                                            }}
                                            sx={{ borderRadius: 1.5, textTransform: 'none', py: 0.5 }}
                                          >
                                            Record Payment
                                          </Button>
                                        )}
                                      </Box>
                                    </Paper>
                                  </Grid>
                                );
                              })}
                            </Grid>
                          </Box>
                        )}

                        {/* Offer Actions */}
                        {offer.status !== 'OFFER_ACCEPTED' && offer.status !== 'COMPLETED_SALE' && offer.status !== 'OFFER_REJECTED' && (
                          <Stack direction="row" spacing={1.5} flexWrap="wrap">
                            <Button
                              variant="contained"
                              color="success"
                              startIcon={<CheckCircle />}
                              onClick={() => handleOfferStatus(offer._id, 'OFFER_ACCEPTED')}
                              sx={{ borderRadius: 2, textTransform: 'none' }}
                            >
                              Accept Purchase Offer
                            </Button>
                            <Button
                              variant="outlined"
                              onClick={() => {
                                setSelectedOffer(offer);
                                setCounterForm({ proposedAmount: String(offer.currentOfferAmount || ''), message: '' });
                                setCounterModalOpen(true);
                              }}
                              sx={{ borderRadius: 2, textTransform: 'none' }}
                            >
                              Send Counter-Offer
                            </Button>
                            <Button
                              variant="outlined"
                              color="error"
                              startIcon={<Cancel />}
                              onClick={() => handleOfferStatus(offer._id, 'OFFER_REJECTED')}
                              sx={{ borderRadius: 2, textTransform: 'none' }}
                            >
                              Reject
                            </Button>
                          </Stack>
                        )}

                        {(offer.status === 'OFFER_ACCEPTED' || offer.status === 'PAYMENT_MILESTONES_ACTIVE' || offer.status === 'RESERVATION_DEPOSIT_PAID') && (
                          <Button
                            variant="contained"
                            color="primary"
                            onClick={() => handleOfferStatus(offer._id, 'COMPLETED_SALE')}
                            sx={{ borderRadius: 2, textTransform: 'none' }}
                          >
                            Mark Sale as Finalized & Transfer Deed
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              )}
            </motion.div>
          )}

          {/* ════ TAB 4: MAINTENANCE ════ */}
          {activeTab === 4 && (
            <motion.div key="tab-maint" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {maintenanceTickets.length === 0 ? (
                <Paper elevation={0} sx={{ p: 6, textAlign: 'center', borderRadius: 3, border: '1px dashed', borderColor: isDark ? 'rgba(0, 255, 255, 0.2)' : '#cbd5e1', bgcolor: isDark ? '#0f172a40' : '#f8fafc' }}>
                  <Build sx={{ fontSize: 48, color: '#ef4444', mb: 1, opacity: 0.8 }} />
                  <Typography variant="h6" sx={{ fontWeight: 700, color: isDark ? '#f1f5f9' : '#0f172a' }}>No maintenance tickets reported</Typography>
                  <Typography variant="body2" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>When tenants report plumbing, electrical, or structural damage, dispatch tickets will appear here.</Typography>
                </Paper>
              ) : (
                <Stack spacing={2.5}>
                  {maintenanceTickets.map((ticket) => (
                    <Paper key={ticket._id} elevation={0} sx={{ p: 3, borderRadius: 3, bgcolor: isDark ? '#112240' : '#ffffff', border: `1px solid ${isDark ? '#233554' : '#e2e8f0'}` }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1, mb: 1.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip size="small" label={ticket.category} sx={{ fontWeight: 600 }} />
                          <Chip
                            size="small"
                            label={`${ticket.priority} Priority`}
                            color={ticket.priority === 'HIGH' || ticket.priority === 'EMERGENCY' ? 'error' : 'default'}
                            sx={{ fontWeight: 700 }}
                          />
                        </Box>
                        <Chip
                          size="small"
                          label={ticket.status}
                          color={ticket.status === 'COMPLETED' ? 'success' : ticket.status === 'IN_PROGRESS' ? 'primary' : 'warning'}
                          sx={{ fontWeight: 700 }}
                        />
                      </Box>

                      <Typography variant="h6" sx={{ fontWeight: 800, color: isDark ? '#f1f5f9' : '#0f172a' }}>
                        {ticket.title}
                      </Typography>
                      <Typography variant="body2" sx={{ color: isDark ? '#94a3b8' : '#64748b', mt: 0.5, mb: 1.5 }}>
                        {ticket.description}
                      </Typography>

                      <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>
                        Property: {(typeof ticket.houseId === 'object' && ticket.houseId) ? (ticket.houseId.title || 'Rental Unit') : 'Rental Unit'} • Tenant: {ticket.tenantName} ({ticket.tenantPhone})
                      </Typography>

                      {ticket.assignedTechnician && (
                        <Box sx={{ mt: 1.5, p: 1.5, bgcolor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#f8fafc', borderRadius: 2 }}>
                          <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>Assigned Technician:</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: isDark ? '#f1f5f9' : '#0f172a' }}>
                            {ticket.assignedTechnician} (Contact: {ticket.technicianContact || 'N/A'})
                          </Typography>
                          {ticket.resolutionNotes && (
                            <Typography variant="caption" sx={{ display: 'block', color: isDark ? '#94a3b8' : '#64748b', mt: 0.5 }}>
                              Resolution: {ticket.resolutionNotes}
                            </Typography>
                          )}
                        </Box>
                      )}

                      <Divider sx={{ my: 1.5, borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0' }} />

                      <Button
                        variant="outlined"
                        startIcon={<Build />}
                        onClick={() => {
                          setSelectedTicket(ticket);
                          setMaintenanceForm({
                            status: ticket.status || 'IN_PROGRESS',
                            assignedTechnician: ticket.assignedTechnician || '',
                            technicianContact: ticket.technicianContact || '',
                            estimatedCost: String(ticket.estimatedCost || ''),
                            actualCost: '',
                            resolutionNotes: ticket.resolutionNotes || ''
                          });
                          setMaintenanceModalOpen(true);
                        }}
                        sx={{ borderRadius: 2, textTransform: 'none' }}
                      >
                        Dispatch / Update Ticket Status
                      </Button>
                    </Paper>
                  ))}
                </Stack>
              )}
            </motion.div>
          )}

          {/* ════ TAB 5: LISTING REPORTS (ADMIN ONLY) ════ */}
          {activeTab === 5 && user?.role === 'admin' && (
            <motion.div key="tab-reports" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {reports.length === 0 ? (
                <Paper elevation={0} sx={{ p: 6, textAlign: 'center', borderRadius: 3, border: '1px dashed', borderColor: isDark ? 'rgba(0, 255, 255, 0.2)' : '#cbd5e1', bgcolor: isDark ? '#0f172a40' : '#f8fafc' }}>
                  <ReportProblem sx={{ fontSize: 48, color: '#f59e0b', mb: 1, opacity: 0.8 }} />
                  <Typography variant="h6" sx={{ fontWeight: 700, color: isDark ? '#f1f5f9' : '#0f172a' }}>No listing violation reports</Typography>
                  <Typography variant="body2" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>User reports regarding fraudulent, misleading, or incorrect house listings appear here.</Typography>
                </Paper>
              ) : (
                <Stack spacing={2.5}>
                  {reports.map((report) => (
                    <Paper key={report._id} elevation={0} sx={{ p: 3, borderRadius: 3, bgcolor: isDark ? '#112240' : '#ffffff', border: `1px solid ${isDark ? '#233554' : '#e2e8f0'}` }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Chip size="small" label={report.reason} color="error" sx={{ fontWeight: 700 }} />
                        <Chip size="small" label={report.status} color={report.status === 'RESOLVED' ? 'success' : report.status === 'PENDING' ? 'warning' : 'default'} />
                      </Box>

                      <Typography variant="h6" sx={{ fontWeight: 700, color: isDark ? '#f1f5f9' : '#0f172a', mt: 1 }}>
                        Target: {(typeof report.houseId === 'object' && report.houseId) ? (report.houseId.title || 'Reported House Listing') : 'Reported House Listing'}
                      </Typography>

                      <Typography variant="body2" sx={{ color: isDark ? '#94a3b8' : '#64748b', my: 1 }}>
                        {report.description}
                      </Typography>

                      <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>
                        Reported By: {report.reporterEmail} • Date: {new Date(report.createdAt).toLocaleDateString()}
                      </Typography>

                      <Box sx={{ mt: 2 }}>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<Shield />}
                          onClick={() => {
                            setSelectedReport(report);
                            setReportForm({ status: report.status || 'RESOLVED', adminNotes: report.adminNotes || '', suspendListing: false });
                            setReportModalOpen(true);
                          }}
                          sx={{ borderRadius: 2, textTransform: 'none' }}
                        >
                          Review & Moderate Listing
                        </Button>
                      </Box>
                    </Paper>
                  ))}
                </Stack>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* ─── MODALS ─── */}

      {/* 1. Reschedule Appointment Modal */}
      <Dialog open={rescheduleModalOpen} onClose={() => setRescheduleModalOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Reschedule Viewing</DialogTitle>
        <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="New Visit Date"
            type="date"
            InputLabelProps={{ shrink: true }}
            value={rescheduleForm.date}
            onChange={(e) => setRescheduleForm({ ...rescheduleForm, date: e.target.value })}
            required
            fullWidth
          />
          <TextField
            label="Preferred Time Slot"
            placeholder="e.g. 02:00 PM - 03:30 PM"
            value={rescheduleForm.timeSlot}
            onChange={(e) => setRescheduleForm({ ...rescheduleForm, timeSlot: e.target.value })}
            required
            fullWidth
          />
          <TextField
            label="Reason for Rescheduling"
            multiline
            rows={2}
            value={rescheduleForm.reason}
            onChange={(e) => setRescheduleForm({ ...rescheduleForm, reason: e.target.value })}
            fullWidth
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setRescheduleModalOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => {
              if (selectedAppointment && rescheduleForm.date) {
                handleUpdateAppointment(selectedAppointment._id, 'RESCHEDULED', {
                  rescheduledDate: rescheduleForm.date,
                  rescheduledTimeSlot: rescheduleForm.timeSlot,
                  rescheduledReason: rescheduleForm.reason
                });
              }
            }}
          >
            Confirm Reschedule
          </Button>
        </DialogActions>
      </Dialog>

      {/* 2. Counter-Offer Modal */}
      <Dialog open={counterModalOpen} onClose={() => setCounterModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Send Counter-Offer</DialogTitle>
        <form onSubmit={handleSendCounterOffer}>
          <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Proposed Counter Price (ETB)"
              type="number"
              required
              fullWidth
              value={counterForm.proposedAmount}
              onChange={(e) => setCounterForm({ ...counterForm, proposedAmount: e.target.value })}
            />
            <TextField
              label="Message to Buyer"
              multiline
              rows={3}
              required
              fullWidth
              placeholder="Explain the terms or reasons for this counter-price..."
              value={counterForm.message}
              onChange={(e) => setCounterForm({ ...counterForm, message: e.target.value })}
            />
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setCounterModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" sx={{ bgcolor: isDark ? '#00ffff' : '#0284c7', color: isDark ? '#0a192f' : '#ffffff' }}>
              Send Counter Offer
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* 3. Maintenance Dispatch Modal */}
      <Dialog open={maintenanceModalOpen} onClose={() => setMaintenanceModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Update Maintenance Ticket</DialogTitle>
        <form onSubmit={handleUpdateMaintenance}>
          <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Ticket Status</InputLabel>
              <Select
                value={maintenanceForm.status}
                label="Ticket Status"
                onChange={(e) => setMaintenanceForm({ ...maintenanceForm, status: e.target.value })}
              >
                <MenuItem value="PENDING">Pending (Unassigned)</MenuItem>
                <MenuItem value="IN_PROGRESS">In Progress (Technician Dispatched)</MenuItem>
                <MenuItem value="COMPLETED">Completed (Resolved)</MenuItem>
                <MenuItem value="CANCELLED">Cancelled</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Assigned Technician Name"
              fullWidth
              value={maintenanceForm.assignedTechnician}
              onChange={(e) => setMaintenanceForm({ ...maintenanceForm, assignedTechnician: e.target.value })}
            />
            <TextField
              label="Technician Phone Number"
              fullWidth
              value={maintenanceForm.technicianContact}
              onChange={(e) => setMaintenanceForm({ ...maintenanceForm, technicianContact: e.target.value })}
            />
            <TextField
              label="Estimated Cost (ETB)"
              type="number"
              fullWidth
              value={maintenanceForm.estimatedCost}
              onChange={(e) => setMaintenanceForm({ ...maintenanceForm, estimatedCost: e.target.value })}
            />
            <TextField
              label="Resolution Notes"
              multiline
              rows={3}
              fullWidth
              placeholder="Work completed, parts replaced, or visit scheduling details..."
              value={maintenanceForm.resolutionNotes}
              onChange={(e) => setMaintenanceForm({ ...maintenanceForm, resolutionNotes: e.target.value })}
            />
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setMaintenanceModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" sx={{ bgcolor: isDark ? '#00ffff' : '#0284c7', color: isDark ? '#0a192f' : '#ffffff' }}>
              Save Ticket Details
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* 4. Create New Digital Lease Modal */}
      <Dialog open={createLeaseModalOpen} onClose={() => setCreateLeaseModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Generate Digital Rental Lease</DialogTitle>
        <form onSubmit={handleCreateLease}>
          <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControl fullWidth required>
              <InputLabel>Select Property</InputLabel>
              <Select
                value={newLeaseForm.houseId}
                label="Select Property"
                onChange={(e) => {
                  const h = houses.find(x => x._id === e.target.value);
                  setNewLeaseForm({
                    ...newLeaseForm,
                    houseId: e.target.value,
                    rentAmount: h?.pricing?.price ? String(h.pricing.price) : newLeaseForm.rentAmount
                  });
                }}
              >
                {houses.map(h => (
                  <MenuItem key={h._id} value={h._id}>{h.title} (ETB {h.pricing?.price?.toLocaleString()}/mo)</MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Tenant Full Name"
              required
              fullWidth
              value={newLeaseForm.tenantName}
              onChange={(e) => setNewLeaseForm({ ...newLeaseForm, tenantName: e.target.value })}
            />
            <TextField
              label="Tenant Phone Number"
              required
              fullWidth
              value={newLeaseForm.tenantPhone}
              onChange={(e) => setNewLeaseForm({ ...newLeaseForm, tenantPhone: e.target.value })}
            />
            <TextField
              label="Tenant Email"
              type="email"
              required
              fullWidth
              value={newLeaseForm.tenantEmail}
              onChange={(e) => setNewLeaseForm({ ...newLeaseForm, tenantEmail: e.target.value })}
            />

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label="Start Date"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  required
                  fullWidth
                  value={newLeaseForm.startDate}
                  onChange={(e) => setNewLeaseForm({ ...newLeaseForm, startDate: e.target.value })}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="End Date"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  required
                  fullWidth
                  value={newLeaseForm.endDate}
                  onChange={(e) => setNewLeaseForm({ ...newLeaseForm, endDate: e.target.value })}
                />
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label="Monthly Rent (ETB)"
                  type="number"
                  required
                  fullWidth
                  value={newLeaseForm.rentAmount}
                  onChange={(e) => setNewLeaseForm({ ...newLeaseForm, rentAmount: e.target.value })}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Security Deposit (ETB)"
                  type="number"
                  fullWidth
                  value={newLeaseForm.securityDeposit}
                  onChange={(e) => setNewLeaseForm({ ...newLeaseForm, securityDeposit: e.target.value })}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setCreateLeaseModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" sx={{ bgcolor: isDark ? '#00ffff' : '#0284c7', color: isDark ? '#0a192f' : '#ffffff' }}>
              Dispatch Contract to Tenant
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* 5. Record Rent Payment Modal */}
      <Dialog open={recordPaymentModalOpen} onClose={() => setRecordPaymentModalOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Record Rent Payment</DialogTitle>
        <form onSubmit={handleRecordPayment}>
          <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Installment Number"
              type="number"
              required
              fullWidth
              value={paymentForm.installmentNumber}
              onChange={(e) => setPaymentForm({ ...paymentForm, installmentNumber: e.target.value })}
            />
            <TextField
              label="Amount Paid (ETB)"
              type="number"
              required
              fullWidth
              value={paymentForm.amount}
              onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
            />
            <FormControl fullWidth required>
              <InputLabel>Payment Channel</InputLabel>
              <Select
                value={paymentForm.method}
                label="Payment Channel"
                onChange={(e) => setPaymentForm({ ...paymentForm, method: e.target.value })}
              >
                <MenuItem value="telebirr">Telebirr Mobile Payment</MenuItem>
                <MenuItem value="cbe">Commercial Bank of Ethiopia (CBE)</MenuItem>
                <MenuItem value="cash">Direct Cash / Office Receipt</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Bank / Slip Reference Number"
              placeholder="e.g. FT234893789"
              fullWidth
              value={paymentForm.reference}
              onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })}
            />
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setRecordPaymentModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" color="success">
              Issue Official Receipt
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* 6. Review Listing Report Modal */}
      <Dialog open={reportModalOpen} onClose={() => setReportModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Listing Violation Moderation</DialogTitle>
        <form onSubmit={handleUpdateReport}>
          <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Resolution Status</InputLabel>
              <Select
                value={reportForm.status}
                label="Resolution Status"
                onChange={(e) => setReportForm({ ...reportForm, status: e.target.value })}
              >
                <MenuItem value="UNDER_INVESTIGATION">Under Investigation</MenuItem>
                <MenuItem value="RESOLVED">Resolved (Action Taken)</MenuItem>
                <MenuItem value="DISMISSED">Dismissed (False Report)</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Admin Investigation Notes"
              multiline
              rows={3}
              fullWidth
              value={reportForm.adminNotes}
              onChange={(e) => setReportForm({ ...reportForm, adminNotes: e.target.value })}
            />

            <FormControlLabel
              control={
                <Switch
                  checked={reportForm.suspendListing}
                  onChange={(e) => setReportForm({ ...reportForm, suspendListing: e.target.checked })}
                  color="error"
                />
              }
              label="Immediately suspend and delist this property from public marketplace"
            />
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setReportModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" color="error">
              Apply Moderation Action
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* 8. Review Rental Application Modal */}
      <Dialog open={appReviewModalOpen} onClose={() => setAppReviewModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>
          {appReviewStatus === 'APPROVED' ? 'Approve Rental Application & Generate Lease' : 'Decline Rental Application'}
        </DialogTitle>
        <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {selectedApp && (
            <Box sx={{ p: 2, borderRadius: 2, bgcolor: isDark ? '#1e293b' : '#f1f5f9' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                Applicant: {selectedApp.fullName}
              </Typography>
              <Typography variant="body2" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>
                Property: {(typeof selectedApp.houseId === 'object' && selectedApp.houseId) ? (selectedApp.houseId.title || 'Property') : 'Property'}
              </Typography>
              <Typography variant="body2" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>
                Income: ETB {selectedApp.monthlyIncome?.toLocaleString()} • Move-in: {new Date(selectedApp.preferredMoveInDate).toLocaleDateString()}
              </Typography>
            </Box>
          )}

          <Typography variant="body2" sx={{ color: isDark ? '#ccd6f6' : '#334155' }}>
            {appReviewStatus === 'APPROVED'
              ? 'Approving this application will automatically generate a draft Lease Agreement for this tenant and notify them in their Customer Portal to review and sign.'
              : 'Declining this application will notify the applicant with your optional notes.'}
          </Typography>

          <TextField
            label="Decision / Reviewer Notes (Optional)"
            multiline
            rows={3}
            fullWidth
            value={appAdminNotes}
            onChange={(e) => setAppAdminNotes(e.target.value)}
            placeholder="Add any instructions or conditions for the applicant..."
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setAppReviewModalOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color={appReviewStatus === 'APPROVED' ? 'success' : 'error'}
            onClick={() => handleUpdateAppStatus(appReviewStatus)}
            sx={{ fontWeight: 700 }}
          >
            {appReviewStatus === 'APPROVED' ? 'Confirm Approval & Create Lease' : 'Confirm Decline'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 7. Lease Viewer Modal */}
      {selectedLease && (
        <LeaseAgreementModal
          open={Boolean(selectedLease)}
          onClose={() => setSelectedLease(null)}
          lease={selectedLease}
          isTenant={false}
          onSuccess={() => fetchData(false)}
        />
      )}

      {/* 8. Purchase Official Receipt Modal */}
      <PurchaseReceiptModal
        open={Boolean(receiptOffer && receiptMilestone)}
        onClose={() => {
          setReceiptOffer(null);
          setReceiptMilestone(null);
        }}
        offer={receiptOffer}
        milestone={receiptMilestone}
      />

      {/* 9. Purchase Milestone Direct Payment Modal */}
      <PurchaseMilestonePaymentModal
        open={Boolean(directPayOffer && directPayMilestone)}
        onClose={() => {
          setDirectPayOffer(null);
          setDirectPayMilestone(null);
        }}
        offer={directPayOffer}
        milestone={directPayMilestone}
        onSuccess={() => {
          setDirectPayOffer(null);
          setDirectPayMilestone(null);
          fetchData(false);
        }}
      />

      {/* Feedback Snackbar */}
      <Snackbar open={Boolean(snackbar)} autoHideDuration={5000} onClose={() => setSnackbar('')} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity={snackbarSeverity} onClose={() => setSnackbar('')} sx={{ borderRadius: 2 }}>
          {snackbar}
        </Alert>
      </Snackbar>
    </Box>
  );
}
