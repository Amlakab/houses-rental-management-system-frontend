import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to include token
api.interceptors.request.use(
  (config) => {
    // Only run in browser environment
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    
    // Handle 401 Unauthorized safely without reload loops
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        const currentPath = window.location.pathname;
        const reqUrl = (error.config?.url || '').toLowerCase();

        // Never redirect if already on an auth or public registration page
        const isAuthPage = currentPath.startsWith('/auth') || currentPath.startsWith('/login') || currentPath.startsWith('/register');
        
        // Never redirect if the request itself was an authentication or verification attempt (allows form to show error message)
        const isAuthRequest = reqUrl.includes('/auth/login') || reqUrl.includes('/auth/login-otp') || reqUrl.includes('/auth/register');
        
        // Never redirect on optional background requests
        const isBackgroundRequest = reqUrl.includes('/notifications');

        if (!isAuthPage && !isAuthRequest && !isBackgroundRequest) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          
          // Only redirect if user was trying to access protected admin pages
          if (currentPath.startsWith('/admin')) {
            window.location.href = '/auth/login';
          }
        }
      }
    }
    
    // Handle other common errors
    if (error.response?.status === 403) {
      console.error('Access forbidden');
    }
    
    if (error.response?.status === 404) {
      console.error('Resource not found');
    }
    
    if (error.response?.status === 500) {
      console.error('Internal server error');
    }
    
    return Promise.reject(error);
  }
);

export default api;