import { Routes, Route } from 'react-router'
import DashboardPage from './pages/DashboardPage'
import TeachersPage from './pages/TeachersPage'
import ApprovalsPage from './pages/ApprovalsPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<DashboardPage />} />
      <Route path="/teachers" element={<TeachersPage />} />
      <Route path="/approvals" element={<ApprovalsPage />} />
    </Routes>
  )
}
