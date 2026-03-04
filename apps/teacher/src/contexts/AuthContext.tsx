import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { User, Session } from '@tripslip/database';
import { 
  AuthProvider as RBACAuthProvider, 
  useAuth as useRBACAuth,
  useLoginTracker,
  type AuthContextType as RBACAuthContextType 
} from '@tripslip/auth';
import { supabase } from '../lib/supabase';

interface Teacher {
  id: string;
  user_id: string;
  school_id: string;
  first_name: string;
  last_name: string;
  email: string;
  is_active: boolean;
}

interface AuthContextType extends RBACAuthContextType {
  teacher: Teacher | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const rbacAuth = useRBACAuth();
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const navigate = useNavigate();

  // Track login timestamps for teachers
  useLoginTracker(rbacAuth.user, supabase);

  useEffect(() => {
    if (rbacAuth.user) {
      loadTeacherData(rbacAuth.user.id);
    } else {
      setTeacher(null);
    }
  }, [rbacAuth.user]);

  const loadTeacherData = async (userId: string) => {
    try {
      const { data, error } = await (supabase as any)
        .from('teachers')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) throw error;

      if (data) {
        setTeacher(data);
      }
    } catch (error) {
      console.error('Error loading teacher data:', error);
    }
  };

  const handleSignOut = async () => {
    await rbacAuth.signOut();
    setTeacher(null);
    navigate('/login');
  };

  const value: AuthContextType = {
    ...rbacAuth,
    teacher,
    signOut: handleSignOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Wrapper component to provide both RBAC and teacher-specific context
export function TeacherAuthProvider({ children }: { children: ReactNode }) {
  return (
    <RBACAuthProvider supabase={supabase}>
      <AuthProvider>{children}</AuthProvider>
    </RBACAuthProvider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
