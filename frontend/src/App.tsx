import { HashRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import Index from './pages/Index';
import AuthPage from './pages/AuthPage';
import DishesPage from './pages/DishesPage';
import HistoryPage from './pages/HistoryPage';
import SettingsPage from './pages/SettingsPage';
import AppShell from './components/custom/AppShell';
import { Toaster } from './components/ui/sonner';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) navigate('/auth');
  }, [navigate]);
  const token = localStorage.getItem('token');
  if (!token) return null;
  return <AppShell>{children}</AppShell>;
}

const App = () => (
  <HashRouter>
    <Routes>
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/" element={<Index />} />
      <Route path="/dishes" element={<ProtectedRoute><DishesPage /></ProtectedRoute>} />
      <Route path="/history" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
    </Routes>
    <Toaster />
  </HashRouter>
);

export default App;
