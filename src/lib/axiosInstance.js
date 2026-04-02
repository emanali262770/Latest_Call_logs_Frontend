import axios from 'axios';
import { getAuthToken } from '@/src/lib/auth';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  headers: {
    Accept: 'application/json',
  },
});

axiosInstance.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axiosInstance.interceptors.response.use(
  (response) => {
    const payload = response?.data || {};

    if (payload.success === false) {
      const error = new Error(payload.message || 'Request failed.');
      error.payload = payload;
      error.status = response.status;
      throw error;
    }

    return payload;
  },
  (error) => {
    const payload = error?.response?.data;
    const message = payload?.message || error.message || 'Request failed.';
    const normalizedError = new Error(message);
    normalizedError.payload = payload;
    normalizedError.status = error?.response?.status;
    return Promise.reject(normalizedError);
  },
);

export default axiosInstance;
