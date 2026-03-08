import { useNavigate } from 'react-router';
import { createRBACAuthService, LoginPage as SharedLoginPage } from '@tripslip/auth';
import type { UserRole } from '@tripslip/auth';
import { supabase } from '../lib/supabase';

const authService = createRBACAuthService(supabase);

export default function LoginPage() {
  const navigate = useNavigate();

  const handleLoginSuccess = (_role: UserRole) => {
    navigate('/dashboard', { replace: true });
  };

  return (
    <SharedLoginPage
      supabase={supabase}
      authService={authService}
      onLoginSuccess={handleLoginSuccess}
      signupPath="/signup"
      passwordResetPath="/forgot-password"
      portalTitle="Venue Partner Portal"
      portalSubtitle="Sign in to manage bookings, experiences, and your venue profile"
      mascotImage="/images/char-green-octagon.png"
      mascotMessage="Welcome, Partner!"
      mascotSubMessage="Manage your venue and connect with schools"
    />
  );
}
