const axios = require('axios');

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || 'sk-ffef02f36dcd4b599691605d35135215';

async function recognizeFood(imageBase64) {
  try {
    console.log('调用DeepSeek识别...');

    const response = await axios.post('https://api.deepseek.com/chat/completions', {
      model: 'deepseek-chat',
      messages: [
        {
          role: 'user',
          content: `你是专业的营养师。请识别这张食物图片中的所有食物，估算每种食物的重量（克）和营养成分。

请严格按以下JSON格式返回，只返回JSON数组，不要任何其他文字：
[{"name":"食物名称","amount":重量克数,"calories":总卡路里,"protein":蛋白质克数,"carbs":碳水化合物克数,"fat":脂肪克数}]

注意：
1. 食物名称用中文
2. 重量和营养数据要基于常见分量合理估算
3. 如果图片不包含食物，返回空数组 []`,
          images: [`data:image/jpeg;base64,${imageBase64}`]
        }
      ],
      max_tokens: 800
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
      },
      timeout: 45000
    });

    const content = response.data.choices[0].message.content.trim();
    console.log('DeepSeek返回:', content);

    let foods = [];
    try {
      const jsonMatch = content.match(/\[[\s\S]*?\]/);
      if (jsonMatch) {
        foods = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error('JSON解析失败:', e.message);
    }

    if (Array.isArray(foods) && foods.length > 0) {
      return {
        success: true,
        source: 'deepseek',
        results: foods.map(f => ({
          name: f.name || '未知',
          amount: Number(f.amount) || 100,
          calories: Number(f.calories) || 100,
          protein: Number(f.protein) || 0,
          carbs: Number(f.carbs) || 0,
          fat: Number(f.fat) || 0,
          probability: 88
        }))
      };
    }

    return fallback();

  } catch (error) {
    console.error('DeepSeek错误:', error.response?.data || error.message);
    return fallback();
  }
}

function fallback() {
  const foods = [
    { name: '米饭', amount: 150, calories: 174, protein: 3.9, carbs: 38.9, fat: 0.5 },
    { name: '鸡胸肉', amount: 120, calories: 160, protein: 37.2, carbs: 0, fat: 1.4 },
    { name: '西兰花', amount: 100, calories: 36, protein: 3.7, carbs: 7.2, fat: 0.4 }
  ];
  return {
    success: true,
    source: 'fallback',
    results: foods,
    message: 'AI识别暂时不可用，请根据实际食物手动修改'
  };
}

module.exports = { recognizeFood };
