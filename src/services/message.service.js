import axiosInstance from '@/src/lib/axiosInstance';

function titleCase(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function extractCollection(payload, keys = []) {
  const candidates = [payload, payload?.data, payload?.data?.data, payload?.result, payload?.result?.data];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;

    for (const key of keys) {
      if (Array.isArray(candidate?.[key])) return candidate[key];
    }
  }

  return [];
}

function normalizeHistory(item = {}) {
  const customers = [
    item.customer_name,
    item.customerName,
    item.customer,
    item.company,
    Array.isArray(item.customers) ? item.customers.map((entry) => entry?.customer_name || entry?.name || entry).filter(Boolean).join(', ') : '',
  ]
    .find((value) => String(value || '').trim()) || '';

  return {
    id: item.id || item._id || item.uuid || crypto.randomUUID(),
    group: item.group_name || item.groupName || item.group || '',
    customer: customers,
    template: item.template_name || item.templateName || item.template_title || item.templateTitle || item.title || item.template || '',
    sentAt: item.sent_at || item.sentAt || item.created_at || item.createdAt || '',
    status: titleCase(item.status || item.delivery_status || item.deliveryStatus || 'sent') || 'Sent',
    raw: item,
  };
}

function normalizeGroup(item = {}) {
  return {
    id: item.id || item.group_id || item.groupId || item._id || '',
    name: item.group_name || item.groupName || item.name || '',
    status: item.status || 'active',
    raw: item,
  };
}

function normalizeCustomer(item = {}) {
  return {
    id: item.id || item.customer_id || item.customerId || item._id || '',
    name: item.customer_name || item.customerName || item.company || item.name || '',
    whatsappNo: item.whatsapp_no || item.whatsappNo || item.whatsapp || item.mobile || item.phone || '',
    raw: item,
  };
}

function normalizeTemplate(item = {}) {
  const messageText = item.message_text || item.messageText || item.body || item.content || '';

  return {
    id: item.id || item.template_id || item.templateId || item.key || '',
    name: item.name || item.title || '',
    category: item.category || 'Template',
    description: item.description || '',
    title: item.title || item.name || '',
    messageText: String(messageText || ''),
    raw: item,
  };
}

function normalizePreview(payload = {}) {
  const source = payload?.preview || payload?.data?.preview || payload?.data || payload;

  return {
    title: source.title || source.name || '',
    description: source.description || '',
    messageText: source.message_text || source.messageText || source.preview_text || source.previewText || source.body || source.content || '',
    raw: source,
  };
}

export const messageService = {
  async list() {
    const response = await axiosInstance.get('/messages');

    return {
      ...response,
      data: extractCollection(response, ['messages', 'logs', 'history', 'items', 'records']).map(normalizeHistory),
    };
  },

  async listGroups() {
    const response = await axiosInstance.get('/messages/groups');

    return {
      ...response,
      data: extractCollection(response, ['groups', 'customerGroups', 'items', 'records']).map(normalizeGroup),
    };
  },

  async listCustomers(groupId) {
    const response = await axiosInstance.get(`/messages/groups/${groupId}/customers`);

    return {
      ...response,
      data: extractCollection(response, ['customers', 'items', 'records']).map(normalizeCustomer),
    };
  },

  async listTemplates() {
    const response = await axiosInstance.get('/messages/templates');

    return {
      ...response,
      data: extractCollection(response, ['templates', 'items', 'records']).map(normalizeTemplate),
    };
  },

  async preview(payload) {
    const response = await axiosInstance.post('/messages/preview', payload);

    return {
      ...response,
      data: normalizePreview(response),
    };
  },

  async send(payload) {
    return axiosInstance.post('/messages/send', payload);
  },
};