/**
 * Layout Component for Venue App
 * Provides consistent navigation and layout structure
 */

import React from 'react';
import { VenueNavigation } from './VenueNavigation';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <VenueNavigation />
      <main className="max-w-7xl mx-auto p-8">
        {children}
      </main>
    </div>
  );
}
