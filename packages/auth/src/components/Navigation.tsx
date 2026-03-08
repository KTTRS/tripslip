import React, { useState } from 'react';
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
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', path: '/', roles: ['teacher'], icon: '/images/icon-tracking.png' },
  { label: 'Trips', path: '/trips', roles: ['teacher'], icon: '/images/icon-bus.png' },
  { label: 'Venues', path: '/venues/search', roles: ['teacher'], icon: '/images/icon-venue.png' },
  { label: 'Students', path: '/students', roles: ['teacher'], icon: '/images/icon-team.png' },
  { label: 'Profile', path: '/profile', roles: ['teacher'], icon: '/images/icon-pencil.png' },

  { label: 'Dashboard', path: '/', roles: ['school_admin'], icon: '/images/icon-tracking.png' },
  { label: 'Approvals', path: '/approvals', roles: ['school_admin'], icon: '/images/icon-shield.png' },
  { label: 'Teachers', path: '/teachers', roles: ['school_admin'], icon: '/images/icon-team.png' },

  { label: 'Dashboard', path: '/', roles: ['district_admin'], icon: '/images/icon-tracking.png' },
  { label: 'District Overview', path: '/district-admin', roles: ['district_admin'], icon: '/images/icon-graduation.png' },

  { label: 'Dashboard', path: '/', roles: ['tripslip_admin'], icon: '/images/icon-tracking.png' },
  { label: 'Admin Panel', path: '/tripslip-admin', roles: ['tripslip_admin'], icon: '/images/icon-shield.png' },

  { label: 'Dashboard', path: '/dashboard', roles: ['venue_admin'], icon: '/images/icon-tracking.png' },
  { label: 'Experiences', path: '/experiences', roles: ['venue_admin'], icon: '/images/icon-magic.png' },
  { label: 'Bookings', path: '/bookings', roles: ['venue_admin'], icon: '/images/icon-calendar.png' },
  { label: 'Financials', path: '/financials', roles: ['venue_admin'], icon: '/images/icon-payment.png' },
  { label: 'Team', path: '/employees', roles: ['venue_admin'], icon: '/images/icon-team.png' },
];

const ROLE_CHARACTERS: Record<string, { image: string; name: string }> = {
  teacher: { image: '/images/char-blue-square.png', name: 'Buddy' },
  school_admin: { image: '/images/char-purple-diamond.png', name: 'Gem' },
  district_admin: { image: '/images/char-purple-diamond.png', name: 'Gem' },
  tripslip_admin: { image: '/images/char-yellow-star.png', name: 'Sunny' },
  venue_admin: { image: '/images/char-green-octagon.png', name: 'Scout' },
};

function getNavItemsForRole(role: UserRole | undefined): NavItem[] {
  if (!role) return [];
  return NAV_ITEMS.filter(item => item.roles.includes(role));
}

export function Navigation({ activeRole, userName, onSignOut, appName }: NavigationProps) {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navItems = getNavItemsForRole(activeRole?.role_name);
  const character = activeRole?.role_name ? ROLE_CHARACTERS[activeRole.role_name] : null;

  return (
    <nav className="sticky top-0 z-50 bg-white border-b-3 border-black shadow-[0_4px_0px_#0A0A0A]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-3">
            <img src="/images/tripslip-logo.png" alt={appName || 'TripSlip'} className="h-10 w-auto object-contain" />
            {character && (
              <div className="hidden lg:block relative ml-1">
                <img
                  src={character.image}
                  alt={character.name}
                  className="w-8 h-8 object-contain drop-shadow-md"
                  style={{ animation: 'navCharBounce 3s ease-in-out infinite' }}
                />
              </div>
            )}
          </div>

          <div className="hidden md:flex items-center space-x-1.5">
            {navItems.map((item) => {
              const isActive = item.path === '/' || item.path === '/dashboard'
                ? location.pathname === item.path || location.pathname === '/dashboard'
                : location.pathname.startsWith(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`group flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold transition-all duration-200 ${
                    isActive
                      ? 'bg-primary text-black border-2 border-black shadow-[3px_3px_0px_#0A0A0A] -translate-x-0.5 -translate-y-0.5'
                      : 'text-gray-700 hover:text-black hover:-translate-x-0.5 hover:-translate-y-0.5 border-2 border-transparent hover:border-black hover:bg-primary/10 hover:shadow-[3px_3px_0px_#0A0A0A]'
                  }`}
                >
                  <img src={item.icon} alt="" className="w-8 h-8 object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.25)]" />
                  {item.label}
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-3">
            <RoleSwitcher />
            {userName && (
              <span className="text-sm text-gray-600 hidden sm:inline font-semibold">
                {userName}
              </span>
            )}
            <Button onClick={onSignOut} variant="outline" size="sm" className="rounded-xl border-2 border-black font-bold hover:bg-gray-100 hover:shadow-[3px_3px_0px_#0A0A0A] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all duration-200 shadow-[2px_2px_0px_#0A0A0A]">
              Sign Out
            </Button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden w-10 h-10 rounded-xl border-2 border-black bg-primary/10 flex items-center justify-center shadow-[2px_2px_0px_#0A0A0A] hover:shadow-[3px_3px_0px_#0A0A0A] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all duration-200"
              aria-label="Toggle menu"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden pb-4 pt-2 space-y-1.5 border-t-2 border-black/10">
            {character && (
              <div className="flex items-center gap-2 px-3 py-2 mb-2">
                <img
                  src={character.image}
                  alt={character.name}
                  className="w-8 h-8 object-contain drop-shadow-md"
                  style={{ animation: 'navCharBounce 3s ease-in-out infinite' }}
                />
                <span className="text-xs font-bold text-gray-500">Hi there! 👋</span>
              </div>
            )}
            {navItems.map((item) => {
              const isActive = item.path === '/' || item.path === '/dashboard'
                ? location.pathname === item.path || location.pathname === '/dashboard'
                : location.pathname.startsWith(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
                    isActive
                      ? 'bg-primary text-black border-2 border-black shadow-[3px_3px_0px_#0A0A0A] -translate-x-0.5'
                      : 'text-gray-700 hover:bg-primary/10 border-2 border-transparent hover:border-black active:shadow-[2px_2px_0px_#0A0A0A]'
                  }`}
                >
                  <img src={item.icon} alt="" className="w-10 h-10 object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.25)]" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        @keyframes navCharBounce {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          25% { transform: translateY(-3px) rotate(-5deg); }
          75% { transform: translateY(-1px) rotate(3deg); }
        }
      `}</style>
    </nav>
  );
}
