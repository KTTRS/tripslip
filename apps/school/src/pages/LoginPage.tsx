import { useNavigate } from 'react-router';
import { createRBACAuthService, LoginPage as SharedLoginPage } from '@tripslip/auth';
import type { UserRole } from '@tripslip/auth';
import { supabase } from '../lib/supabase';

const authService = createRBACAuthService(supabase);

export default function LoginPage() {
  const navigate = useNavigate();

  const handleLoginSuccess = (role: UserRole) => {
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
      portalTitle="School Admin Portal"
      portalSubtitle="Sign in to oversee trips, approve requests, and manage teachers"
      mascotImage="/images/char-blue-square.png"
      mascotMessage="Welcome, Admin!"
      mascotSubMessage="Manage your school's field trip program"
    />
  );
}
