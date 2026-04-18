import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppShell from '@/components/custom/AppShell';
import Dashboard from './Dashboard';


const Index = () => {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/auth');
    } else {
      // Use a microtask to avoid synchronous setState in effect body
      Promise.resolve().then(() => setChecking(false));
    }
  }, [navigate]);

  if (checking) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#3B82F6] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <AppShell>
      <Dashboard />
    </AppShell>
  );
};

export default Index;
