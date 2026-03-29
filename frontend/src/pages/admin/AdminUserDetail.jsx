import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import { format } from 'date-fns';

export default function AdminUserDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, [id]);

  const loadUser = async () => {
    try {
      const result = await adminAPI.getUserDetail(id);
      setData(result);
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

  if (!data) {
    return (
      <div className="app-container">
        <div className="page-content">
          <div className="empty-state">
            <div className="empty-state-icon">❌</div>
            <div className="empty-state-text">用户不存在</div>
          </div>
        </div>
      </div>
    );
  }

  const { user, recentFoods, recentWaters, todaySummary } = data;
  const bmi = user.profile?.height && user.profile?.weight
    ? (user.profile.weight / Math.pow(user.profile.height / 100, 2)).toFixed(1)
    : null;

  return (
    <div className="app-container">
      <div className="page-header">
        <h1>👤 用户详情</h1>
        <p>{user.username}</p>
      </div>

      <div className="page-content">
        <Link to="/admin/users" className="btn btn-secondary" style={{ textDecoration: 'none', marginBottom: 16, display: 'inline-flex' }}>
          ← 返回用户列表
        </Link>

        <div className="profile-section">
          <div className="profile-header">
            <div className="profile-avatar" style={{
              background: user.isAdmin ? 'linear-gradient(135deg, #ff9500, #ff2d55)' : undefined
            }}>
              {user.username?.charAt(0)?.toUpperCase()}
            </div>
            <div className="profile-info">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {user.username}
                {user.isAdmin && <span className="chip chip-orange" style={{ fontSize: 10 }}>管理员</span>}
                {!user.isActive && <span className="chip" style={{ fontSize: 10, background: 'rgba(255,59,48,0.15)', color: 'var(--accent-red)' }}>已禁用</span>}
              </h3>
              <p>{user.email}</p>
              <p style={{ marginTop: 4 }}>注册于 {format(new Date(user.createdAt), 'yyyy-MM-dd HH:mm')}</p>
            </div>
          </div>

          <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
            <div className="stat-card">
              <div className="stat-value" style={{ color: 'var(--accent-yellow)' }}>{user.points}</div>
              <div className="stat-label">积分</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{ color: 'var(--accent-orange)' }}>{user.streakDays}</div>
              <div className="stat-label">连续天数</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{ color: 'var(--accent-green)' }}>{user.achievements?.length || 0}</div>
              <div className="stat-label">成就</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{bmi || '--'}</div>
              <div className="stat-label">BMI</div>
            </div>
          </div>
        </div>

        <h3 className="section-title">📋 个人信息</h3>
        <div className="glass-card" style={{ marginBottom: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>身高</div>
              <div style={{ fontSize: 16, fontWeight: 600 }}>{user.profile?.height || '--'} cm</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>体重</div>
              <div style={{ fontSize: 16, fontWeight: 600 }}>{user.profile?.weight || '--'} kg</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>目标体重</div>
              <div style={{ fontSize: 16, fontWeight: 600 }}>{user.profile?.targetWeight || '--'} kg</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>年龄</div>
              <div style={{ fontSize: 16, fontWeight: 600 }}>{user.profile?.age || '--'} 岁</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>性别</div>
              <div style={{ fontSize: 16, fontWeight: 600 }}>
                {user.profile?.gender === 'male' ? '男' : user.profile?.gender === 'female' ? '女' : '--'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>活动水平</div>
              <div style={{ fontSize: 16, fontWeight: 600 }}>
                {{ sedentary: '久坐', light: '轻度', moderate: '中度', active: '高度', very_active: '活跃' }[user.profile?.activityLevel] || '--'}
              </div>
            </div>
          </div>
          <div style={{ marginTop: 16, padding: 12, background: 'var(--bg-primary)', borderRadius: 12 }}>
            <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 8 }}>每日目标</div>
            <div style={{ display: 'flex', gap: 24 }}>
              <div>
                <span style={{ fontWeight: 600, color: 'var(--accent-orange)' }}>{user.dailyGoals?.calories || 1500}</span>
                <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}> kcal</span>
              </div>
              <div>
                <span style={{ fontWeight: 600, color: 'var(--accent-blue)' }}>{user.dailyGoals?.water || 2000}</span>
                <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}> ml</span>
              </div>
            </div>
          </div>
        </div>

        <h3 className="section-title">📊 今日概况</h3>
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
          <div className="stat-card" style={{ borderLeft: '4px solid var(--accent-orange)' }}>
            <div className="stat-value">{todaySummary.calories}</div>
            <div className="stat-label">今日热量(kcal)</div>
          </div>
          <div className="stat-card" style={{ borderLeft: '4px solid var(--accent-green)' }}>
            <div className="stat-value">{todaySummary.meals}</div>
            <div className="stat-label">今日餐数</div>
          </div>
        </div>

        {recentFoods.length > 0 && (
          <>
            <h3 className="section-title" style={{ marginTop: 24 }}>🍽️ 最近饮食记录</h3>
            <div className="glass-card">
              {recentFoods.map((entry, i) => (
                <div key={i} className="food-item" style={{ border: 'none', borderBottom: i < recentFoods.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                  <div className="food-info">
                    <div className="food-name">
                      {{ breakfast: '🌅', lunch: '☀️', dinner: '🌙', snack: '🍎' }[entry.mealType]}
                      {{ breakfast: '早餐', lunch: '午餐', dinner: '晚餐', snack: '加餐' }[entry.mealType]}
                    </div>
                    <div className="food-detail">
                      {format(new Date(entry.date), 'MM-dd')} · {entry.foods.map(f => f.name).join('、')}
                    </div>
                  </div>
                  <div className="food-calories">{entry.totalCalories} kcal</div>
                </div>
              ))}
            </div>
          </>
        )}

        {recentWaters.length > 0 && (
          <>
            <h3 className="section-title" style={{ marginTop: 24 }}>💧 最近饮水记录</h3>
            <div className="glass-card">
              {recentWaters.map((entry, i) => (
                <div key={i} className="food-item" style={{ border: 'none', borderBottom: i < recentWaters.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                  <div className="food-info">
                    <div className="food-name">💧 {entry.amount}ml</div>
                    <div className="food-detail">{format(new Date(entry.createdAt), 'MM-dd HH:mm')}</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
