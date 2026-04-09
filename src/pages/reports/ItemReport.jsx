import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Package, SlidersHorizontal, TableProperties } from 'lucide-react';
import { Card } from '@/src/components/ui/Card';
import TablePagination from '@/src/components/ui/TablePagination';
import TableLoader from '@/src/components/ui/TableLoader';
import axiosInstance from '@/src/lib/axiosInstance';

function resolveAssetUrl(value) {
  const assetPath = String(value || '').trim();
  if (!assetPath) return '';
  if (/^https?:\/\//i.test(assetPath) || /^blob:/i.test(assetPath)) return assetPath;
  const baseUrl = String(import.meta.env.VITE_API_BASE_URL || '').trim();
  if (!baseUrl) return assetPath;
  try {
    const apiUrl = new URL(baseUrl);
    return new URL(assetPath, apiUrl.origin).toString();
  } catch {
    return assetPath;
  }
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
        ...extra(item),
      };
    })
    .filter((item) => item.name);
}

function formatNumber(value) {
  const normalized = String(value ?? '').trim();
  return normalized || '-';
}

function FilterSelect({ label, value, placeholder, options, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!containerRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <label className="space-y-2" ref={containerRef}>
      <span className="ml-0.5 text-[11px] font-bold uppercase tracking-[0.14em] text-gray-500">{label}</span>
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="flex h-11 w-full items-center justify-between rounded-2xl border border-gray-100 bg-gray-50/50 px-4 text-sm text-gray-900 transition-all focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10"
        >
          <span className={value ? 'text-gray-900' : 'text-gray-400'}>{value || placeholder}</span>
          <span className="text-base leading-none text-gray-400">{isOpen ? '▴' : '▾'}</span>
        </button>

        {isOpen ? (
          <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl shadow-gray-200/60">
            <div className="max-h-56 overflow-y-auto p-2">
              <button
                type="button"
                onClick={() => {
                  onChange('');
                  setIsOpen(false);
                }}
                className="flex w-full items-center rounded-xl px-3 py-2.5 text-left text-sm text-gray-400 transition-all hover:bg-gray-50 hover:text-gray-700"
              >
                {placeholder}
              </button>
              {options.map((option) => (
                <button
                  key={option.id || option.name}
                  type="button"
                  onClick={() => {
                    onChange(option.name);
                    setIsOpen(false);
                  }}
                  className="flex w-full items-center rounded-xl px-3 py-2.5 text-left text-sm text-gray-700 transition-all hover:bg-gray-50 hover:text-gray-900"
                >
                  <span className="font-medium">{option.name}</span>
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </label>
  );
}

export default function ItemReport() {
  const [items, setItems] = useState([]);
  const [itemQuery, setItemQuery] = useState('');
  const [isItemSuggestionsOpen, setIsItemSuggestionsOpen] = useState(false);
  const [filters, setFilters] = useState({
    itemType: '',
    category: '',
    subCategory: '',
    itemId: '',
  });
  const [setupOptions, setSetupOptions] = useState({
    itemTypes: [],
    categories: [],
    subCategories: [],
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isLoading, setIsLoading] = useState(true);
  const [listError, setListError] = useState('');
  const [setupError, setSetupError] = useState('');
  const itemFieldRef = useRef(null);

  const loadSetupOptions = useCallback(async () => {
    setSetupError('');
    try {
      const [itemTypesResponse, categoriesResponse, subCategoriesResponse] = await Promise.all([
        axiosInstance.get('/item-types', { params: { status: 'active' } }),
        axiosInstance.get('/categories', { params: { status: 'active' } }),
        axiosInstance.get('/sub-categories', { params: { status: 'active' } }),
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
      });
    } catch (requestError) {
      setSetupError(requestError.message || 'Failed to load report filters.');
    }
  }, []);

  const loadItems = useCallback(async () => {
    setIsLoading(true);
    setListError('');
    try {
      const params = {};
      const selectedType = setupOptions.itemTypes.find((t) => t.name === filters.itemType);
      if (selectedType) params.item_type_id = selectedType.id;
      const selectedCat = setupOptions.categories.find((c) => c.name === filters.category);
      if (selectedCat) params.category_id = selectedCat.id;
      const selectedSub = setupOptions.subCategories.find((s) => s.name === filters.subCategory);
      if (selectedSub) params.sub_category_id = selectedSub.id;
      if (itemQuery.trim()) params.search = itemQuery.trim();

      const response = await axiosInstance.get('/item-report', { params });
      const nextItems = extractApiRows(response, ['items', 'data']).map((item) => ({
        id: item.id || item._id,
        code: item.item_code || '',
        itemName: item.item_name || '',
        itemType: item.item_type_name || '',
        category: item.category_name || '',
        subCategory: item.sub_category_name || '',
        salePrice: item.sale_price ?? '',
        stock: item.stock ?? item.unit_qty ?? '',
        reorderLevel: item.reorder_level ?? '',
        unitName: item.unit_name || '',
        unitShortName: item.unit_short_name || '',
        status: item.status || '',
        imagePreview: resolveAssetUrl(item.image || ''),
      }));
      setItems(nextItems);
    } catch (requestError) {
      setListError(requestError.message || 'Failed to load item report.');
    } finally {
      setIsLoading(false);
    }
  }, [filters.itemType, filters.category, filters.subCategory, itemQuery, setupOptions]);

  useEffect(() => {
    loadSetupOptions();
  }, [loadSetupOptions]);

  useEffect(() => {
    if (!isLoading || items.length === 0) {
      loadItems();
    }
  }, [loadItems]);

  const itemOptions = useMemo(
    () => items.map((item) => ({ id: item.id, name: item.itemName, code: item.code })),
    [items],
  );

  const selectedItemOption = useMemo(
    () => itemOptions.find((item) => String(item.id) === String(filters.itemId)) || null,
    [filters.itemId, itemOptions],
  );

  const selectedCategoryOption = useMemo(
    () => setupOptions.categories.find((item) => item.name === filters.category) || null,
    [filters.category, setupOptions.categories],
  );

  const subCategoryOptions = useMemo(
    () =>
      setupOptions.subCategories.filter((item) => {
        if (!selectedCategoryOption) return true;
        return item.categoryId === selectedCategoryOption.id || item.categoryName === selectedCategoryOption.name;
      }),
    [selectedCategoryOption, setupOptions.subCategories],
  );

  const itemSuggestions = useMemo(() => {
    const normalizedQuery = itemQuery.trim().toLowerCase();
    if (!normalizedQuery) return itemOptions.slice(0, 8);
    return itemOptions
      .filter((item) => {
        const searchableText = `${item.code} ${item.name}`.toLowerCase();
        return searchableText.includes(normalizedQuery);
      })
      .slice(0, 8);
  }, [itemOptions, itemQuery]);

  useEffect(() => {
    if (selectedItemOption) {
      setItemQuery(selectedItemOption.code || selectedItemOption.name || '');
      return;
    }
    setItemQuery('');
  }, [selectedItemOption]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!itemFieldRef.current?.contains(event.target)) {
        setIsItemSuggestionsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));

  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return items.slice(startIndex, startIndex + pageSize);
  }, [currentPage, items, pageSize]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters.itemType, filters.category, filters.subCategory, itemQuery]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Item Report</h1>
        <p className="mt-1 text-gray-500">View item stock report using filters. Values are read-only.</p>
      </div>

      <Card className="border-none p-0 shadow-xl shadow-gray-200/50">
        <div className="border-b border-gray-50 p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-light text-brand">
              <SlidersHorizontal className="h-4.5 w-4.5" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-gray-900">Filters</h2>
              <p className="text-sm text-gray-500">Narrow the item list using the filters below.</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <FilterSelect
              label="Type"
              value={filters.itemType}
              placeholder="Select Type"
              options={setupOptions.itemTypes}
              onChange={(value) => setFilters((prev) => ({ ...prev, itemType: value }))}
            />
            <FilterSelect
              label="Category"
              value={filters.category}
              placeholder="Select Category"
              options={setupOptions.categories}
              onChange={(value) =>
                setFilters((prev) => ({ ...prev, category: value, subCategory: '' }))
              }
            />
            <FilterSelect
              label="Sub Category"
              value={filters.subCategory}
              placeholder="Select Sub Category"
              options={subCategoryOptions}
              onChange={(value) => setFilters((prev) => ({ ...prev, subCategory: value }))}
            />
          </div>

          <div className="mt-4">
            <label className="block w-full max-w-[320px] space-y-2">
              <span className="ml-0.5 text-[11px] font-bold uppercase tracking-[0.14em] text-gray-500">Item</span>
              <div className="relative" ref={itemFieldRef}>
                <input
                  type="text"
                  value={itemQuery}
                  onChange={(event) => {
                    const nextValue = event.target.value;
                    setItemQuery(nextValue);
                    setIsItemSuggestionsOpen(true);
                    setFilters((prev) => ({ ...prev, itemId: '' }));
                  }}
                  onFocus={() => setIsItemSuggestionsOpen(true)}
                  placeholder="Write item code or name"
                  className="h-11 w-full rounded-2xl border border-gray-100 bg-gray-50/50 px-4 text-sm text-gray-900 placeholder:text-gray-400 transition-all focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10"
                />
                {isItemSuggestionsOpen ? (
                  <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl shadow-gray-200/60">
                    <div className="max-h-56 overflow-y-auto p-2">
                      {itemSuggestions.length ? (
                        itemSuggestions.map((option) => (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => {
                              setFilters((prev) => ({ ...prev, itemId: option.id }));
                              setItemQuery(option.code || option.name || '');
                              setIsItemSuggestionsOpen(false);
                            }}
                            className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm text-gray-700 transition-all hover:bg-gray-50 hover:text-gray-900"
                          >
                            <span className="font-medium">{option.code}</span>
                            <span className="ml-3 text-xs text-gray-400">{option.name}</span>
                          </button>
                        ))
                      ) : (
                        <div className="px-3 py-4 text-sm text-gray-400">No matching items found.</div>
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
            </label>
          </div>

          {setupError ? (
            <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
              {setupError}
            </div>
          ) : null}
        </div>

        {listError ? (
          <div className="mx-6 mt-6 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            {listError}
          </div>
        ) : null}

        <div className="px-6 pb-6 pt-5">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-light text-brand">
              <TableProperties className="h-4.5 w-4.5" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-gray-900">Item Report Table</h2>
              <p className="text-sm text-gray-500">Read-only view of item stock, sale price, unit and reorder level.</p>
            </div>
          </div>

          <div className="w-full overflow-hidden rounded-4xl border border-gray-100 bg-white/80 shadow-2xl shadow-gray-200/30 backdrop-blur-xl">
            <div className="overflow-x-auto">
              <table className="w-full min-w-225 border-separate border-spacing-0 text-left">
                <thead>
                  <tr className="bg-linear-to-r from-gray-50/80 via-gray-50/40 to-transparent">
                    <th className="border-b border-gray-100/60 px-6 py-6 text-[10px] font-black uppercase tracking-[0.25em] text-gray-400 first:rounded-tl-4xl">
                      Sr
                    </th>
                    <th className="border-b border-gray-100/60 px-6 py-6 text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">
                      Code
                    </th>
                    <th className="border-b border-gray-100/60 px-6 py-6 text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">
                      Type
                    </th>
                    <th className="border-b border-gray-100/60 px-6 py-6 text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">
                      Category
                    </th>
                    <th className="border-b border-gray-100/60 px-6 py-6 text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">
                      Sub Category
                    </th>
                    <th className="border-b border-gray-100/60 px-6 py-6 text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">
                      Item Name
                    </th>
                    <th className="border-b border-gray-100/60 px-6 py-6 text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">
                      Unit
                    </th>
                    <th className="border-b border-gray-100/60 px-6 py-6 text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">
                      Sale Price
                    </th>
                    <th className="border-b border-gray-100/60 px-6 py-6 text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">
                      Stock
                    </th>
                    <th className="border-b border-gray-100/60 px-6 py-6 text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">
                      Reorder Level
                    </th>
                   
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50/50">
                  {isLoading ? (
                    <tr>
                      <td colSpan={11} className="px-8 py-6 text-center">
                        <TableLoader label="Loading item report..." />
                      </td>
                    </tr>
                  ) : items.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="px-8 py-20 text-center text-sm font-medium text-gray-400">
                        No items found.
                      </td>
                    </tr>
                  ) : (
                    paginatedItems.map((item, index) => (
                      <tr key={item.id} className="group transition-all duration-300 hover:bg-brand-light/40">
                        <td className="border-b border-gray-50/30 px-6 py-5 text-sm font-semibold text-gray-500">
                          {(currentPage - 1) * pageSize + index + 1}
                        </td>
                        <td className="border-b border-gray-50/30 px-6 py-5 text-sm font-bold text-gray-500 whitespace-nowrap">
                          <span className="font-mono whitespace-nowrap">{formatNumber(item.code)}</span>
                        </td>
                        <td className="border-b border-gray-50/30 px-6 py-5 text-sm font-semibold text-gray-700 whitespace-nowrap">
                          {formatNumber(item.itemType)}
                        </td>
                        <td className="border-b border-gray-50/30 px-6 py-5 text-sm font-semibold text-gray-700 whitespace-nowrap">
                          {formatNumber(item.category)}
                        </td>
                        <td className="border-b border-gray-50/30 px-6 py-5 text-sm font-semibold text-gray-700 whitespace-nowrap">
                          {formatNumber(item.subCategory)}
                        </td>
                        <td className="border-b border-gray-50/30 px-6 py-5">
                          <div className="flex items-center gap-3 whitespace-nowrap">
                            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-brand-light text-brand">
                              {item.imagePreview ? (
                                <img src={item.imagePreview} alt={item.itemName || 'Item'} className="h-full w-full object-cover" />
                              ) : (
                                <Package className="h-4 w-4" />
                              )}
                            </div>
                            <span className="text-sm font-semibold text-gray-900 whitespace-nowrap">{formatNumber(item.itemName)}</span>
                          </div>
                        </td>
                        <td className="border-b border-gray-50/30 px-6 py-5 text-sm font-semibold text-gray-700 whitespace-nowrap">
                          {item.unitShortName ? (
                            <span title={item.unitName}>{item.unitShortName}</span>
                          ) : (
                            formatNumber(item.unitName)
                          )}
                        </td>
                        <td className="border-b border-gray-50/30 px-6 py-5 text-sm font-semibold text-gray-700">
                          {formatNumber(item.salePrice)}
                        </td>
                        <td className="border-b border-gray-50/30 px-6 py-5 text-sm font-semibold text-gray-700">
                          {formatNumber(item.stock)}
                        </td>
                        <td className="border-b border-gray-50/30 px-6 py-5 text-sm font-semibold text-gray-700">
                          {formatNumber(item.reorderLevel)}
                        </td>
                       
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {items.length > 10 ? (
            <TablePagination
              currentPage={currentPage}
              pageSize={pageSize}
              totalItems={items.length}
              onPageChange={setCurrentPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setCurrentPage(1);
              }}
              itemLabel="items"
            />
          ) : null}
        </div>
      </Card>
    </div>
  );
}
