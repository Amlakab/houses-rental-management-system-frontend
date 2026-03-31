'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { 
  Users, UserPlus, UserCheck, UserX, 
  GraduationCap, School, Building, MapPin,
  TrendingUp, TrendingDown, ArrowRight,
  Calendar, Clock, Filter, Home, Settings,
  Briefcase, Target, Award, PieChart,
  FileText, BarChart, Shield, Globe,
  MessageSquare, Bell, HelpCircle,
  CheckCircle, XCircle, AlertCircle,
  Video,
  DollarSign,
  Book,
  Music
} from 'lucide-react';
import Link from 'next/link';
import api from '@/app/utils/api';
import { useTheme } from '@/lib/theme-context';

// Updated Interface definitions
interface Student {
  _id: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  phone: string;
  email: string;
  gender: 'male' | 'female';
  college: string;
  department: string;
  region: string;
  zone?: string;
  wereda?: string;
  church?: string;
  authority?: string;
  job?: string;
  dateOfBirth?: string;
  emergencyContact?: string;
  block?: string;
  dorm?: string;
  photo?: string;
  numberOfJob: number;
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
}

interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  background?: string;
  studentId: string;
  role:
    | 'user'
    | 'disk-user'
    | 'spinner-user'
    | 'accountant'
    | 'admin'
    | 'Abalat-Guday'
    | 'Mezmur'
    | 'Timhrt'
    | 'Muyana-Terado'
    | 'Priesedant'
    | 'Vice-Priesedant'
    | 'Secretary'
    | 'Bachna-Department'
    | 'Audite'
    | 'Limat';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  usersWithJobs: number;
  newUsersToday: number;
  userGrowth: number;
  usersByRole: { role: string; count: number }[];
}

