import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { foodAPI, waterAPI, analysisAPI } from '../services/api';
import { format, addDays, subDays } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export default function Dashboard() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [foodData, setFoodData] = useState(null);
  const [waterData, setWaterData] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);

  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  const isToday = format(new Date(), 'yyyy-MM-dd') === dateStr;

  useEffect(() => {
    loadData();
  }, [selectedDate]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [food, water, analysisData] = await Promise.all([
        foodAPI.getDaily(dateStr),
        waterAPI.getDaily(dateStr),
        analysisAPI.getAnalysis()
      ]);
      setFoodData(food);
      setWaterData(water);
      setAnalysis(analysisData);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const addWater = async (amount) => {
    try {
      const data = await waterAPI.add(amount);
      setWaterData(prev => ({
        ...prev,
        total: data.totalToday,
        percentage: data.percentage
      }));
    } catch (err) {
      console.error(err);
    }
  };

  const caloriePercentage = foodData ? Math.min((foodData.summary.totalCalories / foodData.goals.calories) * 100, 100) : 0;
  const waterPercentage = waterData ? Math.min(waterData.percentage, 100) : 0;

  const mealEmojis = { breakfast: '🌅', lunch: '☀️', dinner: '🌙', snack: '🍎' };
  const mealNames = { breakfast: '早餐', lunch: '午餐', dinner: '晚餐', snack: '加餐' };

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
        <h1>健康追踪</h1>
        <p>你好，{user?.username} 👋</p>
      </div>

      <div className="page-content">
        <div className="date-selector">
          <button className="date-nav" onClick={() => setSelectedDate(subDays(selectedDate, 1))}>←</button>
          <span className="date-current">
            {isToday ? '今天' : format(selectedDate, 'M月d日 EEEE', { locale: zhCN })}
          </span>
          <button className="date-nav" onClick={() => setSelectedDate(addDays(selectedDate, 1))}>→</button>
        </div>

        <div className="glass-card" style={{ marginBottom: 16 }}>
          <div className="calorie-ring">
            <svg width="180" height="180" viewBox="0 0 180 180">
              <circle className="calorie-ring-bg" cx="90" cy="90" r="78" />
              <circle
                className="calorie-ring-progress"
                cx="90" cy="90" r="78"
                strokeDasharray={`${2 * Math.PI * 78}`}
                strokeDashoffset={`${2 * Math.PI * 78 * (1 - caloriePercentage / 100)}`}
              />
            </svg>
            <div className="calorie-ring-text">
              <div className="calorie-ring-value">{foodData?.summary.totalCalories || 0}</div>
              <div className="calorie-ring-label">/ {foodData?.goals.calories || 1500} kcal</div>
            </div>
          </div>
          <div className="stats-grid" style={{ marginTop: 16 }}>
            <div className="stat-card">
              <div className="stat-value" style={{ color: 'var(--accent-green)' }}>{foodData?.summary.totalProtein || 0}g</div>
              <div className="stat-label">蛋白质</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{ color: 'var(--accent-orange)' }}>{foodData?.summary.totalCarbs || 0}g</div>
              <div className="stat-label">碳水</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{ color: 'var(--accent-pink)' }}>{foodData?.summary.totalFat || 0}g</div>
              <div className="stat-label">脂肪</div>
            </div>
          </div>
        </div>

        <div className="glass-card" style={{ marginBottom: 16 }}>
          <div style={{ padding: '8px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontWeight: 600 }}>💧 今日饮水</span>
              <span style={{ fontSize: 14, color: 'var(--text-tertiary)' }}>
                {waterData?.total || 0} / {waterData?.goal || 2000} ml
              </span>
            </div>
            <div className="water-progress">
              <div className="water-progress-bar" style={{ width: `${waterPercentage}%` }}></div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12, justifyContent: 'center' }}>
              {[100, 200, 250, 500].map(amount => (
                <button
                  key={amount}
                  className="btn btn-secondary"
                  style={{ padding: '8px 16px', fontSize: 13 }}
                  onClick={() => addWater(amount)}
                >
                  +{amount}ml
                </button>
              ))}
            </div>
          </div>
        </div>

        {analysis?.suggestions?.length > 0 && (
          <div className="suggestion-card">
            <div className="suggestion-title">💡 健康建议</div>
            {analysis.suggestions.map((s, i) => (
              <div key={i} className="suggestion-text" style={{ marginBottom: 8 }}>• {s}</div>
            ))}
            {analysis.mealSuggestion && (
              <div className="suggestion-text" style={{ marginTop: 12, padding: '12px', background: 'rgba(255,255,255,0.15)', borderRadius: 12 }}>
                🍽️ {analysis.mealSuggestion}
              </div>
            )}
            {analysis.menstrualAdvice && (
              <div className="suggestion-text" style={{ marginTop: 8, padding: '12px', background: 'rgba(255,255,255,0.15)', borderRadius: 12 }}>
                🌸 {analysis.menstrualAdvice}
              </div>
            )}
          </div>
        )}

        <h3 className="section-title">今日饮食记录</h3>
        {['breakfast', 'lunch', 'dinner', 'snack'].map(mealType => {
          const entry = foodData?.entries?.find(e => e.mealType === mealType);
          return (
            <div key={mealType} className="meal-card">
              <div className="meal-card-header">
                <div className="meal-type">
                  {mealEmojis[mealType]} {mealNames[mealType]}
                </div>
                <div className="meal-calories">
                  {entry ? `${entry.totalCalories} kcal` : '未记录'}
                </div>
              </div>
              {entry ? (
                (entry.foods || []).map((food, i) => (
                  <div key={i} className="food-item">
                    <div className="food-info">
                      <div className="food-name">{food.name}</div>
                      <div className="food-detail">{food.amount}{food.unit}</div>
                    </div>
                    <div className="food-calories">{food.calories} kcal</div>
                  </div>
                ))
              ) : (
                <div style={{ color: 'var(--text-tertiary)', fontSize: 14, padding: '8px 0' }}>
                  点击添加食物记录
                </div>
              )}
            </div>
          );
        })}

        {analysis && (
          <div className="glass-card" style={{ marginTop: 16 }}>
            <h3 className="section-title">📊 个人数据</h3>
            <div className="bmi-indicator">
              <div>
                <div className="bmi-value">{analysis.profile.bmi || '--'}</div>
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>BMI</div>
              </div>
              {analysis.profile.bmiStatus && (
                <span className={`bmi-status ${
                  analysis.profile.bmiStatus === '正常' ? 'bmi-normal' :
                  analysis.profile.bmiStatus === '偏瘦' ? 'bmi-underweight' :
                  analysis.profile.bmiStatus === '超重' ? 'bmi-overweight' : 'bmi-obese'
                }`}>
                  {analysis.profile.bmiStatus}
                </span>
              )}
            </div>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-value">{analysis.profile.weight || '--'}</div>
                <div className="stat-label">体重(kg)</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{analysis.profile.dailyNeeds || '--'}</div>
                <div className="stat-label">日需(kcal)</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{analysis.streakDays}</div>
                <div className="stat-label">连续打卡</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
