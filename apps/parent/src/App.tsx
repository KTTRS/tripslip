import { Routes, Route } from 'react-router';
import { AuthPage } from './pages/AuthPage';
import { PermissionSlipPage } from './pages/PermissionSlipPage';
import { SessionExpiredPage } from './pages/SessionExpiredPage';
import { PaymentSuccessPage } from './pages/PaymentSuccessPage';

export default function App() {
  return (
    <Routes>
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/slip/:slipId" element={<PermissionSlipPage />} />
      <Route path="/payment/success" element={<PaymentSuccessPage />} />
      <Route path="/session-expired" element={<SessionExpiredPage />} />
      <Route path="/" element={<AuthPage />} />
    </Routes>
  );
}