export default function Dashboard() {
  const { theme } = useTheme();
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [statsData, setStatsData] = useState<DashboardStats | null>(null);
  const [recentUsers, setRecentUsers] = useState<User[]>([]);
  const [recentStudents, setRecentStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Only admin can fetch user and student lists
      if (user?.role === 'admin') {
        const [usersRes] = await Promise.all([
          api.get('/user?limit=1000'),
        ]);

        const allUsers: User[] = usersRes.data.data.users || [];

        // Get today's date
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Calculate stats
        const totalUsers = allUsers.length;
        const activeUsers = allUsers.filter(u => u.isActive).length;
        const inactiveUsers = totalUsers - activeUsers;
        
  
        // Count new users today
        const newUsersToday = allUsers.filter(u => 
          new Date(u.createdAt) >= today
        ).length;

        // Count new students today


        // Group users by role
        const usersByRole = allUsers.reduce((acc: { role: string; count: number }[], user) => {
          const existing = acc.find(item => item.role === user.role);
          if (existing) {
            existing.count++;
          } else {
            acc.push({ role: user.role, count: 1 });
          }
          return acc;
        }, []);

     

        // Get 5 most recent users
        const recentUsersList = [...allUsers]
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 5);

     

        // Simple growth calculation
        const userGrowth = calculateGrowth(allUsers.length, 100);

        setStatsData({
          totalUsers,
          activeUsers,
          inactiveUsers,
          usersWithJobs: 0, // Placeholder
          newUsersToday,
          userGrowth,
          usersByRole,
        });

        setRecentUsers(recentUsersList);
      }
      
      setError('');
    } catch (error: any) {
      setError('Failed to fetch dashboard data');
      console.error('Dashboard error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to calculate growth percentage
  const calculateGrowth = (current: number, previous: number): number => {
    if (previous === 0) return 0;
    return Number(((current - previous) / previous * 100).toFixed(1));
  };

  // Helper function to format time difference
  const formatTimeDifference = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) {
      return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    }
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get role-specific welcome message
  const getWelcomeMessage = () => {
    switch(user?.role) {
      case 'admin':
        return 'Welcome, System Administrator!';
      case 'accountant':
        return 'Welcome, Accountant!';
      case 'Abalat-Guday':
        return 'Welcome, Abalat Guday!';
      case 'Mezmur':
        return 'Welcome, Mezmur!';
      case 'Timhrt':
        return 'Welcome, Timhrt Leader!';
      case 'Muyana-Terado':
        return 'Welcome, Muyana Terado!';
      case 'Priesedant':
        return 'Welcome, President!';
      case 'Vice-Priesedant':
        return 'Welcome, Vice President!';
      case 'Secretary':
        return 'Welcome, Secretary!';
      case 'Bachna-Department':
        return 'Welcome, Bachna Department Head!';
      case 'Audite':
        return 'Welcome, Audite!';
      case 'Limat':
        return 'Welcome, Limat!';
      default:
        return 'Welcome to the Dashboard!';
    }
  };

  // Get role-specific description
  const getRoleDescription = () => {
    switch(user?.role) {
      case 'admin':
        return 'Manage users, students, and system settings';
      case 'accountant':
        return 'Handle financial records and transactions';
      case 'Abalat-Guday':
        return 'Oversee spiritual guidance and counseling';
      case 'Mezmur':
        return 'Coordinate music and worship activities';
      case 'Timhrt':
        return 'Lead teaching and educational programs';
      case 'Muyana-Terado':
        return 'Manage land and property affairs';
      case 'Priesedant':
        return 'Provide leadership and direction';
      case 'Vice-Priesedant':
        return 'Support presidential activities';
      case 'Secretary':
        return 'Handle documentation and records';
      case 'Bachna-Department':
        return 'Manage department operations';
      case 'Audite':
        return 'Conduct audits and reviews';
      case 'Limat':
        return 'Organize events and gatherings';
      default:
        return 'Access your assigned tasks and information';
    }
  };

  // Get role-specific quick actions
  const getQuickActions = () => {
    const commonActions = [
      { icon: <Settings />, label: 'Profile Settings', href: '/profile' },
      { icon: <MessageSquare />, label: 'Messages', href: '/messages' },
      { icon: <Bell />, label: 'Notifications', href: '/notifications' },
      { icon: <HelpCircle />, label: 'Help & Support', href: '/help' }
    ];

    const roleActions: Record<string, any[]> = {
      'admin': [
        { icon: <Users />, label: 'Manage Users', href: '/admin/users' },
        { icon: <GraduationCap />, label: 'Manage Students', href: '/admin/students' },
        { icon: <Briefcase />, label: 'Job Assignments', href: '/admin/jobs' },
        { icon: <BarChart />, label: 'System Analytics', href: '/admin/analytics' }
      ],
      'accountant': [
        { icon: <FileText />, label: 'Financial Reports', href: '/accountant/reports' },
        { icon: <PieChart />, label: 'Budget Analysis', href: '/accountant/budget' },
        { icon: <DollarSign />, label: 'Transactions', href: '/accountant/transactions' },
        { icon: <TrendingUp />, label: 'Revenue Dashboard', href: '/accountant/revenue' }
      ],
      'Abalat-Guday': [
        { icon: <Users />, label: 'Spiritual Guidance', href: '/spiritual/guidance' },
        { icon: <MessageSquare />, label: 'Counseling Sessions', href: '/spiritual/counseling' },
        { icon: <Book />, label: 'Religious Studies', href: '/spiritual/studies' },
        { icon: <Calendar />, label: 'Events Schedule', href: '/spiritual/events' }
      ],
      'Mezmur': [
        { icon: <Music />, label: 'Song Library', href: '/music/library' },
        { icon: <Users />, label: 'Choir Members', href: '/music/choir' },
        { icon: <Calendar />, label: 'Practice Schedule', href: '/music/practice' },
        { icon: <Video />, label: 'Recordings', href: '/music/recordings' }
      ], 
      'Timhrt': [
        { icon: <Award />, label: 'Teaching Materials', href: '/teaching/materials' },
        { icon: <Users />, label: 'Students List', href: '/teaching/students' },
        { icon: <Calendar />, label: 'Class Schedule', href: '/teaching/schedule' },
        { icon: <Award />, label: 'Progress Reports', href: '/teaching/reports' }
      ]
    };

    return [...(roleActions[user?.role || ''] || []), ...commonActions].slice(0, 6);
  };

  // Get role-specific announcements
  const getAnnouncements = () => {
    const commonAnnouncements = [
      { title: 'System Maintenance', description: 'Regular maintenance scheduled for this weekend', date: '2024-01-15', type: 'info' },
      { title: 'Training Session', description: 'New feature training next Monday', date: '2024-01-16', type: 'success' },
      { title: 'Policy Update', description: 'Updated privacy policy now available', date: '2024-01-14', type: 'warning' }
    ];

    return commonAnnouncements;
  };

  // Get role-specific stats (for non-admin roles)
  const getRoleStats = () => {
    switch(user?.role) {
      case 'accountant':
        return [
          { label: 'Total Revenue', value: 'ETB 125,450', change: '+12%', icon: <TrendingUp />, color: 'green' },
          { label: 'Pending Approvals', value: '24', change: '-5%', icon: <Clock />, color: 'yellow' },
          { label: 'Completed Reports', value: '156', change: '+8%', icon: <CheckCircle />, color: 'blue' },
          { label: 'Overdue Payments', value: '7', change: '-3%', icon: <AlertCircle />, color: 'red' }
        ];
      case 'Abalat-Guday':
        return [
          { label: 'Active Members', value: '342', change: '+5%', icon: <Users />, color: 'green' },
          { label: 'Sessions This Week', value: '18', change: '+3%', icon: <Calendar />, color: 'blue' },
          { label: 'Upcoming Events', value: '7', change: '+2', icon: <Bell />, color: 'yellow' },
          { label: 'New Members', value: '12', change: '+8%', icon: <UserPlus />, color: 'purple' }
        ];
      case 'Mezmur':
        return [
          { label: 'Choir Members', value: '45', change: '+2', icon: <Users />, color: 'green' },
          { label: 'Songs in Library', value: '256', change: '+15', icon: <Music />, color: 'blue' },
          { label: 'Upcoming Practices', value: '3', change: '+1', icon: <Calendar />, color: 'yellow' },
          { label: 'Recordings', value: '89', change: '+12', icon: <Video />, color: 'purple' }
        ];
      default:
        return [
          { label: 'Assigned Tasks', value: '12', change: '+3', icon: <CheckCircle />, color: 'blue' },
          { label: 'Completed', value: '8', change: '+2', icon: <Award />, color: 'green' },
          { label: 'Pending', value: '3', change: '-1', icon: <Clock />, color: 'yellow' },
          { label: 'Overdue', value: '1', change: '0', icon: <AlertCircle />, color: 'red' }
        ];
    }
  };

  // Theme-based styles
  const themeStyles = {
    background: theme === 'dark'
      ? 'linear-gradient(135deg, #0a192f, #112240)'
      : 'linear-gradient(135deg, #f0f0f0, #ffffff)',
    textColor: theme === 'dark' ? '#ccd6f6' : '#333333',
    primaryColor: theme === 'dark' ? '#00ffff' : '#007bff',
    secondaryColor: theme === 'dark' ? '#00b3b3' : '#0056b3',
    modalBackground: theme === 'dark' ? '#112240' : '#ffffff',
    modalText: theme === 'dark' ? '#ccd6f6' : '#333333',
    inputBackground: theme === 'dark' ? '#0a192f' : '#f8f9fa',
    inputBorder: theme === 'dark' ? '1px solid #00ffff' : '1px solid #007bff',
  };

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ background: themeStyles.background }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: themeStyles.primaryColor }}></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ background: themeStyles.background, color: themeStyles.textColor }}>
        <div>Please login to access dashboard</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ background: themeStyles.background, color: themeStyles.textColor }}>
        <div>{error}</div>
      </div>
    );
  }

  const quickActions = getQuickActions();
  const announcements = getAnnouncements();
  const roleStats = getRoleStats();

  return (
    <div className="min-h-screen p-4 md:p-6 transition-colors duration-300" style={{ background: themeStyles.background, color: themeStyles.textColor }}>
      {/* Welcome Header */}
      <div className="mb-6 md:mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold" style={{ color: themeStyles.primaryColor }}>
              {getWelcomeMessage()}
            </h1>
            <p className="mt-1" style={{ color: themeStyles.textColor }}>
              {getRoleDescription()}
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex items-center">
            <div className="flex items-center px-4 py-2 rounded-full" style={{ background: theme === 'dark' ? 'rgba(0, 255, 255, 0.1)' : 'rgba(0, 123, 255, 0.1)' }}>
              <Shield className="h-5 w-5 mr-2" style={{ color: themeStyles.primaryColor }} />
              <span className="text-sm font-medium" style={{ color: themeStyles.primaryColor }}>
                {user?.role}
              </span>
            </div>
            <div className="ml-4">
              <span className="text-sm opacity-75">Logged in as:</span>
              <div className="font-medium">{user?.name}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Role-specific stats for non-admin roles */}
      {user?.role !== 'admin' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
          {roleStats.map((stat, index) => (
            <div key={index} className="p-4 md:p-6 rounded-lg border shadow-sm" style={{ 
              background: themeStyles.modalBackground, 
              borderColor: theme === 'dark' ? '#2d3748' : '#e2e8f0',
              color: themeStyles.textColor 
            }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm opacity-75">{stat.label}</p>
                  <p className="text-xl md:text-2xl font-bold mt-1">{stat.value}</p>
                </div>
                <div className="p-3 rounded-full" style={{ 
                  background: theme === 'dark' ? `${stat.color === 'green' ? '#064e3b' : stat.color === 'blue' ? '#1e3a8a' : stat.color === 'yellow' ? '#713f12' : stat.color === 'red' ? '#7f1d1d' : '#374151'}` : 
                  `${stat.color === 'green' ? '#d1fae5' : stat.color === 'blue' ? '#dbeafe' : stat.color === 'yellow' ? '#fef3c7' : stat.color === 'red' ? '#fee2e2' : '#f3f4f6'}`
                }}>
                  <div style={{ color: stat.color === 'green' ? '#10b981' : stat.color === 'blue' ? '#3b82f6' : stat.color === 'yellow' ? '#f59e0b' : stat.color === 'red' ? '#ef4444' : '#6b7280' }}>
                    {stat.icon}
                  </div>
                </div>
              </div>
              <div className="mt-3 flex items-center text-xs md:text-sm">
                <span style={{ 
                  color: stat.change.startsWith('+') ? '#10b981' : stat.change.startsWith('-') ? '#ef4444' : '#6b7280',
                  fontWeight: 500 
                }}>
                  {stat.change}
                </span>
                <span className="opacity-75 ml-1 md:ml-2">from last month</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Admin Dashboard */}
      {user?.role === 'admin' && statsData && (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
            {/* Total Users Card */}
            <Link href="/admin/users">
              <div className="p-4 md:p-6 rounded-lg border shadow-sm transition-all duration-300 hover:shadow-md cursor-pointer" style={{ 
                background: themeStyles.modalBackground, 
                borderColor: theme === 'dark' ? '#2d3748' : '#e2e8f0',
                color: themeStyles.textColor 
              }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="p-2 md:p-3 rounded-full mr-3 md:mr-4" style={{ 
                      background: theme === 'dark' ? 'rgba(0, 255, 255, 0.1)' : 'rgba(0, 123, 255, 0.1)' 
                    }}>
                      <Users className="h-4 w-4 md:h-6 md:w-6" style={{ color: themeStyles.primaryColor }} />
                    </div>
                    <div>
                      <p className="text-xs md:text-sm opacity-75">Total Users</p>
                      <p className="text-xl md:text-2xl font-bold">{statsData.totalUsers}</p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 md:h-5 md:w-5 opacity-50" />
                </div>
                <div className="mt-3 md:mt-4 flex items-center text-xs md:text-sm">
                  <span className="flex items-center" style={{ color: '#10b981', fontWeight: 500 }}>
                    <TrendingUp className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                    +{statsData.newUsersToday} today
                  </span>
                </div>
              </div>
            </Link>
            
            {/* Active Users Card */}
            <Link href="/admin/users?status=active">
              <div className="p-4 md:p-6 rounded-lg border shadow-sm transition-all duration-300 hover:shadow-md cursor-pointer" style={{ 
                background: themeStyles.modalBackground, 
                borderColor: theme === 'dark' ? '#2d3748' : '#e2e8f0',
                color: themeStyles.textColor 
              }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="p-2 md:p-3 rounded-full mr-3 md:mr-4" style={{ 
                      background: theme === 'dark' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.1)' 
                    }}>
                      <UserCheck className="h-4 w-4 md:h-6 md:w-6" style={{ color: '#10b981' }} />
                    </div>
                    <div>
                      <p className="text-xs md:text-sm opacity-75">Active Users</p>
                      <p className="text-xl md:text-2xl font-bold">{statsData.activeUsers}</p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 md:h-5 md:w-5 opacity-50" />
                </div>
                <div className="mt-3 md:mt-4 flex items-center text-xs md:text-sm">
                  <span className="flex items-center" style={{ color: '#ef4444', fontWeight: 500 }}>
                    <UserX className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                    {statsData.inactiveUsers} inactive
                  </span>
                </div>
              </div>
            </Link>
            
            {/* Total Students Card */}
            <Link href="/admin/students">
              <div className="p-4 md:p-6 rounded-lg border shadow-sm transition-all duration-300 hover:shadow-md cursor-pointer" style={{ 
                background: themeStyles.modalBackground, 
                borderColor: theme === 'dark' ? '#2d3748' : '#e2e8f0',
                color: themeStyles.textColor 
              }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="p-2 md:p-3 rounded-full mr-3 md:mr-4" style={{ 
                      background: theme === 'dark' ? 'rgba(139, 92, 246, 0.1)' : 'rgba(139, 92, 246, 0.1)' 
                    }}>
                      <GraduationCap className="h-4 w-4 md:h-6 md:w-6" style={{ color: '#8b5cf6' }} />
                    </div>
                    <div>
                      <p className="text-xs md:text-sm opacity-75">Total Students</p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 md:h-5 md:w-5 opacity-50" />
                </div>
              
              </div>
            </Link>
            
            {/* Students by College Card */}
            <Link href="/admin/students?view=colleges">
              <div className="p-4 md:p-6 rounded-lg border shadow-sm transition-all duration-300 hover:shadow-md cursor-pointer" style={{ 
                background: themeStyles.modalBackground, 
                borderColor: theme === 'dark' ? '#2d3748' : '#e2e8f0',
                color: themeStyles.textColor 
              }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="p-2 md:p-3 rounded-full mr-3 md:mr-4" style={{ 
                      background: theme === 'dark' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(245, 158, 11, 0.1)' 
                    }}>
                      <Building className="h-4 w-4 md:h-6 md:w-6" style={{ color: '#f59e0b' }} />
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 md:h-5 md:w-5 opacity-50" />
                </div>
              </div>
            </Link>
          </div>
          
          {/* Two Column Layout for Admin */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Users */}
            <div className="p-4 md:p-6 rounded-lg border shadow-sm" style={{ 
              background: themeStyles.modalBackground, 
              borderColor: theme === 'dark' ? '#2d3748' : '#e2e8f0',
              color: themeStyles.textColor 
            }}>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg md:text-xl font-bold">Recent Users</h2>
                <Link href="/admin/users" style={{ color: themeStyles.primaryColor }} className="hover:opacity-80 text-xs md:text-sm">
                  View all users
                </Link>
              </div>
              
              <div className="space-y-3">
                {recentUsers.map((user) => (
                  <div key={user._id} className="flex items-center justify-between p-3 rounded-lg border" style={{ 
                    background: theme === 'dark' ? '#1a202c' : '#f8f9fa',
                    borderColor: theme === 'dark' ? '#2d3748' : '#e2e8f0'
                  }}>
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center mr-3" style={{ 
                        background: theme === 'dark' ? 'rgba(0, 255, 255, 0.1)' : 'rgba(0, 123, 255, 0.1)' 
                      }}>
                        <Users className="h-5 w-5" style={{ color: themeStyles.primaryColor }} />
                      </div>
                      <div>
                        <div className="font-medium text-sm">{user.name}</div>
                        <div className="text-xs opacity-75">{user.email}</div>
                        <div className="flex items-center mt-1">
                          <span className="px-2 py-1 text-xs rounded-full" style={{ 
                            background: user.isActive ? 
                              (theme === 'dark' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.1)') : 
                              (theme === 'dark' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.1)'),
                            color: user.isActive ? '#10b981' : '#ef4444'
                          }}>
                            {user.isActive ? 'Active' : 'Inactive'}
                          </span>
                          <span className="ml-2 px-2 py-1 text-xs rounded-full" style={{ 
                            background: theme === 'dark' ? 'rgba(107, 114, 128, 0.1)' : 'rgba(107, 114, 128, 0.1)',
                            color: theme === 'dark' ? '#9ca3af' : '#4b5563'
                          }}>
                            {user.role}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs opacity-75">
                        {formatTimeDifference(new Date(user.createdAt))}
                      </div>
                      <div className="text-xs opacity-75 mt-1">
                        {formatDate(user.createdAt)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Students */}
            <div className="p-4 md:p-6 rounded-lg border shadow-sm" style={{ 
              background: themeStyles.modalBackground, 
              borderColor: theme === 'dark' ? '#2d3748' : '#e2e8f0',
              color: themeStyles.textColor 
            }}>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg md:text-xl font-bold">Recent Students</h2>
                <Link href="/admin/students" style={{ color: themeStyles.primaryColor }} className="hover:opacity-80 text-xs md:text-sm">
                  View all students
                </Link>
              </div>
              
              <div className="space-y-3">
                {recentStudents.map((student) => (
                  <div key={student._id} className="flex items-center justify-between p-3 rounded-lg border" style={{ 
                    background: theme === 'dark' ? '#1a202c' : '#f8f9fa',
                    borderColor: theme === 'dark' ? '#2d3748' : '#e2e8f0'
                  }}>
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center mr-3" style={{ 
                        background: theme === 'dark' ? 'rgba(139, 92, 246, 0.1)' : 'rgba(139, 92, 246, 0.1)' 
                      }}>
                        <GraduationCap className="h-5 w-5" style={{ color: '#8b5cf6' }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">
                          {student.firstName} {student.lastName}
                        </div>
                        <div className="text-xs opacity-75 truncate">{student.phone}</div>
                        <div className="flex items-center mt-1">
                          <span className="px-2 py-1 text-xs rounded-full truncate max-w-[120px]" style={{ 
                            background: theme === 'dark' ? 'rgba(0, 123, 255, 0.1)' : 'rgba(0, 123, 255, 0.1)',
                            color: themeStyles.primaryColor
                          }}>
                            {student.college}
                          </span>
                          <span className="ml-2 px-2 py-1 text-xs rounded-full" style={{ 
                            background: theme === 'dark' ? 'rgba(107, 114, 128, 0.1)' : 'rgba(107, 114, 128, 0.1)',
                            color: theme === 'dark' ? '#9ca3af' : '#4b5563'
                          }}>
                            {student.department}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs opacity-75">
                        {formatTimeDifference(new Date(student.createdAt))}
                      </div>
                      <div className="text-xs opacity-75 mt-1">
                        {formatDate(student.createdAt)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Common Content for All Roles */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Quick Actions */}
        <div className="lg:col-span-2">
          <div className="p-4 md:p-6 rounded-lg border shadow-sm" style={{ 
            background: themeStyles.modalBackground, 
            borderColor: theme === 'dark' ? '#2d3748' : '#e2e8f0',
            color: themeStyles.textColor 
          }}>
            <h2 className="text-lg md:text-xl font-bold mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {quickActions.map((action, index) => (
                <Link key={index} href={action.href}>
                  <div className="flex flex-col items-center justify-center p-4 border rounded-lg transition-all duration-300 cursor-pointer" style={{ 
                    background: theme === 'dark' ? '#1a202c' : '#ffffff',
                    borderColor: theme === 'dark' ? '#2d3748' : '#e2e8f0',
                    color: themeStyles.textColor,
                  }}>
                    <div className="mb-2" style={{ color: themeStyles.primaryColor }}>
                      {action.icon}
                    </div>
                    <span className="text-sm font-medium text-center">{action.label}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Announcements */}
        <div>
          <div className="p-4 md:p-6 rounded-lg border shadow-sm" style={{ 
            background: themeStyles.modalBackground, 
            borderColor: theme === 'dark' ? '#2d3748' : '#e2e8f0',
            color: themeStyles.textColor 
          }}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg md:text-xl font-bold">Announcements</h2>
              <Link href="/announcements" style={{ color: themeStyles.primaryColor }} className="hover:opacity-80 text-xs md:text-sm">
                View all
              </Link>
            </div>
            
            <div className="space-y-4">
              {announcements.map((announcement, index) => (
                <div key={index} className="border-l-4 pl-4 py-2" style={{ borderColor: themeStyles.primaryColor }}>
                  <div className="flex justify-between items-start">
                    <h3 className="font-medium text-sm">{announcement.title}</h3>
                    <span className="text-xs opacity-75">{formatDate(announcement.date)}</span>
                  </div>
                  <p className="text-sm opacity-75 mt-1">{announcement.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity for all roles */}
      <div className="mt-6">
        <div className="p-4 md:p-6 rounded-lg border shadow-sm" style={{ 
          background: themeStyles.modalBackground, 
          borderColor: theme === 'dark' ? '#2d3748' : '#e2e8f0',
          color: themeStyles.textColor 
        }}>
          <h2 className="text-lg md:text-xl font-bold mb-4">Recent Activity</h2>
          <div className="space-y-3">
            {/* Activity items would come from API based on role */}
            <div className="flex items-center p-3 rounded-lg border" style={{ 
              background: theme === 'dark' ? '#1a202c' : '#f8f9fa',
              borderColor: theme === 'dark' ? '#2d3748' : '#e2e8f0'
            }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center mr-3" style={{ 
                background: theme === 'dark' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.1)' 
              }}>
                <CheckCircle className="h-5 w-5" style={{ color: '#10b981' }} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Welcome to your dashboard</p>
                <p className="text-xs opacity-75">Get started by exploring the quick actions above</p>
              </div>
              <span className="text-xs opacity-75">Just now</span>
            </div>
            
            <div className="flex items-center p-3 rounded-lg border" style={{ 
              background: theme === 'dark' ? '#1a202c' : '#f8f9fa',
              borderColor: theme === 'dark' ? '#2d3748' : '#e2e8f0'
            }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center mr-3" style={{ 
                background: theme === 'dark' ? 'rgba(0, 123, 255, 0.1)' : 'rgba(0, 123, 255, 0.1)' 
              }}>
                <Settings className="h-5 w-5" style={{ color: themeStyles.primaryColor }} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Complete your profile</p>
                <p className="text-xs opacity-75">Update your personal information in profile settings</p>
              </div>
              <span className="text-xs opacity-75">2 hours ago</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}