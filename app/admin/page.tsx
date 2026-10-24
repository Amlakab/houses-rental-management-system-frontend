'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Users, UserPlus, UserCheck, UserX, User, Calendar,
  TrendingUp, ArrowRight,
  Settings, Briefcase, PieChart,
  FileText, BarChart, Shield,
  MessageSquare, Bell, HelpCircle,
  CheckCircle, AlertCircle,
  DollarSign, Building, Home, Handshake,
  ClipboardList, ShieldCheck, Cog, Activity,
} from 'lucide-react';
import api from '@/app/utils/api';
import { useTheme } from '@/lib/theme-context';
import type { Role } from '@/lib/menu-types';

// ─── Types ──────────────────────────────────────────────────────────
interface DashboardUser {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
}

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  newUsersToday: number;
  usersByRole: { role: string; count: number }[];
}

type StatColor = 'green' | 'blue' | 'yellow' | 'red' | 'purple';

interface RoleStat {
  label: string;
  value: string | number;
  change?: string;
  icon: React.ReactNode;
  color: StatColor;
}

interface QuickAction {
  icon: React.ReactNode;
  label: string;
  href: string;
}

interface Announcement {
  title: string;
  description: string;
  date: string;
  type: 'info' | 'success' | 'warning';
}

interface RoleContent {
  welcome: string;
  description: string;
  stats: RoleStat[];
  quickActions: QuickAction[];
  announcements: Announcement[];
}

// ─── Shared stat/action builders ────────────────────────────────────
const COMMON_ACTIONS: QuickAction[] = [
  { icon: <Settings size={20} />,      label: 'Profile Settings', href: '/profile' },
  { icon: <MessageSquare size={20} />, label: 'Messages',         href: '/messages' },
  { icon: <Bell size={20} />,          label: 'Notifications',    href: '/notifications' },
  { icon: <HelpCircle size={20} />,    label: 'Help & Support',   href: '/help' },
];

const COMMON_ANNOUNCEMENTS: Announcement[] = [
  { title: 'System Maintenance', description: 'Scheduled this weekend',            date: '2024-01-15', type: 'info' },
  { title: 'Training Session',   description: 'New feature training next Monday',  date: '2024-01-16', type: 'success' },
  { title: 'Policy Update',      description: 'Updated privacy policy available',  date: '2024-01-14', type: 'warning' },
];

