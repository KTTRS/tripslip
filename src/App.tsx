import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/home';
import DashboardPage from './pages/dashboard';
import TeacherPage from './pages/teacher';
import ParentPage from './pages/parent';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/t/:invId" element={<TeacherPage />} />
        <Route path="/p/:token" element={<ParentPage />} />
      </Routes>
    </BrowserRouter>
  );
}
