const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const JWT = process.env.JWT_SECRET || 'health2024';
const today = () => new Date().toISOString().split('T')[0];

// 内存数据库
let uid = 1;
const users = [];
const foods = [];
const waters = [];

// 默认管理员
bcrypt.hash('admin123', 10).then(h => {
  users.push({ id: uid++, name: '管理员', email: 'admin@health.com', pass: h, height: 170, weight: 65, target: 60, age: 28, gender: 'female', level: 'light', calGoal: 1500, waterGoal: 2000, points: 0, streak: 0, admin: 1, active: 1, created: new Date() });
});

// 认证中间件
const auth = (req, res, next) => {
  try {
    const t = req.headers.authorization?.replace('Bearer ', '');
    if (!t) return res.status(401).json({ msg: '请登录' });
    const d = jwt.verify(t, JWT);
    const u = users.find(x => x.id === d.uid && x.active);
    if (!u) return res.status(401).json({ msg: '用户不存在' });
    req.u = u;
    next();
  } catch { res.status(401).json({ msg: '认证失败' }); }
};

const admin = (req, res, next) => {
  if (!req.u?.admin) return res.status(403).json({ msg: '需要管理员权限' });
  next();
};

// 注册
app.post('/api/reg', async (req, res) => {
  const { name, email, pass } = req.body;
  if (!name || !email || !pass) return res.status(400).json({ msg: '请填写完整' });
  if (users.find(u => u.email === email)) return res.status(400).json({ msg: '邮箱已存在' });
  const h = await bcrypt.hash(pass, 10);
  const u = { id: uid++, name, email, pass: h, height: 0, weight: 0, target: 0, age: 0, gender: '', level: 'sedentary', calGoal: 1500, waterGoal: 2000, points: 0, streak: 0, admin: 0, active: 1, created: new Date() };
  users.push(u);
  const token = jwt.sign({ uid: u.id }, JWT, { expiresIn: '30d' });
  res.json({ token, user: { id: u.id, name, email, admin: 0 } });
});

// 登录
app.post('/api/login', async (req, res) => {
  const { email, pass } = req.body;
  const u = users.find(x => x.email === email && x.active);
  if (!u || !(await bcrypt.compare(pass, u.pass))) return res.status(401).json({ msg: '邮箱或密码错误' });
  const token = jwt.sign({ uid: u.id }, JWT, { expiresIn: '30d' });
  res.json({ token, user: { id: u.id, name: u.name, email: u.email, height: u.height, weight: u.weight, target: u.target, age: u.age, gender: u.gender, level: u.level, calGoal: u.calGoal, waterGoal: u.waterGoal, points: u.points, streak: u.streak, admin: u.admin } });
});

// 获取用户信息
app.get('/api/me', auth, (req, res) => {
  const u = req.u;
  res.json({ user: { id: u.id, name: u.name, email: u.email, height: u.height, weight: u.weight, target: u.target, age: u.age, gender: u.gender, level: u.level, calGoal: u.calGoal, waterGoal: u.waterGoal, points: u.points, streak: u.streak, admin: u.admin } });
});

// 更新资料
app.put('/api/profile', auth, (req, res) => {
  const b = req.body;
  Object.assign(req.u, { name: b.name || req.u.name, height: +b.height || 0, weight: +b.weight || 0, target: +b.target || 0, age: +b.age || 0, gender: b.gender || '', level: b.level || 'sedentary', calGoal: +b.calGoal || 1500, waterGoal: +b.waterGoal || 2000 });
  res.json({ ok: 1 });
});

// 添加饮食
app.post('/api/food', auth, (req, res) => {
  const { meal, items, date } = req.body;
  items.forEach(f => {
    foods.push({ id: Date.now() + Math.random(), uid: req.u.id, meal, name: f.name, amount: f.amount || 100, cal: f.cal || 0, protein: f.protein || 0, carbs: f.carbs || 0, fat: f.fat || 0, date: date || today(), time: new Date() });
  });
  req.u.points += 5;
  res.json({ ok: 1 });
});

// 获取今日饮食
app.get('/api/food', auth, (req, res) => {
  const d = req.query.date || today();
  const list = foods.filter(f => f.uid === req.u.id && f.date === d);
  res.json({ foods: list, total: list.reduce((s, f) => s + f.cal, 0), goal: req.u.calGoal });
});

// 删除饮食记录
app.delete('/api/food/:id', auth, (req, res) => {
  const i = foods.findIndex(f => f.id == req.params.id && f.uid === req.u.id);
  if (i >= 0) foods.splice(i, 1);
  res.json({ ok: 1 });
});

// 添加饮水
app.post('/api/water', auth, (req, res) => {
  waters.push({ id: Date.now(), uid: req.u.id, amount: +req.body.amount || 250, date: today(), time: new Date() });
  req.u.points += 2;
  const total = waters.filter(w => w.uid === req.u.id && w.date === today()).reduce((s, w) => s + w.amount, 0);
  res.json({ total, goal: req.u.waterGoal });
});

// 获取今日饮水
app.get('/api/water', auth, (req, res) => {
  const d = req.query.date || today();
  const list = waters.filter(w => w.uid === req.u.id && w.date === d);
  res.json({ waters: list, total: list.reduce((s, w) => s + w.amount, 0), goal: req.u.waterGoal });
});

