'use client';

import { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Tabs, Tab, Button,
  Chip, Avatar, Paper, Divider, IconButton, Alert, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  FormControl, InputLabel, Select, MenuItem, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Tooltip
} from '@mui/material';
import Navbar from '@/components/ui/Navbar';
import {
  Favorite, Bookmark, CalendarMonth, Article, LocalOffer,
  Build, Receipt, CheckCircle, Warning, HourglassEmpty,
  Add, Close, Print, Visibility, LocationOn, Person, Phone, Email
} from '@mui/icons-material';
import api from '@/app/utils/api';
import { Appointment, LeaseAgreement, PurchaseOffer, MaintenanceRequest, SavedSearch, House } from '@/types/houses';
import LeaseAgreementModal from '@/components/LeaseAgreementModal';
import Link from 'next/link';

export default function CustomerDashboardPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);

  // Data states
  const [appointments, setAppointments] = useState<Appointment[]>([]);
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

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [appRes, leaseRes, offerRes, maintRes, searchRes] = await Promise.allSettled([
        api.get('/workflows/appointments'),
        api.get('/workflows/leases'),
        api.get('/workflows/offers'),
        api.get('/workflows/maintenance'),
        api.get('/properties/saved-searches')
      ]);

      if (appRes.status === 'fulfilled') setAppointments(appRes.value.data?.data || []);
      if (leaseRes.status === 'fulfilled') setLeases(leaseRes.value.data?.data || []);
      if (offerRes.status === 'fulfilled') setOffers(offerRes.value.data?.data || []);
      if (maintRes.status === 'fulfilled') setMaintenanceTickets(maintRes.value.data?.data || []);
      if (searchRes.status === 'fulfilled') setSavedSearches(searchRes.value.data?.data || []);

      // Fetch sample favorited properties
      const propRes = await api.get('/public/houses?limit=3');
      if (propRes.data?.success) {
        setSavedProperties(propRes.data.data?.houses || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

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
      setMaintenanceModalOpen(false);
      setNewTicket({ houseId: '', category: 'PLUMBING', priority: 'MEDIUM', title: '', description: '' });
      fetchDashboardData();
    } catch (err: any) {
      setSnackbar(err.response?.data?.message || 'Failed to submit maintenance ticket');
    } finally {
      setTicketLoading(false);
    }
  };

  const handleDeleteSavedSearch = async (id: string) => {
    try {
      await api.delete(`/properties/saved-searches/${id}`);
      setSavedSearches(prev => prev.filter(s => s._id !== id));
      setSnackbar('Search alert removed');
    } catch (err) {
      // Ignored
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', pt: { xs: 8, md: 10 }, pb: 10 }}>
      <Navbar />

      <Box sx={{ maxWidth: 1280, mx: 'auto', px: { xs: 2, sm: 3 } }}>
        {/* Header Strip */}
        <Box sx={{ py: 3, mb: 1 }}>
          <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', mb: 0.5 }}>
            Customer Management Portal
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary' }}>
            Manage your scheduled viewings, active lease contracts, rent receipts, purchase negotiations, and repair requests.
          </Typography>
        </Box>

        {/* Dashboard Navigation Tabs */}
        <Paper elevation={0} sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper', borderRadius: 3, mb: 4 }}>
          <Tabs
            value={activeTab}
            onChange={(_, val) => setActiveTab(val)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ px: 2 }}
          >
            <Tab icon={<CalendarMonth />} iconPosition="start" label={`My Viewings (${appointments.length})`} />
            <Tab icon={<Article />} iconPosition="start" label={`Active Leases (${leases.length})`} />
            <Tab icon={<LocalOffer />} iconPosition="start" label={`Purchase Offers (${offers.length})`} />
            <Tab icon={<Build />} iconPosition="start" label={`Maintenance (${maintenanceTickets.length})`} />
            <Tab icon={<Bookmark />} iconPosition="start" label={`Saved Searches (${savedSearches.length})`} />
            <Tab icon={<Favorite />} iconPosition="start" label={`Favorites (${savedProperties.length})`} />
          </Tabs>
        </Paper>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress sx={{ color: '#06b6d4' }} />
          </Box>
        ) : (
          <Box>
            {/* ─── TAB 0: APPOINTMENTS & VIEWINGS ────────────────────── */}
            {activeTab === 0 && (
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    Scheduled Property Viewings
                  </Typography>
                  <Button component={Link} href="/public/houses" variant="contained" size="small" sx={{ bgcolor: '#06b6d4', borderRadius: 2 }}>
                    Explore More Properties
                  </Button>
                </Box>

                {appointments.length === 0 ? (
                  <Paper elevation={0} sx={{ p: 6, textAlign: 'center', borderRadius: 3, border: '1px dashed', borderColor: 'divider' }}>
                    <CalendarMonth sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>No viewings scheduled yet</Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>Browse properties and schedule a private in-person or live video viewing.</Typography>
                    <Button component={Link} href="/public/houses" variant="contained" sx={{ bgcolor: '#06b6d4' }}>Find Properties</Button>
                  </Paper>
                ) : (
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3 }}>
                    {appointments.map((app) => (
                      <Card key={app._id} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
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
                              sx={{ bgcolor: 'action.hover', fontWeight: 600 }}
                            />
                          </Box>

                          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                            {typeof app.houseId === 'object' ? app.houseId.title : 'Property Viewing'}
                          </Typography>

                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.8, color: 'text.secondary', my: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <CalendarMonth fontSize="small" sx={{ color: '#06b6d4' }} />
                              <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                                Date: {new Date(app.visitDate).toLocaleDateString()} ({app.timeSlot})
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Person fontSize="small" />
                              <Typography variant="body2">Representative: {app.hostId?.name || 'Assigned Real Estate Agent'}</Typography>
                            </Box>
                          </Box>

                          {app.notes && (
                            <Typography variant="body2" sx={{ bgcolor: 'action.hover', p: 1.5, borderRadius: 2, mb: 2, fontSize: 13 }}>
                              Note: {app.notes}
                            </Typography>
                          )}

                          {typeof app.houseId === 'object' && (
                            <Button
                              component={Link}
                              href={`/public/houses/${app.houseId._id}`}
                              size="small"
                              variant="outlined"
                              fullWidth
                              sx={{ borderRadius: 2, textTransform: 'none' }}
                            >
                              View Property Specifications
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </Box>
                )}
              </Box>
            )}

            {/* ─── TAB 1: ACTIVE LEASE AGREEMENTS & RENT RECEIPTS ──── */}
            {activeTab === 1 && (
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
                  My Active Tenancy Agreements & Rent Payment Records
                </Typography>

                {leases.length === 0 ? (
                  <Paper elevation={0} sx={{ p: 6, textAlign: 'center', borderRadius: 3, border: '1px dashed', borderColor: 'divider' }}>
                    <Article sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>No active rental lease agreements</Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>Once your rental application is approved, your digital contract and receipts appear here.</Typography>
                  </Paper>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {leases.map((lease) => (
                      <Card key={lease._id} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                        <CardContent sx={{ p: 3 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2, mb: 2 }}>
                            <Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                                  Agreement #{lease.agreementNumber}
                                </Typography>
                                <Chip
                                  size="small"
                                  label={lease.status}
                                  color={lease.status === 'ACTIVE' ? 'success' : 'warning'}
                                  sx={{ fontWeight: 700 }}
                                />
                              </Box>
                              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                Property: {typeof lease.houseId === 'object' ? lease.houseId.title : 'Rental Apartment'}
                              </Typography>
                            </Box>

                            <Box sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
                              <Typography variant="caption" sx={{ color: 'text.secondary' }}>Monthly Rent</Typography>
                              <Typography variant="h5" sx={{ fontWeight: 800, color: '#06b6d4' }}>
                                ETB {lease.rentAmount.toLocaleString()}
                              </Typography>
                            </Box>
                          </Box>

                          <Divider sx={{ my: 2 }} />

                          {/* Term Dates & Signatures */}
                          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2, mb: 3 }}>
                            <Box>
                              <Typography variant="caption" sx={{ color: 'text.secondary' }}>Lease Period</Typography>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {new Date(lease.startDate).toLocaleDateString()} - {new Date(lease.endDate).toLocaleDateString()}
                              </Typography>
                            </Box>
                            <Box>
                              <Typography variant="caption" sx={{ color: 'text.secondary' }}>Security Deposit</Typography>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                ETB {lease.securityDeposit.toLocaleString()}
                              </Typography>
                            </Box>
                            <Box>
                              <Typography variant="caption" sx={{ color: 'text.secondary' }}>Tenant Signature</Typography>
                              <Typography variant="body2" sx={{ color: lease.signedByTenant ? '#10b981' : 'warning.main', fontWeight: 700 }}>
                                {lease.signedByTenant ? 'Digitally Signed' : 'Signature Required'}
                              </Typography>
                            </Box>
                          </Box>

                          <Button
                            variant="contained"
                            onClick={() => setSelectedLease(lease)}
                            startIcon={<Receipt />}
                            sx={{
                              bgcolor: '#06b6d4',
                              '&:hover': { bgcolor: '#0891b2' },
                              borderRadius: 2,
                              textTransform: 'none',
                              fontWeight: 700
                            }}
                          >
                            View Contract, Rent Schedule & Official Receipts
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </Box>
                )}
              </Box>
            )}

            {/* ─── TAB 2: PURCHASE OFFERS & SALES WORKFLOW ────────── */}
            {activeTab === 2 && (
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
                  My Outright Purchase Offers & Negotiations
                </Typography>

                {offers.length === 0 ? (
                  <Paper elevation={0} sx={{ p: 6, textAlign: 'center', borderRadius: 3, border: '1px dashed', borderColor: 'divider' }}>
                    <LocalOffer sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>No purchase offers submitted</Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>When you submit bids on properties for sale, live negotiations and milestone statuses appear here.</Typography>
                  </Paper>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {offers.map((offer) => (
                      <Card key={offer._id} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                        <CardContent sx={{ p: 3 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2, flexWrap: 'wrap', gap: 2 }}>
                            <Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                  {typeof offer.houseId === 'object' ? offer.houseId.title : 'Purchase Bid'}
                                </Typography>
                                <Chip
                                  size="small"
                                  label={offer.status.replace(/_/g, ' ')}
                                  color={offer.status === 'OFFER_ACCEPTED' ? 'success' : offer.status === 'UNDER_NEGOTIATION' ? 'primary' : 'warning'}
                                  sx={{ fontWeight: 700 }}
                                />
                              </Box>
                              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                Financing: {offer.financingType} • Earnest Deposit: ETB {offer.earnestDepositAmount.toLocaleString()}
                              </Typography>
                            </Box>

                            <Box sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
                              <Typography variant="caption" sx={{ color: 'text.secondary' }}>Current Proposed Price</Typography>
                              <Typography variant="h5" sx={{ fontWeight: 800, color: '#10b981' }}>
                                ETB {offer.currentOfferAmount.toLocaleString()}
                              </Typography>
                            </Box>
                          </Box>

                          <Divider sx={{ my: 2 }} />

                          {/* Negotiation Chat Timeline */}
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
                            Negotiation History
                          </Typography>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 3 }}>
                            {offer.negotiationTimeline.map((step, idx) => (
                              <Box
                                key={idx}
                                sx={{
                                  p: 1.5,
                                  borderRadius: 2,
                                  bgcolor: step.senderRole === 'buyer' ? 'rgba(6, 182, 212, 0.08)' : 'rgba(16, 185, 129, 0.08)',
                                  borderLeft: '4px solid',
                                  borderColor: step.senderRole === 'buyer' ? '#06b6d4' : '#10b981'
                                }}
                              >
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'capitalize' }}>
                                    {step.senderRole}: ETB {step.proposedAmount.toLocaleString()}
                                  </Typography>
                                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                    {new Date(step.timestamp).toLocaleDateString()}
                                  </Typography>
                                </Box>
                                <Typography variant="body2" sx={{ mt: 0.5 }}>{step.message}</Typography>
                              </Box>
                            ))}
                          </Box>

                          {/* Milestones Preview */}
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                            Payment Milestones & Deposit Escrow
                          </Typography>
                          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 1.5 }}>
                            {offer.milestones.map((m, idx) => (
                              <Paper key={idx} elevation={0} sx={{ p: 1.5, bgcolor: 'action.hover', borderRadius: 2 }}>
                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>{m.title}</Typography>
                                <Typography variant="body1" sx={{ fontWeight: 700, color: '#10b981' }}>
                                  ETB {m.amount.toLocaleString()}
                                </Typography>
                                <Chip size="small" label={m.status} sx={{ mt: 0.5, fontSize: 10 }} />
                              </Paper>
                            ))}
                          </Box>
                        </CardContent>
                      </Card>
                    ))}
                  </Box>
                )}
              </Box>
            )}

            {/* ─── TAB 3: MAINTENANCE REQUESTS ───────────────────── */}
            {activeTab === 3 && (
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    Maintenance & Repair Tickets
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => setMaintenanceModalOpen(true)}
                    sx={{ bgcolor: '#06b6d4', borderRadius: 2 }}
                  >
                    New Repair Ticket
                  </Button>
                </Box>

                {maintenanceTickets.length === 0 ? (
                  <Paper elevation={0} sx={{ p: 6, textAlign: 'center', borderRadius: 3, border: '1px dashed', borderColor: 'divider' }}>
                    <Build sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>No maintenance tickets reported</Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>Need plumbing, electrical, or structural repairs? Submit a ticket anytime.</Typography>
                  </Paper>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {maintenanceTickets.map((ticket) => (
                      <Paper key={ticket._id} elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
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

                        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{ticket.title}</Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>{ticket.description}</Typography>

                        {ticket.assignedTechnician && (
                          <Box sx={{ mt: 2, p: 1.5, bgcolor: 'action.hover', borderRadius: 2 }}>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>Assigned Technician:</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {ticket.assignedTechnician} ({ticket.technicianContact || 'Contact Landlord'})
                            </Typography>
                          </Box>
                        )}
                      </Paper>
                    ))}
                  </Box>
                )}
              </Box>
            )}

            {/* ─── TAB 4: SAVED SEARCHES ──────────────────────────── */}
            {activeTab === 4 && (
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
                  My Saved Searches & Property Alerts
                </Typography>

                {savedSearches.length === 0 ? (
                  <Paper elevation={0} sx={{ p: 6, textAlign: 'center', borderRadius: 3, border: '1px dashed', borderColor: 'divider' }}>
                    <Bookmark sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>No saved searches yet</Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>When filtering properties, click "Save Alert" to subscribe to new listings matching your criteria.</Typography>
                  </Paper>
                ) : (
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 3 }}>
                    {savedSearches.map((search) => (
                      <Paper key={search._id} elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{search.name}</Typography>
                          <IconButton size="small" onClick={() => handleDeleteSavedSearch(search._id)}>
                            <Close fontSize="small" />
                          </IconButton>
                        </Box>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          Frequency: {search.frequency} • Alerts: {search.notificationsEnabled ? 'Active' : 'Muted'}
                        </Typography>
                        <Button
                          component={Link}
                          href="/public/houses"
                          size="small"
                          variant="outlined"
                          fullWidth
                          sx={{ mt: 2, borderRadius: 2 }}
                        >
                          Execute Search
                        </Button>
                      </Paper>
                    ))}
                  </Box>
                )}
              </Box>
            )}

            {/* ─── TAB 5: FAVORITES / WISHLIST ────────────────────── */}
            {activeTab === 5 && (
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
                  Saved & Favorited Properties
                </Typography>

                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }, gap: 3 }}>
                  {savedProperties.map((house) => (
                    <Card key={house._id} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                      <CardContent sx={{ p: 2.5 }}>
                        <Typography sx={{ fontWeight: 700, fontSize: 16, mb: 1 }}>{house.title}</Typography>
                        <Typography sx={{ color: '#06b6d4', fontWeight: 800, fontSize: 18, mb: 2 }}>
                          ETB {house.pricing.price.toLocaleString()}
                        </Typography>
                        <Button
                          component={Link}
                          href={`/public/houses/${house._id}`}
                          variant="contained"
                          size="small"
                          fullWidth
                          sx={{ bgcolor: '#06b6d4', borderRadius: 2 }}
                        >
                          View Listing
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              </Box>
            )}
          </Box>
        )}
      </Box>

      {/* Lease Agreement & Receipt Modal */}
      {selectedLease && (
        <LeaseAgreementModal
          open={Boolean(selectedLease)}
          onClose={() => setSelectedLease(null)}
          lease={selectedLease}
          isTenant={true}
          onSuccess={fetchDashboardData}
        />
      )}

      {/* New Maintenance Ticket Modal */}
      <Dialog open={maintenanceModalOpen} onClose={() => setMaintenanceModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Submit Maintenance Repair Ticket</DialogTitle>
        <form onSubmit={handleCreateMaintenance}>
          <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControl fullWidth required>
              <InputLabel>Repair Category</InputLabel>
              <Select
                value={newTicket.category}
                label="Repair Category"
                onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value })}
              >
                <MenuItem value="PLUMBING">Plumbing (Leaks, Pipes, Taps)</MenuItem>
                <MenuItem value="ELECTRICAL">Electrical & Lighting</MenuItem>
                <MenuItem value="HVAC_HEATING">Water Heater & HVAC</MenuItem>
                <MenuItem value="APPLIANCE">Kitchen Appliances</MenuItem>
                <MenuItem value="SECURITY_LOCKS">Doors, Windows & Key Locks</MenuItem>
                <MenuItem value="OTHER">Other Maintenance</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth required>
              <InputLabel>Urgency Priority</InputLabel>
              <Select
                value={newTicket.priority}
                label="Urgency Priority"
                onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value as any })}
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
            />

            <TextField
              label="Detailed Description"
              multiline
              rows={4}
              required
              fullWidth
              placeholder="Describe what happened, where the issue is located, and best times for a technician to visit..."
              value={newTicket.description}
              onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
            />
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setMaintenanceModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={ticketLoading} sx={{ bgcolor: '#06b6d4' }}>
              {ticketLoading ? <CircularProgress size={24} color="inherit" /> : 'Submit Repair Ticket'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
