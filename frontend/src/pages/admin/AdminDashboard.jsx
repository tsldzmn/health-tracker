import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../App';

export default function AdminDashboard() {
  const { user } = useAuth();
  const d = JSON.parse(localStorage.getItem('ht_daily_' + new Date().toISOString().split('T')[0]) || '{"food":[],"water":[]}');

  return (
    <div className="app-container">
      <div className="page-header">
        <h1>📊 管理后台</h1>
        <p>当前用户数据概览</p>
      </div>

      <div className="page-content">
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          <Link to="/" className="btn btn-primary" style={{ flex: 1, textDecoration: 'none' }}>
            🏠 返回首页
          </Link>
        </div>

        <h3 className="section-title">📈 今日数据</h3>
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
          <div className="stat-card" style={{ borderLeft: '4px solid var(--accent-orange)' }}>
            <div className="stat-value">{d.food.length}</div>
            <div className="stat-label">饮食记录数</div>
          </div>
          <div className="stat-card" style={{ borderLeft: '4px solid var(--accent-blue)' }}>
            <div className="stat-value">{d.water.length}</div>
            <div className="stat-label">饮水记录数</div>
          </div>
          <div className="stat-card" style={{ borderLeft: '4px solid var(--accent-green)' }}>
            <div className="stat-value">{d.food.reduce((s, f) => s + (f.calories || 0), 0)}</div>
            <div className="stat-label">总热量(kcal)</div>
          </div>
          <div className="stat-card" style={{ borderLeft: '4px solid var(--accent-teal)' }}>
            <div className="stat-value">{d.water.reduce((s, w) => s + (w.amount || 0), 0)}</div>
            <div className="stat-label">总饮水(ml)</div>
          </div>
        </div>

        <h3 className="section-title" style={{ marginTop: 24 }}>👤 当前用户</h3>
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontWeight: 600 }}>{user?.username}</span>
            <span style={{ color: 'var(--text-tertiary)', fontSize: 14 }}>{user?.email}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--accent-yellow)' }}>{user?.points || 0}</div>
              <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>积分</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--accent-blue)' }}>{user?.streak_days || 0}</div>
              <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>连续天数</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--accent-green)' }}>{user?.calorie_goal || 1500}</div>
              <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>日目标</div>
            </div>
          </div>
        </div>

        {d.food.length > 0 && (
          <>
            <h3 className="section-title" style={{ marginTop: 24 }}>🍽️ 今日饮食记录</h3>
            <div className="glass-card">
              {d.food.map((f, i) => (
                <div key={i} className="food-item" style={{ border: 'none', borderBottom: i < d.food.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                  <div className="food-info">
                    <div className="food-name">{f.food_name || f.name}</div>
                    <div className="food-detail">{{ breakfast: '早餐', lunch: '午餐', dinner: '晚餐', snack: '加餐' }[f.meal_type] || '记录'} · {f.amount}g</div>
                  </div>
                  <div className="food-calories">{Math.round(f.calories || 0)} kcal</div>
                </div>
              ))}
            </div>
          </>
        )}

        {d.water.length > 0 && (
          <>
            <h3 className="section-title" style={{ marginTop: 24 }}>💧 今日饮水记录</h3>
            <div className="glass-card">
              {d.water.map((w, i) => (
                <div key={i} className="food-item" style={{ border: 'none', borderBottom: i < d.water.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                  <div className="food-info">
                    <div className="food-name">💧 {w.amount}ml</div>
                    <div className="food-detail">{new Date(w.created_at).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</div>
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
