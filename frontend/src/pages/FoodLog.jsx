import { useState, useEffect, useRef, useCallback } from 'react';
import { foodAPI } from '../services/api';
import { format } from 'date-fns';

export default function FoodLog() {
  const [mealType, setMealType] = useState('breakfast');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedFoods, setSelectedFoods] = useState([]);
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [recognizedFoods, setRecognizedFoods] = useState([]);
  const [recognitionSource, setRecognitionSource] = useState('');
  const [previewImage, setPreviewImage] = useState(null);
  const fileInputRef = useRef(null);
  const searchTimerRef = useRef(null);

  const mealTypes = [
    { id: 'breakfast', label: '🌅 早餐' },
    { id: 'lunch', label: '☀️ 午餐' },
    { id: 'dinner', label: '🌙 晚餐' },
    { id: 'snack', label: '🍎 加餐' }
  ];

  const searchFood = useCallback(async (keyword) => {
    if (!keyword || keyword.length < 1) {
      setSearchResults([]);
      return;
    }
    try {
      const results = await foodAPI.searchFood(keyword);
      setSearchResults(results);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchKeyword(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      searchFood(value);
    }, 300);
  };

  useEffect(() => {
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, []);

  const addFoodFromSearch = (food) => {
    setSelectedFoods(prev => [...prev, {
      name: food.name,
      amount: 100,
      unit: 'g',
      calories: food.calories,
      protein: food.protein,
      carbs: food.carbs,
      fat: food.fat
    }]);
    setSearchKeyword('');
    setSearchResults([]);
  };

  const addFoodManual = () => {
    setSelectedFoods(prev => [...prev, {
      name: '',
      amount: 100,
      unit: 'g',
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0
    }]);
  };

  const updateFood = (index, field, value) => {
    setSelectedFoods(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      if (field === 'amount' && updated[index].name) {
        const ratio = value / 100;
        const baseCal = updated[index].calories / (updated[index].amount / 100);
        updated[index].calories = Math.round(baseCal * ratio);
      }
      return updated;
    });
  };

  const removeFood = (index) => {
    setSelectedFoods(prev => prev.filter((_, i) => i !== index));
  };

  const submitFoods = async () => {
    if (selectedFoods.length === 0) return;
    setLoading(true);
    try {
      await foodAPI.add(mealType, selectedFoods, format(new Date(), 'yyyy-MM-dd'));
      setSelectedFoods([]);
      setSuccess('记录成功！');
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target.result;
      setPreviewImage(base64);
      setShowPhotoUpload(true);
      setRecognizedFoods([]);

      try {
        const result = await foodAPI.recognizeByImage(base64.split(',')[1]);
        setRecognizedFoods(result.foods || []);
        setRecognitionSource(result.source || 'unknown');

        if (result.message) {
          console.log('识别提示:', result.message);
        }
      } catch (err) {
        console.error('识别失败:', err);
        alert('图片识别失败，请重试或手动输入');
      }
      setShowPhotoUpload(false);
    };
    reader.readAsDataURL(file);

    e.target.value = '';
  };

  const addRecognizedFood = (food) => {
    setSelectedFoods(prev => [...prev, {
      name: food.name,
      amount: food.amount || 100,
      unit: food.unit || 'g',
      calories: food.calories,
      protein: food.protein || 0,
      carbs: food.carbs || 0,
      fat: food.fat || 0,
      recognizedByAI: true
    }]);
    setRecognizedFoods(prev => prev.filter(f => f.name !== food.name));
  };

  const clearPreview = () => {
    setPreviewImage(null);
    setRecognizedFoods([]);
    setRecognitionSource('');
  };

  const totalCalories = selectedFoods.reduce((sum, f) => sum + (f.calories || 0), 0);

  return (
    <div className="app-container">
      <div className="page-header">
        <h1>记录饮食</h1>
        <p>记录你吃的食物</p>
      </div>

      <div className="page-content">
        {success && <div className="toast">{success}</div>}

        <div className="meal-selector">
          {mealTypes.map(m => (
            <button
              key={m.id}
              className={`meal-option ${mealType === m.id ? 'active' : ''}`}
              onClick={() => setMealType(m.id)}
            >
              {m.label}
            </button>
          ))}
        </div>

        <div className="input-group">
          <label>搜索食物</label>
          <input
            className="input-field"
            type="text"
            placeholder="输入食物名称，如：米饭、鸡蛋"
            value={searchKeyword}
            onChange={handleSearchChange}
          />
          {searchResults.length > 0 && (
            <div className="food-search-results">
              {searchResults.map((food, i) => (
                <div key={i} className="food-search-item" onClick={() => addFoodFromSearch(food)}>
                  <div>
                    <div style={{ fontWeight: 500 }}>{food.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                      {food.calories}kcal/100g | 蛋白{food.protein}g | 碳水{food.carbs}g | 脂肪{food.fat}g
                    </div>
                  </div>
                  <span style={{ color: 'var(--accent-blue)', fontSize: 14 }}>+ 添加</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />

        {previewImage ? (
          <div className="glass-card" style={{ marginBottom: 16 }}>
            <div style={{ position: 'relative', marginBottom: 12 }}>
              <img
                src={previewImage}
                alt="预览"
                style={{
                  width: '100%',
                  maxHeight: 200,
                  objectFit: 'cover',
                  borderRadius: 12
                }}
              />
              <button
                onClick={clearPreview}
                style={{
                  position: 'absolute', top: 8, right: 8,
                  background: 'rgba(0,0,0,0.5)', color: 'white',
                  border: 'none', borderRadius: '50%',
                  width: 32, height: 32, cursor: 'pointer',
                  fontSize: 16
                }}
              >
                ×
              </button>
            </div>

            {showPhotoUpload ? (
              <div style={{ textAlign: 'center', padding: 20 }}>
                <div className="spinner" style={{ margin: '0 auto' }}></div>
                <div style={{ marginTop: 12, fontSize: 14, color: 'var(--text-tertiary)' }}>
                  🤖 AI正在识别食物...
                </div>
              </div>
            ) : recognizedFoods.length > 0 ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <span className="chip chip-blue">🤖 AI识别结果</span>
                  {recognitionSource === 'deepseek' && <span className="chip chip-green">DeepSeek</span>}
                  {recognitionSource === 'fallback' && <span className="chip chip-orange">参考数据</span>}
                </div>
                {recognizedFoods.map((food, i) => (
                  <div
                    key={i}
                    className="food-search-item"
                    onClick={() => addRecognizedFood(food)}
                  >
                    <div>
                      <div style={{ fontWeight: 500 }}>{food.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                        {food.calories}kcal/100g | 置信度{food.probability}%
                        {food.protein > 0 && ` | 蛋白${food.protein}g`}
                      </div>
                    </div>
                    <span style={{ color: 'var(--accent-blue)', fontSize: 14 }}>+ 添加</span>
                  </div>
                ))}
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: 12, color: 'var(--text-tertiary)' }}>
                未识别到食物，请尝试其他照片或手动输入
              </div>
            )}

            <button
              className="btn btn-secondary btn-full"
              onClick={() => fileInputRef.current?.click()}
              style={{ marginTop: 12 }}
            >
              📷 重新拍照
            </button>
          </div>
        ) : (
          <div
            className="photo-upload"
            onClick={() => fileInputRef.current?.click()}
            style={{ marginBottom: 16 }}
          >
            <div className="photo-upload-icon">📸</div>
            <div className="photo-upload-text">拍照或选择图片识别食物热量</div>
            <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 8 }}>
              支持百度AI食物识别，准确率更高
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 className="section-title" style={{ marginBottom: 0 }}>已选食物</h3>
          <button className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: 13 }} onClick={addFoodManual}>
            + 手动添加
          </button>
        </div>

        {selectedFoods.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🍽️</div>
            <div className="empty-state-text">还没有添加食物</div>
          </div>
        ) : (
          <>
            {selectedFoods.map((food, i) => (
              <div key={i} className="meal-card" style={{ position: 'relative' }}>
                <button
                  onClick={() => removeFood(i)}
                  style={{
                    position: 'absolute', top: 8, right: 8,
                    background: 'none', border: 'none', fontSize: 18,
                    cursor: 'pointer', color: 'var(--accent-red)'
                  }}
                >
                  ×
                </button>
                {food.recognizedByAI && (
                  <span className="chip chip-blue" style={{ marginBottom: 8 }}>🤖 AI识别</span>
                )}
                <div className="input-group" style={{ marginBottom: 8 }}>
                  <input
                    className="input-field"
                    type="text"
                    placeholder="食物名称"
                    value={food.name}
                    onChange={(e) => updateFood(i, 'name', e.target.value)}
                  />
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <div style={{ flex: 1 }}>
                    <input
                      className="input-field"
                      type="number"
                      placeholder="重量"
                      value={food.amount}
                      onChange={(e) => updateFood(i, 'amount', Number(e.target.value))}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <input
                      className="input-field"
                      type="number"
                      placeholder="热量(kcal)"
                      value={food.calories}
                      onChange={(e) => updateFood(i, 'calories', Number(e.target.value))}
                    />
                  </div>
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-tertiary)', marginTop: 8 }}>
                  蛋白{food.protein}g | 碳水{food.carbs}g | 脂肪{food.fat}g
                </div>
              </div>
            ))}

            <div className="glass-card" style={{ marginBottom: 16, textAlign: 'center' }}>
              <div style={{ fontSize: 14, color: 'var(--text-tertiary)' }}>总热量</div>
              <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--accent-orange)' }}>{totalCalories} kcal</div>
            </div>

            <button
              className="btn btn-primary btn-full"
              onClick={submitFoods}
              disabled={loading}
            >
              {loading ? '保存中...' : '保存记录'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
