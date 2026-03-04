import { ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { 
  AuthProvider as RBACAuthProvider, 
  useAuth as useRBACAuth
} from '@tripslip/auth';

// For school app, we just use the RBAC auth directly
export function SchoolAuthProvider({ children }: { children: ReactNode }) {
  return (
    <RBACAuthProvider supabase={supabase}>
      {children}
    </RBACAuthProvider>
  );
}

export function useAuth() {
  return useRBACAuth();
}
