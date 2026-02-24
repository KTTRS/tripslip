import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useStore } from './lib/store';
import HomePage from './pages/home';
import DashboardPage from './pages/dashboard';
import TeacherPage from './pages/teacher';
import ParentPage from './pages/parent';

function AppLoader({ children }: { children: React.ReactNode }) {
  const { loading, init } = useStore();

  useEffect(() => {
    init();
  }, [init]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4">
        <div className="w-14 h-14 bg-bus rounded-xl flex items-center justify-center shadow-lg rotate-[-6deg]">
          <span className="text-2xl">🎫</span>
        </div>
        <h1 className="text-2xl font-black text-white italic">
          trip<span className="text-bus">slip</span>
        </h1>
        <div className="w-32 h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-bus rounded-full animate-pulse w-2/3" />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <AppLoader>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/t/:invId" element={<TeacherPage />} />
          <Route path="/p/:token" element={<ParentPage />} />
        </Routes>
      </AppLoader>
    </BrowserRouter>
  );
}
