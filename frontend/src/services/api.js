const API = '';

const headers = () => {
  const t = localStorage.getItem('token');
  return { 'Content-Type': 'application/json', ...(t && t !== 'local' ? { Authorization: `Bearer ${t}` } : {}) };
};

const isLocal = () => localStorage.getItem('token') === 'local';

// localStorage helpers
const KEY = 'ht_daily_';
const today = () => new Date().toISOString().split('T')[0];

function getDaily() {
  try { return JSON.parse(localStorage.getItem(KEY + today())) || { food: [], water: [] }; }
  catch { return { food: [], water: [] }; }
}
function saveDaily(data) { localStorage.setItem(KEY + today(), JSON.stringify(data)); }

// API calls with fallback
export const authAPI = {
  login: (email, password) => fetch(`${API}/api/login`, { method: 'POST', headers: headers(), body: JSON.stringify({ email, password }) }).then(r => { if (!r.ok) throw new Error('fail'); return r.json(); }),
  register: (username, email, password) => fetch(`${API}/api/register`, { method: 'POST', headers: headers(), body: JSON.stringify({ username, email, password }) }).then(r => { if (!r.ok) throw new Error('fail'); return r.json(); }),
  getMe: () => fetch(`${API}/api/me`, { headers: headers() }).then(r => { if (!r.ok) throw new Error('fail'); return r.json(); }),
  updateProfile: (data) => fetch(`${API}/api/profile`, { method: 'PUT', headers: headers(), body: JSON.stringify(data) }).then(r => r.json())
};

export const foodAPI = {
  add: async (meal_type, foods, log_date) => {
    if (isLocal()) {
      const d = getDaily();
      foods.forEach(f => {
        d.food.push({ id: Date.now() + Math.random(), meal_type, food_name: f.name, amount: f.amount || 100, unit: f.unit || 'g', calories: f.calories || 0, protein: f.protein || 0, carbs: f.carbs || 0, fat: f.fat || 0, log_date: log_date || today(), created_at: new Date().toISOString() });
      });
      saveDaily(d);
      return { message: 'ok' };
    }
    const res = await fetch(`${API}/api/diet`, { method: 'POST', headers: headers(), body: JSON.stringify({ meal_type, foods, log_date }) });
    if (!res.ok) throw new Error('添加失败');
    return res.json();
  },

  getDaily: async (date) => {
    if (isLocal()) {
      const d = getDaily();
      const entries = d.food;
      return {
        date: date || today(), entries,
        summary: {
          totalCalories: entries.reduce((s, e) => s + (e.calories || 0), 0),
          totalProtein: entries.reduce((s, e) => s + (e.protein || 0), 0),
          totalCarbs: entries.reduce((s, e) => s + (e.carbs || 0), 0),
          totalFat: entries.reduce((s, e) => s + (e.fat || 0), 0)
        },
        goals: { calories: 1500, water: 2000 }
      };
    }
    const res = await fetch(`${API}/api/diet/daily?date=${date}`, { headers: headers() });
    if (!res.ok) throw new Error('获取失败');
    return res.json();
  },

  getHistory: async () => {
    if (isLocal()) return { days: [] };
    const res = await fetch(`${API}/api/diet/history`, { headers: headers() });
    return res.json();
  },

  delete: async (id) => {
    if (isLocal()) {
      const d = getDaily();
      d.food = d.food.filter(f => f.id !== id);
      saveDaily(d);
      return { message: 'ok' };
    }
    return fetch(`${API}/api/diet/${id}`, { method: 'DELETE', headers: headers() }).then(r => r.json());
  },

  search: async (q) => {
    try {
      const res = await fetch(`${API}/api/search?q=${q}`, { headers: headers() });
      if (res.ok) return res.json();
    } catch {}
    const db = { '米饭':{calories:116,protein:2.6},'面条':{calories:137,protein:4.5},'馒头':{calories:223},'面包':{calories:312},'鸡蛋':{calories:144},'牛奶':{calories:54},'鸡胸肉':{calories:133},'牛肉':{calories:125},'猪肉':{calories:143},'鱼肉':{calories:113},'虾':{calories:87},'豆腐':{calories:73},'西兰花':{calories:36},'番茄':{calories:15},'苹果':{calories:53},'香蕉':{calories:93} };
    return Object.entries(db).filter(([n]) => n.includes(q)).slice(0, 10).map(([n, d]) => ({ name: n, ...d, carbs: 0, fat: 0 }));
  },

  recognize: async (image) => {
    try {
      const res = await fetch(`${API}/api/recognize`, { method: 'POST', headers: headers(), body: JSON.stringify({ image }) });
      if (res.ok) return res.json();
    } catch {}
    return { success: true, source: 'fallback', foods: [{ name: '请手动输入', amount: 100, calories: 100, protein: 5, carbs: 15, fat: 3, probability: 50 }] };
  }
};

