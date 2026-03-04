import { useState } from 'react';
import { Link, useLocation } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@tripslip/ui/components/button';
import { 
  LayoutDashboard, 
  MapPin, 
  Calendar, 
  FileText, 
  DollarSign, 
  Users, 
  Menu, 
  X,
  LogOut,
  Settings
} from 'lucide-react';

export function VenueNavigation() {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      name: 'Experiences',
      href: '/experiences',
      icon: MapPin,
    },
    {
      name: 'Bookings',
      href: '/bookings',
      icon: Calendar,
    },
    {
      name: 'Trips',
      href: '/trips',
      icon: FileText,
    },
    {
      name: 'Financials',
      href: '/financials',
      icon: DollarSign,
    },
    {
      name: 'Employees',
      href: '/employees',
      icon: Users,
    },
  ];

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return location.pathname === '/' || location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(href);
  };

  return (
    <nav className="bg-white border-b-2 border-black shadow-[0_4px_0px_0px_rgba(10,10,10,1)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <Link to="/dashboard" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-[#F5C518] border-2 border-black rounded flex items-center justify-center">
                <MapPin className="h-5 w-5 text-black" />
              </div>
              <span className="text-xl font-bold font-['Fraunces']">TripSlip Venue</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`
                    flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors font-['Plus_Jakarta_Sans']
                    ${
                      isActive(item.href)
                        ? 'bg-[#F5C518] text-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(10,10,10,1)]'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-black border-2 border-transparent'
                    }
                  `}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {item.name}
                </Link>
              );
            })}
          </div>

          {/* User Menu */}
          <div className="hidden md:flex items-center space-x-4">
            <span className="text-sm text-gray-700 font-['Plus_Jakarta_Sans']">
              {user?.email}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={signOut}
              className="border-2 border-black hover:bg-gray-100 font-['Plus_Jakarta_Sans'] font-semibold"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="border-2 border-black"
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t-2 border-black bg-white">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`
                    flex items-center px-3 py-2 rounded-md text-base font-medium transition-colors font-['Plus_Jakarta_Sans']
                    ${
                      isActive(item.href)
                        ? 'bg-[#F5C518] text-black border-2 border-black'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-black'
                    }
                  `}
                >
                  <Icon className="h-5 w-5 mr-3" />
                  {item.name}
                </Link>
              );
            })}
          </div>
          
          {/* Mobile User Menu */}
          <div className="border-t-2 border-gray-200 pt-4 pb-3">
            <div className="px-4">
              <div className="text-base font-medium text-gray-800 font-['Plus_Jakarta_Sans']">
                {user?.email}
              </div>
            </div>
            <div className="mt-3 px-2">
              <Button
                variant="outline"
                onClick={signOut}
                className="w-full justify-start border-2 border-black hover:bg-gray-100 font-['Plus_Jakarta_Sans'] font-semibold"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}