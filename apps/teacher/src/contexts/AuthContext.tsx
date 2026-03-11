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
  phone?: string;
  department?: string;
}

interface AuthContextType extends RBACAuthContextType {
  teacher: Teacher | null;
  teacherLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const rbacAuth = useRBACAuth();
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [teacherLoading, setTeacherLoading] = useState(true);
  const navigate = useNavigate();

  useLoginTracker(rbacAuth.user, supabase);

  useEffect(() => {
    if (rbacAuth.loading) return;

    if (rbacAuth.user) {
      loadTeacherData(rbacAuth.user.id);
    } else {
      setTeacher(null);
      setTeacherLoading(false);
    }
  }, [rbacAuth.user, rbacAuth.loading]);

  const loadTeacherData = async (userId: string) => {
    setTeacherLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from('teachers')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      setTeacher(data || null);
    } catch (error) {
      console.error('Error loading teacher data:', error);
      setTeacher(null);
    } finally {
      setTeacherLoading(false);
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
    teacherLoading,
    signOut: handleSignOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

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
