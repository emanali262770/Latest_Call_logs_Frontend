import axiosInstance from '@/src/lib/axiosInstance';

function pickFirstDefined(...values) {
  return values.find((value) => value !== undefined && value !== null) ?? '';
}

function toNumber(value) {
  const numeric = Number(value ?? 0);
  return Number.isFinite(numeric) ? numeric : 0;
}

function extractRows(response) {
  const payload = response?.data?.data || response?.data || {};
  if (Array.isArray(payload?.quotations)) return payload.quotations;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.rows)) return payload.rows;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(response?.data)) return response.data;
  return [];
}

function normalizeItem(item) {
  const rate = toNumber(pickFirstDefined(item.rate, item.price, item.salePrice, item.sale_price));
  const qty = toNumber(item.qty);
  const total = toNumber(pickFirstDefined(item.total, item.saleTotal, item.sale_total, rate * qty));
  const gstAmount = toNumber(pickFirstDefined(item.gstAmount, item.gst_amount, item.gst, (rate * 18) / 100));
  const rateWithGst = toNumber(pickFirstDefined(item.rateWithGst, item.rate_with_gst, rate + gstAmount));
  const totalWithGst = toNumber(pickFirstDefined(item.totalWithGst, item.total_with_gst, rateWithGst * qty));

  return {
    id: pickFirstDefined(item.id, item._id, item.uuid, crypto.randomUUID()),
    itemRateId: pickFirstDefined(item.itemRateId, item.item_rate_id),
    item: pickFirstDefined(item.itemName, item.item_name, item.item),
    itemName: pickFirstDefined(item.itemName, item.item_name, item.item),
    price: rate ? String(rate) : '',
    rate,
    qty: qty ? String(qty) : '',
    total: total ? total.toFixed(2) : '',
    gst: gstAmount,
    gstPercent: toNumber(pickFirstDefined(item.gstPercent, item.gst_percent, 18)),
    gstAmount,
    rateWithGst,
    totalWithGst,
    description: pickFirstDefined(item.description),
    raw: item,
  };
}

function normalize(item) {
  const items = Array.isArray(item?.items) ? item.items.map(normalizeItem) : [];
  const quotationDate = pickFirstDefined(item.quotationDate, item.quotation_date, item.date);
  const customerName = pickFirstDefined(item.customerName, item.customer_name, item.customerCompany, item.customer?.company, item.company);
  const serviceName = pickFirstDefined(item.serviceName, item.service_name, item.service?.serviceName, item.service?.service_name, item.forProduct);

  return {
    id: pickFirstDefined(item.id, item._id, item.uuid),
    quotationNo: pickFirstDefined(item.quotationNo, item.quotation_no),
    quotationDate: quotationDate ? String(quotationDate).slice(0, 10) : '',
    revisionId: pickFirstDefined(item.revisionId, item.revision_id),
    customerId: pickFirstDefined(item.customerId, item.customer_id),
    customerName,
    company: customerName,
    person: pickFirstDefined(item.person, item.customerPerson, item.customer_person),
    designation: pickFirstDefined(item.designation, item.customerDesignation, item.customer_designation),
    department: pickFirstDefined(item.department, item.customerDepartment, item.customer_department),
    estimationId: pickFirstDefined(item.estimationId, item.estimation_id),
    serviceId: pickFirstDefined(item.serviceId, item.service_id),
    serviceName,
    forProduct: serviceName,
    letterType: pickFirstDefined(item.letterType, item.letter_type, 'Quotation'),
    taxMode: pickFirstDefined(item.taxMode, item.tax_mode),
    createdBy: pickFirstDefined(item.createdBy, item.created_by, item.created_by_name),
    status: pickFirstDefined(item.status, 'active'),
    items,
    itemsTotal: pickFirstDefined(item.itemsTotal, item.items_total, item.summary?.grandTotal, item.summary?.grand_total),
    raw: item,
  };
}

function unwrapData(response) {
  return response?.data?.data || response?.data || {};
}

function normalizeWithDelivery(response) {
  const payload = unwrapData(response);
  return {
    ...normalize(payload),
    delivery: payload.delivery,
  };
}

export const quotationService = {
  async list(params = {}) {
    const response = await axiosInstance.get('/quotations', {
      params: {
        ...params,
        _t: Date.now(),
      },
      headers: {
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
      },
    });
    return {
      ...response,
      data: extractRows(response).map(normalize),
    };
  },

  async get(id) {
    const response = await axiosInstance.get(`/quotations/${id}`);
    return {
      ...response,
      data: normalize(unwrapData(response)),
    };
  },

  async getByRevisionId(revisionId) {
    const response = await axiosInstance.get(`/quotations/revisions/${encodeURIComponent(revisionId)}`);
    return {
      ...response,
      data: normalize(unwrapData(response)),
    };
  },

  async getNextQuotationNo(letterType = 'Quotation') {
    const response = await axiosInstance.get('/quotations/next-number', {
      params: { letterType },
    });
    const payload = unwrapData(response);
    return {
      ...response,
      data: {
        quotationNo: pickFirstDefined(payload.quotationNo, payload.quotation_no),
      },
    };
  },

  async getNextRevisionId() {
    const response = await axiosInstance.get('/quotations/next-revision');
    const payload = unwrapData(response);
    return {
      ...response,
      data: {
        revisionId: pickFirstDefined(payload.revisionId, payload.revision_id),
      },
    };
  },

  async create(values) {
    const response = await axiosInstance.post('/quotations', values);
    return {
      ...response,
      data: normalizeWithDelivery(response),
    };
  },

  async revise(id, values) {
    const response = await axiosInstance.post(`/quotations/${id}/revise`, values);
    return {
      ...response,
      data: normalizeWithDelivery(response),
    };
  },

  async update(id, values) {
    const response = await axiosInstance.put(`/quotations/${id}`, values);
    return {
      ...response,
      data: normalizeWithDelivery(response),
    };
  },

  async send(id) {
    return axiosInstance.post(`/quotations/${id}/send`, { email: true });
  },

  async printSingle(id) {
    const response = await axiosInstance.get(`/quotations/${id}/print`);
    return response?.data?.data || response?.data || {};
  },

  async remove(id) {
    return axiosInstance.delete(`/quotations/${id}`);
  },
};
