const express = require('express');
const FoodEntry = require('../models/FoodEntry');
const User = require('../models/User');
const auth = require('../middleware/auth');
const router = express.Router();

const ACHIEVEMENTS = [
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

router.post('/', auth, async (req, res) => {
  try {
    const { mealType, foods, notes, date } = req.body;
    const entryDate = date ? new Date(date) : new Date();
    entryDate.setHours(0, 0, 0, 0);

    const entry = new FoodEntry({
      user: req.user._id,
      date: entryDate,
      mealType,
      foods,
      notes: notes || ''
    });
    await entry.save();

    req.user.points = (req.user.points || 0) + 5;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (!req.user.lastCheckIn || req.user.lastCheckIn < today) {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      if (req.user.lastCheckIn && req.user.lastCheckIn >= yesterday) {
        req.user.streakDays = (req.user.streakDays || 0) + 1;
      } else {
        req.user.streakDays = 1;
      }
      req.user.lastCheckIn = new Date();
    }

    const totalMeals = await FoodEntry.countDocuments({ user: req.user._id });
    if (totalMeals === 1 && !req.user.achievements?.find(a => a.id === 'first_meal')) {
      req.user.achievements = req.user.achievements || [];
      req.user.achievements.push({ ...ACHIEVEMENTS[0], unlockedAt: new Date() });
    }
    if (req.user.streakDays >= 7 && !req.user.achievements?.find(a => a.id === 'week_streak')) {
      req.user.achievements.push({ ...ACHIEVEMENTS[1], unlockedAt: new Date() });
    }

    await req.user.save();
    res.status(201).json(entry);
  } catch (error) {
    console.error('添加食物记录失败:', error);
    res.status(500).json({ message: '记录失败', error: error.message });
  }
});

router.get('/daily', auth, async (req, res) => {
  try {
    const dateStr = req.query.date || new Date().toISOString().split('T')[0];
    const date = new Date(dateStr);
    date.setHours(0, 0, 0, 0);
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);

    const entries = await FoodEntry.find({
      user: req.user._id,
      date: { $gte: date, $lt: nextDay }
    }).sort({ createdAt: 1 });

    const totalCalories = entries.reduce((sum, e) => sum + (e.totalCalories || 0), 0);
    const totalProtein = entries.reduce((sum, e) => sum + (e.totalProtein || 0), 0);
    const totalCarbs = entries.reduce((sum, e) => sum + (e.totalCarbs || 0), 0);
    const totalFat = entries.reduce((sum, e) => sum + (e.totalFat || 0), 0);

    res.json({
      date: dateStr,
      entries,
      summary: { totalCalories, totalProtein, totalCarbs, totalFat },
      goals: req.user.dailyGoals
    });
  } catch (error) {
    res.status(500).json({ message: '获取失败', error: error.message });
  }
});

router.get('/history', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 7;
    const skip = (page - 1) * limit;

    const entries = await FoodEntry.find({ user: req.user._id })
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit);

    const total = await FoodEntry.countDocuments({ user: req.user._id });

    const grouped = {};
    entries.forEach(entry => {
      const key = entry.date.toISOString().split('T')[0];
      if (!grouped[key]) grouped[key] = { date: key, entries: [], totalCalories: 0 };
      grouped[key].entries.push(entry);
      grouped[key].totalCalories += entry.totalCalories || 0;
    });

    res.json({
      days: Object.values(grouped),
      total,
      page,
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(500).json({ message: '获取失败', error: error.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const entry = await FoodEntry.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!entry) return res.status(404).json({ message: '记录不存在' });
    res.json({ message: '删除成功' });
  } catch (error) {
    res.status(500).json({ message: '删除失败', error: error.message });
  }
});

module.exports = router;
