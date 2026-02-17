import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { PublicMenu } from './views/PublicMenu';
import { LiveOrdersView } from './views/LiveOrdersView';
import { DashboardHome } from './views/DashboardHome';
import { AdminLayout } from './layouts/AdminLayout';
import { Login } from './views/Login';
import { getSubdomain, ADMIN_SUBDOMAIN } from './lib/domain';
import { Loader2 } from 'lucide-react';
import { supabase } from './lib/supabase';
import { AdminRestaurantProvider } from './context/AdminRestaurantContext';

function App() {
  const [subdomain, setSubdomain] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentSubdomain = getSubdomain();
    setSubdomain(currentSubdomain);
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-gray-400" size={32} />
      </div>
    );
  }

  // Admin Routing
  if (subdomain === ADMIN_SUBDOMAIN) {
    return (
      <BrowserRouter>
        <AuthGuard>
          <AdminRestaurantProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<AdminLayout />}>
                <Route index element={<DashboardHome />} />
                <Route path="orders" element={<LiveOrdersView />} />
                <Route path="menu" element={<div>Menu Config (Coming Soon)</div>} />
                <Route path="settings" element={<div>Settings (Coming Soon)</div>} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AdminRestaurantProvider>
        </AuthGuard>
      </BrowserRouter>
    );
  }

  // Restaurant Client Routing (Default)
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PublicMenu slug={subdomain || 'elbaqueanomartinez'} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

// Simple Auth Guard Component
function AuthGuard({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Allow login page without session
  if (window.location.pathname === '/login') return <>{children}</>;

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;
  if (!session) return <Login />; // Render Login directly instead of Redirect loop if possible, or use proper router redirect

  return <>{children}</>;
}

export default App;
