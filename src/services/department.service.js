import axiosInstance from '@/src/lib/axiosInstance';

function normalizeDepartment(item) {
  return {
    id: item.id || item._id || item.uuid || crypto.randomUUID(),
    name: item.department_name || item.name || '',
    status: item.status || 'active',
    raw: item,
  };
}

function extractListRows(payload) {
  if (Array.isArray(payload?.data?.departments)) return payload.data.departments;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  if (Array.isArray(payload?.data?.rows)) return payload.data.rows;
  if (Array.isArray(payload?.data?.items)) return payload.data.items;
  return [];
}

export const departmentService = {
  async list(search = '') {
    const response = await axiosInstance.get('/departments', {
      params: { search, q: search, keyword: search },
    });

    return {
      ...response,
      data: extractListRows(response).map(normalizeDepartment),
    };
  },

  async create(values) {
    return axiosInstance.post('/departments', {
      department_name: values.name,
      status: values.status || 'active',
    });
  },

  async update(id, values) {
    return axiosInstance.put(`/departments/${id}`, {
      department_name: values.name,
      status: values.status || 'active',
    });
  },

  async remove(id) {
    return axiosInstance.delete(`/departments/${id}`);
  },
};
