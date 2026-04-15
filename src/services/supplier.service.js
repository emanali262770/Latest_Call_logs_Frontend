import axiosInstance from '@/src/lib/axiosInstance';

function normalize(item) {
  return {
    id: item.id || item._id || item.uuid || crypto.randomUUID(),
    code: item.supplier_code || item.code || '',
    name: item.supplier_name || item.name || '',
    contactPerson: item.contact_person || item.contactPerson || '',
    city: item.city || '',
    phone: item.phone || '',
    mobile: item.mobile_number || item.mobile_no || item.mobile || '',
    email: item.email || '',
    address: item.address || '',
    openingBalance: item.opening_balance ?? item.openingBalance ?? '',
    obDate: item.ob_date || item.obDate || '',
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
    const payload = {
      supplier_name: values.name,
      contact_person: values.contactPerson,
      city: values.city,
      phone: values.phone,
      mobile_number: values.mobile,
      email: values.email,
      address: values.address,
      ob_date: values.obDate,
      status: values.status || 'active',
    };

    if (String(values.code || '').trim()) {
      payload.supplier_code = String(values.code).trim();
    }

    if (values.openingBalance !== undefined) {
      payload.opening_balance = values.openingBalance;
    }

    return axiosInstance.post('/suppliers', payload);
  },
  async update(id, values) {
    const payload = {
      supplier_name: values.name,
      contact_person: values.contactPerson,
      city: values.city,
      phone: values.phone,
      mobile_number: values.mobile,
      email: values.email,
      address: values.address,
      ob_date: values.obDate,
      status: values.status || 'active',
    };

    if (String(values.code || '').trim()) {
      payload.supplier_code = String(values.code).trim();
    }

    if (values.openingBalance !== undefined) {
      payload.opening_balance = values.openingBalance;
    }

    return axiosInstance.put(`/suppliers/${id}`, payload);
  },
  async remove(id) {
    return axiosInstance.delete(`/suppliers/${id}`);
  },
};
