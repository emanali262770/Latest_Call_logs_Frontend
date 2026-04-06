import axiosInstance from '@/src/lib/axiosInstance';

export const authService = {
  login(credentials) {
    return axiosInstance.post('/auth/login', credentials);
  },

  checkToken() {
    return axiosInstance.get('/auth/check-token');
  },
};
