'use client';

import React from 'react';
import AdminFeedbackManager from '@/components/feedback/AdminFeedbackManager';

export default function AdminFeedbackPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a192f] text-gray-900 dark:text-white transition-colors duration-200">
      <div className="container mx-auto px-4 py-8">
        <AdminFeedbackManager />
      </div>
    </div>
  );
}