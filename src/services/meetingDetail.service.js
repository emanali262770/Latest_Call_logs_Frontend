import axiosInstance from '@/src/lib/axiosInstance';

function extractRows(payload) {
  if (Array.isArray(payload?.data?.services)) return payload.data.services;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  if (Array.isArray(payload?.data?.rows)) return payload.data.rows;
  if (Array.isArray(payload?.data?.items)) return payload.data.items;
  return [];
}

function extractEmployee(payload) {
  if (Array.isArray(payload?.data?.employees)) return payload.data.employees;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  if (Array.isArray(payload?.data?.rows)) return payload.data.rows;
  return [];
}

function normalizeEmployee(item) {
  const name = item.employee_name || item.name || item.first_name || '';
  return {
    id: item.id || item._id || item.uuid || item.emp_id,
    name,
    raw: item,
  };
}

function normalizeService(item) {
  return {
    id: item.id || item._id || item.uuid,
    name: item.service_name || item.serviceName || item.name || '',
    raw: item,
  };
}

export const meetingDetailService = {
  async list(search = '') {
    const response = await axiosInstance.get('/meeting-details', {
      params: search ? { search } : {},
    });
    const rows = response?.data?.meetings || response?.data || [];
    return { ...response, data: Array.isArray(rows) ? rows : [] };
  },

  async getById(id) {
    return axiosInstance.get(`/meeting-details/${id}`);
  },

  async update(id, payload) {
    return axiosInstance.put(`/meeting-details/${id}`, payload);
  },

  async remove(id) {
    return axiosInstance.delete(`/meeting-details/${id}`);
  },

  async listStaff() {
    const response = await axiosInstance.get('/employees', {
      params: { exclude_admin: true },
    });
    return {
      ...response,
      data: extractEmployee(response).map(normalizeEmployee),
    };
  },

  async listServices() {
    const response = await axiosInstance.get('/services');
    return {
      ...response,
      data: extractRows(response).map(normalizeService),
    };
  },
};
