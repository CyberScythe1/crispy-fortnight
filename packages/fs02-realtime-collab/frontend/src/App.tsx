import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Workspaces from './pages/Workspaces';
import Settings from './pages/Settings';

function PrivateRoute({ children, allowedRoles }) { const { user, isAuthenticated, loading } = useAuth(); if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent"></div></div>; if (!isAuthenticated) return <Navigate to="/login" replace />; if (allowedRoles && !allowedRoles.includes(user?.role)) return <Navigate to="/dashboard" replace />; return children; }
function PublicRoute({ children }) { const { isAuthenticated, loading } = useAuth(); if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent"></div></div>; if (isAuthenticated) return <Navigate to="/dashboard" replace />; return children; }
function App() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/workspaces" element={<Workspaces />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<div className="min-h-screen flex items-center justify-center"><h1 className="text-2xl font-bold text-secondary-900">404 - Not Found</h1></div>} />
    </Routes>
  );
}
export default App;