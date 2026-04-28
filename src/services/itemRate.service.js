import axiosInstance from '@/src/lib/axiosInstance';

function extractRows(payload, keys = []) {
  for (const key of keys) {
    if (Array.isArray(payload?.[key])) return payload[key];
    if (Array.isArray(payload?.data?.[key])) return payload.data[key];
  }
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.itemRates)) return payload.data.itemRates;
  if (Array.isArray(payload?.data?.item_rates)) return payload.data.item_rates;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  if (Array.isArray(payload?.data?.data?.itemRates)) return payload.data.data.itemRates;
  if (Array.isArray(payload?.data?.data?.item_rates)) return payload.data.data.item_rates;
  if (Array.isArray(payload?.data?.rows)) return payload.data.rows;
  if (Array.isArray(payload?.data?.items)) return payload.data.items;
  if (Array.isArray(payload?.rows)) return payload.rows;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
}

function normalizeLookupItem(item, nameKeys = []) {
  const name = nameKeys.map((key) => item?.[key]).find(Boolean) || item?.name || '';
  return {
    id: item?.id || item?._id || item?.uuid || '',
    name: String(name || '').trim(),
    raw: item,
  };
}

function normalizeItemLookup(item) {
  return {
    ...normalizeLookupItem(item, ['item_name', 'itemName', 'name']),
    specification: item?.item_specification || item?.itemSpecification || '',
    categoryId: item?.category_id || item?.categoryId || '',
    categoryName: item?.category_name || item?.categoryName || item?.category || '',
    subCategoryId: item?.sub_category_id || item?.subCategoryId || '',
    subCategoryName: item?.sub_category_name || item?.subCategoryName || item?.subCategory || '',
    manufacturerId: item?.manufacturer_id || item?.manufacturerId || '',
    manufacturerName: item?.manufacturer_name || item?.manufacturerName || item?.manufacturer || '',
  };
}

function normalizeRate(item) {
  return {
    id: item?.id || item?._id || item?.uuid || crypto.randomUUID(),
    rateDate: item?.rate_date || item?.rateDate || '',
    supplier: item?.supplier_name || item?.supplierName || item?.supplier || '',
    quotationId: item?.quotation_id || item?.quotationId || '',
    category: item?.category_name || item?.categoryName || item?.category || '',
    subCategory: item?.sub_category_name || item?.subCategoryName || item?.subCategory || '',
    manufacturer: item?.manufacturer_name || item?.manufacturerName || item?.manufacturer || '',
    item: item?.item_name || item?.itemName || item?.item || item?.item_definition_name || item?.itemDefinitionName || '',
    itemSpecification: item?.item_specification || item?.itemSpecification || item?.specification || '',
    image: item?.image || item?.image_url || item?.imageUrl || '',
    reseller: item?.reseller_price ?? item?.resellerPrice ?? '',
    sale: item?.sale_price ?? item?.salePrice ?? '',
    salePrice: item?.sale_price ?? item?.salePrice ?? '',
    salePriceWithTax: item?.sale_price_with_tax ?? item?.salePriceWithTax ?? '',
    status: item?.status || 'active',
    raw: item,
  };
}

export const itemRateService = {
  async lookups() {
    const response = await axiosInstance.get('/item-rates/lookups');
    const payload = response?.data?.data || response?.data || {};

    return {
      ...response,
      data: {
        suppliers: extractRows(payload, ['suppliers']).map((item) => normalizeLookupItem(item, ['supplier_name', 'supplierName', 'name'])).filter((item) => item.name),
        categories: extractRows(payload, ['categories']).map((item) => normalizeLookupItem(item, ['category_name', 'categoryName', 'name'])).filter((item) => item.name),
        subCategories: extractRows(payload, ['subCategories', 'sub_categories']).map((item) => ({
          ...normalizeLookupItem(item, ['sub_category_name', 'subCategoryName', 'name']),
          categoryId: item?.category_id || item?.categoryId || '',
          categoryName: item?.category_name || item?.categoryName || '',
        })).filter((item) => item.name),
        manufacturers: extractRows(payload, ['manufacturers']).map((item) => normalizeLookupItem(item, ['manufacturer_name', 'manufacturerName', 'name'])).filter((item) => item.name),
        items: extractRows(payload, ['items']).map(normalizeItemLookup).filter((item) => item.name),
      },
    };
  },

  async getQuotationId(supplierId, itemId) {
    const response = await axiosInstance.get(`/item-rates/suppliers/${supplierId}/quotation-id`, {
      params: itemId ? { item_definition_id: itemId } : undefined,
    });
    const payload = response?.data?.data || response?.data || {};
    return {
      ...response,
      data: payload?.quotation_id || payload?.quotationId || payload?.id || '',
    };
  },

  async getItemDetails(itemId) {
    const response = await axiosInstance.get(`/item-rates/items/${itemId}/details`);
    const payload = response?.data?.data || response?.data || {};
    return {
      ...response,
      data: {
        id: payload?.id || itemId,
        name: payload?.item_name || payload?.itemName || '',
        categoryId: payload?.category_id || payload?.categoryId || '',
        categoryName: payload?.category_name || payload?.categoryName || '',
        subCategoryId: payload?.sub_category_id || payload?.subCategoryId || '',
        subCategoryName: payload?.sub_category_name || payload?.subCategoryName || '',
        manufacturerId: payload?.manufacturer_id || payload?.manufacturerId || '',
        manufacturerName: payload?.manufacturer_name || payload?.manufacturerName || '',
        supplierId: payload?.itemSupplierId || payload?.supplier_id || payload?.supplierId || '',
        supplierCode: payload?.itemSupplierCode || payload?.supplier_code || payload?.supplierCode || '',
        supplierName: payload?.defaultSupplierName || payload?.itemSupplierName || payload?.supplier_name || payload?.supplierName || '',
        defaultSupplierName: payload?.defaultSupplierName || payload?.itemSupplierName || payload?.supplier_name || payload?.supplierName || '',
        specification: payload?.item_specification || payload?.itemSpecification || '',
        purchasePrice: payload?.purchasePrice ?? payload?.purchase_price ?? '',
        salePrice: payload?.sale_price ?? payload?.salePrice ?? '',
      },
    };
  },

  async list(params = {}) {
    const response = await axiosInstance.get('/item-rates', { params });
    return {
      ...response,
      data: extractRows(response).map(normalizeRate),
    };
  },

  async create(values) {
    return axiosInstance.post('/item-rates', values);
  },

  async update(id, values) {
    return axiosInstance.put(`/item-rates/${id}`, values);
  },

  async remove(id) {
    return axiosInstance.delete(`/item-rates/${id}`);
  },
};
