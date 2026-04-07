import axiosInstance from '@/src/lib/axiosInstance';

function normalize(item) {
  return {
    id: item.id || item._id || item.uuid || crypto.randomUUID(),
    name: item.location_name || item.name || '',
    address: item.address || '',
    status: item.status || 'active',
    raw: item,
  };
}

function extractRows(payload) {
  if (Array.isArray(payload?.data?.locations)) return payload.data.locations;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  if (Array.isArray(payload?.data?.rows)) return payload.data.rows;
  if (Array.isArray(payload?.data?.items)) return payload.data.items;
  return [];
}

export const locationService = {
  async list(search = '') {
    const response = await axiosInstance.get('/locations', {
      params: { search },
    });
    return {
      ...response,
      data: extractRows(response).map(normalize),
    };
  },
  async create(values) {
    return axiosInstance.post('/locations', {
      location_name: values.name,
      address: values.address,
      status: values.status || 'active',
    });
  },
  async update(id, values) {
    return axiosInstance.put(`/locations/${id}`, {
      location_name: values.name,
      address: values.address,
      status: values.status || 'active',
    });
  },
  async remove(id) {
    return axiosInstance.delete(`/locations/${id}`);
  },
};
