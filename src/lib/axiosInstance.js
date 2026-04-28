import axios from 'axios';
import { getAuthToken, redirectToLoginOnSessionExpiry } from '@/src/lib/auth';

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
    const status = error?.response?.status;

    // For arraybuffer responses, parse the JSON error body manually
    let payload = error?.response?.data;
    if (payload instanceof ArrayBuffer) {
      try {
        payload = JSON.parse(new TextDecoder().decode(payload));
      } catch {
        payload = {};
      }
    }

    if (status === 401) {
      redirectToLoginOnSessionExpiry();
    }

    const message = payload?.message || error.message || 'Request failed.';
    const normalizedError = new Error(message);
    normalizedError.payload = payload;
    normalizedError.status = status;
    return Promise.reject(normalizedError);
  },
);

export default axiosInstance;
