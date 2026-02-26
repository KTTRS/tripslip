import { Routes, Route, Navigate } from 'react-router'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import ExperiencesPage from './pages/ExperiencesPage'
import ExperienceEditorPage from './pages/ExperienceEditorPage'
import ExperienceDetailPage from './pages/ExperienceDetailPage'
import TripsPage from './pages/TripsPage'
import FinancialsPage from './pages/FinancialsPage'

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
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
          path="/financials"
          element={
            <ProtectedRoute>
              <FinancialsPage />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AuthProvider>
  )
}