export const waterAPI = {
  add: async (amount) => {
    if (isLocal()) {
      const d = getDaily();
      d.water.push({ id: Date.now(), amount, created_at: new Date().toISOString() });
      saveDaily(d);
      const total = d.water.reduce((s, e) => s + e.amount, 0);
      return { totalToday: total, goal: 2000, percentage: Math.round(total / 2000 * 100) };
    }
    const res = await fetch(`${API}/api/water`, { method: 'POST', headers: headers(), body: JSON.stringify({ amount }) });
    if (!res.ok) throw new Error('添加失败');
    return res.json();
  },

  getDaily: async (date) => {
    if (isLocal()) {
      const d = getDaily();
      const total = d.water.reduce((s, e) => s + e.amount, 0);
      return { date: date || today(), entries: d.water, total, goal: 2000, percentage: Math.round(total / 2000 * 100) };
    }
    const res = await fetch(`${API}/api/water/daily?date=${date}`, { headers: headers() });
    if (!res.ok) throw new Error('获取失败');
    return res.json();
  }
};

export const analysisAPI = {
  get: async () => {
    if (isLocal()) {
      const u = JSON.parse(localStorage.getItem('ht_user_data') || '{}');
      const d = getDaily();
      const cal = d.food.reduce((s, e) => s + (e.calories || 0), 0);
      const water = d.water.reduce((s, e) => s + e.amount, 0);
      let bmi = null, bmiStatus = '', dailyNeeds = null;
      if (u.height > 0 && u.weight > 0) {
        bmi = parseFloat((u.weight / Math.pow(u.height / 100, 2)).toFixed(1));
        bmiStatus = bmi < 18.5 ? '偏瘦' : bmi < 24 ? '正常' : bmi < 28 ? '超重' : '肥胖';
        const bmr = u.gender === 'male' ? 88.362 + 13.397 * u.weight + 4.799 * u.height - 5.677 * u.age : 447.593 + 9.247 * u.weight + 3.098 * u.height - 4.330 * u.age;
        dailyNeeds = Math.round(bmr * 1.2);
      }
      let suggestions = [];
      if (dailyNeeds && cal > dailyNeeds) suggestions.push('今日热量已超标');
      if (water < 1000) suggestions.push('饮水量不足，请及时补充');
      return {
        profile: { bmi, bmiStatus, dailyNeeds, height: u.height, weight: u.weight, target_weight: u.target_weight, age: u.age },
        today: { calories: cal, calorieGoal: u.calorie_goal || 1500, water, waterGoal: u.water_goal || 2000, remaining: dailyNeeds ? dailyNeeds - cal : 0, meals: d.food.length },
        suggestions, streakDays: u.streak_days || 0, points: u.points || 0
      };
    }
    const res = await fetch(`${API}/api/analysis`, { headers: headers() });
    if (!res.ok) throw new Error('获取失败');
    return res.json();
  }
};

export const adminAPI = {
  getStats: async () => {
    try { const res = await fetch(`${API}/api/admin/stats`, { headers: headers() }); if (res.ok) return res.json(); } catch {}
    return { overview: { totalUsers: 1, activeUsers: 1, totalFoodEntries: 0, totalWaterEntries: 0 } };
  },
  getUsers: async () => {
    try { const res = await fetch(`${API}/api/admin/users`, { headers: headers() }); if (res.ok) return res.json(); } catch {}
    return { users: [], total: 0, page: 1, pages: 0 };
  },
  updateUser: (id, data) => fetch(`${API}/api/admin/users/${id}`, { method: 'PUT', headers: headers(), body: JSON.stringify(data) }).then(r => r.json()),
  deleteUser: (id) => fetch(`${API}/api/admin/users/${id}`, { method: 'DELETE', headers: headers() }).then(r => r.json())
};
