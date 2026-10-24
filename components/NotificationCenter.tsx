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
import api from '@/app/utils/api';
import { NotificationItem } from '@/types/houses';
import Link from 'next/link';

export default function NotificationCenter() {
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
      <IconButton onClick={handleClick} sx={{ color: 'text.primary' }}>
        <Badge badgeContent={unreadCount} color="error">
          {unreadCount > 0 ? <Notifications sx={{ color: '#06b6d4' }} /> : <NotificationsNone />}
        </Badge>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          sx: {
            width: 360,
            maxHeight: 450,
            borderRadius: 2.5,
            p: 1,
            boxShadow: '0 10px 30px rgba(0,0,0,0.25)'
          }
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            Notifications {unreadCount > 0 && `(${unreadCount})`}
          </Typography>
          {unreadCount > 0 && (
            <Button size="small" onClick={handleMarkAllRead} sx={{ fontSize: 12, textTransform: 'none' }}>
              Mark all read
            </Button>
          )}
        </Box>

        <Divider sx={{ my: 1 }} />

        {loading && notifications.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress size={24} />
          </Box>
        ) : notifications.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              No notifications yet
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
                borderRadius: 1.5,
                mb: 0.5,
                bgcolor: item.isRead ? 'transparent' : 'action.hover',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 1.5,
                py: 1.2
              }}
            >
              <Box sx={{ mt: 0.5 }}>{getIconForType(item.type)}</Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body2" sx={{ fontWeight: item.isRead ? 500 : 700, color: 'text.primary', lineHeight: 1.2 }}>
                  {item.title}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.3, lineHeight: 1.3 }}>
                  {item.message}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: 10 }}>
                  {new Date(item.createdAt).toLocaleDateString()}
                </Typography>
              </Box>
            </MenuItem>
          ))
        )}
      </Menu>
    </>
  );
}
