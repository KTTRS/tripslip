/**
 * Layout Component for Teacher App
 * Provides consistent navigation and layout structure
 */

import React from 'react';
import { Navigation } from '@tripslip/auth';
import { useAuth } from '../contexts/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { teacher, signOut, activeRole } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation
        activeRole={activeRole}
        userName={teacher ? `${teacher.first_name} ${teacher.last_name}` : undefined}
        onSignOut={signOut}
        appName="TripSlip Teacher"
      />
      <main className="max-w-7xl mx-auto p-8">
        {children}
      </main>
    </div>
  );
}
