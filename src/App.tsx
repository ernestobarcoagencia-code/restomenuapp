import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { PublicMenu } from './views/PublicMenu';
import { AdminDashboard } from './views/AdminDashboard';
import { getSubdomain, ADMIN_SUBDOMAIN } from './lib/domain';
import { Loader2 } from 'lucide-react';

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
        <Routes>
          <Route path="/" element={<AdminDashboard />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
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

export default App;
