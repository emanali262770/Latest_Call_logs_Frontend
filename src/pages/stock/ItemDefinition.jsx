import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Save,
  Package,
  ChevronDown,
  ArrowLeft,
  ImagePlus,
  Search as SearchIcon,
  Lock,
} from 'lucide-react';
import { Card, Button, Badge } from '@/src/components/ui/Card';
import TableLoader from '@/src/components/ui/TableLoader';
import ConfirmDialog from '@/src/components/ui/ConfirmDialog';
import ThemeToastViewport from '@/src/components/ui/ThemeToastViewport';
import { useThemeToast } from '@/src/hooks/useThemeToast';
import { required, validateForm } from '@/src/lib/validation';

const STORAGE_KEY = 'cms_stock_item_definitions';

const ITEM_TYPE_OPTIONS = ['Laundry', 'General', 'Consumable', 'Service', 'Chemical'];
const CATEGORY_OPTIONS = ['Soaps', 'Detergents', 'Cleaning', 'Accessories', 'Packaging'];
const MANUFACTURER_OPTIONS = ['MMM', 'Sufi Soap', 'UIL', 'Unilever', 'Local Vendor'];
const SUPPLIER_OPTIONS = ['None', 'Haris Traders', 'City Supply', 'Metro Distribution', 'Unity Wholesale'];
const UNIT_OPTIONS = ['Piece', 'Box', 'Packet', 'Kg', 'Liter'];

const EMPTY_FORM = {
  code: '',
  itemName: '',
  itemType: '',
  category: '',
  manufacturer: '',
  supplier: '',
  unit: '',
  minLevelQty: '',
  purchasePrice: '',
  salePrice: '',
  imageName: '',
  imagePreview: '',
  status: 'active',
};

const FORM_RULES = {
  itemName: [(value) => required(value, 'Item name')],
  itemType: [(value) => required(value, 'Item type')],
  category: [(value) => required(value, 'Category')],
  unit: [(value) => required(value, 'Unit')],
  minLevelQty: [(value) => required(value, 'Min level qty')],
};

function generateCode(items) {
  const maxCode = items.reduce((best, item) => {
    const numeric = Number.parseInt(String(item.code || '').replace(/\D/g, ''), 10);
    return Number.isNaN(numeric) ? best : Math.max(best, numeric);
  }, 0);

  return String(maxCode + 1).padStart(6, '0');
}

