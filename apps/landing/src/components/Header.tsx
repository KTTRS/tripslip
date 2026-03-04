import { Button } from '@tripslip/ui'
import { getAppUrl } from '../utils/appUrls'

export default function Header() {
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
          <Button variant="ghost" onClick={() => window.location.href = getAppUrl('teacher')}>
            Sign In
          </Button>
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
