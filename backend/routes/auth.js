const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { db } = require('../config/db');
const auth = require('../middleware/auth');
const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ message: '请填写完整信息' });
    }
    const existingUser = await db.users.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ message: '用户名或邮箱已存在' });
    }
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await db.users.insert({
      username, email, password: hashedPassword,
      isAdmin: false, isActive: true,
      profile: { height: 0, weight: 0, targetWeight: 0, age: 0, gender: '', activityLevel: 'sedentary', menstrualCycle: { isTracking: false } },
      dailyGoals: { calories: 1500, water: 2000, protein: 60, carbs: 200, fat: 50 },
      achievements: [], points: 0, streakDays: 0,
      createdAt: new Date(), updatedAt: new Date()
    });
    const jwtSecret = process.env.JWT_SECRET || 'default_secret';
    const token = jwt.sign({ userId: user._id }, jwtSecret, { expiresIn: '30d' });
    res.status(201).json({
      token,
      user: { id: user._id, username: user.username, email: user.email, profile: user.profile, dailyGoals: user.dailyGoals, points: user.points, streakDays: user.streakDays, isAdmin: user.isAdmin }
    });
  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({ message: '注册失败', error: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: '请输入邮箱和密码' });
    }
    console.log('登录尝试:', email);
    const user = await db.users.findOne({ email });
    console.log('用户查找结果:', user ? '找到' : '未找到');
    if (!user) {
      return res.status(401).json({ message: '邮箱或密码错误' });
    }
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: '邮箱或密码错误' });
    }
    if (!user.isActive) {
      return res.status(403).json({ message: '账号已被禁用' });
    }
    const jwtSecret = process.env.JWT_SECRET || 'default_secret';
    const token = jwt.sign({ userId: user._id }, jwtSecret, { expiresIn: '30d' });
    res.json({
      token,
      user: { id: user._id, username: user.username, email: user.email, profile: user.profile, dailyGoals: user.dailyGoals, points: user.points, streakDays: user.streakDays, achievements: user.achievements, isAdmin: user.isAdmin }
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({ message: '登录失败', error: error.message });
  }
});

router.get('/me', auth, async (req, res) => {
  res.json({
    user: { id: req.user._id, username: req.user.username, email: req.user.email, profile: req.user.profile, dailyGoals: req.user.dailyGoals, points: req.user.points, streakDays: req.user.streakDays, achievements: req.user.achievements, isAdmin: req.user.isAdmin }
  });
});

router.put('/profile', auth, async (req, res) => {
  try {
    const { profile, dailyGoals } = req.body;
    const updates = { updatedAt: new Date() };
    if (profile) updates.profile = { ...req.user.profile, ...profile };
    if (dailyGoals) updates.dailyGoals = { ...req.user.dailyGoals, ...dailyGoals };
    await db.users.update({ _id: req.user._id }, { $set: updates });
    const user = await db.users.findOne({ _id: req.user._id });
    res.json({
      user: { id: user._id, username: user.username, email: user.email, profile: user.profile, dailyGoals: user.dailyGoals, points: user.points, streakDays: user.streakDays, isAdmin: user.isAdmin }
    });
  } catch (error) {
    console.error('更新错误:', error);
    res.status(500).json({ message: '更新失败', error: error.message });
  }
});

module.exports = router;
