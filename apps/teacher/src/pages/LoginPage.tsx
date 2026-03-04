/**
 * Teacher App Login Page
 * Uses the shared LoginPage component with RBAC auth service
 */

import { useNavigate } from 'react-router';
import { createRBACAuthService, LoginPage as SharedLoginPage } from '@tripslip/auth';
import type { UserRole } from '@tripslip/auth';
import { supabase } from '../lib/supabase';

const authService = createRBACAuthService(supabase);

export default function LoginPage() {
  const navigate = useNavigate();

  const handleLoginSuccess = (role: UserRole) => {
    // Redirect to dashboard for teachers
    navigate('/dashboard', { replace: true });
  };

  return (
    <SharedLoginPage
      supabase={supabase}
      authService={authService}
      onLoginSuccess={handleLoginSuccess}
      signupPath="/signup"
      passwordResetPath="/forgot-password"
    />
  );
}
