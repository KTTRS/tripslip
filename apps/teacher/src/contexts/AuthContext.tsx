import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { createSupabaseClient, User, Session } from '@tripslip/database';
import { createAuthService } from '@tripslip/auth';

interface Teacher {
  id: string;
  user_id: string;
  school_id: string;
  first_name: string;
  last_name: string;
  email: string;
  is_active: boolean;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  teacher: Teacher | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const supabase = createSupabaseClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const authService = createAuthService(supabase);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check for existing session
    authService.getSession().then((session) => {
      setSession(session);
      if (session?.user) {
        setUser(session.user);
        loadTeacherData(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          await loadTeacherData(session.user.id);
        } else {
          setTeacher(null);
        }

        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

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
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    await authService.signOut();
    setUser(null);
    setSession(null);
    setTeacher(null);
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{ user, session, teacher, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
