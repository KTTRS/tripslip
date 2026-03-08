import { useState, useRef, useEffect } from 'react'
import { Button } from '@tripslip/ui'
import { getAppUrl } from '../utils/appUrls'

export default function Header() {
  const [showSignIn, setShowSignIn] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowSignIn(false);
      }
    }
    function handleScroll() {
      setScrolled(window.scrollY > 20);
    }
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <header className={`sticky top-0 z-50 border-b-2 border-black bg-white transition-shadow duration-300 ${scrolled ? 'shadow-md' : ''}`}>
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
        <a href="/" className="flex items-center">
          <img src="/images/tripslip-logo.png" alt="TripSlip" className="h-8 sm:h-10 w-auto object-contain" />
        </a>
        <div className="hidden md:flex items-center gap-8">
          <a href="/" className="text-gray-700 hover:text-black font-medium transition-colors">
            Home
          </a>
          <a href="/pricing" className="text-gray-700 hover:text-black font-medium transition-colors">
            Pricing
          </a>
          <a href="/#features" className="text-gray-700 hover:text-black font-medium transition-colors">
            Features
          </a>
          <a href="/apps" className="text-gray-700 hover:text-black font-medium transition-colors">
            Apps
          </a>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="relative hidden sm:block" ref={dropdownRef}>
            <Button variant="ghost" className="font-medium" onClick={() => setShowSignIn(!showSignIn)}>
              Sign In
            </Button>
            {showSignIn && (
              <div className="absolute right-0 mt-2 w-52 bg-white border-2 border-black rounded-xl shadow-offset z-50 overflow-hidden">
                <div className="p-2">
                  <a href={getAppUrl('teacher')} className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium hover:bg-primary/10 rounded-lg transition-colors">
                    <img src="/images/icon-permission.png" alt="" className="w-10 h-10 object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.25)]" />
                    Teacher Login
                  </a>
                  <a href={getAppUrl('school')} className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium hover:bg-primary/10 rounded-lg transition-colors">
                    <img src="/images/icon-tracking.png" alt="" className="w-10 h-10 object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.25)]" />
                    School Admin
                  </a>
                  <a href={getAppUrl('venue')} className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium hover:bg-primary/10 rounded-lg transition-colors">
                    <img src="/images/icon-venue.png" alt="" className="w-10 h-10 object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.25)]" />
                    Venue Admin
                  </a>
                </div>
              </div>
            )}
          </div>
          <Button
            className="hidden sm:inline-flex shadow-offset hover:-translate-x-1 hover:-translate-y-1 hover:shadow-offset-lg transition-all font-semibold"
            onClick={() => window.location.href = '/pricing'}
          >
            Get Started
          </Button>
          <button
            className="md:hidden flex flex-col items-center justify-center w-10 h-10 rounded-lg border-2 border-black bg-white hover:bg-gray-50 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </nav>

      {mobileMenuOpen && (
        <div className="md:hidden border-t-2 border-black bg-white">
          <div className="px-4 py-4 space-y-1">
            <a href="/" className="block px-3 py-2.5 text-base font-medium text-gray-700 hover:text-black hover:bg-gray-50 rounded-lg transition-colors">
              Home
            </a>
            <a href="/pricing" className="block px-3 py-2.5 text-base font-medium text-gray-700 hover:text-black hover:bg-gray-50 rounded-lg transition-colors">
              Pricing
            </a>
            <a href="/#features" className="block px-3 py-2.5 text-base font-medium text-gray-700 hover:text-black hover:bg-gray-50 rounded-lg transition-colors">
              Features
            </a>
            <a href="/apps" className="block px-3 py-2.5 text-base font-medium text-gray-700 hover:text-black hover:bg-gray-50 rounded-lg transition-colors">
              Apps
            </a>
            <div className="pt-3 mt-3 border-t border-gray-200">
              <p className="px-3 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">Sign In As</p>
              <a href={getAppUrl('teacher')} className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-700 hover:text-black hover:bg-primary/10 rounded-lg transition-colors">
                <img src="/images/icon-permission.png" alt="" className="w-8 h-8 object-contain" />
                Teacher
              </a>
              <a href={getAppUrl('school')} className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-700 hover:text-black hover:bg-primary/10 rounded-lg transition-colors">
                <img src="/images/icon-tracking.png" alt="" className="w-8 h-8 object-contain" />
                School Admin
              </a>
              <a href={getAppUrl('venue')} className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-700 hover:text-black hover:bg-primary/10 rounded-lg transition-colors">
                <img src="/images/icon-venue.png" alt="" className="w-8 h-8 object-contain" />
                Venue Admin
              </a>
            </div>
            <div className="pt-3">
              <Button
                className="w-full shadow-offset font-semibold"
                onClick={() => window.location.href = '/pricing'}
              >
                Get Started
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
