import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Package, Plus, Save, ChevronDown, Search as SearchIcon, ReceiptText, ArrowLeft } from 'lucide-react';
import { Card, Button } from '@/src/components/ui/Card';
import TableLoader from '@/src/components/ui/TableLoader';
import TablePagination from '@/src/components/ui/TablePagination';
import ThemeToastViewport from '@/src/components/ui/ThemeToastViewport';
import { useThemeToast } from '@/src/hooks/useThemeToast';
import axiosInstance from '@/src/lib/axiosInstance';
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
        ...extra(item),
      };
    })
    .filter((item) => item.name);
}

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

const SECTION_PANEL_CLASS_NAME = 'rounded-[1.4rem] border border-slate-300/80 bg-slate-50/95 shadow-[0_12px_30px_rgba(15,23,42,0.06)]';

function SearchableSelect({ selectId, label, value, options, placeholder, searchablePlaceholder, onChange, isOpen, onToggle, onClose }) {
  const [query, setQuery] = useState('');
  const containerRef = useRef(null);

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
          className={`mt-[2px] flex ${INPUT_CLASS_NAME} items-center justify-between text-left outline-none`}
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

function TaxRow({ label, checked, percentage, amount, onToggle, onPercentageChange, onAmountChange }) {
  return (
    <div className="grid grid-cols-[minmax(110px,auto)_88px_110px] items-center gap-3">
      <label className="flex items-center gap-3 text-sm font-semibold text-slate-700">
        <input type="checkbox" checked={checked} onChange={(event) => onToggle(event.target.checked)} className="h-4 w-4 rounded border-slate-300 text-slate-700 focus:ring-slate-300" />
        <span>{label}</span>
      </label>
      <input type="text" value={percentage} onChange={(event) => onPercentageChange(sanitizeNumericInput(event.target.value))} placeholder="%" className="h-9 rounded-xl border border-slate-300/80 bg-white px-3 text-sm text-slate-900 transition-all focus:border-slate-500 focus:outline-none focus:ring-4 focus:ring-slate-200/70" />
      <input type="text" value={amount} onChange={(event) => onAmountChange(sanitizeNumericInput(event.target.value))} placeholder="Amount" className="h-9 rounded-xl border border-slate-300/80 bg-white px-3 text-sm text-slate-900 transition-all focus:border-slate-500 focus:outline-none focus:ring-4 focus:ring-slate-200/70" />
    </div>
  );
}

export default function ItemRate() {
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [setupOptions, setSetupOptions] = useState({ categories: [], subCategories: [], manufacturers: [], suppliers: [] });
  const [rows, setRows] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [openSelectId, setOpenSelectId] = useState(null);
  const [isLoadingSetup, setIsLoadingSetup] = useState(true);
  const [setupError, setSetupError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const { toasts, toast, removeToast } = useThemeToast();

  const loadSetupOptions = useCallback(async () => {
    setIsLoadingSetup(true);
    setSetupError('');
    try {
      const [categoriesResponse, subCategoriesResponse, manufacturersResponse, suppliersResponse] = await Promise.all([
        axiosInstance.get('/categories', { params: { status: 'active' } }),
        axiosInstance.get('/sub-categories', { params: { status: 'active' } }),
        axiosInstance.get('/manufacturers', { params: { status: 'active' } }),
        axiosInstance.get('/suppliers', { params: { status: 'active' } }),
      ]);
      setSetupOptions({
        categories: mapSetupItems(extractApiRows(categoriesResponse, ['categories']), ['category_name']),
        subCategories: mapSetupItems(extractApiRows(subCategoriesResponse, ['subCategories', 'sub_categories']), ['sub_category_name'], (item) => ({
          categoryId: item?.category_id || '',
          categoryName: item?.category_name || '',
        })),
        manufacturers: mapSetupItems(extractApiRows(manufacturersResponse, ['manufacturers']), ['manufacturer_name']),
        suppliers: mapSetupItems(extractApiRows(suppliersResponse, ['suppliers']), ['supplier_name', 'name']),
      });
    } catch (requestError) {
      setSetupError(requestError.message || 'Failed to load item rate setup options.');
    } finally {
      setIsLoadingSetup(false);
    }
  }, []);

  useEffect(() => {
    loadSetupOptions();
  }, [loadSetupOptions]);

  const categoryOptions = useMemo(() => setupOptions.categories.map((item) => item.name), [setupOptions.categories]);
  const manufacturerOptions = useMemo(() => setupOptions.manufacturers.map((item) => item.name), [setupOptions.manufacturers]);
  const supplierOptions = useMemo(() => setupOptions.suppliers.map((item) => item.name), [setupOptions.suppliers]);
  const selectedCategory = useMemo(() => setupOptions.categories.find((item) => item.name === formData.category) || null, [formData.category, setupOptions.categories]);
  const subCategoryOptions = useMemo(() => {
    return setupOptions.subCategories
      .filter((item) => !selectedCategory || item.categoryId === selectedCategory.id || item.categoryName === selectedCategory.name)
      .map((item) => item.name);
  }, [selectedCategory, setupOptions.subCategories]);
  const filteredRows = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    if (!normalizedQuery) return rows;

    return rows.filter((row) =>
      `${row.category} ${row.subCategory} ${row.item} ${row.reseller} ${row.sale}`.toLowerCase().includes(normalizedQuery),
    );
  }, [rows, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
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

  const updateField = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
      ...(field === 'category' ? { subCategory: '' } : {}),
    }));
  };

  const handleAddRow = () => {
    if (!String(formData.item).trim()) {
      toast.error('Item required', 'Please enter the item before adding it to the table.');
      return;
    }
    setIsSaving(true);
    setRows((prev) => [
      {
        id: crypto.randomUUID(),
        category: formData.category,
        subCategory: formData.subCategory,
        item: formData.item,
        reseller: formData.resellerPrice,
        sale: formData.salePriceWithTax || formData.salePrice,
      },
      ...prev,
    ]);
    setCurrentPage(1);
    toast.success('UI row added', 'Item rate row added locally. API hookup can be connected next.');
    setShowForm(false);
    setOpenSelectId(null);
    setFormData(EMPTY_FORM);
    setIsSaving(false);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Item Rate</h1>
          <p className="mt-1 text-gray-500">Create the stock item rate form UI with the same look and table style as item definition.</p>
        </div>
        {
          !showForm ? (
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
              <table className="w-full min-w-[980px] border-separate border-spacing-0 text-left">
                <thead>
                  <tr className="bg-linear-to-r from-gray-50/80 via-gray-50/40 to-transparent">
                    <th className="border-b border-gray-100/60 px-8 py-6 text-[10px] font-black uppercase tracking-[0.25em] text-gray-400 first:rounded-tl-4xl">Sr#</th>
                    <th className="border-b border-gray-100/60 px-8 py-6 text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">Category</th>
                    <th className="border-b border-gray-100/60 px-8 py-6 text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">Sub Category</th>
                    <th className="border-b border-gray-100/60 px-8 py-6 text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">Item</th>
                    <th className="border-b border-gray-100/60 px-8 py-6 text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">Reseller</th>
                    <th className="border-b border-gray-100/60 px-8 py-6 text-[10px] font-black uppercase tracking-[0.25em] text-gray-400 last:rounded-tr-4xl">Sale</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50/50">
                  {isLoadingSetup ? (
                    <tr>
                      <td colSpan={6} className="px-8 py-6 text-center">
                        <TableLoader label="Loading item rate form options..." />
                      </td>
                    </tr>
                  ) : filteredRows.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-8 py-20 text-center text-sm font-medium text-gray-400">No item rate rows added yet.</td>
                    </tr>
                  ) : (
                    paginatedRows.map((row, index) => (
                      <tr key={row.id} className="group transition-all duration-300 hover:bg-brand-light/40">
                        <td className="border-b border-gray-50/30 px-8 py-6 text-sm font-semibold text-gray-500">{(currentPage - 1) * pageSize + index + 1}</td>
                        <td className="border-b border-gray-50/30 px-8 py-6 text-sm font-semibold text-gray-700 whitespace-nowrap">{formatCellValue(row.category)}</td>
                        <td className="border-b border-gray-50/30 px-8 py-6 text-sm font-semibold text-gray-700 whitespace-nowrap">{formatCellValue(row.subCategory)}</td>
                        <td className="border-b border-gray-50/30 px-8 py-6">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-brand/10 bg-brand-light text-brand">
                              <Package className="h-4 w-4" />
                            </div>
                            <span className="text-sm font-semibold text-gray-900">{formatCellValue(row.item)}</span>
                          </div>
                        </td>
                        <td className="border-b border-gray-50/30 px-8 py-6 text-sm font-semibold text-gray-700 whitespace-nowrap">{formatCellValue(row.reseller)}</td>
                        <td className="border-b border-gray-50/30 px-8 py-6 text-sm font-semibold text-gray-700 whitespace-nowrap">{formatCellValue(row.sale)}</td>
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
          <div className="overflow-hidden rounded-[1.75rem] border border-slate-300/80 bg-white shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
            <div className="border-b border-slate-300/80 bg-slate-100/90 px-8 py-6">
              <div className="flex items-start justify-between gap-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-300/80 bg-white text-slate-700 shadow-sm">
                    <ReceiptText className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">Item Rate Form</p>
                    <p className="mt-1 text-sm text-slate-600">Create item rate details using a more compact and professional stock form layout.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setOpenSelectId(null);
                  }}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-300/80 bg-white px-4 py-2.5 text-xs font-bold uppercase tracking-[0.16em] text-slate-600 transition-all hover:border-slate-400 hover:bg-slate-100 hover:text-slate-900"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back
                </button>
              </div>
            </div>

            <div className="space-y-6 bg-slate-100/70 px-8 py-8">
              {setupError ? <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">{setupError}</div> : null}

              <section className={SECTION_PANEL_CLASS_NAME}>
                <div className="flex items-center justify-between border-b border-slate-300/80 px-6 py-4">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-800">Rate Setup</h3>
                    <p className="mt-1 text-xs text-slate-500">Date, quotation, supplier, category, manufacturer, and item details.</p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-200/70 text-slate-700">
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
                  <div className="xl:col-span-3">
                    <SearchableSelect selectId="category" label="Category" value={formData.category} options={categoryOptions} placeholder="Select category" searchablePlaceholder="Search category" onChange={(value) => updateField('category', value)} isOpen={openSelectId === 'category'} onToggle={(id) => setOpenSelectId((prev) => (prev === id ? null : id))} onClose={() => setOpenSelectId(null)} />
                  </div>
                  <div className="xl:col-span-3">
                    <SearchableSelect selectId="supplier" label="Supplier" value={formData.supplier} options={supplierOptions} placeholder="Select supplier" searchablePlaceholder="Search supplier" onChange={(value) => updateField('supplier', value)} isOpen={openSelectId === 'supplier'} onToggle={(id) => setOpenSelectId((prev) => (prev === id ? null : id))} onClose={() => setOpenSelectId(null)} />
                  </div>
                  <div className="xl:col-span-3">
                    <SearchableSelect selectId="manufacturer" label="Manufacturer" value={formData.manufacturer} options={manufacturerOptions} placeholder="Select manufacturer" searchablePlaceholder="Search manufacturer" onChange={(value) => updateField('manufacturer', value)} isOpen={openSelectId === 'manufacturer'} onToggle={(id) => setOpenSelectId((prev) => (prev === id ? null : id))} onClose={() => setOpenSelectId(null)} />
                  </div>
                  <div className="xl:col-span-3">
                    <SearchableSelect selectId="subCategory" label="Sub Category" value={formData.subCategory} options={subCategoryOptions} placeholder="Select sub category" searchablePlaceholder="Search sub category" onChange={(value) => updateField('subCategory', value)} isOpen={openSelectId === 'subCategory'} onToggle={(id) => setOpenSelectId((prev) => (prev === id ? null : id))} onClose={() => setOpenSelectId(null)} />
                  </div>
                  <div className="space-y-2 xl:col-span-4">
                    <FieldLabel>Item</FieldLabel>
                    <input
                      type="text"
                      value={formData.item}
                      onChange={(event) => updateField('item', event.target.value)}
                      placeholder="Item"
                      className={INPUT_CLASS_NAME}
                    />
                  </div>
                  <div className="space-y-2 xl:col-span-8">
                    <FieldLabel>Item Specification</FieldLabel>
                    <textarea
                      value={formData.itemSpecification}
                      onChange={(event) => updateField('itemSpecification', event.target.value)}
                      placeholder="Item specification"
                      rows={3}
                      className="min-h-[96px] w-full rounded-xl border border-slate-300/80 bg-white px-4 py-3 text-sm text-slate-900 shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)] transition-all focus:border-slate-500 focus:outline-none focus:ring-4 focus:ring-slate-200/70"
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
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-200/70 text-slate-700">
                    <Save className="h-4 w-4" />
                  </div>
                </div>

                <div className="space-y-5 p-6">
                  <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
                    <div className="space-y-2 xl:col-span-3">
                      <FieldLabel>Reseller Price US$</FieldLabel>
                      <input type="text" value={formData.resellerPriceUsd} onChange={(event) => updateField('resellerPriceUsd', sanitizeNumericInput(event.target.value))} placeholder="0.00" className={INPUT_CLASS_NAME} />
                    </div>
                    <div className="space-y-2 xl:col-span-3">
                      <FieldLabel>Reseller Price</FieldLabel>
                      <input type="text" value={formData.resellerPrice} onChange={(event) => updateField('resellerPrice', sanitizeNumericInput(event.target.value))} placeholder="0.00" className={INPUT_CLASS_NAME} />
                    </div>
                    <div className="rounded-2xl border border-slate-300/80 bg-slate-100/85 p-5 xl:col-span-6">
                    <div className="mb-4 grid grid-cols-[minmax(110px,auto)_88px_110px] gap-3 text-sm font-bold text-slate-600">
                      <span></span>
                      <span>%Age</span>
                      <span>Amount</span>
                    </div>
                    <div className="space-y-3 rounded-2xl border border-slate-300/80 bg-white p-4">
                      <TaxRow label="I.Tax" checked={formData.iTaxChecked} percentage={formData.iTaxPercentage} amount={formData.iTaxAmount} onToggle={(value) => updateField('iTaxChecked', value)} onPercentageChange={(value) => updateField('iTaxPercentage', value)} onAmountChange={(value) => updateField('iTaxAmount', value)} />
                      <TaxRow label="Others" checked={formData.othersChecked} percentage={formData.othersPercentage} amount={formData.othersAmount} onToggle={(value) => updateField('othersChecked', value)} onPercentageChange={(value) => updateField('othersPercentage', value)} onAmountChange={(value) => updateField('othersAmount', value)} />
                      <TaxRow label="Profit" checked={formData.profitChecked} percentage={formData.profitPercentage} amount={formData.profitAmount} onToggle={(value) => updateField('profitChecked', value)} onPercentageChange={(value) => updateField('profitPercentage', value)} onAmountChange={(value) => updateField('profitAmount', value)} />
                    </div>
                  </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
                    <div className="space-y-2 xl:col-span-3">
                      <FieldLabel>Sale Price</FieldLabel>
                      <input type="text" value={formData.salePrice} onChange={(event) => updateField('salePrice', sanitizeNumericInput(event.target.value))} placeholder="0.00" className={INPUT_CLASS_NAME} />
                    </div>
                    <div className="space-y-2 xl:col-span-3">
                      <FieldLabel>17% Sales Tax</FieldLabel>
                      <input type="text" value={formData.salesTax17} onChange={(event) => updateField('salesTax17', sanitizeNumericInput(event.target.value))} placeholder="0.00" className={INPUT_CLASS_NAME} />
                    </div>
                    <div className="space-y-2 xl:col-span-4">
                      <FieldLabel>Sale Price With Tax</FieldLabel>
                      <input type="text" value={formData.salePriceWithTax} onChange={(event) => updateField('salePriceWithTax', sanitizeNumericInput(event.target.value))} placeholder="0.00" className={INPUT_CLASS_NAME} />
                    </div>
                  </div>
                </div>
              </section>

              <div className="flex items-center justify-between rounded-2xl border border-slate-300/80 bg-slate-50/95 px-6 py-4">
                <p className="text-xs leading-6 text-slate-600">Review the form, then save the item rate. The tighter layout keeps the form more focused and professional.</p>
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setOpenSelectId(null);
                    }}
                    className="rounded-xl border border-slate-300/80 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 transition-all hover:bg-slate-100 hover:text-slate-900"
                  >
                    Cancel
                  </button>
                  <button type="button" onClick={handleAddRow} disabled={isSaving} className="flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand/20 transition-all hover:bg-brand-hover disabled:opacity-70">
                    <Save className="h-4.5 w-4.5" />
                    {isSaving ? 'Saving...' : 'Save Item Rate'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <ThemeToastViewport toasts={toasts} onClose={removeToast} />
    </div>
  );
}
