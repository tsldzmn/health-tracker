import { storage } from './storage';

const API_BASE = '';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

export const foodAPI = {
  add: async (mealType, foods, date) => {
    const entry = storage.addFoodEntry(mealType, foods);
    storage.addPoints(5);
    return entry;
  },

  getDaily: async (date) => {
    const entries = storage.getFoodEntries();
    const summary = storage.getFoodSummary();
    const profile = storage.getProfile();
    return {
      date,
      entries,
      summary,
      goals: profile.dailyGoals || { calories: 1500, water: 2000 }
    };
  },

  getHistory: async () => {
    return { days: [], total: 0, page: 1, pages: 0 };
  },

  delete: async (id) => {
    storage.deleteFoodEntry(id);
    return { message: '删除成功' };
  },

  searchFood: async (keyword) => {
    try {
      const res = await fetch(`${API_BASE}/api/analysis/search?q=${keyword}`, { headers: getHeaders() });
      if (res.ok) return res.json();
    } catch (e) {}
    return [];
  },

  recognizeByImage: async (imageBase64) => {
    const res = await fetch(`${API_BASE}/api/analysis/recognize-image`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ image: imageBase64 })
    });
    if (!res.ok) throw new Error('识别失败');
    return res.json();
  }
};

export const waterAPI = {
  add: async (amount) => {
    const result = storage.addWater(amount);
    storage.addPoints(2);
    const profile = storage.getProfile();
    return {
      entry: result.entry,
      totalToday: result.totalToday,
      goal: profile.dailyGoals?.water || 2000,
      percentage: Math.round((result.totalToday / (profile.dailyGoals?.water || 2000)) * 100)
    };
  },

  getDaily: async (date) => {
    const entries = storage.getWaterEntries();
    const total = storage.getWaterTotal();
    const profile = storage.getProfile();
    return {
      date,
      entries,
      total,
      goal: profile.dailyGoals?.water || 2000,
      percentage: Math.round((total / (profile.dailyGoals?.water || 2000)) * 100)
    };
  },

  getHistory: async () => {
    return { days: [], goal: 2000 };
  }
};

export const analysisAPI = {
  getAnalysis: async () => {
    const profile = storage.getProfile();
    const summary = storage.getFoodSummary();
    const waterTotal = storage.getWaterTotal();

    let bmi = null, bmiStatus = '', bmr = null, dailyNeeds = null;
    if (profile.height > 0 && profile.weight > 0) {
      const h = profile.height / 100;
      bmi = parseFloat((profile.weight / (h * h)).toFixed(1));
      if (bmi < 18.5) bmiStatus = '偏瘦';
      else if (bmi < 24) bmiStatus = '正常';
      else if (bmi < 28) bmiStatus = '超重';
      else bmiStatus = '肥胖';
    }
    if (profile.weight > 0 && profile.height > 0 && profile.age > 0) {
      if (profile.gender === 'male') {
        bmr = Math.round(88.362 + (13.397 * profile.weight) + (4.799 * profile.height) - (5.677 * profile.age));
      } else {
        bmr = Math.round(447.593 + (9.247 * profile.weight) + (3.098 * profile.height) - (4.330 * profile.age));
      }
      const m = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, very_active: 1.9 };
      dailyNeeds = Math.round(bmr * (m[profile.activityLevel] || 1.2));
    }

    const entries = storage.getFoodEntries();
    let suggestions = [];
    if (dailyNeeds) {
      const r = dailyNeeds - summary.totalCalories;
      const h = new Date().getHours();
      if (h < 10 && summary.totalCalories < dailyNeeds * 0.25) suggestions.push('早餐热量偏低，建议补充优质蛋白质');
      if (h >= 11 && h < 14 && summary.totalCalories < dailyNeeds * 0.5) suggestions.push('午餐建议摄入全天热量的40%');
      if (h >= 17 && h < 20 && summary.totalCalories < dailyNeeds * 0.75) suggestions.push('晚餐建议清淡为主');
      if (r < 0) suggestions.push('今日热量已超标，建议适当运动');
      if (waterTotal < (profile.dailyGoals?.water || 2000) * 0.5) suggestions.push('饮水量不足，请及时补充');
    }

    let mealSuggestion = '';
    const h = new Date().getHours();
    if (h < 10) mealSuggestion = '早餐建议：全麦面包1片 + 鸡蛋1个 + 牛奶250ml，约350kcal';
    else if (h < 14) mealSuggestion = '午餐建议：糙米饭1碗 + 鸡胸肉100g + 蔬菜200g，约450kcal';
    else if (h < 20) mealSuggestion = '晚餐建议：杂粮粥1碗 + 清蒸鱼100g + 蔬菜沙拉，约350kcal';
    else mealSuggestion = '夜间建议：如果饿了可以喝杯牛奶或吃少量水果';

    return {
      profile: { bmi, bmiStatus, bmr, dailyNeeds, height: profile.height, weight: profile.weight, targetWeight: profile.targetWeight, age: profile.age },
      today: {
        calories: summary.totalCalories,
        calorieGoal: profile.dailyGoals?.calories || 1500,
        water: waterTotal,
        waterGoal: profile.dailyGoals?.water || 2000,
        remaining: dailyNeeds ? dailyNeeds - summary.totalCalories : 0,
        meals: entries.length
      },
      suggestions, mealSuggestion,
      streakDays: profile.streakDays || 0,
      points: profile.points || 0
    };
  }
};

export const authAPI = {
  login: async (email, password) => {
    const profile = storage.getProfile();
    return {
      token: 'local',
      user: {
        id: 'local',
        username: email.split('@')[0],
        email,
        profile,
        dailyGoals: profile.dailyGoals,
        points: profile.points,
        streakDays: profile.streakDays,
        achievements: profile.achievements,
        isAdmin: email === 'admin@health.com'
      }
    };
  },

  register: async (username, email, password) => {
    storage.updateProfile({ username, email });
    const profile = storage.getProfile();
    return {
      token: 'local',
      user: {
        id: 'local', username, email,
        profile, dailyGoals: profile.dailyGoals,
        points: 0, streakDays: 0, achievements: [], isAdmin: false
      }
    };
  },

  getMe: async () => {
    const profile = storage.getProfile();
    return {
      user: {
        id: 'local',
        username: profile.username || '用户',
        email: profile.email || '',
        profile,
        dailyGoals: profile.dailyGoals,
        points: profile.points,
        streakDays: profile.streakDays,
        achievements: profile.achievements,
        isAdmin: profile.email === 'admin@health.com'
      }
    };
  },

  updateProfile: async (profileData, dailyGoals) => {
    const profile = storage.updateProfile({ ...profileData, dailyGoals });
    return {
      user: {
        id: 'local', username: profile.username, email: profile.email,
        profile, dailyGoals: profile.dailyGoals,
        points: profile.points, streakDays: profile.streakDays, isAdmin: false
      }
    };
  }
};

export const adminAPI = {
  getStats: async () => ({
    overview: { totalUsers: 1, activeUsers: 1, adminUsers: 1, totalFoodEntries: 0, totalWaterEntries: 0, todayCheckIns: 1, weeklyActiveUsers: 1 },
    monthlyStats: [], topFoods: []
  }),
  getUsers: async () => ({ users: [], total: 0, page: 1, pages: 0 }),
  getUserDetail: async () => ({ user: {}, recentFoods: [], recentWaters: [], todaySummary: { calories: 0, meals: 0 } }),
  updateUser: async () => ({}),
  deleteUser: async () => ({})
};
