import axiosInstance from '@/src/lib/axiosInstance';

export const userService = {
  create(payload) {
    return axiosInstance.post('/users', payload);
  },
};
