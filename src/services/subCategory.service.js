import axiosInstance from '@/src/lib/axiosInstance';

function normalize(item) {
  return {
    id: item.id || item._id || item.uuid || crypto.randomUUID(),
    categoryId: item.category_id || '',
    categoryName: item.category_name || '',
    name: item.sub_category_name || item.name || '',
    status: item.status || 'active',
    raw: item,
  };
}

function extractRows(payload) {
  if (Array.isArray(payload?.data?.subCategories)) return payload.data.subCategories;
  if (Array.isArray(payload?.data?.sub_categories)) return payload.data.sub_categories;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  if (Array.isArray(payload?.data?.rows)) return payload.data.rows;
  if (Array.isArray(payload?.data?.items)) return payload.data.items;
  return [];
}

export const subCategoryService = {
  async list(search = '') {
    const response = await axiosInstance.get('/sub-categories', {
      params: { search },
    });
    return {
      ...response,
      data: extractRows(response).map(normalize),
    };
  },
  async create(values) {
    return axiosInstance.post('/sub-categories', {
      category_id: values.categoryId,
      sub_category_name: values.name,
      status: values.status || 'active',
    });
  },
  async update(id, values) {
    return axiosInstance.put(`/sub-categories/${id}`, {
      category_id: values.categoryId,
      sub_category_name: values.name,
      status: values.status || 'active',
    });
  },
  async remove(id) {
    return axiosInstance.delete(`/sub-categories/${id}`);
  },
};
