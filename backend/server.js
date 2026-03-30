const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');
require('dotenv').config();
const db = require('./db');
const { auth, admin, JWT_SECRET } = require('./middleware');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const today = () => new Date().toISOString().split('T')[0];

// ==================== 认证接口 ====================

app.post('/api/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) return res.status(400).json({ message: '请填写完整信息' });
    const [exist] = await db.query('SELECT id FROM users WHERE email = ? OR username = ?', [email, username]);
    if (exist.length > 0) return res.status(400).json({ message: '用户名或邮箱已存在' });
    const hash = await bcrypt.hash(password, 10);
    const [result] = await db.query('INSERT INTO users (username, email, password) VALUES (?, ?, ?)', [username, email, hash]);
    const token = jwt.sign({ userId: result.insertId }, JWT_SECRET, { expiresIn: '30d' });
    res.status(201).json({ token, user: { id: result.insertId, username, email, is_admin: 0 } });
  } catch (err) {
    res.status(500).json({ message: '注册失败', error: err.message });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: '请输入邮箱和密码' });
    const [rows] = await db.query('SELECT * FROM users WHERE email = ? AND is_active = 1', [email]);
    if (rows.length === 0) return res.status(401).json({ message: '邮箱或密码错误' });
    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: '邮箱或密码错误' });
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '30d' });
    res.json({
      token,
      user: {
        id: user.id, username: user.username, email: user.email,
        height: user.height, weight: user.weight, target_weight: user.target_weight,
        age: user.age, gender: user.gender, activity_level: user.activity_level,
        calorie_goal: user.calorie_goal, water_goal: user.water_goal,
        points: user.points, streak_days: user.streak_days, is_admin: user.is_admin
      }
    });
  } catch (err) {
    res.status(500).json({ message: '登录失败', error: err.message });
  }
});

app.get('/api/me', auth, (req, res) => {
  const u = req.user;
  res.json({
    user: {
      id: u.id, username: u.username, email: u.email,
      height: u.height, weight: u.weight, target_weight: u.target_weight,
      age: u.age, gender: u.gender, activity_level: u.activity_level,
      calorie_goal: u.calorie_goal, water_goal: u.water_goal,
      points: u.points, streak_days: u.streak_days, is_admin: u.is_admin
    }
  });
});

app.put('/api/profile', auth, async (req, res) => {
  try {
    const b = req.body;
    await db.query(
      'UPDATE users SET height=?, weight=?, target_weight=?, age=?, gender=?, activity_level=?, calorie_goal=?, water_goal=?, username=? WHERE id=?',
      [b.height||0, b.weight||0, b.target_weight||0, b.age||0, b.gender||'', b.activity_level||'sedentary', b.calorie_goal||1500, b.water_goal||2000, b.username||req.user.username, req.user.id]
    );
    res.json({ message: '更新成功' });
  } catch (err) {
    res.status(500).json({ message: '更新失败' });
  }
});

// ==================== 饮食记录 ====================

app.post('/api/diet', auth, async (req, res) => {
  try {
    const { meal_type, foods, log_date } = req.body;
    const date = log_date || today();
    for (const f of foods) {
      await db.query('INSERT INTO diet_logs (user_id,meal_type,food_name,amount,unit,calories,protein,carbs,fat,log_date) VALUES (?,?,?,?,?,?,?,?,?,?)',
        [req.user.id, meal_type, f.name, f.amount||100, f.unit||'g', f.calories||0, f.protein||0, f.carbs||0, f.fat||0, date]);
    }
    await db.query('UPDATE users SET points=points+5 WHERE id=?', [req.user.id]);
    res.status(201).json({ message: '记录成功' });
  } catch (err) {
    res.status(500).json({ message: '记录失败' });
  }
});

app.get('/api/diet/daily', auth, async (req, res) => {
  try {
    const date = req.query.date || today();
    const [entries] = await db.query('SELECT * FROM diet_logs WHERE user_id=? AND log_date=? ORDER BY created_at', [req.user.id, date]);
    res.json({
      date, entries,
      summary: {
        totalCalories: entries.reduce((s,e)=>s+(e.calories||0),0),
        totalProtein: entries.reduce((s,e)=>s+(e.protein||0),0),
        totalCarbs: entries.reduce((s,e)=>s+(e.carbs||0),0),
        totalFat: entries.reduce((s,e)=>s+(e.fat||0),0)
      },
      goals: { calories: req.user.calorie_goal, water: req.user.water_goal }
    });
  } catch (err) {
    res.status(500).json({ message: '获取失败' });
  }
});

