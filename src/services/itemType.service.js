import axiosInstance from '@/src/lib/axiosInstance';

function normalize(item) {
  return {
    id: item.id || item._id || item.uuid || crypto.randomUUID(),
    name: item.item_type_name || item.name || '',
    status: item.status || 'active',
    raw: item,
  };
}

function extractRows(payload) {
  if (Array.isArray(payload?.data?.itemTypes)) return payload.data.itemTypes;
  if (Array.isArray(payload?.data?.item_types)) return payload.data.item_types;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  if (Array.isArray(payload?.data?.rows)) return payload.data.rows;
  if (Array.isArray(payload?.data?.items)) return payload.data.items;
  return [];
}

export const itemTypeService = {
  async list(search = '') {
    const response = await axiosInstance.get('/item-types', {
      params: { search },
    });
    return {
      ...response,
      data: extractRows(response).map(normalize),
    };
  },
  async create(values) {
    return axiosInstance.post('/item-types', {
      item_type_name: values.name,
      status: values.status || 'active',
    });
  },
  async update(id, values) {
    return axiosInstance.put(`/item-types/${id}`, {
      item_type_name: values.name,
      status: values.status || 'active',
    });
  },
  async remove(id) {
    return axiosInstance.delete(`/item-types/${id}`);
  },
};
