const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const JWT_SECRET = process.env.JWT_SECRET || 'health_tracker_jwt_2024';
const today = () => new Date().toISOString().split('T')[0];

// ==================== 内存数据库 ====================
let nextId = 1;
const users = [];
const dietLogs = [];
const waterLogs = [];

// 创建默认管理员
bcrypt.hash('admin123', 10).then(hash => {
  users.push({
    id: nextId++, username: '管理员', email: 'admin@health.com', password: hash,
    height: 0, weight: 0, target_weight: 0, age: 0, gender: '',
    activity_level: 'sedentary', calorie_goal: 1500, water_goal: 2000,
    points: 0, streak_days: 0, is_admin: 1, is_active: 1, created_at: new Date()
  });
  console.log('默认管理员: admin@health.com / admin123');
});

// ==================== 中间件 ====================
async function auth(req, res, next) {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ message: '请先登录' });
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = users.find(u => u.id === decoded.userId && u.is_active);
    if (!user) return res.status(401).json({ message: '用户不存在' });
    req.user = user;
    next();
  } catch (e) { res.status(401).json({ message: '认证失败' }); }
}

function adminCheck(req, res, next) {
  if (!req.user?.is_admin) return res.status(403).json({ message: '需要管理员权限' });
  next();
}

// ==================== 认证 ====================
app.post('/api/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) return res.status(400).json({ message: '请填写完整信息' });
    if (users.find(u => u.email === email || u.username === username)) return res.status(400).json({ message: '用户名或邮箱已存在' });
    const hash = await bcrypt.hash(password, 10);
    const user = { id: nextId++, username, email, password: hash, height: 0, weight: 0, target_weight: 0, age: 0, gender: '', activity_level: 'sedentary', calorie_goal: 1500, water_goal: 2000, points: 0, streak_days: 0, is_admin: 0, is_active: 1, created_at: new Date() };
    users.push(user);
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '30d' });
    res.status(201).json({ token, user: { id: user.id, username, email, is_admin: 0 } });
  } catch (e) { res.status(500).json({ message: '注册失败' }); }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = users.find(u => u.email === email && u.is_active);
    if (!user || !(await bcrypt.compare(password, user.password))) return res.status(401).json({ message: '邮箱或密码错误' });
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, user: { id: user.id, username: user.username, email: user.email, height: user.height, weight: user.weight, target_weight: user.target_weight, age: user.age, gender: user.gender, activity_level: user.activity_level, calorie_goal: user.calorie_goal, water_goal: user.water_goal, points: user.points, streak_days: user.streak_days, is_admin: user.is_admin } });
  } catch (e) { res.status(500).json({ message: '登录失败' }); }
});

app.get('/api/me', auth, (req, res) => {
  const u = req.user;
  res.json({ user: { id: u.id, username: u.username, email: u.email, height: u.height, weight: u.weight, target_weight: u.target_weight, age: u.age, gender: u.gender, activity_level: u.activity_level, calorie_goal: u.calorie_goal, water_goal: u.water_goal, points: u.points, streak_days: u.streak_days, is_admin: u.is_admin } });
});

app.put('/api/profile', auth, (req, res) => {
  const b = req.body;
  Object.assign(req.user, { height: b.height||0, weight: b.weight||0, target_weight: b.target_weight||0, age: b.age||0, gender: b.gender||'', activity_level: b.activity_level||'sedentary', calorie_goal: b.calorie_goal||1500, water_goal: b.water_goal||2000, username: b.username||req.user.username });
  res.json({ message: '更新成功' });
});

// ==================== 饮食 ====================
app.post('/api/diet', auth, (req, res) => {
  const { meal_type, foods, log_date } = req.body;
  foods.forEach(f => {
    dietLogs.push({ id: Date.now() + Math.random(), user_id: req.user.id, meal_type, food_name: f.name, amount: f.amount||100, unit: f.unit||'g', calories: f.calories||0, protein: f.protein||0, carbs: f.carbs||0, fat: f.fat||0, log_date: log_date||today(), created_at: new Date() });
  });
  req.user.points += 5;
  res.status(201).json({ message: '记录成功' });
});

