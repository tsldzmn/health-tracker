import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { authAPI } from './services/api';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import FoodLog from './pages/FoodLog';
import WaterLog from './pages/WaterLog';
import Achievements from './pages/Achievements';
import Profile from './pages/Profile';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminUserDetail from './pages/admin/AdminUserDetail';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      authAPI.getMe().then(data => {
        setUser(data.user);
      }).catch(() => {
        localStorage.removeItem('token');
      }).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await authAPI.login(email, password);
    localStorage.setItem('token', data.token);
    setUser(data.user);
    return data;
  }, []);

  const register = useCallback(async (username, email, password) => {
    const data = await authAPI.register(username, email, password);
    localStorage.setItem('token', data.token);
    setUser(data.user);
    return data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setUser(null);
  }, []);

  const updateProfile = useCallback(async (profileData) => {
    await authAPI.updateProfile(profileData);
    const data = await authAPI.getMe();
    setUser(data.user);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const data = await authAPI.getMe();
      setUser(data.user);
    } catch {}
  }, []);

  const value = useMemo(() => ({ user, loading, login, register, logout, updateProfile, refreshUser }), [user, loading, login, register, logout, updateProfile, refreshUser]);

  if (loading) return <div className="loading"><div className="spinner"></div></div>;

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function Guard({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<Guard><Dashboard /></Guard>} />
          <Route path="/food" element={<Guard><FoodLog /></Guard>} />
          <Route path="/water" element={<Guard><WaterLog /></Guard>} />
          <Route path="/achievements" element={<Guard><Achievements /></Guard>} />
          <Route path="/profile" element={<Guard><Profile /></Guard>} />
          <Route path="/admin" element={<Guard><AdminDashboard /></Guard>} />
          <Route path="/admin/users" element={<Guard><AdminUsers /></Guard>} />
          <Route path="/admin/users/:id" element={<Guard><AdminUserDetail /></Guard>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <NavbarWrapper />
      </AuthProvider>
    </BrowserRouter>
  );
}

function NavbarWrapper() {
  const { user } = useAuth();
  return user ? <Navbar /> : null;
}
