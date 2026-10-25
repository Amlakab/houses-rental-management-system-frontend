'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Box, Typography, Card, CardContent, Chip, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Divider, CircularProgress, useMediaQuery, Snackbar, Alert,
  Tooltip, TextField, FormControl, InputLabel, Select, MenuItem,
  Stack, Avatar, Paper, Rating, LinearProgress
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/lib/theme-context';
import { useLanguage } from '@/lib/language-context';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import {
  Home, LocationOn, AttachMoney, Bed, Bathtub,
  SquareFoot, ArrowBack, Visibility,
  CheckCircle, Cancel, Apartment, Villa, Landscape,
  Pool, FitnessCenter, Security, LocalParking, Wifi,
  ThreeDRotation, CalendarToday, AccessTime, LocalOffer,
  Description, PhotoCamera, Share, Favorite, FavoriteBorder,
  Email, Phone, Send, Close, Image as ImageIcon,
  ArrowForwardIos, ArrowBackIos, Verified, Flag, Straighten,
  Videocam, Explore, DirectionsWalk, School, LocalHospital,
  Flight, ShoppingCart, RateReview, Whatshot, FileDownload,
  Receipt
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

export default function PublicHouseDetailPage() {
  const { theme } = useTheme();
  const { t, isAmharic } = useLanguage();
  const isMobile = useMediaQuery('(max-width: 768px)');
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

  // Rich Media Tab: 'images' | 'video' | '360' | '3d' | 'floorplan' | 'map'
  const [activeMediaTab, setActiveMediaTab] = useState<'images' | 'video' | '360' | '3d' | 'floorplan' | 'map'>('images');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);

  // Modals State
  const [appointmentModalOpen, setAppointmentModalOpen] = useState(false);
  const [offerModalOpen, setOfferModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [messageModalOpen, setMessageModalOpen] = useState(false);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [rentalApplicationOpen, setRentalApplicationOpen] = useState(false);

  // Review Form State
  const [newRating, setNewRating] = useState<number | null>(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  // Rental Application Form State
  const [applicationForm, setApplicationForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    occupation: '',
    monthlyIncome: '',
    numberOfOccupants: 1,
    preferredMoveInDate: '',
    message: ''
  });
  const [applicationLoading, setApplicationLoading] = useState(false);

  const fetchHouse = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/public/houses/${houseId}`);
      if (res.data?.success) {
        const data = res.data.data;
        setHouse(data);
        setLikesCount(data.likesCount || 0);
      }
    } catch (err: any) {
      console.error('Error fetching house details:', err);
      setError(err.response?.data?.message || 'Failed to load property details');
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const res = await api.get(`/reviews/house/${houseId}`);
      if (res.data?.success) {
        setReviews(res.data.data.reviews || []);
        setReviewStats(res.data.data.stats || { avgRating: 0, totalReviews: 0 });
      }
    } catch (err) {
      // Ignored
    }
  };

  const fetchSimilar = async () => {
    try {
      const res = await api.get(`/properties/${houseId}/similar`);
      if (res.data?.success) {
        setSimilarHouses(res.data.data || []);
      }
    } catch (err) {
      // Ignored
    }
  };

  useEffect(() => {
    if (houseId) {
      fetchHouse();
      fetchReviews();
      fetchSimilar();
    }
  }, [houseId]);

  const handleLikeToggle = async () => {
    try {
      const res = await api.post(`/properties/${houseId}/like`, {});
      if (res.data?.success) {
        setIsLiked(res.data.data.liked);
        setLikesCount(res.data.data.likesCount);
        setSnackbarMessage(res.data.data.liked ? 'Added to favorites' : 'Removed from favorites');
      }
    } catch (err: any) {
      setSnackbarMessage('Please log in to like properties');
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: house?.title || 'Real Estate Property',
        text: `Check out this listing on HRMS: ${house?.title}`,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      setSnackbarMessage('Listing link copied to clipboard!');
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRating || !reviewComment.trim()) return;

    try {
      setReviewSubmitting(true);
      await api.post('/reviews/house', {
        houseId,
        rating: newRating,
        title: reviewTitle,
        comment: reviewComment
      });

      setSnackbarMessage('Review submitted successfully!');
      setReviewDialogOpen(false);
      setReviewComment('');
      setReviewTitle('');
      fetchReviews();
    } catch (err: any) {
      setSnackbarMessage(err.response?.data?.message || 'Failed to submit review. Please log in.');
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleRentalApplicationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setApplicationLoading(true);
      await api.post('/houses/apply', {
        houseId,
        ...applicationForm,
        monthlyIncome: Number(applicationForm.monthlyIncome)
      });
      setSnackbarMessage('Rental application submitted successfully! Agent will review shortly.');
      setRentalApplicationOpen(false);
    } catch (err: any) {
      setSnackbarMessage(err.response?.data?.message || 'Failed to submit rental application.');
    } finally {
      setApplicationLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default' }}>
        <CircularProgress sx={{ color: '#06b6d4' }} />
      </Box>
    );
  }

  if (error || !house) {
    return (
      <Box sx={{ minHeight: '100vh', pt: 12, textAlign: 'center', bgcolor: 'background.default' }}>
        <Navbar />
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>{error || 'Property Not Found'}</Typography>
        <Button component={Link} href="/public/houses" variant="contained" sx={{ bgcolor: '#06b6d4' }}>
          Back to Properties
        </Button>
      </Box>
    );
  }

  const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3001/api';
  const primaryImageUrl = `${serverUrl}/public/houses/${house._id}/image?index=${selectedImageIndex}`;
  const isForSale = house.transactionType === 'BUY';
  const isShortStay = house.transactionType === 'SHORT_STAY';

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', pt: { xs: '64px', sm: '80px' }, pb: 10 }}>
      <Navbar />

      <Box sx={{ maxWidth: 1320, mx: 'auto', px: { xs: 2, sm: 3 } }}>
        {/* Navigation Breadcrumb & Back Link */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Button
            component={Link}
            href="/public/houses"
            startIcon={<ArrowBack />}
            sx={{ textTransform: 'none', color: 'text.secondary', fontWeight: 600 }}
          >
            {isAmharic ? 'ወደ ፍለጋ ተመለስ' : 'Back to Search'}
          </Button>

          {/* Social Share & Like Buttons */}
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title={isAmharic ? 'አጋራ' : 'Share Listing'}>
              <IconButton onClick={handleShare} sx={{ border: '1px solid', borderColor: 'divider' }}>
                <Share fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title={isLiked ? (isAmharic ? 'ከተወዳጅ አስወግድ' : 'Remove from favorites') : (isAmharic ? 'ወደ ተወዳጅ አስገባ' : 'Add to favorites')}>
              <IconButton
                onClick={handleLikeToggle}
                sx={{
                  border: '1px solid',
                  borderColor: isLiked ? '#f43f5e' : 'divider',
                  color: isLiked ? '#f43f5e' : 'inherit'
                }}
              >
                {isLiked ? <Favorite fontSize="small" /> : <FavoriteBorder fontSize="small" />}
              </IconButton>
            </Tooltip>
            <Tooltip title={isAmharic ? 'ስህተት ጥቆማ' : 'Report Misleading Information'}>
              <IconButton onClick={() => setReportModalOpen(true)} sx={{ border: '1px solid', borderColor: 'divider' }}>
                <Flag fontSize="small" sx={{ color: 'text.secondary' }} />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Title, Badges & Price Bar */}
        <Box sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', md: 'flex-start' },
          gap: 2,
          mb: 3
        }}>
          <Box sx={{ flex: 1, minWidth: 0, width: '100%' }}>
            {/* Badges Row */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 1, flexWrap: 'wrap' }}>
              <Chip
                label={isForSale ? (isAmharic ? 'የሚሸጥ' : 'For Sale') : isShortStay ? (isAmharic ? 'የአጭር ጊዜ' : 'Short Stay') : (isAmharic ? 'የሚከራይ' : 'For Rent')}
                sx={{
                  bgcolor: isForSale ? '#10b981' : '#06b6d4',
                  color: 'white',
                  fontWeight: 700,
                  fontSize: 12
                }}
              />
              <Chip
                label={house.propertyType}
                sx={{ bgcolor: 'action.hover', fontWeight: 600, fontSize: 12 }}
              />
              {house.isVerified && (
                <Chip
                  icon={<Verified sx={{ fontSize: '15px !important', color: 'white' }} />}
                  label={isAmharic ? 'የተረጋገጠ' : 'Official Verified Listing'}
                  sx={{ bgcolor: '#0284c7', color: 'white', fontWeight: 700, fontSize: 12 }}
                />
              )}
              {house.details.furnishingStatus && (
                <Chip
                  label={house.details.furnishingStatus.replace('_', ' ')}
                  sx={{ textTransform: 'capitalize', fontSize: 12 }}
                />
              )}
            </Box>

            <Typography variant="h4" sx={{
              fontWeight: 800,
              color: 'text.primary',
              mb: 0.8,
              lineHeight: 1.25,
              fontSize: { xs: '1.35rem', sm: '1.8rem', md: '2.2rem' },
              wordBreak: 'break-word'
            }}>
              {house.title}
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, color: 'text.secondary', flexWrap: 'wrap' }}>
              <LocationOn sx={{ fontSize: 18, color: '#06b6d4', flexShrink: 0 }} />
              <Typography variant="body2" sx={{ fontSize: { xs: '0.85rem', sm: '0.95rem' } }}>
                {house.location.address}, {house.location.neighborhood ? `${house.location.neighborhood}, ` : ''}{house.location.city}
              </Typography>
            </Box>
          </Box>

          {/* Pricing Box */}
          <Box sx={{
            textAlign: { xs: 'left', md: 'right' },
            width: { xs: '100%', md: 'auto' },
            p: { xs: 1.5, md: 0 },
            bgcolor: { xs: 'action.hover', md: 'transparent' },
            borderRadius: { xs: 2.5, md: 0 },
            flexShrink: 0
          }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, display: 'block' }}>
              {isForSale ? (isAmharic ? 'የመሸጫ ዋጋ' : 'Asking Purchase Price') : (isAmharic ? 'የወር ኪራይ ዋጋ' : 'Monthly Rental Rate')}
            </Typography>
            <Typography variant="h3" sx={{
              fontWeight: 900,
              color: '#06b6d4',
              lineHeight: 1.1,
              fontSize: { xs: '1.75rem', sm: '2.2rem', md: '2.5rem' },
              whiteSpace: 'nowrap'
            }}>
              ETB {house.pricing.price.toLocaleString()}
            </Typography>
            {!isForSale && house.pricing.securityDeposit > 0 && (
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
                {isAmharic ? 'የዋስትና ገንዘብ:' : 'Security Deposit:'} ETB {house.pricing.securityDeposit.toLocaleString()}
              </Typography>
            )}
          </Box>
        </Box>

        {/* YouTube-Style Tags Row */}
        {house.tags && house.tags.length > 0 && (
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
            {house.tags.map((tag, idx) => (
              <Chip
                key={idx}
                component={Link}
                href={`/public/houses?tags=${tag}`}
                label={`#${tag}`}
                clickable
                sx={{
                  bgcolor: 'action.hover',
                  color: 'text.secondary',
                  fontWeight: 600,
                  fontSize: 13,
                  '&:hover': { bgcolor: 'rgba(6, 182, 212, 0.1)', color: '#06b6d4' }
                }}
              />
            ))}
          </Box>
        )}

        {/* ─── RICH MEDIA EXPERIENCE TABS ────────────────────────────────── */}
        <Paper
          elevation={0}
          sx={{
            borderRadius: 4,
            overflow: 'hidden',
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
            mb: 5
          }}
        >
          {/* Media Switcher Header Bar with Map View Tab */}
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            p: 1.5,
            borderBottom: '1px solid',
            borderColor: 'divider',
            overflowX: 'auto',
            bgcolor: 'action.hover',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
            '&::-webkit-scrollbar': { display: 'none' }
          }}>
            <Button
              onClick={() => setActiveMediaTab('images')}
              variant={activeMediaTab === 'images' ? 'contained' : 'text'}
              startIcon={<PhotoCamera />}
              size="small"
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 700,
                whiteSpace: 'nowrap',
                flexShrink: 0,
                fontSize: { xs: 12, sm: 13 },
                px: { xs: 1.5, sm: 2 },
                bgcolor: activeMediaTab === 'images' ? '#06b6d4' : 'transparent',
                color: activeMediaTab === 'images' ? 'white' : 'text.primary'
              }}
            >
              {isAmharic ? 'ፎቶዎች' : 'Photo Gallery'} ({house.images?.length || 1})
            </Button>

            {/* Map View Tab beside Photo Gallery and 360 tour */}
            <Button
              onClick={() => setActiveMediaTab('map')}
              variant={activeMediaTab === 'map' ? 'contained' : 'text'}
              startIcon={<LocationOn />}
              size="small"
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 700,
                whiteSpace: 'nowrap',
                flexShrink: 0,
                fontSize: { xs: 12, sm: 13 },
                px: { xs: 1.5, sm: 2 },
                bgcolor: activeMediaTab === 'map' ? '#3b82f6' : 'transparent',
                color: activeMediaTab === 'map' ? 'white' : 'text.primary',
                '&:hover': {
                  bgcolor: activeMediaTab === 'map' ? '#2563eb' : 'action.hover'
                }
              }}
            >
              {isAmharic ? 'የካርታ እይታ' : 'Map View'}
            </Button>

            {house.panoramic360?.enabled && (
              <Button
                onClick={() => setActiveMediaTab('360')}
                variant={activeMediaTab === '360' ? 'contained' : 'text'}
                startIcon={<ThreeDRotation />}
                size="small"
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  fontSize: { xs: 12, sm: 13 },
                  px: { xs: 1.5, sm: 2 },
                  bgcolor: activeMediaTab === '360' ? '#a855f7' : 'transparent',
                  color: activeMediaTab === '360' ? 'white' : 'text.primary'
                }}
              >
                {isAmharic ? '360° እይታ' : '360° Virtual Tour'}
              </Button>
            )}

            {house.threeDModels && house.threeDModels.length > 0 && (
              <Button
                onClick={() => setActiveMediaTab('3d')}
                variant={activeMediaTab === '3d' ? 'contained' : 'text'}
                startIcon={<Explore />}
                size="small"
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  fontSize: { xs: 12, sm: 13 },
                  px: { xs: 1.5, sm: 2 },
                  bgcolor: activeMediaTab === '3d' ? '#0284c7' : 'transparent',
                  color: activeMediaTab === '3d' ? 'white' : 'text.primary'
                }}
              >
                {isAmharic ? '3D ሞዴል' : '3D Interactive Model'}
              </Button>
            )}

            <Button
              onClick={() => setActiveMediaTab('floorplan')}
              variant={activeMediaTab === 'floorplan' ? 'contained' : 'text'}
              startIcon={<Straighten />}
              size="small"
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 700,
                whiteSpace: 'nowrap',
                flexShrink: 0,
                fontSize: { xs: 12, sm: 13 },
                px: { xs: 1.5, sm: 2 },
                bgcolor: activeMediaTab === 'floorplan' ? '#10b981' : 'transparent',
                color: activeMediaTab === 'floorplan' ? 'white' : 'text.primary'
              }}
            >
              {isAmharic ? 'የቤት ንድፍ' : 'Floor Plan'}
            </Button>

            {house.videoUrl && (
              <Button
                onClick={() => setActiveMediaTab('video')}
                variant={activeMediaTab === 'video' ? 'contained' : 'text'}
                startIcon={<Videocam />}
                size="small"
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  fontSize: { xs: 12, sm: 13 },
                  px: { xs: 1.5, sm: 2 },
                  bgcolor: activeMediaTab === 'video' ? '#f43f5e' : 'transparent',
                  color: activeMediaTab === 'video' ? 'white' : 'text.primary'
                }}
              >
                {isAmharic ? 'የቪዲዮ እይታ' : 'Video Tour'}
              </Button>
            )}
          </Box>

          {/* Tab Content Display */}
          <Box sx={{ p: { xs: 1, md: 2 }, bgcolor: '#0f172a' }}>
            {/* 1. Photo Gallery Mode */}
            {activeMediaTab === 'images' && (
              <Box>
                {/* Main Selected Image */}
                <Box sx={{ position: 'relative', height: { xs: 300, sm: 450, md: 550 }, width: '100%', borderRadius: 2, overflow: 'hidden' }}>
                  <Box
                    component="img"
                    src={primaryImageUrl}
                    alt={house.title}
                    onError={(e: any) => {
                      e.target.src = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80';
                    }}
                    sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />

                  {/* Room Label & Caption Overlay */}
                  {house.images && house.images[selectedImageIndex] && (
                    <Box sx={{
                      position: 'absolute', bottom: 16, left: 16,
                      bgcolor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(8px)',
                      color: 'white', px: 2, py: 1, borderRadius: 2
                    }}>
                      <Typography sx={{ fontWeight: 700, fontSize: 14 }}>
                        {house.images[selectedImageIndex].roomLabel || 'Main View'}
                      </Typography>
                      {house.images[selectedImageIndex].caption && (
                        <Typography sx={{ fontSize: 12, color: '#94a3b8' }}>
                          {house.images[selectedImageIndex].caption}
                        </Typography>
                      )}
                    </Box>
                  )}

                  {/* Arrow Navigation */}
                  {house.images && house.images.length > 1 && (
                    <>
                      <IconButton
                        onClick={() => setSelectedImageIndex((prev) => (prev > 0 ? prev - 1 : house.images.length - 1))}
                        sx={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', bgcolor: 'rgba(0,0,0,0.6)', color: 'white' }}
                      >
                        <ArrowBackIos fontSize="small" />
                      </IconButton>
                      <IconButton
                        onClick={() => setSelectedImageIndex((prev) => (prev < house.images.length - 1 ? prev + 1 : 0))}
                        sx={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', bgcolor: 'rgba(0,0,0,0.6)', color: 'white' }}
                      >
                        <ArrowForwardIos fontSize="small" />
                      </IconButton>
                    </>
                  )}
                </Box>

                {/* Thumbnails Strip */}
                {house.images && house.images.length > 1 && (
                  <Box sx={{ display: 'flex', gap: 1.5, mt: 2, overflowX: 'auto', pb: 1 }}>
                    {house.images.map((img, idx) => (
                      <Box
                        key={idx}
                        onClick={() => setSelectedImageIndex(idx)}
                        sx={{
                          width: 80, height: 60, flexShrink: 0, borderRadius: 1.5, overflow: 'hidden',
                          cursor: 'pointer', border: '2px solid',
                          borderColor: selectedImageIndex === idx ? '#06b6d4' : 'transparent',
                          opacity: selectedImageIndex === idx ? 1 : 0.65
                        }}
                      >
                        <Box
                          component="img"
                          src={`${serverUrl}/public/houses/${house._id}/image?index=${idx}`}
                          sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </Box>
                    ))}
                  </Box>
                )}
              </Box>
            )}

            {/* 2. 360° Virtual Panoramic Tour Mode */}
            {activeMediaTab === '360' && (
              <PanoramaViewer
                imageUrl={house.panoramic360?.imageUrl || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=2000&q=80'}
                height={550}
              />
            )}

            {/* 3. 3D Interactive Model Mode */}
            {activeMediaTab === '3d' && (
              <ThreeViewer
                modelUrl={`${serverUrl}/public/houses/${house._id}/3d`}
                height={550}
              />
            )}

            {/* 4. Floor Plan & Room Dimensions */}
            {activeMediaTab === 'floorplan' && (
              <Box sx={{ bgcolor: 'background.paper', p: 3, borderRadius: 2 }}>
                <FloorPlanViewer
                  floorPlanUrl={house.floorPlan?.url}
                  rooms={house.floorPlan?.rooms}
                  totalArea={house.details.area}
                />
              </Box>
            )}

            {/* 5. Walkthrough Video */}
            {activeMediaTab === 'video' && (
              <Box sx={{ height: { xs: 320, sm: 420, md: 500 }, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <iframe
                  width="100%"
                  height="100%"
                  src="https://www.youtube.com/embed/dQw4w9WgXcQ"
                  title="Property Walkthrough Video"
                  style={{ border: 0, borderRadius: 8 }}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </Box>
            )}

            {/* 6. Map View Tab Content */}
            {activeMediaTab === 'map' && (
              <Box sx={{ position: 'relative', height: { xs: 360, sm: 460, md: 550 }, width: '100%', borderRadius: 2, overflow: 'hidden' }}>
                <MapView
                  houses={[house, ...similarHouses]}
                  selectedHouse={house}
                  center={[
                    house.location?.coordinates?.lat || 9.03,
                    house.location?.coordinates?.lng || 38.74
                  ]}
                  zoom={15}
                  onSelectHouse={(h) => {
                    if (h._id !== house._id) {
                      router.push(`/public/houses/${h._id}`);
                    }
                  }}
                  formatPrice={(price) => `ETB ${Number(price).toLocaleString()}`}
                  theme={theme === 'dark' ? 'dark' : 'light'}
                />

                {/* Floating Directions Action Bar */}
                <Box sx={{
                  position: 'absolute',
                  bottom: 12,
                  left: 12,
                  right: 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 1,
                  bgcolor: 'rgba(15, 23, 42, 0.88)',
                  backdropFilter: 'blur(8px)',
                  color: 'white',
                  px: 2,
                  py: 1,
                  borderRadius: 2,
                  zIndex: 900
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0, flex: 1 }}>
                    <LocationOn sx={{ color: '#00ffff', fontSize: 20, flexShrink: 0 }} />
                    <Typography variant="body2" sx={{ fontWeight: 600, fontSize: { xs: 12, sm: 13 }, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {house.location.address}, {house.location.neighborhood || house.location.city}
                    </Typography>
                  </Box>

                  <Button
                    variant="contained"
                    size="small"
                    color="primary"
                    onClick={() => {
                      const lat = house.location?.coordinates?.lat || 9.03;
                      const lng = house.location?.coordinates?.lng || 38.74;
                      window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`, '_blank');
                    }}
                    sx={{
                      borderRadius: 1.5,
                      textTransform: 'none',
                      fontWeight: 700,
                      fontSize: { xs: 11, sm: 12 },
                      px: 1.5,
                      flexShrink: 0
                    }}
                  >
                    {isAmharic ? 'በGoogle ካርታ ክፈት' : 'Open in Google Maps'}
                  </Button>
                </Box>
              </Box>
            )}
          </Box>
        </Paper>

        {/* ─── MAIN CONTENT TWO-COLUMN GRID ───────────────────────────── */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' }, gap: { xs: 3, md: 4 } }}>
          {/* Left Column: Details, Specifications, Amenities, Reviews */}
          <Box>
            {/* Quick Specs Cards */}
            <Box sx={{
              display: 'grid',
              gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' },
              gap: 1.5,
              mb: 4
            }}>
              <Paper elevation={0} sx={{ p: { xs: 1.5, sm: 2 }, borderRadius: 2.5, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, color: 'text.secondary', mb: 0.5 }}>
                  <Bed fontSize="small" sx={{ color: '#06b6d4' }} />
                  <Typography variant="caption" sx={{ fontWeight: 600, fontSize: { xs: 11, sm: 12 } }}>{isAmharic ? 'መኝታ ክፍሎች' : 'Bedrooms'}</Typography>
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 800, fontSize: { xs: 16, sm: 20 } }}>{house.details.bedrooms}</Typography>
              </Paper>

              <Paper elevation={0} sx={{ p: { xs: 1.5, sm: 2 }, borderRadius: 2.5, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, color: 'text.secondary', mb: 0.5 }}>
                  <Bathtub fontSize="small" sx={{ color: '#06b6d4' }} />
                  <Typography variant="caption" sx={{ fontWeight: 600, fontSize: { xs: 11, sm: 12 } }}>{isAmharic ? 'መታጠቢያ ክፍሎች' : 'Bathrooms'}</Typography>
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 800, fontSize: { xs: 16, sm: 20 } }}>{house.details.bathrooms}</Typography>
              </Paper>

              <Paper elevation={0} sx={{ p: { xs: 1.5, sm: 2 }, borderRadius: 2.5, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, color: 'text.secondary', mb: 0.5 }}>
                  <SquareFoot fontSize="small" sx={{ color: '#06b6d4' }} />
                  <Typography variant="caption" sx={{ fontWeight: 600, fontSize: { xs: 11, sm: 12 } }}>{isAmharic ? 'ጠቅላላ ስፋት' : 'Total Area'}</Typography>
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 800, fontSize: { xs: 16, sm: 20 } }}>{house.details.area} m²</Typography>
              </Paper>

              <Paper elevation={0} sx={{ p: { xs: 1.5, sm: 2 }, borderRadius: 2.5, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, color: 'text.secondary', mb: 0.5 }}>
                  <LocalParking fontSize="small" sx={{ color: '#06b6d4' }} />
                  <Typography variant="caption" sx={{ fontWeight: 600, fontSize: { xs: 11, sm: 12 } }}>{isAmharic ? 'መኪና ማቆሚያ' : 'Parking'}</Typography>
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 800, fontSize: { xs: 16, sm: 20 } }}>{house.details.parkingSpaces || 1} {isAmharic ? 'ቦታ' : 'Slots'}</Typography>
              </Paper>
            </Box>

            {/* Description */}
            <Paper elevation={0} sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', mb: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5, fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
                {isAmharic ? 'ስለ ንብረቱ ዝርዝር መረጃ' : 'About this Property'}
              </Typography>
              <Typography variant="body1" sx={{ color: 'text.secondary', lineHeight: 1.8, whiteSpace: 'pre-line', fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                {house.description}
              </Typography>
            </Paper>

            {/* Category-Specific Dynamic Attributes */}
            {house.categoryAttributes && Object.keys(house.categoryAttributes).length > 0 && (
              <Paper elevation={0} sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', mb: 4 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
                  {isAmharic ? 'ልዩ የንብረት ዝርዝሮች' : 'Category Specifications'} ({house.propertyType})
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                  {Object.entries(house.categoryAttributes).map(([key, val]) => (
                    <Box key={key} sx={{ p: 1.5, bgcolor: 'action.hover', borderRadius: 2 }}>
                      <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'capitalize' }}>
                        {key.replace(/([A-Z])/g, ' $1')}
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600, fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                        {typeof val === 'boolean' ? (val ? 'Yes (Equipped)' : 'No') : String(val)}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Paper>
            )}

            {/* Amenities Grid */}
            <Paper elevation={0} sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', mb: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
                {isAmharic ? 'አገልግሎቶች እና መገልገያዎች' : 'Amenities & Facilities'}
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)' }, gap: 1.5 }}>
                {(house.details.amenities || []).map((amenity, idx) => (
                  <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckCircle sx={{ color: '#10b981', fontSize: 18, flexShrink: 0 }} />
                    <Typography variant="body2" sx={{ fontWeight: 500, fontSize: { xs: 12.5, sm: 14 } }}>{amenity}</Typography>
                  </Box>
                ))}
              </Box>
            </Paper>

            {/* Nearby Landmarks & Amenities (Section 7) */}
            <Paper elevation={0} sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', mb: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <DirectionsWalk sx={{ color: '#06b6d4', flexShrink: 0 }} />
                <Typography variant="h6" sx={{ fontWeight: 700, fontSize: { xs: '1rem', sm: '1.2rem' } }}>
                  {isAmharic ? 'የአካባቢ ምልክቶች እና ርቀት' : 'Neighborhood Landmarks & Distances'}
                </Typography>
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5 }}>
                {(house.nearbyAmenities && house.nearbyAmenities.length > 0 ? house.nearbyAmenities : [
                  { name: isAmharic ? 'ትምህርት ቤት' : 'Local School', type: 'school', distanceKm: 1.2 },
                  { name: isAmharic ? 'ሆስፒታል እና ክሊኒክ' : 'Medical Center', type: 'hospital', distanceKm: 0.8 },
                  { name: isAmharic ? 'የትራንስፖርት ጣቢያ' : 'Transit Station', type: 'transit', distanceKm: 0.5 },
                  { name: isAmharic ? 'ገበያ አዳራሽ' : 'Shopping Mall', type: 'shopping', distanceKm: 0.7 }
                ]).map((amenity, idx) => (
                  <Box key={idx} sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    p: 1.5,
                    bgcolor: 'action.hover',
                    borderRadius: 2,
                    gap: 1
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                      {amenity.type === 'school' && <School sx={{ color: '#3b82f6', fontSize: 20, flexShrink: 0 }} />}
                      {amenity.type === 'hospital' && <LocalHospital sx={{ color: '#ef4444', fontSize: 20, flexShrink: 0 }} />}
                      {amenity.type === 'transit' && <DirectionsWalk sx={{ color: '#10b981', fontSize: 20, flexShrink: 0 }} />}
                      {amenity.type === 'shopping' && <ShoppingCart sx={{ color: '#f59e0b', fontSize: 20, flexShrink: 0 }} />}
                      {amenity.type === 'landmark' && <LocationOn sx={{ color: '#a855f7', fontSize: 20, flexShrink: 0 }} />}
                      <Typography variant="body2" sx={{ fontWeight: 600, fontSize: { xs: 12.5, sm: 14 }, wordBreak: 'break-word' }}>
                        {amenity.name}
                      </Typography>
                    </Box>
                    <Chip size="small" label={`${amenity.distanceKm} km`} sx={{ fontWeight: 700, fontSize: 11, flexShrink: 0 }} />
                  </Box>
                ))}
              </Box>
            </Paper>

            {/* Ratings & Customer Reviews (Section 5 & 12) */}
            <Paper elevation={0} sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', mb: 4 }}>
              <Box sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: { xs: 'flex-start', sm: 'center' },
                justifyContent: 'space-between',
                gap: 2,
                mb: 3
              }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
                    {isAmharic ? 'የደንበኞች አስተያየት እና ደረጃ' : 'Customer Reviews & Ratings'}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
                    <Rating value={reviewStats.avgRating || 4.8} precision={0.1} readOnly size="small" />
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {reviewStats.avgRating ? reviewStats.avgRating.toFixed(1) : '4.8'} / 5
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      ({reviewStats.totalReviews || reviews.length} {isAmharic ? 'ግምገማዎች' : 'reviews'})
                    </Typography>
                  </Box>
                </Box>

                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<RateReview />}
                  onClick={() => setReviewDialogOpen(true)}
                  sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, flexShrink: 0 }}
                >
                  {isAmharic ? 'አስተያየት ይጻፉ' : 'Write Review'}
                </Button>
              </Box>

              {reviews.length === 0 ? (
                <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', py: 3 }}>
                  No customer reviews yet. Be the first to share your experience!
                </Typography>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {reviews.map((rev) => (
                    <Box key={rev._id} sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ width: 32, height: 32, bgcolor: '#06b6d4', fontSize: 14 }}>
                            {rev.userName[0]}
                          </Avatar>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{rev.userName}</Typography>
                          {rev.isVerifiedResident && (
                            <Chip size="small" label="Verified Resident" color="success" sx={{ height: 20, fontSize: 10 }} />
                          )}
                        </Box>
                        <Rating value={rev.rating} size="small" readOnly />
                      </Box>
                      {rev.title && <Typography variant="body2" sx={{ fontWeight: 700 }}>{rev.title}</Typography>}
                      <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>{rev.comment}</Typography>
                    </Box>
                  ))}
                </Box>
              )}
            </Paper>
          </Box>

          {/* Right Column: Responsible Agent Card & Direct Action Buttons */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Primary Action Card */}
            <Paper elevation={0} sx={{ p: 3, borderRadius: 3, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                {isAmharic ? 'ይህን ንብረት ወደዱት?' : 'Interested in this Property?'}
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {/* 1. Schedule Viewing */}
                <Button
                  variant="contained"
                  fullWidth
                  size="large"
                  startIcon={<CalendarToday />}
                  onClick={() => setAppointmentModalOpen(true)}
                  sx={{
                    borderRadius: 2.5,
                    py: 1.4,
                    fontWeight: 700,
                    textTransform: 'none'
                  }}
                >
                  {isAmharic ? 'የጉብኝት ቀጠሮ ይያዙ' : 'Schedule Viewing Tour'}
                </Button>

                {/* 2. For Sale: Submit Purchase Offer */}
                {isForSale ? (
                  <Button
                    variant="contained"
                    fullWidth
                    size="large"
                    color="success"
                    startIcon={<LocalOffer />}
                    onClick={() => setOfferModalOpen(true)}
                    sx={{
                      borderRadius: 2.5,
                      py: 1.4,
                      fontWeight: 700,
                      textTransform: 'none'
                    }}
                  >
                    {isAmharic ? 'የግዢ ጥያቄ ያቅርቡ' : 'Make a Purchase Offer'}
                  </Button>
                ) : (
                  /* For Rent: Apply for Rental */
                  <Button
                    variant="contained"
                    fullWidth
                    size="large"
                    color="success"
                    startIcon={<Description />}
                    onClick={() => setRentalApplicationOpen(true)}
                    sx={{
                      borderRadius: 2.5,
                      py: 1.4,
                      fontWeight: 700,
                      textTransform: 'none'
                    }}
                  >
                    {isAmharic ? 'የኪራይ ውል ያመልክቱ' : 'Apply for Rental Lease'}
                  </Button>
                )}

                {/* 3. Send Direct In-App Inquiry */}
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<Email />}
                  onClick={() => setMessageModalOpen(true)}
                  sx={{ borderRadius: 2.5, py: 1.2, textTransform: 'none', fontWeight: 600 }}
                >
                  {isAmharic ? 'ቀጥታ ጥያቄ ይላኩ' : 'Send Direct Inquiry'}
                </Button>
              </Box>
            </Paper>

            {/* Authorized Agent / Owner Card */}
            <Paper elevation={0} sx={{ p: 3, borderRadius: 3, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase' }}>
                Listing Representative
              </Typography>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, my: 2 }}>
                <Avatar sx={{ width: 50, height: 50, bgcolor: '#06b6d4', fontWeight: 700 }}>
                  {house.agentId?.name?.[0] || 'A'}
                </Avatar>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    {house.agentId?.name || house.agentName || 'Real Estate Agent'}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: 13 }}>
                    {house.agentId?.agencyName || 'Authorized Real Estate Partner'}
                  </Typography>
                  {house.agentId?.isVerified && (
                    <Chip size="small" icon={<Verified sx={{ fontSize: '13px !important' }} />} label="Verified Agent" color="primary" sx={{ height: 18, fontSize: 10, mt: 0.5 }} />
                  )}
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Phone sx={{ color: 'text.secondary', fontSize: 18 }} />
                  <Typography variant="body2">{house.agentContact || house.agentId?.phone || '0911000002'}</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Email sx={{ color: 'text.secondary', fontSize: 18 }} />
                  <Typography variant="body2">{house.agentId?.email || 'agent@hrms.com'}</Typography>
                </Box>
              </Box>
            </Paper>
          </Box>
        </Box>

        {/* ─── SIMILAR LISTINGS & RECOMMENDATIONS ─────────────────────── */}
        {similarHouses.length > 0 && (
          <Box sx={{ mt: 8 }}>
            <Typography variant="h5" sx={{ fontWeight: 800, mb: 3 }}>
              Recommended Similar Properties
            </Typography>

            <Box sx={{
              display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
              gap: 3
            }}>
              {similarHouses.map((sim) => (
                <Card
                  key={sim._id}
                  component={Link}
                  href={`/public/houses/${sim._id}`}
                  sx={{
                    textDecoration: 'none',
                    borderRadius: 3,
                    border: '1px solid',
                    borderColor: 'divider',
                    overflow: 'hidden',
                    transition: 'all 0.3s',
                    '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 12px 30px rgba(0,0,0,0.1)' }
                  }}
                >
                  <Box sx={{ height: 200, bgcolor: '#0f172a' }}>
                    <Box
                      component="img"
                      src={`${serverUrl}/public/houses/${sim._id}/image`}
                      alt={sim.title}
                      onError={(e: any) => {
                        e.target.src = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=400&q=80';
                      }}
                      sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </Box>
                  <CardContent sx={{ p: 2 }}>
                    <Typography sx={{ fontWeight: 700, fontSize: 15, color: 'text.primary', mb: 0.5 }}>
                      {sim.title}
                    </Typography>
                    <Typography sx={{ fontWeight: 800, color: '#06b6d4', fontSize: 16 }}>
                      ETB {sim.pricing.price.toLocaleString()}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Box>
          </Box>
        )}
      </Box>

      {/* Appointment Booking Modal */}
      <AppointmentModal
        open={appointmentModalOpen}
        onClose={() => setAppointmentModalOpen(false)}
        house={house}
      />

      {/* Purchase Offer Submission Modal */}
      <PurchaseOfferModal
        open={offerModalOpen}
        onClose={() => setOfferModalOpen(false)}
        house={house}
      />

      {/* Report Listing Modal */}
      <ReportListingModal
        open={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        house={house}
      />

      {/* Message Modal */}
      {messageModalOpen && (
        <MessageModal
          open={messageModalOpen}
          onClose={() => setMessageModalOpen(false)}
          houseId={house._id}
          houseTitle={house.title}
        />
      )}

      {/* Rental Application Dialog */}
      <Dialog open={rentalApplicationOpen} onClose={() => setRentalApplicationOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Submit Rental Lease Application</DialogTitle>
        <form onSubmit={handleRentalApplicationSubmit}>
          <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Full Legal Name"
              required
              fullWidth
              value={applicationForm.fullName}
              onChange={(e) => setApplicationForm({ ...applicationForm, fullName: e.target.value })}
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Email"
                type="email"
                required
                fullWidth
                value={applicationForm.email}
                onChange={(e) => setApplicationForm({ ...applicationForm, email: e.target.value })}
              />
              <TextField
                label="Phone Number"
                required
                fullWidth
                value={applicationForm.phone}
                onChange={(e) => setApplicationForm({ ...applicationForm, phone: e.target.value })}
              />
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Occupation / Employer"
                required
                fullWidth
                value={applicationForm.occupation}
                onChange={(e) => setApplicationForm({ ...applicationForm, occupation: e.target.value })}
              />
              <TextField
                label="Monthly Income (ETB)"
                type="number"
                required
                fullWidth
                value={applicationForm.monthlyIncome}
                onChange={(e) => setApplicationForm({ ...applicationForm, monthlyIncome: e.target.value })}
              />
            </Box>
            <TextField
              label="Preferred Move-in Date"
              type="date"
              required
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={applicationForm.preferredMoveInDate}
              onChange={(e) => setApplicationForm({ ...applicationForm, preferredMoveInDate: e.target.value })}
            />
            <TextField
              label="Cover Note / Background Information"
              multiline
              rows={3}
              fullWidth
              value={applicationForm.message}
              onChange={(e) => setApplicationForm({ ...applicationForm, message: e.target.value })}
            />
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setRentalApplicationOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={applicationLoading} sx={{ bgcolor: '#10b981' }}>
              {applicationLoading ? <CircularProgress size={24} color="inherit" /> : 'Submit Application'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Write a Review Dialog */}
      <Dialog open={reviewDialogOpen} onClose={() => setReviewDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Rate & Review Property</DialogTitle>
        <form onSubmit={handleReviewSubmit}>
          <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }}>
            <Rating
              value={newRating}
              onChange={(_, val) => setNewRating(val)}
              size="large"
            />
            <TextField
              label="Review Headline"
              fullWidth
              placeholder="e.g. Great building with panoramic city views"
              value={reviewTitle}
              onChange={(e) => setReviewTitle(e.target.value)}
            />
            <TextField
              label="Your Honest Review"
              multiline
              rows={4}
              required
              fullWidth
              placeholder="Describe your living experience, amenities, building management, or neighborhood..."
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
            />
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setReviewDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={reviewSubmitting} sx={{ bgcolor: '#06b6d4' }}>
              Submit Review
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Snackbar
        open={Boolean(snackbarMessage)}
        autoHideDuration={3000}
        onClose={() => setSnackbarMessage('')}
        message={snackbarMessage}
      />

      <Footer />
    </Box>
  );
}