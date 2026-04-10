import axiosInstance from '@/src/lib/axiosInstance';

function normalizeBoolean(value, fallback = false) {
  if (typeof value === 'boolean') return value;
  if (value === 1 || value === '1') return true;
  if (value === 0 || value === '0') return false;

  const normalized = String(value || '').trim().toLowerCase();
  if (['true', 'yes', 'read'].includes(normalized)) return true;
  if (['false', 'no', 'unread'].includes(normalized)) return false;
  return fallback;
}

function extractRows(payload) {
  if (Array.isArray(payload?.data?.itemDefinitions)) return payload.data.itemDefinitions;
  if (Array.isArray(payload?.data?.item_definitions)) return payload.data.item_definitions;
  if (Array.isArray(payload?.data?.notifications)) return payload.data.notifications;
  if (Array.isArray(payload?.data?.rows)) return payload.data.rows;
  if (Array.isArray(payload?.data?.items)) return payload.data.items;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

function formatTimeLabel(value) {
  const input = String(value || '').trim();
  if (!input) return 'Recent';

  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return input;

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.max(0, Math.floor(diffMs / 60000));

  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes} min ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hr ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;

  return date.toLocaleDateString();
}

function normalizeNotification(item) {
  const reorderLevel = Number(item.reorder_level ?? item.reorderLevel ?? 0);
  const stock = Number(item.stock ?? 0);
  const quantityLabel = Number.isFinite(stock) ? stock : item.stock || 0;

  return {
    id: item.id || item.notification_id || item.item_definition_id || crypto.randomUUID(),
    title: item.item_name || item.title || 'Low stock alert',
    description:
      item.description ||
      `Current stock is ${quantityLabel}, below reorder level ${reorderLevel}.`,
    time: formatTimeLabel(item.updated_at || item.created_at || item.time),
    unread: !normalizeBoolean(item.is_read ?? item.read ?? item.isRead, false),
    quantityLabel,
    reorderLevel,
    location: item.location_name || item.location || '',
    code: item.item_code || '',
  };
}

function extractCount(payload) {
  const candidates = [
    payload?.data?.count,
    payload?.data?.records,
    payload?.data?.total,
    payload?.data?.badge_count,
    payload?.data?.unread_count,
    payload?.data?.notifications_count,
    payload?.count,
    payload?.records,
    payload?.total,
    payload?.unread_count,
  ];

  const value = candidates.find((item) => item !== undefined && item !== null);
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

export const lowStockNotificationService = {
  async list() {
    const response = await axiosInstance.get('/item-definitions/low-stock');
    return {
      ...response,
      data: extractRows(response).map(normalizeNotification),
    };
  },

  async count() {
    const response = await axiosInstance.get('/item-definitions/low-stock/count');
    return {
      ...response,
      data: extractCount(response),
    };
  },

  async markAsRead(id) {
    return axiosInstance.patch(`/item-definitions/low-stock/${id}/read`);
  },
};
