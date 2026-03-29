import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI } from '../../services/api';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await adminAPI.getStats();
      setStats(data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="app-container">
        <div className="loading"><div className="spinner"></div></div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="page-header">
        <h1>📊 管理后台</h1>
        <p>数据概览和系统管理</p>
      </div>

      <div className="page-content">
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          <Link to="/admin/users" className="btn btn-primary" style={{ flex: 1, textDecoration: 'none' }}>
            👥 用户管理
          </Link>
          <Link to="/" className="btn btn-secondary" style={{ flex: 1, textDecoration: 'none' }}>
            🏠 返回首页
          </Link>
        </div>

        {stats && (
          <>
            <h3 className="section-title">📈 数据概览</h3>
            <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
              <div className="stat-card" style={{ borderLeft: '4px solid var(--accent-blue)' }}>
                <div className="stat-value">{stats.overview.totalUsers}</div>
                <div className="stat-label">总用户数</div>
              </div>
              <div className="stat-card" style={{ borderLeft: '4px solid var(--accent-green)' }}>
                <div className="stat-value">{stats.overview.activeUsers}</div>
                <div className="stat-label">活跃用户</div>
              </div>
              <div className="stat-card" style={{ borderLeft: '4px solid var(--accent-orange)' }}>
                <div className="stat-value">{stats.overview.todayCheckIns}</div>
                <div className="stat-label">今日打卡</div>
              </div>
              <div className="stat-card" style={{ borderLeft: '4px solid var(--accent-purple)' }}>
                <div className="stat-value">{stats.overview.weeklyActiveUsers}</div>
                <div className="stat-label">周活跃</div>
              </div>
            </div>

            <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginTop: 12 }}>
              <div className="stat-card">
                <div className="stat-value" style={{ fontSize: 18 }}>{stats.overview.totalFoodEntries}</div>
                <div className="stat-label">饮食记录</div>
              </div>
              <div className="stat-card">
                <div className="stat-value" style={{ fontSize: 18 }}>{stats.overview.totalWaterEntries}</div>
                <div className="stat-label">饮水记录</div>
              </div>
              <div className="stat-card">
                <div className="stat-value" style={{ fontSize: 18 }}>{stats.overview.adminUsers}</div>
                <div className="stat-label">管理员</div>
              </div>
            </div>

            {stats.topFoods.length > 0 && (
              <>
                <h3 className="section-title" style={{ marginTop: 24 }}>🍽️ 热门食物 TOP10</h3>
                <div className="glass-card">
                  {stats.topFoods.map((food, i) => (
                    <div key={i} className="food-item" style={{ border: 'none', borderBottom: i < stats.topFoods.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                      <div className="food-info">
                        <div className="food-name">
                          <span style={{ color: 'var(--accent-orange)', marginRight: 8 }}>#{i + 1}</span>
                          {food._id}
                        </div>
                      </div>
                      <div className="food-calories">{food.count} 次</div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {stats.monthlyStats.length > 0 && (
              <>
                <h3 className="section-title" style={{ marginTop: 24 }}>📅 近30天活跃趋势</h3>
                <div className="glass-card" style={{ overflowX: 'auto' }}>
                  <div style={{ display: 'flex', gap: 4, minWidth: 600, alignItems: 'flex-end', height: 120, padding: '0 8px' }}>
                    {stats.monthlyStats.map((day, i) => {
                      const maxEntries = Math.max(...stats.monthlyStats.map(d => d.entries));
                      const height = maxEntries > 0 ? (day.entries / maxEntries) * 100 : 0;
                      return (
                        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                          <div
                            style={{
                              width: '100%',
                              maxWidth: 20,
                              height: `${height}%`,
                              minHeight: height > 0 ? 4 : 0,
                              background: 'linear-gradient(180deg, var(--accent-blue), var(--accent-teal))',
                              borderRadius: 4,
                              transition: 'height 0.3s ease'
                            }}
                            title={`${day.date}: ${day.entries}条记录, ${day.activeUsers}活跃用户`}
                          />
                          {i % 5 === 0 && (
                            <span style={{ fontSize: 9, color: 'var(--text-tertiary)', transform: 'rotate(-45deg)' }}>
                              {day.date.slice(5)}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
