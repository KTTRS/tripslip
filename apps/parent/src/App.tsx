import { Routes, Route, Link } from 'react-router';
import { ErrorBoundary } from '@tripslip/ui';
import { AuthPage } from './pages/AuthPage';
import { PermissionSlipPage } from './pages/PermissionSlipPage';
import { PermissionSlipSuccessPage } from './pages/PermissionSlipSuccessPage';
import { SessionExpiredPage } from './pages/SessionExpiredPage';
import { PaymentPage } from './pages/PaymentPage';
import { PaymentSuccessPage } from './pages/PaymentSuccessPage';
import { TripLookupPage } from './pages/TripLookupPage';
import { ParentLoginPage } from './pages/ParentLoginPage';
import { ParentSignupPage } from './pages/ParentSignupPage';
import { ParentDashboardPage } from './pages/ParentDashboardPage';

function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center px-6">
        <h1 className="text-6xl font-bold text-gray-300 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">Page Not Found</h2>
        <p className="text-gray-600 mb-6">The page you're looking for doesn't exist or has been moved.</p>
        <Link to="/" className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
          Back to Home
        </Link>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
    <Routes>
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/login" element={<ParentLoginPage />} />
      <Route path="/signup" element={<ParentSignupPage />} />
      <Route path="/dashboard" element={<ParentDashboardPage />} />
      <Route path="/trip/:token" element={<TripLookupPage />} />
      <Route path="/permission-slip" element={<PermissionSlipPage />} />
      <Route path="/slip/:slipId" element={<PermissionSlipPage />} />
      <Route path="/permission-slip/success" element={<PermissionSlipSuccessPage />} />
      <Route path="/payment" element={<PaymentPage />} />
      <Route path="/payment/success" element={<PaymentSuccessPage />} />
      <Route path="/session-expired" element={<SessionExpiredPage />} />
      <Route path="/success" element={<PermissionSlipSuccessPage />} />
      <Route path="/" element={<ParentLoginPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
    </ErrorBoundary>
  );
}
