const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const { initDatabase, db } = require('./config/db');
const authRoutes = require('./routes/auth');
const foodRoutes = require('./routes/food');
const waterRoutes = require('./routes/water');
const analysisRoutes = require('./routes/analysis');
const adminRoutes = require('./routes/admin');

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', async (req, res) => {
  try {
    const userCount = await db.users.count({});
    res.json({ status: 'ok', users: userCount, port: process.env.PORT || 5000 });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/food', foodRoutes);
app.use('/api/water', waterRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/api/admin', adminRoutes);

const distPath = path.join(__dirname, '../frontend/dist');
app.use(express.static(distPath));

app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api')) {
    res.sendFile(path.join(distPath, 'index.html'));
  } else {
    next();
  }
});

app.use((error, req, res, next) => {
  console.error('服务器错误:', error);
  res.status(500).json({ message: '服务器内部错误', error: error.message });
});

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    await initDatabase();
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`服务器已启动: http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('启动失败:', error);
    process.exit(1);
  }
}

start();
