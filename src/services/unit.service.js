import axiosInstance from '@/src/lib/axiosInstance';

function normalize(item) {
  return {
    id: item.id || item._id || item.uuid || crypto.randomUUID(),
    name: item.unit_name || item.name || '',
    shortName: item.short_name || item.shortName || '',
    status: item.status || 'active',
    raw: item,
  };
}

function extractRows(payload) {
  if (Array.isArray(payload?.data?.units)) return payload.data.units;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  if (Array.isArray(payload?.data?.rows)) return payload.data.rows;
  if (Array.isArray(payload?.data?.items)) return payload.data.items;
  return [];
}

export const unitService = {
  async list(search = '') {
    const response = await axiosInstance.get('/units', {
      params: { search },
    });
    return {
      ...response,
      data: extractRows(response).map(normalize),
    };
  },
  async create(values) {
    return axiosInstance.post('/units', {
      unit_name: values.name,
      short_name: values.shortName,
      status: values.status || 'active',
    });
  },
  async update(id, values) {
    return axiosInstance.put(`/units/${id}`, {
      unit_name: values.name,
      short_name: values.shortName,
      status: values.status || 'active',
    });
  },
  async remove(id) {
    return axiosInstance.delete(`/units/${id}`);
  },
};