// 分析
app.get('/api/analysis', auth, (req, res) => {
  const u = req.u;
  let bmi = null, bmiStatus = '', needs = null;
  if (u.height > 0 && u.weight > 0) {
    bmi = +(u.weight / Math.pow(u.height / 100, 2)).toFixed(1);
    bmiStatus = bmi < 18.5 ? '偏瘦' : bmi < 24 ? '正常' : bmi < 28 ? '超重' : '肥胖';
    const bmr = u.gender === 'male' ? 88.362 + 13.397 * u.weight + 4.799 * u.height - 5.677 * u.age : 447.593 + 9.247 * u.weight + 3.098 * u.height - 4.330 * u.age;
    needs = Math.round(bmr * { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, very_active: 1.9 }[u.level] || 1.2);
  }
  const cal = foods.filter(f => f.uid === u.id && f.date === today()).reduce((s, f) => s + f.cal, 0);
  const water = waters.filter(w => w.uid === u.id && w.date === today()).reduce((s, w) => s + w.amount, 0);
  let tips = [];
  if (needs && cal > needs) tips.push('今日热量已超标');
  if (water < u.waterGoal * 0.5) tips.push('饮水量不足');
  const h = new Date().getHours();
  let nextMeal = '';
  if (h < 10) nextMeal = '早餐：全麦面包+鸡蛋+牛奶 约350kcal';
  else if (h < 14) nextMeal = '午餐：糙米饭+鸡胸肉+蔬菜 约450kcal';
  else if (h < 20) nextMeal = '晚餐：杂粮粥+鱼+沙拉 约350kcal';
  else nextMeal = '夜间：牛奶或少量水果';
  res.json({ bmi, bmiStatus, needs, cal, water, calGoal: u.calGoal, waterGoal: u.waterGoal, tips, nextMeal, points: u.points, streak: u.streak });
});

// 食物搜索
const DB = { '米饭': 116, '面条': 137, '馒头': 223, '面包': 312, '鸡蛋': 144, '牛奶': 54, '鸡胸肉': 133, '牛肉': 125, '猪肉': 143, '鱼肉': 113, '虾': 87, '豆腐': 73, '西兰花': 36, '番茄': 15, '苹果': 53, '香蕉': 93, '红薯': 99, '玉米': 112, '菠菜': 28, '黄瓜': 15, '胡萝卜': 37, '橙子': 47, '葡萄': 44, '草莓': 30 };
app.get('/api/search', auth, (req, res) => {
  const q = req.query.q || '';
  res.json(Object.entries(DB).filter(([n]) => n.includes(q)).slice(0, 10).map(([n, c]) => ({ name: n, cal: c, protein: 0, carbs: 0, fat: 0 })));
});

// 食物识别
app.post('/api/recognize-food', auth, (req, res) => {
  res.json({ foods: [{ name: '识别结果', amount: 150, cal: 200, protein: 10, carbs: 30, fat: 5 }] });
});

// 管理员 - 统计
app.get('/api/admin/stats', auth, admin, (req, res) => {
  res.json({ users: users.length, foods: foods.length, waters: waters.length, todayUsers: [...new Set(foods.filter(f => f.date === today()).map(f => f.uid))].length });
});

// 管理员 - 用户列表
app.get('/api/admin/users', auth, admin, (req, res) => {
  res.json(users.map(u => ({
    id: u.id, name: u.name, email: u.email, height: u.height, weight: u.weight, age: u.age, gender: u.gender,
    calGoal: u.calGoal, waterGoal: u.waterGoal, points: u.points, streak: u.streak, admin: u.admin, active: u.active,
    todayCal: foods.filter(f => f.uid === u.id && f.date === today()).reduce((s, f) => s + f.cal, 0),
    todayWater: waters.filter(w => w.uid === u.id && w.date === today()).reduce((s, w) => s + w.amount, 0)
  })));
});

// 管理员 - 添加用户
app.post('/api/admin/users', auth, admin, async (req, res) => {
  const { name, email, pass } = req.body;
  if (!name || !email || !pass) return res.status(400).json({ msg: '请填写完整' });
  if (users.find(u => u.email === email)) return res.status(400).json({ msg: '邮箱已存在' });
  const h = await bcrypt.hash(pass, 10);
  users.push({ id: uid++, name, email, pass: h, height: 0, weight: 0, target: 0, age: 0, gender: '', level: 'sedentary', calGoal: 1500, waterGoal: 2000, points: 0, streak: 0, admin: 0, active: 1, created: new Date() });
  res.json({ ok: 1 });
});

// 管理员 - 更新用户
app.put('/api/admin/users/:id', auth, admin, (req, res) => {
  const u = users.find(x => x.id === +req.params.id);
  if (!u) return res.status(404).json({ msg: '用户不存在' });
  if (req.body.admin !== undefined) u.admin = req.body.admin;
  if (req.body.active !== undefined) u.active = req.body.active;
  res.json({ ok: 1 });
});

// 管理员 - 删除用户
app.delete('/api/admin/users/:id', auth, admin, (req, res) => {
  const id = +req.params.id;
  if (id === req.u.id) return res.status(400).json({ msg: '不能删除自己' });
  const i = users.findIndex(u => u.id === id);
  if (i < 0) return res.status(404).json({ msg: '用户不存在' });
  users.splice(i, 1);
  for (let j = foods.length - 1; j >= 0; j--) if (foods[j].uid === id) foods.splice(j, 1);
  for (let j = waters.length - 1; j >= 0; j--) if (waters[j].uid === id) waters.splice(j, 1);
  res.json({ ok: 1 });
});

// SPA fallback
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => console.log('启动成功: http://localhost:' + PORT));
