import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Home from './pages/Home';
import GroupPage from './pages/GroupPage';
import NotFound from './pages/NotFound';
import AdminPage from './pages/AdminPage';
import MyGroupsPage from './pages/MyGroupsPage';
import { useAuth } from './contexts/AuthContext';

// Secret admin key from environment variable
const ADMIN_KEY = import.meta.env.VITE_ADMIN_KEY || '';

// Redirect signed-in users to My Groups, show Home for guests
function HomeRedirect() {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  
  if (user) {
    return <Navigate to="/my-groups" replace />;
  }
  
  return <Home />;
}

function App() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Check URL for admin key
    const urlParams = new URLSearchParams(window.location.search);
    const adminKey = urlParams.get('admin');
    
    if (adminKey && ADMIN_KEY && adminKey === ADMIN_KEY) {
      setIsAdmin(true);
      // Store in session so admin mode persists during navigation
      sessionStorage.setItem('admin_mode', 'true');
    } else if (urlParams.has('exit')) {
      // Allow exiting admin mode with ?exit parameter
      sessionStorage.removeItem('admin_mode');
      setIsAdmin(false);
    } else if (sessionStorage.getItem('admin_mode') === 'true') {
      // Check session for persisted admin mode
      setIsAdmin(true);
    }
  }, []);

  // If admin mode, show admin page
  if (isAdmin) {
    return (
      <div className="min-h-screen">
        <Routes>
          <Route path="/" element={<AdminPage />} />
          <Route path="/new" element={<Home />} />
          <Route path="/my-groups" element={<MyGroupsPage />} />
          <Route path="/group/:groupId" element={<GroupPage />} />
          <Route path="*" element={<AdminPage />} />
        </Routes>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Routes>
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/new" element={<Home />} />
        <Route path="/my-groups" element={<MyGroupsPage />} />
        <Route path="/group/:groupId" element={<GroupPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}

export default App;
