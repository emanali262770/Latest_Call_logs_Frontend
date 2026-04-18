import axiosInstance from '@/src/lib/axiosInstance';

function pickFirstDefined(...values) {
  return values.find((value) => value !== undefined && value !== null) ?? '';
}

function toNumber(value) {
  const numeric = Number(value ?? 0);
  return Number.isFinite(numeric) ? numeric : 0;
}

function normalizeSummary(summary) {
  return {
    totalPurchases: toNumber(pickFirstDefined(summary?.totalPurchases, summary?.purchaseTotal)),
    totalDiscount: toNumber(pickFirstDefined(summary?.totalDiscount, summary?.discountTotal)),
    totalFinal: toNumber(pickFirstDefined(summary?.totalFinal, summary?.finalTotal)),
    profit: toNumber(summary?.profit),
  };
}

function normalizeItem(item) {
  return {
    id: pickFirstDefined(item.id, item._id, item.uuid),
    itemRateId: pickFirstDefined(item.item_rate_id, item.itemRateId),
    itemName: pickFirstDefined(item.item_name, item.itemName, item.itemRate?.item, item.item),
    qty: pickFirstDefined(item.qty),
    description: pickFirstDefined(item.description),
    discountPercent: pickFirstDefined(item.discount_percent, item.discountPercent),
    purchasePrice: pickFirstDefined(item.purchase_price, item.purchasePrice),
    purchaseTotal: pickFirstDefined(item.purchase_total, item.purchaseTotal),
    salePrice: pickFirstDefined(item.sale_price, item.salePrice),
    saleTotal: pickFirstDefined(item.sale_total, item.saleTotal),
    salePriceWithTax: pickFirstDefined(item.sale_price_with_tax, item.salePriceWithTax),
    saleTotalWithTax: pickFirstDefined(item.sale_total_with_tax, item.saleTotalWithTax),
    discountAmount: pickFirstDefined(item.discount_amount, item.discountAmount),
    finalPrice: pickFirstDefined(item.final_price, item.finalPrice),
    finalTotal: pickFirstDefined(item.final_total, item.finalTotal),
  };
}

function normalize(item) {
  return {
    id: pickFirstDefined(item.id, item._id, item.uuid),
    estimateId: pickFirstDefined(item.estimate_id, item.estimateId),
    estimateDate: pickFirstDefined(item.estimate_date, item.estimateDate),
    customerId: pickFirstDefined(item.customer_id, item.customerId),
    customerName: pickFirstDefined(item.customerCompany, item.customer_name, item.customerName, item.customer?.company, item.customer?.customer_name),
    person: pickFirstDefined(item.person, item.customer_person, item.customerPerson),
    designation: pickFirstDefined(item.designation, item.customer_designation, item.customerDesignation),
    serviceId: pickFirstDefined(item.service_id, item.serviceId),
    serviceName: pickFirstDefined(item.service, item.service_name, item.serviceName, item.service?.service_name),
    createdBy: pickFirstDefined(item.created_by, item.createdBy, item.created_by_name),
    status: pickFirstDefined(item.status, 'active'),
    purchasePrice: pickFirstDefined(item.purchase_price, item.purchasePrice),
    purchaseTotal: pickFirstDefined(item.purchase_total, item.purchaseTotal),
    salePrice: pickFirstDefined(item.sale_price, item.salePrice),
    saleTotal: pickFirstDefined(item.sale_total, item.saleTotal),
    salePriceWithTax: pickFirstDefined(item.sale_price_with_tax, item.salePriceWithTax),
    saleTotalWithTax: pickFirstDefined(item.sale_total_with_tax, item.saleTotalWithTax),
    discountTotal: pickFirstDefined(item.discount_total, item.discountTotal),
    discountAmount: pickFirstDefined(item.discount_amount, item.discountAmount),
    finalPrice: pickFirstDefined(item.final_price, item.finalPrice),
    finalTotal: pickFirstDefined(item.final_total, item.finalTotal),
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
    return {
      ...response,
      data: extractRows(response).map(normalize),
      summary: normalizeSummary(payload?.summary),
    };
  },

  async get(id) {
    const response = await axiosInstance.get(`/estimations/${id}`);
    const payload = response?.data?.data || response?.data || {};
    return {
      ...response,
      data: {
        ...normalize(payload),
        items: Array.isArray(payload?.items) ? payload.items.map(normalizeItem) : [],
        summary: normalizeSummary(payload?.summary),
      },
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

  async printSingle(id) {
    const response = await axiosInstance.get(`/estimations/${id}/print`);
    return response?.data?.data || response?.data || {};
  },
};
