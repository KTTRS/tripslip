import { Routes, Route } from 'react-router'
import HomePage from './pages/HomePage'
import PricingPage from './pages/PricingPage'
import AppsPage from './pages/AppsPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/pricing" element={<PricingPage />} />
      <Route path="/apps" element={<AppsPage />} />
    </Routes>
  )
}
