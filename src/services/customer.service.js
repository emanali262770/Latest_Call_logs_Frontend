import axiosInstance from '@/src/lib/axiosInstance';

function normalize(item) {
  return {
    id: item.id || item._id || item.uuid || crypto.randomUUID(),
    code: item.customer_code || item.code || '',
    name: item.customer_name || item.name || '',
    phone: item.phone || '',
    email: item.email || '',
    address: item.address || '',
    openingBalance: item.opening_balance ?? item.openingBalance ?? '',
    obDate: item.ob_date || item.obDate || '',
    status: item.status || 'active',
    raw: item,
  };
}

function extractRows(payload) {
  if (Array.isArray(payload?.data?.customers)) return payload.data.customers;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  if (Array.isArray(payload?.data?.rows)) return payload.data.rows;
  if (Array.isArray(payload?.data?.items)) return payload.data.items;
  return [];
}

export const customerService = {
  async list(search = '') {
    const response = await axiosInstance.get('/customers', {
      params: { search },
    });
    return {
      ...response,
      data: extractRows(response).map(normalize),
    };
  },
  async get(id) {
    const response = await axiosInstance.get(`/customers/${id}`);
    return {
      ...response,
      data: normalize(response?.data?.data || response?.data || {}),
    };
  },
  async create(values) {
    const payload = {
      customer_name: values.name,
      phone: values.phone,
      email: values.email,
      address: values.address,
      ob_date: values.obDate,
      status: values.status || 'active',
    };

    if (String(values.code || '').trim()) {
      payload.customer_code = String(values.code).trim();
    }

    if (values.openingBalance !== undefined) {
      payload.opening_balance = values.openingBalance;
    }

    return axiosInstance.post('/customers', payload);
  },
  async update(id, values) {
    const payload = {
      customer_name: values.name,
      phone: values.phone,
      email: values.email,
      address: values.address,
      ob_date: values.obDate,
      status: values.status || 'active',
    };

    if (String(values.code || '').trim()) {
      payload.customer_code = String(values.code).trim();
    }

    if (values.openingBalance !== undefined) {
      payload.opening_balance = values.openingBalance;
    }

    return axiosInstance.put(`/customers/${id}`, payload);
  },
  async remove(id) {
    return axiosInstance.delete(`/customers/${id}`);
  },
};
