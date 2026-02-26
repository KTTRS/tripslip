import { ReactNode } from 'react';
import { Navigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, teacher, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !teacher) {
    return <Navigate to="/login" replace />;
  }

  // Check if teacher account is active
  if (!teacher.is_active) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-bold mb-4">Account Deactivated</h1>
          <p className="text-gray-600 mb-4">
            Your teacher account has been deactivated. Please contact your school
            administrator for assistance.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
