import axiosInstance from '@/src/lib/axiosInstance';

function normalizeEmployeeType(item) {
  return {
    id: item.id || item._id || item.uuid || crypto.randomUUID(),
    name: item.employee_type_name || item.name || '',
    status: item.status || 'active',
    raw: item,
  };
}

function extractListRows(payload) {
  if (Array.isArray(payload?.data?.employee_types)) return payload.data.employee_types;
  if (Array.isArray(payload?.data?.employeeTypes)) return payload.data.employeeTypes;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  if (Array.isArray(payload?.data?.rows)) return payload.data.rows;
  if (Array.isArray(payload?.data?.items)) return payload.data.items;
  return [];
}

export const employeeTypeService = {
  async list(search = '') {
    const response = await axiosInstance.get('/employee-types', {
      params: { search, q: search, keyword: search },
    });

    return {
      ...response,
      data: extractListRows(response).map(normalizeEmployeeType),
    };
  },

  async create(values) {
    return axiosInstance.post('/employee-types', {
      employee_type_name: values.name,
      status: values.status || 'active',
    });
  },

  async update(id, values) {
    return axiosInstance.put(`/employee-types/${id}`, {
      employee_type_name: values.name,
      status: values.status || 'active',
    });
  },

  async remove(id) {
    return axiosInstance.delete(`/employee-types/${id}`);
  },
};
