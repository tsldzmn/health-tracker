const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://healthuser:Health2024@health-tracker.abc12.mongodb.net/health-tracker?retryWrites=true&w=majority';

async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB 连接成功');
    await initAdmin();
  } catch (error) {
    console.error('MongoDB 连接失败:', error.message);
    console.log('使用备用内存数据库...');
    process.exit(1);
  }
}

async function initAdmin() {
  try {
    const adminExists = await User.findOne({ isAdmin: true });
    if (!adminExists) {
      const user = new User({
        username: 'admin',
        email: 'admin@health.com',
        password: 'admin123456',
        isAdmin: true
      });
      await user.save();
      console.log('默认管理员已创建: admin@health.com / admin123456');
    }
  } catch (error) {
    console.log('管理员初始化跳过');
  }
}

module.exports = connectDB;
