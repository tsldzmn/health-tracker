import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI } from '../../services/api';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  useEffect(() => {
    loadUsers();
  }, [page, search]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await adminAPI.getUsers(page, 20, search);
      setUsers(data.users);
      setTotalPages(data.pages);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleSearch = () => {
    setSearch(searchInput);
    setPage(1);
  };

  const toggleAdmin = async (userId, currentIsAdmin) => {
    try {
      await adminAPI.updateUser(userId, { isAdmin: !currentIsAdmin });
      loadUsers();
    } catch (err) {
      alert(err.message);
    }
  };

  const toggleActive = async (userId, currentIsActive) => {
    try {
      await adminAPI.updateUser(userId, { isActive: !currentIsActive });
      loadUsers();
    } catch (err) {
      alert(err.message);
    }
  };

  const deleteUser = async (userId, username) => {
    if (!confirm(`确定要删除用户 "${username}" 吗？此操作不可恢复！`)) return;
    try {
      await adminAPI.deleteUser(userId);
      loadUsers();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="app-container">
      <div className="page-header">
        <h1>👥 用户管理</h1>
        <p>管理所有注册用户</p>
      </div>

      <div className="page-content">
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <Link to="/admin" className="btn btn-secondary" style={{ textDecoration: 'none' }}>
            ← 返回
          </Link>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <input
            className="input-field"
            placeholder="搜索用户名或邮箱..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            style={{ flex: 1 }}
          />
          <button className="btn btn-primary" onClick={handleSearch}>搜索</button>
        </div>

        {loading ? (
          <div className="loading"><div className="spinner"></div></div>
        ) : (
          <>
            <div style={{ fontSize: 13, color: 'var(--text-tertiary)', marginBottom: 12 }}>
              共 {users.length} 个用户
            </div>

            {users.map(user => (
              <div key={user._id} className="glass-card" style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: '50%',
                        background: user.isAdmin ? 'linear-gradient(135deg, #ff9500, #ff2d55)' : 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', fontWeight: 700, fontSize: 16
                      }}>
                        {user.username?.charAt(0)?.toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                          {user.username}
                          {user.isAdmin && <span className="chip chip-orange" style={{ padding: '2px 8px', fontSize: 10 }}>管理员</span>}
                          {!user.isActive && <span className="chip chip-orange" style={{ padding: '2px 8px', fontSize: 10, background: 'rgba(255,59,48,0.15)', color: 'var(--accent-red)' }}>已禁用</span>}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{user.email}</div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 12 }}>
                      <span>📝 饮食{user.stats.foodCount}条</span>
                      <span>💧 饮水{user.stats.waterCount}条</span>
                      <span>⭐ {user.points}积分</span>
                      <span>🔥 {user.streakDays}天</span>
                    </div>

                    <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                      注册: {new Date(user.createdAt).toLocaleDateString('zh-CN')}
                      {user.lastCheckIn && ` | 最后打卡: ${new Date(user.lastCheckIn).toLocaleDateString('zh-CN')}`}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 6, marginTop: 12, flexWrap: 'wrap' }}>
                  <Link
                    to={`/admin/users/${user._id}`}
                    className="btn btn-primary"
                    style={{ padding: '6px 12px', fontSize: 12, textDecoration: 'none' }}
                  >
                    详情
                  </Link>
                  <button
                    className="btn btn-secondary"
                    style={{ padding: '6px 12px', fontSize: 12 }}
                    onClick={() => toggleAdmin(user._id, user.isAdmin)}
                  >
                    {user.isAdmin ? '取消管理员' : '设为管理员'}
                  </button>
                  <button
                    className="btn"
                    style={{
                      padding: '6px 12px', fontSize: 12,
                      background: user.isActive ? 'rgba(255,149,0,0.15)' : 'rgba(52,199,89,0.15)',
                      color: user.isActive ? 'var(--accent-orange)' : 'var(--accent-green)'
                    }}
                    onClick={() => toggleActive(user._id, user.isActive)}
                  >
                    {user.isActive ? '禁用' : '启用'}
                  </button>
                  <button
                    className="btn btn-danger"
                    style={{ padding: '6px 12px', fontSize: 12 }}
                    onClick={() => deleteUser(user._id, user.username)}
                  >
                    删除
                  </button>
                </div>
              </div>
            ))}

            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
                <button
                  className="btn btn-secondary"
                  disabled={page <= 1}
                  onClick={() => setPage(p => p - 1)}
                >
                  上一页
                </button>
                <span style={{ display: 'flex', alignItems: 'center', padding: '0 12px' }}>
                  {page} / {totalPages}
                </span>
                <button
                  className="btn btn-secondary"
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => p + 1)}
                >
                  下一页
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
