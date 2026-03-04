/**
 * Layout Component for School App
 * Provides consistent navigation and layout structure
 */

import React from 'react';
import { Navigation } from '@tripslip/auth';
import { useSchoolAuth } from '../contexts/SchoolAuthContext';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { user, signOut, activeRole } = useSchoolAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation
        activeRole={activeRole}
        userName={user?.email}
        onSignOut={signOut}
        appName="TripSlip School"
      />
      <main className="max-w-7xl mx-auto p-8">
        {children}
      </main>
    </div>
  );
}
