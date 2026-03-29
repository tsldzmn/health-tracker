const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const { recognizeFood } = require('./services/visionService');

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

const FOOD_DATABASE = {
  '米饭': { calories: 116, protein: 2.6, carbs: 25.9, fat: 0.3 },
  '面条': { calories: 137, protein: 4.5, carbs: 25.2, fat: 2.1 },
  '馒头': { calories: 223, protein: 7, carbs: 44.2, fat: 1.1 },
  '面包': { calories: 312, protein: 8.3, carbs: 58.6, fat: 5.1 },
  '鸡蛋': { calories: 144, protein: 13.3, carbs: 2.8, fat: 8.8 },
  '牛奶': { calories: 54, protein: 3, carbs: 3.4, fat: 3.2 },
  '酸奶': { calories: 72, protein: 2.5, carbs: 9.3, fat: 2.7 },
  '鸡胸肉': { calories: 133, protein: 31, carbs: 0, fat: 1.2 },
  '牛肉': { calories: 125, protein: 19.9, carbs: 2, fat: 4.2 },
  '猪肉': { calories: 143, protein: 20.3, carbs: 0, fat: 6.2 },
  '鱼肉': { calories: 113, protein: 16.6, carbs: 0, fat: 5.2 },
  '虾': { calories: 87, protein: 18.6, carbs: 0, fat: 0.8 },
  '豆腐': { calories: 73, protein: 8.1, carbs: 1.8, fat: 3.7 },
  '西兰花': { calories: 36, protein: 3.7, carbs: 7.2, fat: 0.4 },
  '菠菜': { calories: 28, protein: 2.6, carbs: 4.5, fat: 0.3 },
  '番茄': { calories: 15, protein: 0.9, carbs: 3.3, fat: 0.2 },
  '黄瓜': { calories: 15, protein: 0.7, carbs: 2.9, fat: 0.1 },
  '胡萝卜': { calories: 37, protein: 1, carbs: 8.8, fat: 0.2 },
  '苹果': { calories: 53, protein: 0.2, carbs: 13.5, fat: 0.2 },
  '香蕉': { calories: 93, protein: 1.4, carbs: 22, fat: 0.2 },
  '橙子': { calories: 47, protein: 0.8, carbs: 11.1, fat: 0.2 },
  '葡萄': { calories: 44, protein: 0.5, carbs: 10.3, fat: 0.2 },
  '西瓜': { calories: 31, protein: 0.5, carbs: 6.8, fat: 0.1 },
  '草莓': { calories: 30, protein: 1, carbs: 7.1, fat: 0.2 },
  '红薯': { calories: 99, protein: 1.1, carbs: 24.7, fat: 0.1 },
  '玉米': { calories: 112, protein: 4, carbs: 22.8, fat: 1.2 },
  '土豆': { calories: 81, protein: 2, carbs: 17.8, fat: 0.1 },
  '白菜': { calories: 13, protein: 1.3, carbs: 2.2, fat: 0.1 },
  '豆浆': { calories: 31, protein: 2.9, carbs: 1.2, fat: 1.6 },
  '三文鱼': { calories: 139, protein: 17.2, carbs: 0, fat: 7.8 },
  '牛油果': { calories: 171, protein: 2, carbs: 8.6, fat: 15.3 }
};

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.get('/api/analysis/search', (req, res) => {
  const keyword = req.query.q || '';
  const results = Object.entries(FOOD_DATABASE)
    .filter(([name]) => name.includes(keyword))
    .slice(0, 10)
    .map(([name, data]) => ({ name, ...data }));
  res.json(results);
});

app.post('/api/analysis/recognize-image', async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) return res.status(400).json({ message: '请提供图片' });
    const result = await recognizeFood(image);
    const enhancedResults = result.results.map(item => {
      const foodInfo = FOOD_DATABASE[item.name];
      return {
        name: item.name,
        probability: item.probability || 85,
        amount: item.amount || 100,
        calories: item.calories || (foodInfo ? foodInfo.calories : 100),
        protein: item.protein || (foodInfo ? foodInfo.protein : 5),
        carbs: item.carbs || (foodInfo ? foodInfo.carbs : 10),
        fat: item.fat || (foodInfo ? foodInfo.fat : 3),
        unit: 'g'
      };
    });
    res.json({ success: result.success, source: result.source, message: result.message, foods: enhancedResults });
  } catch (error) {
    res.status(500).json({ message: '识别失败', error: error.message });
  }
});

const distPath = path.join(__dirname, '../frontend/dist');
app.use(express.static(distPath));
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api')) {
    res.sendFile(path.join(distPath, 'index.html'));
  } else {
    next();
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`服务器已启动: http://localhost:${PORT}`);
});
