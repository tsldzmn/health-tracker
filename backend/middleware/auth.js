const jwt = require('jsonwebtoken');
const { db } = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'health_tracker_default_secret_2024';

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: '请先登录' });
    }
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await db.users.findOne({ _id: decoded.userId });
    if (!user) {
      return res.status(401).json({ message: '用户不存在' });
    }
    if (!user.isActive) {
      return res.status(403).json({ message: '账号已被禁用' });
    }
    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    console.error('认证失败:', error.message);
    res.status(401).json({ message: '认证失败，请重新登录' });
  }
};

module.exports = auth;
