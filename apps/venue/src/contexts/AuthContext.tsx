import { createContext, useContext, ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import { 
  AuthProvider as RBACAuthProvider, 
  useAuth as useRBACAuth,
  type AuthContextType as RBACAuthContextType 
} from '@tripslip/auth'

// For venue app, we just use the RBAC auth directly
export function VenueAuthProvider({ children }: { children: ReactNode }) {
  return (
    <RBACAuthProvider supabase={supabase}>
      {children}
    </RBACAuthProvider>
  )
}

export function useAuth() {
  return useRBACAuth()
}

// Keep the old AuthProvider export for backward compatibility
export const AuthProvider = VenueAuthProvider
