import { useState, useRef, useEffect } from 'react'
import { Button } from '@tripslip/ui'
import { getAppUrl } from '../utils/appUrls'

export default function Header() {
  const [showSignIn, setShowSignIn] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowSignIn(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="border-b-2 border-black bg-white">
      <nav className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="text-2xl font-bold font-display">TripSlip</div>
        </div>
        <div className="hidden md:flex items-center gap-8">
          <a href="/" className="text-gray-700 hover:text-black transition-colors">
            Home
          </a>
          <a href="/pricing" className="text-gray-700 hover:text-black transition-colors">
            Pricing
          </a>
          <a href="/#features" className="text-gray-700 hover:text-black transition-colors">
            Features
          </a>
          <a href="/apps" className="text-gray-700 hover:text-black transition-colors">
            Apps
          </a>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative" ref={dropdownRef}>
            <Button variant="ghost" onClick={() => setShowSignIn(!showSignIn)}>
              Sign In
            </Button>
            {showSignIn && (
              <div className="absolute right-0 mt-2 w-48 bg-white border-2 border-black rounded-lg shadow-[4px_4px_0px_#0A0A0A] z-50 overflow-hidden">
                <a href={getAppUrl('teacher')} className="block px-4 py-3 text-sm font-medium hover:bg-[#F5C518]/20 transition-colors border-b border-gray-100">
                  Teacher Login
                </a>
                <a href={getAppUrl('school')} className="block px-4 py-3 text-sm font-medium hover:bg-[#F5C518]/20 transition-colors border-b border-gray-100">
                  School Admin
                </a>
                <a href={getAppUrl('venue')} className="block px-4 py-3 text-sm font-medium hover:bg-[#F5C518]/20 transition-colors">
                  Venue Admin
                </a>
              </div>
            )}
          </div>
          <Button 
            className="shadow-offset hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all"
            onClick={() => window.location.href = '/pricing'}
          >
            Get Started
          </Button>
        </div>
      </nav>
    </header>
  )
}
