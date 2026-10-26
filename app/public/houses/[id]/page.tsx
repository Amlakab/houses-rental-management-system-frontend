'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Box, Typography, Card, CardContent, Chip, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Divider, CircularProgress, useMediaQuery, Snackbar, Alert,
  Tooltip, TextField, Stack, Avatar, Paper, Rating, LinearProgress
} from '@mui/material';
import {
  Home, LocationOn, Bed, Bathtub, SquareFoot, ArrowBack,
  CheckCircle, Apartment, Villa, Landscape, Pool, FitnessCenter,
  Security, LocalParking, Wifi, ThreeDRotation, CalendarToday,
  LocalOffer, Description, PhotoCamera, Share, Favorite,
  FavoriteBorder, Email, Phone, Close, ArrowForwardIos,
  ArrowBackIos, Verified, Flag, Straighten, Videocam, Explore,
  DirectionsWalk, School, LocalHospital, ShoppingCart, RateReview,
  Whatshot, Receipt, Visibility, Gavel, AccountBalance,
  Payments, EventAvailable, Public, Map as MapIcon, Inventory2,
  WorkspacePremium, Star, TrendingUp
} from '@mui/icons-material';
import api from '@/app/utils/api';
import { House, Review } from '@/types/houses';
import MessageModal from '@/components/MessageModal';
import ThreeViewer from '@/components/ThreeViewer';
import PanoramaViewer from '@/components/PanoramaViewer';
import FloorPlanViewer from '@/components/FloorPlanViewer';
import AppointmentModal from '@/components/AppointmentModal';
import PurchaseOfferModal from '@/components/PurchaseOfferModal';
import ReportListingModal from '@/components/ReportListingModal';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import { useTheme } from '@/lib/theme-context';
import { useLanguage } from '@/lib/language-context';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const MapView = dynamic(() => import('@/components/MapView'), {
  ssr: false,
  loading: () => (
    <Box sx={{ height: 450, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#0f172a' }}>
      <CircularProgress sx={{ color: '#00ffff' }} />
    </Box>
  ),
});

/* ── helpers ─────────────────────────────────────────────────────── */
const fmt = (n?: number | null) => (n == null ? '—' : Number(n).toLocaleString());
const label = (s?: string) => (s ? s.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : '—');

const toEmbedUrl = (url?: string) => {
  if (!url) return '';
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/);
  return m ? `https://www.youtube.com/embed/${m[1]}` : url;
};

/* ── small reusable "Section" card ──────────────────────────────── */
function Section({ title, icon, children, action }: { title: string; icon?: React.ReactNode; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <Paper elevation={0} sx={{ p: { xs: 2, sm: 2.5, md: 3 }, borderRadius: 3, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mb: 2, flexWrap: 'wrap' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
          {icon}
          <Typography variant="h6" sx={{ fontWeight: 700, fontSize: { xs: '1rem', sm: '1.15rem' }, wordBreak: 'break-word' }}>{title}</Typography>
        </Box>
        {action}
      </Box>
      {children}
    </Paper>
  );
}

/* ── key/value row ──────────────────────────────────────────────── */
function KV({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <Box sx={{ p: 1.5, bgcolor: 'action.hover', borderRadius: 2, minWidth: 0 }}>
      <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'capitalize', display: 'block', mb: 0.3, fontSize: 11.5 }}>
        {k}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 700, fontSize: { xs: 13, sm: 14 }, wordBreak: 'break-word' }}>{v}</Typography>
    </Box>
  );
}

