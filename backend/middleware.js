const jwt = require('jsonwebtoken');
const db = require('./db');

const JWT_SECRET = process.env.JWT_SECRET || 'health_tracker_jwt_secret_2024';

async function auth(req, res, next) {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ message: '请先登录' });

    const decoded = jwt.verify(token, JWT_SECRET);
    const [rows] = await db.query('SELECT * FROM users WHERE id = ? AND is_active = 1', [decoded.userId]);
    if (rows.length === 0) return res.status(401).json({ message: '用户不存在' });

    req.user = rows[0];
    next();
  } catch (err) {
    res.status(401).json({ message: '认证失败' });
  }
}

async function admin(req, res, next) {
  if (!req.user || !req.user.is_admin) return res.status(403).json({ message: '需要管理员权限' });
  next();
}

module.exports = { auth, admin, JWT_SECRET };
