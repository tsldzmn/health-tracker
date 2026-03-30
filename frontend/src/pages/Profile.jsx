import { useState } from 'react';
import { useAuth } from '../App';
import { useNavigate, Link } from 'react-router-dom';

export default function Profile() {
  const { user, updateProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    height: user?.profile?.height || '',
    weight: user?.profile?.weight || '',
    targetWeight: user?.profile?.targetWeight || '',
    age: user?.profile?.age || '',
    gender: user?.profile?.gender || '',
    activityLevel: user?.profile?.activityLevel || 'sedentary',
    menstrualCycle: {
      isTracking: user?.profile?.menstrualCycle?.isTracking || false,
      lastPeriod: user?.profile?.menstrualCycle?.lastPeriod
        ? new Date(user.profile.menstrualCycle.lastPeriod).toISOString().split('T')[0]
        : '',
      cycleLength: user?.profile?.menstrualCycle?.cycleLength || 28,
      periodLength: user?.profile?.menstrualCycle?.periodLength || 5
    },
    calories: user?.dailyGoals?.calories || 1500,
    water: user?.dailyGoals?.water || 2000
  });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleMenstrualChange = (field, value) => {
    setForm(prev => ({
      ...prev,
      menstrualCycle: { ...prev.menstrualCycle, [field]: value }
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile(
        {
          height: Number(form.height),
          weight: Number(form.weight),
          targetWeight: Number(form.targetWeight),
          age: Number(form.age),
          gender: form.gender,
          activityLevel: form.activityLevel,
          menstrualCycle: form.menstrualCycle
        },
        {
          calories: Number(form.calories),
          water: Number(form.water)
        }
      );
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

  const bmi = user?.profile?.height && user?.profile?.weight
    ? (user.profile.weight / Math.pow(user.profile.height / 100, 2)).toFixed(1)
    : null;

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
              <div className="profile-stat-value">{user?.streakDays || 0}</div>
              <div className="profile-stat-label">连续天数</div>
            </div>
            <div className="profile-stat">
              <div className="profile-stat-value">{user?.achievements?.length || 0}</div>
              <div className="profile-stat-label">成就</div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 className="section-title" style={{ marginBottom: 0 }}>个人信息</h3>
          <button
            className="btn btn-secondary"
            style={{ padding: '8px 16px', fontSize: 13 }}
            onClick={() => setEditing(!editing)}
          >
            {editing ? '取消' : '编辑'}
          </button>
        </div>

        <div className="glass-card" style={{ marginBottom: 16 }}>
          {editing ? (
            <>
              <div className="input-group">
                <label>身高(cm)</label>
                <input
                  className="input-field"
                  type="number"
                  value={form.height}
                  onChange={(e) => handleChange('height', e.target.value)}
                  placeholder="请输入身高"
                />
              </div>
              <div className="input-group">
                <label>当前体重(kg)</label>
                <input
                  className="input-field"
                  type="number"
                  value={form.weight}
                  onChange={(e) => handleChange('weight', e.target.value)}
                  placeholder="请输入体重"
                />
              </div>
              <div className="input-group">
                <label>目标体重(kg)</label>
                <input
                  className="input-field"
                  type="number"
                  value={form.targetWeight}
                  onChange={(e) => handleChange('targetWeight', e.target.value)}
                  placeholder="请输入目标体重"
                />
              </div>
              <div className="input-group">
                <label>年龄</label>
                <input
                  className="input-field"
                  type="number"
                  value={form.age}
                  onChange={(e) => handleChange('age', e.target.value)}
                  placeholder="请输入年龄"
                />
              </div>
              <div className="input-group">
                <label>性别</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[
                    { value: 'male', label: '男' },
                    { value: 'female', label: '女' }
                  ].map(g => (
                    <button
                      key={g.value}
                      className={`meal-option ${form.gender === g.value ? 'active' : ''}`}
                      onClick={() => handleChange('gender', g.value)}
                      style={{ flex: 1 }}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="input-group">
                <label>活动水平</label>
                <select
                  className="input-field"
                  value={form.activityLevel}
                  onChange={(e) => handleChange('activityLevel', e.target.value)}
                >
                  <option value="sedentary">久坐不动</option>
                  <option value="light">轻度活动</option>
                  <option value="moderate">中度活动</option>
                  <option value="active">高度活动</option>
                  <option value="very_active">非常活跃</option>
                </select>
              </div>

              {form.gender === 'female' && (
                <div style={{ padding: 16, background: 'var(--bg-primary)', borderRadius: 14, marginTop: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <span style={{ fontWeight: 600 }}>🌸 经期追踪</span>
                    <div
                      className={`toggle-switch ${form.menstrualCycle.isTracking ? 'active' : ''}`}
                      onClick={() => handleMenstrualChange('isTracking', !form.menstrualCycle.isTracking)}
                    />
                  </div>
                  {form.menstrualCycle.isTracking && (
                    <>
                      <div className="input-group">
                        <label>上次经期开始日期</label>
                        <input
                          className="input-field"
                          type="date"
                          value={form.menstrualCycle.lastPeriod}
                          onChange={(e) => handleMenstrualChange('lastPeriod', e.target.value)}
                        />
                      </div>
                      <div className="input-group">
                        <label>周期天数</label>
                        <input
                          className="input-field"
                          type="number"
                          value={form.menstrualCycle.cycleLength}
                          onChange={(e) => handleMenstrualChange('cycleLength', Number(e.target.value))}
                        />
                      </div>
                    </>
                  )}
                </div>
              )}

              <div className="input-group" style={{ marginTop: 16 }}>
                <label>每日热量目标(kcal)</label>
                <input
                  className="input-field"
                  type="number"
                  value={form.calories}
                  onChange={(e) => handleChange('calories', e.target.value)}
                />
              </div>
              <div className="input-group">
                <label>每日饮水目标(ml)</label>
                <input
                  className="input-field"
                  type="number"
                  value={form.water}
                  onChange={(e) => handleChange('water', e.target.value)}
                />
              </div>

              <button
                className="btn btn-primary btn-full"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? '保存中...' : '保存'}
              </button>
            </>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 4 }}>身高</div>
                  <div style={{ fontSize: 18, fontWeight: 600 }}>{user?.profile?.height || '--'} cm</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 4 }}>体重</div>
                  <div style={{ fontSize: 18, fontWeight: 600 }}>{user?.profile?.weight || '--'} kg</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 4 }}>目标体重</div>
                  <div style={{ fontSize: 18, fontWeight: 600 }}>{user?.profile?.targetWeight || '--'} kg</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 4 }}>年龄</div>
                  <div style={{ fontSize: 18, fontWeight: 600 }}>{user?.profile?.age || '--'} 岁</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 4 }}>BMI</div>
                  <div style={{ fontSize: 18, fontWeight: 600 }}>{bmi || '--'}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 4 }}>活动水平</div>
                  <div style={{ fontSize: 18, fontWeight: 600 }}>
                    {{ sedentary: '久坐', light: '轻度', moderate: '中度', active: '高度', very_active: '活跃' }[user?.profile?.activityLevel] || '--'}
                  </div>
                </div>
              </div>
              <div style={{ marginTop: 16, padding: 12, background: 'var(--bg-primary)', borderRadius: 12 }}>
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 8 }}>每日目标</div>
                <div style={{ display: 'flex', gap: 24 }}>
                  <div>
                    <span style={{ fontWeight: 600, color: 'var(--accent-orange)' }}>{user?.dailyGoals?.calories || 1500}</span>
                    <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}> kcal</span>
                  </div>
                  <div>
                    <span style={{ fontWeight: 600, color: 'var(--accent-blue)' }}>{user?.dailyGoals?.water || 2000}</span>
                    <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}> ml</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {user?.isAdmin && (
          <Link
            to="/admin"
            className="btn btn-full"
            style={{
              marginTop: 16,
              background: 'linear-gradient(135deg, #ff9500, #ff2d55)',
              color: 'white',
              textDecoration: 'none'
            }}
          >
            ⚙️ 进入管理后台
          </Link>
        )}

        <button
          className="btn btn-danger btn-full"
          onClick={handleLogout}
          style={{ marginTop: 16 }}
        >
          退出登录
        </button>
      </div>
    </div>
  );
}
