const express = require('express');
const { db } = require('../config/db');
const auth = require('../middleware/auth');
const router = express.Router();

router.post('/', auth, async (req, res) => {
  try {
    const { amount } = req.body;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const entry = await db.waterEntries.insert({
      userId: req.user._id,
      date: today,
      amount,
      time: new Date(),
      createdAt: new Date()
    });

    const points = (req.user.points || 0) + 2;
    await db.users.update({ _id: req.user._id }, { $set: { points, updatedAt: new Date() } });

    const totalToday = await getTotalWater(req.user._id, today);
    res.status(201).json({
      entry,
      totalToday,
      goal: req.user.dailyGoals.water,
      percentage: Math.round((totalToday / req.user.dailyGoals.water) * 100)
    });
  } catch (error) {
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

    const entries = await db.waterEntries.find({
      userId: req.user._id,
      date: { $gte: date, $lt: nextDay }
    });
    entries.sort((a, b) => new Date(a.time) - new Date(b.time));

    const total = entries.reduce((sum, e) => sum + e.amount, 0);

    res.json({
      date: dateStr,
      entries,
      total,
      goal: req.user.dailyGoals.water,
      percentage: Math.round((total / req.user.dailyGoals.water) * 100)
    });
  } catch (error) {
    res.status(500).json({ message: '获取失败', error: error.message });
  }
});

router.get('/history', auth, async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const entries = await db.waterEntries.find({
      userId: req.user._id,
      date: { $gte: startDate }
    });

    const grouped = {};
    entries.forEach(entry => {
      const key = new Date(entry.date).toISOString().split('T')[0];
      if (!grouped[key]) grouped[key] = { date: key, total: 0, entries: [] };
      grouped[key].total += entry.amount;
      grouped[key].entries.push(entry);
    });

    res.json({
      days: Object.values(grouped),
      goal: req.user.dailyGoals.water
    });
  } catch (error) {
    res.status(500).json({ message: '获取失败', error: error.message });
  }
});

async function getTotalWater(userId, date) {
  const nextDay = new Date(date);
  nextDay.setDate(nextDay.getDate() + 1);
  const entries = await db.waterEntries.find({
    userId,
    date: { $gte: date, $lt: nextDay }
  });
  return entries.reduce((sum, e) => sum + e.amount, 0);
}

module.exports = router;
