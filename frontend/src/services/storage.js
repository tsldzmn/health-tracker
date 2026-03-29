const DAILY_KEY = 'health_daily_data';
const PROFILE_KEY = 'health_profile';

function getToday() {
  return new Date().toISOString().split('T')[0];
}

function getDailyData() {
  try {
    const stored = localStorage.getItem(DAILY_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      if (data.date === getToday()) return data;
    }
  } catch (e) {}
  return { date: getToday(), foodEntries: [], waterEntries: [], totalWater: 0 };
}

function saveDailyData(data) {
  localStorage.setItem(DAILY_KEY, JSON.stringify(data));
}

export const storage = {
  getFoodEntries() {
    return getDailyData().foodEntries;
  },

  addFoodEntry(mealType, foods) {
    const data = getDailyData();
    const entry = {
      id: Date.now().toString(),
      date: new Date(),
      mealType,
      foods,
      totalCalories: foods.reduce((s, f) => s + (f.calories || 0), 0),
      totalProtein: foods.reduce((s, f) => s + (f.protein || 0), 0),
      totalCarbs: foods.reduce((s, f) => s + (f.carbs || 0), 0),
      totalFat: foods.reduce((s, f) => s + (f.fat || 0), 0),
      createdAt: new Date()
    };
    data.foodEntries.push(entry);
    saveDailyData(data);
    return entry;
  },

  deleteFoodEntry(id) {
    const data = getDailyData();
    data.foodEntries = data.foodEntries.filter(e => e.id !== id);
    saveDailyData(data);
  },

  getFoodSummary() {
    const entries = this.getFoodEntries();
    return {
      totalCalories: entries.reduce((s, e) => s + (e.totalCalories || 0), 0),
      totalProtein: entries.reduce((s, e) => s + (e.totalProtein || 0), 0),
      totalCarbs: entries.reduce((s, e) => s + (e.totalCarbs || 0), 0),
      totalFat: entries.reduce((s, e) => s + (e.totalFat || 0), 0)
    };
  },

  getWaterEntries() {
    return getDailyData().waterEntries;
  },

  getWaterTotal() {
    return getDailyData().waterEntries.reduce((s, e) => s + e.amount, 0);
  },

  addWater(amount) {
    const data = getDailyData();
    const entry = { id: Date.now().toString(), amount, time: new Date(), date: new Date() };
    data.waterEntries.push(entry);
    data.totalWater = data.waterEntries.reduce((s, e) => s + e.amount, 0);
    saveDailyData(data);
    return { entry, totalToday: data.totalWater };
  },

  getProfile() {
    try {
      const stored = localStorage.getItem(PROFILE_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return {
      height: 0, weight: 0, targetWeight: 0, age: 0, gender: '',
      activityLevel: 'sedentary',
      menstrualCycle: { isTracking: false },
      dailyGoals: { calories: 1500, water: 2000 },
      points: 0, streakDays: 0, achievements: []
    };
  },

  saveProfile(profile) {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  },

  updateProfile(updates) {
    const profile = this.getProfile();
    Object.assign(profile, updates);
    this.saveProfile(profile);
    return profile;
  },

  addPoints(pts) {
    const profile = this.getProfile();
    profile.points = (profile.points || 0) + pts;
    this.saveProfile(profile);
    return profile;
  }
};
