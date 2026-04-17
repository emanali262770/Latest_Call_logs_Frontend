import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Package, Plus, Save, ChevronDown, Search as SearchIcon, ReceiptText, ArrowLeft, Edit2, Trash2 } from 'lucide-react';
import { Card, Button } from '@/src/components/ui/Card';
import ConfirmDialog from '@/src/components/ui/ConfirmDialog';
import TableLoader from '@/src/components/ui/TableLoader';
import TablePagination from '@/src/components/ui/TablePagination';
import ThemeToastViewport from '@/src/components/ui/ThemeToastViewport';
import { useThemeToast } from '@/src/hooks/useThemeToast';
import { hasPermission } from '@/src/lib/auth';
import { itemRateService } from '@/src/services/itemRate.service';
import { Search } from 'lucide-react';

const EMPTY_FORM = {
  date: new Date().toISOString().slice(0, 10),
  supplier: '',
  quotationId: '',
  category: '',
  subCategory: '',
  manufacturer: '',
  item: '',
  itemSpecification: '',
  resellerPriceUsd: '',
  exchangeRate: '',
  resellerPrice: '',
  iTaxChecked: false,
  iTaxPercentage: '',
  iTaxAmount: '',
  othersChecked: false,
  othersPercentage: '',
  othersAmount: '',
  profitChecked: false,
  profitPercentage: '',
  profitAmount: '',
  salePrice: '',
  salesTax17: '',
  salePriceWithTax: '',
};

function sanitizeNumericInput(value) {
  const normalized = String(value || '').replace(/[^\d.]/g, '');
  const firstDotIndex = normalized.indexOf('.');
  if (firstDotIndex === -1) return normalized;
  return `${normalized.slice(0, firstDotIndex + 1)}${normalized.slice(firstDotIndex + 1).replace(/\./g, '')}`;
}

function formatCellValue(value) {
  return String(value ?? '').trim() || '-';
}

function FieldLabel({ children }) {
  return <label className="ml-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-600">{children}</label>;
}

const INPUT_CLASS_NAME =
  'h-9 w-full rounded-xl border border-slate-300/80 bg-white px-4 text-sm text-slate-900 shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)] transition-all focus:border-slate-500 focus:outline-none focus:ring-4 focus:ring-slate-200/70';

const READ_ONLY_INPUT_CLASS_NAME =
  'h-9 w-full cursor-not-allowed rounded-xl border border-slate-300/80 bg-slate-100 px-4 text-sm text-slate-500 shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)] outline-none';

const SECTION_PANEL_CLASS_NAME = 'rounded-[1.4rem] border border-slate-300/80 bg-slate-50/50 ';
const USD_TO_PKR_RATE_URL = import.meta.env.VITE_USD_TO_PKR_RATE_API;

function ReadOnlyField({ label, value, placeholder }) {
  return (
    <div className="space-y-2">
      <FieldLabel>{label}</FieldLabel>
      <input type="text" value={value || ''} readOnly disabled placeholder={placeholder} className={READ_ONLY_INPUT_CLASS_NAME} />
    </div>
  );
}