app.get('/api/diet/history', auth, async (req, res) => {
  try {
    const days = parseInt(req.query.days)||7;
    const [rows] = await db.query('SELECT log_date,SUM(calories) as total_calories,COUNT(*) as count FROM diet_logs WHERE user_id=? AND log_date>=DATE_SUB(?,INTERVAL ? DAY) GROUP BY log_date ORDER BY log_date DESC', [req.user.id, today(), days]);
    res.json({ days: rows });
  } catch (err) {
    res.status(500).json({ message: '获取失败' });
  }
});

app.delete('/api/diet/:id', auth, async (req, res) => {
  try {
    await db.query('DELETE FROM diet_logs WHERE id=? AND user_id=?', [req.params.id, req.user.id]);
    res.json({ message: '删除成功' });
  } catch (err) {
    res.status(500).json({ message: '删除失败' });
  }
});

// ==================== 饮水记录 ====================

app.post('/api/water', auth, async (req, res) => {
  try {
    const { amount } = req.body;
    await db.query('INSERT INTO water_logs (user_id,amount,log_date) VALUES (?,?,?)', [req.user.id, amount, today()]);
    await db.query('UPDATE users SET points=points+2 WHERE id=?', [req.user.id]);
    const [sum] = await db.query('SELECT SUM(amount) as total FROM water_logs WHERE user_id=? AND log_date=?', [req.user.id, today()]);
    const total = sum[0].total || 0;
    res.status(201).json({ totalToday: total, goal: req.user.water_goal, percentage: Math.round(total/req.user.water_goal*100) });
  } catch (err) {
    res.status(500).json({ message: '记录失败' });
  }
});

app.get('/api/water/daily', auth, async (req, res) => {
  try {
    const date = req.query.date || today();
    const [entries] = await db.query('SELECT * FROM water_logs WHERE user_id=? AND log_date=? ORDER BY created_at', [req.user.id, date]);
    const total = entries.reduce((s,e)=>s+e.amount, 0);
    res.json({ date, entries, total, goal: req.user.water_goal, percentage: Math.round(total/req.user.water_goal*100) });
  } catch (err) {
    res.status(500).json({ message: '获取失败' });
  }
});

// ==================== 分析 ====================

app.get('/api/analysis', auth, async (req, res) => {
  try {
    const u = req.user;
    let bmi=null, bmiStatus='', dailyNeeds=null;
    if (u.height>0 && u.weight>0) {
      bmi = parseFloat((u.weight/Math.pow(u.height/100,2)).toFixed(1));
      bmiStatus = bmi<18.5?'偏瘦':bmi<24?'正常':bmi<28?'超重':'肥胖';
      const bmr = u.gender==='male' ? 88.362+13.397*u.weight+4.799*u.height-5.677*u.age : 447.593+9.247*u.weight+3.098*u.height-4.330*u.age;
      dailyNeeds = Math.round(bmr * ({sedentary:1.2,light:1.375,moderate:1.55,active:1.725,very_active:1.9}[u.activity_level]||1.2));
    }
    const [fs] = await db.query('SELECT SUM(calories) as cal,COUNT(*) as meals FROM diet_logs WHERE user_id=? AND log_date=?', [u.id, today()]);
    const [ws] = await db.query('SELECT SUM(amount) as total FROM water_logs WHERE user_id=? AND log_date=?', [u.id, today()]);
    const cal = fs[0].cal||0, water = ws[0].total||0;
    let suggestions = [];
    if (dailyNeeds) {
      if (cal>dailyNeeds) suggestions.push('今日热量已超标');
      if (water<u.water_goal*0.5) suggestions.push('饮水量不足');
    }
    res.json({
      profile: { bmi, bmiStatus, dailyNeeds, height:u.height, weight:u.weight, target_weight:u.target_weight, age:u.age },
      today: { calories:cal, calorieGoal:u.calorie_goal, water, waterGoal:u.water_goal, remaining:dailyNeeds?dailyNeeds-cal:0, meals:fs[0].meals },
      suggestions, streakDays:u.streak_days, points:u.points
    });
  } catch (err) {
    res.status(500).json({ message: '分析失败' });
  }
});

// ==================== 食物搜索 & AI ====================

const FOOD_DB = {
  '米饭':{calories:116,protein:2.6,carbs:25.9,fat:0.3},'面条':{calories:137,protein:4.5,carbs:25.2,fat:2.1},
  '馒头':{calories:223,protein:7,carbs:44.2,fat:1.1},'面包':{calories:312,protein:8.3,carbs:58.6,fat:5.1},
  '鸡蛋':{calories:144,protein:13.3,carbs:2.8,fat:8.8},'牛奶':{calories:54,protein:3,carbs:3.4,fat:3.2},
  '鸡胸肉':{calories:133,protein:31,carbs:0,fat:1.2},'牛肉':{calories:125,protein:19.9,carbs:2,fat:4.2},
  '猪肉':{calories:143,protein:20.3,carbs:0,fat:6.2},'鱼肉':{calories:113,protein:16.6,carbs:0,fat:5.2},
  '虾':{calories:87,protein:18.6,carbs:0,fat:0.8},'豆腐':{calories:73,protein:8.1,carbs:1.8,fat:3.7},
  '西兰花':{calories:36,protein:3.7,carbs:7.2,fat:0.4},'番茄':{calories:15,protein:0.9,carbs:3.3,fat:0.2},
  '苹果':{calories:53,protein:0.2,carbs:13.5,fat:0.2},'香蕉':{calories:93,protein:1.4,carbs:22,fat:0.2},
  '红薯':{calories:99,protein:1.1,carbs:24.7,fat:0.1},'玉米':{calories:112,protein:4,carbs:22.8,fat:1.2}
};

