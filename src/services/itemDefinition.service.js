import axiosInstance from '@/src/lib/axiosInstance';

function resolveAssetUrl(value) {
  const assetPath = String(value || '').trim();
  if (!assetPath) return '';

  if (/^https?:\/\//i.test(assetPath) || /^blob:/i.test(assetPath)) {
    return assetPath;
  }

  const baseUrl = String(import.meta.env.VITE_API_BASE_URL || '').trim();
  if (!baseUrl) return assetPath;

  try {
    const apiUrl = new URL(baseUrl);
    return new URL(assetPath, apiUrl.origin).toString();
  } catch {
    return assetPath;
  }
}

function extractRows(payload) {
  if (Array.isArray(payload?.data?.itemDefinitions)) return payload.data.itemDefinitions;
  if (Array.isArray(payload?.data?.item_definitions)) return payload.data.item_definitions;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  if (Array.isArray(payload?.data?.rows)) return payload.data.rows;
  if (Array.isArray(payload?.data?.items)) return payload.data.items;
  return [];
}

function normalizeBoolean(value, fallback = false) {
  if (typeof value === 'boolean') return value;
  if (value === 1 || value === '1') return true;
  if (value === 0 || value === '0') return false;

  const normalized = String(value || '').trim().toLowerCase();
  if (['true', 'yes', 'active'].includes(normalized)) return true;
  if (['false', 'no', 'inactive'].includes(normalized)) return false;
  return fallback;
}

function normalizeItemDefinition(item) {
  const imagePath = item.image || item.image_url || item.image_path || '';

  return {
    id: item.id || item._id || item.uuid || crypto.randomUUID(),
    code: item.item_code || item.code || '',
    itemName: item.item_name || item.name || '',
    itemType: item.item_type_name || item.itemType || '',
    itemTypeId: item.item_type_id || item.itemTypeId || '',
    category: item.category_name || item.category || '',
    categoryId: item.category_id || item.categoryId || '',
    subCategory: item.sub_category_name || item.subCategory || '',
    subCategoryId: item.sub_category_id || item.subCategoryId || '',
    manufacturer: item.manufacturer_name || item.manufacturer || '',
    manufacturerId: item.manufacturer_id || item.manufacturerId || '',
    supplier: item.supplier_name || item.supplier || '',
    supplierId: item.supplier_id || item.supplierId || '',
    unit: item.unit_name || item.unit || '',
    unitId: item.unit_id || item.unitId || '',
    unitQty: item.unit_qty ?? item.unitQty ?? '',
    stock: item.stock ?? '',
    minLevelQty: item.reorder_level ?? item.minLevelQty ?? '',
    location: item.location_name || item.location || '',
    locationId: item.location_id || item.locationId || '',
    itemSpecification: item.item_specification || item.itemSpecification || '',
    purchasePrice: item.purchase_price ?? item.purchasePrice ?? '',
    salePrice: item.sale_price ?? item.salePrice ?? '',
    primaryBarcode: item.primary_barcode || item.primaryBarcode || '',
    secondaryBarcode: item.secondary_barcode || item.secondaryBarcode || '',
    expirable: normalizeBoolean(item.is_expirable, false) ? 'yes' : 'no',
    expiryDays: item.expiry_days ?? item.expiryDays ?? '',
    costItem: normalizeBoolean(item.is_cost_item, false) ? 'yes' : 'no',
    stopSale: normalizeBoolean(item.stop_sale, false) ? 'yes' : 'no',
    imageName: String(imagePath || '').split('/').filter(Boolean).pop() || '',
    imagePreview: resolveAssetUrl(imagePath),
    status: item.status || 'active',
    updatedAt: item.updated_at || item.updatedAt || '',
    raw: item,
  };
}

function toItemDefinitionFormData(values) {
  const formData = new FormData();

  const textEntries = {
    item_code: values.item_code,
    primary_barcode: values.primary_barcode,
    secondary_barcode: values.secondary_barcode,
    item_type_id: values.item_type_id,
    category_id: values.category_id,
    sub_category_id: values.sub_category_id,
    manufacturer_id: values.manufacturer_id,
    supplier_id: values.supplier_id,
    item_name: values.item_name,
    unit_id: values.unit_id,
    unit_qty: values.unit_qty,
    reorder_level: values.reorder_level,
    location_id: values.location_id,
    item_specification: values.item_specification,
    purchase_price: values.purchase_price,
    sale_price: values.sale_price,
    is_expirable: values.is_expirable,
    expiry_days: values.expiry_days,
    is_cost_item: values.is_cost_item,
    stop_sale: values.stop_sale,
    status: values.status,
  };

  Object.entries(textEntries).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    formData.append(key, value);
  });

  if (values.image instanceof File) {
    formData.append('image', values.image);
  } else if (values.image !== undefined && values.image !== null) {
    formData.append('image', values.image);
  }

  return formData;
}

export const itemDefinitionService = {
  async list(params = {}) {
    const response = await axiosInstance.get('/item-definitions', {
      params,
    });

    return {
      ...response,
      data: extractRows(response).map(normalizeItemDefinition),
    };
  },

  async getById(id) {
    const response = await axiosInstance.get(`/item-definitions/${id}`);
    return {
      ...response,
      data: normalizeItemDefinition(response?.data || {}),
    };
  },

  async create(values) {
    return axiosInstance.post('/item-definitions', toItemDefinitionFormData(values), {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  async update(id, values) {
    return axiosInstance.put(`/item-definitions/${id}`, toItemDefinitionFormData(values), {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  async remove(id) {
    return axiosInstance.delete(`/item-definitions/${id}`);
  },

  async print(id) {
    const response = await axiosInstance.get(`/item-definitions/${id}/print`);
    return {
      ...response,
      data: normalizeItemDefinition(response?.data || response),
    };
  },

  async printBarcode(id) {
    const response = await axiosInstance.get(`/item-definitions/${id}/print-barcode`);
    const payload = response?.data?.data || response?.data || {};

    return {
      ...response,
      data: {
        id: id || payload?.id || payload?._id || crypto.randomUUID(),
        itemName: payload?.item_name || payload?.itemName || '',
        salePrice: payload?.sale_price ?? payload?.salePrice ?? '',
        primaryBarcode: payload?.barcode || payload?.primary_barcode || payload?.primaryBarcode || '',
        secondaryBarcode: payload?.secondary_barcode || payload?.secondaryBarcode || '',
        companyName: payload?.company_name || payload?.companyName || '',
        raw: payload,
      },
    };
  },
};
