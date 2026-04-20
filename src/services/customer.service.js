import axiosInstance from '@/src/lib/axiosInstance';

function normalize(item) {
  return {
    id: item.id || item._id || item.uuid || crypto.randomUUID(),
    code: item.customer_code || item.code || '',
    name: item.customer_name || item.name || item.company || '',
    customerGroupId:
      item.customer_group_id ||
      item.customerGroupId ||
      item.customer_group?.id ||
      item.customerGroup?.id ||
      '',
    group:
      item.group ||
      item.group_name ||
      item.customer_group ||
      item.customer_group_name ||
      item.customerGroup?.groupName ||
      item.customerGroup?.group_name ||
      '',
    company: item.company || item.customer_name || item.name || '',
    person: item.person || item.contact_person || '',
    designation: item.designation || '',
    department: item.department || '',
    officeAddress: item.office_address || item.officeAddress || '',
    phone: item.phone || item.mobile || '',
    officePhone: item.office_phone || item.officePhone || '',
    fax: item.fax || '',
    address: item.address || item.residence_address || item.residenceAddress || '',
    residencePhone: item.residence_phone || item.residencePhone || '',
    mobile: item.mobile || item.phone || '',
    whatsappNo: item.whatsapp_no || item.whatsappNo || item.whatsapp || '',
    email: item.email || '',
    website: item.website || item.web_site || item.webSite || '',
    description: item.description || '',
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
      customer_group_id: values.customerGroupId || null,
      company: values.company,
      person: values.person,
      designation: values.designation,
      department: values.department,
      office_address: values.officeAddress,
      office_phone: values.officePhone,
      fax: values.fax,
      residence_address: values.address,
      residence_phone: values.residencePhone,
      mobile: values.mobile,
      whatsapp_no: values.whatsappNo,
      email: values.email,
      website: values.website,
      description: values.description,
      status: values.status || 'active',
    };

    return axiosInstance.post('/customers', payload);
  },
  async update(id, values) {
    const payload = {
      customer_group_id: values.customerGroupId || null,
      company: values.company,
      person: values.person,
      designation: values.designation,
      department: values.department,
      office_address: values.officeAddress,
      office_phone: values.officePhone,
      fax: values.fax,
      residence_address: values.address,
      residence_phone: values.residencePhone,
      mobile: values.mobile,
      whatsapp_no: values.whatsappNo,
      email: values.email,
      website: values.website,
      description: values.description,
      status: values.status || 'active',
    };

    return axiosInstance.put(`/customers/${id}`, payload);
  },
  async remove(id) {
    return axiosInstance.delete(`/customers/${id}`);
  },
};
