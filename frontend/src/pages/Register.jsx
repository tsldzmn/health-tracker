import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../App';

export default function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const { register } = useAuth();

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) { setError('两次密码不一致'); return; }
    if (password.length < 6) { setError('密码至少6位'); return; }
    register(username, email);
  };

  return (
    <div className="auth-container">
      <div className="auth-logo">
        <div className="auth-logo-icon">🥗</div>
        <h1>创建账号</h1>
        <p>开始你的健康之旅</p>
      </div>
      <form className="auth-form" onSubmit={handleSubmit}>
        {error && <div className="toast" style={{ position: 'static', marginBottom: 16 }}>{error}</div>}
        <div className="input-group">
          <label>用户名</label>
          <input className="input-field" type="text" placeholder="请输入用户名" value={username} onChange={e => setUsername(e.target.value)} required />
        </div>
        <div className="input-group">
          <label>邮箱</label>
          <input className="input-field" type="email" placeholder="请输入邮箱" value={email} onChange={e => setEmail(e.target.value)} required />
        </div>
        <div className="input-group">
          <label>密码</label>
          <input className="input-field" type="password" placeholder="请输入密码（至少6位）" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
        </div>
        <div className="input-group">
          <label>确认密码</label>
          <input className="input-field" type="password" placeholder="请再次输入密码" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
        </div>
        <button className="btn btn-primary btn-full" type="submit">注册</button>
        <div className="auth-link">已有账号？<Link to="/login">立即登录</Link></div>
      </form>
    </div>
  );
}
