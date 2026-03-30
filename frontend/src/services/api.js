const API = '';

const headers = () => {
  const t = localStorage.getItem('token');
  return { 'Content-Type': 'application/json', ...(t ? { Authorization: `Bearer ${t}` } : {}) };
};

const post = async (url, body) => {
  const res = await fetch(`${API}${url}`, { method: 'POST', headers: headers(), body: JSON.stringify(body) });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || '请求失败');
  return data;
};

const get = async (url) => {
  const res = await fetch(`${API}${url}`, { headers: headers() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || '请求失败');
  return data;
};

const del = async (url) => {
  const res = await fetch(`${API}${url}`, { method: 'DELETE', headers: headers() });
  return res.json();
};

export const authAPI = {
  login: (email, password) => post('/api/login', { email, password }),
  register: (username, email, password) => post('/api/register', { username, email, password }),
  getMe: () => get('/api/me'),
  updateProfile: (data) => fetch(`${API}/api/profile`, { method: 'PUT', headers: headers(), body: JSON.stringify(data) }).then(r => r.json())
};

export const foodAPI = {
  add: (meal_type, foods, log_date) => post('/api/diet', { meal_type, foods, log_date }),
  getDaily: (date) => get(`/api/diet/daily?date=${date}`),
  getHistory: (days) => get(`/api/diet/history?days=${days || 7}`),
  delete: (id) => del(`/api/diet/${id}`),
  search: (q) => get(`/api/search?q=${q}`),
  recognize: (image) => post('/api/recognize', { image })
};

export const waterAPI = {
  add: (amount) => post('/api/water', { amount }),
  getDaily: (date) => get(`/api/water/daily?date=${date}`)
};

export const analysisAPI = {
  get: () => get('/api/analysis')
};

export const adminAPI = {
  getStats: () => get('/api/admin/stats'),
  getUsers: (page, limit) => get(`/api/admin/users?page=${page || 1}&limit=${limit || 20}`),
  updateUser: (id, data) => fetch(`${API}/api/admin/users/${id}`, { method: 'PUT', headers: headers(), body: JSON.stringify(data) }).then(r => r.json()),
  deleteUser: (id) => del(`/api/admin/users/${id}`)
};
