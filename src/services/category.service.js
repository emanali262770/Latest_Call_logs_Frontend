import axiosInstance from '@/src/lib/axiosInstance';

function normalize(item) {
  return {
    id: item.id || item._id || item.uuid || crypto.randomUUID(),
    name: item.category_name || item.name || '',
    status: item.status || 'active',
    raw: item,
  };
}

function extractRows(payload) {
  if (Array.isArray(payload?.data?.categories)) return payload.data.categories;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  if (Array.isArray(payload?.data?.rows)) return payload.data.rows;
  if (Array.isArray(payload?.data?.items)) return payload.data.items;
  return [];
}

export const categoryService = {
  async list(search = '') {
    const response = await axiosInstance.get('/categories', {
      params: { search },
    });
    return {
      ...response,
      data: extractRows(response).map(normalize),
    };
  },
  async create(values) {
    return axiosInstance.post('/categories', {
      category_name: values.name,
      status: values.status || 'active',
    });
  },
  async update(id, values) {
    return axiosInstance.put(`/categories/${id}`, {
      category_name: values.name,
      status: values.status || 'active',
    });
  },
  async remove(id) {
    return axiosInstance.delete(`/categories/${id}`);
  },
};
