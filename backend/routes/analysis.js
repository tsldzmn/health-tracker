const express = require('express');
const auth = require('../middleware/auth');
const { db } = require('../config/db');
const { recognizeFood } = require('../services/visionService');
const router = express.Router();

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
  '核桃': { calories: 654, protein: 15.2, carbs: 13.7, fat: 65.2 },
  '花生': { calories: 567, protein: 25.8, carbs: 16.1, fat: 49.2 },
  '燕麦': { calories: 379, protein: 13.5, carbs: 67.7, fat: 6.7 },
  '红薯': { calories: 99, protein: 1.1, carbs: 24.7, fat: 0.1 },
  '玉米': { calories: 112, protein: 4, carbs: 22.8, fat: 1.2 },
  '土豆': { calories: 81, protein: 2, carbs: 17.8, fat: 0.1 },
  '白菜': { calories: 13, protein: 1.3, carbs: 2.2, fat: 0.1 },
  '芹菜': { calories: 16, protein: 0.8, carbs: 3.3, fat: 0.1 },
  '青椒': { calories: 22, protein: 1, carbs: 4.7, fat: 0.2 },
  '洋葱': { calories: 39, protein: 1.1, carbs: 9, fat: 0.1 },
  '蘑菇': { calories: 20, protein: 2.7, carbs: 3.8, fat: 0.1 },
  '瘦肉粥': { calories: 46, protein: 1.8, carbs: 8.2, fat: 0.5 },
  '豆浆': { calories: 31, protein: 2.9, carbs: 1.2, fat: 1.6 },
  '全麦面包': { calories: 246, protein: 13, carbs: 41.3, fat: 3.4 },
  '三文鱼': { calories: 139, protein: 17.2, carbs: 0, fat: 7.8 },
  '牛油果': { calories: 171, protein: 2, carbs: 8.6, fat: 15.3 }
};

router.post('/recognize', auth, async (req, res) => {
  try {
    const { foodName, amount } = req.body;
    const food = FOOD_DATABASE[foodName];
    if (!food) {
      return res.json({ found: false, message: '未找到该食物，请手动输入' });
    }
    const ratio = amount / 100;
    res.json({
      found: true,
      food: {
        name: foodName, amount,
        calories: Math.round(food.calories * ratio),
        protein: Math.round(food.protein * ratio * 10) / 10,
        carbs: Math.round(food.carbs * ratio * 10) / 10,
        fat: Math.round(food.fat * ratio * 10) / 10
      }
    });
  } catch (error) {
    res.status(500).json({ message: '查询失败', error: error.message });
  }
});

router.get('/search', auth, async (req, res) => {
  try {
    const keyword = req.query.q || '';
    const results = Object.entries(FOOD_DATABASE)
      .filter(([name]) => name.includes(keyword))
      .slice(0, 10)
      .map(([name, data]) => ({ name, ...data }));
    res.json(results);
  } catch (error) {
    res.status(500).json({ message: '搜索失败', error: error.message });
  }
});

router.post('/recognize-image', auth, async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) {
      return res.status(400).json({ message: '请提供图片' });
    }

    const result = await recognizeFood(image);

    const enhancedResults = result.results.map(item => {
      const foodInfo = FOOD_DATABASE[item.name] || guessFoodInfo(item.name);
      return {
        name: item.name,
        probability: Math.round(item.probability * 100),
        calories: item.calorie || foodInfo.calories,
        protein: foodInfo.protein,
        carbs: foodInfo.carbs,
        fat: foodInfo.fat,
        amount: 100,
        unit: 'g'
      };
    });

    res.json({
      success: result.success,
      source: result.source,
      message: result.message,
      foods: enhancedResults
    });
  } catch (error) {
    res.status(500).json({ message: '识别失败', error: error.message });
  }
});

function guessFoodInfo(name) {
  const categories = {
    '肉': { calories: 200, protein: 20, carbs: 2, fat: 12 },
    '鱼': { calories: 110, protein: 18, carbs: 0, fat: 4 },
    '鸡': { calories: 140, protein: 25, carbs: 1, fat: 4 },
    '虾': { calories: 87, protein: 18, carbs: 0, fat: 1 },
    '菜': { calories: 25, protein: 2, carbs: 4, fat: 0.3 },
    '汤': { calories: 40, protein: 3, carbs: 5, fat: 1 },
    '饭': { calories: 116, protein: 2.6, carbs: 26, fat: 0.3 },
    '面': { calories: 137, protein: 4.5, carbs: 25, fat: 2 },
    '饼': { calories: 250, protein: 7, carbs: 40, fat: 8 },
    '蛋': { calories: 144, protein: 13, carbs: 3, fat: 9 },
    '豆腐': { calories: 73, protein: 8, carbs: 2, fat: 4 },
    '瓜': { calories: 20, protein: 1, carbs: 4, fat: 0.2 }
  };

  for (const [key, info] of Object.entries(categories)) {
    if (name.includes(key)) return info;
  }
  return { calories: 100, protein: 5, carbs: 15, fat: 3 };
}