app.get('/api/diet/daily', auth, (req, res) => {
  const date = req.query.date || today();
  const entries = dietLogs.filter(e => e.user_id === req.user.id && e.log_date === date);
  res.json({
    date, entries,
    summary: { totalCalories: entries.reduce((s,e)=>s+e.calories,0), totalProtein: entries.reduce((s,e)=>s+e.protein,0), totalCarbs: entries.reduce((s,e)=>s+e.carbs,0), totalFat: entries.reduce((s,e)=>s+e.fat,0) },
    goals: { calories: req.user.calorie_goal, water: req.user.water_goal }
  });
});

app.delete('/api/diet/:id', auth, (req, res) => {
  const idx = dietLogs.findIndex(e => e.id == req.params.id && e.user_id === req.user.id);
  if (idx >= 0) dietLogs.splice(idx, 1);
  res.json({ message: '删除成功' });
});

// ==================== 饮水 ====================
app.post('/api/water', auth, (req, res) => {
  waterLogs.push({ id: Date.now(), user_id: req.user.id, amount: req.body.amount, log_date: today(), created_at: new Date() });
  req.user.points += 2;
  const total = waterLogs.filter(e => e.user_id === req.user.id && e.log_date === today()).reduce((s,e)=>s+e.amount, 0);
  res.status(201).json({ totalToday: total, goal: req.user.water_goal, percentage: Math.round(total/req.user.water_goal*100) });
});

app.get('/api/water/daily', auth, (req, res) => {
  const date = req.query.date || today();
  const entries = waterLogs.filter(e => e.user_id === req.user.id && e.log_date === date);
  const total = entries.reduce((s,e)=>s+e.amount, 0);
  res.json({ date, entries, total, goal: req.user.water_goal, percentage: Math.round(total/req.user.water_goal*100) });
});

// ==================== 分析 ====================
app.get('/api/analysis', auth, (req, res) => {
  const u = req.user;
  let bmi=null, bmiStatus='', dailyNeeds=null;
  if (u.height>0 && u.weight>0) {
    bmi = parseFloat((u.weight/Math.pow(u.height/100,2)).toFixed(1));
    bmiStatus = bmi<18.5?'偏瘦':bmi<24?'正常':bmi<28?'超重':'肥胖';
    const bmr = u.gender==='male' ? 88.362+13.397*u.weight+4.799*u.height-5.677*u.age : 447.593+9.247*u.weight+3.098*u.height-4.330*u.age;
    dailyNeeds = Math.round(bmr * 1.2);
  }
  const cal = dietLogs.filter(e=>e.user_id===u.id && e.log_date===today()).reduce((s,e)=>s+e.calories,0);
  const water = waterLogs.filter(e=>e.user_id===u.id && e.log_date===today()).reduce((s,e)=>s+e.amount,0);
  const meals = dietLogs.filter(e=>e.user_id===u.id && e.log_date===today()).length;
  let suggestions = [];
  if (dailyNeeds && cal>dailyNeeds) suggestions.push('今日热量已超标');
  if (water<1000) suggestions.push('饮水量不足');
  res.json({ profile: { bmi, bmiStatus, dailyNeeds, height:u.height, weight:u.weight, target_weight:u.target_weight, age:u.age }, today: { calories:cal, calorieGoal:u.calorie_goal, water, waterGoal:u.water_goal, remaining:dailyNeeds?dailyNeeds-cal:0, meals }, suggestions, streakDays:u.streak_days, points:u.points });
});

// ==================== 食物搜索 ====================
const FOOD_DB = { '米饭':116, '面条':137, '馒头':223, '面包':312, '鸡蛋':144, '牛奶':54, '鸡胸肉':133, '牛肉':125, '猪肉':143, '鱼肉':113, '虾':87, '豆腐':73, '西兰花':36, '番茄':15, '苹果':53, '香蕉':93, '红薯':99, '玉米':112 };
app.get('/api/search', auth, (req, res) => {
  const q = req.query.q||'';
  res.json(Object.entries(FOOD_DB).filter(([n])=>n.includes(q)).slice(0,10).map(([n,d])=>({name:n,calories:d,protein:0,carbs:0,fat:0})));
});

