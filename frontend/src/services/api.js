const API = '';

function getToken() {
  return localStorage.getItem('token') || '';
}

function isLocal() {
  return getToken() === 'local';
}

function hd() {
  return { 'Content-Type': 'application/json', ...(getToken() && !isLocal() ? { Authorization: 'Bearer ' + getToken() } : {}) };
}

function today() {
  return new Date().toISOString().split('T')[0];
}

function gd() {
  try { return JSON.parse(localStorage.getItem('ht_d_' + today())) || { f: [], w: [] }; }
  catch(e) { return { f: [], w: [] }; }
}

function sd(d) {
  localStorage.setItem('ht_d_' + today(), JSON.stringify(d));
}

export const authAPI = {
  login: function(email, password) {
    return fetch(API + '/api/login', { method: 'POST', headers: hd(), body: JSON.stringify({ email: email, password: password }) })
      .then(function(r) { if (!r.ok) throw new Error('fail'); return r.json(); });
  },
  register: function(username, email, password) {
    return fetch(API + '/api/register', { method: 'POST', headers: hd(), body: JSON.stringify({ username: username, email: email, password: password }) })
      .then(function(r) { if (!r.ok) throw new Error('fail'); return r.json(); });
  },
  getMe: function() {
    return fetch(API + '/api/me', { headers: hd() })
      .then(function(r) { if (!r.ok) throw new Error('fail'); return r.json(); });
  },
  updateProfile: function(data) {
    return fetch(API + '/api/profile', { method: 'PUT', headers: hd(), body: JSON.stringify(data) })
      .then(function(r) { return r.json(); });
  }
};

export const foodAPI = {
  add: function(mealType, foods, date) {
    if (isLocal()) {
      var d = gd();
      for (var i = 0; i < foods.length; i++) {
        var f = foods[i];
        d.f.push({ id: Date.now() + i, meal_type: mealType, food_name: f.name, amount: f.amount || 100, unit: f.unit || 'g', calories: f.calories || 0, protein: f.protein || 0, carbs: f.carbs || 0, fat: f.fat || 0, log_date: date || today(), created_at: new Date().toISOString() });
      }
      sd(d);
      return Promise.resolve({ message: 'ok' });
    }
    return fetch(API + '/api/diet', { method: 'POST', headers: hd(), body: JSON.stringify({ meal_type: mealType, foods: foods, log_date: date }) })
      .then(function(r) { if (!r.ok) throw new Error('fail'); return r.json(); });
  },
  getDaily: function(date) {
    if (isLocal()) {
      var d = gd();
      var e = d.f || [];
      return Promise.resolve({
        date: date || today(), entries: e,
        summary: { totalCalories: e.reduce(function(s, x) { return s + (x.calories || 0); }, 0), totalProtein: e.reduce(function(s, x) { return s + (x.protein || 0); }, 0), totalCarbs: e.reduce(function(s, x) { return s + (x.carbs || 0); }, 0), totalFat: e.reduce(function(s, x) { return s + (x.fat || 0); }, 0) },
        goals: { calories: 1500, water: 2000 }
      });
    }
    return fetch(API + '/api/diet/daily?date=' + date, { headers: hd() })
      .then(function(r) { if (!r.ok) throw new Error('fail'); return r.json(); });
  },
  search: function(q) {
    return fetch(API + '/api/search?q=' + q, { headers: hd() })
      .then(function(r) { if (r.ok) return r.json(); throw new Error('fail'); })
      .catch(function() {
        var db = { '米饭':116, '面条':137, '馒头':223, '面包':312, '鸡蛋':144, '牛奶':54, '鸡胸肉':133, '牛肉':125, '猪肉':143, '鱼肉':113, '虾':87, '豆腐':73, '西兰花':36, '番茄':15, '苹果':53, '香蕉':93 };
        var r = [];
        for (var n in db) { if (n.indexOf(q) >= 0) r.push({ name: n, calories: db[n], protein: 0, carbs: 0, fat: 0 }); if (r.length >= 10) break; }
        return r;
      });
  },
  recognize: function(image) {
    return fetch(API + '/api/recognize', { method: 'POST', headers: hd(), body: JSON.stringify({ image: image }) })
      .then(function(r) { if (r.ok) return r.json(); throw new Error('fail'); })
      .catch(function() { return { success: true, source: 'fallback', foods: [{ name: '请手动输入', amount: 100, calories: 100, protein: 5, carbs: 15, fat: 3 }] }; });
  },
  delete: function(id) {
    if (isLocal()) {
      var d = gd();
      d.f = d.f.filter(function(x) { return x.id !== id; });
      sd(d);
      return Promise.resolve({ message: 'ok' });
    }
    return fetch(API + '/api/diet/' + id, { method: 'DELETE', headers: hd() }).then(function(r) { return r.json(); });
  }
};

