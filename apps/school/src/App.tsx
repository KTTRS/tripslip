import { Routes, Route } from 'react-router'
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

export default function App() {
  return (
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
      </Routes>
    </SchoolAuthProvider>
  )
}