app.post('/api/recognize', auth, async (req, res) => {
  try {
    const resp = await axios.post('https://api.deepseek.com/chat/completions', {
      model: 'deepseek-chat', messages: [{ role: 'user', content: [{ type: 'text', text: '识别图中食物，返回JSON：[{"name":"食物名","amount":克数,"calories":热量,"protein":蛋白g,"carbs":碳水g,"fat":脂肪g}]' }, { type: 'image_url', image_url: { url: 'data:image/jpeg;base64,' + req.body.image } }] }], max_tokens: 500
    }, { headers: { 'Authorization': 'Bearer ' + (process.env.DEEPSEEK_API_KEY||'sk-ffef02f36dcd4b599691605d35135215') }, timeout: 30000 });
    const m = resp.data.choices[0].message.content.match(/\[[\s\S]*?\]/);
    const foods = m ? JSON.parse(m[0]) : [];
    res.json({ success: true, source: 'deepseek', foods: foods.map(f=>({name:f.name,amount:f.amount||100,calories:f.calories||100,protein:f.protein||0,carbs:f.carbs||0,fat:f.fat||0})) });
  } catch (e) { res.json({ success: true, source: 'fallback', foods: [{ name: '请手动输入', amount: 100, calories: 100, protein: 5, carbs: 15, fat: 3 }] }); }
});

// ==================== 管理员接口 ====================
app.get('/api/admin/stats', auth, adminCheck, (req, res) => {
  res.json({ overview: { totalUsers: users.length, activeUsers: users.filter(u=>u.is_active).length, totalFoodEntries: dietLogs.length, totalWaterEntries: waterLogs.length, todayCheckIns: [...new Set(dietLogs.filter(e=>e.log_date===today()).map(e=>e.user_id))].length } });
});

app.get('/api/admin/users', auth, adminCheck, (req, res) => {
  const list = users.map(u => ({
    id: u.id, username: u.username, email: u.email, height: u.height, weight: u.weight,
    age: u.age, gender: u.gender, calorie_goal: u.calorie_goal, water_goal: u.water_goal,
    points: u.points, streak_days: u.streak_days, is_admin: u.is_admin, is_active: u.is_active, created_at: u.created_at,
    todayCalories: dietLogs.filter(e=>e.user_id===u.id && e.log_date===today()).reduce((s,e)=>s+e.calories,0),
    todayWater: waterLogs.filter(e=>e.user_id===u.id && e.log_date===today()).reduce((s,e)=>s+e.amount,0),
    todayMeals: dietLogs.filter(e=>e.user_id===u.id && e.log_date===today()).length
  }));
  res.json({ users: list, total: list.length });
});

app.post('/api/admin/users', auth, adminCheck, async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) return res.status(400).json({ message: '请填写完整信息' });
  if (users.find(u => u.email === email)) return res.status(400).json({ message: '邮箱已存在' });
  const hash = await bcrypt.hash(password, 10);
  users.push({ id: nextId++, username, email, password: hash, height: 0, weight: 0, target_weight: 0, age: 0, gender: '', activity_level: 'sedentary', calorie_goal: 1500, water_goal: 2000, points: 0, streak_days: 0, is_admin: 0, is_active: 1, created_at: new Date() });
  res.status(201).json({ message: '创建成功' });
});

app.put('/api/admin/users/:id', auth, adminCheck, (req, res) => {
  const user = users.find(u => u.id === parseInt(req.params.id));
  if (!user) return res.status(404).json({ message: '用户不存在' });
  if (req.body.is_admin !== undefined) user.is_admin = req.body.is_admin;
  if (req.body.is_active !== undefined) user.is_active = req.body.is_active;
  res.json({ message: '更新成功' });
});

app.delete('/api/admin/users/:id', auth, adminCheck, (req, res) => {
  const id = parseInt(req.params.id);
  if (id === req.user.id) return res.status(400).json({ message: '不能删除自己' });
  const idx = users.findIndex(u => u.id === id);
  if (idx < 0) return res.status(404).json({ message: '用户不存在' });
  users.splice(idx, 1);
  for (let i = dietLogs.length - 1; i >= 0; i--) if (dietLogs[i].user_id === id) dietLogs.splice(i, 1);
  for (let i = waterLogs.length - 1; i >= 0; i--) if (waterLogs[i].user_id === id) waterLogs.splice(i, 1);
  res.json({ message: '删除成功' });
});

// ==================== 静态文件 ====================
const distPath = path.join(__dirname, '../frontend/dist');
app.use(express.static(distPath));
app.use((req, res, next) => { if (req.method === 'GET' && !req.path.startsWith('/api')) res.sendFile(path.join(distPath, 'index.html')); });

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => console.log('服务器启动: http://localhost:' + PORT));
