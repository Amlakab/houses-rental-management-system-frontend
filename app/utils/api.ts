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
    
    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        // Redirect to login page
        window.location.href = '/login';
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