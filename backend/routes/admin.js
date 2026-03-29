const express = require('express');
const { db } = require('../config/db');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const router = express.Router();

router.use(auth, admin);

router.get('/stats', async (req, res) => {
  try {
    const totalUsers = await db.users.count({});
    const activeUsers = await db.users.count({ isActive: true });
    const adminUsers = await db.users.count({ isAdmin: true });
    const totalFoodEntries = await db.foodEntries.count({});
    const totalWaterEntries = await db.waterEntries.count({});

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const allFoodEntries = await db.foodEntries.find({});
    const todayEntries = allFoodEntries.filter(e => new Date(e.date) >= today);
    const todayUserIds = [...new Set(todayEntries.map(e => e.userId))];

    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);
    const weeklyEntries = allFoodEntries.filter(e => new Date(e.date) >= last7Days);
    const weeklyUserIds = [...new Set(weeklyEntries.map(e => e.userId))];

    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);
    const monthlyEntries = allFoodEntries.filter(e => new Date(e.date) >= last30Days);

    const monthlyGrouped = {};
    monthlyEntries.forEach(e => {
      const key = new Date(e.date).toISOString().split('T')[0];
      if (!monthlyGrouped[key]) monthlyGrouped[key] = { date: key, count: 0, users: new Set() };
      monthlyGrouped[key].count++;
      monthlyGrouped[key].users.add(e.userId);
    });

    const monthlyStats = Object.values(monthlyGrouped)
      .map(s => ({ date: s.date, entries: s.count, activeUsers: s.users.size }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const foodCounts = {};
    allFoodEntries.forEach(entry => {
      (entry.foods || []).forEach(food => {
        foodCounts[food.name] = (foodCounts[food.name] || 0) + 1;
      });
    });
    const topFoods = Object.entries(foodCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ _id: name, count }));

    res.json({
      overview: { totalUsers, activeUsers, adminUsers, totalFoodEntries, totalWaterEntries, todayCheckIns: todayUserIds.length, weeklyActiveUsers: weeklyUserIds.length },
      monthlyStats,
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

    let query = {};
    if (search) {
      const allUsers = await db.users.find({});
      const filtered = allUsers.filter(u =>
        u.username?.includes(search.toLowerCase()) ||
        u.email?.includes(search.toLowerCase())
      );
      const start = (page - 1) * limit;
      const users = filtered.slice(start, start + limit);

      const usersWithStats = await Promise.all(users.map(async (user) => {
        const foodCount = await db.foodEntries.count({ userId: user._id });
        const waterCount = await db.waterEntries.count({ userId: user._id });
        const { password, ...rest } = user;
        return { ...rest, stats: { foodCount, waterCount } };
      }));

      return res.json({ users: usersWithStats, total: filtered.length, page, pages: Math.ceil(filtered.length / limit) });
    }

    const allUsers = await db.users.find({});
    allUsers.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const start = (page - 1) * limit;
    const users = allUsers.slice(start, start + limit);

    const usersWithStats = await Promise.all(users.map(async (user) => {
      const foodCount = await db.foodEntries.count({ userId: user._id });
      const waterCount = await db.waterEntries.count({ userId: user._id });
      const { password, ...rest } = user;
      return { ...rest, stats: { foodCount, waterCount } };
    }));

    res.json({ users: usersWithStats, total: allUsers.length, page, pages: Math.ceil(allUsers.length / limit) });
  } catch (error) {
    res.status(500).json({ message: '获取用户列表失败', error: error.message });
  }
});

router.get('/users/:id', async (req, res) => {
  try {
    const user = await db.users.findOne({ _id: req.params.id });
    if (!user) return res.status(404).json({ message: '用户不存在' });

    const foodEntries = await db.foodEntries.find({ userId: user._id });
    foodEntries.sort((a, b) => new Date(b.date) - new Date(a.date));
    const recentFoods = foodEntries.slice(0, 10);

    const waterEntries = await db.waterEntries.find({ userId: user._id });
    waterEntries.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const recentWaters = waterEntries.slice(0, 10);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayFood = foodEntries.filter(e => new Date(e.date) >= today && new Date(e.date) < tomorrow);
    const todayCalories = todayFood.reduce((sum, e) => sum + e.totalCalories, 0);

    const { password, ...userWithoutPassword } = user;
    res.json({
      user: userWithoutPassword,
      recentFoods,
      recentWaters,
      todaySummary: { calories: todayCalories, meals: todayFood.length }
    });
  } catch (error) {
    res.status(500).json({ message: '获取用户详情失败', error: error.message });
  }
});

router.put('/users/:id', async (req, res) => {
  try {
    const { isAdmin, isActive, dailyGoals } = req.body;
    const user = await db.users.findOne({ _id: req.params.id });
    if (!user) return res.status(404).json({ message: '用户不存在' });

    const updates = { updatedAt: new Date() };
    if (isAdmin !== undefined) updates.isAdmin = isAdmin;
    if (isActive !== undefined) updates.isActive = isActive;
    if (dailyGoals) updates.dailyGoals = { ...user.dailyGoals, ...dailyGoals };

    await db.users.update({ _id: req.params.id }, { $set: updates });
    const updatedUser = await db.users.findOne({ _id: req.params.id });
    const { password, ...rest } = updatedUser;
    res.json({ user: rest });
  } catch (error) {
    res.status(500).json({ message: '更新用户失败', error: error.message });
  }
});

router.delete('/users/:id', async (req, res) => {
  try {
    const user = await db.users.findOne({ _id: req.params.id });
    if (!user) return res.status(404).json({ message: '用户不存在' });
    if (user._id === req.user._id) {
      return res.status(400).json({ message: '不能删除自己' });
    }

    await db.foodEntries.remove({ userId: user._id }, { multi: true });
    await db.waterEntries.remove({ userId: user._id }, { multi: true });
    await db.users.remove({ _id: user._id });

    res.json({ message: '用户及相关数据已删除' });
  } catch (error) {
    res.status(500).json({ message: '删除用户失败', error: error.message });
  }
});

module.exports = router;
