const express = require('express');
const User = require('../models/User');
const FoodEntry = require('../models/FoodEntry');
const WaterEntry = require('../models/WaterEntry');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const router = express.Router();

router.use(auth, admin);

router.get('/stats', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const adminUsers = await User.countDocuments({ isAdmin: true });
    const totalFoodEntries = await FoodEntry.countDocuments();
    const totalWaterEntries = await WaterEntry.countDocuments();

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayUsers = await FoodEntry.distinct('user', { date: { $gte: today } });

    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);
    const weeklyUsers = await FoodEntry.distinct('user', { date: { $gte: last7Days } });

    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);
    const monthlyStats = await FoodEntry.aggregate([
      { $match: { date: { $gte: last30Days } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } }, count: { $sum: 1 }, users: { $addToSet: '$user' } } },
      { $sort: { _id: 1 } }
    ]);

    const topFoods = await FoodEntry.aggregate([
      { $unwind: '$foods' },
      { $group: { _id: '$foods.name', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      overview: { totalUsers, activeUsers, adminUsers, totalFoodEntries, totalWaterEntries, todayCheckIns: todayUsers.length, weeklyActiveUsers: weeklyUsers.length },
      monthlyStats: monthlyStats.map(s => ({ date: s._id, entries: s.count, activeUsers: s.users.length })),
      topFoods
    });
  } catch (error) {
    res.status(500).json({ message: '获取统计失败', error: error.message });
  }
});

router.get('/users', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || '';
    const skip = (page - 1) * limit;

    const query = search ? { $or: [{ username: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }] } : {};

    const users = await User.find(query).select('-password').sort({ createdAt: -1 }).skip(skip).limit(limit);
    const total = await User.countDocuments(query);

    const usersWithStats = await Promise.all(users.map(async (user) => {
      const foodCount = await FoodEntry.countDocuments({ user: user._id });
      const waterCount = await WaterEntry.countDocuments({ user: user._id });
      return { ...user.toObject(), stats: { foodCount, waterCount } };
    }));

    res.json({ users: usersWithStats, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: '获取用户列表失败', error: error.message });
  }
});

router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: '用户不存在' });

    const recentFoods = await FoodEntry.find({ user: user._id }).sort({ date: -1 }).limit(10);
    const recentWaters = await WaterEntry.find({ user: user._id }).sort({ createdAt: -1 }).limit(10);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const todayFood = await FoodEntry.find({ user: user._id, date: { $gte: today, $lt: tomorrow } });
    const todayCalories = todayFood.reduce((sum, e) => sum + (e.totalCalories || 0), 0);

    res.json({ user, recentFoods, recentWaters, todaySummary: { calories: todayCalories, meals: todayFood.length } });
  } catch (error) {
    res.status(500).json({ message: '获取用户详情失败', error: error.message });
  }
});

router.put('/users/:id', async (req, res) => {
  try {
    const { isAdmin, isActive, dailyGoals } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: '用户不存在' });
    if (isAdmin !== undefined) user.isAdmin = isAdmin;
    if (isActive !== undefined) user.isActive = isActive;
    if (dailyGoals) Object.assign(user.dailyGoals, dailyGoals);
    await user.save();
    res.json({ user: { ...user.toObject(), password: undefined } });
  } catch (error) {
    res.status(500).json({ message: '更新用户失败', error: error.message });
  }
});

router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: '用户不存在' });
    if (user._id.toString() === req.user._id.toString()) return res.status(400).json({ message: '不能删除自己' });
    await FoodEntry.deleteMany({ user: user._id });
    await WaterEntry.deleteMany({ user: user._id });
    await User.findByIdAndDelete(user._id);
    res.json({ message: '用户已删除' });
  } catch (error) {
    res.status(500).json({ message: '删除用户失败', error: error.message });
  }
});

module.exports = router;
