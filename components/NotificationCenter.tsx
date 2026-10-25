'use client';

import { useState, useEffect } from 'react';
import {
  IconButton,
  Badge,
  Menu,
  MenuItem,
  Typography,
  Box,
  Divider,
  Button,
  CircularProgress
} from '@mui/material';
import {
  Notifications,
  NotificationsNone,
  CalendarMonth,
  LocalOffer,
  Article,
  Build,
  Info
} from '@mui/icons-material';
import { useTheme } from '@/lib/theme-context';
import { useLanguage } from '@/lib/language-context';
import api from '@/app/utils/api';
import { NotificationItem } from '@/types/houses';
import Link from 'next/link';

export default function NotificationCenter() {
  const { theme } = useTheme();
  const { t, isAmharic } = useLanguage();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('token');
    if (!token) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    try {
      setLoading(true);
      const res = await api.get('/workflows/notifications');
      if (res.data?.success) {
        setNotifications(res.data.data.notifications || []);
        setUnreadCount(res.data.data.unreadCount || 0);
      }
    } catch (err) {
      // Ignored if unauthenticated
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('token');
    if (!token) return;

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
    fetchNotifications();
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMarkAllRead = async () => {
    try {
      await api.patch('/workflows/notifications/read-all', {});
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'APPOINTMENT':
        return <CalendarMonth sx={{ color: '#06b6d4', fontSize: 20 }} />;
      case 'OFFER_UPDATE':
        return <LocalOffer sx={{ color: '#10b981', fontSize: 20 }} />;
      case 'LEASE_UPDATE':
      case 'RENT_DUE':
        return <Article sx={{ color: '#f59e0b', fontSize: 20 }} />;
      case 'MAINTENANCE_UPDATE':
        return <Build sx={{ color: '#ec4899', fontSize: 20 }} />;
      default:
        return <Info sx={{ color: '#6366f1', fontSize: 20 }} />;
    }
  };

  return (
    <>
      <IconButton 
        onClick={handleClick} 
        sx={{ 
          color: theme === 'dark' ? '#f1f5f9' : '#0f172a',
          '&:hover': {
            bgcolor: theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)'
          }
        }}
        aria-label={t('notifications.title', 'Notifications')}
      >
        <Badge badgeContent={unreadCount} color="error">
          {unreadCount > 0 ? <Notifications sx={{ color: '#38bdf8' }} /> : <NotificationsNone />}
        </Badge>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          sx: {
            width: 360,
            maxWidth: 'calc(100vw - 32px)',
            maxHeight: 450,
            borderRadius: 3,
            p: 1,
            bgcolor: theme === 'dark' ? '#112240' : '#ffffff',
            color: theme === 'dark' ? '#f1f5f9' : '#0f172a',
            border: `1px solid ${theme === 'dark' ? '#233554' : '#e2e8f0'}`,
            boxShadow: theme === 'dark' 
              ? '0 20px 35px -5px rgba(0,0,0,0.6), 0 10px 10px -5px rgba(0,0,0,0.4)' 
              : '0 20px 35px -5px rgba(15,23,42,0.1), 0 10px 10px -5px rgba(15,23,42,0.04)'
          }
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, fontSize: { xs: '0.95rem', sm: '1.05rem' } }}>
            {t('notifications.title', 'Notifications')} {unreadCount > 0 && `(${unreadCount})`}
          </Typography>
          {unreadCount > 0 && (
            <Button 
              size="small" 
              onClick={handleMarkAllRead} 
              sx={{ 
                fontSize: 12, 
                textTransform: 'none',
                color: theme === 'dark' ? '#38bdf8' : '#2563eb',
                fontWeight: 600
              }}
            >
              {t('notifications.mark_all_read', 'Mark all read')}
            </Button>
          )}
        </Box>

        <Divider sx={{ my: 1, borderColor: theme === 'dark' ? '#233554' : '#e2e8f0' }} />

        {loading && notifications.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress size={24} sx={{ color: theme === 'dark' ? '#38bdf8' : '#2563eb' }} />
          </Box>
        ) : notifications.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: theme === 'dark' ? '#94a3b8' : '#64748b' }}>
              {t('notifications.empty', 'No notifications yet')}
            </Typography>
          </Box>
        ) : (
          notifications.map((item) => (
            <MenuItem
              key={item._id}
              component={Link}
              href={item.link || '/admin/customer'}
              onClick={handleClose}
              sx={{
                borderRadius: 2,
                mb: 0.5,
                bgcolor: item.isRead 
                  ? 'transparent' 
                  : (theme === 'dark' ? 'rgba(56, 189, 248, 0.1)' : 'rgba(37, 99, 235, 0.08)'),
                display: 'flex',
                alignItems: 'flex-start',
                gap: 1.5,
                py: 1.2,
                transition: 'all 0.2s ease',
                '&:hover': {
                  bgcolor: theme === 'dark' ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)'
                }
              }}
            >
              <Box sx={{ mt: 0.5 }}>{getIconForType(item.type)}</Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontWeight: item.isRead ? 500 : 700, 
                    color: theme === 'dark' ? '#f1f5f9' : '#0f172a', 
                    lineHeight: 1.2 
                  }}
                >
                  {item.title}
                </Typography>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: theme === 'dark' ? '#94a3b8' : '#64748b', 
                    display: 'block', 
                    mt: 0.3, 
                    lineHeight: 1.3 
                  }}
                >
                  {item.message}
                </Typography>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: theme === 'dark' ? '#64748b' : '#94a3b8', 
                    fontSize: 10 
                  }}
                >
                  {new Date(item.createdAt).toLocaleDateString(isAmharic ? 'am-ET' : 'en-US')}
                </Typography>
              </Box>
            </MenuItem>
          ))
        )}
      </Menu>
    </>
  );
}
