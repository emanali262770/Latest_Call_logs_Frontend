import axiosInstance from '@/src/lib/axiosInstance';

function extractRows(payload) {
  if (Array.isArray(payload?.data?.followUps)) return payload.data.followUps;
  if (Array.isArray(payload?.data?.followups)) return payload.data.followups;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  if (Array.isArray(payload?.data?.rows)) return payload.data.rows;
  if (Array.isArray(payload?.data?.items)) return payload.data.items;
  return [];
}

function normalizeStatus(value) {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'hold') return 'Hold';
  if (normalized === 'complete') return 'Complete';
  return 'Active';
}

function normalizeTime(value) {
  const normalized = String(value || '').trim();
  if (!normalized) return '';

  const timeMatch = normalized.match(/^(\d{2}:\d{2})(?::\d{2})?$/);
  if (timeMatch) return timeMatch[1];

  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) return normalized;

  return parsed.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function normalizeFollowUp(item) {
  const meetingDate = item.meetingDate || item.meeting_date || item.date || item.followupDate || item.followup_date || '';
  const meetingTime = item.meetingTime || item.meeting_date_time || item.meeting_time || item.time || item.followupTime || item.followup_time || '';

  return {
    id: item.id || item._id || item.uuid,
    customerName: item.customerName || item.customer_name || item.companyName || item.company_name || '',
    whatsappNumber:
      item.whatsappNumber ||
      item.whatsapp_number ||
      item.customerNumber ||
      item.customer_number ||
      item.number ||
      item.phone ||
      item.mobile ||
      '',
    meetingDate,
    meetingTime: normalizeTime(meetingTime),
    nextFollowupDate: item.nextFollowupDate || item.next_followup_date || '',
    nextFollowupTime: normalizeTime(item.nextFollowupTime || item.next_followup_time || ''),
    customerRemarks: item.customerRemarks || item.customer_remarks || item.remarks || item.description || '',
    status: normalizeStatus(item.status),
    createdAt: item.createdAt || item.created_at || '',
    raw: item,
  };
}

function extractSingle(payload) {
  return payload?.data?.followUp || payload?.data?.followup || payload?.data || {};
}

export const followUpService = {
  async list(search = '') {
    const response = await axiosInstance.get('/follow-ups', {
      params: search ? { search } : {},
    });

    return {
      ...response,
      data: extractRows(response).map(normalizeFollowUp),
    };
  },

  async getById(id) {
    const response = await axiosInstance.get(`/follow-ups/${id}`);
    return {
      ...response,
      data: normalizeFollowUp(extractSingle(response)),
    };
  },

  async update(id, payload) {
    return axiosInstance.put(`/follow-ups/${id}`, payload);
  },

  async remove(id) {
    return axiosInstance.delete(`/follow-ups/${id}`);
  },
};