const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');
const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'health_tracker_default_secret_2024';

router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ message: '请填写完整信息' });
    }
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ message: '用户名或邮箱已存在' });
    }
    const user = new User({ username, email, password });
    await user.save();
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '30d' });
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
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: '邮箱或密码错误' });
    }
    const passwordMatch = await user.comparePassword(password);
    if (!passwordMatch) {
      return res.status(401).json({ message: '邮箱或密码错误' });
    }
    if (!user.isActive) {
      return res.status(403).json({ message: '账号已被禁用' });
    }
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '30d' });
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
    if (profile) {
      Object.assign(req.user.profile, profile);
    }
    if (dailyGoals) {
      Object.assign(req.user.dailyGoals, dailyGoals);
    }
    await req.user.save();
    res.json({
      user: { id: req.user._id, username: req.user.username, email: req.user.email, profile: req.user.profile, dailyGoals: req.user.dailyGoals, points: req.user.points, streakDays: req.user.streakDays, isAdmin: req.user.isAdmin }
    });
  } catch (error) {
    res.status(500).json({ message: '更新失败', error: error.message });
  }
});

module.exports = router;
