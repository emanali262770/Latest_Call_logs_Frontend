import axiosInstance from '@/src/lib/axiosInstance';

export const permissionService = {
  list() {
    return axiosInstance.get('/permissions');
  },
};
