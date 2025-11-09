import { useState, useEffect } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import LoginPage from './pages/LoginPage';
import AdminPanel from './pages/AdminPanel';
import ManagerPanel from './pages/ManagerPanel';
import SupervisorPanel from './pages/SupervisorPanel';
import WorkerPanel from './pages/WorkerPanel';

const queryClient = new QueryClient();

interface User {
  id: number;
  login: string;
  full_name: string;
  role: string;
}

const App = () => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogin = (userData: User) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  const renderPanel = () => {
    if (!user) return <LoginPage onLogin={handleLogin} />;

    switch (user.role) {
      case 'admin':
        return <AdminPanel user={user} onLogout={handleLogout} />;
      case 'manager':
        return <ManagerPanel user={user} onLogout={handleLogout} />;
      case 'supervisor':
        return <SupervisorPanel user={user} onLogout={handleLogout} />;
      case 'worker':
        return <WorkerPanel user={user} onLogout={handleLogout} />;
      default:
        return <LoginPage onLogin={handleLogin} />;
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        {renderPanel()}
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;