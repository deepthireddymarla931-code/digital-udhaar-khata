import axios from 'axios';

export function getApiBaseUrl() {
  const custom = localStorage.getItem('custom_api_url');
  if (custom && custom.trim()) {
    let clean = custom.trim();
    if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
      clean = `https://${clean}`;
    }
    if (!clean.includes('/api')) {
      clean = `${clean.replace(/\/+$/, '')}/api/v1`;
    }
    return clean;
  }

  let rawBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api/v1';

  if (rawBaseUrl && !rawBaseUrl.startsWith('http://') && !rawBaseUrl.startsWith('https://') && !rawBaseUrl.startsWith('/')) {
    rawBaseUrl = `https://${rawBaseUrl}/api/v1`;
  } else if (rawBaseUrl.startsWith('http') && !rawBaseUrl.includes('/api')) {
    rawBaseUrl = `${rawBaseUrl.replace(/\/+$/, '')}/api/v1`;
  }
  return rawBaseUrl;
}

const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request Interceptor: Attach JWT Token and dynamic baseURL
api.interceptors.request.use(
  (config) => {
    config.baseURL = getApiBaseUrl();
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle 401 Unauthorized globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
