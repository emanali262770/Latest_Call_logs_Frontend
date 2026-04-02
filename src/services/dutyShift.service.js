import axiosInstance from '@/src/lib/axiosInstance';

function normalizeDutyShift(item) {
  return {
    id: item.id || item._id || item.uuid || crypto.randomUUID(),
    name: item.duty_shift_name || item.name || '',
    status: item.status || 'active',
    raw: item,
  };
}

function extractListRows(payload) {
  if (Array.isArray(payload?.data?.duty_shifts)) return payload.data.duty_shifts;
  if (Array.isArray(payload?.data?.dutyShifts)) return payload.data.dutyShifts;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  if (Array.isArray(payload?.data?.rows)) return payload.data.rows;
  if (Array.isArray(payload?.data?.items)) return payload.data.items;
  return [];
}

export const dutyShiftService = {
  async list(search = '') {
    const response = await axiosInstance.get('/duty-shifts', {
      params: { search, q: search, keyword: search },
    });

    return {
      ...response,
      data: extractListRows(response).map(normalizeDutyShift),
    };
  },

  async create(values) {
    return axiosInstance.post('/duty-shifts', {
      duty_shift_name: values.name,
      status: values.status || 'active',
    });
  },

  async update(id, values) {
    return axiosInstance.put(`/duty-shifts/${id}`, {
      duty_shift_name: values.name,
      status: values.status || 'active',
    });
  },

  async remove(id) {
    return axiosInstance.delete(`/duty-shifts/${id}`);
  },
};
