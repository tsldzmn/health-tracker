import { useState } from 'react';
import { useAuth } from '../App';
import { useNavigate, Link } from 'react-router-dom';

export default function Profile() {
  const { user, updateProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    height: user?.height || '',
    weight: user?.weight || '',
    target_weight: user?.target_weight || '',
    age: user?.age || '',
    gender: user?.gender || '',
    activity_level: user?.activity_level || 'sedentary',
    calorie_goal: user?.calorie_goal || 1500,
    water_goal: user?.water_goal || 2000
  });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile({
        height: Number(form.height) || 0,
        weight: Number(form.weight) || 0,
        target_weight: Number(form.target_weight) || 0,
        age: Number(form.age) || 0,
        gender: form.gender,
        activity_level: form.activity_level,
        calorie_goal: Number(form.calorie_goal) || 1500,
        water_goal: Number(form.water_goal) || 2000
      });
      setEditing(false);
      setSuccess('保存成功！');
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      console.error(err);
    }
    setSaving(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const bmi = user?.height > 0 && user?.weight > 0
    ? (user.weight / Math.pow(user.height / 100, 2)).toFixed(1)
    : null;

  const activityLabels = { sedentary: '久坐', light: '轻度', moderate: '中度', active: '高度', very_active: '活跃' };

  return (
    <div className="app-container">
      <div className="page-header">
        <h1>👤 个人中心</h1>
        <p>管理你的个人信息</p>
      </div>

      <div className="page-content">
        {success && <div className="toast">{success}</div>}

        <div className="profile-section">
          <div className="profile-header">
            <div className="profile-avatar">
              {user?.username?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div className="profile-info">
              <h3>{user?.username}</h3>
              <p>{user?.email}</p>
            </div>
          </div>
          <div className="profile-stats">
            <div className="profile-stat">
              <div className="profile-stat-value">{user?.points || 0}</div>
              <div className="profile-stat-label">积分</div>
            </div>
            <div className="profile-stat">
              <div className="profile-stat-value">{user?.streak_days || 0}</div>
              <div className="profile-stat-label">连续天数</div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 className="section-title" style={{ marginBottom: 0 }}>个人信息</h3>
          <button className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: 13 }} onClick={() => setEditing(!editing)}>
            {editing ? '取消' : '编辑'}
          </button>
        </div>

        <div className="glass-card" style={{ marginBottom: 16 }}>
          {editing ? (
            <>
              <div className="input-group">
                <label>身高(cm)</label>
                <input className="input-field" type="number" value={form.height} onChange={e => handleChange('height', e.target.value)} placeholder="请输入身高" />
              </div>
              <div className="input-group">
                <label>当前体重(kg)</label>
                <input className="input-field" type="number" value={form.weight} onChange={e => handleChange('weight', e.target.value)} placeholder="请输入体重" />
              </div>
              <div className="input-group">
                <label>目标体重(kg)</label>
                <input className="input-field" type="number" value={form.target_weight} onChange={e => handleChange('target_weight', e.target.value)} placeholder="请输入目标体重" />
              </div>
              <div className="input-group">
                <label>年龄</label>
                <input className="input-field" type="number" value={form.age} onChange={e => handleChange('age', e.target.value)} placeholder="请输入年龄" />
              </div>
              <div className="input-group">
                <label>性别</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[{ value: 'male', label: '男' }, { value: 'female', label: '女' }].map(g => (
                    <button key={g.value} className={`meal-option ${form.gender === g.value ? 'active' : ''}`} onClick={() => handleChange('gender', g.value)} style={{ flex: 1 }}>
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="input-group">
                <label>活动水平</label>
                <select className="input-field" value={form.activity_level} onChange={e => handleChange('activity_level', e.target.value)}>
                  <option value="sedentary">久坐不动</option>
                  <option value="light">轻度活动</option>
                  <option value="moderate">中度活动</option>
                  <option value="active">高度活动</option>
                  <option value="very_active">非常活跃</option>
                </select>
              </div>
              <div className="input-group" style={{ marginTop: 16 }}>
                <label>每日热量目标(kcal)</label>
                <input className="input-field" type="number" value={form.calorie_goal} onChange={e => handleChange('calorie_goal', e.target.value)} />
              </div>
              <div className="input-group">
                <label>每日饮水目标(ml)</label>
                <input className="input-field" type="number" value={form.water_goal} onChange={e => handleChange('water_goal', e.target.value)} />
              </div>
              <button className="btn btn-primary btn-full" onClick={handleSave} disabled={saving}>
                {saving ? '保存中...' : '保存'}
              </button>
            </>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 4 }}>身高</div>
                  <div style={{ fontSize: 18, fontWeight: 600 }}>{user?.height > 0 ? `${user.height} cm` : '--'}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 4 }}>体重</div>
                  <div style={{ fontSize: 18, fontWeight: 600 }}>{user?.weight > 0 ? `${user.weight} kg` : '--'}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 4 }}>目标体重</div>
                  <div style={{ fontSize: 18, fontWeight: 600 }}>{user?.target_weight > 0 ? `${user.target_weight} kg` : '--'}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 4 }}>年龄</div>
                  <div style={{ fontSize: 18, fontWeight: 600 }}>{user?.age > 0 ? `${user.age} 岁` : '--'}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 4 }}>BMI</div>
                  <div style={{ fontSize: 18, fontWeight: 600 }}>{bmi || '--'}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 4 }}>活动水平</div>
                  <div style={{ fontSize: 18, fontWeight: 600 }}>{activityLabels[user?.activity_level] || '--'}</div>
                </div>
              </div>
              <div style={{ marginTop: 16, padding: 12, background: 'var(--bg-primary)', borderRadius: 12 }}>
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 8 }}>每日目标</div>
                <div style={{ display: 'flex', gap: 24 }}>
                  <div>
                    <span style={{ fontWeight: 600, color: 'var(--accent-orange)' }}>{user?.calorie_goal || 1500}</span>
                    <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}> kcal</span>
                  </div>
                  <div>
                    <span style={{ fontWeight: 600, color: 'var(--accent-blue)' }}>{user?.water_goal || 2000}</span>
                    <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}> ml</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {user?.is_admin === 1 && (
          <Link to="/admin" className="btn btn-full" style={{ marginTop: 16, background: 'linear-gradient(135deg, #ff9500, #ff2d55)', color: 'white', textDecoration: 'none' }}>
            ⚙️ 进入管理后台
          </Link>
        )}

        <button className="btn btn-danger btn-full" onClick={handleLogout} style={{ marginTop: 16 }}>
          退出登录
        </button>
      </div>
    </div>
  );
}
