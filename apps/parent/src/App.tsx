import { Routes, Route } from 'react-router';
import { AuthPage } from './pages/AuthPage';
import { PermissionSlipPage } from './pages/PermissionSlipPage';
import { PermissionSlipSuccessPage } from './pages/PermissionSlipSuccessPage';
import { SessionExpiredPage } from './pages/SessionExpiredPage';
import { PaymentPage } from './pages/PaymentPage';
import { PaymentSuccessPage } from './pages/PaymentSuccessPage';

export default function App() {
  return (
    <Routes>
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/permission-slip" element={<PermissionSlipPage />} />
      <Route path="/permission-slip/success" element={<PermissionSlipSuccessPage />} />
      <Route path="/payment" element={<PaymentPage />} />
      <Route path="/payment/success" element={<PaymentSuccessPage />} />
      <Route path="/session-expired" element={<SessionExpiredPage />} />
      <Route path="/" element={<AuthPage />} />
    </Routes>
  );
}