function loadStoredItems() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveStoredItems(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function FieldLabel({ children, required: isRequired = false }) {
  return (
    <label className="ml-1 text-xs font-bold text-gray-600">
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
          className={`flex h-10 w-full items-center justify-between rounded-[14px] border bg-white px-3.5 text-left text-[15px] text-gray-900 outline-none transition-all ${
            error ? 'border-rose-400' : 'border-gray-200'
          }`}
        >
          <span className={value ? 'text-gray-900' : 'text-gray-400'}>{value || placeholder}</span>
          <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen ? (
          <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-2xl shadow-gray-200/60">
            <div className="border-b border-gray-100 p-3">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={searchablePlaceholder}
                  className="h-10 w-full rounded-2xl border border-gray-200 bg-white pl-10 pr-4 text-sm text-gray-900 outline-none transition-all focus:border-brand focus:ring-4 focus:ring-brand/10"
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
                    className={`flex w-full items-center justify-between rounded-2xl px-3 py-3 text-left text-sm transition-all ${
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
  const [items, setItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [formMode, setFormMode] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [openSelectId, setOpenSelectId] = useState(null);
  const fileInputRef = useRef(null);
  const { toasts, toast, removeToast } = useThemeToast();

  useEffect(() => {
    setIsLoading(true);
    setItems(loadStoredItems());
    setIsLoading(false);
  }, []);

  const showForm = formMode !== null;

  const visibleItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return items;

    return items.filter((item) =>
      [item.code, item.itemName, item.itemType, item.category, item.supplier]
        .join(' ')
        .toLowerCase()
        .includes(query),
    );
  }, [items, searchQuery]);

  const persistItems = (nextItems) => {
    setItems(nextItems);
    saveStoredItems(nextItems);
  };

  const handleOpenCreate = () => {
    setFormMode('create');
    setEditingItem(null);
    setFormData({
      ...EMPTY_FORM,
      code: generateCode(items),
    });
    setFormErrors({});
    setApiError('');
    setOpenSelectId(null);
  };

  const handleOpenEdit = (item) => {
    setFormMode('edit');
    setEditingItem(item);
    setFormData({
      ...EMPTY_FORM,
      ...item,
    });
    setFormErrors({});
    setApiError('');
    setOpenSelectId(null);
  };

  const closeForm = () => {
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
      [field]: value,
    }));
    setFormErrors((prev) => ({
      ...prev,
      [field]: '',
    }));
  };

  const inputClassName = (field) =>
    `h-10 w-full rounded-[14px] border bg-white px-3.5 text-[15px] text-gray-900 focus:border-brand focus:ring-4 focus:ring-brand/10 transition-all outline-none ${
      formErrors[field] ? 'border-rose-400' : 'border-gray-200'
    }`;

  const handleImageUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const preview = URL.createObjectURL(file);
    setFormData((prev) => ({
      ...prev,
      imageName: file.name,
      imagePreview: preview,
    }));
  };

  const handleSave = () => {
    const errors = validateForm(formData, FORM_RULES);

    if (Object.keys(errors).length) {
      setFormErrors(errors);
      setApiError('Please complete all required fields before saving the item.');
      return;
    }

    const payload = {
      ...formData,
      id: editingItem?.id || crypto.randomUUID(),
      updatedAt: new Date().toISOString(),
    };

    const nextItems =
      formMode === 'edit' && editingItem
        ? items.map((item) => (item.id === editingItem.id ? payload : item))
        : [payload, ...items];

    persistItems(nextItems);
    toast.success(
      formMode === 'edit' ? 'Item updated' : 'Item created',
      formMode === 'edit' ? 'Item definition updated successfully.' : 'Item definition added successfully.',
    );
    closeForm();
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    const nextItems = items.filter((item) => item.id !== deleteTarget.id);
    persistItems(nextItems);
    toast.success('Item deleted', 'Item definition removed successfully.');
    setDeleteTarget(null);
  };

  return (
    <>
      <div className="space-y-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Item Definition</h1>
            <p className="mt-1 text-gray-500">Manage stock item definitions with searchable setup-style forms.</p>
          </div>
          {!showForm ? (
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
                <span className="font-bold text-gray-900">{visibleItems.length}</span> Records
              </p>
            </div>

            <div className="w-full overflow-hidden rounded-4xl border border-gray-100 bg-white/80 shadow-2xl shadow-gray-200/30 backdrop-blur-xl">
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
                        Supplier
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
                          <TableLoader label="Loading item definitions..." />
                        </td>
                      </tr>
                    ) : visibleItems.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-8 py-20 text-center text-sm font-medium text-gray-400">
                          No item definitions found.
                        </td>
                      </tr>
                    ) : (
                      visibleItems.map((item) => (
                        <tr key={item.id} className="group transition-all duration-300 hover:bg-brand-light/40">
                          <td className="border-b border-gray-50/30 px-6 py-6 text-sm font-bold text-gray-500">
                            <span className="font-mono">{item.code}</span>
                          </td>
                          <td className="border-b border-gray-50/30 px-6 py-6">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-brand/10 bg-brand-light text-brand">
                                <Package className="h-4 w-4" />
                              </div>
                              <p className="font-semibold text-gray-900">{item.itemName}</p>
                            </div>
                          </td>
                          <td className="border-b border-gray-50/30 px-6 py-6 text-sm font-semibold text-gray-700">{item.itemType || '-'}</td>
                          <td className="border-b border-gray-50/30 px-6 py-6 text-sm font-semibold text-gray-700">{item.category || '-'}</td>
                          <td className="border-b border-gray-50/30 px-6 py-6 text-sm font-semibold text-gray-700">{item.supplier || '-'}</td>
                          <td className="border-b border-gray-50/30 px-6 py-6 text-sm font-semibold text-gray-700">{item.salePrice || '-'}</td>
                          <td className="border-b border-gray-50/30 px-6 py-6">
                            <Badge variant={item.status === 'active' ? 'green' : 'gray'}>{item.status}</Badge>
                          </td>
                          <td className="border-b border-gray-50/30 px-6 py-6 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(item)}
                                className="flex h-10 w-10 items-center justify-center rounded-2xl text-gray-400 transition-all duration-300 hover:bg-white hover:text-brand hover:shadow-xl hover:shadow-brand/20 active:scale-95"
                                title="Edit"
                              >
                                <Edit2 className="h-4.5 w-4.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteTarget(item)}
                                className="flex h-10 w-10 items-center justify-center rounded-2xl text-gray-400 transition-all duration-300 hover:bg-white hover:text-rose-600 hover:shadow-xl hover:shadow-rose-100/50 active:scale-95"
                                title="Delete"
                              >
                                <Trash2 className="h-4.5 w-4.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>
        ) : (
          <div
            className="mx-auto max-w-full"
            style={{ width: '1100px' }}
          >
            <div className="overflow-hidden rounded-3xl border-l-[6px] border-brand bg-white shadow-2xl shadow-brand/10">
              <div className="flex items-start justify-between gap-6 p-8 pb-6">
                <div className="flex items-start gap-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-light text-brand shadow-inner">
                  <Package className="h-7 w-7" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-gray-900">
                    {formMode === 'edit' ? 'Edit Item Definition' : 'New Item Definition'}
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    {formMode === 'edit'
                      ? 'Update the item definition in the system.'
                      : 'Create a new stock item definition with searchable fields.'}
                  </p>
                </div>
                </div>
                <button
                  type="button"
                  onClick={closeForm}
                  className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold uppercase tracking-[0.18em] text-gray-500 transition-all hover:border-brand/20 hover:bg-brand-light/30 hover:text-brand"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Go Back
                </button>
              </div>

              <div className="space-y-8 px-8 pb-8">
                {apiError ? (
                  <div className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                    {apiError}
                  </div>
                ) : null}

                <div className="space-y-6">
                  <div className="flex items-center gap-3 rounded-xl border border-brand/10 bg-brand-light/50 px-5 py-2.5">
                    <div className="h-5 w-1.5 rounded-full bg-brand" />
                    <span className="text-sm font-extrabold uppercase tracking-wider text-brand"># Item Basics</span>
                  </div>

                  <div className="rounded-3xl border border-gray-200 bg-gray-50/60 p-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <label className="ml-1 flex items-center gap-2 text-xs font-bold text-gray-600">
                          <span>Item Code</span>
                          <span className="text-[11px] font-medium text-gray-400">Auto-generated · read-only</span>
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={formData.code}
                            readOnly
                            disabled
                            className="h-10 w-full cursor-not-allowed rounded-[14px] border border-gray-200 bg-gray-50 px-3.5 pr-10 font-mono text-[15px] text-gray-500 outline-none"
                          />
                          <Lock className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        </div>
                      </div>

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
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <SearchableSelect
                      selectId="itemType"
                      label="Item Type"
                      required
                      value={formData.itemType}
                      options={ITEM_TYPE_OPTIONS}
                      placeholder="Select item type"
                      searchablePlaceholder="Search item types..."
                      onChange={(value) => updateField('itemType', value)}
                      error={formErrors.itemType}
                      isOpen={openSelectId === 'itemType'}
                      onToggle={(id) => setOpenSelectId((current) => (current === id ? null : id))}
                      onClose={() => setOpenSelectId(null)}
                    />
                    <SearchableSelect
                      selectId="category"
                      label="Category"
                      required
                      value={formData.category}
                      options={CATEGORY_OPTIONS}
                      placeholder="Select category"
                      searchablePlaceholder="Search categories..."
                      onChange={(value) => updateField('category', value)}
                      error={formErrors.category}
                      isOpen={openSelectId === 'category'}
                      onToggle={(id) => setOpenSelectId((current) => (current === id ? null : id))}
                      onClose={() => setOpenSelectId(null)}
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <SearchableSelect
                      selectId="manufacturer"
                      label="Manufacturer"
                      value={formData.manufacturer}
                      options={MANUFACTURER_OPTIONS}
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
                      options={SUPPLIER_OPTIONS}
                      placeholder="Select supplier"
                      searchablePlaceholder="Search suppliers..."
                      onChange={(value) => updateField('supplier', value)}
                      error={formErrors.supplier}
                      isOpen={openSelectId === 'supplier'}
                      onToggle={(id) => setOpenSelectId((current) => (current === id ? null : id))}
                      onClose={() => setOpenSelectId(null)}
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-2">
                    <SearchableSelect
                      selectId="unit"
                      label="Unit"
                      required
                      value={formData.unit}
                      options={UNIT_OPTIONS}
                      placeholder="Select unit"
                      searchablePlaceholder="Search units..."
                      onChange={(value) => updateField('unit', value)}
                      error={formErrors.unit}
                      isOpen={openSelectId === 'unit'}
                      onToggle={(id) => setOpenSelectId((current) => (current === id ? null : id))}
                      onClose={() => setOpenSelectId(null)}
                    />
                    <div className="space-y-2">
                      <FieldLabel required>Min Level Qty</FieldLabel>
                      <input
                        type="number"
                        value={formData.minLevelQty}
                        onChange={(event) => updateField('minLevelQty', event.target.value)}
                        placeholder="e.g. 10"
                        className={inputClassName('minLevelQty')}
                      />
                      {formErrors.minLevelQty ? <p className="ml-1 text-xs text-rose-600">{formErrors.minLevelQty}</p> : null}
                    </div>
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
                  </div>

                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <div className="space-y-2">
                      <FieldLabel>Sale Price</FieldLabel>
                      <input
                        type="number"
                        value={formData.salePrice}
                        onChange={(event) => updateField('salePrice', event.target.value)}
                        placeholder="e.g. 150"
                        className={inputClassName('salePrice')}
                      />
                    </div>
                    <div className="space-y-2">
                      <FieldLabel>Upload Image</FieldLabel>
                      <div className="flex items-center gap-5">
                        <div
                          onClick={() => fileInputRef.current?.click()}
                          className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-gray-200 transition-all hover:border-brand/40 hover:bg-brand-light/20"
                        >
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
                        <p className="text-xs leading-relaxed text-gray-400">
                          PNG/JPG up to 2MB.
                          <br />
                          <span className="text-gray-300">Optional - item image preview for stock records.</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-4 pt-2">
                  <button
                    type="button"
                    onClick={closeForm}
                    className="rounded-2xl border-2 border-gray-100 bg-white px-10 py-4 font-bold text-gray-500 transition-all hover:bg-gray-50 hover:text-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    className="flex items-center gap-3 rounded-2xl bg-brand px-10 py-4 font-bold text-white shadow-xl shadow-brand/20 transition-all hover:bg-brand-hover"
                  >
                    <Save className="h-5 w-5" />
                    {formMode === 'edit' ? 'Update Item' : 'Save Item'}
                  </button>
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
      />

      <ThemeToastViewport toasts={toasts} onClose={removeToast} />
    </>
  );
}
