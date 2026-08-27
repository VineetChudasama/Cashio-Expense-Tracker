import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('flow_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('flow_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const auth = {
  login: (data) => api.post('/auth/login', data).then(res => res.data),
  register: (data) => api.post('/auth/register', data).then(res => res.data),
  verifyRegisterOtp: (data) => api.post('/auth/verify-register-otp', data).then(res => res.data),
  resendRegisterOtp: (data) => api.post('/auth/resend-register-otp', data).then(res => res.data),
  getMe: () => api.get('/auth/me').then(res => res.data),
  checkEmail: (email) => api.get(`/auth/check-email?email=${encodeURIComponent(email)}`).then(res => res.data),
};

export const expenses = {
  getAll: (params) => api.get('/expenses', { params }).then(res => res.data),
  getCategorySummary: (params) => api.get('/expenses/categories/summary', { params }).then(res => res.data),
  create: (data) => api.post('/expenses', data).then(res => res.data),
  update: (id, data) => api.put(`/expenses/${id}`, data).then(res => res.data),
  delete: (id) => api.delete(`/expenses/${id}`).then(res => res.data),
};

export const forecast = {
  get: (days) => api.get(`/forecast?days=${days}`).then(res => res.data),
  detect: () => api.post('/forecast/detect').then(res => res.data),
};

export const splits = {
  getAll: () => api.get('/splits').then(res => res.data),
  create: (data) => api.post('/splits', data).then(res => res.data),
  update: (id, data) => api.put(`/splits/${id}`, data).then(res => res.data),
  delete: (id) => api.delete(`/splits/${id}`).then(res => res.data),
  getBalances: () => api.get('/splits/balances').then(res => res.data),
  getSettle: () => api.get('/splits/settle').then(res => res.data),
  settleParticipant: (id) => api.patch(`/splits/${id}/settle`).then(res => res.data),
};

export const users = {
  getProfile: () => api.get('/users/profile').then(res => res.data),
  updateProfile: (data) => api.put('/users/profile', data).then(res => res.data),
  sendPasswordOtp: (data) => api.post('/users/send-password-otp', data).then(res => res.data),
  changePasswordWithOtp: (data) => api.put('/users/change-password-with-otp', data).then(res => res.data),
  sendEmailOtp: (data) => api.post('/users/send-email-otp', data).then(res => res.data),
  changeEmailWithOtp: (data) => api.put('/users/change-email-with-otp', data).then(res => res.data),
  search: (email) => api.get(`/users/search?email=${email}`).then(res => res.data),
};

export const insights = {
  get: () => api.get('/insights').then(res => res.data),
};

export default api;
