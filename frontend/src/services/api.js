import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

// Attach JWT token to all outgoing requests
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('eduquiz_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Intercept 401 unauthenticated
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If token expired, clear and optionally redirect
      if (localStorage.getItem('eduquiz_token')) {
        localStorage.removeItem('eduquiz_token');
        localStorage.removeItem('eduquiz_user');
      }
    }
    return Promise.reject(error);
  }
);

export default API;
