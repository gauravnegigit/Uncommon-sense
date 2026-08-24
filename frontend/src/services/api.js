import axios from 'axios';

// Base API configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT Token from localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('gramin_health_jwt_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle auth errors & token expiry
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('gramin_health_refresh_token');
        if (refreshToken) {
          const res = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
          if (res.data?.token) {
            localStorage.setItem('gramin_health_jwt_token', res.data.token);
            api.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
            return api(originalRequest);
          }
        }
      } catch (refreshErr) {
        // Clear session if refresh fails
        localStorage.removeItem('gramin_health_jwt_token');
        localStorage.removeItem('gramin_health_user');
      }
    }

    return Promise.reject(error);
  }
);

export default api;