router.get('/analysis', auth, async (req, res) => {
  try {
    const user = req.user;
    const profile = user.profile || {};
    const height = profile.height || 0;
    const weight = profile.weight || 0;
    const age = profile.age || 0;
    const gender = profile.gender || '';

    let bmi = null, bmiStatus = '', bmr = null, dailyNeeds = null;
    if (height > 0 && weight > 0) {
      const heightM = height / 100;
      bmi = parseFloat((weight / (heightM * heightM)).toFixed(1));
      if (bmi < 18.5) bmiStatus = '偏瘦';
      else if (bmi < 24) bmiStatus = '正常';
      else if (bmi < 28) bmiStatus = '超重';
      else bmiStatus = '肥胖';
    }
    if (weight > 0 && height > 0 && age > 0) {
      if (gender === 'male') {
        bmr = Math.round(88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age));
      } else {
        bmr = Math.round(447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age));
      }
      const multipliers = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, very_active: 1.9 };
      dailyNeeds = Math.round(bmr * (multipliers[profile.activityLevel] || 1.2));
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayEntries = await db.foodEntries.find({ userId: user._id, date: { $gte: today, $lt: tomorrow } });
    const todayCalories = todayEntries.reduce((sum, e) => sum + e.totalCalories, 0);

    const todayWater = await db.waterEntries.find({ userId: user._id, date: { $gte: today, $lt: tomorrow } });
    const totalWater = todayWater.reduce((sum, e) => sum + e.amount, 0);

    let suggestions = [];
    if (dailyNeeds) {
      const remaining = dailyNeeds - todayCalories;
      const hour = new Date().getHours();
      if (hour < 10 && todayCalories < dailyNeeds * 0.25) suggestions.push('早餐热量偏低，建议补充优质蛋白质和碳水化合物');
      if (hour >= 11 && hour < 14 && todayCalories < dailyNeeds * 0.5) suggestions.push('午餐时间到了，建议摄入全天热量的40%左右');
      if (hour >= 17 && hour < 20 && todayCalories < dailyNeeds * 0.75) suggestions.push('晚餐建议清淡为主，可选择蔬菜和优质蛋白');
      if (remaining > dailyNeeds * 0.5 && hour > 14) suggestions.push(`今日剩余热量较多(${remaining}kcal)，注意合理分配`);
      if (remaining < 0) suggestions.push('今日热量已超标，建议适当运动消耗');
      if (totalWater < (user.dailyGoals?.water || 2000) * 0.5) suggestions.push('饮水量不足，请及时补充水分');
    }

    let mealSuggestion = '';
    const hour = new Date().getHours();
    if (hour < 10) mealSuggestion = '早餐建议：全麦面包1片(60g) + 鸡蛋1个 + 牛奶250ml，约350kcal';
    else if (hour < 14) mealSuggestion = '午餐建议：糙米饭1碗(150g) + 鸡胸肉100g + 蔬菜200g，约450kcal';
    else if (hour < 20) mealSuggestion = '晚餐建议：杂粮粥1碗 + 清蒸鱼100g + 蔬菜沙拉，约350kcal';
    else mealSuggestion = '夜间建议：如果饿了可以喝杯牛奶或吃少量水果';

    let menstrualAdvice = '';
    if (gender === 'female' && profile.menstrualCycle?.isTracking && profile.menstrualCycle?.lastPeriod) {
      const daysSince = Math.floor((new Date() - new Date(profile.menstrualCycle.lastPeriod)) / (1000 * 60 * 60 * 24));
      const cycleDay = daysSince % (profile.menstrualCycle.cycleLength || 28);
      if (cycleDay <= (profile.menstrualCycle.periodLength || 5)) menstrualAdvice = '经期期间：注意补充铁质食物，如菠菜、瘦肉，避免生冷食物';
      else if (cycleDay >= 12 && cycleDay <= 16) menstrualAdvice = '排卵期：代谢较高，可适当增加蛋白质摄入';
      else if (cycleDay >= 20) menstrualAdvice = '经前期：可能出现水肿，减少盐分摄入，多吃含钾食物';
    }

    res.json({
      profile: { bmi, bmiStatus, bmr, dailyNeeds, height, weight, targetWeight: profile.targetWeight, age },
      today: { calories: todayCalories, calorieGoal: user.dailyGoals?.calories || 1500, water: totalWater, waterGoal: user.dailyGoals?.water || 2000, remaining: dailyNeeds ? dailyNeeds - todayCalories : 0, meals: todayEntries.length },
      suggestions, mealSuggestion, menstrualAdvice,
      streakDays: user.streakDays || 0,
      points: user.points || 0
    });
  } catch (error) {
    res.status(500).json({ message: '分析失败', error: error.message });
  }
});

router.get('/food-database', auth, async (req, res) => {
  res.json(FOOD_DATABASE);
});

module.exports = router;