export default function PublicHouseDetailPage() {
  const { theme } = useTheme();
  const { isAmharic } = useLanguage();
  const params = useParams();
  const router = useRouter();
  const houseId = params.id as string;

  const [house, setHouse] = useState<House | null>(null);
  const [similarHouses, setSimilarHouses] = useState<House[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewStats, setReviewStats] = useState<any>({ avgRating: 0, totalReviews: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const [activeMediaTab, setActiveMediaTab] = useState<'images' | 'video' | '360' | '3d' | 'floorplan' | 'map'>('images');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);

  const [appointmentModalOpen, setAppointmentModalOpen] = useState(false);
  const [offerModalOpen, setOfferModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [messageModalOpen, setMessageModalOpen] = useState(false);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [rentalApplicationOpen, setRentalApplicationOpen] = useState(false);

  const [newRating, setNewRating] = useState<number | null>(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  const [applicationForm, setApplicationForm] = useState({
    fullName: '', email: '', phone: '', occupation: '',
    monthlyIncome: '', numberOfOccupants: 1, preferredMoveInDate: '', message: ''
  });
  const [applicationLoading, setApplicationLoading] = useState(false);

  /* ── fetch ───────────────────────────────────────────────────── */
  const fetchHouse = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/public/houses/${houseId}`);
      if (res.data?.success) {
        const data = res.data.data;
        setHouse(data);
        setLikesCount(data.likesCount || 0);
        const primaryIdx = (data.images || []).findIndex((i: any) => i.isPrimary);
        setSelectedImageIndex(primaryIdx >= 0 ? primaryIdx : 0);
        if (!data.videoUrl) setActiveMediaTab('images');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load property details');
    } finally { setLoading(false); }
  };

  const fetchReviews = async () => {
    try {
      const res = await api.get(`/reviews/house/${houseId}`);
      if (res.data?.success) {
        setReviews(res.data.data.reviews || []);
        setReviewStats(res.data.data.stats || { avgRating: 0, totalReviews: 0 });
      }
    } catch { /* ignore */ }
  };

  const fetchSimilar = async () => {
    try {
      const res = await api.get(`/properties/${houseId}/similar`);
      if (res.data?.success) setSimilarHouses(res.data.data || []);
    } catch { /* ignore */ }
  };

  useEffect(() => { if (houseId) { fetchHouse(); fetchReviews(); fetchSimilar(); } }, [houseId]);

  /* ── actions ─────────────────────────────────────────────────── */
  const handleLikeToggle = async () => {
    try {
      const res = await api.post(`/properties/${houseId}/like`, {});
      if (res.data?.success) {
        setIsLiked(res.data.data.liked);
        setLikesCount(res.data.data.likesCount);
        setSnackbarMessage(res.data.data.liked ? 'Added to favorites' : 'Removed from favorites');
      }
    } catch { setSnackbarMessage('Please log in to like properties'); }
  };

  const handleShare = async () => {
    const shareData = { title: house?.title || 'Property', text: `Check out: ${house?.title}`, url: window.location.href };
    if (navigator.share) { try { await navigator.share(shareData); } catch { /* cancelled */ } }
    else { await navigator.clipboard.writeText(window.location.href); setSnackbarMessage('Link copied!'); }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRating || !reviewComment.trim()) return;
    try {
      setReviewSubmitting(true);
      await api.post('/reviews/house', { houseId, rating: newRating, title: reviewTitle, comment: reviewComment });
      setSnackbarMessage('Review submitted!'); setReviewDialogOpen(false);
      setReviewComment(''); setReviewTitle(''); fetchReviews();
    } catch (err: any) { setSnackbarMessage(err.response?.data?.message || 'Failed to submit review.'); }
    finally { setReviewSubmitting(false); }
  };

  const handleRentalApplicationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setApplicationLoading(true);
      await api.post('/houses/apply', { houseId, ...applicationForm, monthlyIncome: Number(applicationForm.monthlyIncome) });
      setSnackbarMessage('Rental application submitted!'); setRentalApplicationOpen(false);
    } catch (err: any) { setSnackbarMessage(err.response?.data?.message || 'Failed to submit application.'); }
    finally { setApplicationLoading(false); }
  };

  /* ── derived ─────────────────────────────────────────────────── */
  const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3001/api';
  const primaryImageUrl = house ? `${serverUrl}/public/houses/${house._id}/image?index=${selectedImageIndex}` : '';
  const isForSale = house?.transactionType === 'BUY';
  const isShortStay = house?.transactionType === 'SHORT_STAY';
  const isRent = !isForSale && !isShortStay;

  const default3D = useMemo(() => {
    if (!house?.threeDModels?.length) return null;
    return house.threeDModels.find((m: any) => m.isDefault) || house.threeDModels[0];
  }, [house]);

  if (loading) return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default' }}>
      <CircularProgress sx={{ color: '#06b6d4' }} />
    </Box>
  );

  if (error || !house) return (
    <Box sx={{ minHeight: '100vh', pt: 12, textAlign: 'center', bgcolor: 'background.default', px: 2 }}>
      <Navbar />
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>{error || 'Property Not Found'}</Typography>
      <Button component={Link} href="/public/houses" variant="contained" sx={{ bgcolor: '#06b6d4' }}>Back to Properties</Button>
      <Footer />
    </Box>
  );

  const h = house as any; // tolerate loose typing

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', pt: { xs: '64px', sm: '80px' }, pb: 10 }}>
      <Navbar />

      <Box sx={{ maxWidth: 1320, mx: 'auto', px: { xs: 1.5, sm: 2.5, md: 3 } }}>
        {/* ── Breadcrumb + actions ─────────────────────────────── */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mb: 2, flexWrap: 'wrap' }}>
          <Button component={Link} href="/public/houses" startIcon={<ArrowBack />}
            sx={{ textTransform: 'none', color: 'text.secondary', fontWeight: 600, minWidth: 0 }}>
            {isAmharic ? 'ወደ ፍለጋ ተመለስ' : 'Back to Search'}
          </Button>
          <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
            <Tooltip title="Share"><IconButton onClick={handleShare} sx={{ border: '1px solid', borderColor: 'divider' }}><Share fontSize="small" /></IconButton></Tooltip>
            <Tooltip title={isLiked ? 'Unfavorite' : 'Favorite'}>
              <IconButton onClick={handleLikeToggle}
                sx={{ border: '1px solid', borderColor: isLiked ? '#f43f5e' : 'divider', color: isLiked ? '#f43f5e' : 'inherit' }}>
                {isLiked ? <Favorite fontSize="small" /> : <FavoriteBorder fontSize="small" />}
              </IconButton>
            </Tooltip>
            <Tooltip title="Report"><IconButton onClick={() => setReportModalOpen(true)} sx={{ border: '1px solid', borderColor: 'divider' }}><Flag fontSize="small" /></IconButton></Tooltip>
          </Box>
        </Box>

        {/* ── Title / badges / price ───────────────────────────── */}
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', gap: 2, mb: 3 }}>
          <Box sx={{ flex: 1, minWidth: 0, width: '100%' }}>
            <Box sx={{ display: 'flex', gap: 0.8, mb: 1, flexWrap: 'wrap' }}>
              <Chip size="small" label={isForSale ? 'For Sale' : isShortStay ? 'Short Stay' : 'For Rent'}
                sx={{ bgcolor: isForSale ? '#10b981' : '#06b6d4', color: 'white', fontWeight: 700 }} />
              <Chip size="small" label={label(house.propertyType)} sx={{ bgcolor: 'action.hover', fontWeight: 600 }} />
              <Chip size="small" label={label(house.status)} sx={{ fontWeight: 600 }} />
              <Chip size="small" label={label(house.intendedPurpose)} variant="outlined" sx={{ fontWeight: 600 }} />
              {house.isVerified && <Chip size="small" icon={<Verified sx={{ fontSize: '15px !important', color: 'white' }} />}
                label="Verified" sx={{ bgcolor: '#0284c7', color: 'white', fontWeight: 700 }} />}
              {h.featured && <Chip size="small" icon={<Star sx={{ fontSize: '15px !important' }} />} label="Featured" color="warning" sx={{ fontWeight: 700 }} />}
              {h.trendingScore > 0 && <Chip size="small" icon={<TrendingUp sx={{ fontSize: '15px !important' }} />} label={`Trending ${h.trendingScore}`} color="error" sx={{ fontWeight: 700 }} />}
              {house.details?.furnishingStatus && <Chip size="small" label={label(house.details.furnishingStatus)} sx={{ textTransform: 'capitalize' }} />}
            </Box>

            <Typography variant="h4" sx={{
              fontWeight: 800, color: 'text.primary', mb: 0.8, lineHeight: 1.25,
              fontSize: { xs: '1.25rem', sm: '1.7rem', md: '2.1rem' }, wordBreak: 'break-word'
            }}>{house.title}</Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, color: 'text.secondary', flexWrap: 'wrap' }}>
              <LocationOn sx={{ fontSize: 18, color: '#06b6d4', flexShrink: 0 }} />
              <Typography variant="body2" sx={{ fontSize: { xs: '0.82rem', sm: '0.92rem' }, wordBreak: 'break-word' }}>
                {[house.location?.address, house.location?.city, house.location?.state, house.location?.country, house.location?.zipCode].filter(Boolean).join(', ')}
              </Typography>
            </Box>
          </Box>

          <Box sx={{
            textAlign: { xs: 'left', md: 'right' }, width: { xs: '100%', md: 'auto' },
            p: { xs: 1.5, md: 0 }, bgcolor: { xs: 'action.hover', md: 'transparent' },
            borderRadius: { xs: 2.5, md: 0 }, flexShrink: 0
          }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, display: 'block' }}>
              {isForSale ? 'Asking Price' : 'Monthly Rent'}
            </Typography>
            <Typography variant="h3" sx={{
              fontWeight: 900, color: '#06b6d4', lineHeight: 1.1,
              fontSize: { xs: '1.6rem', sm: '2.1rem', md: '2.4rem' }, wordBreak: 'break-word'
            }}>ETB {fmt(house.pricing?.price)}</Typography>
            {!isForSale && house.pricing?.securityDeposit > 0 && (
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
                Deposit: ETB {fmt(house.pricing.securityDeposit)}
              </Typography>
            )}
            {isForSale && h.saleTerms?.isNegotiable && (
              <Chip size="small" label="Negotiable" color="success" sx={{ mt: 0.8, fontWeight: 700 }} />
            )}
          </Box>
        </Box>

        {/* ── tags ─────────────────────────────────────────────── */}
        {(house.tags?.length ?? 0) > 0 && (
          <Box sx={{ display: 'flex', gap: 0.8, flexWrap: 'wrap', mb: 2.5 }}>
            {(house.tags ?? []).map((tag, i) => (
              <Chip key={i} component={Link} href={`/public/houses?tags=${encodeURIComponent(tag)}`} label={`#${tag}`} clickable
                size="small" sx={{ bgcolor: 'action.hover', color: 'text.secondary', fontWeight: 600, fontSize: 12,
                  '&:hover': { bgcolor: 'rgba(6,182,212,.1)', color: '#06b6d4' } }} />
            ))}
          </Box>
        )}

        {/* ── STATS BAR (views / inquiries / reviews / listed) ── */}
        <Paper elevation={0} sx={{
          p: { xs: 1.2, sm: 1.5 }, borderRadius: 2.5, border: '1px solid', borderColor: 'divider',
          bgcolor: 'background.paper', mb: 3,
          display: 'grid', gridTemplateColumns: { xs: 'repeat(2,1fr)', sm: 'repeat(4,1fr)' }, gap: 1.2
        }}>
          {[
            { icon: <Visibility fontSize="small" sx={{ color: '#06b6d4' }} />, k: 'Views', v: fmt(h.views) },
            { icon: <Email fontSize="small" sx={{ color: '#10b981' }} />, k: 'Inquiries', v: fmt(h.inquiries) },
            { icon: <Star fontSize="small" sx={{ color: '#f59e0b' }} />, k: 'Rating', v: `${h.rating || 0} (${fmt(h.numReviews)})` },
            { icon: <CalendarToday fontSize="small" sx={{ color: '#a855f7' }} />, k: 'Listed', v: h.created_at ? new Date(h.created_at).toLocaleDateString() : '—' },
          ].map((s, i) => (
            <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1, bgcolor: 'action.hover', borderRadius: 2, minWidth: 0 }}>
              {s.icon}
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontSize: 10.5 }}>{s.k}</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, fontSize: { xs: 12.5, sm: 13.5 }, whiteSpace: 'nowrap' }}>{s.v}</Typography>
              </Box>
            </Box>
          ))}
        </Paper>

        {/* ── RICH MEDIA ───────────────────────────────────────── */}
        <Paper elevation={0} sx={{ borderRadius: 4, overflow: 'hidden', border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', mb: 4 }}>
          <Box sx={{
            display: 'flex', gap: 1, p: 1.2, borderBottom: '1px solid', borderColor: 'divider',
            overflowX: 'auto', bgcolor: 'action.hover', WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' }
          }}>
            <Button onClick={() => setActiveMediaTab('images')} variant={activeMediaTab === 'images' ? 'contained' : 'text'}
              startIcon={<PhotoCamera />} size="small"
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0,
                fontSize: { xs: 11.5, sm: 13 }, px: { xs: 1.2, sm: 2 },
                bgcolor: activeMediaTab === 'images' ? '#06b6d4' : 'transparent',
                color: activeMediaTab === 'images' ? 'white' : 'text.primary' }}>
              Photos ({house.images?.length || 0})
            </Button>
            <Button onClick={() => setActiveMediaTab('map')} variant={activeMediaTab === 'map' ? 'contained' : 'text'}
              startIcon={<MapIcon />} size="small"
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0,
                fontSize: { xs: 11.5, sm: 13 }, px: { xs: 1.2, sm: 2 },
                bgcolor: activeMediaTab === 'map' ? '#3b82f6' : 'transparent',
                color: activeMediaTab === 'map' ? 'white' : 'text.primary' }}>Map</Button>
            {house.panoramic360?.enabled && (
              <Button onClick={() => setActiveMediaTab('360')} variant={activeMediaTab === '360' ? 'contained' : 'text'}
                startIcon={<ThreeDRotation />} size="small"
                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0,
                  fontSize: { xs: 11.5, sm: 13 }, px: { xs: 1.2, sm: 2 },
                  bgcolor: activeMediaTab === '360' ? '#a855f7' : 'transparent',
                  color: activeMediaTab === '360' ? 'white' : 'text.primary' }}>360°</Button>
            )}
            {default3D && (
              <Button onClick={() => setActiveMediaTab('3d')} variant={activeMediaTab === '3d' ? 'contained' : 'text'}
                startIcon={<Explore />} size="small"
                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0,
                  fontSize: { xs: 11.5, sm: 13 }, px: { xs: 1.2, sm: 2 },
                  bgcolor: activeMediaTab === '3d' ? '#0284c7' : 'transparent',
                  color: activeMediaTab === '3d' ? 'white' : 'text.primary' }}>3D</Button>
            )}
            <Button onClick={() => setActiveMediaTab('floorplan')} variant={activeMediaTab === 'floorplan' ? 'contained' : 'text'}
              startIcon={<Straighten />} size="small"
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0,
                fontSize: { xs: 11.5, sm: 13 }, px: { xs: 1.2, sm: 2 },
                bgcolor: activeMediaTab === 'floorplan' ? '#10b981' : 'transparent',
                color: activeMediaTab === 'floorplan' ? 'white' : 'text.primary' }}>Floor Plan</Button>
            {house.videoUrl && (
              <Button onClick={() => setActiveMediaTab('video')} variant={activeMediaTab === 'video' ? 'contained' : 'text'}
                startIcon={<Videocam />} size="small"
                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0,
                  fontSize: { xs: 11.5, sm: 13 }, px: { xs: 1.2, sm: 2 },
                  bgcolor: activeMediaTab === 'video' ? '#f43f5e' : 'transparent',
                  color: activeMediaTab === 'video' ? 'white' : 'text.primary' }}>Video</Button>
            )}
          </Box>

          <Box sx={{ p: { xs: 1, md: 2 }, bgcolor: '#0f172a' }}>
            {/* IMAGES */}
            {activeMediaTab === 'images' && (
              <Box>
                <Box sx={{ position: 'relative', height: { xs: 260, sm: 420, md: 540 }, width: '100%', borderRadius: 2, overflow: 'hidden' }}>
                  <Box component="img" src={primaryImageUrl} alt={house.title}
                    onError={(e: any) => { e.target.src = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80'; }}
                    sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  {house.images?.[selectedImageIndex] && (
                    <Box sx={{ position: 'absolute', bottom: 12, left: 12, right: 12, bgcolor: 'rgba(15,23,42,.78)', backdropFilter: 'blur(8px)',
                      color: 'white', px: 1.5, py: 1, borderRadius: 2, maxWidth: 'min(90%, 420px)' }}>
                      <Typography sx={{ fontWeight: 700, fontSize: 13 }}>{(house.images[selectedImageIndex] as any).roomLabel || 'Main View'}</Typography>
                      {(house.images[selectedImageIndex] as any).caption && (
                        <Typography sx={{ fontSize: 11.5, color: '#94a3b8' }}>{(house.images[selectedImageIndex] as any).caption}</Typography>
                      )}
                    </Box>
                  )}
                  {house.images?.length > 1 && (
                    <>
                      <IconButton onClick={() => setSelectedImageIndex(p => (p > 0 ? p - 1 : house.images!.length - 1))}
                        sx={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', bgcolor: 'rgba(0,0,0,.55)', color: 'white', '&:hover': { bgcolor: 'rgba(0,0,0,.8)' } }}>
                        <ArrowBackIos fontSize="small" />
                      </IconButton>
                      <IconButton onClick={() => setSelectedImageIndex(p => (p < house.images!.length - 1 ? p + 1 : 0))}
                        sx={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', bgcolor: 'rgba(0,0,0,.55)', color: 'white', '&:hover': { bgcolor: 'rgba(0,0,0,.8)' } }}>
                        <ArrowForwardIos fontSize="small" />
                      </IconButton>
                      <Box sx={{ position: 'absolute', top: 10, right: 10, bgcolor: 'rgba(0,0,0,.6)', color: 'white', px: 1, py: 0.3, borderRadius: 1, fontSize: 11, fontWeight: 700 }}>
                        {selectedImageIndex + 1} / {house.images.length}
                      </Box>
                    </>
                  )}
                </Box>
                {house.images?.length > 1 && (
                  <Box sx={{ display: 'flex', gap: 1, mt: 1.5, overflowX: 'auto', pb: 1 }}>
                    {house.images.map((img: any, idx: number) => (
                      <Box key={img._id || idx} onClick={() => setSelectedImageIndex(idx)}
                        sx={{
                          width: { xs: 64, sm: 80 }, height: { xs: 48, sm: 60 }, flexShrink: 0, borderRadius: 1.5,
                          overflow: 'hidden', cursor: 'pointer', border: '2px solid',
                          borderColor: selectedImageIndex === idx ? '#06b6d4' : 'transparent',
                          opacity: selectedImageIndex === idx ? 1 : 0.6, transition: 'all .2s',
                          '&:hover': { opacity: 1 }
                        }}>
                        <Box component="img" src={`${serverUrl}/public/houses/${house._id}/image?index=${idx}`}
                          sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </Box>
                    ))}
                  </Box>
                )}
              </Box>
            )}

            {activeMediaTab === '360' && (
              <PanoramaViewer imageUrl={house.panoramic360?.imageUrl || ''} height={520} />
            )}

            {activeMediaTab === '3d' && default3D && (
              <ThreeViewer modelUrl={`${serverUrl}/public/houses/${house._id}/3d`} height={520} />
            )}

            {activeMediaTab === 'floorplan' && (
              <Box sx={{ bgcolor: 'background.paper', p: { xs: 1.5, sm: 3 }, borderRadius: 2 }}>
                <FloorPlanViewer floorPlanUrl={house.floorPlan?.url} rooms={house.floorPlan?.rooms} totalArea={house.details?.area} />
              </Box>
            )}

            {activeMediaTab === 'video' && (
              <Box sx={{ height: { xs: 220, sm: 380, md: 500 }, width: '100%', borderRadius: 2, overflow: 'hidden' }}>
                <iframe width="100%" height="100%" src={toEmbedUrl(house.videoUrl)} title="Property Walkthrough"
                  style={{ border: 0 }} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
              </Box>
            )}

            {activeMediaTab === 'map' && (
              <Box sx={{ position: 'relative', height: { xs: 340, sm: 460, md: 540 }, width: '100%', borderRadius: 2, overflow: 'hidden' }}>
                <MapView houses={[house, ...similarHouses]} selectedHouse={house}
                  center={[house.location?.coordinates?.lat || 9.03, house.location?.coordinates?.lng || 38.74]}
                  zoom={15}
                  onSelectHouse={(x: any) => { if (x._id !== house._id) router.push(`/public/houses/${x._id}`); }}
                  formatPrice={(p: number) => `ETB ${Number(p).toLocaleString()}`}
                  theme={theme === 'dark' ? 'dark' : 'light'} />
                <Box sx={{
                  position: 'absolute', bottom: 10, left: 10, right: 10, display: 'flex', alignItems: 'center',
                  justifyContent: 'space-between', gap: 1, flexWrap: 'wrap',
                  bgcolor: 'rgba(15,23,42,.88)', backdropFilter: 'blur(8px)', color: 'white',
                  px: 1.5, py: 0.8, borderRadius: 2, zIndex: 900
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0, flex: 1 }}>
                    <LocationOn sx={{ color: '#00ffff', fontSize: 18, flexShrink: 0 }} />
                    <Typography variant="body2" sx={{ fontWeight: 600, fontSize: { xs: 11, sm: 13 }, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {house.location?.address}, {house.location?.city}
                    </Typography>
                  </Box>
                  <Button variant="contained" size="small" color="primary"
                    onClick={() => {
                      const lat = house.location?.coordinates?.lat || 9.03;
                      const lng = house.location?.coordinates?.lng || 38.74;
                      window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`, '_blank');
                    }}
                    sx={{ borderRadius: 1.5, textTransform: 'none', fontWeight: 700, fontSize: { xs: 10.5, sm: 12 }, px: 1.2, flexShrink: 0 }}>
                    Google Maps
                  </Button>
                </Box>
              </Box>
            )}
          </Box>
        </Paper>

        {/* ── TWO-COLUMN GRID ─────────────────────────────────── */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'minmax(0,2fr) minmax(0,1fr)' }, gap: { xs: 2, md: 3 } }}>
          {/* LEFT */}
          <Box sx={{ minWidth: 0 }}>
            {/* Quick specs */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2,1fr)', sm: 'repeat(4,1fr)' }, gap: 1.2, mb: 3 }}>
              {[
                { icon: <Bed fontSize="small" sx={{ color: '#06b6d4' }} />, label: 'Bedrooms', val: house.details?.bedrooms ?? '—' },
                { icon: <Bathtub fontSize="small" sx={{ color: '#06b6d4' }} />, label: 'Bathrooms', val: house.details?.bathrooms ?? '—' },
                { icon: <SquareFoot fontSize="small" sx={{ color: '#06b6d4' }} />, label: 'Area', val: `${house.details?.area ?? '—'} m²` },
                { icon: <LocalParking fontSize="small" sx={{ color: '#06b6d4' }} />, label: 'Parking', val: `${house.details?.parkingSpaces ?? 0}` },
              ].map((s, i) => (
                <Paper key={i} elevation={0} sx={{ p: { xs: 1.3, sm: 1.8 }, borderRadius: 2.5, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, color: 'text.secondary', mb: 0.4 }}>
                    {s.icon}
                    <Typography variant="caption" sx={{ fontWeight: 600, fontSize: { xs: 10.5, sm: 12 } }}>{s.label}</Typography>
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 800, fontSize: { xs: 15, sm: 19 }, wordBreak: 'break-word' }}>{s.val}</Typography>
                </Paper>
              ))}
            </Box>

            {/* Description */}
            <Section title="About this Property">
              <Typography variant="body1" sx={{ color: 'text.secondary', lineHeight: 1.75, whiteSpace: 'pre-line', fontSize: { xs: '0.88rem', sm: '0.98rem' } }}>
                {house.description || '—'}
              </Typography>
            </Section>

            {/* Property Specifications — every field */}
            <Section title="Property Specifications">
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2,1fr)', sm: 'repeat(3,1fr)' }, gap: 1.2 }}>
                <KV k="Property Type" v={label(house.propertyType)} />
                <KV k="Transaction" v={label(house.transactionType)} />
                <KV k="Intended Purpose" v={label(house.intendedPurpose)} />
                <KV k="Status" v={label(house.status)} />
                <KV k="Approval" v={label(house.approvalStatus)} />
                <KV k="Verification" v={label(house.verificationStatus)} />
                <KV k="Year Built" v={house.details?.yearBuilt ?? '—'} />
                <KV k="Floors" v={house.details?.floors ?? '—'} />
                <KV k="Lot Size" v={house.details?.lotSize ? `${house.details.lotSize} m²` : '—'} />
                <KV k="Furnished" v={house.details?.furnished ? 'Yes' : 'No'} />
                <KV k="Furnishing" v={label(house.details?.furnishingStatus)} />
                <KV k="Price / sqft" v={house.pricing?.pricePerSqft ? `ETB ${fmt(house.pricing.pricePerSqft)}` : '—'} />
              </Box>
            </Section>

            {/* Pricing breakdown */}
            <Section title="Pricing Breakdown" icon={<Payments sx={{ color: '#06b6d4' }} />}>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2,1fr)', sm: 'repeat(3,1fr)' }, gap: 1.2 }}>
                <KV k="Main Price" v={`ETB ${fmt(house.pricing?.price)}`} />
                <KV k="Maintenance Fee" v={`ETB ${fmt(house.pricing?.maintenanceFee)}`} />
                <KV k="Tax Amount" v={`ETB ${fmt(house.pricing?.taxAmount)}`} />
                <KV k="Security Deposit" v={`ETB ${fmt(house.pricing?.securityDeposit)}`} />
                <KV k="Quantity" v={fmt(house.pricing?.quantity)} />
                <KV k="Price / sqft" v={house.pricing?.pricePerSqft ? `ETB ${fmt(house.pricing.pricePerSqft)}` : '—'} />
              </Box>
            </Section>

            {/* Sale Terms (BUY) */}
            {isForSale && h.saleTerms && (
              <Section title="Sale Terms" icon={<Gavel sx={{ color: '#10b981' }} />}>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2,1fr)', sm: 'repeat(3,1fr)' }, gap: 1.2 }}>
                  <KV k="Asking Price" v={`ETB ${fmt(h.saleTerms.askingPrice)}`} />
                  <KV k="Ownership Doc" v={h.saleTerms.ownershipDocType || '—'} />
                  <KV k="Negotiable" v={h.saleTerms.isNegotiable ? 'Yes' : 'No'} />
                  <KV k="Escrow Supported" v={h.saleTerms.escrowSupported ? 'Yes' : 'No'} />
                  <KV k="Min Down Payment" v={h.saleTerms.downPaymentMin != null ? `${h.saleTerms.downPaymentMin}%` : '—'} />
                </Box>
              </Section>
            )}

            {/* Rental Pricing (RENT / SHORT_STAY) */}
            {!isForSale && h.rentalPricing && (
              <Section title="Rental Terms" icon={<Receipt sx={{ color: '#f59e0b' }} />}>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2,1fr)', sm: 'repeat(3,1fr)' }, gap: 1.2 }}>
                  <KV k="Frequency" v={label(h.rentalPricing.frequency)} />
                  <KV k="Security Deposit" v={`ETB ${fmt(h.rentalPricing.securityDeposit)}`} />
                  <KV k="Advance Payments" v={fmt(h.rentalPricing.advancePayments)} />
                  <KV k="Min Lease Duration" v={`${h.rentalPricing.minLeaseDuration ?? '—'} month(s)`} />
                </Box>
              </Section>
            )}

            {/* Category attributes (if any) */}
            {house.categoryAttributes && Object.keys(house.categoryAttributes).length > 0 && (
              <Section title={`Category Specifications (${label(house.propertyType)})`}>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.2 }}>
                  {Object.entries(house.categoryAttributes).map(([k, v]) => (
                    <KV key={k} k={label(k)} v={typeof v === 'boolean' ? (v ? 'Yes' : 'No') : String(v)} />
                  ))}
                </Box>
              </Section>
            )}

            {/* Amenities */}
            {house.details?.amenities?.length > 0 && (
              <Section title="Amenities & Facilities">
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2,1fr)', sm: 'repeat(3,1fr)' }, gap: 1 }}>
                  {house.details.amenities.map((a: string, i: number) => (
                    <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 0.8, minWidth: 0 }}>
                      <CheckCircle sx={{ color: '#10b981', fontSize: 17, flexShrink: 0 }} />
                      <Typography variant="body2" sx={{ fontWeight: 500, fontSize: { xs: 12, sm: 13.5 }, wordBreak: 'break-word', textTransform: 'capitalize' }}>{a}</Typography>
                    </Box>
                  ))}
                </Box>
              </Section>
            )}

            {/* Features */}
            {house.details?.features?.length > 0 && (
              <Section title="Interior Features">
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2,1fr)', sm: 'repeat(3,1fr)' }, gap: 1 }}>
                  {house.details.features.map((f: string, i: number) => (
                    <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 0.8, minWidth: 0 }}>
                      <WorkspacePremium sx={{ color: '#a855f7', fontSize: 17, flexShrink: 0 }} />
                      <Typography variant="body2" sx={{ fontWeight: 500, fontSize: { xs: 12, sm: 13.5 }, wordBreak: 'break-word' }}>{f}</Typography>
                    </Box>
                  ))}
                </Box>
              </Section>
            )}

            {/* Nearby amenities — real only */}
            {h.nearbyAmenities?.length > 0 && (
              <Section title="Neighborhood Landmarks" icon={<DirectionsWalk sx={{ color: '#06b6d4' }} />}>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.2 }}>
                  {h.nearbyAmenities.map((a: any, i: number) => (
                    <Box key={i} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, p: 1.4, bgcolor: 'action.hover', borderRadius: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                        {a.type === 'school' && <School sx={{ color: '#3b82f6', fontSize: 19 }} />}
                        {a.type === 'hospital' && <LocalHospital sx={{ color: '#ef4444', fontSize: 19 }} />}
                        {a.type === 'transit' && <DirectionsWalk sx={{ color: '#10b981', fontSize: 19 }} />}
                        {a.type === 'shopping' && <ShoppingCart sx={{ color: '#f59e0b', fontSize: 19 }} />}
                        {!['school','hospital','transit','shopping'].includes(a.type) && <LocationOn sx={{ color: '#a855f7', fontSize: 19 }} />}
                        <Typography variant="body2" sx={{ fontWeight: 600, fontSize: { xs: 12, sm: 13.5 }, wordBreak: 'break-word' }}>{a.name}</Typography>
                      </Box>
                      <Chip size="small" label={`${a.distanceKm} km`} sx={{ fontWeight: 700, fontSize: 11, flexShrink: 0 }} />
                    </Box>
                  ))}
                </Box>
              </Section>
            )}

            {/* Floor plan rooms summary */}
            {(house.floorPlan?.rooms?.length ?? 0) > 0 && (
              <Section title="Room Dimensions" icon={<Straighten sx={{ color: '#10b981' }} />}>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.2 }}>
                  {(house.floorPlan?.rooms ?? []).map((r: any, i: number) => (
                    <Box key={r._id || i} sx={{ p: 1.4, bgcolor: 'action.hover', borderRadius: 2 }}>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>{r.name}</Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {r.dimensions} • {r.areaSqM} m²
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Section>
            )}

            {/* Reviews */}
            <Section title="Customer Reviews & Ratings"
              action={
                <Button variant="outlined" size="small" startIcon={<RateReview />} onClick={() => setReviewDialogOpen(true)}
                  sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}>
                  Write Review
                </Button>
              }>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                <Rating value={reviewStats.avgRating || h.rating || 0} precision={0.1} readOnly size="small" />
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  {(reviewStats.avgRating || h.rating || 0).toFixed(1)} / 5
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  ({reviewStats.totalReviews ?? h.numReviews ?? 0} reviews)
                </Typography>
              </Box>
              {reviews.length === 0 ? (
                <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', py: 2 }}>
                  No reviews yet. Be the first to share your experience!
                </Typography>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {reviews.map((rev: any) => (
                    <Box key={rev._id} sx={{ p: 1.8, bgcolor: 'action.hover', borderRadius: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mb: 0.8, flexWrap: 'wrap' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                          <Avatar sx={{ width: 30, height: 30, bgcolor: '#06b6d4', fontSize: 13 }}>{rev.userName?.[0] || 'U'}</Avatar>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, wordBreak: 'break-word' }}>{rev.userName}</Typography>
                          {rev.isVerifiedResident && <Chip size="small" label="Verified" color="success" sx={{ height: 18, fontSize: 10 }} />}
                        </Box>
                        <Rating value={rev.rating} size="small" readOnly />
                      </Box>
                      {rev.title && <Typography variant="body2" sx={{ fontWeight: 700 }}>{rev.title}</Typography>}
                      <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.4, wordBreak: 'break-word' }}>{rev.comment}</Typography>
                    </Box>
                  ))}
                </Box>
              )}
            </Section>
          </Box>

          {/* RIGHT — sticky on desktop */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
            <Paper elevation={0} sx={{ p: { xs: 2, sm: 2.5 }, borderRadius: 3, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', position: { lg: 'sticky' }, top: { lg: 90 } }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, fontSize: { xs: '1rem', sm: '1.15rem' } }}>
                Interested in this Property?
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2 }}>
                <Button variant="contained" fullWidth size="large" startIcon={<CalendarToday />}
                  onClick={() => setAppointmentModalOpen(true)}
                  sx={{ borderRadius: 2.5, py: 1.3, fontWeight: 700, textTransform: 'none', fontSize: { xs: 13.5, sm: 15 } }}>
                  Schedule Viewing Tour
                </Button>
                {isForSale ? (
                  <Button variant="contained" fullWidth size="large" color="success" startIcon={<LocalOffer />}
                    onClick={() => setOfferModalOpen(true)}
                    sx={{ borderRadius: 2.5, py: 1.3, fontWeight: 700, textTransform: 'none', fontSize: { xs: 13.5, sm: 15 } }}>
                    Make a Purchase Offer
                  </Button>
                ) : (
                  <Button variant="contained" fullWidth size="large" color="success" startIcon={<Description />}
                    onClick={() => setRentalApplicationOpen(true)}
                    sx={{ borderRadius: 2.5, py: 1.3, fontWeight: 700, textTransform: 'none', fontSize: { xs: 13.5, sm: 15 } }}>
                    Apply for Rental Lease
                  </Button>
                )}
                <Button variant="outlined" fullWidth startIcon={<Email />}
                  onClick={() => setMessageModalOpen(true)}
                  sx={{ borderRadius: 2.5, py: 1.1, textTransform: 'none', fontWeight: 600, fontSize: { xs: 13, sm: 14 } }}>
                  Send Direct Inquiry
                </Button>
              </Box>
            </Paper>

            {/* Agent / Owner card — FIXED */}
            <Paper elevation={0} sx={{ p: { xs: 2, sm: 2.5 }, borderRadius: 3, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase', fontSize: 11 }}>
                Listing Representative
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, my: 1.5 }}>
                <Avatar sx={{ width: 46, height: 46, bgcolor: '#06b6d4', fontWeight: 700, flexShrink: 0 }}>
                  {(house.agentName || h.agentId?.[0] || 'A').toString()[0].toUpperCase()}
                </Avatar>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, wordBreak: 'break-word' }}>
                    {house.agentName || 'Real Estate Agent'}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: 12.5, wordBreak: 'break-word' }}>
                    {h.agentAgencyName || 'Authorized Real Estate Partner'}
                  </Typography>
                </Box>
              </Box>
              <Divider sx={{ my: 1.5 }} />
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                  <Phone sx={{ color: 'text.secondary', fontSize: 17, flexShrink: 0 }} />
                  <Typography variant="body2" sx={{ wordBreak: 'break-word', fontSize: 13 }}>
                    {h.agentPhone || '—'}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                  <Email sx={{ color: 'text.secondary', fontSize: 17, flexShrink: 0 }} />
                  <Typography variant="body2" sx={{ wordBreak: 'break-all', fontSize: 13 }}>
                    {h.agentEmail || (house.agentContact?.includes('@') ? house.agentContact : '—')}
                  </Typography>
                </Box>
              </Box>
            </Paper>

            {/* Verification / docs */}
            {h.verificationDocuments?.length > 0 && (
              <Paper elevation={0} sx={{ p: 2, borderRadius: 3, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase', fontSize: 11 }}>
                  Verification Documents
                </Typography>
                <Typography variant="body2" sx={{ mt: 1, fontWeight: 600 }}>{h.verificationDocuments.length} document(s)</Typography>
              </Paper>
            )}
          </Box>
        </Box>

        {/* ── SIMILAR ─────────────────────────────────────────── */}
        {similarHouses.length > 0 && (
          <Box sx={{ mt: 6 }}>
            <Typography variant="h5" sx={{ fontWeight: 800, mb: 2.5, fontSize: { xs: '1.15rem', sm: '1.4rem' } }}>Similar Properties</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2,1fr)', lg: 'repeat(3,1fr)' }, gap: 2.5 }}>
              {similarHouses.map((sim: any) => (
                <Card key={sim._id} component={Link} href={`/public/houses/${sim._id}`}
                  sx={{ textDecoration: 'none', borderRadius: 3, border: '1px solid', borderColor: 'divider',
                    overflow: 'hidden', transition: 'transform .25s, box-shadow .25s',
                    '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 10px 26px rgba(0,0,0,.1)' } }}>
                  <Box sx={{ height: { xs: 170, sm: 200 }, bgcolor: '#0f172a' }}>
                    <Box component="img" src={`${serverUrl}/public/houses/${sim._id}/image`} alt={sim.title}
                      onError={(e: any) => { e.target.src = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=400&q=80'; }}
                      sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </Box>
                  <CardContent sx={{ p: 2 }}>
                    <Typography sx={{ fontWeight: 700, fontSize: 14.5, color: 'text.primary', mb: 0.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sim.title}</Typography>
                    <Typography sx={{ fontWeight: 800, color: '#06b6d4', fontSize: 15 }}>ETB {fmt(sim.pricing?.price)}</Typography>
                  </CardContent>
                </Card>
              ))}
            </Box>
          </Box>
        )}
      </Box>

      {/* ── MODALS ─────────────────────────────────────────────── */}
      <AppointmentModal open={appointmentModalOpen} onClose={() => setAppointmentModalOpen(false)} house={house} />
      <PurchaseOfferModal open={offerModalOpen} onClose={() => setOfferModalOpen(false)} house={house} />
      <ReportListingModal open={reportModalOpen} onClose={() => setReportModalOpen(false)} house={house} />
      {messageModalOpen && (
        <MessageModal open={messageModalOpen} onClose={() => setMessageModalOpen(false)} houseId={house._id} houseTitle={house.title} />
      )}

      {/* Rental application */}
      <Dialog open={rentalApplicationOpen} onClose={() => setRentalApplicationOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Submit Rental Lease Application</DialogTitle>
        <form onSubmit={handleRentalApplicationSubmit}>
          <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField label="Full Legal Name" required fullWidth value={applicationForm.fullName}
              onChange={(e) => setApplicationForm({ ...applicationForm, fullName: e.target.value })} />
            <Box sx={{ display: 'flex', gap: 1.5, flexDirection: { xs: 'column', sm: 'row' } }}>
              <TextField label="Email" type="email" required fullWidth value={applicationForm.email}
                onChange={(e) => setApplicationForm({ ...applicationForm, email: e.target.value })} />
              <TextField label="Phone" required fullWidth value={applicationForm.phone}
                onChange={(e) => setApplicationForm({ ...applicationForm, phone: e.target.value })} />
            </Box>
            <Box sx={{ display: 'flex', gap: 1.5, flexDirection: { xs: 'column', sm: 'row' } }}>
              <TextField label="Occupation" required fullWidth value={applicationForm.occupation}
                onChange={(e) => setApplicationForm({ ...applicationForm, occupation: e.target.value })} />
              <TextField label="Monthly Income (ETB)" type="number" required fullWidth value={applicationForm.monthlyIncome}
                onChange={(e) => setApplicationForm({ ...applicationForm, monthlyIncome: e.target.value })} />
            </Box>
            <TextField label="Preferred Move-in Date" type="date" required fullWidth InputLabelProps={{ shrink: true }}
              value={applicationForm.preferredMoveInDate}
              onChange={(e) => setApplicationForm({ ...applicationForm, preferredMoveInDate: e.target.value })} />
            <TextField label="Cover Note" multiline rows={3} fullWidth value={applicationForm.message}
              onChange={(e) => setApplicationForm({ ...applicationForm, message: e.target.value })} />
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setRentalApplicationOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={applicationLoading} sx={{ bgcolor: '#10b981' }}>
              {applicationLoading ? <CircularProgress size={22} color="inherit" /> : 'Submit'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Review dialog */}
      <Dialog open={reviewDialogOpen} onClose={() => setReviewDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Rate & Review</DialogTitle>
        <form onSubmit={handleReviewSubmit}>
          <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }}>
            <Rating value={newRating} onChange={(_, v) => setNewRating(v)} size="large" />
            <TextField label="Headline" fullWidth value={reviewTitle}
              onChange={(e) => setReviewTitle(e.target.value)} />
            <TextField label="Your Review" multiline rows={4} required fullWidth value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)} />
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setReviewDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={reviewSubmitting} sx={{ bgcolor: '#06b6d4' }}>Submit</Button>
          </DialogActions>
        </form>
      </Dialog>

      <Snackbar open={Boolean(snackbarMessage)} autoHideDuration={3000} onClose={() => setSnackbarMessage('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity="info" onClose={() => setSnackbarMessage('')} sx={{ width: '100%' }}>{snackbarMessage}</Alert>
      </Snackbar>

      <Footer />
    </Box>
  );
}