app.get('/api/search', auth, (req, res) => {
  const q = req.query.q||'';
  res.json(Object.entries(FOOD_DB).filter(([n])=>n.includes(q)).slice(0,10).map(([n,d])=>({name:n,...d})));
});

app.post('/api/recognize', auth, async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) return res.status(400).json({ message: '请提供图片' });
    const resp = await axios.post('https://api.deepseek.com/chat/completions', {
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: [{ type: 'text', text: '识别图中食物，返回JSON数组：[{"name":"食物名","amount":克数,"calories":热量,"protein":蛋白g,"carbs":碳水g,"fat":脂肪g}]。只返回JSON。' }, { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${image}` } }] }],
      max_tokens: 500
    }, { headers: { 'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY||'sk-ffef02f36dcd4b599691605d35135215'}` }, timeout: 30000 });
    const content = resp.data.choices[0].message.content.trim();
    const match = content.match(/\[[\s\S]*?\]/);
    const foods = match ? JSON.parse(match[0]) : [];
    res.json({ success: true, source: 'deepseek', foods: foods.map(f => ({ name: f.name, amount: f.amount||100, calories: f.calories||100, protein: f.protein||0, carbs: f.carbs||0, fat: f.fat||0, probability: 85 })) });
  } catch (err) {
    console.error('识别失败:', err.message);
    res.json({ success: true, source: 'fallback', foods: [{ name: '识别中', amount: 100, calories: 100, protein: 5, carbs: 15, fat: 3, probability: 50 }], message: 'AI暂时不可用' });
  }
});

// ==================== 管理员 ====================

app.get('/api/admin/stats', auth, admin, async (req, res) => {
  try {
    const [u] = await db.query('SELECT COUNT(*) as total, SUM(is_active) as active FROM users');
    const [f] = await db.query('SELECT COUNT(*) as total FROM diet_logs');
    const [w] = await db.query('SELECT COUNT(*) as total FROM water_logs');
    res.json({ overview: { totalUsers: u[0].total, activeUsers: u[0].active||0, totalFoodEntries: f[0].total, totalWaterEntries: w[0].total } });
  } catch (err) { res.status(500).json({ message: '获取失败' }); }
});

app.get('/api/admin/users', auth, admin, async (req, res) => {
  try {
    const page = parseInt(req.query.page)||1, limit = parseInt(req.query.limit)||20;
    const [users] = await db.query('SELECT id,username,email,points,streak_days,is_admin,is_active,created_at FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?', [limit, (page-1)*limit]);
    const [c] = await db.query('SELECT COUNT(*) as total FROM users');
    res.json({ users, total: c[0].total, page, pages: Math.ceil(c[0].total/limit) });
  } catch (err) { res.status(500).json({ message: '获取失败' }); }
});

app.put('/api/admin/users/:id', auth, admin, async (req, res) => {
  try { await db.query('UPDATE users SET is_admin=?,is_active=? WHERE id=?', [req.body.is_admin||0, req.body.is_active??1, req.params.id]); res.json({ message: '更新成功' }); }
  catch (err) { res.status(500).json({ message: '更新失败' }); }
});

app.delete('/api/admin/users/:id', auth, admin, async (req, res) => {
  try {
    if (parseInt(req.params.id)===req.user.id) return res.status(400).json({ message: '不能删除自己' });
    await db.query('DELETE FROM diet_logs WHERE user_id=?', [req.params.id]);
    await db.query('DELETE FROM water_logs WHERE user_id=?', [req.params.id]);
    await db.query('DELETE FROM users WHERE id=?', [req.params.id]);
    res.json({ message: '删除成功' });
  } catch (err) { res.status(500).json({ message: '删除失败' }); }
});

// ==================== 静态文件 ====================

const distPath = path.join(__dirname, '../frontend/dist');
app.use(express.static(distPath));
app.use((req, res, next) => { if (req.method==='GET' && !req.path.startsWith('/api')) res.sendFile(path.join(distPath, 'index.html')); });

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => console.log(`服务器启动: http://localhost:${PORT}`));
