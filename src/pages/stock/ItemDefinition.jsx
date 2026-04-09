import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Printer,
  X,
  Save,
  Package,
  TriangleAlert,
  ChevronDown,
  ArrowLeft,
  ImagePlus,
  Search as SearchIcon,
} from 'lucide-react';
import Barcode from 'react-barcode';
import { QRCodeSVG } from 'qrcode.react';
import { Card, Button, Badge } from '@/src/components/ui/Card';
import TableLoader from '@/src/components/ui/TableLoader';
import TablePagination from '@/src/components/ui/TablePagination';
import ConfirmDialog from '@/src/components/ui/ConfirmDialog';
import ThemeToastViewport from '@/src/components/ui/ThemeToastViewport';
import { useThemeToast } from '@/src/hooks/useThemeToast';
import axiosInstance from '@/src/lib/axiosInstance';
import { hasPermission } from '@/src/lib/auth';
import { required, validateForm } from '@/src/lib/validation';
import { itemDefinitionService } from '@/src/services/itemDefinition.service';

const NOTIFICATION_REFRESH_EVENT = 'low-stock-notifications:refresh';

const EMPTY_FORM = {
  code: '',
  itemName: '',
  itemType: '',
  category: '',
  subCategory: '',
  manufacturer: '',
  supplier: '',
  unit: '',
  unitQty: '',
  minLevelQty: '',
  location: '',
  purchasePrice: '',
  salePrice: '',
  primaryBarcode: '',
  secondaryBarcode: '',
  expirable: 'no',
  expiryDays: '',
  costItem: 'no',
  stopSale: 'no',
  imageName: '',
  imagePreview: '',
  imageFile: null,
  imageRemoved: false,
  status: 'active',
};

const FORM_RULES = {
  itemName: [(value) => required(value, 'Item name')],
  itemType: [(value) => required(value, 'Item type')],
  category: [(value) => required(value, 'Category')],
  unit: [(value) => required(value, 'Unit')],
  minLevelQty: [(value) => required(value, 'Min level qty')],
  expiryDays: [
    (value, values) => (String(values?.expirable || '').toLowerCase() === 'yes' ? required(value, 'Expiry days') : ''),
  ],
};

function generateCode(items) {
  const maxCode = items.reduce((best, item) => {
    const numeric = Number.parseInt(String(item.code || '').replace(/\D/g, ''), 10);
    return Number.isNaN(numeric) ? best : Math.max(best, numeric);
  }, 0);

  return `item-${String(maxCode + 1).padStart(4, '0')}`;
}

function generateBarcodeSeed() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

function buildPrimaryBarcode(itemCode, seed = generateBarcodeSeed()) {
  const normalizedCode = String(itemCode || '').trim();
  if (!normalizedCode) return '';
  const numericPart = normalizedCode.replace(/[^\d]/g, '');
  return `${seed}${numericPart}`;
}

function extractApiRows(payload, keys = []) {
  for (const key of keys) {
    if (Array.isArray(payload?.[key])) return payload[key];
    if (Array.isArray(payload?.data?.[key])) return payload.data[key];
  }

  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  if (Array.isArray(payload?.data?.rows)) return payload.data.rows;
  if (Array.isArray(payload?.data?.items)) return payload.data.items;
  if (Array.isArray(payload?.rows)) return payload.rows;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
}

function mapSetupItems(items, nameKeys = [], extra = () => ({})) {
  return items
    .map((item) => {
      const resolvedName = nameKeys.map((key) => item?.[key]).find(Boolean) || item?.name || '';

      return {
        id: item?.id || item?._id || item?.uuid || crypto.randomUUID(),
        name: String(resolvedName || '').trim(),
        status: item?.status || 'active',
        ...extra(item),
      };
    })
    .filter((item) => item.name);
}

function isBlobUrl(value) {
  return /^blob:/i.test(String(value || '').trim());
}

function getPrintableBarcode(item) {
  return String(item?.secondaryBarcode || item?.primaryBarcode || '').trim();
}

function getPublicProductUrl(barcode) {
  const normalizedBarcode = String(barcode || '').trim();
  if (!normalizedBarcode) return '';

  const configuredBaseUrl = String(
    import.meta.env.VITE_PUBLIC_PRODUCT_BASE_URL || import.meta.env.VITE_PUBLIC_APP_URL || '',
  ).trim();
  const fallbackBaseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const baseUrl = configuredBaseUrl || fallbackBaseUrl;

  if (!baseUrl) return `/product/${encodeURIComponent(normalizedBarcode)}`;

  try {
    return new URL(`/product/${encodeURIComponent(normalizedBarcode)}`, baseUrl).toString();
  } catch {
    return `${String(baseUrl).replace(/\/+$/, '')}/product/${encodeURIComponent(normalizedBarcode)}`;
  }
}

function formatPrintPrice(value) {
  const normalized = String(value ?? '').trim();
  return normalized ? `Rs ${normalized}` : 'Price not set';
}

function getPrintableText(value, fallback = '-') {
  const normalized = String(value ?? '').trim();
  return normalized || fallback;
}

const THERMAL_PAPER_WIDTH_MM = 72;
const THERMAL_LABEL_PADDING_MM = 3;
const MM_TO_PX = 96 / 25.4;
const THERMAL_LABEL_WIDTH_PX = Math.round(THERMAL_PAPER_WIDTH_MM * MM_TO_PX);

function FieldLabel({ children, required: isRequired = false }) {
  return (
    <label className="ml-0.5 text-[11px] font-bold uppercase tracking-[0.14em] text-gray-500">
      {children}
      {isRequired ? <span className="ml-1 text-rose-500">*</span> : null}
    </label>
  );
}

function SearchableSelect({
  selectId,
  label,
  required: isRequired = false,
  value,
  options,
  placeholder,
  searchablePlaceholder,
  onChange,
  error,
  isOpen,
  onToggle,
  onClose,
}) {
  const [query, setQuery] = useState('');
  const containerRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      return undefined;
    }

    const handleClickOutside = (event) => {
      if (!containerRef.current?.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const filteredOptions = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return options;
    return options.filter((option) => option.toLowerCase().includes(normalized));
  }, [options, query]);

  return (
    <div className={`space-y-2 ${isOpen ? 'relative z-40' : 'relative z-0'}`} ref={containerRef}>
      <FieldLabel required={isRequired}>{label}</FieldLabel>

      <div className="relative">
        <button
          type="button"
          onClick={() => onToggle(selectId)}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          className={`mt-[2px] flex h-10 w-full items-center justify-between rounded-xl border bg-white px-3.5 text-left text-sm text-gray-900 outline-none transition-all focus:border-brand focus:ring-4 focus:ring-brand/10 ${
            error ? 'border-rose-400' : 'border-gray-200'
          }`}
        >
          <span className={value ? 'text-gray-900' : 'text-gray-400'}>{value || placeholder}</span>
          <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen ? (
          <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl shadow-gray-200/60">
            <div className="border-b border-gray-100 p-3">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={searchablePlaceholder}
                  className="h-10 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 text-sm text-gray-900 outline-none transition-all focus:border-brand focus:ring-4 focus:ring-brand/10"
                />
              </div>
            </div>

            <div className="max-h-56 overflow-y-auto p-2">
              {filteredOptions.length ? (
                filteredOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => {
                      onChange(option);
                      onClose();
                    }}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition-all ${
                      option === value
                        ? 'bg-brand-light text-brand'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <span className="font-medium">{option}</span>
                    {option === value ? <span className="text-[10px] font-bold text-emerald-600">Selected</span> : null}
                  </button>
                ))
              ) : (
                <div className="px-3 py-4 text-sm text-gray-400">No matching records found.</div>
              )}
            </div>
          </div>
        ) : null}
      </div>

      {error ? <p className="ml-1 text-xs text-rose-600">{error}</p> : null}
    </div>
  );
}

