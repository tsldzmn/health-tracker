const Datastore = require('nedb-promises');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const dbDir = path.join(__dirname, '../data');

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = {
  users: Datastore.create({ filename: path.join(dbDir, 'users.db'), autoload: true }),
  foodEntries: Datastore.create({ filename: path.join(dbDir, 'food_entries.db'), autoload: true }),
  waterEntries: Datastore.create({ filename: path.join(dbDir, 'water_entries.db'), autoload: true })
};

async function initDatabase() {
  try {
    await db.users.ensureIndex({ fieldName: 'email', unique: true });
    await db.users.ensureIndex({ fieldName: 'username', unique: true });
    await db.foodEntries.ensureIndex({ fieldName: 'userId' });
    await db.foodEntries.ensureIndex({ fieldName: 'date' });
    await db.waterEntries.ensureIndex({ fieldName: 'userId' });
    await db.waterEntries.ensureIndex({ fieldName: 'date' });

    const adminExists = await db.users.findOne({ isAdmin: true });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('admin123456', 12);
      await db.users.insert({
        username: 'admin',
        email: 'admin@health.com',
        password: hashedPassword,
        isAdmin: true,
        isActive: true,
        profile: { height: 0, weight: 0, targetWeight: 0, age: 0, gender: '', activityLevel: 'sedentary', menstrualCycle: { isTracking: false } },
        dailyGoals: { calories: 1500, water: 2000, protein: 60, carbs: 200, fat: 50 },
        achievements: [],
        points: 0,
        streakDays: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log('默认管理员账号已创建: admin@health.com / admin123456');
    }
    console.log('数据库初始化完成');
  } catch (error) {
    console.error('数据库初始化失败:', error.message);
  }
}

module.exports = { db, initDatabase };
