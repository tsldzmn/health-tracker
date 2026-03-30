-- 健康追踪数据库初始化脚本
-- 使用方法: mysql -u root -p < schema.sql

CREATE DATABASE IF NOT EXISTS health_tracker DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE health_tracker;

-- 用户表
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 饮食记录表
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 饮水记录表
CREATE TABLE IF NOT EXISTS water_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  amount INT NOT NULL,
  log_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_date (user_id, log_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 创建默认管理员
INSERT IGNORE INTO users (username, email, password, is_admin) 
VALUES ('admin', 'admin@health.com', '$2a$10$placeholder_will_be_replaced_by_app', 1);
