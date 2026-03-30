import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { storage } from './services/storage';
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

function getUser() {
  const token = localStorage.getItem('token');
  if (!token) return null;
  const p = storage.getProfile();
  return {
    id: 'local',
    username: p.username || localStorage.getItem('ht_user') || '用户',
    email: p.email || localStorage.getItem('ht_email') || '',
    profile: p, dailyGoals: p.dailyGoals,
    points: p.points || 0, streakDays: p.streakDays || 0,
    achievements: p.achievements || [],
    isAdmin: (p.email || localStorage.getItem('ht_email')) === 'admin@health.com'
  };
}

function AuthProvider({ children }) {
  const [user, setUser] = useState(getUser);

  const login = useCallback((email) => {
    localStorage.setItem('token', 'local');
    localStorage.setItem('ht_email', email);
    localStorage.setItem('ht_user', email.split('@')[0]);
    setUser(getUser());
  }, []);

  const register = useCallback((username, email) => {
    storage.updateProfile({ username, email });
    localStorage.setItem('token', 'local');
    localStorage.setItem('ht_email', email);
    localStorage.setItem('ht_user', username);
    setUser(getUser());
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('ht_email');
    localStorage.removeItem('ht_user');
    setUser(null);
  }, []);

  const updateProfile = useCallback((data, goals) => {
    storage.updateProfile({ ...data, dailyGoals: goals });
    setUser(getUser());
  }, []);

  const refreshUser = useCallback(() => setUser(getUser()), []);

  const value = useMemo(() => ({ user, login, register, logout, updateProfile, refreshUser }), [user, login, register, logout, updateProfile, refreshUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function Guard({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function App() {
  const user = getUser();
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
          <Route path="/register" element={user ? <Navigate to="/" replace /> : <Register />} />
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
        {user && <Navbar />}
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