export const waterAPI = {
  add: function(amount) {
    if (isLocal()) {
      var d = gd();
      d.w.push({ id: Date.now(), amount: amount, created_at: new Date().toISOString() });
      sd(d);
      var t = d.w.reduce(function(s, x) { return s + x.amount; }, 0);
      return Promise.resolve({ totalToday: t, goal: 2000, percentage: Math.round(t / 2000 * 100) });
    }
    return fetch(API + '/api/water', { method: 'POST', headers: hd(), body: JSON.stringify({ amount: amount }) })
      .then(function(r) { if (!r.ok) throw new Error('fail'); return r.json(); });
  },
  getDaily: function(date) {
    if (isLocal()) {
      var d = gd();
      var w = d.w || [];
      var t = w.reduce(function(s, x) { return s + x.amount; }, 0);
      return Promise.resolve({ date: date || today(), entries: w, total: t, goal: 2000, percentage: Math.round(t / 2000 * 100) });
    }
    return fetch(API + '/api/water/daily?date=' + date, { headers: hd() })
      .then(function(r) { if (!r.ok) throw new Error('fail'); return r.json(); });
  }
};

export const analysisAPI = {
  get: function() {
    if (isLocal()) {
      var u = JSON.parse(localStorage.getItem('ht_user_data') || '{}');
      var d = gd();
      var cal = (d.f || []).reduce(function(s, x) { return s + (x.calories || 0); }, 0);
      var water = (d.w || []).reduce(function(s, x) { return s + (x.amount || 0); }, 0);
      var bmi = null, bmiStatus = '', dailyNeeds = null;
      if (u.height > 0 && u.weight > 0) {
        bmi = parseFloat((u.weight / Math.pow(u.height / 100, 2)).toFixed(1));
        bmiStatus = bmi < 18.5 ? '偏瘦' : bmi < 24 ? '正常' : bmi < 28 ? '超重' : '肥胖';
        var bmr = u.gender === 'male' ? 88.362 + 13.397 * u.weight + 4.799 * u.height - 5.677 * u.age : 447.593 + 9.247 * u.weight + 3.098 * u.height - 4.330 * u.age;
        dailyNeeds = Math.round(bmr * 1.2);
      }
      var sug = [];
      if (dailyNeeds && cal > dailyNeeds) sug.push('今日热量已超标');
      if (water < 1000) sug.push('饮水量不足，请及时补充');
      return Promise.resolve({
        profile: { bmi: bmi, bmiStatus: bmiStatus, dailyNeeds: dailyNeeds, height: u.height || 0, weight: u.weight || 0, target_weight: u.target_weight || 0, age: u.age || 0 },
        today: { calories: cal, calorieGoal: u.calorie_goal || 1500, water: water, waterGoal: u.water_goal || 2000, remaining: dailyNeeds ? dailyNeeds - cal : 0, meals: (d.f || []).length },
        suggestions: sug, streakDays: u.streak_days || 0, points: u.points || 0
      });
    }
    return fetch(API + '/api/analysis', { headers: hd() })
      .then(function(r) { if (!r.ok) throw new Error('fail'); return r.json(); });
  }
};

export const adminAPI = {
  getStats: function() {
    return fetch(API + '/api/admin/stats', { headers: hd() })
      .then(function(r) { if (r.ok) return r.json(); throw new Error('fail'); })
      .catch(function() { return { overview: { totalUsers: 1, activeUsers: 1, totalFoodEntries: 0, totalWaterEntries: 0, todayCheckIns: 1 } }; });
  },
  getUsers: function() {
    return fetch(API + '/api/admin/users', { headers: hd() })
      .then(function(r) { if (r.ok) return r.json(); throw new Error('fail'); })
      .catch(function() { return { users: [], total: 0, page: 1, pages: 0 }; });
  },
  updateUser: function(id, data) {
    return fetch(API + '/api/admin/users/' + id, { method: 'PUT', headers: hd(), body: JSON.stringify(data) }).then(function(r) { return r.json(); });
  },
  deleteUser: function(id) {
    return fetch(API + '/api/admin/users/' + id, { method: 'DELETE', headers: hd() }).then(function(r) { return r.json(); });
  }
};
