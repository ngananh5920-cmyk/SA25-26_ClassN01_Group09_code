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

// Handle token expiration: logout on 401 (unauthorized), not on 403 (forbidden)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Logout only when the token is invalid (401), not when access is forbidden (403).
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    // For 403 (Forbidden), do not logout; let the component handle the error.
    return Promise.reject(error);
  }
);

export default api;

