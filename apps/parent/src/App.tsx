import { Routes, Route } from 'react-router';
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

export default function App() {
  return (
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
    </Routes>
  );
}
