import axiosInstance from '@/src/lib/axiosInstance';

function normalize(item) {
  return {
    id: item.id || item._id || item.uuid || crypto.randomUUID(),
    name: item.supplier_name || item.name || '',
    phone: item.phone || '',
    address: item.address || '',
    status: item.status || 'active',
    raw: item,
  };
}

function extractRows(payload) {
  if (Array.isArray(payload?.data?.suppliers)) return payload.data.suppliers;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  if (Array.isArray(payload?.data?.rows)) return payload.data.rows;
  if (Array.isArray(payload?.data?.items)) return payload.data.items;
  return [];
}

export const supplierService = {
  async list(search = '') {
    const response = await axiosInstance.get('/suppliers', {
      params: { search },
    });
    return {
      ...response,
      data: extractRows(response).map(normalize),
    };
  },
  async create(values) {
    return axiosInstance.post('/suppliers', {
      name: values.name,
      phone: values.phone,
      address: values.address,
      status: values.status || 'active',
    });
  },
  async update(id, values) {
    return axiosInstance.put(`/suppliers/${id}`, {
      name: values.name,
      phone: values.phone,
      address: values.address,
      status: values.status || 'active',
    });
  },
  async remove(id) {
    return axiosInstance.delete(`/suppliers/${id}`);
  },
};
