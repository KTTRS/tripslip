import { useState, useRef, useEffect } from 'react'
import { Button } from '@tripslip/ui'
import { getAppUrl } from '../utils/appUrls'

export default function Header() {
  const [showSignIn, setShowSignIn] = useState(false);
  const [scrolled, setScrolled] = useState(false);
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
      <nav className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_#0A0A0A]">
            <span className="text-black font-bold text-sm">T</span>
          </div>
          <div className="text-2xl font-bold font-display">TripSlip</div>
        </div>
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
        <div className="flex items-center gap-3">
          <div className="relative" ref={dropdownRef}>
            <Button variant="ghost" className="font-medium" onClick={() => setShowSignIn(!showSignIn)}>
              Sign In
            </Button>
            {showSignIn && (
              <div className="absolute right-0 mt-2 w-52 bg-white border-2 border-black rounded-xl shadow-offset z-50 overflow-hidden">
                <div className="p-2">
                  <a href={getAppUrl('teacher')} className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium hover:bg-primary/10 rounded-lg transition-colors">
                    <img src="/images/icon-permission.png" alt="" className="w-6 h-6" />
                    Teacher Login
                  </a>
                  <a href={getAppUrl('school')} className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium hover:bg-primary/10 rounded-lg transition-colors">
                    <img src="/images/icon-tracking.png" alt="" className="w-6 h-6" />
                    School Admin
                  </a>
                  <a href={getAppUrl('venue')} className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium hover:bg-primary/10 rounded-lg transition-colors">
                    <img src="/images/icon-venue.png" alt="" className="w-6 h-6" />
                    Venue Admin
                  </a>
                </div>
              </div>
            )}
          </div>
          <Button
            className="shadow-offset hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all font-semibold"
            onClick={() => window.location.href = '/pricing'}
          >
            Get Started
          </Button>
        </div>
      </nav>
    </header>
  )
}