export default function ItemDefinition() {
  const canCreate = hasPermission('INVENTORY.ITEM_DEFINITION.CREATE');
  const canEdit = hasPermission('INVENTORY.ITEM_DEFINITION.UPDATE');
  const canDelete = hasPermission('INVENTORY.ITEM_DEFINITION.DELETE');

  const [items, setItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [listError, setListError] = useState('');
  const [formMode, setFormMode] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [setupError, setSetupError] = useState('');
  const [setupOptions, setSetupOptions] = useState({
    itemTypes: [],
    categories: [],
    subCategories: [],
    manufacturers: [],
    suppliers: [],
    units: [],
    locations: [],
  });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [printItem, setPrintItem] = useState(null);
  const [openSelectId, setOpenSelectId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const fileInputRef = useRef(null);
  const secondaryBarcodeInputRef = useRef(null);
  const printTemplateRef = useRef(null);
  const { toasts, toast, removeToast } = useThemeToast();

  const loadSetupOptions = useCallback(async () => {
    setSetupError('');

    try {
      const [
        itemTypesResponse,
        categoriesResponse,
        subCategoriesResponse,
        manufacturersResponse,
        suppliersResponse,
        unitsResponse,
        locationsResponse,
      ] = await Promise.all([
        axiosInstance.get('/item-types', { params: { status: 'active' } }),
        axiosInstance.get('/categories', { params: { status: 'active' } }),
        axiosInstance.get('/sub-categories', { params: { status: 'active' } }),
        axiosInstance.get('/manufacturers', { params: { status: 'active' } }),
        axiosInstance.get('/suppliers', { params: { status: 'active' } }),
        axiosInstance.get('/units', { params: { status: 'active' } }),
        axiosInstance.get('/locations', { params: { status: 'active' } }),
      ]);

      setSetupOptions({
        itemTypes: mapSetupItems(extractApiRows(itemTypesResponse, ['itemTypes', 'item_types']), ['item_type_name']),
        categories: mapSetupItems(extractApiRows(categoriesResponse, ['categories']), ['category_name']),
        subCategories: mapSetupItems(
          extractApiRows(subCategoriesResponse, ['subCategories', 'sub_categories']),
          ['sub_category_name'],
          (item) => ({
            categoryId: item?.category_id || '',
            categoryName: item?.category_name || '',
          }),
        ),
        manufacturers: mapSetupItems(extractApiRows(manufacturersResponse, ['manufacturers']), ['manufacturer_name']),
        suppliers: mapSetupItems(extractApiRows(suppliersResponse, ['suppliers']), ['supplier_name', 'name']),
        units: mapSetupItems(extractApiRows(unitsResponse, ['units']), ['unit_name']),
        locations: mapSetupItems(extractApiRows(locationsResponse, ['locations']), ['location_name']),
      });
    } catch (requestError) {
      setSetupError(requestError.message || 'Failed to load item setup options.');
    }
  }, []);

  useEffect(() => {
    loadSetupOptions();
  }, [loadSetupOptions]);

  const loadItems = useCallback(async (query = '') => {
    setIsLoading(true);
    setListError('');

    try {
      const response = await itemDefinitionService.list({ search: query });
      setItems(Array.isArray(response?.data) ? response.data : []);
    } catch (requestError) {
      setListError(requestError.message || 'Failed to load item definitions.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      loadItems(searchQuery.trim());
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [searchQuery, loadItems]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const showForm = formMode !== null;

  const itemTypeOptions = useMemo(() => setupOptions.itemTypes.map((item) => item.name), [setupOptions.itemTypes]);
  const categoryOptions = useMemo(() => setupOptions.categories.map((item) => item.name), [setupOptions.categories]);
  const manufacturerOptions = useMemo(() => setupOptions.manufacturers.map((item) => item.name), [setupOptions.manufacturers]);
  const supplierOptions = useMemo(() => setupOptions.suppliers.map((item) => item.name), [setupOptions.suppliers]);
  const unitOptions = useMemo(() => setupOptions.units.map((item) => item.name), [setupOptions.units]);
  const locationOptions = useMemo(() => setupOptions.locations.map((item) => item.name), [setupOptions.locations]);
  const itemTypeByName = useMemo(
    () => new Map(setupOptions.itemTypes.map((item) => [item.name, item])),
    [setupOptions.itemTypes],
  );
  const categoryByName = useMemo(
    () => new Map(setupOptions.categories.map((item) => [item.name, item])),
    [setupOptions.categories],
  );
  const manufacturerByName = useMemo(
    () => new Map(setupOptions.manufacturers.map((item) => [item.name, item])),
    [setupOptions.manufacturers],
  );
  const supplierByName = useMemo(
    () => new Map(setupOptions.suppliers.map((item) => [item.name, item])),
    [setupOptions.suppliers],
  );
  const unitByName = useMemo(
    () => new Map(setupOptions.units.map((item) => [item.name, item])),
    [setupOptions.units],
  );
  const locationByName = useMemo(
    () => new Map(setupOptions.locations.map((item) => [item.name, item])),
    [setupOptions.locations],
  );

  const selectedCategory = useMemo(
    () => setupOptions.categories.find((item) => item.name === formData.category) || null,
    [formData.category, setupOptions.categories],
  );

  const subCategoryOptions = useMemo(() => {
    return setupOptions.subCategories
      .filter((item) => {
        if (!selectedCategory) return true;
        return item.categoryId === selectedCategory.id || item.categoryName === selectedCategory.name;
      })
      .map((item) => String(item?.name || '').trim())
      .filter(Boolean);
  }, [selectedCategory, setupOptions.subCategories]);
  const subCategoryByName = useMemo(
    () => new Map(setupOptions.subCategories.map((item) => [item.name, item])),
    [setupOptions.subCategories],
  );

  const paginatedItems = useMemo(
    () => items.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [currentPage, items, pageSize],
  );

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const handleOpenCreate = () => {
    const nextCode = generateCode(items);
    setFormMode('create');
    setEditingItem(null);
    setFormData({
      ...EMPTY_FORM,
      code: nextCode,
      primaryBarcode: buildPrimaryBarcode(nextCode),
    });
    setFormErrors({});
    setApiError('');
    setOpenSelectId(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleOpenEdit = (item) => {
    const nextCode = item?.code || '';
    setFormMode('edit');
    setEditingItem(item);
    setFormData({
      ...EMPTY_FORM,
      ...item,
      code: nextCode,
      primaryBarcode: item?.primaryBarcode || buildPrimaryBarcode(nextCode),
      secondaryBarcode: item?.secondaryBarcode || '',
      expirable: String(item?.expirable || 'no').toLowerCase() === 'yes' ? 'yes' : 'no',
      expiryDays: item?.expiryDays || '',
      imageFile: null,
      imageRemoved: false,
    });
    setFormErrors({});
    setApiError('');
    setOpenSelectId(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const closeForm = () => {
    if (isBlobUrl(formData.imagePreview)) {
      URL.revokeObjectURL(formData.imagePreview);
    }
    setFormMode(null);
    setEditingItem(null);
    setFormData(EMPTY_FORM);
    setFormErrors({});
    setApiError('');
    setOpenSelectId(null);
  };

  const updateField = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]:
        field === 'secondaryBarcode'
          ? String(value || '').replace(/\s+/g, '')
          : field === 'expiryDays'
            ? String(value || '').replace(/[^\d]/g, '')
            : value,
      ...(field === 'expirable' && String(value || '').toLowerCase() !== 'yes' ? { expiryDays: '' } : {}),
    }));
    setFormErrors((prev) => ({
      ...prev,
      [field]: '',
      ...(field === 'expirable' && String(value || '').toLowerCase() !== 'yes' ? { expiryDays: '' } : {}),
    }));
  };

  const validateSalePrice = () => {
    const purchasePrice = Number(formData.purchasePrice || 0);
    const salePrice = Number(formData.salePrice || 0);

    setFormErrors((prev) => {
      const nextErrors = { ...prev };

      if (formData.purchasePrice && formData.salePrice && salePrice <= purchasePrice) {
        nextErrors.salePrice = 'Sale price must be greater than purchase price.';
      } else {
        delete nextErrors.salePrice;
      }

      return nextErrors;
    });
  };

  useEffect(() => {
    if (!formMode || formData.secondaryBarcode || formData.primaryBarcode) return;

    setFormData((prev) => ({
      ...prev,
      primaryBarcode: buildPrimaryBarcode(prev.code),
    }));
  }, [formData.code, formData.primaryBarcode, formData.secondaryBarcode, formMode]);

  useEffect(() => {
    if (!showForm) return undefined;

    const focusTimer = window.setTimeout(() => {
      secondaryBarcodeInputRef.current?.focus();
      secondaryBarcodeInputRef.current?.select();
    }, 0);

    return () => window.clearTimeout(focusTimer);
  }, [showForm, editingItem?.id]);

  useEffect(() => {
    if (!formData.subCategory) return;
    if (subCategoryOptions.includes(formData.subCategory)) return;

    setFormData((prev) => ({
      ...prev,
      subCategory: '',
    }));
  }, [formData.subCategory, subCategoryOptions]);

  const inputClassName = (field) =>
    `mt-[2px] h-10 w-full rounded-xl border bg-white px-3.5 text-sm text-gray-900 focus:border-brand focus:ring-4 focus:ring-brand/10 transition-all outline-none ${
      formErrors[field] ? 'border-rose-400' : 'border-gray-200'
    }`;

  const handleImageUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (isBlobUrl(formData.imagePreview)) {
      URL.revokeObjectURL(formData.imagePreview);
    }

    const preview = URL.createObjectURL(file);
    setFormData((prev) => ({
      ...prev,
      imageName: file.name,
      imagePreview: preview,
      imageFile: file,
      imageRemoved: false,
    }));
  };

  const handleRemoveImage = () => {
    if (isBlobUrl(formData.imagePreview)) {
      URL.revokeObjectURL(formData.imagePreview);
    }

    setFormData((prev) => ({
      ...prev,
      imageName: '',
      imagePreview: '',
      imageFile: null,
      imageRemoved: true,
    }));

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handlePrintItem = useCallback(
    async (item) => {
      const itemId = item._id || item.id;
      if (!itemId) {
        toast.error('Print failed', 'Item ID is missing.');
        return;
      }
      try {
        const res = await axiosInstance.get(`/item-definitions/${itemId}`);
        const d = res.data?.data || res.data;
        setPrintItem({
          itemName: d.item_name,
          code: d.item_code,
          category: d.category_name,
          location: d.location_name,
          salePrice: d.sale_price,
          purchasePrice: d.purchase_price,
          primaryBarcode: d.primary_barcode,
          secondaryBarcode: d.secondary_barcode,
        });
      } catch {
        toast.error('Fetch failed', 'Unable to load item details for printing.');
        return;
      }

      await new Promise((resolve) => {
        window.requestAnimationFrame(() => {
          window.requestAnimationFrame(resolve);
        });
      });

      {
          const printMarkup = printTemplateRef.current?.innerHTML;
          const printLabelElement = printTemplateRef.current?.querySelector('.thermal-label');

          if (!printMarkup || !printLabelElement) {
            toast.error('Print unavailable', 'Unable to prepare the print label right now.');
            return;
          }

          const labelWidthMm = THERMAL_PAPER_WIDTH_MM;
          const labelHeightPx = Math.max(
            Math.ceil(printLabelElement.getBoundingClientRect().height || 0),
            printLabelElement.scrollHeight || 0,
            printLabelElement.offsetHeight || 0,
            120,
          );
          const labelHeightMm = Math.max(
            40,
            Math.ceil((labelHeightPx * 25.4) / 96) + 2,
          );

          // Use hidden iframe for silent printing (no new window)
          let printFrame = document.getElementById('thermal-print-frame');
          if (printFrame) printFrame.remove();
          printFrame = document.createElement('iframe');
          printFrame.id = 'thermal-print-frame';
          printFrame.style.cssText = 'position:fixed;top:-10000px;left:-10000px;width:0;height:0;border:none;';
          document.body.appendChild(printFrame);

          const frameDoc = printFrame.contentDocument || printFrame.contentWindow.document;
          frameDoc.open();
          frameDoc.write(`
            <!doctype html>
            <html>
              <head>
                <meta charset="utf-8" />
                <title>Print Item Label</title>
                <style>
                  * { box-sizing: border-box; margin: 0; padding: 0; }
                  @page { size: ${labelWidthMm}mm ${labelHeightMm}mm; margin: 0; }
                  html, body {
                    margin: 0;
                    padding: 0;
                    background: #ffffff;
                    color: #000000;
                    font-family: "Courier New", Courier, monospace;
                    width: ${labelWidthMm}mm;
                    min-width: ${labelWidthMm}mm;
                    max-width: ${labelWidthMm}mm;
                    height: ${labelHeightMm}mm;
                    overflow: hidden;
                  }
                  body {
                    display: block;
                    padding: 0;
                  }
                  .thermal-label {
                    display: block;
                    width: ${labelWidthMm}mm;
                    max-width: ${labelWidthMm}mm;
                    padding: ${THERMAL_LABEL_PADDING_MM}mm;
                    overflow: hidden;
                    page-break-after: avoid;
                    break-after: avoid-page;
                  }
                  .thermal-label__brand { margin: 0; font-size: 16px; font-weight: 700; text-align: center; letter-spacing: 0.04em; text-transform: uppercase; }
                  .thermal-label__caption { margin: 2px 0 0; font-size: 10px; text-align: center; letter-spacing: 0.12em; text-transform: uppercase; }
                  .thermal-label__divider { margin: 8px 0; border-top: 1px solid #111111; }
                  .thermal-label__section { margin-top: 6px; }
                  .thermal-label__row { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; margin-top: 4px; font-size: 11px; line-height: 1.45; }
                  .thermal-label__row:first-child { margin-top: 0; }
                  .thermal-label__key { flex: 0 0 38%; }
                  .thermal-label__value { flex: 1; text-align: right; font-weight: 700; word-break: break-word; }
                  .thermal-label__item-name { margin: 0; font-size: 15px; line-height: 1.3; font-weight: 700; text-align: left; text-transform: uppercase; }
                  .thermal-label__price-row { display: flex; align-items: flex-end; justify-content: space-between; gap: 8px; margin-top: 6px; font-size: 13px; font-weight: 700; }
                  .thermal-label__price-label { text-transform: uppercase; letter-spacing: 0.08em; }
                  .thermal-label__price { font-size: 18px; line-height: 1; }
                  .thermal-label__barcode { margin-top: 10px; text-align: center; }
                  .thermal-label__barcode-value { margin-top: 5px; font-size: 11px; letter-spacing: 0.08em; word-break: break-all; }
                  .thermal-label__empty { margin-top: 8px; font-size: 11px; text-align: center; }
                  .thermal-label__footer { margin-top: 10px; font-size: 11px; line-height: 1.5; text-align: center; }
                  svg { max-width: 100%; height: auto; }
                </style>
              </head>
              <body>${printMarkup}</body>
            </html>
          `);
          frameDoc.close();

          window.setTimeout(() => {
            printFrame.contentWindow.focus();
            printFrame.contentWindow.print();
            window.setTimeout(() => printFrame.remove(), 1000);
          }, 300);
      }
    },
    [toast],
  );

  const handleSave = async () => {
    const errors = validateForm(formData, FORM_RULES);
    const trimmedPrimaryBarcode = String(formData.primaryBarcode || '').trim();
    const trimmedSecondaryBarcode = String(formData.secondaryBarcode || '').trim();
    const purchasePrice = Number(formData.purchasePrice || 0);
    const salePrice = Number(formData.salePrice || 0);
    const selectedItemTypeOption = itemTypeByName.get(formData.itemType);
    const selectedCategoryOption = categoryByName.get(formData.category);
    const selectedSubCategoryOption = subCategoryByName.get(formData.subCategory);
    const selectedManufacturerOption = manufacturerByName.get(formData.manufacturer);
    const selectedSupplierOption = supplierByName.get(formData.supplier);
    const selectedUnitOption = unitByName.get(formData.unit);
    const selectedLocationOption = locationByName.get(formData.location);

    if (!trimmedPrimaryBarcode && !trimmedSecondaryBarcode) {
      errors.secondaryBarcode = 'Enter at least one barcode.';
    }

    if (formData.purchasePrice && formData.salePrice && salePrice <= purchasePrice) {
      errors.salePrice = 'Sale price must be greater than purchase price.';
    }

    if (!selectedItemTypeOption) errors.itemType = 'Item type is required.';
    if (!selectedCategoryOption) errors.category = 'Category is required.';
    if (!selectedUnitOption) errors.unit = 'Unit is required.';
    if (formData.subCategory && !selectedSubCategoryOption) errors.subCategory = 'Select a valid subcategory.';
    if (formData.manufacturer && !selectedManufacturerOption) errors.manufacturer = 'Select a valid manufacturer.';
    if (formData.supplier && !selectedSupplierOption) errors.supplier = 'Select a valid supplier.';
    if (formData.location && !selectedLocationOption) errors.location = 'Select a valid location.';

    if (Object.keys(errors).length) {
      setFormErrors(errors);
      setApiError('Please complete all required fields before saving the item.');
      return;
    }

    const payload = {
      item_code: String(formData.code || '').trim(),
      primary_barcode: trimmedPrimaryBarcode,
      secondary_barcode: trimmedSecondaryBarcode,
      item_type_id: selectedItemTypeOption.id,
      category_id: selectedCategoryOption.id,
      sub_category_id: selectedSubCategoryOption?.id || '',
      manufacturer_id: selectedManufacturerOption?.id || '',
      supplier_id: selectedSupplierOption?.id || '',
      item_name: String(formData.itemName || '').trim(),
      unit_id: selectedUnitOption.id,
      unit_qty: String(formData.unitQty || '').trim(),
      reorder_level: String(formData.minLevelQty || '').trim(),
      location_id: selectedLocationOption?.id || '',
      purchase_price: String(formData.purchasePrice || '').trim(),
      sale_price: String(formData.salePrice || '').trim(),
      is_expirable: formData.expirable === 'yes' ? 'true' : 'false',
      expiry_days: formData.expirable === 'yes' ? String(formData.expiryDays || '').trim() : '',
      is_cost_item: formData.costItem === 'yes' ? 'true' : 'false',
      stop_sale: formData.stopSale === 'yes' ? 'true' : 'false',
      status: formData.status,
      image: formData.imageFile,
    };

    if (editingItem && formData.imageRemoved && !formData.imageFile) {
      payload.image = '';
    }

    setIsSaving(true);
    setApiError('');

    try {
      if (editingItem) {
        const response = await itemDefinitionService.update(editingItem.id, payload);
        toast.success('Item updated', response?.message || 'Item definition updated successfully.');
      } else {
        const response = await itemDefinitionService.create(payload);
        toast.success('Item created', response?.message || 'Item definition added successfully.');
      }

      window.dispatchEvent(new Event(NOTIFICATION_REFRESH_EVENT));
      closeForm();
      await loadItems(searchQuery.trim());
    } catch (requestError) {
      setApiError(requestError.message || 'Unable to save item definition.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsSaving(true);

    try {
      const response = await itemDefinitionService.remove(deleteTarget.id);
      toast.success('Item deleted', response?.message || 'Item definition removed successfully.');
      setDeleteTarget(null);
      window.dispatchEvent(new Event(NOTIFICATION_REFRESH_EVENT));
      await loadItems(searchQuery.trim());
    } catch (requestError) {
      toast.error('Delete failed', requestError.message || 'Unable to delete item definition.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div className="space-y-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Item Definition</h1>
            <p className="mt-1 text-gray-500">Manage stock item definitions with searchable setup-style forms.</p>
          </div>
          {!showForm && canCreate ? (
            <Button
              onClick={handleOpenCreate}
              icon={<Plus className="h-4 w-4" />}
              className="bg-brand shadow-brand/20 hover:bg-brand-hover"
            >
              Add Item
            </Button>
          ) : null}
        </div>

        {!showForm ? (
        <Card className="border-none p-0 shadow-xl shadow-gray-200/50">
          <div className="flex flex-col gap-4 border-b border-gray-50 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative w-full sm:w-96">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search item definition..."
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="w-full rounded-2xl border border-gray-100 bg-gray-50/50 py-3 pl-11 pr-4 text-sm placeholder:text-gray-400 transition-all focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10"
                />
              </div>
              <p className="text-sm font-medium text-gray-400">
                <span className="font-bold text-gray-900">{items.length}</span> Records
              </p>
            </div>

            {listError ? (
              <div className="mx-6 mb-6 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                {listError}
              </div>
            ) : null}

            <div className="w-full overflow-hidden rounded-4xl border border-gray-100 bg-white/80 backdrop-blur-xl">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[980px] border-separate border-spacing-0 text-left">
                  <thead>
                    <tr className="bg-linear-to-r from-gray-50/80 via-gray-50/40 to-transparent">
                      <th className="border-b border-gray-100/60 px-6 py-6 text-[10px] font-black uppercase tracking-[0.25em] text-gray-400 first:rounded-tl-4xl">
                        Item Code
                      </th>
                      <th className="border-b border-gray-100/60 px-6 py-6 text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">
                        Item
                      </th>
                      <th className="border-b border-gray-100/60 px-6 py-6 text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">
                        Type
                      </th>
                      <th className="border-b border-gray-100/60 px-6 py-6 text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">
                        Category
                      </th>
                      <th className="border-b border-gray-100/60 px-6 py-6 text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">
                        Stock
                      </th>
                      <th className="border-b border-gray-100/60 px-6 py-6 text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">
                        Sale Price
                      </th>
                      <th className="border-b border-gray-100/60 px-6 py-6 text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">
                        Status
                      </th>
                      <th className="border-b border-gray-100/60 px-6 py-6 text-right text-[10px] font-black uppercase tracking-[0.25em] text-gray-400 last:rounded-tr-4xl">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50/50">
                    {isLoading ? (
                      <tr>
                        <td colSpan={8} className="px-8 py-6 text-center">
                          <TableLoader label="Loading item definitions..."/>
                        </td>
                      </tr>
                    ) : items.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-8 py-20 text-center text-sm font-medium text-gray-400">
                          No item definitions found.
                        </td>
                      </tr>
                    ) : (
                      paginatedItems.map((item) => (
                        <tr key={item.id} className="group transition-all duration-300 hover:bg-brand-light/40">
                          <td className="border-b border-gray-50/30 px-6 py-6 text-sm font-bold text-gray-500 whitespace-nowrap">
                            <span className="font-mono">{item.code}</span>
                          </td>
                          <td className="border-b border-gray-50/30 px-6 py-6 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl  bg-brand-light text-brand">
                                {item.imagePreview ? (
                                  <img src={item.imagePreview} alt={item.itemName || 'Item'} className="h-full w-full object-cover" />
                                ) : (
                                  <Package className="h-4 w-4" />
                                )}
                              </div>
                              <p className="font-semibold text-gray-900">{item.itemName}</p>
                            </div>
                          </td>
                          <td className="border-b border-gray-50/30 px-6 py-6 text-sm font-semibold text-gray-700 whitespace-nowrap">{item.itemType || '-'}</td>
                          <td className="border-b border-gray-50/30 px-6 py-6 text-sm font-semibold text-gray-700 whitespace-nowrap">{item.category || '-'}</td>
                          <td className="border-b border-gray-50/30 px-6 py-6 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-gray-700">{item.stock != null ? item.stock : '-'}</span>
                              {Number(item.stock || 0) < Number(item.minLevelQty || 0) && Number(item.minLevelQty || 0) > 0 ? (
                                <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-amber-700">
                                  <TriangleAlert className="h-3.5 w-3.5" />
                                  Low
                                </span>
                              ) : null}
                            </div>
                          </td>
                          <td className="border-b border-gray-50/30 px-6 py-6 text-sm font-semibold text-gray-700 whitespace-nowrap">{item.salePrice || '-'}</td>
                          <td className="border-b border-gray-50/30 px-6 py-6 whitespace-nowrap">
                            <Badge variant={item.status === 'active' ? 'green' : 'gray'}>{item.status}</Badge>
                          </td>
                          <td className="border-b border-gray-50/30 px-6 py-6 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => handlePrintItem(item)}
                                className="flex h-10 w-10 items-center justify-center rounded-2xl text-gray-400 transition-all duration-300 hover:bg-white hover:text-emerald-600 hover:shadow-xl hover:shadow-emerald-100/60 active:scale-95"
                                title="Print"
                              >
                                <Printer className="h-4.5 w-4.5" />
                              </button>
                              {canEdit && (
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(item)}
                                className="flex h-10 w-10 items-center justify-center rounded-2xl text-gray-400 transition-all duration-300 hover:bg-white hover:text-brand hover:shadow-xl hover:shadow-brand/20 active:scale-95"
                                title="Edit"
                              >
                                <Edit2 className="h-4.5 w-4.5" />
                              </button>
                              )}
                              {canDelete && (
                              <button
                                type="button"
                                onClick={() => setDeleteTarget(item)}
                                disabled={isSaving}
                                className="flex h-10 w-10 items-center justify-center rounded-2xl text-gray-400 transition-all duration-300 hover:bg-white hover:text-rose-600 hover:shadow-xl hover:shadow-rose-100/50 active:scale-95"
                                title="Delete"
                              >
                                <Trash2 className="h-4.5 w-4.5" />
                              </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            {items.length > 10 ? (
              <div className="px-6 pb-6">
                <TablePagination
                  currentPage={currentPage}
                  pageSize={pageSize}
                  totalItems={items.length}
                  onPageChange={setCurrentPage}
                  onPageSizeChange={(size) => {
                    setPageSize(size);
                    setCurrentPage(1);
                  }}
                  itemLabel="records"
                />
              </div>
            ) : null}
          </Card>
        ) : (
          <div className="max-w-5xl">
            <div className="overflow-hidden rounded-[1.75rem] border border-gray-200 bg-white shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
              <div className="border-b border-gray-200 bg-gray-50/70 px-8 py-6">
                <div className="flex items-start justify-between gap-6">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-gray-200 bg-white text-brand shadow-sm">
                      <Package className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-gray-400">Item Form</p>
                   
                      <p className="mt-1 text-sm text-gray-500">
                        {formMode === 'edit'
                          ? 'Update stock item metadata and pricing details.'
                          : 'Create a structured stock item record for your catalog.'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={closeForm}
                    className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-xs font-bold uppercase tracking-[0.16em] text-gray-500 transition-all hover:border-brand/20 hover:bg-brand-light/30 hover:text-brand"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Back
                  </button>
                </div>
              </div>

              <div className="space-y-8 px-8 py-8">
                {apiError ? (
                  <div className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                    {apiError}
                  </div>
                ) : null}

                {setupError ? (
                  <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
                    {setupError}
                  </div>
                ) : null}

                <section className="rounded-[1.5rem] border border-gray-200 bg-white">
                  <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-gray-700">ITEM Setup</h3>
                      <p className="mt-1 text-xs text-gray-400">Item code, barcode generation, and alternate barcode entry.</p>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50 text-brand">
                      <Package className="h-4 w-4" />
                    </div>
                  </div>

                  <div className="space-y-5 p-6">
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                      <div className="space-y-2">
                        <label className="ml-0.5 text-[11px] font-bold uppercase tracking-[0.14em] text-gray-500">Item Code</label>
                        <input
                          type="text"
                          value={formData.code}
                          readOnly
                          disabled
                          className="mt-[2px] h-10 w-full cursor-not-allowed rounded-xl border border-gray-200 bg-gray-50 px-3.5 font-mono text-sm text-gray-500 outline-none"
                        />
                      </div>

                      <div className="flex items-end rounded-xl border border-dashed border-gray-200 bg-gray-50/50 px-4 py-3">
                        <p className="text-xs leading-6 text-gray-400">If the item already has a barcode, enter it in the secondary barcode field.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        <div className="space-y-2">
                          <FieldLabel>Primary Barcode</FieldLabel>
                          <div className="mt-[2px] flex h-10 w-full items-center justify-between overflow-hidden rounded-xl border border-gray-200 bg-gray-50 px-3.5">
                            <span className="shrink-0 font-mono text-sm text-gray-500">{formData.primaryBarcode || '—'}</span>
                            {formData.primaryBarcode && (
                              <div className="ml-3 shrink-0">
                                <Barcode
                                  value={formData.primaryBarcode}
                                  height={22}
                                  fontSize={0}
                                  margin={0}
                                  displayValue={false}
                                  background="transparent"
                                  lineColor="#111827"
                                  width={1}
                                />
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-gray-400">Auto-generated using 4 random digits joined with the item code number.</p>
                        </div>

                      <div className="space-y-2">
                        <FieldLabel>Secondary Barcode</FieldLabel>
                        <div className={`mt-[2px] flex h-10 w-full items-center justify-between overflow-hidden rounded-xl border px-3.5 ${formData.secondaryBarcode ? 'border-gray-200 bg-gray-50' : 'border-gray-200 bg-white'}`}>
                          <input
                            ref={secondaryBarcodeInputRef}
                            type="text"
                            value={formData.secondaryBarcode}
                            onChange={(event) => updateField('secondaryBarcode', event.target.value)}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter') {
                                event.preventDefault();
                              }
                            }}
                            placeholder="Enter secondary barcode"
                            className="h-full w-full bg-transparent font-mono text-sm text-gray-700 outline-none placeholder:text-gray-400"
                            autoComplete="off"
                          />
                          {formData.secondaryBarcode && (
                            <div className="ml-3 shrink-0">
                              <Barcode
                                value={formData.secondaryBarcode}
                                height={22}
                                fontSize={0}
                                margin={0}
                                displayValue={false}
                                background="transparent"
                                lineColor="#111827"
                                width={1}
                              />
                            </div>
                          )}
                        </div>
                        {formErrors.secondaryBarcode ? <p className="ml-1 text-xs text-rose-600">{formErrors.secondaryBarcode}</p> : null}
                      </div>
                    </div>

                  
                  </div>
                </section>

                <section className="rounded-[1.5rem] border border-gray-200 bg-white">
                  <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-gray-700">Classification</h3>
                      <p className="mt-1 text-xs text-gray-400">Type, category, subcategory, manufacturer, and supplier.</p>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50 text-brand">
                      <Package className="h-4 w-4" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-5 p-6 md:grid-cols-2">
                    <SearchableSelect
                      selectId="itemType"
                      label="Item Type"
                      required
                      value={formData.itemType}
                      options={itemTypeOptions}
                      placeholder="Select item type"
                      searchablePlaceholder="Search item types..."
                      onChange={(value) => updateField('itemType', value)}
                      error={formErrors.itemType}
                      isOpen={openSelectId === 'itemType'}
                      onToggle={(id) => setOpenSelectId((current) => (current === id ? null : id))}
                      onClose={() => setOpenSelectId(null)}
                    />
                    <div />

                    <SearchableSelect
                      selectId="category"
                      label="Category"
                      required
                      value={formData.category}
                      options={categoryOptions}
                      placeholder="Select category"
                      searchablePlaceholder="Search categories..."
                      onChange={(value) => {
                        updateField('category', value);
                        updateField('subCategory', '');
                      }}
                      error={formErrors.category}
                      isOpen={openSelectId === 'category'}
                      onToggle={(id) => setOpenSelectId((current) => (current === id ? null : id))}
                      onClose={() => setOpenSelectId(null)}
                    />
                    <SearchableSelect
                      selectId="subCategory"
                      label="Subcategory"
                      value={formData.subCategory}
                      options={subCategoryOptions}
                      placeholder="Select subcategory"
                      searchablePlaceholder="Search subcategories..."
                      onChange={(value) => updateField('subCategory', value)}
                      error={formErrors.subCategory}
                      isOpen={openSelectId === 'subCategory'}
                      onToggle={(id) => setOpenSelectId((current) => (current === id ? null : id))}
                      onClose={() => setOpenSelectId(null)}
                    />

                    <SearchableSelect
                      selectId="manufacturer"
                      label="Manufacturer"
                      value={formData.manufacturer}
                      options={manufacturerOptions}
                      placeholder="Select manufacturer"
                      searchablePlaceholder="Search manufacturers..."
                      onChange={(value) => updateField('manufacturer', value)}
                      error={formErrors.manufacturer}
                      isOpen={openSelectId === 'manufacturer'}
                      onToggle={(id) => setOpenSelectId((current) => (current === id ? null : id))}
                      onClose={() => setOpenSelectId(null)}
                    />
                    <SearchableSelect
                      selectId="supplier"
                      label="Supplier"
                      value={formData.supplier}
                      options={supplierOptions}
                      placeholder="Select supplier"
                      searchablePlaceholder="Search suppliers..."
                      onChange={(value) => updateField('supplier', value)}
                      error={formErrors.supplier}
                      isOpen={openSelectId === 'supplier'}
                      onToggle={(id) => setOpenSelectId((current) => (current === id ? null : id))}
                      onClose={() => setOpenSelectId(null)}
                    />
                  </div>
                </section>

                <section className="rounded-[1.5rem] border border-gray-200 bg-white">
                  <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-gray-700">Item Details</h3>
                      <p className="mt-1 text-xs text-gray-400">Name, unit, unit quantity, reorder level, and location.</p>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50 text-brand">
                      <Package className="h-4 w-4" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-5 p-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <FieldLabel required>Item Name</FieldLabel>
                      <input
                        type="text"
                        value={formData.itemName}
                        onChange={(event) => updateField('itemName', event.target.value)}
                        placeholder="Enter item name"
                        className={inputClassName('itemName')}
                      />
                      {formErrors.itemName ? <p className="ml-1 text-xs text-rose-600">{formErrors.itemName}</p> : null}
                    </div>
                    <div />

                    <SearchableSelect
                      selectId="unit"
                      label="Unit"
                      required
                      value={formData.unit}
                      options={unitOptions}
                      placeholder="Select unit"
                      searchablePlaceholder="Search units..."
                      onChange={(value) => updateField('unit', value)}
                      error={formErrors.unit}
                      isOpen={openSelectId === 'unit'}
                      onToggle={(id) => setOpenSelectId((current) => (current === id ? null : id))}
                      onClose={() => setOpenSelectId(null)}
                    />
                    <div className="space-y-2">
                      <FieldLabel>Unit Qty</FieldLabel>
                      <input
                        type="number"
                        value={formData.unitQty}
                        onChange={(event) => updateField('unitQty', event.target.value)}
                        placeholder="Enter unit qty"
                        className={inputClassName('unitQty')}
                      />
                    </div>

                    <div className="space-y-2">
                      <FieldLabel required>Reorder Level</FieldLabel>
                      <input
                        type="number"
                        value={formData.minLevelQty}
                        onChange={(event) => updateField('minLevelQty', event.target.value)}
                        placeholder="e.g. 10"
                        className={inputClassName('minLevelQty')}
                      />
                      {formErrors.minLevelQty ? <p className="ml-1 text-xs text-rose-600">{formErrors.minLevelQty}</p> : null}
                    </div>
                    <SearchableSelect
                      selectId="location"
                      label="Location"
                      value={formData.location}
                      options={locationOptions}
                      placeholder="Select location"
                      searchablePlaceholder="Search locations..."
                      onChange={(value) => updateField('location', value)}
                      error={formErrors.location}
                      isOpen={openSelectId === 'location'}
                      onToggle={(id) => setOpenSelectId((current) => (current === id ? null : id))}
                      onClose={() => setOpenSelectId(null)}
                    />
                  </div>
                </section>

                <section className="rounded-[1.5rem] border border-gray-200 bg-white">
                  <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-gray-700">Pricing</h3>
                      <p className="mt-1 text-xs text-gray-400">Purchase and sale pricing details.</p>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50 text-brand">
                      <Save className="h-4 w-4" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-5 p-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <FieldLabel>Purchase Price</FieldLabel>
                      <input
                        type="number"
                        value={formData.purchasePrice}
                        onChange={(event) => updateField('purchasePrice', event.target.value)}
                        placeholder="e.g. 125"
                        className={inputClassName('purchasePrice')}
                      />
                    </div>
                    <div className="space-y-2">
                      <FieldLabel>Sale Price</FieldLabel>
                      <input
                        type="number"
                        value={formData.salePrice}
                        onChange={(event) => updateField('salePrice', event.target.value)}
                        onBlur={validateSalePrice}
                        placeholder="e.g. 150"
                        className={inputClassName('salePrice')}
                      />
                      {formErrors.salePrice ? <p className="ml-1 text-xs text-rose-600">{formErrors.salePrice}</p> : null}
                    </div>

                  </div>
                </section>

                <section className="rounded-[1.5rem] border border-gray-200 bg-white">
                  <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-gray-700">Options</h3>
                      <p className="mt-1 text-xs text-gray-400">Expiry behavior and sales-related item flags.</p>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50 text-brand">
                      <Save className="h-4 w-4" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-5 p-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <FieldLabel>Expirable</FieldLabel>
                      <button
                        type="button"
                        onClick={() => updateField('expirable', formData.expirable === 'yes' ? 'no' : 'yes')}
                        className={`group/toggle mt-[2px] flex h-12 w-full items-center justify-between rounded-2xl border px-4 transition-all duration-300 ${formData.expirable === 'yes' ? 'border-brand/20 bg-brand-light/40 shadow-sm shadow-brand/5' : 'border-gray-200 bg-gray-50/50 hover:border-gray-300 hover:bg-gray-50'}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`flex h-7 w-7 items-center justify-center rounded-lg transition-all duration-300 ${formData.expirable === 'yes' ? 'bg-brand/10 text-brand' : 'bg-gray-100 text-gray-400'}`}>
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d={formData.expirable === 'yes' ? 'M5 13l4 4L19 7' : 'M6 18L18 6M6 6l12 12'} /></svg>
                          </div>
                          <span className={`text-sm font-semibold transition-colors duration-300 ${formData.expirable === 'yes' ? 'text-brand' : 'text-gray-500'}`}>{formData.expirable === 'yes' ? 'Yes' : 'No'}</span>
                        </div>
                        <div className={`relative h-6 w-11 rounded-full transition-all duration-300 ${formData.expirable === 'yes' ? 'bg-brand shadow-inner shadow-brand/20' : 'bg-gray-300'}`}>
                          <div className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-md transition-all duration-300 ${formData.expirable === 'yes' ? 'translate-x-5' : 'translate-x-0.5'}`} />
                        </div>
                      </button>
                    </div>

                    {formData.expirable === 'yes' ? (
                      <div className="space-y-2">
                        <FieldLabel required>Expiry Days</FieldLabel>
                        <div className="relative">
                          <input
                            type="text"
                            value={formData.expiryDays}
                            onChange={(event) => updateField('expiryDays', event.target.value)}
                            placeholder="Enter days"
                            className={inputClassName('expiryDays')}
                          />
                          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold uppercase tracking-[0.12em] text-gray-400">
                            Days
                          </span>
                        </div>
                        {formErrors.expiryDays ? <p className="ml-1 text-xs text-rose-600">{formErrors.expiryDays}</p> : null}
                      </div>
                    ) : null}

                    <div className="space-y-2">
                      <FieldLabel>Cost Item</FieldLabel>
                      <button
                        type="button"
                        onClick={() => updateField('costItem', formData.costItem === 'yes' ? 'no' : 'yes')}
                        className={`group/toggle mt-[2px] flex h-12 w-full items-center justify-between rounded-2xl border px-4 transition-all duration-300 ${formData.costItem === 'yes' ? 'border-brand/20 bg-brand-light/40 shadow-sm shadow-brand/5' : 'border-gray-200 bg-gray-50/50 hover:border-gray-300 hover:bg-gray-50'}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`flex h-7 w-7 items-center justify-center rounded-lg transition-all duration-300 ${formData.costItem === 'yes' ? 'bg-brand/10 text-brand' : 'bg-gray-100 text-gray-400'}`}>
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d={formData.costItem === 'yes' ? 'M5 13l4 4L19 7' : 'M6 18L18 6M6 6l12 12'} /></svg>
                          </div>
                          <span className={`text-sm font-semibold transition-colors duration-300 ${formData.costItem === 'yes' ? 'text-brand' : 'text-gray-500'}`}>{formData.costItem === 'yes' ? 'Yes' : 'No'}</span>
                        </div>
                        <div className={`relative h-6 w-11 rounded-full transition-all duration-300 ${formData.costItem === 'yes' ? 'bg-brand shadow-inner shadow-brand/20' : 'bg-gray-300'}`}>
                          <div className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-md transition-all duration-300 ${formData.costItem === 'yes' ? 'translate-x-5' : 'translate-x-0.5'}`} />
                        </div>
                      </button>
                    </div>

                    <div className="space-y-2">
                      <FieldLabel>Stop Sale</FieldLabel>
                      <button
                        type="button"
                        onClick={() => updateField('stopSale', formData.stopSale === 'yes' ? 'no' : 'yes')}
                        className={`group/toggle mt-[2px] flex h-12 w-full items-center justify-between rounded-2xl border px-4 transition-all duration-300 ${formData.stopSale === 'yes' ? 'border-rose-200 bg-rose-50/50 shadow-sm shadow-rose-100/30' : 'border-gray-200 bg-gray-50/50 hover:border-gray-300 hover:bg-gray-50'}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`flex h-7 w-7 items-center justify-center rounded-lg transition-all duration-300 ${formData.stopSale === 'yes' ? 'bg-rose-100 text-rose-600' : 'bg-gray-100 text-gray-400'}`}>
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d={formData.stopSale === 'yes' ? 'M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636' : 'M5 13l4 4L19 7'} /></svg>
                          </div>
                          <span className={`text-sm font-semibold transition-colors duration-300 ${formData.stopSale === 'yes' ? 'text-rose-600' : 'text-gray-500'}`}>{formData.stopSale === 'yes' ? 'Yes' : 'No'}</span>
                        </div>
                        <div className={`relative h-6 w-11 rounded-full transition-all duration-300 ${formData.stopSale === 'yes' ? 'bg-rose-500 shadow-inner shadow-rose-600/20' : 'bg-gray-300'}`}>
                          <div className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-md transition-all duration-300 ${formData.stopSale === 'yes' ? 'translate-x-5' : 'translate-x-0.5'}`} />
                        </div>
                      </button>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <FieldLabel>Item Image</FieldLabel>
                      <div className="flex flex-col gap-4 rounded-2xl border border-dashed border-gray-300 bg-gray-50/70 p-4 md:flex-row md:items-center">
                        <div
                          onClick={() => fileInputRef.current?.click()}
                          className="relative flex h-24 w-24 shrink-0 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-gray-300 bg-white transition-all hover:border-brand/40 hover:bg-brand-light/20"
                        >
                          {formData.imagePreview ? (
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                handleRemoveImage();
                              }}
                              className="absolute left-1.5 top-1.5 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-white/95 text-gray-500 shadow-md transition-all hover:bg-rose-50 hover:text-rose-600"
                              aria-label="Remove image"
                              title="Remove image"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          ) : null}
                          {formData.imagePreview ? (
                            <img src={formData.imagePreview} alt="Preview" className="h-full w-full object-cover" />
                          ) : (
                            <>
                              <ImagePlus className="mb-1 h-5 w-5 text-gray-300" />
                              <span className="text-[10px] font-bold text-gray-400">Upload</span>
                            </>
                          )}
                        </div>
                        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                        <div className="space-y-1.5">
                          <p className="text-sm font-semibold text-gray-700">Upload a supporting product image</p>
                          <p className="text-xs leading-6 text-gray-500">
                            Recommended for faster recognition in stock records. Accepted formats: PNG and JPG, up to 2MB.
                          </p>
                          <p className="text-xs text-gray-400">
                            {formData.imageName || 'No image selected'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-gray-50/70 px-6 py-4">
                  <p className="text-xs leading-6 text-gray-500">
                    Review required fields before saving. Compact layout is designed for faster data entry and better readability.
                  </p>
                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={closeForm}
                      disabled={isSaving}
                      className="rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-600 transition-all hover:bg-gray-50 hover:text-gray-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={isSaving}
                      className="flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand/20 transition-all hover:bg-brand-hover"
                    >
                      <Save className="h-4.5 w-4.5" />
                      {isSaving ? 'Saving...' : formMode === 'edit' ? 'Update Item' : 'Save Item'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Item Definition"
        description={deleteTarget ? `Are you sure you want to delete ${deleteTarget.itemName || 'this item'}?` : ''}
        confirmLabel="Delete"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        isLoading={isSaving}
      />

      <div className="pointer-events-none fixed left-[-9999px] top-0 opacity-0" aria-hidden="true">
        <div ref={printTemplateRef}>
          {printItem ? (
            <div className="thermal-label bg-white text-black" style={{ width: `${THERMAL_LABEL_WIDTH_PX}px`, padding: `${THERMAL_LABEL_PADDING_MM}mm` }}>
              <p className="thermal-label__brand">Item Definition</p>
              <p className="thermal-label__caption">Stock Print</p>

              <div className="thermal-label__divider" />

              <div className="thermal-label__section">
                <p className="thermal-label__item-name">{getPrintableText(printItem.itemName, 'Unnamed Item')}</p>
              </div>

              <div className="thermal-label__divider" />

              <div className="thermal-label__section">
                <div className="thermal-label__row">
                  <span className="thermal-label__key">Code</span>
                  <span className="thermal-label__value">{getPrintableText(printItem.code)}</span>
                </div>
                <div className="thermal-label__row">
                  <span className="thermal-label__key">Category</span>
                  <span className="thermal-label__value">{getPrintableText(printItem.category)}</span>
                </div>
                <div className="thermal-label__row">
                  <span className="thermal-label__key">Location</span>
                  <span className="thermal-label__value">{getPrintableText(printItem.location)}</span>
                </div>
              </div>

              <div className="thermal-label__divider" />

              <div className="thermal-label__price-row">
                <span className="thermal-label__price-label">Price</span>
                <span className="thermal-label__price">{formatPrintPrice(printItem.salePrice)}</span>
              </div>

              <div className="thermal-label__divider" />

              {getPrintableBarcode(printItem) ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', gap: '12px' }}>
                  <div style={{ textAlign: 'center' }}>
                    <Barcode
                      value={getPrintableBarcode(printItem)}
                      format="CODE128"
                      height={48}
                      margin={0}
                      fontSize={0}
                      displayValue={false}
                      background="transparent"
                      lineColor="#000000"
                      width={1.1}
                    />
                    <p className="thermal-label__barcode-value">{getPrintableBarcode(printItem)}</p>
                  </div>
                  <div style={{ textAlign: 'center', flexShrink: 0 }}>
                    <QRCodeSVG
                      value={getPublicProductUrl(getPrintableBarcode(printItem))}
                      size={65}
                      level="M"
                      bgColor="transparent"
                      fgColor="#000000"
                    />
                  </div>
                </div>
              ) : (
                <div className="thermal-label__empty">No barcode available</div>
              )}

              <div className="thermal-label__divider" />

              <p className="thermal-label__footer">
                Printed from stock item definition
                <br />
                Thank you
              </p>
            </div>
          ) : null}
        </div>
      </div>

      <ThemeToastViewport toasts={toasts} onClose={removeToast} />
    </>
  );
}
