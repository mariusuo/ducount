import { Routes, Route } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Home from './pages/Home';
import GroupPage from './pages/GroupPage';
import NotFound from './pages/NotFound';
import AdminPage from './pages/AdminPage';
import MyGroupsPage from './pages/MyGroupsPage';

// Secret admin key from environment variable
const ADMIN_KEY = import.meta.env.VITE_ADMIN_KEY || '';

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
        <Route path="/" element={<Home />} />
        <Route path="/my-groups" element={<MyGroupsPage />} />
        <Route path="/group/:groupId" element={<GroupPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}

export default App;
