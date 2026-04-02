import axiosInstance from '@/src/lib/axiosInstance';

function normalizeEmployee(item) {
  const name = item.employee_name || item.first_name || '';
  const enabled = typeof item.enabled === 'boolean'
    ? item.enabled
    : String(item.status || '').toLowerCase() === 'active';

  return {
    id: item.id || item._id || item.uuid || item.emp_id || crypto.randomUUID(),
    employee_name: name,
    emp_id: item.emp_id || '',
    profile_image: item.profile_image || '',
    father_name: item.father_name || '',
    address: item.address || '',
    city: item.city || '',
    sex: item.sex || '',
    email: item.email || '',
    phone: item.phone || '',
    mobile: item.mobile || '',
    cnic_no: item.cnic_no || '',
    date_of_birth: item.date_of_birth ? String(item.date_of_birth).slice(0, 10) : '',
    qualification: item.qualification || '',
    blood_group: item.blood_group || '',
    department: item.department || '',
    designation: item.designation || '',
    employee_type: item.employee_type || '',
    hiring_date: item.hiring_date ? String(item.hiring_date).slice(0, 10) : '',
    duty_shift: item.duty_shift || '',
    bank: item.bank || '',
    account_number: item.account_number || '',
    enabled,
    status: item.status || (enabled ? 'active' : 'inactive'),
    raw: item,
  };
}

function extractListRows(payload) {
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  if (Array.isArray(payload?.data?.rows)) return payload.data.rows;
  if (Array.isArray(payload?.data?.items)) return payload.data.items;
  return [];
}

function toEmployeeFormData(values) {
  const formData = new FormData();

  Object.entries(values).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    if (key === 'profile_image' && !(value instanceof File)) return;

    if (typeof value === 'boolean') {
      formData.append(key, value ? 'true' : 'false');
      return;
    }

    formData.append(key, value);
  });

  return formData;
}

export const employeeService = {
  async list(search = '') {
    const response = await axiosInstance.get('/employees', {
      params: { search, q: search },
    });

    return {
      ...response,
      data: extractListRows(response).map(normalizeEmployee),
    };
  },

  async getById(id) {
    const response = await axiosInstance.get(`/employees/${id}`);
    return {
      ...response,
      data: normalizeEmployee(response?.data || {}),
    };
  },

  async create(values) {
    return axiosInstance.post('/employees', toEmployeeFormData(values), {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  async update(id, values) {
    return axiosInstance.put(`/employees/${id}`, toEmployeeFormData(values), {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  async remove(id) {
    return axiosInstance.delete(`/employees/${id}`);
  },
};
