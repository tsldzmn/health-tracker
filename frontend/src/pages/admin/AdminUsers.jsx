import { Link } from 'react-router-dom';
import { useAuth } from '../../App';

export default function AdminUsers() {
  const { user } = useAuth();

  return (
    <div className="app-container">
      <div className="page-header">
        <h1>👤 用户管理</h1>
        <p>当前登录用户信息</p>
      </div>

      <div className="page-content">
        <Link to="/admin" className="btn btn-secondary" style={{ textDecoration: 'none', marginBottom: 16, display: 'inline-flex' }}>
          ← 返回管理后台
        </Link>

        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{
              width: 48, height: 48, borderRadius: '50%',
              background: user?.is_admin ? 'linear-gradient(135deg, #ff9500, #ff2d55)' : 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontWeight: 700, fontSize: 20
            }}>
              {user?.username?.charAt(0)?.toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 18 }}>{user?.username}</div>
              <div style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>{user?.email}</div>
            </div>
            {user?.is_admin === 1 && (
              <span className="chip chip-orange" style={{ marginLeft: 'auto' }}>管理员</span>
            )}
          </div>

          <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
            <div className="stat-card">
              <div className="stat-value" style={{ color: 'var(--accent-yellow)', fontSize: 18 }}>{user?.points || 0}</div>
              <div className="stat-label">积分</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{ color: 'var(--accent-blue)', fontSize: 18 }}>{user?.streak_days || 0}</div>
              <div className="stat-label">连续天数</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{ fontSize: 18 }}>{user?.calorie_goal || 1500}</div>
              <div className="stat-label">热量目标</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{ fontSize: 18 }}>{user?.water_goal || 2000}</div>
              <div className="stat-label">饮水目标</div>
            </div>
          </div>

          <div style={{ marginTop: 16, padding: 12, background: 'var(--bg-primary)', borderRadius: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>身高</div>
                <div style={{ fontWeight: 600 }}>{user?.height > 0 ? `${user.height} cm` : '未设置'}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>体重</div>
                <div style={{ fontWeight: 600 }}>{user?.weight > 0 ? `${user.weight} kg` : '未设置'}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>年龄</div>
                <div style={{ fontWeight: 600 }}>{user?.age > 0 ? `${user.age} 岁` : '未设置'}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>性别</div>
                <div style={{ fontWeight: 600 }}>{user?.gender === 'male' ? '男' : user?.gender === 'female' ? '女' : '未设置'}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="glass-card" style={{ marginTop: 16 }}>
          <h3 className="section-title" style={{ marginBottom: 12 }}>💾 数据存储模式</h3>
          <div style={{ fontSize: 14, color: 'var(--text-tertiary)', lineHeight: 1.8 }}>
            <p>当前使用 <strong>localStorage</strong> 本地存储模式</p>
            <p>• 数据保存在浏览器中，刷新不丢失</p>
            <p>• 每天0点自动重置当日数据</p>
            <p>• 部署到自有服务器后可启用MySQL云端存储</p>
          </div>
        </div>
      </div>
    </div>
  );
}
