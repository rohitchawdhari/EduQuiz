import axios from 'axios';

const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const normalizedBaseURL = rawApiUrl.replace(/\/$/, '').endsWith('/api')
  ? rawApiUrl.replace(/\/$/, '')
  : `${rawApiUrl.replace(/\/$/, '')}/api`;

const API = axios.create({
  baseURL: normalizedBaseURL,
});

// Helper to get active auth token (isolated per-tab via sessionStorage first, fallback to localStorage)
export const getAuthToken = () => {
  return sessionStorage.getItem('eduquiz_token') || localStorage.getItem('eduquiz_token');
};

// Clear authentication from both session and local storage
export const clearAuthSession = () => {
  sessionStorage.removeItem('eduquiz_token');
  sessionStorage.removeItem('eduquiz_user');
  localStorage.removeItem('eduquiz_token');
  localStorage.removeItem('eduquiz_user');
};

// Attach JWT token to all outgoing requests
API.interceptors.request.use((config) => {
  const token = getAuthToken();
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
      clearAuthSession();
    }
    return Promise.reject(error);
  }
);

export default API;
