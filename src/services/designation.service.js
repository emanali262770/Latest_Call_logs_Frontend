import axiosInstance from '@/src/lib/axiosInstance';

function normalizeDesignation(item) {
  return {
    id: item.id || item._id || item.uuid || crypto.randomUUID(),
    name: item.designation_name || item.name || '',
    status: item.status || 'active',
    raw: item,
  };
}

function extractListRows(payload) {
  if (Array.isArray(payload?.data?.designations)) return payload.data.designations;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  if (Array.isArray(payload?.data?.rows)) return payload.data.rows;
  if (Array.isArray(payload?.data?.items)) return payload.data.items;
  return [];
}

export const designationService = {
  async list(search = '') {
    const response = await axiosInstance.get('/designations', {
      params: { search, q: search, keyword: search },
    });

    return {
      ...response,
      data: extractListRows(response).map(normalizeDesignation),
    };
  },

  async create(values) {
    return axiosInstance.post('/designations', {
      designation_name: values.name,
      status: values.status || 'active',
    });
  },

  async update(id, values) {
    return axiosInstance.put(`/designations/${id}`, {
      designation_name: values.name,
      status: values.status || 'active',
    });
  },

  async remove(id) {
    return axiosInstance.delete(`/designations/${id}`);
  },
};
