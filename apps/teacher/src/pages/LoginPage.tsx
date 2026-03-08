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
      portalTitle="Teacher Portal"
      portalSubtitle="Sign in to plan trips, manage rosters, and track permission slips"
      mascotImage="/images/char-yellow-star.png"
      mascotMessage="Hello, Teacher!"
      mascotSubMessage="Ready to plan your next amazing field trip?"
    />
  );
}
