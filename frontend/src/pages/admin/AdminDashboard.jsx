import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI } from '../../services/api';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newUser, setNewUser] = useState({ username: '', email: '', password: '' });

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const [s, u] = await Promise.all([adminAPI.getStats(), adminAPI.getUsers()]);
      setStats(s.overview);
      setUsers(u.users || []);
    } catch (e) { console.error(e); }
  };

  const addUser = async () => {
    if (!newUser.username || !newUser.email || !newUser.password) return alert('请填写完整');
    try {
      await adminAPI.addUser(newUser.username, newUser.email, newUser.password);
      setNewUser({ username: '', email: '', password: '' });
      setShowAdd(false);
      load();
    } catch (e) { alert(e.message); }
  };

  const toggleActive = async (id, active) => {
    await adminAPI.updateUser(id, { is_active: active ? 0 : 1 });
    load();
  };

  const deleteUser = async (id, name) => {
    if (!confirm('确定删除用户 "' + name + '" ？此操作不可恢复')) return;
    await adminAPI.deleteUser(id);
    load();
  };

  return (
    <div className="app-container">
      <div className="page-header">
        <h1>⚙️ 管理后台</h1>
        <p>管理所有注册用户</p>
      </div>
      <div className="page-content">
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <Link to="/" className="btn btn-secondary" style={{ textDecoration: 'none' }}>← 返回</Link>
          <button className="btn btn-primary" onClick={() => setShowAdd(!showAdd)}>+ 添加用户</button>
        </div>

        {showAdd && (
          <div className="glass-card" style={{ marginBottom: 16 }}>
            <div className="input-group"><label>用户名</label><input className="input-field" value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})} /></div>
            <div className="input-group"><label>邮箱</label><input className="input-field" type="email" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} /></div>
            <div className="input-group"><label>密码</label><input className="input-field" type="password" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} /></div>
            <button className="btn btn-primary btn-full" onClick={addUser}>创建账号</button>
          </div>
        )}

        {stats && (
          <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', marginBottom: 16 }}>
            <div className="stat-card"><div className="stat-value">{stats.totalUsers}</div><div className="stat-label">总用户</div></div>
            <div className="stat-card"><div className="stat-value">{stats.todayCheckIns}</div><div className="stat-label">今日打卡</div></div>
            <div className="stat-card"><div className="stat-value">{stats.totalFoodEntries}</div><div className="stat-label">饮食记录</div></div>
            <div className="stat-card"><div className="stat-value">{stats.totalWaterEntries}</div><div className="stat-label">饮水记录</div></div>
          </div>
        )}

        <h3 className="section-title">👥 所有用户 ({users.length})</h3>
        {users.map(u => (
          <div key={u.id} className="glass-card" style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: u.is_admin ? 'linear-gradient(135deg,#ff9500,#ff2d55)' : 'linear-gradient(135deg,var(--accent-blue),var(--accent-purple))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700 }}>
                  {u.username?.charAt(0)?.toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 600 }}>{u.username} {u.is_admin ? '👑' : ''} {!u.is_active ? '🚫' : ''}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{u.email}</div>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 12, padding: 10, background: 'var(--bg-primary)', borderRadius: 10 }}>
              <div style={{ textAlign: 'center' }}><div style={{ fontWeight: 700, color: 'var(--accent-orange)' }}>{u.todayCalories}</div><div style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>今日热量</div></div>
              <div style={{ textAlign: 'center' }}><div style={{ fontWeight: 700, color: 'var(--accent-blue)' }}>{u.todayWater}</div><div style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>今日饮水</div></div>
              <div style={{ textAlign: 'center' }}><div style={{ fontWeight: 700 }}>{u.height > 0 ? u.height + 'cm' : '-'}</div><div style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>身高</div></div>
              <div style={{ textAlign: 'center' }}><div style={{ fontWeight: 700 }}>{u.weight > 0 ? u.weight + 'kg' : '-'}</div><div style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>体重</div></div>
            </div>

            <div style={{ display: 'flex', gap: 6 }}>
              <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: 12 }} onClick={() => toggleActive(u.id, u.is_active)}>
                {u.is_active ? '禁用' : '启用'}
              </button>
              {!u.is_admin && (
                <button className="btn btn-danger" style={{ padding: '6px 12px', fontSize: 12 }} onClick={() => deleteUser(u.id, u.username)}>删除</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
