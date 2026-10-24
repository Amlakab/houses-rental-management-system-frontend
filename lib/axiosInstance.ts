// lib/axiosInstance.ts
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor to handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        const currentPath = window.location.pathname;
        const reqUrl = (error.config?.url || '').toLowerCase();
        const isAuthPage = currentPath.startsWith('/auth') || currentPath.startsWith('/login') || currentPath.startsWith('/register');
        const isAuthRequest = reqUrl.includes('/auth/login') || reqUrl.includes('/auth/login-otp') || reqUrl.includes('/auth/register');
        const isBackgroundRequest = reqUrl.includes('/notifications');

        if (!isAuthPage && !isAuthRequest && !isBackgroundRequest) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          if (currentPath.startsWith('/admin')) {
            window.location.href = '/auth/login';
          }
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;