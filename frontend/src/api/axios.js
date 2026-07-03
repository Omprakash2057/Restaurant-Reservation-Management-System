import axios from 'axios';

let API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// Auto-append /api if the user forgot it in their environment configuration
if (API_BASE_URL && !API_BASE_URL.replace(/\/$/, '').endsWith('/api')) {
  API_BASE_URL = API_BASE_URL.replace(/\/$/, '') + '/api';
}

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Attach JWT token from localStorage to every request, if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
