import { useState, useEffect } from 'react';
import { waterAPI } from '../services/api';
import { format } from 'date-fns';

export default function WaterLog() {
  const [waterData, setWaterData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [customAmount, setCustomAmount] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await waterAPI.getDaily(format(new Date(), 'yyyy-MM-dd'));
      setWaterData(data);
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
        percentage: data.percentage,
        entries: [...(prev.entries || []), data.entry]
      }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleCustomAdd = () => {
    const amount = parseInt(customAmount);
    if (amount > 0) {
      addWater(amount);
      setCustomAmount('');
    }
  };

  const percentage = waterData ? Math.min(waterData.percentage, 100) : 0;
  const isCompleted = percentage >= 100;

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
        <h1>💧 饮水打卡</h1>
        <p>保持水分摄入</p>
      </div>

      <div className="page-content">
        <div className="glass-card" style={{ marginBottom: 16, textAlign: 'center', padding: 32 }}>
          <div style={{ position: 'relative', width: 200, height: 200, margin: '0 auto' }}>
            <svg width="200" height="200" viewBox="0 0 200 200">
              <circle cx="100" cy="100" r="88" fill="none" stroke="var(--bg-tertiary)" strokeWidth="12" />
              <circle
                cx="100" cy="100" r="88"
                fill="none"
                stroke={isCompleted ? 'var(--accent-green)' : 'var(--accent-blue)'}
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 88}`}
                strokeDashoffset={`${2 * Math.PI * 88 * (1 - percentage / 100)}`}
                style={{ transform: 'rotate(-90deg)', transformOrigin: 'center', transition: 'stroke-dashoffset 0.5s ease' }}
              />
            </svg>
            <div style={{
              position: 'absolute', top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)', textAlign: 'center'
            }}>
              <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                {isCompleted ? '🎉 已达标' : '今日饮水'}
              </div>
              <div style={{ fontSize: 36, fontWeight: 700, color: isCompleted ? 'var(--accent-green)' : 'var(--accent-blue)' }}>
                {waterData?.total || 0}
              </div>
              <div style={{ fontSize: 14, color: 'var(--text-tertiary)' }}>
                / {waterData?.goal || 2000} ml
              </div>
            </div>
          </div>

          <div style={{ marginTop: 24, display: 'flex', justifyContent: 'center', gap: 8 }}>
            <span className={`chip ${isCompleted ? 'chip-green' : 'chip-blue'}`}>
              {percentage}% 完成
            </span>
            <span className="chip chip-orange">
              还需 {Math.max(0, (waterData?.goal || 2000) - (waterData?.total || 0))} ml
            </span>
          </div>
        </div>

        <h3 className="section-title">快速添加</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 16 }}>
          {[
            { amount: 100, label: '一小杯', emoji: '🥛' },
            { amount: 200, label: '一杯水', emoji: '🥤' },
            { amount: 250, label: '一马克杯', emoji: '☕' },
            { amount: 350, label: '一罐饮料', emoji: '🥫' },
            { amount: 500, label: '一瓶水', emoji: '🍶' },
            { amount: 750, label: '大瓶水', emoji: '🫗' }
          ].map(item => (
            <button
              key={item.amount}
              className="glass-card"
              onClick={() => addWater(item.amount)}
              style={{
                cursor: 'pointer', textAlign: 'center',
                padding: 20, border: 'none'
              }}
            >
              <div style={{ fontSize: 32, marginBottom: 8 }}>{item.emoji}</div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{item.label}</div>
              <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{item.amount}ml</div>
            </button>
          ))}
        </div>

        <h3 className="section-title">自定义数量</h3>
        <div className="glass-card" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <input
            className="input-field"
            type="number"
            placeholder="输入ml数"
            value={customAmount}
            onChange={(e) => setCustomAmount(e.target.value)}
            style={{ flex: 1 }}
          />
          <button className="btn btn-primary" onClick={handleCustomAdd}>
            添加
          </button>
        </div>

        {waterData?.entries?.length > 0 && (
          <>
            <h3 className="section-title" style={{ marginTop: 24 }}>今日记录</h3>
            <div className="glass-card">
              {waterData.entries.map((entry, i) => (
                <div key={i} className="food-item" style={{ border: 'none', borderBottom: i < waterData.entries.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                  <div className="food-info">
                    <div className="food-name">💧 {entry.amount}ml</div>
                    <div className="food-detail">{entry.time ? format(new Date(entry.time), 'HH:mm') : format(new Date(entry.createdAt || Date.now()), 'HH:mm')}</div>
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
