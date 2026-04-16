import axiosInstance from '@/src/lib/axiosInstance';

function normalize(item = {}) {
  return {
    id: item.id || item._id || item.uuid || '',
    name: item.groupName || item.group_name || item.name || '',
    groupName: item.groupName || item.group_name || item.name || '',
    status: item.status || 'active',
    createdAt: item.createdAt || item.created_at || '',
    updatedAt: item.updatedAt || item.updated_at || '',
    raw: item,
  };
}

function extractRows(payload) {
  if (Array.isArray(payload?.data?.customerGroups)) return payload.data.customerGroups;
  if (Array.isArray(payload?.data?.data?.customerGroups)) return payload.data.data.customerGroups;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.records)) return payload.data.records;
  return [];
}

export const customerGroupService = {
  async list(search = '', status = '') {
    const response = await axiosInstance.get('/customer-groups', {
      params: {
        ...(search ? { search } : {}),
        ...(status ? { status } : {}),
      },
    });

    return {
      ...response,
      data: extractRows(response).map(normalize),
    };
  },

  async get(id) {
    const response = await axiosInstance.get(`/customer-groups/${id}`);

    return {
      ...response,
      data: normalize(response?.data?.customerGroup || response?.data?.data || response?.data || {}),
    };
  },

  async create(values) {
    return axiosInstance.post('/customer-groups', {
      group_name: values.name,
      status: values.status || 'active',
    });
  },

  async update(id, values) {
    return axiosInstance.put(`/customer-groups/${id}`, {
      group_name: values.name,
      status: values.status || 'active',
    });
  },

  async remove(id) {
    return axiosInstance.delete(`/customer-groups/${id}`);
  },
};
