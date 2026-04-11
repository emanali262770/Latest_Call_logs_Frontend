import axiosInstance from '@/src/lib/axiosInstance';

function normalize(item) {
  return {
    id: item.id || item._id || item.uuid || crypto.randomUUID(),
    serviceName: item.service_name || item.serviceName || '',
    durationTime: item.duration_time || item.durationTime || '',
    rate: item.rate ?? '',
    status: item.status || 'active',
    raw: item,
  };
}

function extractRows(payload) {
  if (Array.isArray(payload?.data?.services)) return payload.data.services;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  if (Array.isArray(payload?.data?.rows)) return payload.data.rows;
  if (Array.isArray(payload?.data?.items)) return payload.data.items;
  return [];
}

export const servicesService = {
  async list(search = '') {
    const response = await axiosInstance.get('/services', {
      params: search ? { search } : {},
    });
    return {
      ...response,
      data: extractRows(response).map(normalize),
    };
  },
  async create(values) {
    return axiosInstance.post('/services', {
      service_name: values.serviceName,
      duration_time: values.durationTime,
      rate: values.rate,
      status: values.status || 'active',
    });
  },
  async update(id, values) {
    return axiosInstance.put(`/services/${id}`, {
      service_name: values.serviceName,
      duration_time: values.durationTime,
      rate: values.rate,
      status: values.status || 'active',
    });
  },
  async remove(id) {
    return axiosInstance.delete(`/services/${id}`);
  },
};
