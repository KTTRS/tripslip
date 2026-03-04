import { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { 
  AuthProvider as RBACAuthProvider, 
  useAuth as useRBACAuth,
  type AuthContextType as RBACAuthContextType 
} from '@tripslip/auth';
import type { Database } from '@tripslip/database';

type UserRoleAssignment = Database['public']['Tables']['user_role_assignments']['Row'];

interface SchoolAuthContextType extends RBACAuthContextType {
  schoolId: string | null;
  schoolName: string | null;
  role: 'school_admin' | 'district_admin' | 'tripslip_admin' | null;
  schoolLoading: boolean;
  schoolError: string | null;
}

const SchoolAuthContext = createContext<SchoolAuthContextType | null>(null);

export function SchoolAuthProvider({ children }: { children: ReactNode }) {
  const [schoolData, setSchoolData] = useState<{
    schoolId: string | null;
    schoolName: string | null;
    role: 'school_admin' | 'district_admin' | 'tripslip_admin' | null;
    loading: boolean;
    error: string | null;
  }>({
    schoolId: null,
    schoolName: null,
    role: null,
    loading: true,
    error: null,
  });

  return (
    <RBACAuthProvider supabase={supabase}>
      <SchoolAuthInner schoolData={schoolData} setSchoolData={setSchoolData}>
        {children}
      </SchoolAuthInner>
    </RBACAuthProvider>
  );
}

function SchoolAuthInner({
  children,
  schoolData,
  setSchoolData,
}: {
  children: ReactNode;
  schoolData: any;
  setSchoolData: any;
}) {
  const rbacAuth = useRBACAuth();

  useEffect(() => {
    if (!rbacAuth.user) {
      setSchoolData({
        schoolId: null,
        schoolName: null,
        role: null,
        loading: false,
        error: null,
      });
      return;
    }

    fetchSchoolData();
  }, [rbacAuth.user, rbacAuth.activeRole]);

  const fetchSchoolData = async () => {
    try {
      setSchoolData((prev: any) => ({ ...prev, loading: true, error: null }));

      if (!rbacAuth.user) {
        throw new Error('No authenticated user');
      }

      // Get the user's active role assignment
      const { data: roleAssignment, error: roleError } = await supabase
        .from('user_role_assignments')
        .select(`
          *,
          user_roles (name)
        `)
        .eq('user_id', rbacAuth.user.id)
        .eq('is_active', true)
        .single();

      if (roleError) {
        if (roleError.code === 'PGRST116') {
          // No active role assignment found
          setSchoolData({
            schoolId: null,
            schoolName: null,
            role: null,
            loading: false,
            error: 'No active role assignment found for this user',
          });
          return;
        }
        throw roleError;
      }

      const typedRoleAssignment = roleAssignment as UserRoleAssignment & {
        user_roles: { name: string };
      };

      // Check if the role is a school-related role
      const roleName = typedRoleAssignment.user_roles.name;
      if (!['school_admin', 'district_admin', 'tripslip_admin'].includes(roleName)) {
        setSchoolData({
          schoolId: null,
          schoolName: null,
          role: null,
          loading: false,
          error: 'User does not have school administration privileges',
        });
        return;
      }

      let schoolId: string | null = null;
      let schoolName: string | null = null;

      // For school_admin, the organization_id should be the school_id
      // For district_admin, we need to get schools from the district
      // For tripslip_admin, they can access all schools
      if (roleName === 'school_admin' && typedRoleAssignment.organization_type === 'school') {
        schoolId = typedRoleAssignment.organization_id;
        
        // Fetch school details
        const { data: school, error: schoolError } = await supabase
          .from('schools')
          .select('name')
          .eq('id', schoolId)
          .single();

        if (schoolError) throw schoolError;
        schoolName = school.name;
      } else if (roleName === 'district_admin' && typedRoleAssignment.organization_type === 'district') {
        // For district admin, we'll use the first school in their district for now
        // In a full implementation, they might select which school to manage
        const { data: schools, error: schoolsError } = await supabase
          .from('schools')
          .select('id, name')
          .eq('district_id', typedRoleAssignment.organization_id)
          .limit(1);

        if (schoolsError) throw schoolsError;
        
        if (schools && schools.length > 0) {
          schoolId = schools[0].id;
          schoolName = schools[0].name;
        }
      } else if (roleName === 'tripslip_admin') {
        // TripSlip admin can access all schools - for now we'll leave school info null
        // They would typically select a school to manage
        schoolId = null;
        schoolName = 'TripSlip Admin';
      }

      setSchoolData({
        schoolId,
        schoolName,
        role: roleName as 'school_admin' | 'district_admin' | 'tripslip_admin',
        loading: false,
        error: null,
      });
    } catch (error) {
      console.error('Error fetching school data:', error);
      setSchoolData({
        schoolId: null,
        schoolName: null,
        role: null,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load school data',
      });
    }
  };

  const contextValue: SchoolAuthContextType = {
    ...rbacAuth,
    schoolId: schoolData.schoolId,
    schoolName: schoolData.schoolName,
    role: schoolData.role,
    schoolLoading: schoolData.loading,
    schoolError: schoolData.error,
  };

  return (
    <SchoolAuthContext.Provider value={contextValue}>
      {children}
    </SchoolAuthContext.Provider>
  );
}

export function useSchoolAuth(): SchoolAuthContextType {
  const context = useContext(SchoolAuthContext);
  if (!context) {
    throw new Error('useSchoolAuth must be used within SchoolAuthProvider');
  }
  return context;
}

// Keep the old useAuth export for backward compatibility
export function useAuth() {
  return useSchoolAuth();
}
