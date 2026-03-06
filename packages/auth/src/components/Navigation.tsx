/**
 * Role-Based Navigation Component
 * Displays navigation menu items based on the user's active role
 */

import React from 'react';
import { Link, useLocation } from 'react-router';
import { Button } from '@tripslip/ui';
import { RoleSwitcher } from './RoleSwitcher';
import type { UserRole, ActiveRoleContext } from '../types';

export interface NavigationProps {
  activeRole: ActiveRoleContext | null;
  userName?: string;
  onSignOut: () => void;
  appName?: string;
}

interface NavItem {
  label: string;
  path: string;
  roles: UserRole[];
}

/**
 * Navigation menu items for each role
 */
const NAV_ITEMS: NavItem[] = [
  // Teacher navigation
  { label: 'Dashboard', path: '/', roles: ['teacher'] },
  { label: 'Trips', path: '/trips', roles: ['teacher'] },
  { label: 'Students', path: '/students', roles: ['teacher'] },
  { label: 'Profile', path: '/profile', roles: ['teacher'] },
  
  // School Admin navigation
  { label: 'Dashboard', path: '/', roles: ['school_admin'] },
  { label: 'Approvals', path: '/approvals', roles: ['school_admin'] },
  { label: 'Teachers', path: '/teachers', roles: ['school_admin'] },
  { label: 'Trips', path: '/trips', roles: ['school_admin'] },
  { label: 'Students', path: '/students', roles: ['school_admin'] },
  { label: 'Settings', path: '/settings', roles: ['school_admin'] },
  
  // District Admin navigation
  { label: 'Dashboard', path: '/', roles: ['district_admin'] },
  { label: 'Schools', path: '/schools', roles: ['district_admin'] },
  { label: 'Reports', path: '/reports', roles: ['district_admin'] },
  { label: 'Settings', path: '/settings', roles: ['district_admin'] },
  
  // TripSlip Admin navigation
  { label: 'Dashboard', path: '/', roles: ['tripslip_admin'] },
  { label: 'Districts', path: '/districts', roles: ['tripslip_admin'] },
  { label: 'Schools', path: '/schools', roles: ['tripslip_admin'] },
  { label: 'Venues', path: '/venues', roles: ['tripslip_admin'] },
  { label: 'Users', path: '/users', roles: ['tripslip_admin'] },
  { label: 'Settings', path: '/settings', roles: ['tripslip_admin'] },
  
  // Venue Admin navigation
  { label: 'Dashboard', path: '/dashboard', roles: ['venue_admin'] },
  { label: 'Experiences', path: '/experiences', roles: ['venue_admin'] },
  { label: 'Bookings', path: '/trips', roles: ['venue_admin'] },
  { label: 'Settings', path: '/settings', roles: ['venue_admin'] },
];

/**
 * Get navigation items for a specific role
 */
function getNavItemsForRole(role: UserRole | undefined): NavItem[] {
  if (!role) return [];
  return NAV_ITEMS.filter(item => item.roles.includes(role));
}

/**
 * Navigation component
 */
export function Navigation({ activeRole, userName, onSignOut, appName }: NavigationProps) {
  const location = useLocation();
  const navItems = getNavItemsForRole(activeRole?.role_name);

  return (
    <nav className="bg-white border-b-2 border-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Brand */}
          <div className="flex items-center">
            <h1 className="text-xl font-bold font-display">
              {appName || 'TripSlip'}
            </h1>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-black text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-4">
            <RoleSwitcher />
            {userName && (
              <span className="text-sm text-gray-600 hidden sm:inline">
                {userName}
              </span>
            )}
            <Button onClick={onSignOut} variant="outline" size="sm">
              Sign Out
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden pb-3 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`block px-3 py-2 rounded-md text-sm font-medium ${
                  isActive
                    ? 'bg-black text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
