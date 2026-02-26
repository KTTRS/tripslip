import { Routes, Route, Navigate } from 'react-router'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import CreateTripPage from './pages/CreateTripPage'
import TripRosterPage from './pages/TripRosterPage'
import PermissionSlipTrackingPage from './pages/PermissionSlipTrackingPage'

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
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
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}
