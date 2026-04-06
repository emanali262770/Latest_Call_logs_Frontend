import axiosInstance from '@/src/lib/axiosInstance';

export const userService = {
  list() {
    return axiosInstance.get('/users');
  },

  listUserGroups(userId) {
    return axiosInstance.get(`/access/users/${userId}/groups`);
  },

  assignGroup(payload) {
    return axiosInstance.post('/access/assign-group', payload);
  },

  changePassword(id, payload) {
    return axiosInstance.put(`/users/${id}/change-password`, payload);
  },

  updateLock(id, payload) {
    return axiosInstance.patch(`/users/${id}/lock`, payload);
  },

  create(payload) {
    return axiosInstance.post('/users', payload);
  },
};
