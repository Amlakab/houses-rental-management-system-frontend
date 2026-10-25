'use client';

import React from 'react';
import SettingsView from '@/components/settings/SettingsView';

export default function AdminSettingsPage() {
  return (
    <div className="w-full">
      <SettingsView isAdminContext={true} />
    </div>
  );
}
