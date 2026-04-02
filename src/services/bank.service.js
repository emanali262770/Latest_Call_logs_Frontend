import axiosInstance from '@/src/lib/axiosInstance';

function normalizeBank(item) {
  return {
    id: item.id || item._id || item.uuid || crypto.randomUUID(),
    name: item.bank_name || item.name || '',
    status: item.status || 'active',
    raw: item,
  };
}

function extractListRows(payload) {
  if (Array.isArray(payload?.data?.banks)) return payload.data.banks;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  if (Array.isArray(payload?.data?.rows)) return payload.data.rows;
  if (Array.isArray(payload?.data?.items)) return payload.data.items;
  return [];
}

export const bankService = {
  async list(search = '') {
    const response = await axiosInstance.get('/banks', {
      params: { search, q: search, keyword: search },
    });

    return {
      ...response,
      data: extractListRows(response).map(normalizeBank),
    };
  },

  async create(values) {
    return axiosInstance.post('/banks', {
      bank_name: values.name,
      status: values.status || 'active',
    });
  },

  async update(id, values) {
    return axiosInstance.put(`/banks/${id}`, {
      bank_name: values.name,
      status: values.status || 'active',
    });
  },

  async remove(id) {
    return axiosInstance.delete(`/banks/${id}`);
  },
};
