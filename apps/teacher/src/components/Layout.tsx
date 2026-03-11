import React from 'react';
import { Navigation } from '@tripslip/auth';
import { useAuth } from '../contexts/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { teacher, user, signOut, activeRole } = useAuth();

  const userName = teacher
    ? `${teacher.first_name} ${teacher.last_name}`.trim()
    : user?.email?.split('@')[0] || 'Teacher';

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation
        activeRole={activeRole}
        userName={userName}
        onSignOut={signOut}
        appName="TripSlip Teacher"
      />
      <main className="max-w-7xl mx-auto p-8">
        {children}
      </main>
    </div>
  );
}
