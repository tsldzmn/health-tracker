const axios = require('axios');

let cachedToken = null;
let tokenExpireTime = 0;

async function getAccessToken() {
  const now = Date.now();
  if (cachedToken && now < tokenExpireTime) {
    return cachedToken;
  }

  const { BAIDU_API_KEY, BAIDU_SECRET_KEY } = process.env;
  if (!BAIDU_API_KEY || !BAIDU_SECRET_KEY || BAIDU_API_KEY === 'your_api_key') {
    return null;
  }

  try {
    const res = await axios.post(
      'https://aip.baidubce.com/oauth/2.0/token',
      null,
      {
        params: {
          grant_type: 'client_credentials',
          client_id: BAIDU_API_KEY,
          client_secret: BAIDU_SECRET_KEY
        }
      }
    );
    cachedToken = res.data.access_token;
    tokenExpireTime = now + (res.data.expires_in - 60) * 1000;
    return cachedToken;
  } catch (error) {
    console.error('获取百度AI Token失败:', error.message);
    return null;
  }
}

async function recognizeFood(imageBase64) {
  const token = await getAccessToken();
  if (!token) {
    return recognizeFoodFallback(imageBase64);
  }

  try {
    const res = await axios.post(
      `https://aip.baidubce.com/rest/2.0/image-classify/v2/dish?access_token=${token}`,
      `image=${encodeURIComponent(imageBase64)}&top_num=5`,
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      }
    );

    if (res.data.result && res.data.result.length > 0) {
      return {
        success: true,
        source: 'baidu',
        results: res.data.result.map(item => ({
          name: item.name,
          probability: item.probability,
          calorie: item.calorie || estimateCalorie(item.name)
        }))
      };
    }

    return await recognizeGeneral(imageBase64, token);
  } catch (error) {
    console.error('百度食物识别失败:', error.message);
    return recognizeFoodFallback(imageBase64);
  }
}

async function recognizeGeneral(imageBase64, token) {
  try {
    const res = await axios.post(
      `https://aip.baidubce.com/rest/2.0/image-classify/v2/advanced_general?access_token=${token}`,
      `image=${encodeURIComponent(imageBase64)}`,
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      }
    );

    if (res.data.result) {
      const foodResults = res.data.result.filter(item =>
        isFoodRelated(item.keyword)
      );

      return {
        success: true,
        source: 'baidu-general',
        results: foodResults.map(item => ({
          name: item.keyword,
          probability: item.score,
          calorie: estimateCalorie(item.keyword)
        }))
      };
    }

    return recognizeFoodFallback(imageBase64);
  } catch (error) {
    return recognizeFoodFallback(imageBase64);
  }
}

function isFoodRelated(keyword) {
  const foodKeywords = [
    '饭', '面', '肉', '菜', '鱼', '鸡', '鸭', '牛', '猪', '羊',
    '蛋', '豆腐', '汤', '粥', '饼', '包', '饺', '水果', '苹果',
    '香蕉', '橙', '葡萄', '西瓜', '草莓', '芒果', '蛋糕', '面包',
    '奶', '豆', '虾', '蟹', '瓜', '番茄', '黄瓜', '白菜', '萝卜',
    '土豆', '玉米', '红薯', '火锅', '烤', '炸', '炒', '蒸', '煮'
  ];
  return foodKeywords.some(k => keyword.includes(k));
}

function estimateCalorie(foodName) {
  const calorieMap = {
    '米饭': 116, '面条': 137, '馒头': 223, '面包': 312,
    '鸡蛋': 144, '牛奶': 54, '鸡胸肉': 133, '牛肉': 125,
    '猪肉': 143, '鱼': 113, '虾': 87, '豆腐': 73,
    '西兰花': 36, '菠菜': 28, '番茄': 15, '苹果': 53,
    '香蕉': 93, '橙子': 47, '西瓜': 31, '蛋糕': 347,
    '火锅': 200, '烤肉': 250, '炸鸡': 280, '沙拉': 50
  };

  for (const [key, cal] of Object.entries(calorieMap)) {
    if (foodName.includes(key)) return cal;
  }
  return 100;
}

const MOCK_FOODS = [
  { name: '米饭', calorie: 116, probability: 0.85 },
  { name: '红烧肉', calorie: 250, probability: 0.78 },
  { name: '清炒西兰花', calorie: 36, probability: 0.82 },
  { name: '番茄炒蛋', calorie: 95, probability: 0.88 },
  { name: '水煮鱼', calorie: 120, probability: 0.75 },
  { name: '宫保鸡丁', calorie: 180, probability: 0.80 },
  { name: '麻婆豆腐', calorie: 120, probability: 0.83 },
  { name: '糖醋排骨', calorie: 220, probability: 0.77 },
  { name: '炒青菜', calorie: 30, probability: 0.85 },
  { name: '酸辣汤', calorie: 45, probability: 0.79 }
];

function recognizeFoodFallback(imageBase64) {
  const shuffled = [...MOCK_FOODS].sort(() => Math.random() - 0.5);
  const results = shuffled.slice(0, 3).map(item => ({
    ...item,
    probability: item.probability - Math.random() * 0.1
  }));

  return {
    success: true,
    source: 'mock',
    results,
    message: '未配置百度AI API，使用模拟数据。配置后可识别真实食物。'
  };
}

module.exports = { recognizeFood };
