const API_BASE = '';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

export const foodAPI = {
  add: async (mealType, foods, date) => {
    const res = await fetch(`${API_BASE}/api/food`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ mealType, foods, date })
    });
    if (!res.ok) throw new Error('添加失败');
    return res.json();
  },

  getDaily: async (date) => {
    const res = await fetch(`${API_BASE}/api/food/daily?date=${date}`, {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('获取失败');
    return res.json();
  },

  getHistory: async (page = 1, limit = 7) => {
    const res = await fetch(`${API_BASE}/api/food/history?page=${page}&limit=${limit}`, {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('获取失败');
    return res.json();
  },

  delete: async (id) => {
    const res = await fetch(`${API_BASE}/api/food/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('删除失败');
    return res.json();
  },

  searchFood: async (keyword) => {
    const res = await fetch(`${API_BASE}/api/analysis/search?q=${keyword}`, {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('搜索失败');
    return res.json();
  },

  recognizeFood: async (foodName, amount) => {
    const res = await fetch(`${API_BASE}/api/analysis/recognize`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ foodName, amount })
    });
    if (!res.ok) throw new Error('识别失败');
    return res.json();
  },

  recognizeByImage: async (imageBase64) => {
    const res = await fetch(`${API_BASE}/api/analysis/recognize-image`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ image: imageBase64 })
    });
    if (!res.ok) throw new Error('图像识别失败');
    return res.json();
  }
};

export const waterAPI = {
  add: async (amount) => {
    const res = await fetch(`${API_BASE}/api/water`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ amount })
    });
    if (!res.ok) throw new Error('添加失败');
    return res.json();
  },

  getDaily: async (date) => {
    const res = await fetch(`${API_BASE}/api/water/daily?date=${date}`, {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('获取失败');
    return res.json();
  },

  getHistory: async (days = 7) => {
    const res = await fetch(`${API_BASE}/api/water/history?days=${days}`, {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('获取失败');
    return res.json();
  }
};

export const analysisAPI = {
  getAnalysis: async () => {
    const res = await fetch(`${API_BASE}/api/analysis/analysis`, {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('获取失败');
    return res.json();
  },

  getFoodDatabase: async () => {
    const res = await fetch(`${API_BASE}/api/analysis/food-database`, {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('获取失败');
    return res.json();
  }
};

export const adminAPI = {
  getStats: async () => {
    const res = await fetch(`${API_BASE}/api/admin/stats`, {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('获取统计失败');
    return res.json();
  },

  getUsers: async (page = 1, limit = 20, search = '') => {
    const res = await fetch(
      `${API_BASE}/api/admin/users?page=${page}&limit=${limit}&search=${search}`,
      { headers: getHeaders() }
    );
    if (!res.ok) throw new Error('获取用户列表失败');
    return res.json();
  },

  getUserDetail: async (id) => {
    const res = await fetch(`${API_BASE}/api/admin/users/${id}`, {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('获取用户详情失败');
    return res.json();
  },

  updateUser: async (id, data) => {
    const res = await fetch(`${API_BASE}/api/admin/users/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || '更新失败');
    }
    return res.json();
  },

  deleteUser: async (id) => {
    const res = await fetch(`${API_BASE}/api/admin/users/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || '删除失败');
    }
    return res.json();
  }
};
