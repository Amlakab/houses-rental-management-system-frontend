// app/admin/layout.tsx
'use client';

import React, { useState, ReactNode, useEffect } from 'react';
import AdminHeader from '@/components/admin/AdminHeader';
import AdminSidebar from '@/components/admin/AdminSidebar';
import Footer from '@/components/ui/Footer';
import { useTheme } from '@/lib/theme-context';

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { theme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);           // mobile drawer
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false); // desktop collapse
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleSidebar = () => setSidebarOpen((v) => !v);
  const closeSidebar = () => setSidebarOpen(false);
  const toggleSidebarCollapse = () => setSidebarCollapsed((v) => !v);

  if (!mounted) return null;

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-300">
      {/* Header — sticky, no wrapper */}
      <AdminHeader
        onMenuClick={toggleSidebar}
        onSidebarToggle={toggleSidebarCollapse}
        isSidebarCollapsed={sidebarCollapsed}
      />

      {/* Flex row: sidebar + main. min-h-0 prevents overflow issues. */}
      <div className="flex flex-1 min-h-0">
        <AdminSidebar
          isOpen={sidebarOpen}
          onClose={closeSidebar}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={toggleSidebarCollapse}
        />

        <main
          className={`
            flex-1 min-w-0
            transition-colors duration-300
            ${theme === 'dark'
              ? 'bg-gradient-to-br from-[#0a192f] to-[#112240]'
              : 'bg-gradient-to-br from-[#f0f0f0] to-[#ffffff]'}
          `}
        >
          <div className="p-2 md:p-4">
            <div
              className={`
                rounded-xl shadow-lg transition-colors duration-300
                ${theme === 'dark'
                  ? 'bg-[#0f172a80] backdrop-blur-sm border border-[#00ffff]/20 text-white'
                  : 'bg-white border border-gray-200 text-gray-900'}
              `}
            >
              {children}
            </div>
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
}