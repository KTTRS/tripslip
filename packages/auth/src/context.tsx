/**
 * Authentication Context Provider
 * Provides authentication state and actions to React components
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { User, Session, SupabaseClient } from '@tripslip/database';
import type { AuthContextType } from './context-types';
import type {
  SignUpParams,
  RoleAssignment,
  ActiveRoleContext,
  UserRole,
  OrganizationType,
} from './types';
import { createRBACAuthService } from './rbac-service-impl';
import type { RBACAuthService } from './rbac-service';

/**
 * Authentication context
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Props for AuthProvider component
 */
export interface AuthProviderProps {
  children: React.ReactNode;
  supabase: SupabaseClient;
}

/**
 * Authentication provider component
 * Manages authentication state and provides auth actions to children
 */
export function AuthProvider({ children, supabase }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeRole, setActiveRole] = useState<ActiveRoleContext | null>(null);
  const [roleAssignments, setRoleAssignments] = useState<RoleAssignment[]>([]);
  
  const authService: RBACAuthService = createRBACAuthService(supabase);

  /**
   * Initialize session on mount
   */
  useEffect(() => {
    initializeSession();
  }, []);

  /**
   * Set up auth state change listener
   */
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          await loadUserRoles(session.user.id);
        } else {
          setRoleAssignments([]);
          setActiveRole(null);
        }

        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  /**
   * Initialize session from storage
   */
  const initializeSession = async () => {
    try {
      const session = await authService.getSession();
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        await loadUserRoles(session.user.id);
      }
    } catch (error) {
      console.error('Failed to initialize session:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Load user roles and active role context
   */
  const loadUserRoles = async (userId: string) => {
    try {
      const [assignments, context] = await Promise.all([
        authService.getRoleAssignments(userId),
        authService.getActiveRoleContext(userId),
      ]);

      setRoleAssignments(assignments);
      setActiveRole(context);
    } catch (error) {
      console.error('Failed to load user roles:', error);
    }
  };

  /**
   * Set up session refresh interval
   */
  useEffect(() => {
    if (!session) return;

    // Refresh session every 30 minutes
    const refreshInterval = setInterval(async () => {
      try {
        const refreshedSession = await authService.refreshSession();
        if (refreshedSession) {
          setSession(refreshedSession);
          setUser(refreshedSession.user);
        }
      } catch (error) {
        console.error('Failed to refresh session:', error);
        // Session expired, clear state
        setSession(null);
        setUser(null);
        setRoleAssignments([]);
        setActiveRole(null);
      }
    }, 30 * 60 * 1000); // 30 minutes

    return () => {
      clearInterval(refreshInterval);
    };
  }, [session]);

  /**
   * Sign in with email and password
   */
  const signIn = useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      const result = await authService.signIn(email, password);
      setUser(result.user);
      setSession(result.session);
      setRoleAssignments(result.roleAssignments);
      setActiveRole(result.activeRole);
    } finally {
      setLoading(false);
    }
  }, [authService]);

  /**
   * Sign up a new user
   */
  const signUp = useCallback(async (params: SignUpParams) => {
    setLoading(true);
    try {
      const result = await authService.signUp(params);
      setUser(result.user);
      setSession(result.session);
      
      if (result.user) {
        await loadUserRoles(result.user.id);
      }
    } finally {
      setLoading(false);
    }
  }, [authService]);

  /**
   * Sign out the current user
   */
  const signOut = useCallback(async () => {
    setLoading(true);
    try {
      await authService.signOut();
      setUser(null);
      setSession(null);
      setRoleAssignments([]);
      setActiveRole(null);
    } finally {
      setLoading(false);
    }
  }, [authService]);

  /**
   * Switch to a different role
   */
  const switchRole = useCallback(async (roleAssignmentId: string) => {
    if (!user) return;

    setLoading(true);
    try {
      await authService.switchRole(roleAssignmentId);
      
      // Reload active role context
      const context = await authService.getActiveRoleContext(user.id);
      setActiveRole(context);
    } finally {
      setLoading(false);
    }
  }, [user, authService]);

  /**
   * Check if user has a specific role
   */
  const hasRole = useCallback((role: UserRole): boolean => {
    return roleAssignments.some(assignment => assignment.role_name === role);
  }, [roleAssignments]);

  /**
   * Check if user can access an organization
   */
  const canAccessOrganization = useCallback(
    (orgType: OrganizationType, orgId: string): boolean => {
      // TripSlip admins can access everything
      if (hasRole('tripslip_admin')) {
        return true;
      }

      // Check for direct organization access
      const hasDirectAccess = roleAssignments.some(
        a => a.organization_type === orgType && a.organization_id === orgId
      );

      if (hasDirectAccess) {
        return true;
      }

      // Check for district admin access to schools
      if (orgType === 'school') {
        // This would require additional logic to check school-district relationships
        // For now, return false (will be handled by RLS policies)
        return false;
      }

      return false;
    },
    [roleAssignments, hasRole]
  );

  const value: AuthContextType = {
    user,
    session,
    loading,
    activeRole,
    roleAssignments,
    signIn,
    signUp,
    signOut,
    switchRole,
    hasRole,
    canAccessOrganization,
    isAuthenticated: !!user,
    isEmailVerified: !!user?.email_confirmed_at,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to use authentication context
 * @throws Error if used outside AuthProvider
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
