import { Routes, Route, Link } from 'react-router'
import { ErrorBoundary } from '@tripslip/ui'
import HomePage from './pages/HomePage'
import PricingPage from './pages/PricingPage'
import AppsPage from './pages/AppsPage'

function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FFFDF5]">
      <div className="text-center px-6">
        <h1 className="text-7xl font-display font-bold text-[#F5C518] mb-4">404</h1>
        <h2 className="text-2xl font-display font-semibold text-[#0A0A0A] mb-2">Page Not Found</h2>
        <p className="text-gray-600 mb-6">The page you're looking for doesn't exist or has been moved.</p>
        <Link to="/" className="inline-block px-6 py-3 bg-[#F5C518] text-[#0A0A0A] border-2 border-[#0A0A0A] rounded-lg shadow-[4px_4px_0px_#0A0A0A] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_#0A0A0A] transition-all font-semibold">
          Back to Home
        </Link>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/apps" element={<AppsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </ErrorBoundary>
  )
}
