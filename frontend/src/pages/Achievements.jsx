import { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { analysisAPI } from '../services/api';

export default function Achievements() {
  const { user } = useAuth();
  const [analysis, setAnalysis] = useState(null);

  useEffect(() => loadData(), []);

  const loadData = async () => {
    try {
      const data = await analysisAPI.getAnalysis();
      setAnalysis(data);
    } catch (err) {
      console.error(err);
    }
  };

  const allAchievements = [
    { id: 'first_meal', name: '初次记录', description: '记录第一餐', icon: '🍽️' },
    { id: 'week_streak', name: '坚持不懈', description: '连续打卡7天', icon: '🔥' },
    { id: 'month_streak', name: '月度达人', description: '连续打卡30天', icon: '🏆' },
    { id: 'hundred_meals', name: '百餐记录', description: '累计记录100餐', icon: '💯' },
    { id: 'calorie_master', name: '热量掌控', description: '连续3天热量达标', icon: '📊' },
    { id: 'photo_recognizer', name: '智能识别', description: '使用拍照识别5次', icon: '📸' },
    { id: 'water_champion', name: '饮水达人', description: '连续7天饮水达标', icon: '💧' },
    { id: 'balanced_diet', name: '均衡饮食', description: '连续3天营养均衡', icon: '🥗' },
    { id: 'early_bird', name: '早起鸟儿', description: '连续7天记录早餐', icon: '🐦' },
    { id: 'weight_goal', name: '目标达成', description: '体重达到目标', icon: '🎯' }
  ];

  const unlockedIds = user?.achievements?.map(a => a.id) || [];

  return (
    <div className="app-container">
      <div className="page-header">
        <h1>🏆 成就系统</h1>
        <p>解锁成就，获得积分</p>
      </div>

      <div className="page-content">
        <div className="glass-card" style={{ marginBottom: 24, textAlign: 'center', padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 32 }}>
            <div>
              <div style={{ fontSize: 36, fontWeight: 700, color: 'var(--accent-yellow)' }}>
                {user?.points || 0}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>总积分</div>
            </div>
            <div>
              <div style={{ fontSize: 36, fontWeight: 700, color: 'var(--accent-blue)' }}>
                {user?.streakDays || 0}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>连续天数</div>
            </div>
            <div>
              <div style={{ fontSize: 36, fontWeight: 700, color: 'var(--accent-green)' }}>
                {unlockedIds.length}/{allAchievements.length}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>已解锁</div>
            </div>
          </div>
        </div>

        <h3 className="section-title">全部成就</h3>
        <div className="achievement-grid">
          {allAchievements.map(achievement => {
            const isUnlocked = unlockedIds.includes(achievement.id);
            return (
              <div
                key={achievement.id}
                className={`achievement-card ${isUnlocked ? '' : 'locked'}`}
              >
                <div className="achievement-icon">{achievement.icon}</div>
                <div className="achievement-name">{achievement.name}</div>
                <div className="achievement-desc">{achievement.description}</div>
                {isUnlocked && (
                  <div style={{ marginTop: 8 }}>
                    <span className="chip chip-green">✅ 已解锁</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {analysis && (
          <div className="glass-card" style={{ marginTop: 24 }}>
            <h3 className="section-title">📈 积分规则</h3>
            <div style={{ fontSize: 14, color: 'var(--text-tertiary)', lineHeight: 2 }}>
              <div>• 记录一餐：+5 积分</div>
              <div>• 饮水打卡：+2 积分</div>
              <div>• 解锁成就：+20 积分</div>
              <div>• 连续打卡：额外奖励</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
