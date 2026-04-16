import axiosInstance from '@/src/lib/axiosInstance';

function normalize(item) {
  return {
    id: item.id || item._id || item.uuid || '',
    estimateId: item.estimate_id || item.estimateId || '',
    estimateDate: item.estimate_date || item.estimateDate || '',
    customerId: item.customer_id || item.customerId || '',
    customerName: item.customerCompany || item.customer_name || item.customerName || item.customer?.company || item.customer?.customer_name || '',
    serviceId: item.service_id || item.serviceId || '',
    serviceName: item.service || item.service_name || item.serviceName || item.service?.service_name || '',
    itemRateId: item.item_rate_id || item.itemRateId || '',
    itemName: item.item_name || item.itemName || item.itemRate?.item || item.item || '',
    qty: item.qty ?? '',
    description: item.description || '',
    discountPercent: item.discount_percent ?? item.discountPercent ?? '',
    status: item.status || 'active',
    purchasePrice: item.purchase_price ?? item.purchasePrice ?? '',
    purchaseTotal: item.purchase_total ?? item.purchaseTotal ?? '',
    salePrice: item.sale_price ?? item.salePrice ?? '',
    saleTotal: item.sale_total ?? item.saleTotal ?? '',
    salePriceWithTax: item.sale_price_with_tax ?? item.salePriceWithTax ?? '',
    saleTotalWithTax: item.sale_total_with_tax ?? item.saleTotalWithTax ?? '',
    discountAmount: item.discount_amount ?? item.discountAmount ?? '',
    finalPrice: item.final_price ?? item.finalPrice ?? '',
    finalTotal: item.final_total ?? item.finalTotal ?? '',
    raw: item,
  };
}

function extractRows(response) {
  const payload = response?.data?.data || response?.data || {};
  if (Array.isArray(payload?.estimations)) return payload.estimations;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(response?.data)) return response.data;
  return [];
}

export const estimationService = {
  async list(params = {}) {
    const response = await axiosInstance.get('/estimations', { params });
    const payload = response?.data?.data || response?.data || {};
    const rawSummary = payload?.summary || {};
    return {
      ...response,
      data: extractRows(response).map(normalize),
      summary: {
        totalPurchases: Number(rawSummary.totalPurchases ?? 0),
        totalDiscount: Number(rawSummary.totalDiscount ?? 0),
        totalFinal: Number(rawSummary.totalFinal ?? 0),
        profit: Number(rawSummary.profit ?? 0),
      },
    };
  },

  async get(id) {
    const response = await axiosInstance.get(`/estimations/${id}`);
    const payload = response?.data?.data || response?.data || {};
    return {
      ...response,
      data: normalize(payload),
    };
  },

  async create(values) {
    return axiosInstance.post('/estimations', values);
  },

  async update(id, values) {
    return axiosInstance.put(`/estimations/${id}`, values);
  },

  async remove(id) {
    return axiosInstance.delete(`/estimations/${id}`);
  },

  async printAll(params = {}) {
    const response = await axiosInstance.get('/estimations/print', { params });
    return response?.data?.data || response?.data || {};
  },

  async printSingle(id) {
    const response = await axiosInstance.get(`/estimations/${id}/print`);
    return response?.data?.data || response?.data || {};
  },
};
