const bcrypt = require('bcryptjs');
require('dotenv').config();

let mysql;
try { mysql = require('mysql2/promise'); } catch { console.error('请先运行: npm install mysql2'); process.exit(1); }

async function init() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || ''
  });

  console.log('连接MySQL成功');

  await conn.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'health_tracker'} DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await conn.query(`USE ${process.env.DB_NAME || 'health_tracker'}`);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(50) NOT NULL,
      email VARCHAR(100) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      height FLOAT DEFAULT 0,
      weight FLOAT DEFAULT 0,
      target_weight FLOAT DEFAULT 0,
      age INT DEFAULT 0,
      gender ENUM('male','female','') DEFAULT '',
      activity_level ENUM('sedentary','light','moderate','active','very_active') DEFAULT 'sedentary',
      calorie_goal INT DEFAULT 1500,
      water_goal INT DEFAULT 2000,
      points INT DEFAULT 0,
      streak_days INT DEFAULT 0,
      last_checkin DATE,
      is_admin TINYINT(1) DEFAULT 0,
      is_active TINYINT(1) DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS diet_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      meal_type ENUM('breakfast','lunch','dinner','snack') NOT NULL,
      food_name VARCHAR(100) NOT NULL,
      amount FLOAT DEFAULT 100,
      unit VARCHAR(10) DEFAULT 'g',
      calories FLOAT DEFAULT 0,
      protein FLOAT DEFAULT 0,
      carbs FLOAT DEFAULT 0,
      fat FLOAT DEFAULT 0,
      log_date DATE NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_user_date (user_id, log_date)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS water_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      amount INT NOT NULL,
      log_date DATE NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_user_date (user_id, log_date)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  const [rows] = await conn.query('SELECT id FROM users WHERE email = ?', ['admin@health.com']);
  if (rows.length === 0) {
    const hash = await bcrypt.hash('admin123456', 10);
    await conn.query('INSERT INTO users (username, email, password, is_admin) VALUES (?, ?, ?, 1)', ['admin', 'admin@health.com', hash]);
    console.log('管理员账号已创建: admin@health.com / admin123456');
  }

  await conn.end();
  console.log('数据库初始化完成');
}

init().catch(err => { console.error('初始化失败:', err.message); process.exit(1); });
