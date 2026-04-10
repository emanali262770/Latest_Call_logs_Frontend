import axiosInstance from '@/src/lib/axiosInstance';

function resolveAssetUrl(value) {
  const assetPath = String(value || '').trim();
  if (!assetPath) return '';

  if (/^https?:\/\//i.test(assetPath)) {
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

function normalizeCompany(payload) {
  const item = payload?.data || payload?.company || payload || {};

  return {
    id: item.id || item._id || 'company-profile',
    company_name: item.company_name || '',
    address: item.address || '',
    phone: item.phone || '',
    website: item.website || '',
    email: item.email || '',
    representative: item.representative || '',
    department: item.department || '',
    designation: item.designation || '',
    mobile_no: item.mobile_no || '',
    ntn: item.ntn || '',
    strn: item.strn || '',
    year_of_establishment: item.year_of_establishment ? String(item.year_of_establishment).slice(0, 10) : '',
    logo_url: resolveAssetUrl(item.company_logo || item.logo || item.logo_url || ''),
    ntn_document_url: resolveAssetUrl(item.ntn_document || item.ntn_document_url || ''),
    strn_document_url: resolveAssetUrl(item.strn_document || item.strn_document_url || ''),
    raw: item,
  };
}

function toCompanyFormData(values) {
  const formData = new FormData();

  const textEntries = {
    company_name: values.company_name,
    phone: values.phone,
    email: values.email,
    website: values.website,
    address: values.address,
    representative: values.representative,
    department: values.department,
    designation: values.designation,
    mobile_no: values.mobile_no,
    ntn: values.ntn,
    strn: values.strn,
    year_of_establishment: values.year_of_establishment,
    remove_ntn_document: values.remove_ntn_document ? '1' : '',
    remove_strn_document: values.remove_strn_document ? '1' : '',
  };

  Object.entries(textEntries).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    formData.append(key, value);
  });

  if (values.company_logo instanceof File) {
    formData.append('company_logo', values.company_logo);
  }

  if (values.ntn_document instanceof File) {
    formData.append('ntn_document', values.ntn_document);
  }

  if (values.strn_document instanceof File) {
    formData.append('strn_document', values.strn_document);
  }

  return formData;
}

export const companyService = {
  async get() {
    const response = await axiosInstance.get('/company');
    return {
      ...response,
      data: normalizeCompany(response?.data),
    };
  },

  async update(values) {
    return axiosInstance.put('/company', toCompanyFormData(values), {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  async print() {
    const response = await axiosInstance.get('/company/print');
    return {
      ...response,
      data: normalizeCompany(response?.data),
    };
  },
};
