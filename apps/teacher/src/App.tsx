import { Routes, Route, Navigate } from 'react-router'
import { TeacherAuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import DashboardPage from './pages/DashboardPage'
import EmailVerificationPage from './pages/EmailVerificationPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import CreateTripPage from './pages/CreateTripPage'
import TripRosterPage from './pages/TripRosterPage'
import PermissionSlipTrackingPage from './pages/PermissionSlipTrackingPage'
import VenueSearchPage from './pages/VenueSearchPage'
import VenueDetailPage from './pages/VenueDetailPage'

export default function App() {
  return (
    <TeacherAuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/verify-email" element={<EmailVerificationPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/trips/create"
          element={
            <ProtectedRoute>
              <CreateTripPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/trips/:tripId/roster"
          element={
            <ProtectedRoute>
              <TripRosterPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/trips/:tripId/slips"
          element={
            <ProtectedRoute>
              <PermissionSlipTrackingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/venues/search"
          element={
            <ProtectedRoute>
              <VenueSearchPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/venues/:venueId"
          element={
            <ProtectedRoute>
              <VenueDetailPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </TeacherAuthProvider>
  )
}
