import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError('请填写邮箱和密码'); return; }
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="auth-container">
      <div className="auth-logo">
        <div className="auth-logo-icon">🥗</div>
        <h1>健康追踪</h1>
        <p>记录饮食，管理健康</p>
      </div>
      <form className="auth-form" onSubmit={handleSubmit}>
        {error && <div className="toast" style={{ position: 'static', marginBottom: 16 }}>{error}</div>}
        <div className="input-group">
          <label>邮箱</label>
          <input className="input-field" type="email" placeholder="请输入邮箱" value={email} onChange={e => setEmail(e.target.value)} required />
        </div>
        <div className="input-group">
          <label>密码</label>
          <input className="input-field" type="password" placeholder="请输入密码" value={password} onChange={e => setPassword(e.target.value)} required />
        </div>
        <button className="btn btn-primary btn-full" type="submit" disabled={loading}>
          {loading ? '登录中...' : '登录'}
        </button>
        <div className="auth-link">还没有账号？<Link to="/register">立即注册</Link></div>
      </form>
    </div>
  );
}
