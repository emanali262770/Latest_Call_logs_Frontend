import axiosInstance from '@/src/lib/axiosInstance';

export const groupService = {
  list() {
    return axiosInstance.get('/groups');
  },

  create(payload) {
    return axiosInstance.post('/groups', payload);
  },

  remove(groupId) {
    return axiosInstance.delete(`/groups/${groupId}`);
  },

  listAvailablePermissions(groupId) {
    return axiosInstance.get(`/groups/${groupId}/available-permissions`);
  },

  listAssignedPermissions(groupId) {
    return axiosInstance.get(`/groups/${groupId}/permissions`);
  },

  assignPermissions(payload) {
    return axiosInstance.post('/access/assign-permission', payload);
  },
};
