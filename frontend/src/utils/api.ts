import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token expiration - chỉ logout khi 401 (unauthorized), không logout khi 403 (forbidden)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Chỉ logout khi token không hợp lệ (401), không logout khi không có quyền (403)
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    // 403 (Forbidden) không nên logout user, chỉ reject promise để component xử lý
    return Promise.reject(error);
  }
);

export default api;

