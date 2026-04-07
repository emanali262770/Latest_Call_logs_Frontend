import axiosInstance from '@/src/lib/axiosInstance';

function normalize(item) {
  return {
    id: item.id || item._id || item.uuid || crypto.randomUUID(),
    name: item.manufacturer_name || item.name || '',
    phone: item.phone || '',
    address: item.address || '',
    status: item.status || 'active',
    raw: item,
  };
}

function extractRows(payload) {
  if (Array.isArray(payload?.data?.manufacturers)) return payload.data.manufacturers;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  if (Array.isArray(payload?.data?.rows)) return payload.data.rows;
  if (Array.isArray(payload?.data?.items)) return payload.data.items;
  return [];
}

export const manufacturerService = {
  async list(search = '') {
    const response = await axiosInstance.get('/manufacturers', {
      params: { search },
    });
    return {
      ...response,
      data: extractRows(response).map(normalize),
    };
  },
  async create(values) {
    return axiosInstance.post('/manufacturers', {
      manufacturer_name: values.name,
      phone: values.phone,
      address: values.address,
      status: values.status || 'active',
    });
  },
  async update(id, values) {
    return axiosInstance.put(`/manufacturers/${id}`, {
      manufacturer_name: values.name,
      phone: values.phone,
      address: values.address,
      status: values.status || 'active',
    });
  },
  async remove(id) {
    return axiosInstance.delete(`/manufacturers/${id}`);
  },
};
