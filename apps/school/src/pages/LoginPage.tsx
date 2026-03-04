/**
 * School App Login Page
 * Uses the shared LoginPage component with RBAC auth service
 * Supports school_admin, district_admin, and tripslip_admin roles
 */

import { useNavigate } from 'react-router';
import { createSupabaseClient } from '@tripslip/database';
import { supabase } from '../lib/supabase';
import { createRBACAuthService, LoginPage as SharedLoginPage } from '@tripslip/auth';
import type { UserRole } from '@tripslip/auth';

const authService = createRBACAuthService(supabase);

export default function LoginPage() {
  const navigate = useNavigate();

  const handleLoginSuccess = (role: UserRole) => {
    // Redirect based on role
    switch (role) {
      case 'school_admin':
        navigate('/dashboard', { replace: true });
        break;
      case 'district_admin':
        navigate('/district-admin', { replace: true });
        break;
      case 'tripslip_admin':
        navigate('/tripslip-admin', { replace: true });
        break;
      default:
        // If user doesn't have appropriate role, show error
        alert('You do not have permission to access the school app');
        authService.signOut();
        break;
    }
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
