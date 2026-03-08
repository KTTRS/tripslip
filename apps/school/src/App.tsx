import { Routes, Route, Link } from 'react-router'
import { ErrorBoundary } from '@tripslip/ui'
import { SchoolAuthProvider } from './contexts/SchoolAuthContext'
import { ProtectedRoute } from '@tripslip/auth'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import EmailVerificationPage from './pages/EmailVerificationPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import DashboardPage from './pages/DashboardPage'
import TeachersPage from './pages/TeachersPage'
import ApprovalsPage from './pages/ApprovalsPage'
import DistrictAdminDashboard from './pages/DistrictAdminDashboard'
import TripSlipAdminDashboard from './pages/TripSlipAdminDashboard'
import DistrictDetailPage from './pages/DistrictDetailPage'
import SchoolDetailPage from './pages/SchoolDetailPage'

function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FFFDF5]">
      <div className="text-center px-6">
        <h1 className="text-7xl font-display font-bold text-[#F5C518] mb-4">404</h1>
        <h2 className="text-2xl font-display font-semibold text-[#0A0A0A] mb-2">Page Not Found</h2>
        <p className="text-gray-600 mb-6">The page you're looking for doesn't exist or has been moved.</p>
        <Link to="/" className="inline-block px-6 py-3 bg-[#F5C518] text-[#0A0A0A] border-2 border-[#0A0A0A] rounded-lg shadow-[4px_4px_0px_#0A0A0A] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_#0A0A0A] transition-all font-semibold">
          Back to Home
        </Link>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
    <SchoolAuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/verify-email" element={<EmailVerificationPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route 
          path="/" 
          element={
            <ProtectedRoute requiredRoles={['school_admin', 'district_admin', 'tripslip_admin']}>
              <DashboardPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute requiredRoles={['school_admin', 'district_admin', 'tripslip_admin']}>
              <DashboardPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/teachers" 
          element={
            <ProtectedRoute requiredRoles={['school_admin', 'district_admin', 'tripslip_admin']}>
              <TeachersPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/approvals" 
          element={
            <ProtectedRoute requiredRoles={['school_admin', 'district_admin', 'tripslip_admin']}>
              <ApprovalsPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/district-admin" 
          element={
            <ProtectedRoute requiredRoles={['district_admin', 'tripslip_admin']}>
              <DistrictAdminDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/tripslip-admin" 
          element={
            <ProtectedRoute requiredRoles={['tripslip_admin']}>
              <TripSlipAdminDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/districts/:districtId" 
          element={
            <ProtectedRoute requiredRoles={['tripslip_admin']}>
              <DistrictDetailPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/schools/:schoolId" 
          element={
            <ProtectedRoute requiredRoles={['district_admin', 'tripslip_admin']}>
              <SchoolDetailPage />
            </ProtectedRoute>
          } 
        />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </SchoolAuthProvider>
    </ErrorBoundary>
  )
}