// ─── Role content map (single source of truth) ─────────────────────
// To add a new role later: add one entry here. Nothing else changes.
const ROLE_CONTENT: Record<Role, RoleContent> = {
  admin: {
    welcome: 'Welcome, System Administrator!',
    description: 'Manage users, menus, permissions, and system settings',
    stats: [], // admin stats come from live data (see render)
    quickActions: [
      { icon: <Users size={20} />,       label: 'Manage Users',          href: '/admin/users' },
      { icon: <Calendar size={20} />,    label: 'Workflows & Requests',  href: '/admin/workflows' },
      { icon: <Shield size={20} />,      label: 'Manage Menus',          href: '/admin/menus' },
      { icon: <ShieldCheck size={20} />, label: 'Security',              href: '/admin/security' },
      { icon: <BarChart size={20} />,    label: 'Reports',               href: '/admin/reports/transactions' },
      ...COMMON_ACTIONS,
    ],
    announcements: COMMON_ANNOUNCEMENTS,
  },
  owner: {
    welcome: 'Welcome, Property Owner!',
    description: 'Track your properties, orders, and agents',
    stats: [
      { label: 'My Properties',  value: 12,     change: '+2',  icon: <Home size={20} />,       color: 'blue' },
      { label: 'Active Agents',  value: 5,      change: '+1',  icon: <Users size={20} />,      color: 'green' },
      { label: 'Open Orders',    value: 8,      change: '-3',  icon: <ClipboardList size={20} />, color: 'yellow' },
      { label: 'Revenue (MTD)',  value: 'ETB 84,200', change: '+12%', icon: <DollarSign size={20} />, color: 'purple' },
    ],
    quickActions: [
      { icon: <Home size={20} />,          label: 'My Houses',            href: '/admin/houses' },
      { icon: <Calendar size={20} />,      label: 'Workflows & Requests', href: '/admin/workflows' },
      { icon: <Users size={20} />,         label: 'My Agents',            href: '/admin/agents' },
      { icon: <ClipboardList size={20} />, label: 'Orders',               href: '/admin/manager/orders' },
      { icon: <ShieldCheck size={20} />,   label: 'Approve Txns',         href: '/admin/transactions/approve' },
      ...COMMON_ACTIONS,
    ],
    announcements: COMMON_ANNOUNCEMENTS,
  },
  manager: {
    welcome: 'Welcome, Manager!',
    description: 'Review and approve house submissions',
    stats: [
      { label: 'Pending Approvals', value: 6,      change: '+2',  icon: <ClipboardList size={20} />, color: 'yellow' },
      { label: 'Approved Today',    value: 4,      change: '+1',  icon: <CheckCircle size={20} />,   color: 'green' },
      { label: 'Open Messages',     value: 9,      change: '-2',  icon: <MessageSquare size={20} />, color: 'blue' },
      { label: 'Rejected',          value: 1,      change: '0',   icon: <AlertCircle size={20} />,   color: 'red' },
    ],
    quickActions: [
      { icon: <ClipboardList size={20} />, label: 'Approve Houses',       href: '/admin/manager/houses' },
      { icon: <Calendar size={20} />,      label: 'Workflows & Requests', href: '/admin/workflows' },
      { icon: <MessageSquare size={20} />, label: 'Messages',             href: '/admin/manager/messages' },
      { icon: <BarChart size={20} />,      label: 'Reports',              href: '/admin/reports/transactions' },
      ...COMMON_ACTIONS,
    ],
    announcements: COMMON_ANNOUNCEMENTS,
  },
  accountant: {
    welcome: 'Welcome, Accountant!',
    description: 'Handle financial records, payments, and reports',
    stats: [
      { label: 'Revenue (MTD)',    value: 'ETB 125,450', change: '+12%', icon: <TrendingUp size={20} />, color: 'green' },
      { label: 'Pending',          value: 24,            change: '-5%',  icon: <AlertCircle size={20} />, color: 'yellow' },
      { label: 'Reports Filed',    value: 156,           change: '+8%',  icon: <CheckCircle size={20} />, color: 'blue' },
      { label: 'Overdue',          value: 7,             change: '-3%',  icon: <UserX size={20} />,       color: 'red' },
    ],
    quickActions: [
      { icon: <FileText size={20} />,    label: 'Financial Reports', href: '/admin/reports/transactions' },
      { icon: <PieChart size={20} />,    label: 'Budget Analysis',   href: '/accountant/budget' },
      { icon: <DollarSign size={20} />,  label: 'Transactions',      href: '/admin/transactions/complete' },
      { icon: <TrendingUp size={20} />,  label: 'Calculator',        href: '/admin/calculator' },
      ...COMMON_ACTIONS,
    ],
    announcements: COMMON_ANNOUNCEMENTS,
  },
  agent: {
    welcome: 'Welcome, Agent!',
    description: 'Manage listings, orders, and client communication',
    stats: [
      { label: 'My Listings',    value: 18,     change: '+3', icon: <Home size={20} />,           color: 'blue' },
      { label: 'Open Orders',    value: 7,      change: '+2', icon: <ClipboardList size={20} />,  color: 'yellow' },
      { label: 'Completed',      value: 42,     change: '+5', icon: <CheckCircle size={20} />,    color: 'green' },
      { label: 'Commission',     value: 'ETB 22,400', change: '+9%', icon: <DollarSign size={20} />, color: 'purple' },
    ],
    quickActions: [
      { icon: <Home size={20} />,          label: 'My Houses',            href: '/admin/houses' },
      { icon: <Calendar size={20} />,      label: 'Workflows & Requests', href: '/admin/workflows' },
      { icon: <ClipboardList size={20} />, label: 'Orders',               href: '/admin/manager/orders' },
      { icon: <DollarSign size={20} />,    label: 'Transactions',         href: '/admin/transactions/complete' },
      { icon: <MessageSquare size={20} />, label: 'Messages',             href: '/admin/manager/messages' },
      ...COMMON_ACTIONS,
    ],
    announcements: COMMON_ANNOUNCEMENTS,
  },
  customer: {
    welcome: 'Welcome!',
    description: 'Browse houses, track your orders and payments',
    stats: [
      { label: 'My Orders',        value: 3,     change: '+1', icon: <ClipboardList size={20} />, color: 'blue' },
      { label: 'Payments Made',    value: 5,     change: '+2', icon: <DollarSign size={20} />,    color: 'green' },
      { label: 'Pending Payment',  value: 1,     change: '0',  icon: <AlertCircle size={20} />,   color: 'yellow' },
      { label: 'Saved Listings',   value: 8,     change: '+3', icon: <Home size={20} />,          color: 'purple' },
    ],
    quickActions: [
      { icon: <Home size={20} />,           label: 'Browse Houses',    href: '/public/houses' },
      { icon: <User size={20} />,           label: 'Customer Portal',  href: '/admin/customer' },
      { icon: <ClipboardList size={20} />,  label: 'My Orders',        href: '/admin/customer/orders' },
      { icon: <DollarSign size={20} />,     label: 'My Payments',      href: '/admin/customer/payments' },
      ...COMMON_ACTIONS,
    ],
    announcements: COMMON_ANNOUNCEMENTS,
  },
  user: {
    welcome: 'Welcome!',
    description: 'Browse houses and manage your account',
    stats: [
      { label: 'Browsed Today',    value: 12,    change: '+4', icon: <Home size={20} />,         color: 'blue' },
      { label: 'My Orders',        value: 1,     change: '0',  icon: <ClipboardList size={20} />, color: 'yellow' },
      { label: 'Saved',            value: 3,     change: '+1', icon: <CheckCircle size={20} />,  color: 'green' },
      { label: 'Payments',         value: 0,     change: '0',  icon: <DollarSign size={20} />,   color: 'purple' },
    ],
    quickActions: [
      { icon: <Home size={20} />,          label: 'Browse Houses',    href: '/public/houses' },
      { icon: <User size={20} />,          label: 'Customer Portal',  href: '/admin/customer' },
      { icon: <ClipboardList size={20} />, label: 'My Orders',        href: '/admin/customer/orders' },
      ...COMMON_ACTIONS,
    ],
    announcements: COMMON_ANNOUNCEMENTS,
  },
};