function SearchableSelect({ selectId, label, value, options, placeholder, searchablePlaceholder, onChange, isOpen, onToggle, onClose }) {
  const [query, setQuery] = useState('');
  const containerRef = useRef(null);
  const shouldWrapValue = String(value || '').trim().length > 28;

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleClickOutside = (event) => {
      if (!containerRef.current?.contains(event.target)) onClose();
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!isOpen || !normalizedQuery) return options;
    return options.filter((option) => option.toLowerCase().includes(normalizedQuery));
  }, [isOpen, options, query]);

  return (
    <div className={`space-y-2 ${isOpen ? 'relative z-40' : 'relative z-0'}`} ref={containerRef}>
      <FieldLabel>{label}</FieldLabel>
      <div className="relative">
        <button
          type="button"
          onClick={() => onToggle(selectId)}
          className={`mt-[2px] flex ${INPUT_CLASS_NAME} ${shouldWrapValue ? 'h-auto min-h-9 py-2' : 'items-center'} justify-between text-left outline-none`}
        >
          <span className={`pr-3 ${shouldWrapValue ? 'leading-5 whitespace-normal break-words' : 'truncate'} ${value ? 'text-gray-900' : 'text-gray-400'}`}>{value || placeholder}</span>
          <ChevronDown className={`h-4 w-4 shrink-0 self-center text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
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
                  className="h-10 w-full rounded-xl border border-slate-300/80 bg-white pl-10 pr-4 text-sm text-slate-900 outline-none transition-all focus:border-slate-500 focus:ring-4 focus:ring-slate-200/70"
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
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition-all ${option === value ? 'bg-brand-light text-brand' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
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
    </div>
  );
}

function TaxRow({ idPrefix, label, checked, percentage, amount, onToggle, onPercentageChange }) {
  return (
    <div className="grid grid-cols-[minmax(110px,auto)_88px_110px] items-center gap-3">
      <label className="flex items-center gap-3 text-sm font-semibold text-slate-700">
        <input type="checkbox" checked={checked} onChange={(event) => onToggle(event.target.checked)} className="h-4 w-4 rounded border-slate-300 text-slate-700 focus:ring-slate-300" />
        <span>{label}</span>
      </label>
      <input id={`${idPrefix}-percentage`} type="text" value={percentage} onChange={(event) => onPercentageChange(sanitizeNumericInput(event.target.value))} placeholder="%" className="h-8 w-20 rounded-xl border border-slate-300/80 bg-white px-3 text-sm text-slate-900 transition-all focus:border-slate-500 focus:outline-none focus:ring-4 focus:ring-slate-200/70" />
      <input type="text" value={amount} readOnly placeholder="Amount" className="h-8 rounded-xl border border-slate-300/80 bg-white px-3 text-sm text-slate-900 transition-all focus:border-slate-500 focus:outline-none focus:ring-4 focus:ring-slate-200/70" />
    </div>
  );
}

export default function ItemRate() {
  const canCreate = hasPermission('INVENTORY.ITEM_RATE.CREATE');
  const canEdit = hasPermission('INVENTORY.ITEM_RATE.UPDATE');
  const canDelete = hasPermission('INVENTORY.ITEM_RATE.DELETE');
  const hasRowActions = canEdit || canDelete;
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [setupOptions, setSetupOptions] = useState({ categories: [], subCategories: [], manufacturers: [], suppliers: [], items: [] });
  const [rows, setRows] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [openSelectId, setOpenSelectId] = useState(null);
  const [isLoadingSetup, setIsLoadingSetup] = useState(true);
  const [setupError, setSetupError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isExchangeRateLoading, setIsExchangeRateLoading] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [lastEditedPriceField, setLastEditedPriceField] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const { toasts, toast, removeToast } = useThemeToast();

  const findByName = useCallback((collection, name) => collection.find((item) => item.name === name) || null, []);

  const loadSetupOptions = useCallback(async () => {
    setIsLoadingSetup(true);
    setSetupError('');
    try {
      const [lookupsResponse, ratesResponse] = await Promise.all([
        itemRateService.lookups(),
        itemRateService.list(),
      ]);
      setSetupOptions(lookupsResponse.data);
      setRows(ratesResponse.data);
    } catch (requestError) {
      setSetupError(requestError.message || 'Failed to load item rate setup options.');
    } finally {
      setIsLoadingSetup(false);
    }
  }, []);

  useEffect(() => {
    loadSetupOptions();
  }, [loadSetupOptions]);

  const supplierOptions = useMemo(() => setupOptions.suppliers.map((item) => item.name), [setupOptions.suppliers]);
  const itemOptions = useMemo(() => setupOptions.items.map((item) => item.name), [setupOptions.items]);
  const selectedCategory = useMemo(() => findByName(setupOptions.categories, formData.category), [findByName, formData.category, setupOptions.categories]);
  const selectedSupplier = useMemo(() => findByName(setupOptions.suppliers, formData.supplier), [findByName, formData.supplier, setupOptions.suppliers]);
  const selectedSubCategory = useMemo(() => findByName(setupOptions.subCategories, formData.subCategory), [findByName, formData.subCategory, setupOptions.subCategories]);
  const selectedManufacturer = useMemo(() => findByName(setupOptions.manufacturers, formData.manufacturer), [findByName, formData.manufacturer, setupOptions.manufacturers]);
  const selectedItem = useMemo(() => findByName(setupOptions.items, formData.item), [findByName, formData.item, setupOptions.items]);
  const shouldExpandItemField = String(formData.item || '').trim().length > 28;
  const isEditing = Boolean(editingItem);
  const filteredRows = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    if (!normalizedQuery) return rows;

    return rows.filter((row) =>
      `${row.category} ${row.subCategory} ${row.item} ${row.reseller} ${row.sale}`.toLowerCase().includes(normalizedQuery),
    );
  }, [rows, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const tableColumnCount = hasRowActions ? 8 : 7;
  const paginatedRows = useMemo(
    () => filteredRows.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [filteredRows, currentPage, pageSize],
  );

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  useEffect(() => {
    if (!showForm) return undefined;
    let isActive = true;

    const loadUsdToPkrRate = async () => {
      setIsExchangeRateLoading(true);
      try {
        const response = await fetch(USD_TO_PKR_RATE_URL);
        const data = await response.json();

        if (!isActive) return;

        if (data?.result === 'success' && data?.conversion_rate) {
          setFormData((prev) => ({ ...prev, exchangeRate: String(data.conversion_rate) }));
        } else {
          toast.error('Exchange rate failed', data?.['error-type'] || 'Unable to fetch USD to PKR exchange rate.');
        }
      } catch (requestError) {
        if (isActive) toast.error('Exchange rate failed', requestError.message || 'Unable to fetch USD to PKR exchange rate.');
      } finally {
        if (isActive) setIsExchangeRateLoading(false);
      }
    };

    loadUsdToPkrRate();

    return () => {
      isActive = false;
    };
  }, [showForm, toast]);

  useEffect(() => {
    const usdPrice = Number(formData.resellerPriceUsd || 0);
    const exchangeRate = Number(formData.exchangeRate || 0);
    const pkrPrice = Number(formData.resellerPrice || 0);
    if (!exchangeRate) return;

    if (lastEditedPriceField === 'usd' && !formData.resellerPriceUsd) {
      setFormData((prev) => (prev.resellerPrice ? { ...prev, resellerPrice: '' } : prev));
      return;
    }

    if (lastEditedPriceField === 'usd' && usdPrice) {
      const convertedPrice = (usdPrice * exchangeRate).toFixed(2);
      setFormData((prev) => (prev.resellerPrice === convertedPrice ? prev : { ...prev, resellerPrice: convertedPrice }));
      return;
    }

    if (lastEditedPriceField === 'pkr' && !formData.resellerPrice) {
      setFormData((prev) => (prev.resellerPriceUsd ? { ...prev, resellerPriceUsd: '' } : prev));
      return;
    }

    if (lastEditedPriceField === 'pkr' && pkrPrice) {
      const convertedPrice = (pkrPrice / exchangeRate).toFixed(2);
      setFormData((prev) => (prev.resellerPriceUsd === convertedPrice ? prev : { ...prev, resellerPriceUsd: convertedPrice }));
    }
  }, [formData.exchangeRate, formData.resellerPrice, formData.resellerPriceUsd, lastEditedPriceField]);

  useEffect(() => {
    if (!selectedSupplier?.id || !selectedItem?.id) return undefined;
    let isActive = true;
    setFormData((prev) => ({ ...prev, quotationId: '' }));

    itemRateService
      .getQuotationId(selectedSupplier.id, selectedItem.id)
      .then((response) => {
        if (isActive) {
          setFormData((prev) => ({ ...prev, quotationId: response.data || '' }));
        }
      })
      .catch(() => undefined);

    return () => {
      isActive = false;
    };
  }, [selectedItem?.id, selectedSupplier?.id]);

  useEffect(() => {
    if (!selectedItem?.id) return undefined;
    let isActive = true;

    itemRateService
      .getItemDetails(selectedItem.id)
      .then((response) => {
        if (!isActive) return;
        const details = response.data || {};
        setFormData((prev) => ({
          ...prev,
          category: details.categoryName || prev.category,
          subCategory: details.subCategoryName || prev.subCategory,
          manufacturer: details.manufacturerName || prev.manufacturer,
          itemSpecification: details.specification || prev.itemSpecification || '',
          supplier: isEditing
            ? prev.supplier || details.defaultSupplierName || details.supplierName || ''
            : details.defaultSupplierName || details.supplierName || prev.supplier,
          salePrice: prev.salePrice || details.salePrice || '',
          salePriceWithTax: prev.salePriceWithTax || '',
        }));
      })
      .catch((requestError) => {
        if (isActive) toast.error('Item details failed', requestError.message || 'Unable to load selected item details.');
      });

    return () => {
      isActive = false;
    };
  }, [isEditing, selectedItem?.id, toast]);

  const calculatedTax = useMemo(() => {
    const resellerPrice = Number(formData.resellerPrice || 0);
    const usdResellerPrice = Number(formData.resellerPriceUsd || 0);
    const exchangeRate = Number(formData.exchangeRate || 0);
    const basePrice = resellerPrice || (usdResellerPrice && exchangeRate ? usdResellerPrice * exchangeRate : 0);
    const profitPercent = formData.profitChecked ? Number(formData.profitPercentage || 0) : 0;
    const iTaxPercent = formData.iTaxChecked ? Number(formData.iTaxPercentage || 0) : 0;
    const otherTaxPercent = formData.othersChecked ? Number(formData.othersPercentage || 0) : 0;
    const iTaxAmount = formData.iTaxChecked ? (basePrice * iTaxPercent) / 100 : 0;
    const otherTaxAmount = formData.othersChecked ? (basePrice * otherTaxPercent) / 100 : 0;
    const profitAmount = formData.profitChecked ? (basePrice * profitPercent) / 100 : 0;
    const salePrice = basePrice + iTaxAmount + otherTaxAmount + profitAmount;
    const salesTaxPercent = 18;
    const salesTaxAmount = (salePrice * salesTaxPercent) / 100;

    return {
      basePrice,
      profitAmount,
      salePrice,
      salesTaxAmount,
      iTaxAmount,
      otherTaxAmount,
      salePriceWithTax: salePrice + salesTaxAmount,
    };
  }, [
    formData.exchangeRate,
    formData.iTaxChecked,
    formData.iTaxPercentage,
    formData.othersChecked,
    formData.othersPercentage,
    formData.profitChecked,
    formData.profitPercentage,
    formData.resellerPrice,
    formData.resellerPriceUsd,
  ]);

  const updateField = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
      ...(field === 'category' ? { subCategory: '' } : {}),
      ...(field === 'item'
        ? {
            category: '',
            subCategory: '',
            manufacturer: '',
            itemSpecification: '',
            salePrice: '',
          }
        : {}),
      ...(['resellerPriceUsd', 'exchangeRate', 'resellerPrice', 'iTaxChecked', 'iTaxPercentage', 'iTaxAmount', 'othersChecked', 'othersPercentage', 'othersAmount', 'profitChecked', 'profitPercentage', 'profitAmount'].includes(field)
        ? { salePrice: '', salePriceWithTax: '', salesTax17: '' }
        : {}),
    }));
  };

  const updateTaxToggle = (field, value, focusId) => {
    updateField(field, value);
    if (value) {
      window.setTimeout(() => {
        document.getElementById(focusId)?.focus();
      }, 0);
    }
  };

  const updateUsdPrice = (value) => {
    const nextValue = sanitizeNumericInput(value);
    setLastEditedPriceField('usd');
    setFormData((prev) => ({
      ...prev,
      resellerPriceUsd: nextValue,
      resellerPrice: nextValue && prev.exchangeRate ? (Number(nextValue) * Number(prev.exchangeRate)).toFixed(2) : '',
      salePrice: '',
      salePriceWithTax: '',
      salesTax17: '',
    }));
  };

  const updatePkrPrice = (value) => {
    const nextValue = sanitizeNumericInput(value);
    setLastEditedPriceField('pkr');
    setFormData((prev) => ({
      ...prev,
      resellerPrice: nextValue,
      resellerPriceUsd: nextValue && prev.exchangeRate ? (Number(nextValue) / Number(prev.exchangeRate)).toFixed(2) : '',
      salePrice: '',
      salePriceWithTax: '',
      salesTax17: '',
    }));
  };

  const closeForm = () => {
    setShowForm(false);
    setOpenSelectId(null);
    setFormData(EMPTY_FORM);
    setEditingItem(null);
    setLastEditedPriceField(null);
  };

  const findNameById = (collection, id, fallback = '') => {
    if (!id) return fallback || '';
    return collection.find((item) => String(item.id) === String(id))?.name || fallback || '';
  };

  const openEditForm = (row) => {
    const raw = row.raw || {};
    const iTaxPercent = Number(raw.i_tax_percent ?? raw.iTaxPercent ?? 0);
    const otherTaxPercent = Number(raw.other_tax_percent ?? raw.otherTaxPercent ?? 0);
    const profitPercent = Number(raw.profit_percent ?? raw.profitPercent ?? 0);
    const resellerPriceUsd =
      raw.reseller_price_usd ??
      raw.resellerPriceUsd ??
      raw.reseller_price_us ??
      raw.resellerPriceUs ??
      '';
    const exchangeRate = raw.exchange_rate ?? raw.exchangeRate ?? '';
    const resellerPrice = raw.reseller_price ?? raw.resellerPrice ?? '';

    setEditingItem(row);
    setFormData({
      ...EMPTY_FORM,
      date: String(raw.rate_date || row.rateDate || EMPTY_FORM.date).slice(0, 10),
      supplier: findNameById(setupOptions.suppliers, raw.supplier_id || raw.supplierId, row.supplier),
      quotationId: raw.quotation_id || raw.quotationId || row.quotationId || '',
      category: findNameById(setupOptions.categories, raw.category_id || raw.categoryId, row.category),
      subCategory: findNameById(setupOptions.subCategories, raw.sub_category_id || raw.subCategoryId, row.subCategory),
      manufacturer: findNameById(setupOptions.manufacturers, raw.manufacturer_id || raw.manufacturerId, row.manufacturer),
      item: findNameById(setupOptions.items, raw.item_definition_id || raw.itemDefinitionId, row.item),
      itemSpecification: raw.item_specification || raw.itemSpecification || raw.specification || row.itemSpecification || '',
      resellerPriceUsd: Number(resellerPriceUsd) ? String(resellerPriceUsd) : '',
      exchangeRate: exchangeRate ? String(exchangeRate) : '',
      resellerPrice: resellerPrice ? String(resellerPrice) : '',
      iTaxChecked: iTaxPercent > 0,
      iTaxPercentage: iTaxPercent > 0 ? String(iTaxPercent) : '',
      othersChecked: otherTaxPercent > 0,
      othersPercentage: otherTaxPercent > 0 ? String(otherTaxPercent) : '',
      profitChecked: profitPercent > 0,
      profitPercentage: profitPercent > 0 ? String(profitPercent) : '',
    });
    setLastEditedPriceField(Number(resellerPriceUsd) ? 'usd' : 'pkr');
    setOpenSelectId(null);
    setShowForm(true);
  };

  const refreshRows = async () => {
    const ratesResponse = await itemRateService.list();
    setRows(ratesResponse.data);
  };

  const handleAddRow = async () => {
    if (!selectedSupplier?.id || !selectedCategory?.id || !selectedItem?.id || !calculatedTax.salePrice) {
      toast.error('Required fields missing', 'Please select supplier, category, item, and enter reseller price.');
      return;
    }
    if (formData.resellerPriceUsd && !formData.exchangeRate) {
      toast.error('Exchange rate required', 'Please wait until the USD to PKR exchange rate is fetched.');
      return;
    }
    setIsSaving(true);
    try {
      const payload = {
        rate_date: formData.date,
        supplier_id: selectedSupplier.id,
        quotation_id: String(formData.quotationId || '').trim(),
        category_id: selectedCategory.id,
        sub_category_id: selectedSubCategory?.id || '',
        manufacturer_id: selectedManufacturer?.id || '',
        item_definition_id: selectedItem.id,
        item_specification: String(formData.itemSpecification || '').trim(),
        currency: formData.resellerPriceUsd ? 'USD' : 'PKR',
        reseller_price: formData.resellerPrice ? Number(formData.resellerPrice) : undefined,
        reseller_price_usd: formData.resellerPriceUsd ? Number(formData.resellerPriceUsd) : undefined,
        exchange_rate: formData.exchangeRate ? Number(formData.exchangeRate) : undefined,
        sale_price: Number(calculatedTax.salePrice || 0),
        sales_tax_percent: 18,
        sales_tax_amount: Number(calculatedTax.salesTaxAmount || 0),
        i_tax_percent: formData.iTaxChecked ? Number(formData.iTaxPercentage || 0) : 0,
        i_tax_amount: formData.iTaxChecked ? Number(calculatedTax.iTaxAmount || 0) : 0,
        other_tax_percent: formData.othersChecked ? Number(formData.othersPercentage || 0) : 0,
        other_tax_amount: formData.othersChecked ? Number(calculatedTax.otherTaxAmount || 0) : undefined,
        profit_percent: formData.profitChecked ? Number(formData.profitPercentage || 0) : 0,
        profit_amount: formData.profitChecked ? Number(calculatedTax.profitAmount || 0) : undefined,
        status: 'active',
      };

      Object.keys(payload).forEach((key) => {
        if (payload[key] === undefined || payload[key] === '') delete payload[key];
      });

      if (editingItem?.id) {
        await itemRateService.update(editingItem.id, payload);
      } else {
        await itemRateService.create(payload);
      }
      await refreshRows();
      setCurrentPage(1);
      toast.success(editingItem ? 'Item rate updated' : 'Item rate saved', `Item rate has been ${editingItem ? 'updated' : 'saved'} successfully.`);
      closeForm();
    } catch (requestError) {
      toast.error('Save failed', requestError.message || 'Unable to save item rate.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteRow = async () => {
    if (!deleteTarget?.id) return;
    setIsSaving(true);
    try {
      await itemRateService.remove(deleteTarget.id);
      await refreshRows();
      setCurrentPage(1);
      toast.success('Item rate deleted', 'Item rate has been deleted successfully.');
      setDeleteTarget(null);
    } catch (requestError) {
      toast.error('Delete failed', requestError.message || 'Unable to delete item rate.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        {
          showForm ? null : (
             <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Item Rate</h1>
          <p className="mt-1 text-gray-500">Create the stock item rate form UI with the same look and table style as item definition.</p>
        </div>
          )
        }
       
        {
          !showForm && canCreate ? (
            <Button onClick={() => setShowForm(true)} icon={<Plus className="h-4 w-4" />} className="bg-brand hover:bg-brand-hover shadow-brand/20">
              Add Item Rate
            </Button>
          ) : null
        }
       
      </div>

      {!showForm ? (
      <Card className="border-none p-0 shadow-xl shadow-gray-200/50">
        <div className="px-6 pb-6 pt-5">
          <div className="mb-5 flex flex-col gap-4 border-b border-gray-50 pb-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search item rate..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="w-full rounded-2xl border border-gray-100 bg-gray-50/50 py-3 pl-11 pr-4 text-sm placeholder:text-gray-400 transition-all focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10"
              />
            </div>
            <p className="text-sm font-medium text-gray-400">
              <span className="font-bold text-gray-900">{filteredRows.length}</span> Records
            </p>
          </div>

          <div className="w-full overflow-hidden rounded-4xl border border-gray-100 bg-white/80 shadow-2xl shadow-gray-200/30 backdrop-blur-xl">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1120px] border-separate border-spacing-0 text-left">
                <thead>
                  <tr className="bg-linear-to-r from-gray-50/80 via-gray-50/40 to-transparent">
                    <th className="border-b border-gray-100/60 px-8 py-6 text-[10px] font-black uppercase tracking-[0.25em] text-gray-400 first:rounded-tl-4xl">Sr#</th>
                    <th className="border-b border-gray-100/60 px-8 py-6 text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">Item</th>
                    <th className="border-b border-gray-100/60 px-8 py-6 text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">Category</th>
                    <th className="border-b border-gray-100/60 px-8 py-6 text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">Sub Category</th>
                    <th className="border-b border-gray-100/60 px-8 py-6 text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">Supplier</th>
                    <th className="border-b border-gray-100/60 px-8 py-6 text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">Reseller</th>
                    <th className={`border-b border-gray-100/60 px-8 py-6 text-[10px] font-black uppercase tracking-[0.25em] text-gray-400 ${hasRowActions ? '' : 'last:rounded-tr-4xl'}`}>Sale</th>
                    {hasRowActions ? <th className="border-b border-gray-100/60 px-8 py-6 text-right text-[10px] font-black uppercase tracking-[0.25em] text-gray-400 last:rounded-tr-4xl">Actions</th> : null}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50/50">
                  {isLoadingSetup ? (
                    <tr>
                      <td colSpan={tableColumnCount} className="px-8 py-6 text-center">
                        <TableLoader label="Loading item rate form options..." />
                      </td>
                    </tr>
                  ) : filteredRows.length === 0 ? (
                    <tr>
                      <td colSpan={tableColumnCount} className="px-8 py-20 text-center text-sm font-medium text-gray-400">No item rate rows added yet.</td>
                    </tr>
                  ) : (
                    paginatedRows.map((row, index) => (
                      <tr key={row.id} className="group transition-all duration-300 hover:bg-brand-light/40">
                        <td className="border-b border-gray-50/30 px-8 py-6 text-sm font-semibold text-gray-500">{(currentPage - 1) * pageSize + index + 1}</td>
                        <td className="border-b border-gray-50/30 px-8 py-6">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center shrink-0 justify-center rounded-xl border border-brand/10 bg-brand-light text-brand">
                              <Package className="h-4 w-4" />
                            </div>
                            <span className="text-sm font-semibold text-gray-900">{formatCellValue(row.item)}</span>
                          </div>
                        </td>
                        <td className="border-b border-gray-50/30 px-8 py-6 text-sm font-semibold text-gray-700 whitespace-nowrap">{formatCellValue(row.category)}</td>
                        <td className="border-b border-gray-50/30 px-8 py-6 text-sm font-semibold text-gray-700 whitespace-nowrap">{formatCellValue(row.subCategory)}</td>
                        <td className="border-b border-gray-50/30 px-8 py-6 text-sm font-semibold text-gray-700 whitespace-nowrap">{formatCellValue(row.supplier)}</td>
                        <td className="border-b border-gray-50/30 px-8 py-6 text-sm font-semibold text-gray-700 whitespace-nowrap">{formatCellValue(row.reseller)}</td>
                        <td className="border-b border-gray-50/30 px-8 py-6 text-sm font-semibold text-gray-700 whitespace-nowrap">{formatCellValue(row.sale)}</td>
                        {hasRowActions ? (
                          <td className="border-b border-gray-50/30 px-8 py-6 text-right">
                            <div className="flex items-center justify-end gap-2 opacity-0 transition-opacity duration-300 group-hover:opacity-100 focus-within:opacity-100">
                              {canEdit ? (
                                <button
                                  type="button"
                                  onClick={() => openEditForm(row)}
                                  className="flex h-10 w-10 items-center justify-center rounded-2xl text-gray-400 transition-all duration-300 hover:bg-white hover:text-brand hover:shadow-xl hover:shadow-brand/20 active:scale-95"
                                  title="Edit"
                                >
                                  <Edit2 className="h-4.5 w-4.5" />
                                </button>
                              ) : null}
                              {canDelete ? (
                                <button
                                  type="button"
                                  onClick={() => setDeleteTarget(row)}
                                  disabled={isSaving}
                                  className="flex h-10 w-10 items-center justify-center rounded-2xl text-gray-400 transition-all duration-300 hover:bg-white hover:text-rose-600 hover:shadow-xl hover:shadow-rose-100/50 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                                  title="Delete"
                                >
                                  <Trash2 className="h-4.5 w-4.5" />
                                </button>
                              ) : null}
                            </div>
                          </td>
                        ) : null}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {filteredRows.length > 10 ? (
            <TablePagination
              currentPage={currentPage}
              pageSize={pageSize}
              totalItems={filteredRows.length}
              onPageChange={setCurrentPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setCurrentPage(1);
              }}
              itemLabel="rows"
            />
          ) : null}
        </div>
      </Card>
      ) : (
        <div className="mx-auto w-full max-w-6xl">
          <div className="overflow-hidden rounded-[1.75rem] border border-slate-300/80 bg-white ">
            <div className="border-b border-slate-300/80 bg-slate-100/30 px-8 py-6">
              <div className="flex items-start justify-between gap-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-300/80 bg-white text-brand shadow-sm">
                    <ReceiptText className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[20px] font-bold  text-gray-700">Item Rate Form</p>
                    <p className="mt-1 text-sm text-slate-600">{editingItem ? 'Update item rate details using a more compact and professional stock form layout.' : 'Create item rate details using a more compact and professional stock form layout.'}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={closeForm}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-300/80 bg-white px-4 py-2.5 text-xs font-bold uppercase tracking-[0.16em] text-slate-600 transition-all hover:border-slate-400 hover:bg-slate-100 hover:text-slate-900"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back
                </button>
              </div>
            </div>

            <div className="space-y-6  px-8 py-8">
              {setupError ? <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">{setupError}</div> : null}

              <section className={SECTION_PANEL_CLASS_NAME}>
                <div className="flex items-center justify-between border-b border-slate-300/80 px-6 py-4">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-800">Rate Setup</h3>
                    <p className="mt-1 text-xs text-slate-500">Date, quotation, supplier, category, manufacturer, and item details.</p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-200/70 text-brand">
                    <ReceiptText className="h-4 w-4" />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 p-6 xl:grid-cols-12">
                  <div className="space-y-2 xl:col-span-3">
                    <FieldLabel>Date</FieldLabel>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(event) => updateField('date', event.target.value)}
                      className={INPUT_CLASS_NAME}
                    />
                  </div>
                  <div className={`${shouldExpandItemField ? 'xl:col-span-6' : 'xl:col-span-3'} xl:col-start-1`}>
                    <SearchableSelect selectId="item" label="Item" value={formData.item} options={itemOptions} placeholder="Select item" searchablePlaceholder="Search item" onChange={(value) => updateField('item', value)} isOpen={openSelectId === 'item'} onToggle={(id) => setOpenSelectId((prev) => (prev === id ? null : id))} onClose={() => setOpenSelectId(null)} />
                  </div>
                  <div className="xl:col-span-3">
                    <ReadOnlyField label="Category" value={formData.category} placeholder="Category" />
                  </div>
                  <div className="xl:col-span-3">
                    <ReadOnlyField label="Sub Category" value={formData.subCategory} placeholder="Sub category" />
                  </div>
                  <div className={`${shouldExpandItemField ? 'xl:col-span-3 xl:col-start-1' : 'xl:col-span-3'}`}>
                    <ReadOnlyField label="Manufacturer" value={formData.manufacturer} placeholder="Manufacturer" />
                  </div>
                  <div className={`space-y-2 ${shouldExpandItemField ? 'xl:col-span-9' : 'xl:col-span-9'}`}>
                    <FieldLabel>Item Specification</FieldLabel>
                    <textarea
                      value={formData.itemSpecification}
                      readOnly
                      disabled
                      placeholder="Item specification"
                      rows={3}
                      className="min-h-[96px] w-full cursor-not-allowed rounded-xl border border-slate-300/80 bg-slate-100 px-4 py-3 text-sm text-slate-500 shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)] outline-none"
                    />
                  </div>
                  <div className="xl:col-span-3 xl:col-start-1">
                    <SearchableSelect selectId="supplier" label="Supplier" value={formData.supplier} options={supplierOptions} placeholder="Select supplier" searchablePlaceholder="Search supplier" onChange={(value) => updateField('supplier', value)} isOpen={openSelectId === 'supplier'} onToggle={(id) => setOpenSelectId((prev) => (prev === id ? null : id))} onClose={() => setOpenSelectId(null)} />
                  </div>
                  <div className="space-y-2 xl:col-span-3">
                    <FieldLabel>Quotation ID</FieldLabel>
                    <input
                      type="text"
                      value={formData.quotationId}
                      onChange={(event) => updateField('quotationId', event.target.value)}
                      placeholder="Quotation ID"
                      className={INPUT_CLASS_NAME}
                    />
                  </div>
                </div>
              </section>

              <section className={SECTION_PANEL_CLASS_NAME}>
                <div className="flex items-center justify-between border-b border-slate-300/80 px-6 py-4">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-800">Pricing</h3>
                    <p className="mt-1 text-xs text-slate-500">Reseller pricing, tax percentages, profit, and sale values.</p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-200/70 text-brand">
                    <Save className="h-4 w-4" />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 p-6 xl:grid-cols-12">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:col-span-6">
                    <div className="space-y-2">
                      <FieldLabel>Reseller Price US$</FieldLabel>
                      <div className="relative">
                        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-500">$</span>
                        <input type="text" value={formData.resellerPriceUsd} onChange={(event) => updateUsdPrice(event.target.value)} placeholder="0.00" className={`${INPUT_CLASS_NAME} pl-8`} />
                      </div>
                      <p className="text-[11px] font-semibold text-slate-500">
                        {isExchangeRateLoading
                          ? 'Fetching USD to PKR rate...'
                          : formData.exchangeRate
                            ? `1 USD = ${Number(formData.exchangeRate).toFixed(2)} PKR`
                            : 'USD to PKR rate unavailable'}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <FieldLabel>Reseller Price</FieldLabel>
                      <input type="text" value={formData.resellerPrice} onChange={(event) => updatePkrPrice(event.target.value)} placeholder="0.00" className={INPUT_CLASS_NAME} />
                    </div>
                    <div className="space-y-2">
                      <FieldLabel>Sale Price</FieldLabel>
                      <input type="text" value={calculatedTax.salePrice ? calculatedTax.salePrice.toFixed(2) : ''} readOnly disabled placeholder="0.00" className={READ_ONLY_INPUT_CLASS_NAME} />
                    </div>
                    <div className="space-y-2">
                      <FieldLabel>18% Sales Tax</FieldLabel>
                      <input type="text" value={calculatedTax.salesTaxAmount ? calculatedTax.salesTaxAmount.toFixed(2) : ''} readOnly disabled placeholder="0.00" className={READ_ONLY_INPUT_CLASS_NAME} />
                    </div>
                    <div className="space-y-2 md:col-span-2 xl:max-w-[65%]">
                      <FieldLabel>Sale Price With Tax</FieldLabel>
                      <input type="text" value={calculatedTax.salePriceWithTax ? calculatedTax.salePriceWithTax.toFixed(2) : ''} readOnly disabled placeholder="0.00" className={READ_ONLY_INPUT_CLASS_NAME} />
                    </div>
                  </div>

                
                   
                    <div className="space-y-3 rounded-2xl border border-slate-300/80 bg-slate-100/85 p-5 xl:col-span-5 xl:col-start-8">
                     <div className="mb-4 grid grid-cols-[minmax(110px,auto)_88px_110px] gap-3 text-sm font-bold text-slate-600">
                      <span></span>
                      <span>%Age</span>
                      <span>Amount</span>
                    </div>
                      <TaxRow idPrefix="i-tax" label="I.Tax" checked={formData.iTaxChecked} percentage={formData.iTaxPercentage} amount={calculatedTax.iTaxAmount ? calculatedTax.iTaxAmount.toFixed(2) : ''} onToggle={(value) => updateTaxToggle('iTaxChecked', value, 'i-tax-percentage')} onPercentageChange={(value) => updateField('iTaxPercentage', value)} />
                      <TaxRow idPrefix="others-tax" label="Others" checked={formData.othersChecked} percentage={formData.othersPercentage} amount={calculatedTax.otherTaxAmount ? calculatedTax.otherTaxAmount.toFixed(2) : ''} onToggle={(value) => updateTaxToggle('othersChecked', value, 'others-tax-percentage')} onPercentageChange={(value) => updateField('othersPercentage', value)} />
                      <TaxRow idPrefix="profit-tax" label="Profit" checked={formData.profitChecked} percentage={formData.profitPercentage} amount={calculatedTax.profitAmount ? calculatedTax.profitAmount.toFixed(2) : ''} onToggle={(value) => updateTaxToggle('profitChecked', value, 'profit-tax-percentage')} onPercentageChange={(value) => updateField('profitPercentage', value)} />
                    </div>
                  </div>
             
              </section>

              <div className="flex items-center justify-between rounded-2xl border border-slate-300/80 bg-slate-50/95 px-6 py-4">
                <p className="text-xs leading-6 text-slate-600">Review the form, then save the item rate. The tighter layout keeps the form more focused and professional.</p>
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={closeForm}
                    className="rounded-xl border border-slate-300/80 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 transition-all hover:bg-slate-100 hover:text-slate-900"
                  >
                    Cancel
                  </button>
                  <button type="button" onClick={handleAddRow} disabled={isSaving} className="flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand/20 transition-all hover:bg-brand-hover disabled:opacity-70">
                    <Save className="h-4.5 w-4.5" />
                    {isSaving ? 'Saving...' : editingItem ? 'Update Item Rate' : 'Save Item Rate'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="Delete Item Rate"
        description={`Are you sure you want to delete ${deleteTarget?.item || 'this item rate'}? This action cannot be undone.`}
        confirmLabel="Delete"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDeleteRow}
        isLoading={isSaving}
      />
      <ThemeToastViewport toasts={toasts} onClose={removeToast} />
    </div>
  );
}
