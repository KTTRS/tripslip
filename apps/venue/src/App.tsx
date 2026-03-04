import { Routes, Route, Navigate } from 'react-router'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import EmailVerificationPage from './pages/EmailVerificationPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import DashboardPage from './pages/DashboardPage'
import ExperiencesPage from './pages/ExperiencesPage'
import ExperienceEditorPage from './pages/ExperienceEditorPage'
import ExperienceDetailPage from './pages/ExperienceDetailPage'
import TripsPage from './pages/TripsPage'
import BookingManagementPage from './pages/BookingManagementPage'
import FinancialsPage from './pages/FinancialsPage'
import { BookingRosterPage } from './pages/BookingRosterPage'
import { EmployeesPage } from './pages/EmployeesPage'

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/verify-email" element={<EmailVerificationPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/experiences"
          element={
            <ProtectedRoute>
              <ExperiencesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/experiences/new"
          element={
            <ProtectedRoute>
              <ExperienceEditorPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/experiences/:id"
          element={
            <ProtectedRoute>
              <ExperienceDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/experiences/:id/edit"
          element={
            <ProtectedRoute>
              <ExperienceEditorPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/trips"
          element={
            <ProtectedRoute>
              <TripsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/bookings"
          element={
            <ProtectedRoute>
              <BookingManagementPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/bookings/:bookingId/roster"
          element={
            <ProtectedRoute>
              <BookingRosterPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/financials"
          element={
            <ProtectedRoute>
              <FinancialsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employees"
          element={
            <ProtectedRoute>
              <EmployeesPage />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AuthProvider>
  )
}