// ─── Component ─────────────────────────────────────────────────────
export default function Dashboard() {
  const { theme } = useTheme();
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const [statsData, setStatsData] = useState<DashboardStats | null>(null);
  const [recentUsers, setRecentUsers] = useState<DashboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const userRole: Role = (user?.role as Role) || 'user';

  // Guard: redirect if not logged in
  useEffect(() => {
    if (!isLoading && !user) router.push('/');
  }, [user, isLoading, router]);

  // Fetch admin-only dashboard data
  useEffect(() => {
    if (!user) return;

    if (user.role !== 'admin') {
      // Non-admin roles use static content — no fetch needed.
      setLoading(false);
      return;
    }

    const fetchAdminData = async () => {
      try {
        setLoading(true);
        const res = await api.get('/user?limit=1000');
        const allUsers: DashboardUser[] = res.data.data.users || [];

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const totalUsers = allUsers.length;
        const activeUsers = allUsers.filter((u) => u.isActive).length;
        const inactiveUsers = totalUsers - activeUsers;
        const newUsersToday = allUsers.filter(
          (u) => new Date(u.createdAt) >= today
        ).length;

        const usersByRole = allUsers.reduce(
          (acc: { role: string; count: number }[], u) => {
            const existing = acc.find((item) => item.role === u.role);
            if (existing) existing.count++;
            else acc.push({ role: u.role, count: 1 });
            return acc;
          },
          []
        );

        const recent = [...allUsers]
          .sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
          .slice(0, 5);

        setStatsData({
          totalUsers,
          activeUsers,
          inactiveUsers,
          newUsersToday,
          usersByRole,
        });
        setRecentUsers(recent);
        setError('');
      } catch (err: any) {
        console.error('Dashboard error:', err);
        setError('Failed to fetch dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, [user]);

  // Content for the current role
  const content: RoleContent = useMemo(
    () => ROLE_CONTENT[userRole] ?? ROLE_CONTENT.user,
    [userRole]
  );

  // ─── Styling helpers ─────────────────────────────────────────────
  const themeStyles = {
    background:
      theme === 'dark'
        ? 'linear-gradient(135deg, #0a192f, #112240)'
        : 'linear-gradient(135deg, #f0f0f0, #ffffff)',
    textColor: theme === 'dark' ? '#ccd6f6' : '#333333',
    primaryColor: theme === 'dark' ? '#00ffff' : '#007bff',
    modalBackground: theme === 'dark' ? '#112240' : '#ffffff',
    borderColor: theme === 'dark' ? '#2d3748' : '#e2e8f0',
    subtleBg: theme === 'dark' ? '#1a202c' : '#f8f9fa',
  };

  const colorMap: Record<StatColor, { bg: string; fg: string }> = {
    green:  { bg: theme === 'dark' ? 'rgba(16,185,129,0.15)' : 'rgba(16,185,129,0.1)',  fg: '#10b981' },
    blue:   { bg: theme === 'dark' ? 'rgba(59,130,246,0.15)' : 'rgba(59,130,246,0.1)',  fg: '#3b82f6' },
    yellow: { bg: theme === 'dark' ? 'rgba(245,158,11,0.15)' : 'rgba(245,158,11,0.1)',  fg: '#f59e0b' },
    red:    { bg: theme === 'dark' ? 'rgba(239,68,68,0.15)'  : 'rgba(239,68,68,0.1)',   fg: '#ef4444' },
    purple: { bg: theme === 'dark' ? 'rgba(139,92,246,0.15)' : 'rgba(139,92,246,0.1)',  fg: '#8b5cf6' },
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

  const formatTimeDifference = (date: Date): string => {
    const diffMs = Date.now() - date.getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 60) return `${mins} min${mins !== 1 ? 's' : ''} ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days !== 1 ? 's' : ''} ago`;
  };

  // ─── Loading / error states ──────────────────────────────────────
  if (isLoading || loading) {
    return (
      <div
        className="flex items-center justify-center h-screen"
        style={{ background: themeStyles.background }}
      >
        <div
          className="animate-spin rounded-full h-12 w-12 border-b-2"
          style={{ borderColor: themeStyles.primaryColor }}
        />
      </div>
    );
  }

  if (!user) {
    return (
      <div
        className="flex items-center justify-center h-screen"
        style={{
          background: themeStyles.background,
          color: themeStyles.textColor,
        }}
      >
        Please login to access dashboard
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="flex items-center justify-center h-screen"
        style={{
          background: themeStyles.background,
          color: themeStyles.textColor,
        }}
      >
        {error}
      </div>
    );
  }

  // ─── Render ──────────────────────────────────────────────────────
  return (
    <div
      className="min-h-screen p-4 md:p-6 transition-colors duration-300"
      style={{
        background: themeStyles.background,
        color: themeStyles.textColor,
      }}
    >
      {/* ── Welcome header ─────────────────────────────────────── */}
      <div className="mb-6 md:mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1
              className="text-2xl md:text-3xl font-bold"
              style={{ color: themeStyles.primaryColor }}
            >
              {content.welcome}
            </h1>
            <p className="mt-1" style={{ color: themeStyles.textColor }}>
              {content.description}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div
              className="flex items-center px-4 py-2 rounded-full"
              style={{
                background:
                  theme === 'dark'
                    ? 'rgba(0,255,255,0.1)'
                    : 'rgba(0,123,255,0.1)',
              }}
            >
              <Shield
                className="h-5 w-5 mr-2"
                style={{ color: themeStyles.primaryColor }}
              />
              <span
                className="text-sm font-medium capitalize"
                style={{ color: themeStyles.primaryColor }}
              >
                {userRole}
              </span>
            </div>
            <div>
              <span className="text-sm opacity-75">Logged in as:</span>
              <div className="font-medium">{user.name}</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Admin live stats ───────────────────────────────────── */}
      {userRole === 'admin' && statsData && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
          <Link href="/admin/users">
            <StatCard
              label="Total Users"
              value={statsData.totalUsers}
              icon={<Users size={24} />}
              color="blue"
              footer={
                <span
                  className="flex items-center"
                  style={{ color: '#10b981', fontWeight: 500 }}
                >
                  <TrendingUp className="h-4 w-4 mr-1" />
                  +{statsData.newUsersToday} today
                </span>
              }
              themeStyles={themeStyles}
              theme={theme}
              colorMap={colorMap}
            />
          </Link>

          <Link href="/admin/users?status=active">
            <StatCard
              label="Active Users"
              value={statsData.activeUsers}
              icon={<UserCheck size={24} />}
              color="green"
              footer={
                <span
                  className="flex items-center"
                  style={{ color: '#ef4444', fontWeight: 500 }}
                >
                  <UserX className="h-4 w-4 mr-1" />
                  {statsData.inactiveUsers} inactive
                </span>
              }
              themeStyles={themeStyles}
              theme={theme}
              colorMap={colorMap}
            />
          </Link>

          <Link href="/admin/menus">
            <StatCard
              label="Manage Menus"
              value="Open"
              icon={<Cog size={24} />}
              color="purple"
              footer={
                <span className="opacity-75">Configure sidebar & roles</span>
              }
              themeStyles={themeStyles}
              theme={theme}
              colorMap={colorMap}
            />
          </Link>

          <Link href="/admin/security">
            <StatCard
              label="Security"
              value="Open"
              icon={<ShieldCheck size={24} />}
              color="yellow"
              footer={<span className="opacity-75">Access & audit logs</span>}
              themeStyles={themeStyles}
              theme={theme}
              colorMap={colorMap}
            />
          </Link>
        </div>
      )}

      {/* ── Role-specific stats (non-admin) ─────────────────────── */}
      {userRole !== 'admin' && content.stats.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
          {content.stats.map((stat, i) => (
            <StatCard
              key={i}
              label={stat.label}
              value={stat.value}
              icon={stat.icon}
              color={stat.color}
              footer={
                stat.change ? (
                  <span
                    style={{
                      color: stat.change.startsWith('+')
                        ? '#10b981'
                        : stat.change.startsWith('-')
                        ? '#ef4444'
                        : '#6b7280',
                      fontWeight: 500,
                    }}
                  >
                    {stat.change}
                    <span className="opacity-75 ml-2">from last month</span>
                  </span>
                ) : null
              }
              themeStyles={themeStyles}
              theme={theme}
              colorMap={colorMap}
            />
          ))}
        </div>
      )}

      {/* ── Admin-only: recent users ─────────────────────────────── */}
      {userRole === 'admin' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div
            className="p-4 md:p-6 rounded-lg border shadow-sm"
            style={{
              background: themeStyles.modalBackground,
              borderColor: themeStyles.borderColor,
              color: themeStyles.textColor,
            }}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg md:text-xl font-bold">Recent Users</h2>
              <Link
                href="/admin/users"
                style={{ color: themeStyles.primaryColor }}
                className="hover:opacity-80 text-xs md:text-sm"
              >
                View all
              </Link>
            </div>

            <div className="space-y-3">
              {recentUsers.length === 0 ? (
                <p className="text-sm opacity-75">No users yet.</p>
              ) : (
                recentUsers.map((u) => (
                  <div
                    key={u._id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                    style={{
                      background: themeStyles.subtleBg,
                      borderColor: themeStyles.borderColor,
                    }}
                  >
                    <div className="flex items-center">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center mr-3"
                        style={{
                          background:
                            theme === 'dark'
                              ? 'rgba(0,255,255,0.1)'
                              : 'rgba(0,123,255,0.1)',
                        }}
                      >
                        <Users
                          className="h-5 w-5"
                          style={{ color: themeStyles.primaryColor }}
                        />
                      </div>
                      <div>
                        <div className="font-medium text-sm">{u.name}</div>
                        <div className="text-xs opacity-75">{u.email}</div>
                        <div className="flex items-center mt-1 gap-2">
                          <span
                            className="px-2 py-1 text-xs rounded-full"
                            style={{
                              background: u.isActive
                                ? 'rgba(16,185,129,0.1)'
                                : 'rgba(239,68,68,0.1)',
                              color: u.isActive ? '#10b981' : '#ef4444',
                            }}
                          >
                            {u.isActive ? 'Active' : 'Inactive'}
                          </span>
                          <span
                            className="px-2 py-1 text-xs rounded-full capitalize"
                            style={{
                              background: 'rgba(107,114,128,0.1)',
                              color: theme === 'dark' ? '#9ca3af' : '#4b5563',
                            }}
                          >
                            {u.role}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs opacity-75">
                        {formatTimeDifference(new Date(u.createdAt))}
                      </div>
                      <div className="text-xs opacity-75 mt-1">
                        {formatDate(u.createdAt)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div
            className="p-4 md:p-6 rounded-lg border shadow-sm"
            style={{
              background: themeStyles.modalBackground,
              borderColor: themeStyles.borderColor,
              color: themeStyles.textColor,
            }}
          >
            <h2 className="text-lg md:text-xl font-bold mb-4">
              Users by Role
            </h2>
            <div className="space-y-3">
              {(statsData?.usersByRole ?? []).map((r) => (
                <div
                  key={r.role}
                  className="flex items-center justify-between p-3 rounded-lg border"
                  style={{
                    background: themeStyles.subtleBg,
                    borderColor: themeStyles.borderColor,
                  }}
                >
                  <div className="flex items-center gap-2">
                    <Activity
                      className="h-4 w-4"
                      style={{ color: themeStyles.primaryColor }}
                    />
                    <span className="text-sm font-medium capitalize">
                      {r.role}
                    </span>
                  </div>
                  <span
                    className="px-2 py-1 rounded-full text-xs font-semibold"
                    style={{
                      background:
                        theme === 'dark'
                          ? 'rgba(0,255,255,0.1)'
                          : 'rgba(0,123,255,0.1)',
                      color: themeStyles.primaryColor,
                    }}
                  >
                    {r.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Quick actions + announcements ────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-2">
          <div
            className="p-4 md:p-6 rounded-lg border shadow-sm"
            style={{
              background: themeStyles.modalBackground,
              borderColor: themeStyles.borderColor,
              color: themeStyles.textColor,
            }}
          >
            <h2 className="text-lg md:text-xl font-bold mb-4">
              Quick Actions
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {content.quickActions.map((action, i) => (
                <Link key={i} href={action.href}>
                  <div
                    className="flex flex-col items-center justify-center p-4 border rounded-lg transition-all duration-300 hover:shadow-md cursor-pointer"
                    style={{
                      background: themeStyles.subtleBg,
                      borderColor: themeStyles.borderColor,
                      color: themeStyles.textColor,
                    }}
                  >
                    <div className="mb-2" style={{ color: themeStyles.primaryColor }}>
                      {action.icon}
                    </div>
                    <span className="text-sm font-medium text-center">
                      {action.label}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div>
          <div
            className="p-4 md:p-6 rounded-lg border shadow-sm"
            style={{
              background: themeStyles.modalBackground,
              borderColor: themeStyles.borderColor,
              color: themeStyles.textColor,
            }}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg md:text-xl font-bold">Announcements</h2>
              <Link
                href="/announcements"
                style={{ color: themeStyles.primaryColor }}
                className="hover:opacity-80 text-xs md:text-sm"
              >
                View all
              </Link>
            </div>
            <div className="space-y-4">
              {content.announcements.map((a, i) => (
                <div
                  key={i}
                  className="border-l-4 pl-4 py-2"
                  style={{ borderColor: themeStyles.primaryColor }}
                >
                  <div className="flex justify-between items-start">
                    <h3 className="font-medium text-sm">{a.title}</h3>
                    <span className="text-xs opacity-75">
                      {formatDate(a.date)}
                    </span>
                  </div>
                  <p className="text-sm opacity-75 mt-1">{a.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Recent activity ─────────────────────────────────────── */}
      <div className="mt-6">
        <div
          className="p-4 md:p-6 rounded-lg border shadow-sm"
          style={{
            background: themeStyles.modalBackground,
            borderColor: themeStyles.borderColor,
            color: themeStyles.textColor,
          }}
        >
          <h2 className="text-lg md:text-xl font-bold mb-4">Recent Activity</h2>
          <div className="space-y-3">
            <div
              className="flex items-center p-3 rounded-lg border"
              style={{
                background: themeStyles.subtleBg,
                borderColor: themeStyles.borderColor,
              }}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center mr-3"
                style={{ background: 'rgba(16,185,129,0.1)' }}
              >
                <CheckCircle className="h-5 w-5" style={{ color: '#10b981' }} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">
                  Welcome to your dashboard
                </p>
                <p className="text-xs opacity-75">
                  Get started by exploring the quick actions above
                </p>
              </div>
              <span className="text-xs opacity-75">Just now</span>
            </div>

            <div
              className="flex items-center p-3 rounded-lg border"
              style={{
                background: themeStyles.subtleBg,
                borderColor: themeStyles.borderColor,
              }}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center mr-3"
                style={{ background: 'rgba(0,123,255,0.1)' }}
              >
                <Settings
                  className="h-5 w-5"
                  style={{ color: themeStyles.primaryColor }}
                />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Complete your profile</p>
                <p className="text-xs opacity-75">
                  Update your personal information in profile settings
                </p>
              </div>
              <span className="text-xs opacity-75">2 hours ago</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-component: StatCard ───────────────────────────────────────
function StatCard({
  label,
  value,
  icon,
  color,
  footer,
  themeStyles,
  theme,
  colorMap,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: StatColor;
  footer?: React.ReactNode;
  themeStyles: {
    modalBackground: string;
    borderColor: string;
    textColor: string;
    primaryColor: string;
  };
  theme: string;
  colorMap: Record<StatColor, { bg: string; fg: string }>;
}) {
  const c = colorMap[color];
  return (
    <div
      className="p-4 md:p-6 rounded-lg border shadow-sm transition-all duration-300 hover:shadow-md cursor-pointer"
      style={{
        background: themeStyles.modalBackground,
        borderColor: themeStyles.borderColor,
        color: themeStyles.textColor,
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div
            className="p-2 md:p-3 rounded-full mr-3 md:mr-4"
            style={{ background: c.bg }}
          >
            <div style={{ color: c.fg }}>{icon}</div>
          </div>
          <div>
            <p className="text-xs md:text-sm opacity-75">{label}</p>
            <p className="text-xl md:text-2xl font-bold">{value}</p>
          </div>
        </div>
        <ArrowRight className="h-4 w-4 md:h-5 md:w-5 opacity-50" />
      </div>
      {footer && (
        <div className="mt-3 md:mt-4 flex items-center text-xs md:text-sm">
          {footer}
        </div>
      )}
    </div>
  );
}